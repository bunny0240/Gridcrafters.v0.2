import { Link, useLocation } from "wouter";
import {
  LayoutGrid, Keyboard, Grid, BarChart3,
  Trophy, User,
} from "lucide-react";
import { useAuthContext } from "@/contexts/useAuthContext";
import { BrandMark } from "@/components/ui/BrandMark";

// ── XP level band helpers ─────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 6000, 12000];
const LEVEL_NAMES = ['', 'Rookie', 'Intermediate', 'Advanced', 'Master', 'Elite'];

/** Derive the 1-based level index from raw XP — never trust the stale DB field. */
function xpToLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 2; i >= 1; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

type Chip = 'soon' | 'live' | null;
type Accent = 'purple' | 'blue' | 'cyan' | null;

interface NavItemDef {
  href: string;
  label: string;
  icon: React.ElementType;
  chip?: Chip;
  accent: Accent;
}

const NAV_LEARN: NavItemDef[] = [
  { href: '/shortcuts',  label: 'Shortcut Masters', icon: Keyboard,  accent: 'purple' },
  { href: '/formatting', label: 'Formatting Kings',  icon: Grid,      accent: 'blue', chip: 'soon' },
  { href: '/analyst',    label: 'Real Analysts',     icon: BarChart3, accent: null, chip: 'soon' },
];

const NAV_COMMUNITY: NavItemDef[] = [
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, accent: null, chip: 'live' },
  { href: '/profile',     label: 'Profile',     icon: User,   accent: null },
];

function activeStyle(accent: Accent) {
  if (accent === 'purple') return 'border-l-[2px] border-[#8b5cf6] bg-gradient-to-r from-[rgba(139,92,246,0.10)] to-transparent text-[#c4b5fd]';
  if (accent === 'blue')   return 'border-l-[2px] border-[#3b82f6] bg-gradient-to-r from-[rgba(59,130,246,0.08)] to-transparent text-[#93c5fd]';
  return 'border-l-[2px] border-[#00B4D8] bg-gradient-to-r from-[rgba(0,180,216,0.08)] to-transparent text-[#00B4D8]';
}

export function Sidebar() {
  const [location] = useLocation();
  const { profile } = useAuthContext();

  const totalXP      = profile?.total_xp    ?? 0;
  const streak       = profile?.streak_count ?? 0;
  const maxStreak    = profile?.max_streak   ?? 0;
  const profileLevel = xpToLevel(totalXP);
  const floorXP    = LEVEL_THRESHOLDS[profileLevel - 1] ?? 0;
  const ceilXP     = LEVEL_THRESHOLDS[profileLevel]     ?? 12000;
  const pct        = Math.min(100, Math.round(((totalXP - floorXP) / (ceilXP - floorXP)) * 100));
  const levelName  = LEVEL_NAMES[profileLevel];
  const xpFmt      = totalXP.toLocaleString();

  const isActive = (href: string) =>
    location === href || (location === '/' && href === '/dashboard');

  function NavItem({ item }: { item: NavItemDef }) {
    const Icon   = item.icon;
    const active = item.chip !== 'soon' && isActive(item.href);

    return (
      <Link
        href={item.href}
        className={[
          'flex items-center gap-[10px] px-4 py-[8px] font-[400] transition-all duration-100',
          active
            ? activeStyle(item.accent)
            : 'border-l-[2px] border-transparent text-[#6b6b82] hover:text-[#c4bfb4] hover:bg-[#1c1c1a]',
        ].join(' ')}
        style={{ fontFamily: 'Geist, sans-serif', fontSize: 15 }}
      >
        <Icon className="w-[14px] h-[14px] shrink-0" />
        <span className="flex-1 leading-none">{item.label}</span>
        {item.chip === 'soon' && (
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: '#1c1c1a', color: '#5a5650', border: '1px solid #3d3d38' }}>
            soon
          </span>
        )}
        {item.chip === 'live' && !active && (
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
            live
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="w-[228px] flex-shrink-0 bg-[#161614] border-r border-[#2a2a26] flex flex-col h-full">

      {/* Brand */}
      <div className="px-4 py-[18px] border-b border-[#2a2a26]">
        <BrandMark variant="full" />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">

        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={[
            'flex items-center gap-[10px] px-4 py-[8px] font-[400] transition-all duration-100',
            isActive('/dashboard')
              ? 'border-l-[2px] border-[#00B4D8] bg-gradient-to-r from-[rgba(0,180,216,0.08)] to-transparent text-[#00B4D8]'
              : 'border-l-[2px] border-transparent text-[#6b6b82] hover:text-[#c4bfb4] hover:bg-[#1c1c1a]',
          ].join(' ')}
          style={{ fontFamily: 'Geist, sans-serif', fontSize: 15 }}
        >
          <LayoutGrid className="w-[14px] h-[14px] shrink-0" />
          <span className="flex-1 leading-none">Dashboard</span>
        </Link>

        {/* LEARN section */}
        <div style={{ padding: '16px 16px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#5a5650', fontFamily: 'Geist, sans-serif' }}>
          Learn
        </div>
        {NAV_LEARN.map(item => <NavItem key={item.href} item={item} />)}

        {/* COMMUNITY section */}
        <div style={{ padding: '16px 16px 4px', marginTop: 8, fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#5a5650', fontFamily: 'Geist, sans-serif' }}>
          Community
        </div>
        {NAV_COMMUNITY.map(item => <NavItem key={item.href} item={item} />)}

      </nav>

      {/* XP Card */}
      <div className="p-[10px]">
        <div style={{
          background: '#1a1a17',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 10,
          padding: '14px 15px',
          fontFamily: 'Geist, sans-serif',
        }}>
          {/* Top row */}
          <div className="flex justify-between items-baseline mb-[2px]">
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f0ede6', letterSpacing: '-0.2px' }}>
              {levelName}
            </span>
            <span style={{
              fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{xpFmt} XP</span>
          </div>

          {/* Sub */}
          <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 2 }}>
            {pct}% complete
          </div>
          <div style={{ fontSize: 11, fontWeight: 400, color: '#5a5650', marginBottom: 8 }}>
            Level {profileLevel} — {levelName}
          </div>

          {/* Bar */}
          <div className="h-[3px] bg-[#242420] rounded-full overflow-hidden mb-[5px]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
              }}
            />
          </div>

          {/* Bar meta */}
          <div className="flex justify-between" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#5a5650' }}>
            <span>{xpFmt} XP total</span>
            <span>{pct}%</span>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="mt-[8px] pt-[8px] border-t border-[#3d3d38] space-y-[3px]">
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 5 }}>
                🔥 {streak}-day streak active
              </div>
              {maxStreak > 0 && (
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 400, color: '#8a857a', display: 'flex', alignItems: 'center', gap: 5 }}>
                  ⭐ Best: {maxStreak} {maxStreak === 1 ? 'day' : 'days'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}
