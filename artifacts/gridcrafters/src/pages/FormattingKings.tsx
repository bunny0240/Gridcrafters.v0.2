import { useLocation } from 'wouter'

export default function FormattingKings() {
  const [, setLocation] = useLocation()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '70vh', padding: '40px 20px', textAlign: 'center',
      fontFamily: 'Geist, sans-serif',
    }}>

      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: 16,
        background: 'rgba(59,130,246,0.1)',
        border: '1px solid rgba(59,130,246,0.2)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 32,
        marginBottom: 24,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(59,130,246,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: 28, fontWeight: 700, color: '#f0ede6',
        letterSpacing: '-0.5px', margin: '0 0 12px',
      }}>Formatting Kings</h1>

      {/* Subtitle */}
      <p style={{
        fontSize: 15, color: '#8a857a', lineHeight: 1.6,
        maxWidth: 460, margin: '0 0 32px',
      }}>
        Learn borders, colors, conditional formatting, and
        professional Excel design — using only keyboard shortcuts.
        Launching soon.
      </p>

      {/* Progress note */}
      <div style={{
        background: '#1a1a17', border: '1px solid #3d3d38',
        borderRadius: 10, padding: '16px 24px',
        marginBottom: 32, maxWidth: 400,
      }}>
        <p style={{
          fontSize: 13, color: '#8a857a', margin: 0, lineHeight: 1.6,
        }}>
          Your progress is being saved. Everything you complete
          in Shortcut Masters carries forward to your profile
          and leaderboard rank.
        </p>
      </div>

      {/* Feature preview list */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 10, maxWidth: 340, width: '100%', marginBottom: 36,
      }}>
        {[
          'Apply formatting with keyboard shortcuts only',
          'Match target spreadsheet format exactly',
          'Score based on formatting accuracy',
          'Earn the Formatting King badge',
        ].map(item => (
          <div key={item} style={{
            background: '#1a1a17', border: '1px solid #2c2c28',
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, color: '#c4bfb4', textAlign: 'left',
          }}>{item}</div>
        ))}
      </div>

      {/* Back to shortcuts */}
      <button
        onClick={() => setLocation('/shortcuts')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)',
          color: 'white', border: 'none', cursor: 'pointer',
          fontFamily: 'Geist, sans-serif', fontSize: 13, fontWeight: 600,
          padding: '10px 22px', borderRadius: 7,
        }}
      >← Continue Shortcut Masters</button>

    </div>
  )
}
