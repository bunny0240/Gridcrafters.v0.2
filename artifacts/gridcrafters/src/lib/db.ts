import { supabase } from './supabase'

// ── Retry helper ─────────────────────────────────────────────────────────────
// fn must throw on failure — Supabase callers should `if (error) throw error`
async function withRetry(fn: () => Promise<void>, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try { return await fn() }
    catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, i)))
    }
  }
}

// ── Idempotency key ──────────────────────────────────────────────────────────
export function generateIdempotencyKey(
  userId: string, challengeId: string, action: string
): string {
  return `${userId}_${challengeId}_${action}_${Date.now()}`
}

// ── Streak ───────────────────────────────────────────────────────────────────
export async function updateStreak(
  userId: string
): Promise<{ streak: number; max_streak: number; updated: boolean } | null> {
  try {
    const { data, error } = await supabase.rpc('update_streak', { p_user_id: userId })
    if (error) throw error
    return data as { streak: number; max_streak: number; updated: boolean }
  } catch (err) {
    console.error('[updateStreak]', err)
    return null
  }
}

// ── Activity log ─────────────────────────────────────────────────────────────
export async function logActivity(params: {
  userId: string
  module: 'shortcuts' | 'formatting'
  levelName: string
  challengeId: string
  challengeTitle: string
  action: 'started' | 'completed' | 'failed' | 'retried' | 'skipped' | 'studied'
  xpEarned?: number
  score?: number
  hintsUsed?: number
  timeTakenSec?: number
  comboAtTime?: number
}) {
  try {
    await withRetry(async () => {
      const { error } = await supabase.from('activity_log').insert({
        user_id:         params.userId,
        module:          params.module,
        level_name:      params.levelName,
        challenge_id:    params.challengeId,
        challenge_title: params.challengeTitle,
        action:          params.action,
        xp_earned:       params.xpEarned ?? 0,
        score:           params.score ?? null,
        hints_used:      params.hintsUsed ?? 0,
        time_taken_sec:  params.timeTakenSec ?? null,
        combo_at_time:   params.comboAtTime ?? 0,
      })
      if (error) throw error
    })
  } catch (err) {
    console.error('[logActivity]', err)
    // Do not rethrow — activity log failure should not crash the app
  }
}

// ── Award XP ─────────────────────────────────────────────────────────────────
// Inserts an xp_transaction AND directly increments profiles.total_xp + level.
// This keeps the profile row always in sync without relying on a DB trigger,
// and ensures the Realtime subscription fires so the sidebar updates live.
export async function awardXP(params: {
  userId: string
  amount: number
  source: string
  sourceId?: string
  module: string
  idempotencyKey?: string
}) {
  if (params.amount <= 0) return
  try {
    await withRetry(async () => {
      // 1. Log the XP transaction record
      const { error: txErr } = await supabase.from('xp_transactions').insert({
        user_id:         params.userId,
        amount:          params.amount,
        source:          params.source,
        source_id:       params.sourceId ?? null,
        module:          params.module,
        idempotency_key: params.idempotencyKey ?? null,
      })
      if (txErr) throw txErr

      // 2. Increment profile via RPC (SECURITY DEFINER — bypasses RLS).
      //    Falls back to a direct UPDATE if the RPC hasn't been created yet.
      const { error: rpcErr } = await supabase.rpc('increment_profile_xp', {
        p_user_id: params.userId,
        p_amount:  params.amount,
      })
      if (rpcErr) {
        // Fallback: direct UPDATE (may be silently blocked by RLS, but worth trying)
        const { data: prof } = await supabase
          .from('profiles').select('total_xp').eq('id', params.userId).single()
        const newXP    = (prof?.total_xp ?? 0) + params.amount
        const newLevel = newXP >= 5000 ? 4 : newXP >= 2000 ? 3 : newXP >= 500 ? 2 : 1
        await supabase
          .from('profiles')
          .update({ total_xp: newXP, level: newLevel, updated_at: new Date().toISOString() })
          .eq('id', params.userId)
      }
    })
  } catch (err) {
    console.error('[awardXP]', err)
    // Do not rethrow — XP failure should not crash the app
  }
}

