import { ReactNode, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuthContext } from '@/contexts/useAuthContext'
import { GridLogo } from '@/components/ui/GridLogo'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/')
    }
  }, [user, loading, setLocation])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <GridLogo size={40} />
          <div className="w-5 h-5 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
