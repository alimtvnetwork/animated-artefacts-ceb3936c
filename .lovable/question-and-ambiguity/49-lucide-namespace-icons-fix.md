# 49 — Lucide tree-shaking: ROOT CAUSE found and fixed

## Status: ✅ resolved

## TL;DR
`src/slides/components/Capsule.tsx` imported the lucide `icons` namespace
(`import { icons as lucideIcons } from 'lucide-react'`) for runtime
PascalCase-name → component resolution. That single namespace import was
a `import * as icons` re-export, which Rollup cannot tree-shake — pulling
all 1540 lucide icons into the bundle regardless of how clean every other
import was.

The per-icon Vite plugin (#48) was working perfectly — but its work was
defeated by this one namespace import.

## What changed
- New `src/slides/components/lucideDynamic.ts`: curated allow-list of
  ~50 PascalCase icons covering every capsule.icon used across decks.
  Each is a per-icon deep import (`lucide-react/dist/esm/icons/<name>.js`).
  Exports `resolveLucideIcon(name?)`.
- `src/slides/components/Capsule.tsx`: dropped `import { icons as lucideIcons }`,
  now uses `resolveLucideIcon` from the new module.
- `src/types/lucide-deep.d.ts`: ambient module declaration for
  `lucide-react/dist/esm/icons/*.js` so TS resolves deep imports.
- `vite.config.ts` `manualChunks` rule for `lucide-react` restored
  (briefly tried removing — made it worse: lucide migrated into the main
  app chunk and main went 846K → 1551K). Keeping the rule isolates the
  ~50-icon chunk for long-cache.

## Bundle impact (production build)
| Chunk | Before | After | Δ |
|---|---|---|---|
| `vendor-lucide-*.js` raw | 672 KB | **46 KB** | **-626 KB (-93%)** |
| `vendor-lucide-*.js` gzip | 115 KB | **9 KB** | **-106 KB (-92%)** |
| Icons present in chunk | 1540 | **113** | -1427 |

Used icons in chunk: Capsule allow-list (~50) + ambient registry (~28)
+ UI primitives (Check, ChevronDown, X, etc.) + page-specific (Settings,
Trash2, etc.). All real, all referenced.

## Cumulative perf-pass total (since #46)
- Initial download was: main JS 2277 KB / gzip 600 KB
- Initial download now: main JS 866 KB + vendor-lucide 46 KB = 912 KB
  / gzip 266 + 9 = 275 KB
- **-60% raw, -54% gzip** on initial download.

## How to add new capsule icons
Add the deep import + entry to `CAPSULE_ICON_REGISTRY` in
`src/slides/components/lucideDynamic.ts`. Unknown names render without an
icon (existing fallback). One file to edit; no plugin invalidation.

## Files touched
- created `src/slides/components/lucideDynamic.ts`
- created `src/types/lucide-deep.d.ts`
- created `.lovable/question-and-ambiguity/49-lucide-namespace-icons-fix.md`
- edited `src/slides/components/Capsule.tsx`
- bumped `.lovable/question-and-ambiguity/task-counter.md` → 11/40