// ── Complete challenge (with replay delta XP + 80% floor) ────────────────────
export async function completeChallenge(params: {
  userId: string
  module: 'shortcuts' | 'formatting'
  levelName: string
  challengeId: string
  challengeTitle: string
  xpEarned: number
  baseXP?: number        // Optional: enforces 80% XP floor
  score?: number
  hintsUsed: number
  timeTakenSec: number
  combo: number
  bestXP?: number
}) {
  const idField     = params.module === 'shortcuts' ? 'shortcut_id' : 'challenge_id'
  const table       = params.module === 'shortcuts' ? 'shortcut_progress' : 'formatting_progress'
  const conflictCol = params.module === 'shortcuts' ? 'user_id,shortcut_id' : 'user_id,challenge_id'

  // Enforce 80% XP floor if baseXP provided
  const floor = params.baseXP ? Math.round(params.baseXP * 0.8) : 0
  const newXP = Math.max(floor, params.xpEarned)

  // Replay detection — only award delta XP when replaying
  let awardAmount = newXP
  let newBestXP   = newXP

  try {
    const { data: existing } = await supabase
      .from(table)
      .select('status, best_xp')
      .eq('user_id', params.userId)
      .eq(idField, params.challengeId)
      .single()

    if (existing?.status === 'completed') {
      const existingBest = (existing.best_xp as number) ?? 0
      newBestXP = Math.max(existingBest, newXP)
      if (newXP <= existingBest) {
        awardAmount = 0            // No improvement — skip XP award
      } else {
        awardAmount = newXP - existingBest  // Delta only
      }
    }
  } catch {
    // No existing row — first completion, award full XP
  }

  // Upsert progress row
  try {
    await withRetry(async () => {
      const { error } = await supabase.from(table).upsert({
        user_id:      params.userId,
        [idField]:    params.challengeId,
        level_name:   params.levelName,
        status:       'completed',
        best_xp:      newBestXP,
        hints_used:   params.hintsUsed,
        completed_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      }, { onConflict: conflictCol })
      if (error) throw error
    })
  } catch (err) {
    console.error('[completeChallenge] upsert', err)
  }

  // Log activity (records actual awarded amount)
  await logActivity({
    userId:         params.userId,
    module:         params.module,
    levelName:      params.levelName,
    challengeId:    params.challengeId,
    challengeTitle: params.challengeTitle,
    action:         'completed',
    xpEarned:       awardAmount,
    score:          params.score,
    hintsUsed:      params.hintsUsed,
    timeTakenSec:   params.timeTakenSec,
    comboAtTime:    params.combo,
  })

  // Award XP — skipped if no improvement on replay
  if (awardAmount > 0) {
    const key = generateIdempotencyKey(params.userId, params.challengeId, 'complete')
    await awardXP({
      userId:         params.userId,
      amount:         awardAmount,
      source:         params.challengeTitle,
      sourceId:       params.challengeId,
      module:         params.module,
      idempotencyKey: key,
    })
  }

  // Update last_challenge
  try {
    await withRetry(async () => {
      const { error } = await supabase.from('last_challenge').upsert({
        user_id:         params.userId,
        module:          params.module,
        challenge_id:    params.challengeId,
        challenge_title: params.challengeTitle,
        level_name:      params.levelName,
        xp_reward:       awardAmount,
        last_seen:       new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (error) throw error
    })
  } catch (err) {
    console.error('[completeChallenge] last_challenge', err)
  }
}

// ── Check level completion ────────────────────────────────────────────────────
// Check if the user has earned the Shortcut Master badge (all 3 levels done).
// Returns true if the badge was freshly awarded this call.
export async function checkShortcutMasterBadge(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('level_completion')
      .select('level_name')
      .eq('user_id', userId)
      .eq('module', 'shortcuts')

    const completed = new Set((data ?? []).map(r => (r.level_name as string).toLowerCase()))
    const allDone   = ['rookie', 'intermediate', 'advanced', 'expert'].every(l => completed.has(l))
    if (!allDone) return false

    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', 'shortcut_master')
      .maybeSingle()

    if (existing) return false

    await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'shortcut_master' })
    return true
  } catch (err) {
    console.error('[checkShortcutMasterBadge]', err)
    return false
  }
}

