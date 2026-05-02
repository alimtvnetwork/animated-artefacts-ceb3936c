# 52 — strict-types CI gate + caught regression on first run

**Date:** 2026-05-01
**Trigger:** `next ci-gate`

## What shipped
- Added a single CI step to `.github/workflows/ci.yml` between ESLint and the
  catalog drift guard:

  ```yaml
  - name: Strict-types zero gate
    run: bun run report:strict
  ```

  `scripts/report-strict-types.ts` already exits 1 when
  `tscErrors > 0 || eslintErrors > 0`, so no script change was needed.
  `unknown` usages stay informational per
  `spec/21-slides-system/architecture/typescript-unknown-policy.md`.

## Regression caught on first local run (the gate's whole point)
The previous strict-types history snapshot showed `eslintErrors = 0`. The
gate's first run reported **14 ESLint errors** that had landed since,
proving the audit metric was drifting silently:

| File | Errors | Pattern |
|---|---|---|
| `src/slides/transitionPresets.ts` | 8 | `JSON.parse(...)` returned `any` → unsafe member access on `.name`/`.durationMs`/`.easing` inside the type-guard predicate |
| `src/slides/controls/TransitionInspector.tsx` | 5 | `JSON.parse(text)` + `parsed?.presets` access on `any` (import flow) |
| `src/slides/controls/TransitionInspector.tsx` | 1 | `transition as any` cast on Framer's `motion.div` prop |
| `src/builder/NormalizeBulletsAction.tsx` | 1 | `const cloned: SlideSpec = JSON.parse(...)` (declared site assignment of `any`) |
| `src/components/RuntimeErrorOverlay.tsx` | 1 | `const reason = ev.reason` (PromiseRejectionEvent.reason is `any`) |

### Fixes (sanctioned-narrowing pattern)
- `transitionPresets.ts` — annotate `JSON.parse` result as `unknown`, narrow
  through `Record<string, unknown>` inside the existing predicate, drop the
  obsolete `as TransitionEasingName` cast (now flowing through narrowed type).
- `TransitionInspector.tsx` (import) — same `unknown` + `Record` narrowing for
  `parsed.presets`; preserves existing `Partial<TransitionPresetShape>`
  validation downstream.
- `TransitionInspector.tsx` (motion prop) — replaced `as any` with
  `as unknown as React.ComponentProps<typeof motion.div>['transition']`.
- `NormalizeBulletsAction.tsx` — flipped declared-type assignment to a trailing
  `as SlideSpec` cast so the cast site is explicit and lintable.
- `RuntimeErrorOverlay.tsx` — typed `const reason: unknown = ev.reason` so the
  subsequent `instanceof Error` narrowing is sound. (`reason` from
  `PromiseRejectionEvent` is `any` in lib.dom.d.ts.)

### Final state
- `tscErrors: 0` (no change)
- `eslintErrors: 0` (was silently `14`, now actually 0)
- `unknownUsages: 127` (informational; +6 vs. pre-fix because the new
  `unknown` annotations correctly replaced suppressed `any`)
- `metrics/strict-types-history.json` now has 9 entries, latest SHA bb3f1f4.

## Why this matters
Without this gate, the strict-types trend would keep saying "0 / 0" while
real lint errors silently piled up — exactly what happened. CI now refuses
to merge anything that regresses the line.

## Followups (not done)
- Pre-commit hook running the same script (out of scope; CI is the
  authoritative gate).
- Splitting `unknownUsages` into "sanctioned" vs. "ad-hoc" buckets so the
  informational count drops to genuine debt only.
