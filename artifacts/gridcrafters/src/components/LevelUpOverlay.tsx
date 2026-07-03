import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthContext } from '@/contexts/useAuthContext'

const LEVEL_NAMES: Record<number, string> = {
  1: 'Rookie',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Master',
  5: 'Elite',
  6: 'Legend',
}

export function LevelUpOverlay() {
  const { levelUpNum, dismissLevelUp } = useAuthContext()

  useEffect(() => {
    if (!levelUpNum) return
    const t = setTimeout(dismissLevelUp, 4500)
    return () => clearTimeout(t)
  }, [levelUpNum, dismissLevelUp])

  return (
    <AnimatePresence>
      {levelUpNum && (
        <motion.div
          key={levelUpNum}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={dismissLevelUp}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(6px)',
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif',
          }}
        >
          <motion.div
            initial={{ scale: 0.82, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(#141411, #141411) padding-box, linear-gradient(135deg, #8b5cf6, #3b82f6, #00B4D8) border-box',
              border: '1.5px solid transparent',
              borderRadius: 18,
              padding: '44px 64px',
              textAlign: 'center',
              minWidth: 280,
            }}
          >
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '3px', color: '#8b5cf6', marginBottom: 12,
            }}>
              Level Up
            </div>

            <div style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 68, fontWeight: 700, lineHeight: 1,
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {levelUpNum}
            </div>

            <div style={{
              fontSize: 24, fontWeight: 600, color: '#f0ede6',
              marginTop: 8, marginBottom: 20, letterSpacing: '-0.3px',
            }}>
              {LEVEL_NAMES[levelUpNum] ?? 'Expert'}
            </div>

            <div style={{
              height: 1, background: 'linear-gradient(90deg, transparent, #3d3d38, transparent)',
              marginBottom: 16,
            }} />

            <div style={{ fontSize: 11, color: '#4a4a45' }}>
              Tap anywhere to continue
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
