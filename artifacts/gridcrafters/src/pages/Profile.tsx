import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useAuthContext } from "@/contexts/useAuthContext";
import { getInitials } from "@/hooks/useAuth";
import { fetchUserProgress } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { LogOut, CheckCircle2, XCircle, SkipForward, Clock, Award, Pencil, Check, X } from "lucide-react";

const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 6000, 12000];
const LEVEL_NAMES = ['', 'Rookie', 'Intermediate', 'Advanced', 'Master', 'Elite'];

function xpToLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 2; i >= 1; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

type ActivityRow = {
  id: string; module: string; challenge_title: string; level_name: string;
  action: string; xp_earned: number; score: number | null; created_at: string;
};
type LevelDone = { module: string; level_name: string; stars: number; total_xp: number };

const ACTION_CONFIG: Record<string, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  completed: { label: 'Completed', color: '#4CAF50', Icon: CheckCircle2 },
  failed:    { label: 'Failed',    color: '#F44336', Icon: XCircle },
  skipped:   { label: 'Skipped',  color: '#FF9800', Icon: SkipForward },
  retried:   { label: 'Retried',  color: '#3b82f6', Icon: Clock },
  studied:   { label: 'Studied',  color: '#8b5cf6', Icon: Award },
  started:   { label: 'Started',  color: '#5a5750', Icon: Clock },
};

function groupByDate(rows: ActivityRow[]) {
  const groups: { label: string; items: ActivityRow[] }[] = [];
  const map = new Map<string, ActivityRow[]>();
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  rows.forEach(row => {
    const d = new Date(row.created_at).toDateString();
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday'
      : new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(row);
  });
  map.forEach((items, label) => groups.push({ label, items }));
  return groups;
}

