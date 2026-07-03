import { useState, useEffect } from "react";
import { Link } from "wouter";
import { fetchLeaderboard } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/contexts/useAuthContext";
import { getInitials } from "@/hooks/useAuth";

type LBRow = {
  id: string; username: string; full_name: string; avatar_url: string | null;
  total_xp: number; level: number; streak_count: number;
  badge_count: number; levels_complete: number; rank: number;
};

function rankStyle(rank: number): { color: string; fontWeight: number; fontSize: number } {
  if (rank === 1) return { color: '#fbbf24', fontWeight: 700, fontSize: 15 };
  if (rank === 2) return { color: '#9ca3af', fontWeight: 700, fontSize: 15 };
  if (rank === 3) return { color: '#b45309', fontWeight: 700, fontSize: 15 };
  return { color: '#5a5650', fontWeight: 500, fontSize: 14 };
}

export default function Leaderboard() {
  const { user, profile } = useAuthContext();
  const [rows,       setRows]       = useState<LBRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [badgeCount, setBadgeCount] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard().then(data => {
      setRows((data ?? []) as LBRow[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_badges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => { if (count !== null) setBadgeCount(count); });
  }, [user?.id]);

  // Patch current user's row with correct in-memory XP (DB may be stale).
  // Re-sort and re-rank so their position is accurate.
  const displayRows = (() => {
    if (!user || !profile || rows.length === 0) return rows;
    const correctXP = profile.total_xp ?? 0;
    const patched   = rows.map(r =>
      r.id === user.id
        ? {
            ...r,
            total_xp: Math.max(r.total_xp, correctXP),
            level:    profile.level ?? r.level,
            badge_count: badgeCount !== null ? Math.max(r.badge_count, badgeCount) : r.badge_count,
          }
        : r
    );
    const sorted = [...patched].sort((a, b) => b.total_xp - a.total_xp);
    return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
  })();

  const onlyMe = displayRows.length === 1 && displayRows[0].id === user?.id;

  return (
    <div className="p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Geist, sans-serif' }}>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0ede6', letterSpacing: '-0.5px', lineHeight: 1.1, margin: 0 }}>Leaderboard</h1>
          <p style={{ fontSize: 11, color: '#5a5750', marginTop: 4, marginBottom: 0 }}>Top analysts worldwide</p>
        </div>
        <div style={{
          background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 999, padding: '5px 10px',
          fontFamily: 'Geist, sans-serif', fontSize: 11, fontWeight: 600, color: '#a78bfa',
        }}>live</div>
      </div>

      <div style={{ background: '#1a1a17', border: '1px solid #3d3d38', borderRadius: 12, overflow: 'hidden' }}>

        <div style={{
          background: '#161614', borderBottom: '1px solid #3d3d38',
          padding: '10px 20px', display: 'flex', alignItems: 'center',
        }}>
          <div style={{ width: 40, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#5a5650' }}>Rank</div>
          <div style={{ flex: 1, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#5a5650' }}>Analyst</div>
          <div style={{ width: 96, textAlign: 'right', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#5a5650' }}>XP</div>
          <div style={{ width: 80, textAlign: 'right', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#5a5650' }}>Levels</div>
          <div style={{ width: 80, textAlign: 'right', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#5a5650' }}>Badges</div>
        </div>

        {loading ? (
          <div style={{ padding: '64px 0', textAlign: 'center', fontSize: 12, color: '#3a3834' }}>Loading rankings…</div>
        ) : displayRows.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 24, color: '#3d3d38', marginBottom: 12 }}>⊞</div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#5a5750', marginBottom: 4 }}>No rankings yet</p>
            <p style={{ fontSize: 11, color: '#3a3834' }}>Complete challenges to appear here</p>
          </div>
        ) : (
          <>
            {displayRows.map((row, i) => {
              const isMe = row.id === user?.id;
              const init = row.full_name ? getInitials(row.full_name) : row.username.slice(0, 2).toUpperCase();
              const rs   = rankStyle(row.rank);

              return (
                <div key={row.id}
                  style={{
                    padding: '14px 20px',
                    borderBottom: i !== rows.length - 1 ? '1px solid #2c2c28' : 'none',
                    display: 'flex', alignItems: 'center',
                    background: isMe
                      ? 'linear-gradient(90deg,rgba(139,92,246,0.08),transparent)'
                      : 'transparent',
                    borderLeft: isMe ? '3px solid #8b5cf6' : '3px solid transparent',
                    cursor: 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseOver={e => { if (!isMe) e.currentTarget.style.background = '#232320'; }}
                  onMouseOut={e => { if (!isMe) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 40, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', ...rs }}>{row.rank}</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#3b0764,#1e3a8a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>{init}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f0ede6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.full_name || row.username}
                        </span>
                        {isMe && (
                          <span style={{
                            fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
                            color: '#a78bfa', padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                          }}>you</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {row.streak_count > 0 && (
                          <span style={{ fontSize: 11, color: '#8a857a' }}>
                            <span style={{ fontFamily: 'DM Mono, monospace', color: '#f59e0b' }}>{row.streak_count}</span>
                            {' day streak'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ width: 96, textAlign: 'right' }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 600,
                      background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>{row.total_xp.toLocaleString()}</span>
                  </div>

                  <div style={{ width: 80, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500, color: '#8a857a' }}>
                    {row.levels_complete}
                  </div>

                  <div style={{ width: 80, textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500, color: '#8a857a' }}>
                    {row.badge_count}
                  </div>
                </div>
              );
            })}

            {onlyMe && (
              <div style={{
                background: '#161614', border: '1px solid #2c2c28', borderRadius: 8,
                padding: 20, margin: 12, textAlign: 'center',
              }}>
                <p style={{ fontSize: 13, color: '#5a5650', margin: 0 }}>
                  You're #1 — invite others to compete
                </p>
                <Link href="/shortcuts">
                  <button style={{
                    marginTop: 10, background: 'transparent', border: '1px solid #3d3d38',
                    borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                    fontFamily: 'Geist, sans-serif', fontSize: 11, fontWeight: 600, color: '#5a5650',
                  }}>
                    Keep earning XP →
                  </button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
