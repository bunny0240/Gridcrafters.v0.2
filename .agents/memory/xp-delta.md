---
name: XP delta / replay detection
description: How completeChallenge prevents XP double-counting on replays
---

`completeChallenge` in `db.ts` queries the existing row before upserting. If `status === 'completed'`:
- `awardAmount = 0` when `newXP <= existingBest` (no improvement, skip award)
- `awardAmount = newXP - existingBest` when improved (delta only)

First completion: the `.single()` query throws (PGRST116 row not found), caught silently → full `newXP` awarded.

**80% floor:** Optional `baseXP` param. If provided: `newXP = Math.max(Math.round(baseXP * 0.8), xpEarned)`.

**Idempotency key:** Each award includes `generateIdempotencyKey(userId, challengeId, 'complete')` which encodes timestamp. This prevents exact duplicate inserts (e.g. double-click) within the same second — the DB can enforce uniqueness on `idempotency_key` column.

**Why:** Without delta logic, replaying a completed challenge awards XP again, inflating the leaderboard and total_xp.
