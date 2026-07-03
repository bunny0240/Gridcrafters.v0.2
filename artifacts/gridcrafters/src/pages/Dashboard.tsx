import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuthContext } from "@/contexts/useAuthContext";
import { getInitials } from "@/hooks/useAuth";
import { SHORTCUTS, CHALLENGE_SCENARIOS } from "@/data/shortcuts";
import { FORMATTING_CHALLENGES } from "@/data/formatting";
import { fetchUserProgress } from "@/lib/db";
import { ArrowRight, CheckCircle2, Clock, Zap } from "lucide-react";

type ActivityRow = {
  id: string; module: string; challenge_title: string;
  action: string; xp_earned: number; created_at: string;
};
type LastChallenge = {
  module: string; challenge_title: string; level_name: string;
  xp_reward: number; last_seen: string;
} | null;

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuthContext();

  const [shortcutProg, setShortcutProg] = useState<Record<string, { status: string }>>({});
  const [formattingProg, setFormattingProg] = useState<Record<string, { status: string }>>({});
  const [levelsDone, setLevelsDone]   = useState<{ module: string; level_name: string; stars: number }[]>([]);
  const [activity, setActivity]       = useState<ActivityRow[]>([]);
  const [lastChallenge, setLastChallenge] = useState<LastChallenge>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (user) refreshProfile();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    fetchUserProgress(user.id).then(({ shortcuts, formatting, levelsDone, activity, lastChallenge }) => {
      const sp: Record<string, { status: string }> = {};
      (shortcuts ?? []).forEach((r: { shortcut_id: string; status: string }) => { sp[r.shortcut_id] = { status: r.status }; });
      setShortcutProg(sp);

      const fp: Record<string, { status: string }> = {};
      (formatting ?? []).forEach((r: { challenge_id: string; status: string }) => { fp[r.challenge_id] = { status: r.status }; });
      setFormattingProg(fp);

      setLevelsDone((levelsDone ?? []) as { module: string; level_name: string; stars: number }[]);
      setActivity((activity ?? []) as ActivityRow[]);
      setLastChallenge((lastChallenge ?? null) as LastChallenge);
      setLoading(false);
    });
  }, [user]);

  const getShortcutProgress = (level: keyof typeof SHORTCUTS) => {
    const challengeable = (SHORTCUTS[level] as any[]).filter(
      (s: any) => !s.studyOnly && CHALLENGE_SCENARIOS[s.id] !== undefined
    );
    const total     = challengeable.length;
    const completed = challengeable.filter((s: any) => shortcutProg[s.id]?.status === 'completed').length;
    return { completed, total, pct: total > 0 ? (completed / total) * 100 : 0 };
  };

  const getFormatProgress = (level: number) => {
    const chs       = FORMATTING_CHALLENGES.filter(c => c.level === level);
    const completed = chs.filter(c => formattingProg[c.id]?.status === 'completed').length;
    return { completed, total: chs.length, pct: chs.length > 0 ? (completed / chs.length) * 100 : 0 };
  };

  const rookie = getShortcutProgress('rookie');
  const inter  = getShortcutProgress('intermediate');
  const adv    = getShortcutProgress('advanced');
  const expert = getShortcutProgress('expert');
  const fmt1   = getFormatProgress(1);
  const fmt2   = getFormatProgress(2);
  const fmt3   = getFormatProgress(3);

  const isLevelDone = (module: string, level: string) =>
    levelsDone.some(l => l.module === module && l.level_name.toLowerCase() === level.toLowerCase());

  const totalLevelsDone = levelsDone.length;

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.username ?? 'there';
  const initials  = profile?.full_name ? getInitials(profile.full_name) : '?';
  const xp        = profile?.total_xp ?? 0;
  const streak    = profile?.streak_count ?? 0;

  const actionColor = (action: string) =>
    action === 'completed' ? '#4CAF50' : action === 'failed' ? '#F44336' : '#FF9800';

  const statCards = [
    {
      label: 'TOTAL XP',
      value: xp.toLocaleString(),
      labelColor: '#8b5cf6',
      numColor: '#a78bfa',
      prefix: '',
      bg: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))',
      border: 'rgba(139,92,246,0.35)',
    },
    {
      label: 'DAY STREAK',
      value: String(streak),
      labelColor: '#f59e0b',
      numColor: '#fbbf24',
      prefix: '🔥 ',
      bg: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
      border: 'rgba(245,158,11,0.35)',
    },
    {
      label: 'LEVELS DONE',
      value: String(totalLevelsDone),
      labelColor: '#22c55e',
      numColor: '#4ade80',
      prefix: '',
      bg: 'linear-gradient(135deg, rgba(34,197,94,0.10), rgba(34,197,94,0.04))',
      border: 'rgba(34,197,94,0.30)',
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto" style={{ fontFamily: 'Geist, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 700, color: '#f0ede6',
            letterSpacing: '-0.5px', lineHeight: 1.1, margin: 0,
          }}>
            Welcome back, {firstName}
          </h1>
          <p style={{ fontSize: 13, color: '#8a857a', marginTop: 4, fontWeight: 400 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 999, padding: '6px 12px',
              fontSize: 13, color: '#fbbf24', fontWeight: 600,
            }}>
              🔥 {streak}
            </div>
          )}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-[700] text-white border-[1.5px] border-[#333330]"
            style={{ background: 'linear-gradient(135deg,#3b0764,#1e3a8a)' }}>
            {initials}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {statCards.map(({ label, value, labelColor, numColor, prefix, bg, border }) => (
          <div key={label} style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 10, padding: '20px 22px',
          }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: labelColor,
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: 8,
            }}>{label}</div>
            <div style={{
              fontFamily: 'DM Mono, monospace', fontSize: 32, fontWeight: 700,
              color: numColor, lineHeight: 1,
            }}>{prefix}{value}</div>
          </div>
        ))}
      </div>

      {/* ── Resume card ── */}
      {lastChallenge && (
        <div className="mb-6 rounded-[8px] border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.04)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <Clock className="w-4 h-4 text-[#a78bfa]" />
            </div>
            <div>
              <div className="text-[11px] font-[600] text-[#c4b5fd]">Continue where you left off</div>
              <div className="text-[12px] text-[#e8e6e0]">{lastChallenge.challenge_title}</div>
              <div className="text-[10px] text-[#5a5750] font-mono">{lastChallenge.level_name} · {lastChallenge.module} · +{lastChallenge.xp_reward} XP</div>
            </div>
          </div>
          <Link href={`/${lastChallenge.module === 'shortcuts' ? 'shortcuts' : 'formatting'}`}>
            <button className="px-3 py-1.5 text-[11px] font-[600] rounded text-white"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
              Resume
            </button>
          </Link>
        </div>
      )}

      {/* ── Modules section label ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '1.5px', color: '#5a5650', marginBottom: 10,
        }}>Modules</div>
        <div style={{ height: 1, background: '#2c2c28' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

        {/* Shortcut Masters */}
        <Link href="/shortcuts" className="block group">
          <div style={{
            background: 'linear-gradient(#111110,#111110) padding-box, linear-gradient(135deg,#8b5cf6,#3b82f6) border-box',
            border: '1px solid transparent',
            borderRadius: 10, padding: 20, height: '100%',
            transition: 'opacity 0.15s',
          }}
            className="group-hover:opacity-90"
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede6', letterSpacing: '-0.3px', margin: '0 0 4px' }}>
                  Shortcut Masters
                </h3>
                <p style={{ fontSize: 13, color: '#8a857a', margin: 0 }}>Master keyboard efficiency</p>
              </div>
              <ArrowRight style={{ color: '#8b5cf6', width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
            </div>
            <div className="space-y-3">
              {[
                { label: 'Rookie',       p: rookie, done: isLevelDone('shortcuts','rookie')       },
                { label: 'Intermediate', p: inter,  done: isLevelDone('shortcuts','intermediate') },
                { label: 'Advanced',     p: adv,    done: isLevelDone('shortcuts','advanced')     },
                { label: '⚡ Expert',   p: expert, done: isLevelDone('shortcuts','expert')       },
              ].map(({ label, p, done }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#c4bfb4', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {done && <CheckCircle2 style={{ width: 12, height: 12, color: '#4CAF50' }} />}
                      {label}
                    </span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#a78bfa' }}>
                      {p.completed}/{p.total}
                    </span>
                  </div>
                  <div style={{ height: 3, background: '#2c2c28', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: `${p.pct}%`, background: 'linear-gradient(90deg,#8b5cf6,#3b82f6)', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* Formatting Kings */}
        <Link href="/formatting" className="block group">
          <div style={{
            background: 'linear-gradient(#111110,#111110) padding-box, linear-gradient(135deg,#3b82f6,#06b6d4) border-box',
            border: '1px solid transparent',
            borderRadius: 10, padding: 20, height: '100%',
            transition: 'opacity 0.15s',
          }}
            className="group-hover:opacity-90"
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f0ede6', letterSpacing: '-0.3px', margin: '0 0 4px' }}>
                  Formatting Kings
                </h3>
                <p style={{ fontSize: 13, color: '#8a857a', margin: 0 }}>Create beautiful spreadsheets</p>
              </div>
              <div className="flex items-center gap-2">
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                  color: '#60a5fa', padding: '3px 7px', borderRadius: 4,
                }}>Coming Soon</span>
                <ArrowRight style={{ color: '#3b82f6', width: 16, height: 16, flexShrink: 0 }} />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Rookie',       p: fmt1, done: isLevelDone('formatting','rookie')       },
                { label: 'Intermediate', p: fmt2, done: isLevelDone('formatting','intermediate') },
                { label: 'Advanced',     p: fmt3, done: isLevelDone('formatting','advanced')     },
              ].map(({ label, p, done }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#c4bfb4', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {done && <CheckCircle2 style={{ width: 12, height: 12, color: '#4CAF50' }} />}
                      {label}
                    </span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#60a5fa' }}>
                      {p.completed}/{p.total}
                    </span>
                  </div>
                  <div style={{ height: 3, background: '#2c2c28', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: `${p.pct}%`, background: 'linear-gradient(90deg,#3b82f6,#06b6d4)', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* Real Analysts */}
        <div style={{
          background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10, padding: 20,
        }}>
          <div className="flex justify-between items-start">
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#c4bfb4', letterSpacing: '-0.3px', margin: '0 0 4px' }}>
                Real Analysts
              </h3>
              <p style={{ fontSize: 13, color: '#5a5650', margin: 0 }}>Advanced data tasks</p>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
              background: '#1c1c1a', border: '1px solid #2a2a26',
              color: '#5a5650', padding: '3px 7px', borderRadius: 4,
            }}>Soon</span>
          </div>
        </div>

        {/* Global Leaderboard */}
        <div style={{
          background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 10, padding: 20,
        }}>
          <div className="flex justify-between items-start">
            <div>
              <h3 style={{
                fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px', margin: '0 0 4px',
                background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Global Leaderboard
              </h3>
              <p style={{ fontSize: 13, color: '#5a5650', margin: 0 }}>Compete with others</p>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
              background: '#1c1c1a', border: '1px solid #2a2a26',
              color: '#5a5650', padding: '3px 7px', borderRadius: 4,
            }}>Soon</span>
          </div>
        </div>

      </div>

      {/* ── Recent Activity ── */}
      {!loading && activity.length > 0 && (
        <div>
          <div style={{
            fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '1.5px', color: '#5a5650', marginBottom: 10,
          }}>Recent Activity</div>
          <div style={{ height: 1, background: '#2c2c28', marginBottom: 12 }} />
          <div className="bg-[#111110] border border-[#1e1e1c] rounded-[8px] overflow-hidden">
            {activity.slice(0, 6).map((act, i) => (
              <div key={act.id} className={`px-4 py-3 flex items-center justify-between ${i !== 0 ? 'border-t border-[#1a1a18]' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                    style={{ background: `${actionColor(act.action)}15` }}>
                    <Zap className="w-3 h-3" style={{ color: actionColor(act.action) }} />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#a8a49a]">{act.challenge_title}</p>
                    <p className="text-[10px] text-[#3a3834] font-mono">
                      {act.module} · {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {act.xp_earned > 0 && (
                  <span className="text-[11px] font-mono font-[500] text-[#4CAF50]">+{act.xp_earned} XP</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
