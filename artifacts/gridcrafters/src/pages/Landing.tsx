import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { useAuthContext } from '@/contexts/useAuthContext'
import { BrandMark } from '@/components/ui/BrandMark'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Keyboard, Grid, Trophy } from 'lucide-react'

type Tab = 'signin' | 'signup'

function InputField({
  label, type = 'text', value, onChange, error, placeholder,
}: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; error?: string; placeholder?: string
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: 'Geist, sans-serif',
        fontSize: 11, fontWeight: 500, color: '#a8a49a', marginBottom: 5,
      }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#1c1c1a', border: `1px solid ${error ? '#ef4444' : '#2a2a26'}`,
          borderRadius: 7, padding: '10px 14px',
          fontFamily: 'Geist, sans-serif', fontSize: 13, color: '#e8e6e0',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={e => {
          e.target.style.borderColor = error ? '#ef4444' : '#8b5cf6'
          e.target.style.boxShadow   = `0 0 0 2px ${error ? 'rgba(239,68,68,0.12)' : 'rgba(139,92,246,0.12)'}`
        }}
        onBlur={e => {
          e.target.style.borderColor = error ? '#ef4444' : '#2a2a26'
          e.target.style.boxShadow   = 'none'
        }}
      />
      {error && (
        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>
      )}
    </div>
  )
}

const WELCOME_DURATION = 4000

