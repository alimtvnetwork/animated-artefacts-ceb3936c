# 09 — Decision tree: which slide type?

When the user asks for a *new* slide (not editing an existing one), pick the
type from this tree before writing JSON. Full inventory + counts:
[`../21-slides-system/llm/CATALOG.json`](../21-slides-system/llm/CATALOG.json).

```text
First slide of the deck?
  └─ yes → TitleSlide

Section break / chapter title (one big phrase)?
  └─ yes → MiddleTitleSlide   (or SectionDividerSlide for a pure divider)

A few standalone words, no chrome?
  └─ yes → KeywordSlide        ("STRATEGY · DESIGN · GROWTH")

2-6 chips, optionally with click-reveals?
  └─ yes → CapsuleListSlide

A process / journey of 3-6 steps…
  ├─ shown all at once on one screen        → StepTimelineSlide
  ├─ each step fills the screen (camera dolly) → AdvanceStepSlide
  ├─ one-at-a-time carousel with neighbor peeks → FocusTimelineSlide
  └─ a 3D depth-tiered chain                → StepsChain3DSlide

2-6 headline numbers / KPIs?
  └─ yes → MetricGridSlide

A grid of titled pillars / values?
  └─ yes → TileSlide           (extended, see 07)

Primarily a single image (or gallery)?
  └─ yes → ImageSlide

Tabular comparison?
  └─ yes → TableSlide          (extended, see 07)

A code snippet?
  └─ yes → CodeBlockSlide      (extended, see 07)

A flow / architecture diagram of boxes + arrows?
  └─ yes → BoxDiagramSlide     (extended, see 07)

A custom multi-region composition?
  └─ yes → LayoutSlide         (extended, see 07)

Audience should scan a QR / contact us?
  └─ yes → QrMeetingSlide
```

After picking a type, copy its starter from `front-end/slide-template/`, then
fill `content` per its contract in
[`../21-slides-system/llm/23-slide-type-contracts.md`](../21-slides-system/llm/23-slide-type-contracts.md).
