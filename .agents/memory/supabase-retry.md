---
name: Supabase withRetry pattern
description: How to correctly wrap Supabase calls with retry logic in TypeScript
---

Supabase query builders are PromiseLike but NOT `Promise<T>` — they return `{ data, error }` on resolution and do NOT throw on DB errors.

**Correct pattern:**
```ts
async function withRetry(fn: () => Promise<void>, retries = 3): Promise<void> { ... }

// Caller wraps in async arrow, throws on error to trigger retry:
await withRetry(async () => {
  const { error } = await supabase.from('table').insert({...})
  if (error) throw error
})
```

**Why `() => Promise<void>`:** Using `() => PromiseLike<T>` or `() => Promise<unknown>` causes TypeScript to infer the wrong return type when destructuring `{ error }` from the result. Wrapping in an `async () => void` that explicitly throws avoids all type issues.

**Why not return the result:** withRetry is used for side effects (insert, upsert, rpc) that don't need the return value. Reads (select) should not use withRetry — they should use try/catch directly.
