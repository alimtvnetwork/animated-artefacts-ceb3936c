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

## 4 · Per-type samples (why / when · how it displays · JSON)

Each sample is a `slides[]` entry — drop it straight into the manifest from §2.
Shapes are mirrored from real runtime slides in `front-end/project/*/data/slides/`.

### TitleSlide — hero opener
*Why/when:* the deck's first slide or a major act opener. *Displays:* big
headline, eyebrow above, subtitle below, capsules, optional ambient icon scatter.
```json
{ "slideNumber": 1, "slideName": "title", "slideType": "TitleSlide",
  "transition": "FadeIn", "textAnimation": "Bounce", "enabled": true,
  "showBrandHeader": true, "showPresenterChip": true, "titleStyle": "white",
  "content": { "eyebrow": "Riseup Asia LLC", "title": "Building Asia's\nNext Wave",
    "subtitle": "Strategy · Design · Growth",
    "capsules": [ { "text": "2026 Deck", "color": "gold" }, { "text": "Confidential", "color": "outline" } ] } }
```

### MiddleTitleSlide — centered chapter statement
*Why/when:* a mid-deck pivot or pillar title. *Displays:* centered eyebrow + title + subtitle, no body.
```json
{ "slideNumber": 6, "slideName": "process", "slideType": "MiddleTitleSlide",
  "transition": "PushIn", "textAnimation": "SlideUp", "enabled": true,
  "content": { "eyebrow": "Pillar II", "title": "Process", "subtitle": "Spec · Build · Ship · Review" } }
```

### KeywordSlide — 3–7 keywords
*Why/when:* distil an idea to a few words the presenter expands on. *Displays:* large keyword row/stack.
```json
{ "slideNumber": 3, "slideName": "keyword", "slideType": "KeywordSlide",
  "transition": "PushIn", "textAnimation": "Bounce", "enabled": true,
  "content": { "eyebrow": "What we obsess over", "title": "Three words",
    "keywords": ["Clarity", "Cadence", "Restraint"] } }
```

### CapsuleListSlide — colored capsules (optionally click-reveal)
*Why/when:* a titled list of 3–10 items. Add `clickRevealSlide` to a capsule to open an off-flow detail slide. *Displays:* wrapped colored capsules under a title.
```json
{ "slideNumber": 4, "slideName": "capsules", "slideType": "CapsuleListSlide",
  "transition": "SlideIn", "textAnimation": "Stagger", "enabled": true,
  "content": { "eyebrow": "Craft moves", "title": "How we work",
    "capsules": [ { "text": "Brief in 1 page", "color": "gold" },
      { "text": "Spec before code", "color": "ember" },
      { "text": "Motion with meaning", "color": "teal", "clickRevealSlide": 24 } ] } }
```

### StepTimelineSlide — numbered step chain
*Why/when:* a sequential process. Each step may carry a `capsule` and `image`. *Displays:* numbered nodes with focused-step description.
```json
{ "slideNumber": 8, "slideName": "steps", "slideType": "StepTimelineSlide",
  "transition": "SlideIn", "textAnimation": "SlideUp", "enabled": true,
  "content": { "eyebrow": "Method", "title": "Four steps",
    "steps": [ { "label": "Step 1", "title": "Brief", "subtitle": "One page", "capsule": { "text": "Mon", "color": "gold" } },
      { "label": "Step 2", "title": "Spec", "subtitle": "JSON first", "capsule": { "text": "Tue", "color": "ember" } } ] } }
```

### SectionDividerSlide — chapter break
*Why/when:* separate major sections. *Displays:* large eyebrow + title, minimal.
```json
{ "slideNumber": 2, "slideName": "section-craft", "slideType": "SectionDividerSlide",
  "transition": "PushLeft", "textAnimation": "SlideUp", "enabled": true,
  "content": { "eyebrow": "Pillar I", "title": "Craft" } }
```

