---
name: strict-types-dashboard
description: Local-only `bun run report:strict` script that counts tsc errors, tracked ESLint errors (no-explicit-any + no-unsafe-*), and informational `unknown` usages by file, then appends a JSON history entry to `metrics/strict-types-history.json` for trend tracking. Idempotent on the same git SHA.
type: feature
---

## What
v0.171 added a local strict-types dashboard. No CI, no app UI, no PR comment — purely a developer tool.

## Run it
```
bun run report:strict
```

Exits non-zero if there are tsc errors or tracked ESLint errors, so it can be wired into a pre-commit hook later if desired.

## What it counts

| Metric | Source | Action on increase |
|---|---|---|
| TS strict errors | `bunx tsc -p tsconfig.app.json --noEmit` | Fail (exit 1) |
| ESLint errors | `bunx eslint . --format json`, filtered to `@typescript-eslint/no-explicit-any` + `no-unsafe-{assignment,member-access,call,return}` | Fail (exit 1) |
| `unknown` usages | regex scan of `src/**/*.{ts,tsx}` (excl. `components/ui/**` + `*.test.*`), comments + strings stripped | Informational only — `unknown` is allowed by policy |

## Output
- Pretty stdout: per-file breakdown (top 15 for tsc/eslint, top 10 for unknown), totals, delta vs last entry (`+N` red, `-N` green, `(no change)`, `(first run)`).
- Appends to `metrics/strict-types-history.json`: `{ timestamp, sha, totals, byFile }`.
- Same git SHA replaces the most-recent entry instead of duplicating (idempotent).

## Files
- `scripts/report-strict-types.ts` — the script
- `metrics/strict-types-history.json` — append-only trend history (committed to repo)
- `package.json` script entry: `report:strict`

## Policy companions
- `.lovable/memory/features/ci-strict-types.md` — CI workflow + ESLint config
- `spec/architecture/typescript-unknown-policy.md` — when `unknown` is/isn't OK

## When the script surfaced regressions
First run on v0.171 caught 11 ESLint errors in `motionPreferences.ts` + `DeckMenu.tsx` that the regular `bun run lint` had silently passed (a stale typed-lint worker). The script normalizes the lint result by always parsing JSON output, so these can't slip through again.
