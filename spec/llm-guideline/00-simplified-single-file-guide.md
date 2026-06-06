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

> Remaining specialist types — `StepsChain3DSlide`, `FocusTimelineSlide`,
> `AdvanceStepSlide`, `BoxDiagramSlide`, `TableSlide`, `LayoutSlide`,
> `BlastRadiusSlide`, `SessionOutlineSlide` — share the same envelope; see
> `spec/21-slides-system/llm/23-slide-type-contracts.md` for their content
> fields and `front-end/project/*/data/slides/` for live examples.

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
