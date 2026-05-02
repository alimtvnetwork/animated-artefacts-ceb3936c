# AI Blind Score

Per-subsystem blind-AI score × weight (from `00-methodology.md`). Score 0–10.

| # | Subsystem | Score | Weight | Score×Weight |
|---|---|---:|---:|---:|
| 01 | slide-types | 7 | 12 | 84 |
| 02 | animation-system | 8 | 10 | 80 |
| 03 | navigation-and-url | 9 | 8 | 72 |
| 04 | share-and-deep-link | 8 | 4 | 32 |
| 05 | click-reveal | 6 | 6 | 36 |
| 06 | controller | 8 | 6 | 48 |
| 07 | branding | 9 | 6 | 54 |
| 08 | typography-and-tokens | 7 | 8 | 56 |
| 09 | import-export-json | 6 | 8 | 48 |
| 10 | audio-and-narration | 6 | 5 | 30 |
| 11 | keyboard-and-accessibility | 8 | 5 | 40 |
| 12 | reduced-motion | 9 | 5 | 45 |
| 13 | static-deploy-and-asset-copy | 9 | 4 | 36 |
| 14 | per-project-spec-workflow | 8 | 5 | 40 |
| 15 | mermaid-and-erd | 6 | 2 | 12 |
| 16 | equation-rendering | 5 | 2 | 10 |
| 17 | number-animation | 6 | 2 | 12 |
| 18 | data-table | 5 | 2 | 10 |
| **Σ** |  |  | **100** | **745** |

**Weighted score:** `745 / 100 = 7.45 / 10`

## Interpretation
- ≥9 = spec is unambiguous and complete.
- 7–9 = competent blind-AI output with rare edits needed.
- 5–7 = expect 2–3 corrective rounds.
- <5 = spec gap; rewrite before delegating.

**Verdict.** 7.45 means a blind AI could ship the deck in 1–2 rounds for shipped subsystems, but Phase-3 work (15–18) drags the average and would need spec tightening as part of implementation. The recommended floor of **8.0** is reachable post Phase 3 by:
1. Implementing the 4 new types (auto lifts 15–18 to ≥8).
2. Adding `validateAgainstCatalog` (lifts 09 to 8).
3. Documenting per-slide sound override JSON path (lifts 10 to 8).
