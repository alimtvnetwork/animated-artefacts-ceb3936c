# Simplified single-file slide-authoring guide (for any LLM)

> **Read this one file and you can author a complete deck.** Output is ONE
> self-contained manifest JSON: every slide inlined, every image embedded.
> The deep "how the system works" pack lives in `spec/llm-guideline/01..10`
> and `spec/21-slides-system/llm/**` — this file is the fast, complete path.
>
> Source of truth for enums: `src/slides/enums.ts`. This guide mirrors it;
> if they ever disagree, `enums.ts` wins.

---

## 1 · Mental model

- A deck = one JSON manifest. The runtime reads it; the presenter narrates.
- **Keywords-only.** Slides are visual anchors, never paragraphs. 3–7 short
  keywords or capsules per slide. No prose in `content.body`.
- **Enum values only — never raw hex.** Colors come from the theme via
  semantic tones (`"color": "gold"`), so theme switches stay coherent.
- **One file in, one file out.** You emit a single manifest; do NOT split a
  deck into many files as your deliverable.

## 2 · The single-file manifest contract (THE output shape)

Every deck you produce is one JSON document with this shape. Slides are
inlined into `slides[]` in render order. Images are embedded (Base64 data URI
or inline `<svg>`), never path references, so the file is portable.

```jsonc
{
  "manifestVersion": 1,
  "Name": "Riseup Asia LLC — <Deck Name>",
  "config": {
    "deckSlug": "my-deck",
    "presenter": "MD ALIM UL KARIM",
    "theme": "noir-gold",
    "preset": "premium"
  },
  "slides": [
    {
      "slideNumber": 1,
      "slideName": "title",
      "slideType": "TitleSlide",
      "transition": "FadeIn",
      "textAnimation": "Bounce",
      "enabled": true,
      "isClickReveal": false,
      "content": {
        "eyebrow": "Riseup Asia LLC",
        "title": "Building Asia's\nNext Wave",
        "subtitle": "Strategy · Design · Growth",
        "capsules": [
          { "text": "2026 Deck", "color": "gold" },
          { "text": "Confidential", "color": "outline" }
        ]
      }
    }
    // … more slides …
  ]
}
```

### Per-slide envelope (fields shared by every slideType)

| field | required | notes |
|-------|----------|-------|
| `slideNumber` | yes | 1-based, unique, render order |
| `slideName` | yes | kebab id, used in deep links |
| `slideType` | yes | one of the 28 values in §3 |
| `transition` | yes | `FadeIn · SlideIn · PushIn · PushLeft · PushRight · ZoomOut` |
| `textAnimation` | yes | `FadeIn · Bounce · SlideUp · Stagger` |
| `enabled` | no (default true) | `false` keeps a slide in the file but hidden |
| `isClickReveal` | no | true only for reveal children (see §3 ClickRevealSlide) |
| `content` | yes | type-specific payload (see §3) |

### Images — embed, never link

`content.image` (and `images[]`, `StepSpec.image`) accept:
- a Base64 data URI: `"data:image/png;base64,iVBORw0KGgo…"`, or
- inline SVG markup: `"<svg viewBox='0 0 64 64'>…</svg>"`.

Embedding keeps the manifest self-contained — it imports into any project with
no missing-asset errors. `src/slides/inlineImages.ts` performs this on export;
when authoring fresh, paste Base64/SVG directly.

### Capsule tone rule

Capsule `color` MUST be one of: `gold · ember · cream · ink · outline ·
violet · teal · rose · sky`. Never write CSS or hex in slide JSON — tones map
to theme tokens that auto-flip on light themes.

## 3 · Slide-type inventory (canonical 28 — pick the right one)

Source: `src/slides/enums.ts` → `SlideType`. Per-type JSON samples +
how-it-displays notes are filled in §4 (subsequent steps).

| slideType | Use it when… |
|-----------|--------------|
| `TitleSlide` | Hero opener: eyebrow + headline + subtitle + capsules + ambient icons |
| `MiddleTitleSlide` | Mid-deck centered statement / chapter title |
| `KeywordSlide` | 3–7 standalone keywords as the visual anchor |
| `CapsuleListSlide` | A title + 3–10 colored capsules (optionally click-reveal) |
| `StepTimelineSlide` | Cinematic numbered step chain with a focused-step description |
| `StepsChain3DSlide` | 3D rail of steps; click-only nav, cause-tagged transitions |
| `FocusTimelineSlide` | Timeline that spotlights one step at a time |
| `AdvanceStepSlide` | Progressive multi-stage reveal of a single process |
| `ImageSlide` | One image (or `images[]` gallery) with caption |
| `QrMeetingSlide` | Closer/contact card: QR + meeting URL + contact rows |
| `ClickRevealSlide` | Off-flow detail shown only when a parent item is clicked |
| `SectionDividerSlide` | Section break / chapter divider |
| `MetricGridSlide` | Grid of KPI metrics (label + value) |
| `NumberCalloutSlide` | A single big number with context |
| `EquationSlide` | One rendered math equation |
| `DataTableSlide` | Tabular data (≤5 cols × ≤8 rows) |
| `TableSlide` | Simpler/legacy table layout |
| `DatabaseDiagramSlide` | DB schema diagram (≤5 entities) |
| `ERDiagramSlide` | Entity-relationship diagram |
| `BoxDiagramSlide` | Boxes + connectors block diagram |
| `CodeBlockSlide` | Syntax-highlighted code snippet |
| `ChecklistSlide` | Checklist / acceptance items |
| `LayoutSlide` | Custom split/columned composition |
| `TileSlide` | 2–4 clickable tiles in a row (glyph + name) |
| `BlastRadiusSlide` | Impact/radius outro paired with `ZoomOut` |
| `SessionOutlineSlide` | Agenda / session outline |

> §4 (per-type sample JSON with why/when + how-it-displays) is authored in the
> following plan steps; reuse `front-end/project/*/data/slides/*.json` as the
> ground-truth examples when filling each.
