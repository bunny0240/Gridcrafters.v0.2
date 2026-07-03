import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { useAuthContext } from '@/contexts/useAuthContext'
import { GridLogo } from '@/components/ui/GridLogo'
import { motion } from 'framer-motion'
import { CheckCircle2, ShieldCheck } from 'lucide-react'

export default function AuthConfirm() {
  const { user, loading } = useAuthContext()
  const [, setLocation] = useLocation()
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    if (!loading && user) {
      const t = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(t); setLocation('/dashboard'); return 0; }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
    return undefined;
  }, [user, loading, setLocation]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6"
      style={{ fontFamily: 'Geist, sans-serif' }}>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        <div className="flex justify-center mb-8">
          <GridLogo size={40} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-[#5a5750]">Verifying your email…</p>
          </div>
        ) : user ? (
          <div className="flex flex-col items-center gap-5">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 14 }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)' }}
            >
              <CheckCircle2 className="w-8 h-8 text-[#4CAF50]" />
            </motion.div>

            <div>
              <h1 className="text-[22px] font-[700] text-[#e8e6e0] tracking-[-0.5px] mb-2">
                Email Verified!
              </h1>
              <p className="text-[14px] text-[#a8a49a] leading-relaxed max-w-sm">
                Your email has been authenticated. Now you can use GridCrafters smoothly and safely.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-lg border border-[#1e1e1c] bg-[#111110]">
              <ShieldCheck className="w-4 h-4 text-[#8b5cf6]" />
              <span className="text-[12px] text-[#5a5750]">
                Redirecting to dashboard in <span className="text-[#a8a49a] font-[600]">{countdown}s</span>…
              </span>
            </div>

            <button
              onClick={() => setLocation('/dashboard')}
              className="mt-1 px-6 py-2.5 rounded-[8px] text-[13px] font-[600] text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}
            >
              Go to Dashboard now
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-[13px] text-[#5a5750]">
              Confirmation link may have expired.{' '}
              <button onClick={() => setLocation('/')} className="text-[#8b5cf6] hover:underline">
                Return to sign in
              </button>
            </p>
          </div>
        )}
      </motion.div>

      <p className="absolute bottom-6 text-[11px] text-[#3a3834]">
        Built by Hyatt · GridCrafters {new Date().getFullYear()}
      </p>
    </div>
  )
}
