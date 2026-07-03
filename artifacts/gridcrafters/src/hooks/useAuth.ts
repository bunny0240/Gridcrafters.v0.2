import { useState, useEffect, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { updateStreak } from '@/lib/db'
import { initGameState } from '@/hooks/useGameState'

export interface Profile {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url: string | null
  total_xp: number
  level: number
  streak_count: number
  max_streak: number
  last_active: string | null
  created_at: string
}

export function useAuth() {
  const [user, setUser]         = useState<User | null>(null)
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [session, setSession]   = useState<Session | null>(null)
  const [loading, setLoading]   = useState(true)
  const [rank, setRank]         = useState<number | null>(null)
  const [levelUpNum, setLevelUpNum] = useState<number | null>(null)
  const prevLevelRef = useRef<number | null>(null)

  // currentXP is the in-memory value — always more up-to-date than the DB view
  // (XP is applied optimistically before the DB write completes).
  const fetchRank = async (currentXP: number) => {
    const { count } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', currentXP)
    if (count !== null) setRank(count + 1)
  }

  const loadProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', userId).single()

    if (!profileData) return

    setProfile(prev => {
      const dbXP  = (profileData as Profile).total_xp ?? 0
      // Never go below the current in-memory value (protects optimistic updates)
      const xp    = Math.max(prev?.total_xp ?? 0, dbXP)
      const level = xp >= 5000 ? 4 : xp >= 2000 ? 3 : xp >= 500 ? 2 : 1
      return { ...(profileData as Profile), total_xp: xp, level }
    })
  }

  // Supabase Realtime — live profile updates across all surfaces simultaneously
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`profile-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => { setProfile(payload.new as Profile) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const applyStreakResult = (
    data: { streak: number; max_streak: number; updated: boolean } | null
  ) => {
    if (!data?.updated) return
    setProfile(prev =>
      prev ? { ...prev, streak_count: data.streak, max_streak: data.max_streak } : prev
    )
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        initGameState(session.user.id)
        loadProfile(session.user.id)
        updateStreak(session.user.id).then(applyStreakResult).catch(() => {})
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          initGameState(session.user.id)
          await loadProfile(session.user.id)
          updateStreak(session.user.id).then(applyStreakResult).catch(() => {})
        } else {
          initGameState(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username } },
    })
    const needsConfirmation = !error && !data.session
    return { error, needsConfirmation }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Refetch rank whenever own XP changes — pass in-memory XP so we never wait
  // for the DB write to land before updating the displayed rank.
  useEffect(() => {
    if (!user?.id || profile?.total_xp === undefined) return
    fetchRank(profile.total_xp)
  }, [user?.id, profile?.total_xp])

  // Global realtime: any profile UPDATE → recalculate rank using current in-memory XP
  useEffect(() => {
    if (!user?.id) return
    const ch = supabase.channel('global-xp-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => { fetchRank(profile?.total_xp ?? 0) }
      ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user?.id, profile?.total_xp])

  // Level-up detection — fires when profile.level increases
  useEffect(() => {
    if (!profile) return
    if (prevLevelRef.current !== null && profile.level > prevLevelRef.current) {
      setLevelUpNum(profile.level)
    }
    prevLevelRef.current = profile.level
  }, [profile?.level])

  const dismissLevelUp = () => setLevelUpNum(null)

  const refreshProfile = () => {
    if (user) loadProfile(user.id)
  }

  // Optimistic in-memory XP increment — updates UI instantly without a DB round-trip.
  // The DB write in awardXP() still happens in the background for persistence.
  const addXP = (amount: number) => {
    if (amount <= 0) return
    setProfile(prev => {
      if (!prev) return prev
      const newXP    = prev.total_xp + amount
      const newLevel = newXP >= 5000 ? 4 : newXP >= 2000 ? 3 : newXP >= 500 ? 2 : 1
      return { ...prev, total_xp: newXP, level: newLevel }
    })
  }

  return { user, profile, session, loading, signUp, signIn, signOut, refreshProfile, addXP, rank, levelUpNum, dismissLevelUp }
}

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}