export async function checkLevelCompletion(params: {
  userId: string
  module: 'shortcuts' | 'formatting'
  levelName: string
  totalInLevel: number
  hintsUsed: number
  retries: number
}): Promise<{ levelComplete: boolean; badgeEarned: string | null }> {
  const table = params.module === 'shortcuts' ? 'shortcut_progress' : 'formatting_progress'

  try {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', params.userId)
      .eq('level_name', params.levelName)
      .eq('status', 'completed')

    if ((count ?? 0) < params.totalInLevel) return { levelComplete: false, badgeEarned: null }

    const stars = params.hintsUsed === 0 && params.retries === 0 ? 3
      : params.hintsUsed <= 3 && params.retries <= 1 ? 2 : 1

    const bonusXP: Record<string, number> = {
      rookie: 100, intermediate: 200, advanced: 300, expert: 500
    }
    const bonus = bonusXP[params.levelName.toLowerCase()] ?? 100

    await supabase.from('level_completion').upsert({
      user_id:    params.userId,
      module:     params.module,
      level_name: params.levelName,
      stars,
      total_xp:   bonus,
    }, { onConflict: 'user_id,module,level_name' })

    const key = generateIdempotencyKey(params.userId, `${params.module}_${params.levelName}`, 'level_complete')
    await awardXP({
      userId:         params.userId,
      amount:         bonus,
      source:         `${params.levelName} level complete`,
      sourceId:       `${params.module}_${params.levelName}`,
      module:         'level_complete',
      idempotencyKey: key,
    })

    let badgeEarned: string | null = null
    if (params.module === 'shortcuts') {
      const earned = await checkShortcutMasterBadge(params.userId)
      if (earned) badgeEarned = 'shortcut_master'
    }

    return { levelComplete: true, badgeEarned }
  } catch (err) {
    console.error('[checkLevelCompletion]', err)
    return { levelComplete: false, badgeEarned: null }
  }
}

// ── Fetch user progress ───────────────────────────────────────────────────────
export async function fetchUserProgress(userId: string) {
  try {
    const [
      { data: profile },
      { data: shortcuts },
      { data: formatting },
      { data: levelsDone },
      { data: badges },
      { data: lastChallenge },
      { data: activity },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('shortcut_progress').select('*').eq('user_id', userId),
      supabase.from('formatting_progress').select('*').eq('user_id', userId),
      supabase.from('level_completion').select('*').eq('user_id', userId),
      supabase.from('user_badges').select('*, badges(*)').eq('user_id', userId),
      supabase.from('last_challenge').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('activity_log')
        .select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(20),
    ])
    return { profile, shortcuts, formatting, levelsDone, badges, lastChallenge, activity }
  } catch (err) {
    console.error('[fetchUserProgress]', err)
    return { profile: null, shortcuts: null, formatting: null, levelsDone: null, badges: null, lastChallenge: null, activity: null }
  }
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export async function fetchLeaderboard() {
  try {
    const { data, error } = await supabase.from('leaderboard').select('*').limit(20)
    if (error) throw error
    return data
  } catch (err) {
    console.error('[fetchLeaderboard]', err)
    return null
  }
}

// ── Mark level studied ────────────────────────────────────────────────────────
export async function markLevelStudied(params: {
  userId: string
  module: 'shortcuts' | 'formatting'
  levelName: string
  challengeIds: string[]
}) {
  const table    = params.module === 'shortcuts' ? 'shortcut_progress' : 'formatting_progress'
  const idField  = params.module === 'shortcuts' ? 'shortcut_id' : 'challenge_id'
  const conflict = params.module === 'shortcuts' ? 'user_id,shortcut_id' : 'user_id,challenge_id'

  try {
    await Promise.all(params.challengeIds.map(id =>
      supabase.from(table).upsert({
        user_id:    params.userId,
        [idField]:  id,
        level_name: params.levelName,
        status:     'studied',
        updated_at: new Date().toISOString(),
      }, { onConflict: conflict })
    ))
  } catch (err) {
    console.error('[markLevelStudied]', err)
  }
}
