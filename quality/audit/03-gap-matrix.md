# 03 — Gap Matrix

Spec ↔ implementation deltas across 18 subsystems. Detail in `subsystems/NN-*.md`.

| # | Subsystem | Spec | Impl | Severity |
|---|---|---|---|---|
| 01 | slide-types | 17 (catalog) + 4 (addendum 29) = 21 | 17 | **Major** (4 types specced not built) |
| 02 | animation-system | 5 transitions + 4 text + 3 step variants + count-up | 5 + 4 + 3, no count-up | **Major** (count-up missing) |
| 03 | navigation-and-url | flat `/N`, alias `/slide/N`, `?slide=N`, deep link | implemented | None |
| 04 | share-and-deep-link | full-deck OR current-slide URL | implemented | None |
| 05 | click-reveal | hidden slides, audit page, parent capsule trigger | implemented (`/click-reveal-audit`) | Minor (one ambiguity in #32 unresolved) |
| 06 | controller | hover-reveal pill, BottomCenter / TopRight | implemented; reference image present | None |
| 07 | branding | Riseup Asia, no Lovable, dark Noir & Gold, BrandLogo | enforced; constraint probes live | None |
| 08 | typography-and-tokens | Ubuntu / Inter, weight-shadow tokens, narrow-idea caps | tokens shipped; density caps not asserted | Minor |
| 09 | import-export-json | CATALOG.json mirror, cross-project import contract | doc only; no `validateAgainstCatalog()` helper | Minor |
| 10 | audio-and-narration | per-slide sound triggers, whoosh, reduced-motion mute | implemented in `sound.ts` | None |
| 11 | keyboard-and-accessibility | roving tabindex, arrow nav, slide jump | implemented (#17) | None |
| 12 | reduced-motion | every motion gated by `prefers-reduced-motion` | enforced + tests | None |
| 13 | static-deploy-and-asset-copy | `dist/` zip+tar+SHA, release attach | implemented (#27) | None |
| 14 | per-project-spec-workflow | `front-end/project/<slug>/{data,spec}` + manifest | implemented (#18); `sample` deck not migrated | Minor |
| 15 | mermaid-and-erd | `DatabaseDiagramSlide` mermaid + token theme | not built; spec only | **Blocking** (Phase 3) |
| 16 | equation-rendering | `EquationSlide` build-time KaTeX | not built; spec only | **Blocking** (Phase 3) |
| 17 | number-animation | `NumberCalloutSlide` + count-up easings + tokens | not built; spec only | **Blocking** (Phase 3) |
| 18 | data-table | `DataTableSlide` density-capped sibling | not built; existing `TableSlide` ≠ narrow contract | **Blocking** (Phase 3) |

**Counts:** Blocking 4 · Major 2 · Minor 4 · None 8.

The 4 Blocking entries are all the Phase-3 runtime work already itemised in `plan.md` and are intentionally tracked as gaps until shipped.