export default function Profile() {
  const { user, profile, signOut, refreshProfile, rank } = useAuthContext();
  const [activity,   setActivity]   = useState<ActivityRow[]>([]);
  const [levelsDone, setLevelsDone] = useState<LevelDone[]>([]);
  const [loading,    setLoading]    = useState(true);

  const totalLevelsDone = levelsDone.length;

  const [editingName, setEditingName] = useState(false);
  const [nameValue,   setNameValue]   = useState('');
  const [nameSaving,  setNameSaving]  = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) refreshProfile();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    fetchUserProgress(user.id).then(({ activity, levelsDone }) => {
      setActivity((activity ?? []) as ActivityRow[]);
      setLevelsDone((levelsDone ?? []) as LevelDone[]);
      setLoading(false);
    });
  }, [user]);

  const fullName  = profile?.full_name ?? profile?.username ?? '—';
  const initials  = fullName !== '—' ? getInitials(fullName) : '?';
  const xp        = profile?.total_xp ?? 0;
  const streak    = profile?.streak_count ?? 0;
  const maxStreak = profile?.max_streak ?? 0;
  const joined    = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  const startEditName = () => {
    setNameValue(fullName !== '—' ? fullName : '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };
  const saveName = async () => {
    if (!user || !nameValue.trim()) return;
    setNameSaving(true);
    await supabase.from('profiles').update({ full_name: nameValue.trim() }).eq('id', user.id);
    setNameSaving(false);
    setEditingName(false);
    refreshProfile();
  };
  const cancelEditName = () => { setEditingName(false); setNameValue(''); };

  const profileLevel = xpToLevel(xp);
  const levelName    = LEVEL_NAMES[profileLevel] ?? 'Rookie';
  const floorXP      = LEVEL_THRESHOLDS[profileLevel - 1] ?? 0;
  const ceilXP       = LEVEL_THRESHOLDS[profileLevel]     ?? 12000;
  const pct          = Math.min(100, Math.round(((xp - floorXP) / (ceilXP - floorXP)) * 100));
  const groups = groupByDate(activity);

  const starsDisplay = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);

  return (
    <div className="p-8 max-w-5xl mx-auto" style={{ fontFamily: 'Geist, sans-serif' }}>

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0ede6', letterSpacing: '-0.5px', lineHeight: 1.1, margin: 0 }}>Profile</h1>
          <p style={{ fontSize: 11, color: '#5a5750', marginTop: 4, marginBottom: 0 }}>Your learning journey</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 transition-colors"
          style={{ fontSize: 11, color: '#5a5750', padding: '6px 12px', borderRadius: 6, border: '1px solid #1e1e1c', background: 'transparent', cursor: 'pointer' }}
          onMouseOver={e => (e.currentTarget.style.color = '#a8a49a')}
          onMouseOut={e => (e.currentTarget.style.color = '#5a5750')}
        >
          <LogOut style={{ width: 14, height: 14 }} />
          Sign out
        </button>
      </div>

      {/* Identity card — gradient border */}
      <div style={{
        background: 'linear-gradient(#1a1a17,#1a1a17) padding-box, linear-gradient(135deg,#8b5cf6,#3b82f6) border-box',
        border: '1px solid transparent', borderRadius: 12, padding: '24px 28px', marginBottom: 16,
      }}>
        <div className="flex items-start gap-5">
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg,#3b0764,#1e3a8a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
            border: '2px solid #333330',
          }}>{initials}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              {editingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEditName(); }}
                    disabled={nameSaving}
                    style={{
                      background: '#1a1a17', border: '1px solid #3d3d38',
                      borderRadius: 6, padding: '4px 10px',
                      fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 600,
                      color: '#f0ede6', outline: 'none', width: 220,
                    }}
                    onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
                    onBlur={e => (e.target.style.borderColor = '#3d3d38')}
                  />
                  <button onClick={saveName} disabled={nameSaving} style={{
                    padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)',
                    fontFamily: 'Geist, sans-serif', fontSize: 12, fontWeight: 600, color: '#fff',
                  }}>
                    <Check style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                    Save
                  </button>
                  <button onClick={cancelEditName} style={{
                    padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    background: 'transparent', border: '1px solid #3d3d38',
                    fontFamily: 'Geist, sans-serif', fontSize: 12, fontWeight: 600, color: '#5a5650',
                  }}>
                    <X style={{ width: 12, height: 12, display: 'inline' }} />
                  </button>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0ede6', letterSpacing: '-0.3px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</h2>
                  <button onClick={startEditName} title="Edit name" style={{
                    width: 24, height: 24, borderRadius: 4, border: 'none',
                    background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#5a5650', flexShrink: 0,
                  }}
                    onMouseOver={e => (e.currentTarget.style.color = '#a78bfa')}
                    onMouseOut={e => (e.currentTarget.style.color = '#5a5650')}
                  >
                    <Pencil style={{ width: 13, height: 13 }} />
                  </button>
                </>
              )}
            </div>

            <p style={{ fontSize: 13, color: '#8a857a', margin: '0 0 16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#5a5650' }}>XP Progress</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
                  border: '1px solid rgba(139,92,246,0.25)', letterSpacing: '0.5px',
                }}>{levelName}</span>
              </div>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500 }}>
                <span style={{ color: '#a78bfa' }}>{xp.toLocaleString()}</span>
                <span style={{ color: '#5a5650' }}> / {ceilXP.toLocaleString()}</span>
              </span>
            </div>
            <div style={{ height: 6, background: '#2c2c28', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: 'linear-gradient(90deg,#8b5cf6,#3b82f6)', transition: 'width 0.7s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 400, color: '#8a857a' }}>{pct}% to next level</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5a5650' }}>Joined {joined}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-col stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div style={{
          background: 'linear-gradient(135deg,rgba(245,158,11,0.10),rgba(245,158,11,0.04))',
          border: '1px solid rgba(245,158,11,0.30)', borderRadius: 10, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#f59e0b', marginBottom: 6 }}>Day Streak</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 36, fontWeight: 700, color: '#fbbf24', lineHeight: 1, marginBottom: 4 }}>🔥 {streak}</div>
          <div style={{ fontSize: 12, color: '#8a857a', marginBottom: 12 }}>days active</div>
          <div style={{ height: 1, background: '#3d3d38', marginBottom: 10 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#8a857a' }}>Best streak</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 600, color: '#fbbf24' }}>{maxStreak}</span>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg,rgba(139,92,246,0.10),rgba(139,92,246,0.04))',
          border: '1px solid rgba(139,92,246,0.30)', borderRadius: 10, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#8b5cf6', marginBottom: 6 }}>Total XP</div>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4,
            background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{xp.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#8a857a' }}>experience points</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.04))',
          border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#22c55e', marginBottom: 6 }}>Levels Done</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 28, fontWeight: 700, color: '#4ade80', lineHeight: 1, marginBottom: 4 }}>{totalLevelsDone}</div>
          <div style={{ fontSize: 12, color: '#8a857a' }}>levels completed</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(59,130,246,0.04))',
          border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#60a5fa', marginBottom: 6 }}>Rank</div>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4,
            background: 'linear-gradient(135deg,#60a5fa,#93c5fd)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {rank !== null ? `#${rank}` : '#—'}
          </div>
          <div style={{ fontSize: 12, color: '#8a857a' }}>global leaderboard</div>
        </div>
      </div>

      {/* Level completions */}
      {levelsDone.length > 0 && (
        <div className="mb-6">
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#5a5650', marginBottom: 10, borderLeft: '3px solid #8b5cf6', paddingLeft: 10 }}>
            Completed Levels
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {levelsDone.map(lv => (
              <div key={`${lv.module}-${lv.level_name}`}
                style={{ background: '#111110', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#a8a49a', textTransform: 'capitalize' }}>{lv.level_name}</div>
                  <div style={{ fontSize: 10, color: '#5a5750', textTransform: 'capitalize' }}>{lv.module}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#f59e0b' }}>{starsDisplay(lv.stars)}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#4CAF50' }}>+{lv.total_xp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity History */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#5a5650', marginBottom: 12, borderLeft: '3px solid #8b5cf6', paddingLeft: 10 }}>
          Activity History
        </div>

        {loading ? (
          <div style={{ fontSize: 12, color: '#3a3834', padding: '32px 0', textAlign: 'center' }}>Loading…</div>
        ) : groups.length === 0 ? (
          <div style={{
            background: '#1a1a17', border: '1px solid #3d3d38', borderRadius: 8,
            padding: 32, textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, color: '#3d3d38', marginBottom: 10 }}>⊞</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#8a857a', marginBottom: 6 }}>No activity yet</div>
            <div style={{ fontSize: 12, color: '#5a5650', marginBottom: 16 }}>Complete your first challenge to see history here</div>
            <Link href="/shortcuts">
              <button style={{
                background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)',
                border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
                fontFamily: 'Geist, sans-serif', fontSize: 12, fontWeight: 600, color: '#fff',
              }}>
                Start Shortcut Masters →
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(({ label, items }) => (
              <div key={label}>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#3a3834', marginBottom: 6, paddingLeft: 4 }}>{label}</div>
                <div style={{ background: '#111110', border: '1px solid #1e1e1c', borderRadius: 8, overflow: 'hidden' }}>
                  {items.map((row, i) => {
                    const cfg = ACTION_CONFIG[row.action] ?? ACTION_CONFIG.started;
                    const Icon = cfg.Icon;
                    return (
                      <div key={row.id}
                        style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: i !== 0 ? '1px solid #1a1a18' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 4, background: `${cfg.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 12, color: '#a8a49a', margin: 0, lineHeight: 1.3 }}>{row.challenge_title}</p>
                            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#3a3834', margin: 0, textTransform: 'capitalize' }}>{row.module} · {row.level_name}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
                            {cfg.label}
                          </span>
                          {row.xp_earned > 0 && (
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#4CAF50' }}>+{row.xp_earned}</span>
                          )}
                          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#3a3834' }}>
                            {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
