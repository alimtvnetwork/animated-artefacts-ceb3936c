---
name: navy-showcase worked-example deck
description: Reference deck (`spec/slides/navy-showcase/`) using `theme: "navy-blue"` end-to-end across 8 linear slides + 2 click-reveal children; exercises every reveal pattern (capsule/step/hotspot) and every animation knob shipped through v0.184.
type: feature
---

# navy-showcase deck (v0.185)

Second bundled deck, designed to be the canonical worked example for the
`navy-blue` theme. Companion to the noir `showcase` deck — same asset library,
different palette + fonts (Poppins body, JetBrains Mono code).

Open with `?deck=navy-showcase`.

## Slide map

| # | Slide                          | Type                | Showcases |
|---|--------------------------------|---------------------|-----------|
| 1 | title                          | TitleSlide          | Ambient icon scatter, brand-accent icons, white title on navy, Bounce text anim |
| 2 | pillars                        | CapsuleListSlide    | `cinematicCapsules` motion preset; **two reveal modes in one slide** — capsule[0] navigates to /50, capsule[1]/[2] use inline `expand` |
| 3 | engagement                     | StepTimelineSlide   | v3.3 cinematic steps + `stepAmbient` + slide-level `sound: { on: 'focus', kind: 'whoosh' }` + per-step `revealSlide: 50` on Step 2 |
| 4 | data-platform                  | LayoutSlide         | `card-grid-2x3` with all slot kinds — `card` (default + `accent` + `success` + `danger` variants), `codeblock` (SQL), `plain`. Also sets `gridPreset` to mirror the layout. |
| 5 | erd                            | ERDiagramSlide      | 3 entities + 2 relationships + `diagramExplanation` (auto-engages the 4/8 split). Zero color overrides — navy-blue's auto palette paints PK rows cyan, FK rows orange. |
| 6 | impact                         | MetricGridSlide     | 4-cell auto 2x2 grid + ghost `hotspots[0].revealSlide: 60` on the ARR cell |
| 7 | deploy-snippet                 | CodeBlockSlide      | shiki bash + `codeHighlightLines` 4-line pulse + `codeShowLineNumbers` + `codeCopyButton` + `codeCaption` |
| 8 | meeting                        | QrMeetingSlide      | Compact `meetingLabel` variant + `titleShimmer` |
| 50 | strategy-detail (click-reveal) | KeywordSlide        | Single child for **two** entrypoints (capsule on /2, step on /3); `parentSlide: 2` |
| 60 | arr-breakdown (click-reveal)   | CapsuleListSlide    | Hotspot-triggered child; `parentSlide: 6` |

## Three reveal patterns demonstrated

| Pattern             | Authored on               | Target |
|---------------------|---------------------------|--------|
| Capsule revealSlide | `capsules[0].revealSlide` on /2 | /50 |
| Step revealSlide    | `steps[1].revealSlide` on /3    | /50 |
| Hotspot revealSlide | `hotspots[0].revealSlide` on /6 | /60 |

All three use the v0.117 click-reveal contract owned by `SlideStage`. /50 is
intentionally reached from two parents to prove the global click-reveal
navigation handles many-to-one cleanly (back arrow homes to `parentSlide`).

## Animation coverage matrix

| Knob                               | Slide |
|------------------------------------|-------|
| `transition: FadeIn`               | 1, 5, 8 |
| `transition: PushLeft`             | 2, 7 |
| `transition: SlideIn`              | 3 |
| `transition: PushIn`               | 4, 6, 50, 60 |
| `textAnimation: Bounce`            | 1, 50 |
| `textAnimation: Stagger`           | 2, 6, 8, 60 |
| `textAnimation: SlideUp`           | 3 |
| `textAnimation: FadeIn`            | 4, 5, 7 |
| `titleShimmer: true`               | 1, 2, 8, 50, 60 |
| `animations.capsules: cinematicCapsules` | 2 |
| `stepAmbient`                      | 3 |
| `titleAmbient`                     | 1 |
| `sound.on: focus`                  | 3 |
| `codeHighlightLines` pulse         | 7 |
| `codeCopyButton`                   | 7 |
| Hotspot ghost reveal               | 6 |
| Inline `expand` capsule card morph | 2 |

## Assets
Reuses the existing `showcase` asset library — `riseup-meeting` QR + 3 brand
PNGs + the same audio kit. No new files added; `check:assets` passes for the
new deck via the standard registry path.

## Forbidden / pitfalls
- Don't switch the deck-level `theme` to `noir-gold` for testing — the ER
  diagram (/5) and the codeblock (/7) are tuned to navy-blue's PK-cyan / FK-orange
  / JetBrains Mono defaults. Switch via the controller's palette picker live to
  see the comparison instead.
- /50 has TWO parents (capsule on /2, step on /3). Don't add `parentSlide` arrays
  — there's no such field; just pick the canonical one.

## Related
- Loader: `src/slides/loader.ts` (`?deck=navy-showcase`)
- Theme: `src/slides/themes.ts` `'navy-blue'` block
- Asset check: `bun ./scripts/check-deck-assets.ts spec/slides/navy-showcase/deck.json`
