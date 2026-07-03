# GridCrafters

A gamified Excel learning platform built by Hyatt — teaches keyboard shortcuts and formatting skills through interactive challenges with an in-browser Excel simulator.

## Run & Operate

- `pnpm --filter @workspace/gridcrafters run dev` — run the frontend (port 22371)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter routing, framer-motion, lucide-react
- State: localStorage only (no backend calls from frontend)
- API: Express 5 (health check only, not used by frontend)
- Build: Vite (frontend)

## Where things live

- `artifacts/gridcrafters/src/` — all frontend source
  - `src/hooks/useGameState.ts` — localStorage state hook (all game state)
  - `src/data/shortcuts.ts` — all 53 shortcuts + challenge scenarios
  - `src/data/formatting.ts` — 8 formatting challenges + technique cards
  - `src/components/ExcelSimulator.tsx` — shared Excel simulator component
  - `src/components/Sidebar.tsx` — fixed sidebar with logo/nav/XP card
  - `src/components/KeyDisplay.tsx` — keyboard key cap display
  - `src/pages/` — Dashboard, ShortcutMasters, FormattingKings, Analyst, Leaderboard, Profile
- `lib/api-spec/openapi.yaml` — API contract (health only)

## Architecture decisions

- Frontend-only: all game state lives in localStorage via `useGameState` hook, no API calls needed
- ExcelSimulator is a shared component used by both Shortcut Masters and Formatting Kings modules
- Alt key sequences use a ref-based state machine (`seqBuf`), not chord detection
- Keydown listener uses `{ capture: true }` to intercept browser shortcuts before they fire
- Dark mode is forced (adds `dark` class to `<html>` on startup, no toggle)

## Product

GridCrafters has 6 pages:
- **Dashboard** — welcome hub with module progress, badges, recent activity, streak
- **Shortcut Masters** (`/shortcuts`) — 3 levels (Rookie/Intermediate/Advanced), 53 shortcuts total, Study + Challenge modes with live Excel simulator
- **Formatting Kings** (`/formatting`) — 3 levels, 8 formatting challenges, side-by-side target vs your work
- **Real Analysts** (`/analyst`) — Coming Soon placeholder
- **Leaderboard** (`/leaderboard`) — Coming Soon with mock data
- **Profile** (`/profile`) — XP, stats, badges, activity log

## User preferences

- Dark mode only, no toggle
- Colors: blue #00B4D8, green #4CAF50, red #F44336
- Brand: "GridCrafters" + "Made by Hyatt" in sidebar
- No mascots, no emoji illustrations in UI

## Gotchas

- Always use `{ capture: true }` on keydown in challenge mode — prevents browser from intercepting Alt/Ctrl combos
- Alt sequences: use the `seqBuf` ref state machine, never treat as a chord
- `selectedCells` is always `Set<string>`, never a single string
- Simulator background is white inside the dark shell (exact Excel look)