### MetricGridSlide — KPI grid
*Why/when:* 3–4 headline numbers. *Displays:* grid of value + label + caption cards.
```json
{ "slideNumber": 5, "slideName": "metrics", "slideType": "MetricGridSlide",
  "transition": "PushRight", "textAnimation": "Stagger", "enabled": true,
  "content": { "eyebrow": "2026 YTD", "title": "By the numbers",
    "metrics": [ { "value": "23", "label": "Decks shipped", "caption": "Since January" },
      { "value": "97%", "label": "On-time rate", "caption": "Across milestones" } ] } }
```

### NumberCalloutSlide — one animated number
*Why/when:* a single dramatic figure. *Displays:* count-up number + label + capsule.
```json
{ "slideNumber": 13, "slideName": "number", "slideType": "NumberCalloutSlide",
  "transition": "FadeIn", "textAnimation": "FadeIn", "enabled": true,
  "content": { "eyebrow": "Proof", "title": "Recall after 7 days",
    "number": { "from": 0, "to": 84, "unit": "%", "easing": "easeOutQuint", "duration": "slow", "decimals": 0 },
    "label": "of audiences remember the keyword slide", "capsule": { "color": "gold", "text": "n=412" } } }
```

### EquationSlide — one equation
*Why/when:* show a formula. *Displays:* KaTeX-rendered equation + caption. Author with `tex`; `equationHtml`/`termIds` are pre-rendered by tooling — you may emit just `tex` + `caption`.
```json
{ "slideNumber": 14, "slideName": "equation", "slideType": "EquationSlide",
  "transition": "FadeIn", "textAnimation": "FadeIn", "enabled": true,
  "content": { "eyebrow": "Math", "title": "Clarity compounds",
    "tex": "R = C \\cdot (1 + r)^t", "caption": "Recall compounds every retelling" } }
```

### DataTableSlide — tabular data (≤5 cols × ≤8 rows)
*Why/when:* compact structured comparison. *Displays:* aligned table.
```json
{ "slideNumber": 16, "slideName": "table", "slideType": "DataTableSlide",
  "transition": "SlideIn", "textAnimation": "Stagger", "enabled": true,
  "content": { "eyebrow": "Trend", "title": "Five quarters",
    "dataColumns": [ { "key": "q", "label": "Quarter", "align": "left" }, { "key": "nps", "label": "NPS", "align": "right" } ],
    "dataRows": [ { "q": "Q1 '25", "nps": "4.5" }, { "q": "Q1 '26", "nps": "4.8" } ] } }
```

### ChecklistSlide — checklist / acceptance items
*Why/when:* a pre-flight or acceptance list. *Displays:* checkable rows with detail + capsule, progress bar.
```json
{ "slideNumber": 22, "slideName": "checklist", "slideType": "ChecklistSlide",
  "transition": "SlideIn", "textAnimation": "Stagger", "enabled": true,
  "content": { "eyebrow": "Live walkthrough", "title": "Pre-flight", "progressColor": "gold",
    "items": [ { "text": "Brief signed off", "detail": "Goals locked", "capsule": { "color": "gold", "text": "Mon" } },
      { "text": "Spec frozen", "detail": "No late edits", "capsule": { "color": "ember", "text": "Tue" } } ] } }
```

### CodeBlockSlide — code snippet
*Why/when:* show code/config. *Displays:* syntax-highlighted block + caption. `code` is a single escaped string.
```json
{ "slideNumber": 17, "slideName": "code", "slideType": "CodeBlockSlide",
  "transition": "FadeIn", "textAnimation": "FadeIn", "enabled": true,
  "content": { "eyebrow": "Contract", "title": "A slide is just JSON", "language": "json",
    "code": "{\n  \"slideType\": \"KeywordSlide\"\n}", "caption": "Validated by zod." } }
```

### ImageSlide — one image / gallery
*Why/when:* a visual is the message. *Displays:* image with `imageRole` slot + optional caption. EMBED via Base64/SVG for portability.
```json
{ "slideNumber": 2, "slideName": "image", "slideType": "ImageSlide",
  "transition": "SlideIn", "textAnimation": "SlideUp", "enabled": true, "titleStyle": "white",
  "content": { "title": "The result", "image": "data:image/svg+xml,%3Csvg.../%3E", "imageRole": "bodyFigure" } }
```

