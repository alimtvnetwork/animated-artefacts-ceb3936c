# TypeScript `unknown` policy

> **TL;DR.** `any` is **banned**. `unknown` is **allowed** — but only as a
> deliberate boundary type that you narrow before use. Never as a substitute
> for taking the time to write the right type.

This doc is the canonical rule set for `unknown` in this codebase. CI enforces
the `any` ban (see `.github/workflows/ci.yml` + `eslint.config.js`); this doc
enforces the *spirit* of `unknown` via review.

Companion memory: `.lovable/memory/features/ci-strict-types.md`.

---

## The two-line rule

1. **Use `unknown`** when a value crosses a trust boundary into your code
   (caught error, parsed JSON, message from another window, third-party
   payload, generic library input).
2. **Narrow it before use** with a runtime check — `instanceof`, `typeof`,
   a discriminator, or a Zod / schema parse. Never `as SomeType` to skip
   the narrowing.

If you can't satisfy both, you don't have an `unknown` problem — you have a
"didn't write the right type" problem. Write the type.

---

## Where `unknown` IS the right answer

### 1. `catch (e)` — always

Under `strict: true` (which we run, see `tsconfig.app.json`), TypeScript types
caught errors as `unknown` automatically (`useUnknownInCatchVariables`). Don't
fight it. Narrow.

```ts
// ✅ DO — narrow before reading anything off the error
try {
  await doThing();
} catch (e) {
  // `e` is `unknown` here.
  if (e instanceof Error) {
    console.error(e.message, e.stack);
  } else {
    console.error('Non-Error thrown:', e);
  }
}

// ✅ DO — extract a small helper if you do this a lot
function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Unknown error';
}

// ❌ DON'T — type-assert your way out
try { /* … */ } catch (e) {
  const err = e as Error;       // lying — `e` may not be an Error
  console.error(err.message);   // crashes if e was a string
}

// ❌ DON'T — re-introduce `any`
try { /* … */ } catch (e: any) { // banned by lint + CI grep guard
  console.error(e.message);
}
```

### 2. Parsed JSON / external payloads — narrow with Zod

We already use Zod (`src/slides/contracts.ts`). Type the raw input as
`unknown`, then `parse()` to get a precisely-typed value.

```ts
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});
type User = z.infer<typeof UserSchema>;

// ✅ DO — `unknown` at the boundary, precise type after the parse
async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  const raw: unknown = await res.json();
  return UserSchema.parse(raw); // throws on bad shape; returns User
}

// ✅ DO — same pattern for localStorage / sessionStorage
function readPreference(): User | null {
  const raw: unknown = JSON.parse(localStorage.getItem('user') ?? 'null');
  const result = UserSchema.safeParse(raw);
  return result.success ? result.data : null;
}

// ❌ DON'T — trust the wire
const data = await res.json() as User; // a single API change silently corrupts state
```

For unknown payloads where Zod is overkill (small one-offs), hand-write a
type guard:

```ts
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}
```

### 3. Cross-context messages — `MessageEvent`, `BroadcastChannel`,
   `postMessage`, `window.addEventListener('message')`

The data came from another window, frame, worker, or tab. Treat it as hostile.

```ts
// ✅ DO — type the wire as unknown, narrow with a discriminator
type SyncMessage =
  | { type: 'nav'; dir: 'next' | 'prev' | 'jump'; n?: number }
  | { type: 'slide'; n: number };

function isSyncMessage(v: unknown): v is SyncMessage {
  if (!v || typeof v !== 'object') return false;
  const t = (v as { type?: unknown }).type;
  return t === 'nav' || t === 'slide';
}

window.addEventListener('message', (e) => {
  if (!isSyncMessage(e.data)) return;
  // e.data is now SyncMessage
});
```

This is exactly the pattern used in `src/pages/SlideDeckPage.tsx` for the
presenter sync channel.

### 4. Generic library boundaries you genuinely can't type

Rare. Most of the time you can write a generic. But if you're wrapping a
library that hands you a value whose shape varies by call-site config
(plugin systems, dynamic imports, JSON-driven dispatch), `unknown` plus a
runtime guard is correct.

---

## Where `unknown` is the WRONG answer

| Smell | What you should do instead |
|---|---|
| Function parameter you control end-to-end | Write the precise type |
| Internal state, props, return type of your own function | Write the precise type |
| You'd immediately `as SomeType` after | That's `any` in disguise — write the type or narrow properly |
| Avoiding writing a discriminated union | Write the union; the compiler will help |
| You don't know what shape comes back from your own code | The bug is upstream — fix the source's return type |

```ts
// ❌ DON'T — `unknown` to dodge writing the type
function processItems(items: unknown[]) {
  return items.map((i) => (i as { name: string }).name);
}

// ✅ DO — write what you actually accept
interface Item { name: string }
function processItems(items: Item[]) {
  return items.map((i) => i.name);
}
```

---

## How CI enforces this

1. **`any` ban** — `eslint.config.js` sets
   `@typescript-eslint/no-explicit-any: error`. CI runs `bun run lint` and
   fails on any violation.
2. **Grep guard** — `.github/workflows/ci.yml` greps `src/**` for `: any`,
   `<any>`, `as any` so a single-line ESLint disable still trips CI.
   Excludes `src/components/ui/**` (shadcn primitives) and `src/test/**`
   (fixtures legitimately need `any` for negative-path cases).
3. **Strict TypeScript** — `tsconfig.app.json` runs `strict: true` plus
   explicit `noImplicitAny` and `strictNullChecks`. Both project files
   (`tsconfig.app.json` AND root `tsconfig.json`) carry the same flags so
   editor / ad-hoc `tsc --noEmit` runs see identical rules to CI.

`unknown` is **not** auto-banned because banning the type-safe escape hatch
pushes authors toward worse alternatives (lying with `as`, sneaking `any`
past the lint rule). Review enforces the *spirit* of this doc.

### Optional future tightening

If review surfaces too many "narrowed `unknown`" mistakes, we can add the
`@typescript-eslint/no-unsafe-*` family
(`no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`,
`no-unsafe-return`). They keep `unknown` legal but require narrowing at the
use site. Not enabled today — call it out in a PR if you think we need it.

---

## Checklist for reviewers

When you see `unknown` in a PR, ask:

- [ ] Does the value genuinely come from outside the trust boundary?
      (caught error, parsed JSON, cross-window message, third-party payload)
- [ ] Is it narrowed before use? (`instanceof`, `typeof`, type guard,
      Zod `.parse()` / `.safeParse()`)
- [ ] Is the narrowing close to the boundary, not 5 functions deep?
- [ ] Is there an `as` somewhere downstream that re-asserts a shape we
      never actually checked? (If yes — block the PR.)

If all four pass, `unknown` is doing its job. Approve.
