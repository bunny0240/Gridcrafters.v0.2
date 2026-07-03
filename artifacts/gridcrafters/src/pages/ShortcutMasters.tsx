import { useState, useEffect, useCallback, useRef } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useAuthContext } from "@/contexts/useAuthContext";
import { completeChallenge, logActivity, checkLevelCompletion, markLevelStudied } from "@/lib/db";
import { SHORTCUTS, CHALLENGE_SCENARIOS } from "@/data/shortcuts";
import { ExcelSimulator } from "@/components/ExcelSimulator";
import { KeyDisplay } from "@/components/KeyDisplay";
import { ShortcutMasterModal, hasSeenShortcutMasterModal } from "@/components/ShortcutMasterModal";
import { Search, CheckCircle, XCircle, Lock, Play, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeChallengePool(lvl: keyof typeof SHORTCUTS) {
  return fisherYates(
    (SHORTCUTS[lvl] as any[]).filter(
      (s: any) => !s.studyOnly && CHALLENGE_SCENARIOS[s.id] !== undefined
    )
  );
}

export default function ShortcutMasters() {
  const [state, setGameState] = useGameState();
  const { user, addXP } = useAuthContext();
  const [activeTab, setActiveTab]             = useState<'study' | 'challenge'>('study');
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [challengeView, setChallengeView]     = useState<'list' | 'active'>('list');
  const [level, setLevel]                     = useState<'rookie' | 'intermediate' | 'advanced' | 'expert'>('rookie');

  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<'all' | 'chord' | 'sequence'>('all');

  const [challengeIdx, setChallengeIdx] = useState(0);
  const [phase, setPhase]               = useState<'attempt' | 'result'>('attempt');
  const [timeLeft, setTimeLeft]         = useState(10);
  const [attempts, setAttempts]         = useState(0);
  const [result, setResult]             = useState<'pass' | 'fail' | null>(null);
  const [earnedXP, setEarnedXP]         = useState(0);

  const [livePressed, setLivePressed]   = useState<string[]>([]);
  const [liveNextKey, setLiveNextKey]   = useState<string | null>(null);
  const [showWrong, setShowWrong]       = useState(false);
  const [showHint, setShowHint]         = useState(false);

  const startTimeRef  = useRef(Date.now());
  const hintsUsedRef  = useRef(0);
  const retriesRef    = useRef(0);

  const levelStudiedKey = `shortcuts-${level}`;
  const isStudied = state.levelStudied[levelStudiedKey];

  const shortcuts         = SHORTCUTS[level];
  const filteredShortcuts = shortcuts.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'all' || s.type === filter)
  );

  const [challengeShortcuts, setChallengeShortcuts] = useState(() => makeChallengePool(level));

  useEffect(() => {
    setChallengeShortcuts(makeChallengePool(level));
  }, [level]);

  const markStudied = async () => {
    setGameState(prev => ({
      ...prev,
      levelStudied: { ...prev.levelStudied, [levelStudiedKey]: true }
    }));
    setActiveTab('challenge');
    setChallengeView('list');
    if (user) {
      await markLevelStudied({
        userId: user.id, module: 'shortcuts', levelName: level,
        challengeIds: shortcuts.map(s => s.id),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (activeTab === 'challenge' && challengeView === 'active' && phase === 'attempt' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (activeTab === 'challenge' && challengeView === 'active' && phase === 'attempt' && timeLeft === 0) {
      handleFail();
    }
    return undefined;
  }, [timeLeft, activeTab, challengeView, phase]);

  useEffect(() => {
    setLivePressed([]);
    setLiveNextKey(null);
    setShowWrong(false);
    startTimeRef.current = Date.now();
    hintsUsedRef.current = 0;
  }, [challengeIdx, level]);

  // On mount: retroactively check ALL 4 levels so level_completion rows exist
  // for every finished level before checkShortcutMasterBadge runs.
  // Badge requires all 4 levels in the DB — checking only the current tab is insufficient.
  useEffect(() => {
    if (!user) return;
    const ALL_LEVELS = ['rookie', 'intermediate', 'advanced', 'expert'] as const;
    Promise.all(
      ALL_LEVELS.map(async lvl => {
        const pool = (SHORTCUTS[lvl] as any[]).filter(
          (s: any) => !s.studyOnly && CHALLENGE_SCENARIOS[s.id] !== undefined
        );
        if (pool.length === 0) return null;
        const allDone = pool.every((s: any) => state.shortcuts[s.id]?.status === 'completed');
        if (!allDone) return null;
        return checkLevelCompletion({
          userId: user.id, module: 'shortcuts', levelName: lvl,
          totalInLevel: pool.length, hintsUsed: 0, retries: 0,
        }).catch(() => null);
      })
    ).then(results => {
      const earned = results.some(r => r?.badgeEarned === 'shortcut_master');
      if (earned && !hasSeenShortcutMasterModal()) setShowMasterModal(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const currentShortcut = challengeShortcuts[challengeIdx];
  const scenario = currentShortcut ? CHALLENGE_SCENARIOS[currentShortcut.id] : null;

  const handleCorrect = useCallback(() => {
    if (phase !== 'attempt') return;

    let xp = currentShortcut.baseXP;
    if (timeLeft >= 6) xp += Math.floor(currentShortcut.baseXP * 0.4);
    else if (timeLeft >= 3) xp += Math.floor(currentShortcut.baseXP * 0.2);

    if (state.combo >= 10) xp = Math.floor(xp * 2.0);
    else if (state.combo >= 5) xp = Math.floor(xp * 1.5);
    else if (state.combo >= 3) xp = Math.floor(xp * 1.25);

    if (attempts > 0) xp = Math.floor(xp * 0.8);

    // Determine whether this earns XP:
    //   - First completion: full XP
    //   - Replay where current > previous best: delta XP
    //   - Replay where current <= previous best: 0 XP (no award, no UI bump)
    const existing   = state.shortcuts[currentShortcut.id];
    const prevBest   = existing?.bestXP ?? 0;
    const isFirstRun = existing?.status !== 'completed';
    const awardXpNow = isFirstRun ? xp : Math.max(0, xp - prevBest);

    // Optimistic update — only when there's actual XP to award
    if (awardXpNow > 0) addXP(awardXpNow);

    setEarnedXP(awardXpNow);
    setResult('pass');
    setPhase('result');

    setGameState(prev => {
      const prevBestInState = prev.shortcuts[currentShortcut.id]?.bestXP ?? 0;
      return {
        ...prev,
        combo: prev.combo + 1,
        shortcuts: {
          ...prev.shortcuts,
          [currentShortcut.id]: {
            status:    'completed',
            attempts:  (prev.shortcuts[currentShortcut.id]?.attempts ?? 0) + 1,
            bestXP:    Math.max(prevBestInState, xp),
            hintsUsed: 0,
          }
        },
      };
    });

    if (user) {
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      // Fire-and-forget — DB write + level-completion check run in background.
      // Do NOT call refreshProfile() here: it reads stale DB values and overwrites
      // the optimistic XP back to 0. The realtime subscription handles live sync.
      completeChallenge({
        userId: user.id, module: 'shortcuts', levelName: level,
        challengeId: currentShortcut.id, challengeTitle: currentShortcut.label,
        xpEarned: xp, hintsUsed: hintsUsedRef.current, timeTakenSec: timeTaken,
        combo: state.combo, bestXP: Math.max(xp, 0),
      }).then(async () => {
        const result = await checkLevelCompletion({
          userId: user.id, module: 'shortcuts', levelName: level,
          totalInLevel: challengeShortcuts.length, hintsUsed: hintsUsedRef.current, retries: retriesRef.current,
        }).catch(() => ({ levelComplete: false, badgeEarned: null }));
        if (result?.badgeEarned === 'shortcut_master' && !hasSeenShortcutMasterModal()) {
          setShowMasterModal(true);
        }
      }).catch(() => {});
    }
  }, [phase, timeLeft, attempts, state.combo, currentShortcut, user, level, shortcuts]);

  const handleWrong = useCallback(() => {
    if (phase !== 'attempt') return;
    setShowWrong(true);
    setTimeout(() => setShowWrong(false), 500);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (newAttempts >= 3) handleFail();
  }, [phase, attempts]);

  function handleFail() {
    if (phase !== 'attempt') return;
    setResult('fail');
    setPhase('result');
    setGameState(prev => ({ ...prev, combo: 0 }));

    if (user) {
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      logActivity({
        userId: user.id, module: 'shortcuts', levelName: level,
        challengeId: currentShortcut.id, challengeTitle: currentShortcut.label,
        action: 'failed', xpEarned: 0, hintsUsed: hintsUsedRef.current,
        timeTakenSec: timeTaken, comboAtTime: state.combo,
      }).catch(() => {});
    }
  }

  const nextChallenge = () => {
    if (phase === 'attempt' && user) {
      logActivity({ userId: user.id, module: 'shortcuts', levelName: level, challengeId: currentShortcut.id, challengeTitle: currentShortcut.label, action: 'skipped', xpEarned: 0 }).catch(() => {});
    }

    if (challengeIdx < challengeShortcuts.length - 1) {
      setChallengeIdx(i => i + 1);
    } else {
      setChallengeIdx(0);
      setChallengeView('list');
    }
    setPhase('attempt');
    setResult(null);
    setTimeLeft(10);
    setAttempts(0);
    setLivePressed([]);
    setLiveNextKey(null);
    setShowHint(false);
    retriesRef.current = 0;
  };

  const retryChallenge = () => {
    setPhase('attempt');
    setResult(null);
    setTimeLeft(10);
    setAttempts(0);
    setLivePressed([]);
    setLiveNextKey(null);
    setShowWrong(false);
    setShowHint(false);
    retriesRef.current += 1;
    startTimeRef.current = Date.now();

    if (user) logActivity({ userId: user.id, module: 'shortcuts', levelName: level, challengeId: currentShortcut.id, challengeTitle: currentShortcut.label, action: 'retried', xpEarned: 0 }).catch(() => {});
  };

  const onShowHint = () => { setShowHint(true); hintsUsedRef.current += 1; };

  const goToChallenge = (idx: number) => {
    setChallengeIdx(idx);
    setChallengeView('active');
    setPhase('attempt');
    setResult(null);
    setTimeLeft(10);
    setAttempts(0);
    setLivePressed([]);
    setLiveNextKey(null);
    setShowHint(false);
    retriesRef.current = 0;
    startTimeRef.current = Date.now();
    hintsUsedRef.current = 0;
  };

  const completedCount = challengeShortcuts.filter((s: any) => state.shortcuts[s.id]?.status === 'completed').length;
  const timerColor = timeLeft > 6 ? '#4CAF50' : timeLeft > 3 ? '#FFB300' : '#F44336';
  const levelColors: Record<string, string> = { rookie: '#00B4D8', intermediate: '#4CAF50', advanced: '#FF9800', expert: '#9C27B0' };
  const levelColor = levelColors[level];

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#ECECEC]">Shortcut Masters</h1>
          <p className="text-[#6B7280] mt-0.5">Build muscle memory for essential Excel shortcuts.</p>
        </div>
        <div className="flex bg-[#111111] p-1 rounded-lg border border-[#2A2A2A] gap-1">
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'study' ? 'bg-[#00B4D8] text-white' : 'text-[#6B7280] hover:text-[#ECECEC]'}`}
            onClick={() => setActiveTab('study')}
          >Study Mode</button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'challenge' ? 'bg-[#00B4D8] text-white' : isStudied ? 'text-[#6B7280] hover:text-[#ECECEC]' : 'text-[#6B7280]/40 cursor-not-allowed'}`}
            onClick={() => { if (isStudied) { setActiveTab('challenge'); setChallengeView('list'); } }}
            disabled={!isStudied}
          >
            Challenge
            {!isStudied && <Lock className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Level tabs */}
      <div className="flex gap-2 border-b border-[#2A2A2A] pb-4">
        {(['rookie', 'intermediate', 'advanced', 'expert'] as const).map(l => {
          const colors: Record<string, string> = { rookie: '#00B4D8', intermediate: '#4CAF50', advanced: '#FF9800', expert: '#9C27B0' };
          const isActive = level === l;
          return (
            <button
              key={l}
              className="px-4 py-1.5 rounded-full text-sm font-semibold capitalize border transition-colors"
              style={isActive
                ? { background: '#1A1A1A', borderColor: colors[l], color: colors[l] }
                : { background: 'transparent', borderColor: '#2A2A2A', color: '#6B7280' }}
              onClick={() => {
                setLevel(l);
                setChallengeIdx(0);
                setPhase('attempt');
                setResult(null);
                setTimeLeft(10);
                setAttempts(0);
                setActiveTab('study');
                setChallengeView('list');
                setLivePressed([]);
                setLiveNextKey(null);
                retriesRef.current = 0;
              }}
            >{l === 'expert' ? '⚡ Expert' : l}</button>
          );
        })}
      </div>

      {/* ── STUDY MODE ── */}
      {activeTab === 'study' && (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg flex flex-col" style={{ minHeight: 400 }}>
          <div className="p-4 border-b border-[#2A2A2A] flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search shortcuts..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-md pl-9 pr-4 py-2 text-sm text-[#ECECEC] focus:outline-none focus:border-[#00B4D8]"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#ECECEC]"
              value={filter}
              onChange={(e: any) => setFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="chord">Chord (simultaneous)</option>
              <option value="sequence">Sequence (one by one)</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1A1A1A] text-[#6B7280]">
                <tr>
                  <th className="px-4 py-3 font-medium border-b border-[#2A2A2A]">Shortcut</th>
                  <th className="px-4 py-3 font-medium border-b border-[#2A2A2A]">Action</th>
                  <th className="px-4 py-3 font-medium border-b border-[#2A2A2A]">Type</th>
                  <th className="px-4 py-3 font-medium border-b border-[#2A2A2A]">XP</th>
                  <th className="px-4 py-3 font-medium border-b border-[#2A2A2A]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredShortcuts.map(s => (
                  <tr key={s.id} className="border-b border-[#2A2A2A] hover:bg-[#1A1A1A]/60">
                    <td className="px-4 py-3 font-mono text-[#ECECEC] text-sm">
                      {s.keys.join(s.type === 'chord' ? ' + ' : ' → ')}
                    </td>
                    <td className="px-4 py-3 text-[#ECECEC]">{s.label}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.type === 'chord' ? 'bg-[#00B4D8]/10 text-[#00B4D8]' : 'bg-[#4CAF50]/10 text-[#4CAF50]'}`}>
                        {s.type}
                        {s.type === 'sequence' && <span className="ml-1 text-[#6B7280]">(one at a time)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {(s as any).studyOnly
                        ? <span className="text-[#6B7280]">—</span>
                        : <span className="text-[#00B4D8]">+{s.baseXP}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {(s as any).studyOnly
                        ? <span className="text-[#6B7280] text-xs italic">Study only</span>
                        : state.shortcuts[s.id]?.status === 'completed'
                          ? <span className="text-[#4CAF50] text-xs font-medium">✓ Done</span>
                          : <span className="text-[#6B7280] text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#2A2A2A] bg-[#1A1A1A]">
            {isStudied ? (
              <div className="flex items-center justify-between">
                <span className="text-[#4CAF50] font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Level studied — {completedCount}/{challengeShortcuts.length} challenges completed
                </span>
                <button
                  className="px-6 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-md font-semibold text-sm"
                  onClick={() => { setActiveTab('challenge'); setChallengeView('list'); }}
                >Go to Challenge →</button>
              </div>
            ) : (
              <button
                className="w-full py-3 rounded-md font-bold text-center bg-[#00B4D8] hover:bg-[#0096B4] text-white transition-colors"
                onClick={markStudied}
              >✓ I've Studied This — Unlock Challenge</button>
            )}
          </div>
        </div>
      )}

      {/* ── CHALLENGE LIST ── */}
      {activeTab === 'challenge' && challengeView === 'list' && (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg flex flex-col" style={{ minHeight: 400 }}>
          <div className="p-5 border-b border-[#2A2A2A] flex items-center justify-between">
            <div>
              <h2 className="text-[#ECECEC] font-semibold text-base">Challenge Mode</h2>
              <p className="text-[#6B7280] text-sm mt-0.5 capitalize">{completedCount}/{challengeShortcuts.length} completed · {level}</p>
            </div>
            <button
              className="px-5 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-md font-semibold text-sm flex items-center gap-2"
              onClick={() => goToChallenge(0)}
            >
              <Play className="w-3.5 h-3.5" />
              {completedCount === 0 ? 'Start All' : 'Start from Beginning'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {challengeShortcuts.map((s: any, i: number) => {
              const isDone = state.shortcuts[s.id]?.status === 'completed';
              const bestXP = state.shortcuts[s.id]?.bestXP;
              return (
                <div
                  key={s.id}
                  className="px-5 py-3.5 border-b border-[#1A1A1A] last:border-0 flex items-center justify-between hover:bg-[#1A1A1A] cursor-pointer group transition-colors"
                  onClick={() => goToChallenge(i)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold font-mono"
                      style={isDone
                        ? { background: 'rgba(0,180,216,0.1)', color: '#00B4D8', border: '1px solid rgba(0,180,216,0.3)' }
                        : { background: '#1A1A1A', color: '#4B5563', border: '1px solid #2A2A2A' }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[#ECECEC] text-sm">{s.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${s.type === 'chord' ? 'bg-[#00B4D8]/10 text-[#00B4D8]' : 'bg-[#4CAF50]/10 text-[#4CAF50]'}`}>
                          {s.type}
                        </span>
                      </div>
                      <span className="text-[#6B7280] text-xs font-mono">{s.keys.join(s.type === 'chord' ? ' + ' : ' → ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {isDone && bestXP !== undefined && (
                      <span className="text-[11px] text-[#4CAF50] font-mono">+{bestXP} XP earned</span>
                    )}
                    {!isDone && (
                      <span className="text-[11px] font-mono text-[#00B4D8]">+{s.baseXP} XP</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACTIVE CHALLENGE ── */}
      {activeTab === 'challenge' && challengeView === 'active' && (
        <div className="flex flex-col gap-4">
          {/* Progress bar */}
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setChallengeView('list')}
                  className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#ECECEC] text-xs transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> All Challenges
                </button>
                <span className="text-[#ECECEC] font-semibold">
                  Challenge {challengeIdx + 1}/{challengeShortcuts.length}
                  <span className="text-[#6B7280] font-normal ml-2 capitalize">· {level}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                {state.combo >= 3 && (
                  <span className="bg-yellow-500/15 text-yellow-400 px-3 py-0.5 rounded-full text-xs font-bold border border-yellow-500/30">
                    {state.combo >= 10 ? '×2.0' : state.combo >= 5 ? '×1.5' : '×1.25'} COMBO {state.combo}
                  </span>
                )}
                <span className="text-sm font-mono" style={{ color: timerColor }}>{timeLeft}s</span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(challengeIdx / challengeShortcuts.length) * 100}%`, background: 'linear-gradient(90deg,#00B4D8,#4CAF50)' }}
              />
            </div>

            <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${(timeLeft / 10) * 100}%`,
                  background: timerColor,
                  boxShadow: timeLeft <= 2 ? `0 0 8px ${timerColor}` : 'none'
                }}
              />
            </div>
          </div>

          {/* Scenario */}
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4">
            <div className="text-xs font-bold tracking-widest text-[#6B7280] mb-1">SCENARIO</div>
            <p className="text-[#ECECEC] mb-3 leading-relaxed">{scenario?.scenario ?? 'Perform the task in the spreadsheet.'}</p>
            <div className="text-xs font-bold tracking-widest text-[#00B4D8] mb-1">TASK</div>
            <p className="text-white font-semibold text-base">{scenario?.instruction ?? currentShortcut?.label}</p>
          </div>

          {/* Excel Simulator */}
          <div className={`transition-all duration-200 rounded-lg ${showWrong ? 'ring-2 ring-[#F44336]' : ''}`}>
            <ExcelSimulator
              key={`${level}-${challengeIdx}`}
              challenge={phase === 'attempt' ? { ...currentShortcut, ...scenario } : { ...currentShortcut, ...scenario, readOnly: true }}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
              readOnly={phase === 'result'}
              onSequenceProgress={(pressed, next) => { setLivePressed(pressed); setLiveNextKey(next); }}
              onChordPressed={pressed => setLivePressed(pressed)}
            />
          </div>

          {phase === 'attempt' && attempts > 0 && (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg px-4 py-2 flex items-center justify-center">
              <p className="text-[#F44336] text-xs font-semibold">{3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining</p>
            </div>
          )}
        </div>
      )}

      {/* ── Result Modal ── */}
      <AnimatePresence>
        {activeTab === 'challenge' && challengeView === 'active' && phase === 'result' && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className={`rounded-xl border p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-5 text-center ${result === 'pass' ? 'border-[rgba(76,175,80,0.35)]' : 'border-[rgba(244,67,54,0.25)]'}`}
              style={{
                background: '#0E0E0E',
                boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${result === 'pass' ? 'rgba(76,175,80,0.08)' : 'rgba(244,67,54,0.06)'}`,
              }}
            >
              {result === 'pass' ? (
                <>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[rgba(76,175,80,0.12)]">
                    <CheckCircle className="w-7 h-7 text-[#4CAF50]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Correct!</h3>
                    <p className="text-[#6B7280] text-sm">Effect applied to cells in the simulator</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="text-4xl font-black font-mono text-[#00B4D8] tabular-nums"
                  >+{earnedXP} XP</motion.div>
                  <KeyDisplay
                    keys={currentShortcut.keys}
                    type={currentShortcut.type as 'chord' | 'sequence'}
                    pressedKeys={currentShortcut.keys}
                  />
                  <button
                    onClick={nextChallenge}
                    className="w-full py-3 bg-[#4CAF50] hover:bg-[#3D8B40] text-white rounded-md font-bold transition-colors"
                  >
                    {challengeIdx < challengeShortcuts.length - 1 ? 'Next Challenge →' : 'Finish Level ✓'}
                  </button>
                  <button
                    onClick={() => { setChallengeView('list'); setPhase('attempt'); setResult(null); setTimeLeft(10); setAttempts(0); }}
                    className="w-full py-2 text-[#6B7280] hover:text-[#ECECEC] text-sm transition-colors"
                  >
                    ← Back to Module List
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[rgba(244,67,54,0.1)]">
                    <XCircle className="w-7 h-7 text-[#F44336]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Not quite</h3>
                    <p className="text-[#6B7280] text-sm">Try again or reveal the shortcut</p>
                  </div>

                  <AnimatePresence>
                    {showHint && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center gap-2 overflow-hidden w-full"
                      >
                        <p className="text-xs text-[#6B7280] tracking-widest">
                          {currentShortcut.type === 'sequence' ? 'PRESS EACH KEY ONE AT A TIME →' : 'PRESS SIMULTANEOUSLY'}
                        </p>
                        <KeyDisplay
                          keys={currentShortcut.keys}
                          type={currentShortcut.type as 'chord' | 'sequence'}
                          pressedKeys={currentShortcut.keys}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={retryChallenge}
                      className="flex-1 py-2.5 bg-[#F44336]/10 border border-[#F44336]/30 hover:bg-[#F44336]/20 text-white rounded-md font-semibold transition-colors text-sm"
                    >
                      Retry <span className="text-[#6B7280] text-xs">(−20%)</span>
                    </button>
                    {!showHint && (
                      <button
                        onClick={onShowHint}
                        className="flex-1 py-2.5 bg-[#FFB300]/10 border border-[#FFB300]/30 hover:bg-[#FFB300]/20 text-[#FFB300] rounded-md font-semibold transition-colors text-sm"
                      >
                        View Hint
                      </button>
                    )}
                    <button
                      onClick={nextChallenge}
                      className="py-2.5 px-4 bg-[#111111] border border-[#2A2A2A] hover:bg-[#1A1A1A] text-[#6B7280] rounded-md transition-colors text-sm"
                    >
                      Skip
                    </button>
                  </div>
                  <button
                    onClick={() => { setChallengeView('list'); setPhase('attempt'); setResult(null); setTimeLeft(10); setAttempts(0); }}
                    className="w-full py-2 text-[#6B7280] hover:text-[#ECECEC] text-sm transition-colors"
                  >
                    ← Back to Module List
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShortcutMasterModal
        open={showMasterModal}
        onClose={() => setShowMasterModal(false)}
      />
    </div>
  );
}
