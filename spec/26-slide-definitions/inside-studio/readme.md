# Inside the Studio — deck spec

**Slug:** `inside-studio` · **Slides:** 23 main + 1 click-reveal · **Theme:** noir-gold

Real, end-to-end deck exercising **every one of the 23 slide types** in
`SlideType` (plus one click-reveal off-flow target for the 24th payload).
Authored 2026-05-01.

## Narrative arc

| # | Type | Beat |
|---|---|---|
| 1 | TitleSlide | Hero open — "Inside the Studio" |
| 2 | SectionDividerSlide | **Pillar I — Craft** |
| 3 | KeywordSlide | "Clarity · Cadence · Restraint" |
| 4 | CapsuleListSlide | Six craft moves; capsule 4 has `clickRevealSlide` |
| 5 | MetricGridSlide | 4 receipts (decks · NPS · on-time · drift) |
| 6 | MiddleTitleSlide | **Pillar II — Process** |
| 7 | StepTimelineSlide | 5-step engagement arc |
| 8 | FocusTimelineSlide | Spec week up close |
| 9 | AdvanceStepSlide | Build week, four habits |
| 10 | StepsChain3DSlide | 4-phase cinematic chain (bullets[] only) |
| 11 | SectionDividerSlide | **Pillar III — Proof** |
| 12 | ImageSlide | Studio at work |
| 13 | NumberCalloutSlide | 84% recall, easeOutQuint |
| 14 | EquationSlide | `R = C·(1+r)^t` |
| 15 | TableSlide | Engagement tiers comparison |
| 16 | DataTableSlide | 5-quarter trend (density-capped) |
| 17 | CodeBlockSlide | A slide is just a JSON |
| 18 | BoxDiagramSlide | Studio toolchain |
| 19 | ERDiagramSlide | Deck-authoring graph |
| 20 | DatabaseDiagramSlide | Audit-log schema |
| 21 | LayoutSlide | Two-column promise |
| 22 | ChecklistSlide | Pre-flight (6 items, gold bar) |
| 23 | QrMeetingSlide | Meet the studio |
| 24 | (CapsuleListSlide, isClickReveal=true) | Off-flow detail for capsule 4 |

## Motion variety

Transitions used: **FadeIn ×9, SlideIn ×3, PushIn ×5, PushLeft ×2, PushRight ×2** — all 5 variants exercised.
Text animations used: **FadeIn ×11, Stagger ×9, Bounce ×2, SlideUp ×2** — all 4 exercised.

## Validation
24/24 pass `validateSlide` + 0 density violations (verified via runtime
`SLIDE_CONTENT_CONTRACTS` zod registry, 2026-05-01).

## Open URL
`/1?deck=inside-studio`
