import { createContext, useContext, ReactNode } from 'react'
import { useAuth, Profile } from '@/hooks/useAuth'
import { User, Session } from '@supabase/supabase-js'

export interface AuthContextValue {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: unknown; needsConfirmation?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  refreshProfile: () => void
  addXP: (amount: number) => void
  rank: number | null
  levelUpNum: number | null
  dismissLevelUp: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