### ERDiagramSlide / DatabaseDiagramSlide — entities + relationships (≤5)
*Why/when:* show a data model. *Displays:* positioned entity cards + labeled connectors. `x`/`y` are 0–100 % coordinates.
```json
{ "slideNumber": 19, "slideName": "er", "slideType": "ERDiagramSlide",
  "transition": "FadeIn", "textAnimation": "FadeIn", "enabled": true,
  "content": { "eyebrow": "Model", "title": "How a deck is structured",
    "entities": [ { "id": "deck", "title": "Deck", "x": 18, "y": 20, "fields": [ { "name": "id" }, { "name": "theme" } ] },
      { "id": "slide", "title": "Slide", "x": 56, "y": 20, "fields": [ { "name": "id" }, { "name": "deck_id (FK)" } ] } ],
    "relationships": [ { "from": "deck", "to": "slide", "label": "contains" } ] } }
```

### TileSlide — 2–4 clickable cards
*Why/when:* a small set of links/options. *Displays:* a centered row of tiles (glyph + name + desc + CTA).
```json
{ "slideNumber": 5, "slideName": "tiles", "slideType": "TileSlide",
  "transition": "SlideIn", "textAnimation": "Stagger", "enabled": true,
  "content": { "eyebrow": "Today's goal", "title": "Two CLIs",
    "tiles": [ { "name": "Alarm CLI", "tag": "alarm-app-v3", "desc": "Terminal alarm clock.", "url": "https://github.com/x/alarm", "glyph": "⏰", "cta": "View on GitHub" } ] } }
```

### QrMeetingSlide — closer / contact card
*Why/when:* the final "book a meeting" slide. *Displays:* QR + meeting URL + presenter rows.
```json
{ "slideNumber": 23, "slideName": "qr-meeting", "slideType": "QrMeetingSlide",
  "transition": "FadeIn", "textAnimation": "FadeIn", "enabled": true,
  "showPresenterChip": true,
  "content": { "eyebrow": "Talk to us", "title": "Meet the studio",
    "subtitle": "Friday · 30 minutes · scan to book",
    "meetingUrl": "https://riseup.asia/meet", "meetingLabel": "riseup.asia/meet",
    "presenterName": "MD ALIM UL KARIM", "presenterRole": "Founder · Riseup Asia LLC" } }
```

### ClickRevealSlide — off-flow detail
*Why/when:* deep-dive content shown ONLY when a parent capsule's `clickRevealSlide` points at this `slideNumber`. *Displays:* like a normal slide but skipped in linear nav. Set `isClickReveal: true`.
```json
{ "slideNumber": 24, "slideName": "reveal-motion", "slideType": "KeywordSlide",
  "transition": "ZoomOut", "textAnimation": "FadeIn", "enabled": true, "isClickReveal": true,
  "content": { "eyebrow": "Deep dive", "title": "Motion with meaning",
    "keywords": ["Intent", "Easing", "Restraint"] } }
```

### AdvanceStepSlide — progressive multi-stage reveal
*Why/when:* one process whose steps reveal in sequence under presenter control. *Displays:* numbered habits "on rails"; each step has a `capsule`.
```json
{ "slideNumber": 9, "slideName": "advance-step", "slideType": "AdvanceStepSlide",
  "transition": "PushIn", "textAnimation": "FadeIn", "enabled": true,
  "content": { "eyebrow": "Process", "title": "Four habits, on rails",
    "steps": [
      { "label": "01", "title": "Token first", "subtitle": "Declared, never inlined", "capsule": { "text": "Discipline", "color": "gold" } },
      { "label": "02", "title": "Spec first", "subtitle": "JSON is the source of truth", "capsule": { "text": "Truth", "color": "ember" } }
    ] } }
```

### FocusTimelineSlide — spotlight one step at a time
*Why/when:* a timeline where one step is highlighted and neighbours dim. *Displays:* horizontal step rail with focus state; each step has `label`/`title`/`subtitle`/`capsule`.
```json
{ "slideNumber": 8, "slideName": "focus-timeline", "slideType": "FocusTimelineSlide",
  "transition": "FadeIn", "textAnimation": "FadeIn", "enabled": true,
  "content": { "eyebrow": "Process · zoom", "title": "Spec week, up close",
    "steps": [
      { "label": "Mon", "title": "Listen", "subtitle": "Stakeholder interviews", "capsule": { "text": "1:1s", "color": "gold" } },
      { "label": "Tue", "title": "Map", "subtitle": "System + audience model", "capsule": { "text": "Diagrams", "color": "ember" } }
    ] } }
```

