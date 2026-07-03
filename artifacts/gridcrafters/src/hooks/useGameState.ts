import { useState, useEffect } from 'react';
import { fetchUserProgress } from '@/lib/db';

export interface GameState {
  shortcuts: Record<string, {
    status: 'studied' | 'completed';
    attempts: number;
    bestXP: number;
    hintsUsed: number;
  }>;
  formatting: Record<string, {
    status: 'studied' | 'completed';
    bestScore: number;
    attempts: number;
  }>;
  levelStudied: Record<string, boolean>;
  combo: number;
}

const defaultState: GameState = {
  shortcuts: {},
  formatting: {},
  levelStudied: {},
  combo: 0,
};

// ── Module-level pub/sub store ───────────────────────────────────────────────
// All useGameState() calls in the same tab share a single state so challenge
// completions are instantly visible across Sidebar, Dashboard, etc.
// Hydrated from Supabase on auth change — never reads or writes localStorage.
let _state: GameState = { ...defaultState };
const _listeners = new Set<(s: GameState) => void>();

function notify(): void {
  _listeners.forEach(fn => fn(_state));
}

export function updateGameState(updater: GameState | ((prev: GameState) => GameState)): void {
  _state = typeof updater === 'function' ? updater(_state) : updater;
  notify();
}

/**
 * Called from useAuth whenever the authenticated user changes.
 *
 * On sign-in: fetches shortcut_progress + formatting_progress from Supabase
 * and populates the shared in-memory store so all components see fresh data.
 *
 * On sign-out (userId = null): wipes state back to default so no stale data
 * leaks into the next login on the same browser.
 */
export async function initGameState(userId: string | null): Promise<void> {
  if (!userId) {
    _state = { ...defaultState };
    notify();
    return;
  }

  try {
    const { shortcuts, formatting } = await fetchUserProgress(userId);

    const shortcutMap: GameState['shortcuts'] = {};
    (shortcuts ?? []).forEach((r: any) => {
      shortcutMap[r.shortcut_id] = {
        status:    r.status as 'studied' | 'completed',
        bestXP:    (r.best_xp as number) ?? 0,
        attempts:  (r.attempts as number) ?? 0,
        hintsUsed: (r.hints_used as number) ?? 0,
      };
    });

    const formattingMap: GameState['formatting'] = {};
    (formatting ?? []).forEach((r: any) => {
      formattingMap[r.challenge_id] = {
        status:    r.status as 'studied' | 'completed',
        bestScore: (r.best_score as number) ?? 0,
        attempts:  (r.attempts as number) ?? 0,
      };
    });

    // A level is "studied" if any of its shortcuts/challenges exist in the DB
    const levelStudied: Record<string, boolean> = {};
    (shortcuts ?? []).forEach((r: any) => {
      if (r.level_name) {
        levelStudied[`shortcuts-${(r.level_name as string).toLowerCase()}`] = true;
      }
    });
    (formatting ?? []).forEach((r: any) => {
      if (r.level_name) {
        levelStudied[`formatting-${(r.level_name as string).toLowerCase()}`] = true;
      }
    });

    _state = { shortcuts: shortcutMap, formatting: formattingMap, levelStudied, combo: 0 };
    notify();
  } catch (err) {
    console.error('[initGameState]', err);
    _state = { ...defaultState };
    notify();
  }
}

export function useGameState(): [GameState, typeof updateGameState] {
  const [state, setState] = useState<GameState>(_state);

  useEffect(() => {
    setState(_state);
    _listeners.add(setState);
    return () => { _listeners.delete(setState); };
  }, []);

  return [state, updateGameState];
}

export function getLevelName(xp: number): string {
  if (xp < 500) return 'Rookie';
  if (xp < 2000) return 'Intermediate';
  if (xp < 5000) return 'Advanced';
  return 'Master';
}
