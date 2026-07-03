---
name: ExcelSimulator Navigation Effects
description: How navigation effects (Ctrl+arrows, Ctrl+Home/End, select-all, fill-down) are wired in ExcelSimulator
---

Navigation effects that modify cell position/selection (NOT cell formatting) must be handled BEFORE the `const target = cells ?? selectedRef.current; setGrid(...)` block in `applyEffect`.

They use `activeCellRef.current` (a ref added alongside gridRef/selectedRef) instead of the `activeCell` state variable to avoid stale closures.

**Aliases:** The applyEffect switch case uses dual `case` labels so that shortcut IDs (e.g. `ctrl-right`) fire the same logic as semantic names (`jump-right-edge`). This lets challenge detection call `applyEffect(challenge.expectedEffect || challenge.id)` and get the correct visual.

**Universal shortcuts:** Ctrl+Home and Ctrl+End are added to processInput BEFORE the `!challenge?.keys` check so they work even during challenges (they're not challenge shortcuts). Ctrl+arrows are only in the non-challenge block since they ARE challenge shortcuts (ctrl-right/left/up/down in rookie level).

**Why:** The old code had navigation effects missing entirely, so Ctrl+→ challenges showed no visual cursor jump when the user pressed the correct key.