export default function Landing() {
  const [tab, setTab]           = useState<Tab>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [apiError, setApiError]       = useState('')
  const [successMsg, setSuccessMsg]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomePct, setWelcomePct]   = useState(0)
  const [, setLocation]         = useLocation()
  const { signIn, signUp }      = useAuthContext()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Detect email confirmation redirect (Supabase appends #access_token=... to the URL)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token') || hash.includes('type=signup')) {
      window.history.replaceState({}, '', window.location.pathname)
      setShowWelcome(true)
      const start = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - start) / WELCOME_DURATION
        const pct = Math.min(elapsed * 100, 100)
        setWelcomePct(pct)
        if (elapsed >= 1) {
          clearInterval(timerRef.current!)
          setLocation('/dashboard')
        }
      }, 40)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (tab === 'signup' && !fullName.trim()) e.fullName = 'Full name is required'
    if (!email.trim() || !email.includes('@')) e.email = 'Valid email required'
    if (password.length < 8) e.password = 'Password must be at least 8 characters'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setApiError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (tab === 'signup') {
        const { error, needsConfirmation } = await signUp(email, password, fullName)
        if (error) {
          setApiError((error as { message?: string }).message ?? 'Sign up failed')
        } else if (needsConfirmation) {
          setSuccessMsg('Account created! Check your email and click the confirmation link to sign in.')
        } else {
          setLocation('/dashboard')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          const msg = (error as { message?: string }).message ?? 'Sign in failed'
          setApiError(msg === 'Email not confirmed'
            ? 'Please confirm your email first — check your inbox for a confirmation link.'
            : msg)
        } else {
          setLocation('/dashboard')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Keyboard, label: 'Master 53 Excel shortcuts through live challenges' },
    { icon: Grid,     label: 'Real formatting practice in a live Excel simulator' },
    { icon: Trophy,   label: 'Earn XP, badges, and climb the leaderboard' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex" style={{ fontFamily: 'Geist, sans-serif' }}>

      {/* ── Welcome overlay (shown after email confirmation) ── */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: '#111110',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '0 24px',
            }}
          >
            {/* Logo */}
            <div style={{ marginBottom: 32 }}>
              <BrandMark variant="full" />
            </div>

            {/* Message */}
            <h2 style={{
              fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 600,
              color: '#f0ede6', letterSpacing: '-0.3px', margin: '0 0 10px',
              textAlign: 'center',
            }}>
              Your account is confirmed.
            </h2>
            <p style={{
              fontFamily: 'Geist, sans-serif', fontSize: 15, color: '#c4bfb4',
              lineHeight: 1.6, margin: '0 0 40px', textAlign: 'center', maxWidth: 400,
            }}>
              Now you can craft your Excel skills on GridCrafters.
            </p>

            {/* Progress bar */}
            <div style={{
              width: '100%', maxWidth: 320, height: 3,
              background: '#242420', borderRadius: 999, overflow: 'hidden',
              marginBottom: 28,
            }}>
              <motion.div
                style={{
                  height: '100%', borderRadius: 999,
                  background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                  width: `${welcomePct}%`,
                }}
              />
            </div>

            {/* CTA button */}
            <button
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                setLocation('/dashboard')
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontFamily: 'Geist, sans-serif', fontSize: 14, fontWeight: 600,
                padding: '12px 28px', borderRadius: 8, letterSpacing: '-0.1px',
              }}
            >
              Start Crafting →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-14">
        <BrandMark variant="full" />

        <div>
          <h1 className="text-[42px] font-[700] leading-[1.1] tracking-[-1px] text-[#e8e6e0] mb-4">
            Become an<br />
            <span style={{
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Excel power user</span><br />
            in 30 days.
          </h1>
          <p className="text-[15px] text-[#5a5750] leading-relaxed max-w-[400px]">
            GridCrafters teaches real keyboard shortcuts and formatting through hands-on, gamified challenges — no clicking allowed.
          </p>

          <div className="mt-10 space-y-4">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Icon className="w-4 h-4" style={{ color: '#a78bfa' }} />
                </div>
                <span className="text-[13px] text-[#a8a49a]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#3a3834]">
          Built by Hyatt · GridCrafters {new Date().getFullYear()}
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 lg:max-w-[480px] items-center justify-center p-6">

        {/* Mobile brand */}
        <div className="lg:hidden absolute top-6 left-6">
          <BrandMark variant="full" />
        </div>

        {/* Auth card */}
        <div style={{
          background: '#161614', border: '1px solid #2a2a26', borderRadius: 12,
          padding: '28px 32px', width: '100%', maxWidth: 380,
        }}>
          {/* Tabs */}
          <div className="flex gap-0 mb-6 border-b border-[#2a2a26]">
            {(['signin', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); setApiError('') }}
                className="pb-3 mr-6 text-[13px] transition-all"
                style={{
                  fontFamily: 'Geist, sans-serif',
                  fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? '#e8e6e0' : '#5a5750',
                  borderBottom: tab === t ? '2px solid #8b5cf6' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {tab === 'signup' && (
                  <InputField
                    label="Full Name"
                    value={fullName}
                    onChange={setFullName}
                    error={errors.fullName}
                    placeholder="Hyatt Khan"
                  />
                )}
                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                  placeholder="you@example.com"
                />
                <InputField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  error={errors.password}
                  placeholder="Min. 8 characters"
                />

                {apiError && (
                  <div style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 7, padding: '10px 12px',
                    fontSize: 12, color: '#ef4444', fontFamily: 'Geist, sans-serif',
                  }}>{apiError}</div>
                )}

                {successMsg && (
                  <div style={{
                    background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)',
                    borderRadius: 7, padding: '10px 12px',
                    fontSize: 12, color: '#4CAF50', fontFamily: 'Geist, sans-serif',
                  }}>{successMsg}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-[11px] rounded-[7px] text-[13px] font-[600] text-white transition-all"
                  style={{
                    fontFamily: 'Geist, sans-serif',
                    background: loading
                      ? '#2a2a26'
                      : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: 8,
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {tab === 'signup' ? 'Creating account…' : 'Signing in…'}
                    </span>
                  ) : (
                    tab === 'signup' ? 'Create Account' : 'Sign In'
                  )}
                </button>

                {tab === 'signin' && (
                  <p className="text-center text-[11px] text-[#3a3834] mt-2">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('signup')}
                      className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors"
                    >Sign up free</button>
                  </p>
                )}

                {tab === 'signup' && (
                  <p className="text-center text-[11px] text-[#3a3834] mt-2">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('signin')}
                      className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors"
                    >Sign in</button>
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </form>

          <div className="mt-6 pt-5 border-t border-[#1e1e1c]">
            <div className="flex items-center gap-2 justify-center">
              {[
                { icon: CheckCircle2, text: 'Free forever' },
                { icon: CheckCircle2, text: 'No credit card' },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1 text-[11px] text-[#3a3834]">
                  <Icon className="w-3 h-3 text-[#4CAF50]" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
