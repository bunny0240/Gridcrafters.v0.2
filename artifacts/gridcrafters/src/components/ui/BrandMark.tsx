import { GridLogo } from './GridLogo'

type BrandVariant = 'full' | 'compact' | 'topbar'

interface BrandMarkProps {
  variant?: BrandVariant
  className?: string
}

export function BrandMark({ variant = 'full', className = '' }: BrandMarkProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <GridLogo size={28} />
      </div>
    )
  }

  const logoSize = variant === 'topbar' ? 24 : 28
  const nameSize = variant === 'topbar' ? 'text-[14px]' : 'text-[15px]'
  const subSize  = variant === 'topbar' ? 'text-[8.5px]' : 'text-[9.5px]'

  return (
    <div className={`flex items-center gap-[10px] ${className}`}>
      <GridLogo size={logoSize} />
      <div className="flex flex-col leading-none">
        <span
          className={`${nameSize} font-bold tracking-[-0.4px] text-[#e8e6e0]`}
          style={{ fontFamily: 'Geist, -apple-system, sans-serif' }}
        >
          Grid
          <span
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Crafters
          </span>
        </span>
        <span
          className={`${subSize} font-normal tracking-[0.5px] uppercase mt-[3px]`}
          style={{ fontFamily: 'Geist, -apple-system, sans-serif', color: '#5a5750' }}
        >
          Made by Hyatt
        </span>
      </div>
    </div>
  )
}