### LayoutSlide — custom split / columned composition
*Why/when:* a bespoke arrangement of plain text + cards. *Displays:* a `layout` grid (e.g. `split-2-equal`) filled with `layoutSlots` (`kind: "plain" | "card"`, optional `colSpan`/`rowSpan`/`compact`).
```json
{ "slideNumber": 10, "slideName": "your-call", "slideType": "LayoutSlide",
  "transition": "SlideIn", "textAnimation": "Stagger", "enabled": true,
  "content": { "eyebrow": "Open mic", "title": "Where do we go from here?",
    "layout": "split-2-equal", "layoutVerticalAlign": "center",
    "layoutSlots": [
      { "kind": "plain", "title": "This part is yours to steer.", "body": "Got an idea? Let's build it.", "rowSpan": 2 },
      { "kind": "card", "eyebrow": "Plan A", "title": "Add a feature", "body": "Continue where we left off.", "compact": true },
      { "kind": "card", "eyebrow": "Plan B", "title": "Your idea", "body": "Bring something.", "compact": true }
    ] } }
```

### BoxDiagramSlide — boxes + connectors
*Why/when:* a block diagram of nodes wired together. *Displays:* `diagramNodes` positioned by `x`/`y` (0–100) with `fields[]`, connected by `diagramEdges` (`from`/`to`).
```json
{ "slideNumber": 18, "slideName": "box-diagram", "slideType": "BoxDiagramSlide",
  "transition": "FadeIn", "textAnimation": "Stagger", "enabled": true,
  "content": { "eyebrow": "Proof · stack", "title": "Studio toolchain",
    "diagramNodes": [
      { "id": "spec", "title": "Spec", "x": 12, "y": 30, "fields": [ { "name": "JSON" }, { "name": "Zod" } ] },
      { "id": "ship", "title": "Ship", "x": 88, "y": 30, "fields": [ { "name": "Flag" }, { "name": "WCAG" } ] }
    ],
    "diagramEdges": [ { "from": "spec", "to": "ship" } ] } }
```

### TableSlide — plain comparison table
*Why/when:* a simpler comparison than `DataTableSlide`. *Displays:* `tableColumns` (`key`/`label`) + `tableRows` (`name` + `cells` keyed by column `key`).
```json
{ "slideNumber": 15, "slideName": "table", "slideType": "TableSlide",
  "transition": "SlideIn", "textAnimation": "Stagger", "enabled": true,
  "content": { "eyebrow": "Proof", "title": "Engagement tiers",
    "tableColumns": [ { "key": "scope", "label": "Scope" }, { "key": "studio", "label": "Studio" } ],
    "tableRows": [ { "name": "Length", "cells": { "scope": "Length", "studio": "1 quarter" } } ] } }
```

### SessionOutlineSlide — agenda / multi-session arc
*Why/when:* show an agenda or where today fits in a series. *Displays:* `items[]` (`title`/`subtitle`/`meta`/`capsule`) with `activeIndex` highlighting the current one.
```json
{ "slideNumber": 14, "slideName": "session-outline", "slideType": "SessionOutlineSlide",
  "transition": "FadeIn", "textAnimation": "SlideUp", "enabled": true,
  "content": { "eyebrow": "THE WHOLE TRACK", "title": "Four sessions, one arc",
    "kicker": "How today fits the journey.", "activeIndex": 3,
    "items": [
      { "title": "Foundations", "subtitle": "Mindset, tooling", "meta": "S1", "capsule": { "text": "DONE", "color": "outline" } },
      { "title": "AI coding", "subtitle": "Today", "meta": "S4", "capsule": { "text": "TODAY", "color": "gold" } }
    ] } }
```

