import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? ''
const supabaseUrl = rawUrl.replace(/\/(rest\/v1|auth\/v1|storage\/v1)\/?$/, '').replace(/\/$/, '')
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    storageKey:         'gridcrafters-auth',
  },
  realtime: {
    params: { eventsPerSecond: 2 }
  },
  global: {
    headers: { 'x-app-name': 'gridcrafters' }
  }
})

// Dev-only: verify connection on startup
if (import.meta.env.DEV) {
  supabase.from('profiles').select('count').limit(1)
    .then(({ error }) => {
      if (error) console.error('[GridCrafters] Supabase connection failed:', error.message)
      else console.log('[GridCrafters] Supabase connected ✓')
    })
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          email: string
          avatar_url: string | null
          total_xp: number
          level: number
          streak_count: number
          last_active: string | null
          created_at: string
          updated_at: string
        }
      }
      shortcut_progress: {
        Row: {
          id: string
          user_id: string
          shortcut_id: string
          level_name: string
          status: 'locked' | 'studied' | 'completed' | 'review'
          attempts: number
          best_xp: number
          hints_used: number
          completed_at: string | null
        }
      }
      formatting_progress: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          level_name: string
          status: 'locked' | 'studied' | 'completed'
          best_score: number
          best_xp: number
          attempts: number
          hints_used: number
          completed_at: string | null
        }
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          module: 'shortcuts' | 'formatting'
          level_name: string
          challenge_id: string
          challenge_title: string
          action: 'started' | 'completed' | 'failed' | 'retried' | 'skipped' | 'studied'
          xp_earned: number
          score: number | null
          hints_used: number
          time_taken_sec: number | null
          combo_at_time: number
          created_at: string
        }
      }
      level_completion: {
        Row: {
          id: string
          user_id: string
          module: string
          level_name: string
          completed_at: string
          stars: number
          total_xp: number
          attempts: number
          best_score: number
        }
      }
      xp_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          source: string
          source_id: string | null
          module: string
          idempotency_key: string | null
          created_at: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
      }
      last_challenge: {
        Row: {
          user_id: string
          module: string
          challenge_id: string
          challenge_title: string
          level_name: string
          tasks_completed: number
          total_tasks: number
          xp_reward: number
          last_seen: string
        }
      }
    }
  }
}
