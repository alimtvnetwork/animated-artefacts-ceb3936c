# 57 — a11y contrast CLI revival (Window 2 / task 21)

**Date:** 2026-05-01
**Trigger:** `next a11y contrast` — WCAG 1.4.3 sweep across all 21 slide types.

## What I found

The 1.4.3 sweep was effectively already complete:
- `src/test/deckContrastAudit.test.ts` runs 127 (slide × token × theme) cells in CI.
- `src/test/capsuleContrast.test.ts` runs 81 capsule (color × theme) cells.
- `src/test/chromeContrast.test.ts` runs 29 controller-chrome cells.
- `src/test/stepTimelineGithubLightContrast.test.ts` adds 11 step-row cells.
- All 248 tests pass on this commit (post #50 capsule sweep).

The CLI counterpart `bun audit:contrast` was the only gap: it threw `TypeError: undefined is not a function` because `src/slides/themes.ts` calls `import.meta.glob`, which is a Vite-only helper. Running the script under bare Bun crashed before the audit could start.

## What I changed

`src/slides/themes.ts` — guarded the two `import.meta.glob` calls behind a runtime check. When Vite isn't present (Bun CLI), `viteGlob` resolves to `undefined` and both overlay maps fall back to `{}`. Vitest + Vite dev/build are unaffected (they always provide `import.meta.glob`).

## Result

- `bun audit:contrast`: ✓ All 1053 cells pass WCAG AA (9 themes × 9 slide-tokens × 3 viewports).
- `bunx vitest run deckContrastAudit capsuleContrast`: 208/208 ✓.

## Ambiguity

None — the horizon ("a11y contrast sweep") had a clear, well-tested target surface and the existing infra already satisfied it. The only real action was unblocking the advisory CLI so it joins `audit:motion` as a runnable signal.