### BlastRadiusSlide — cinematic impact outro
*Why/when:* a dramatic chapter/outro paired with `ZoomOut`. *Displays:* particle/shard burst behind `eyebrow`/`title`/`subtitle`; tune `particleCount`, `shardCount`, `gradientAngle`.
```json
{ "slideNumber": 3, "slideName": "blast-radius", "slideType": "BlastRadiusSlide",
  "transition": "ZoomOut", "textAnimation": "FadeIn", "enabled": true, "titleStyle": "white",
  "content": { "eyebrow": "CHAPTER 03", "title": "Detonate",
    "subtitle": "what breaks when one secret leaks",
    "particleCount": 55, "shardCount": 6, "gradientAngle": 200 } }
```

> The remaining `StepsChain3DSlide` shares the step envelope above; see
> `spec/21-slides-system/llm/23-slide-type-contracts.md` for its 3D-only fields
> and `front-end/project/*/data/slides/` for live examples.


## 5 · Choosing a slide type (intent → type)

| Intent | Use |
|--------|-----|
| Open the deck | `TitleSlide` |
| Break into a section | `SectionDividerSlide` / `MiddleTitleSlide` |
| Boil down to a few words | `KeywordSlide` |
| List several short items | `CapsuleListSlide` |
| Show a sequence | `StepTimelineSlide` / `AdvanceStepSlide` |
| Show KPIs | `MetricGridSlide` |
| One dramatic number | `NumberCalloutSlide` |
| A formula | `EquationSlide` |
| Tabular data | `DataTableSlide` |
| Acceptance/checklist | `ChecklistSlide` |
| Code/config | `CodeBlockSlide` |
| A picture | `ImageSlide` |
| A data model | `ERDiagramSlide` / `DatabaseDiagramSlide` |
| A few clickable options | `TileSlide` |
| Book a meeting (closer) | `QrMeetingSlide` |
| Hidden deep-dive | `ClickRevealSlide` (parent capsule `clickRevealSlide`) |

## 6 · Worked example — complete 2-slide manifest with embedded image

This is the exact shape to hand to the importer when you want a whole deck in
one shot. It includes a title slide plus one `ImageSlide` whose visual is
embedded inline as SVG, so the JSON is portable with no missing asset paths.

```json
{
  "manifestVersion": 1,
  "Name": "Riseup Asia LLC — Two-slide demo",
  "config": {
    "deckSlug": "two-slide-demo",
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
        "title": "Single-file\nDeck Authoring",
        "subtitle": "One manifest · All slides inline",
        "capsules": [
          { "text": "Portable", "color": "gold" },
          { "text": "Self-contained", "color": "outline" }
        ]
      }
    },
    {
      "slideNumber": 2,
      "slideName": "image-proof",
      "slideType": "ImageSlide",
      "transition": "PushIn",
      "textAnimation": "SlideUp",
      "enabled": true,
      "isClickReveal": false,
      "content": {
        "eyebrow": "Embedded asset",
        "title": "SVG lives inside the JSON",
        "imageRole": "bodyFigure",
        "caption": "No external path lookup required.",
        "image": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'><rect width='160' height='90' rx='10' fill='%230d0d0d'/><rect x='14' y='14' width='132' height='62' rx='8' fill='%23c9a84c' opacity='0.18'/><circle cx='42' cy='45' r='14' fill='%23e85d3a'/><path d='M72 32h50M72 45h38M72 58h26' stroke='%23f0d78c' stroke-width='6' stroke-linecap='round'/></svg>"
      }
    }
  ]
}
```

## 7 · Legal enums + variety rules

- **Transitions:** `FadeIn · SlideIn · PushIn · PushLeft · PushRight · ZoomOut`
- **Text animation:** `FadeIn · Bounce · SlideUp · Stagger`
- **Capsule colors:** `gold · ember · cream · ink · outline · violet · teal · rose · sky`

Rules:
- Use **enum values only**. Never invent new transition names, animation names,
  capsule colors, or write raw hex/CSS into the slide JSON.
- **Vary transitions and text animations across adjacent slides.** Do not repeat
  the same `transition` or the same `textAnimation` on two neighboring slides
  unless the human explicitly asks for a uniform sequence.
- Reserve **`ZoomOut`** for cinematic exit moments, especially `BlastRadiusSlide`
  or click-reveal style emphasis beats.
