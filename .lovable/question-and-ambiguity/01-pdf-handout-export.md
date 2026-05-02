# 01 — PDF Handout Export: Route + Auto-Print Decisions

- Task: "Add a one-click PDF export that renders my deck with the same animations disabled (but with the final states) for clean handouts."
- Spec refs: new (no prior spec); related: `src/index.css` `@media print` block (lines 782–822), `data-export-mode` attribute already wired for `BrandStrip`, `motionPreferences.ts` reduced-motion flatteners, `ShareMenu.tsx`.
- Ambiguity: three under-specified design points.

## Point A — Route name

Options:

1. **`/handout`** (chosen) — short, descriptive, fits the conversational frame ("clean handouts"). Pros: discoverable URL the user could share; clear intent; doesn't collide with any existing route. Cons: bikeshed; some teams say "PDF" or "export".
2. `/export/pdf` — more explicit. Pros: groups future exports (`/export/pptx`). Cons: longer; deeper hierarchy for a single feature.
3. `/print` — matches `window.print()` mental model. Pros: tiny. Cons: ambiguous when we add other export types later (PNG, PPTX).

**Recommendation: `/handout`** — best signal for the "clean stacked-deck PDF" use case. Easy to rename later.

## Point B — Auto-print trigger

Options:

1. **`?print=1` query opts in to auto-print** (chosen). Pros: single click from ShareMenu (`/handout?print=1`) → save dialog with no extra step; visiting `/handout` directly gives a scrollable preview without surprise dialogs. Cons: query-string contract is implicit; needs README/spec note.
2. Always auto-print on `/handout` mount. Pros: simpler. Cons: hostile UX if the user navigates there to preview; no way to inspect the static handout without dismissing the dialog every time.
3. Render an "Export PDF" button on the handout page itself. Pros: explicit. Cons: adds chrome that has to be hidden in print; user pays an extra click for the very feature the menu item promises.

**Recommendation: query opt-in** — preserves both "preview" and "one-click" flows from the same route.

## Point C — Animation disable mechanism

Options:

1. **Dual-layer kill via `data-export-mode` + `@media print`** (chosen). CSS `*` selector zeros animation/transition durations; `motionPreferences.ts` already flattens Framer variants when `data-export-mode` is set. Pros: covers both CSS-driven (ambient float, lattice glow) AND JS-driven (Framer entrance variants) motion in one mode flag; reuses existing print plumbing. Cons: opacity-only fades during normal interaction would technically still run for ~10ms (because flatten leaves a `duration: 0.01` cross-fade) — invisible in print but a purist could argue for true 0.
2. Remove the `motion.div` wrappers entirely on the handout route. Pros: pixel-perfect freeze. Cons: would require parallel "static" versions of every slide type or invasive runtime conditionals — large surface for regressions in the live deck.
3. Snapshot via headless-Chrome screenshot. Pros: bit-perfect rasterization. Cons: requires server/runtime tooling outside the SPA; defeats the "one-click in-app" premise.

**Recommendation: option 1** — same mode flag already used for guides + brand-strip print hardening; adds zero new state and no invasive component changes. The 10ms residue is below human perception and gone in `@media print` (which sets `0s`, not `0.01s`).

## Action taken

- Created `src/pages/HandoutPage.tsx` mounting every linear slide via `<SlideStage>` in a stacked 16:9 frame; auto-prints when `?print=1` is present.
- Added `/handout` route in `src/App.tsx`.
- Extended `src/index.css` with: animation-kill rule for `data-export-mode` and `@media print`; `.handout-root/.handout-page/.handout-stage/.handout-page-footer` layout; `@page A4 landscape; margin: 0` + `break-after: page` for one-slide-per-page pagination.
- Updated `src/slides/motionPreferences.ts` so `prefersReducedMotion()` returns `true` under `data-export-mode="true"` — Framer variants flatten to opacity-only, matching the CSS animation kill.
- Added "Export PDF (handout)" entry to `ShareMenu` opening `/handout?print=1` in a new tab.

## Reversible?

Yes. Removing the route + ShareMenu entry + the new CSS block + the `data-export-mode` branch in `motionPreferences.ts` returns to v0.118 behavior. No persisted state, no schema change, no DB migration.

## Follow-ups the user may want to weigh in on

- Should the handout include the BrandHeader on every page, or only on slide 1? Currently inherits whatever each slide declares (matches live deck).
- Add a deck-cover page first (deck name + presenter + date)? Out of scope this loop; would be a one-line addition before the `linearSlides.map`.
- Should click-reveal sub-slides be included? Currently NO (uses `linearSlides` which excludes them). Could add a `?include=reveals` query later.
