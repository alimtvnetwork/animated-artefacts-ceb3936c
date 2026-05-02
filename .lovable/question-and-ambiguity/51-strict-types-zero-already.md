# 51 — strict-types already at zero; remaining `unknown` is sanctioned

**Date:** 2026-05-01
**Trigger:** `next strict-types` horizon

## Snapshot
- `metrics/strict-types-history.json` latest entry: **tscErrors = 0, eslintErrors = 0, unknownUsages = 69**
- `unknownUsages` is labelled by `scripts/report-strict-types.ts` as
  *"informational — unknown is allowed"* and is **not** part of the strict-types
  zero target.

## Where the 69 live (and why they stay)
| File | Count | Reason |
|---|---|---|
| `src/slides/fixtures.ts` | 17 | `as unknown as SlideSpec` builds intentionally-invalid specs for validator negative tests. Removing would silently turn rejection tests into compile-time failures. |
| `src/slides/contracts.ts` | 7 | `validateSlide(raw: unknown)` and `Record<string, unknown>` rule predicates — runtime validation entry points; `unknown` is the correct surface type. |
| `src/slides/sync.ts` | 6 | `isSyncMessage(value: unknown): value is SyncMessage` — textbook type guard for cross-window `MessageEvent.data`. |
| `src/slides/textAnimations.ts` | 4 | Narrowing Framer Motion's loosely-typed `variants.animate.transition` object. |
| `src/lib/errors.ts` | 4 | Sanctioned `try/catch` helpers (`errorMessage`, `toError`, `isError`); the policy doc explicitly points here. |
| Misc (other files) | 31 | Same patterns: type guards, `JSON.parse` returns, `Record<string, unknown>` lookups. |

## Decision
**No code change.** Replacing any of these with concrete types would *weaken*
runtime safety (we'd be lying to the type system about externally-sourced
data). The audit metric correctly treats them as informational.

## Where the strict-types horizon goes next
The horizon is effectively **closed** until something regresses the tsc=0 /
eslint=0 line. Future work in this area would be:
- Tighten `report-strict-types.ts` to also count `as any` (currently only
  flagged via eslint rule, which is at 0).
- Add a CI gate that **fails** on any new tscError/eslintError instead of
  just trending it.
- Optional: split `unknownUsages` into "sanctioned" (in `errors.ts`,
  `*.test.ts`, type guards) vs. "ad-hoc" so the informational count drops
  to genuine debt only.

None of these are user-visible; deprioritised behind a11y/theme/analytics.

## Policy reference
`spec/21-slides-system/architecture/typescript-unknown-policy.md`
