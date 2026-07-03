interface GridLogoProps {
  size?: number
  className?: string
}

export function GridLogo({ size = 32, className = '' }: GridLogoProps) {
  const id = `grad-${Math.random().toString(36).slice(2, 7)}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GridCrafters logo mark"
      role="img"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx="9" fill="#161614" stroke="#2a2a26" strokeWidth="1" />

      <rect x="5" y="5" width="13" height="13" rx="2.5" fill={`url(#${id})`} />
      <rect x="22" y="5" width="13" height="13" rx="2.5" fill={`url(#${id})`} opacity="0.4" />
      <rect x="5" y="22" width="13" height="13" rx="2.5" fill={`url(#${id})`} opacity="0.4" />
      <rect x="22" y="22" width="13" height="13" rx="2.5" fill={`url(#${id})`} />

      <rect x="17.5" y="5" width="5" height="30" fill="#161614" />
      <rect x="5" y="17.5" width="30" height="5" fill="#161614" />

      <rect x="18.5" y="18.5" width="3" height="3" rx="0.5" fill={`url(#${id})`} />
    </svg>
  )
}
