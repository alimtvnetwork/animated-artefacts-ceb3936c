## 18 — Option C migration: front-end/project + theme overlays + slide-template defaults

**Asked:** "Option C" — full migration to the spec'd folder structure.

**Decisions:**
- Decks moved from `spec/26-slide-definitions/<slug>/{deck.json, NN-name.json, NN-name.md}` →
  - `front-end/project/<slug>/data/slides.json` (manifest: `Name` + `config` + `Slides[]`)
  - `front-end/project/<slug>/data/slides/NN-name.json`
  - `front-end/project/<slug>/spec/NN-name.md`
- Manifest `Slides[]` carries `{ title, path: "./slides/NN-name.json" }` per architecture.md §2.1.
- Loader globs `front-end/project/*/data/slides.json` + `slides/*.json` and reconstructs the legacy DeckSpec by flattening `manifest.config` (preserves assets/meeting/theme/assetConstraints unchanged).
- `front-end/themes/<id>/{colors,themes}.json` overlays apply at module-init in `themes.ts` — but **strictly update existing preset vars only**; introducing new CSS variables is rejected (would silently override `index.css` defaults — caused capsule-ink contrast regressions for the new themes during first attempt).
- `front-end/slide-template/<Type>.json` `defaults.transition` / `defaults.textAnimation` are applied per slide at load time when the slide JSON omits those fields. Explicit slide values win.
- Old `spec/26-slide-definitions/` directory removed; `scripts/preflight.ts` and `scripts/audit-click-reveal.ts` updated to walk `front-end/project/<slug>/data/slides/`.

**Pre-existing test failures NOT caused by this change** (left as-is):
- `slideFixtures.test.ts` — missing `StepsChain3DSlide` fixture entry.
- `transitionTimingByType.test.ts` reduced-motion edge case.
- `capsuleContrast.test.ts` — undefined per-theme overrides for `violet`/`rose`/`sky`/`teal` capsules on several themes.
- `brandChromeInheritance.test.ts` — historical 218px sweet-spot.

**Verified:** `contracts.test.ts`, `themeResolution.test.ts`, `spec-parity.test.ts` all green (35/35).
