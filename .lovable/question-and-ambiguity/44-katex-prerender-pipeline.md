# 44 — KaTeX prerender pipeline for EquationSlide

**Date:** 2026-05-01
**Window:** 2 (entry 06)
**Outcome:** Implemented. Closes the last deferred dep from `audit/remediation-plan.md`.

## What changed

- `bun add -d katex @types/katex` (dev-only).
- `scripts/prerender-equations.ts` — walks `front-end/project/<slug>/data/slides/*.json`, finds `EquationSlide` entries with a `tex` source, renders via `katex.renderToString({ displayMode: true, throwOnError: false, output: 'html', strict: 'ignore' })`, writes `content.equationHtml` + normalised `content.termIds`. Idempotent.
- HTML shape: `<div class="equation-katex">{KaTeX}</div><div class="equation-stagger-overlay" aria-hidden>{<span class="equation-term" data-term-id="…" style="animation-delay:…">tok</span>…}</div>`. The KaTeX block is the visible equation; the overlay is offscreen-clipped (1×1 clip-rect) and exists only to drive the existing 80ms stagger keyframes.
- `package.json`: new `prerender:equations` script, and `prebuild` now chains `prerender:equations && preflight` so production builds always have baked HTML.
- `src/main.tsx`: imports `katex/dist/katex.min.css` so KaTeX glyphs render correctly at runtime.
- `src/index.css`: `.equation-stagger-overlay` clipped, `.equation-katex` inherits font-family. Reduced-motion override unchanged (still suppresses the term stagger).
- Sample deck slide 43 now carries baked `equationHtml` for `A = P (1 + r)^t` (6 whitespace tokens → 6 termIds; the stale 4-id author list was overwritten on first run, which is the spec'd behaviour).

## What was NOT changed

- `EquationSlide.tsx` already preferred `c.equationHtml` over the runtime tokenizer fallback, so no component changes were needed.
- No runtime KaTeX dep — only the CSS file is bundled.

## Files

- created `scripts/prerender-equations.ts`
- created `.lovable/question-and-ambiguity/44-katex-prerender-pipeline.md`
- edited `package.json` (deps + scripts)
- edited `src/main.tsx` (KaTeX CSS import)
- edited `src/index.css` (overlay clip, katex font-family)
- edited `front-end/project/sample/data/slides/43-equation.json` (baked output)
