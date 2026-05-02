# Blind-AI Walkthrough

For each subsystem: would a blind AI given only the spec produce correct output? Score 0–10.

| # | Subsystem | Verdict | Top ambiguities (≤3) | Most likely wrong guess | Confidence |
|---|---|---|---|---|---|
| 01 | slide-types | partial | (a) addendum 29 vs catalog 17 — which is canonical now? (b) where `densityCheck` is asserted | Treats addendum types as already-shipped and emits decks the runtime can't load | 7 |
| 02 | animation-system | yes | (a) spring constants for count-up | Picks framer-motion default spring instead of repo-tuned | 8 |
| 03 | navigation-and-url | yes | none material | Adds React-Router `<Outlet>` boilerplate that isn't needed | 9 |
| 04 | share-and-deep-link | yes | (a) full-deck URL format (root vs `/1`) | Shares `?slide=N` instead of `/N` | 8 |
| 05 | click-reveal | partial | (a) parent capsule trigger contract; (b) #32 surface | Builds inline modal instead of routed slide | 6 |
| 06 | controller | yes | (a) hover-reveal threshold (px / ms); (b) TopRight offset | Wrong delay (300ms instead of 150ms) | 8 |
| 07 | branding | yes | (a) which theme appearance triggers light wordmark | Imports logo PNG directly, breaking theme swap | 9 |
| 08 | typography-and-tokens | yes | (a) density caps not yet runtime-enforced | Writes paragraph copy thinking caps are advisory | 7 |
| 09 | import-export-json | partial | (a) no `validateAgainstCatalog` — silent drift possible | Ships deck with stale enum value | 6 |
| 10 | audio-and-narration | partial | (a) per-slide sound override location in JSON | Uses `<audio>` tag instead of `sound.ts` API | 6 |
| 11 | keyboard-and-accessibility | yes | (a) which roles consume arrow keys | Lets arrows steal focus from inputs | 8 |
| 12 | reduced-motion | yes | none material | Forgets count-up snap (Phase 3) | 9 |
| 13 | static-deploy-and-asset-copy | yes | (a) artifact naming convention | Names zip without tag | 9 |
| 14 | per-project-spec-workflow | yes | (a) `slides.json` ordering rule | Sorts alphabetically instead of manifest order | 8 |
| 15 | mermaid-and-erd | partial | (a) Mermaid version; (b) reduced-motion behaviour | Lets Mermaid auto-pan defeating reduced-motion | 6 |
| 16 | equation-rendering | partial | (a) build-time vs runtime split; (b) `termIds` ↔ KaTeX span mapping | Adds runtime KaTeX dep, blowing bundle | 5 |
| 17 | number-animation | partial | (a) spring constants; (b) integer vs float `to` | Renders floats with too many decimals | 6 |
| 18 | data-table | partial | (a) `DataTableSlide` vs existing `TableSlide` — which to pick | Picks `TableSlide` and ignores caps | 5 |

**Aggregate:** spec is strong on shipped subsystems (01–14: avg 7.6) and weaker on Phase-3 work (15–18: avg 5.5). Closing the Phase-3 implementation will move 15–18 to ≥8.
