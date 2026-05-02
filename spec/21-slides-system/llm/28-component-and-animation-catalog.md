# 28 — Component & Animation Catalog (LLM-Authoring Reference)

> **One stop, for any LLM authoring a deck from JSON.**
> Every slide type, every transition, every text animation, every capsule
> variant, every interactive primitive — counted, named, schema-typed, and
> shown with a minimal JSON exemplar. The companion
> [`CATALOG.json`](./CATALOG.json) is a machine-readable mirror so other
> projects can import the registry directly.

This document is **authoritative**. When the runtime enums in
`src/slides/enums.ts` change, update this file and `CATALOG.json` in the
same patch. Anything not listed here is unsupported.

---

## 0. Headline counts (single-glance table)

| Registry                  | Count | Source enum                          |
|---------------------------|------:|--------------------------------------|
| Slide types               | **17** | `SlideType`            (`enums.ts`) |
| Slide-to-slide transitions | **5** | `SlideTransition`      (`enums.ts`) |
| Text animations            | **4** | `TextAnimation`        (`enums.ts`) |
| Capsule colors             | **9** | `CapsuleColor`         (`enums.ts`) |
| Controller positions       | **2** | `ControllerPosition`   (`enums.ts`) |
| Capsule expand animations  | **6** | `CapsuleExpandSpec.animation`        |
| Capsule label animations   | **3** | `CapsuleExpandSpec.labelAnimation`   |
| Step motion variants       | **3** | `stepMotionVariant()`  (lift/slide/parallax) |
| Reveal/expand triggers     | **2** | `clickRevealSlide`, `expand`         |

If you write a `slide.transition`, `slide.textAnimation`, `slide.type`, or
`capsule.color` value that does **not** appear in the corresponding
section below, the deck-loader rejects the slide.

---

## 1. Slide types — 17 components

Every slide JSON must declare one `type` from this list. Each entry shows
the **minimal authoring shape** plus the full content fields the renderer
consumes. Optional fields are marked `?`.

> **Common envelope.** Every slide carries the same outer shape:
> ```json
> {
>   "slideNumber": 3,
>   "slideName": "Capabilities",
>   "type": "<SlideType>",
>   "transition": "FadeIn",
>   "textAnimation": "Stagger",
>   "showBrandHeader": true,
>   "showPresenterChip": false,
>   "content": { /* type-specific */ }
> }
> ```
> The sections below describe `content` only.

### 1.1 `TitleSlide`
Hero title slide with optional eyebrow, subtitle, presenter chip, and
ambient background. Used as the deck opener.
```json
{ "type": "TitleSlide", "content": {
  "eyebrow": "RISEUP ASIA",
  "title": "Build the future, one slide at a time",
  "subtitle": "MD ALIM UL KARIM"
}}
```

### 1.2 `MiddleTitleSlide`
Section-break / interlude ("Ideas to share" moment). Dark slate + amber
spotlight + scattered ambient icons. Title-only canvas.
```json
{ "type": "MiddleTitleSlide", "content": {
  "eyebrow": "Chapter II",
  "title": "How we ship",
  "subtitle": "Operating principles"
}}
```

### 1.3 `KeywordSlide`
One or two giant keywords centered on the canvas. Use for punchline
beats. Keywords-only — never paragraphs.
```json
{ "type": "KeywordSlide", "content": {
  "keywords": ["Velocity", "Trust"]
}}
```

### 1.4 `CapsuleListSlide`
Title + a flowing list of capsule labels. The most common "tags / topics
/ pillars" slide. Capsules are individually styleable; any one can be
marked clickable via `clickRevealSlide` or `expand`.
```json
{ "type": "CapsuleListSlide", "content": {
  "title": "Capabilities",
  "capsules": [
    { "text": "Strategy",  "color": "gold" },
    { "text": "Design",    "color": "ember", "icon": "Sparkles", "iconBadge": true },
    { "text": "Engineering","color": "violet" }
  ]
}}
```

### 1.5 `StepTimelineSlide`
Vertical timeline of numbered steps with hover-rail + per-step capsule.
Active row is foregrounded; capsule fades in on active/hover. Per-step
motion variant (lift / slide / parallax) auto-rotates by index.
```json
{ "type": "StepTimelineSlide", "content": {
  "title": "How it works",
  "steps": [
    { "label": "01", "title": "Discover",
      "capsule": { "text": "Research",  "color": "outline", "icon": "Search", "iconBadge": true } },
    { "label": "02", "title": "Design",
      "capsule": { "text": "Wireframe", "color": "outline" } },
    { "label": "03", "title": "Deliver",
      "capsule": { "text": "Ship",      "color": "gold" } }
  ]
}}
```

### 1.6 `StepsChain3DSlide`
Cinematic 3D chain. Active step is forward (Scale 1.0/Z 0); ±1 recedes
(0.85/-60px/0.5px blur); ≥±2 distant (0.7/-140px/1.2px blur). Spring-driven
WAAPI. Bullets-only content (no prose `description.body`); see
[02-step-system-complete.md](./02-step-system-complete.md).
```json
{ "type": "StepsChain3DSlide", "content": {
  "title": "Process",
  "steps": [
    { "label": "01", "title": "Discover", "bullets": ["Stakeholder map","Field study"],
      "capsule": { "text": "Research", "color": "gold" } }
  ]
}}
```

### 1.7 `FocusTimelineSlide`
Carousel-of-one timeline. One step in the limelight (full color +
description); neighbors dim and shrink. Presenter-paced via Next/Prev.

### 1.8 `AdvanceStepSlide`
Cinematic camera-zoom step chain. Vertical reel of full-viewport step
frames; Next/Prev dollies the camera. Owns navigation via `tryAdvance`.

### 1.9 `ImageSlide`
Single hero image with optional caption + framing.
```json
{ "type": "ImageSlide", "content": {
  "src": "/images/hero.jpg",
  "alt": "Team workshop",
  "caption": "Workshop, Q1 2026"
}}
```

### 1.10 `QrMeetingSlide`
QR + meeting block (links to a deep URL). Renderer enforces
`createSafeQrCanvas` — fresh canvas + opaque white base before any
composite. See [QR safety mode](mem://design/qr-safety-mode).

### 1.11 `ClickRevealSlide`
Hidden slide that only appears when triggered from a parent capsule's
`clickRevealSlide`. Lives outside the linear flow.

### 1.12 `SectionDividerSlide`
Lightweight divider — title + optional eyebrow only. Use between
sections that don't need a full hero.

### 1.13 `MetricGridSlide`
Compact grid of headline metrics (2–6 cells). Auto-laid out: 1×N for ≤2,
2×2 for 3–4, 2×3 for 5–6. Worked example:
[`22b-metric-grid-worked-example.md`](./22b-metric-grid-worked-example.md).
```json
{ "type": "MetricGridSlide", "content": {
  "title": "Proof of impact",
  "metrics": [
    { "value": "3M",    "label": "users" },
    { "value": "99.9%", "label": "uptime" },
    { "value": "$4.2M", "label": "ARR" }
  ]
}}
```

### 1.14 `TableSlide`
Comparison table — title + columns + rows with per-row accent bars. Use
for "X versus Y" decks. See [`27a-table-slide.md`](./27a-table-slide.md).

### 1.15 `CodeBlockSlide`
Title + a single hero `.slide-codeblock`. Highlights via shiki, manual
token array, or plain text. See [`27b-code-block-slide.md`](./27b-code-block-slide.md).

### 1.16 `BoxDiagramSlide` / `ERDiagramSlide`
Generic boxes-with-fields diagram (ER-style, topic-agnostic). Inline SVG,
optional 4/8 split with explanation. `ERDiagramSlide` swaps in the navy-
blue palette (cyan PK, orange FK, blue connectors). See
[`27c-box-diagram-slide.md`](./27c-box-diagram-slide.md).

### 1.17 `LayoutSlide`
Generic layout wrapper — picks one of the `.slide-grid-*` presets and
renders `layoutSlots[]` as cells (cards / plain text / inline codeblocks).
Use this when no specialised slide type fits. See [`27d-layout-slide.md`](./27d-layout-slide.md).

---

## 2. Slide-to-slide transitions — 5 variants

Set on `slide.transition`. Authors may override duration/easing per slide
via `content.transitionTiming` (or per-type via
`content.transitionTimingByType`); the deck-wide TransitionInspector can
also pick the type live without editing JSON. Reduced motion collapses
**every** variant to a 150 ms opacity fade.

| Name        | Motion                              | When to pick                                  |
|-------------|-------------------------------------|-----------------------------------------------|
| `FadeIn`    | Opacity 0 → 1                       | Default. Quiet, keyword-first slides.         |
| `SlideIn`   | y +40 px → 0 + fade                 | Vertical step beats, lists, stacked content.  |
| `PushIn`    | Scale 0.92 → 1 + fade               | Hero reveals, big-number slides.              |
| `PushLeft`  | x +8 % → 0 (forward) + fade         | "Next chapter" forward motion.                |
| `PushRight` | x −8 % → 0 (forward) + fade         | Backward navigation, returning to overview.   |

Transition timing is resolved via the chain in `transitions.ts`:
per-slide → per-slide-by-type → deck-by-type → deck → built-in
(550 ms expoOut). The live inspector wins over every authored layer.

---

## 3. Text (in-slide content) animations — 4 variants

Set on `slide.textAnimation`. Drives the entrance choreography of the
slide's text content (titles, capsules, list items).

| Name      | Behaviour                                                               | Best for                        |
|-----------|-------------------------------------------------------------------------|---------------------------------|
| `FadeIn`  | Single opacity ramp.                                                    | Short, calm slides.             |
| `Bounce`  | Scale 0.96 → 1 with a small back-out overshoot.                         | Punchline keywords.             |
| `SlideUp` | y 24 px → 0 + fade.                                                     | Lists, stepped reveals.         |
| `Stagger` | Per-child cascade (60 ms apart) layered on `SlideUp`.                   | Capsule lists, multi-item rows. |

**Variety is required by Core memory.** Don't ship a deck where every
slide uses the same `textAnimation`.

---

## 4. Capsules — the keyword-first labelling primitive

The shared `Capsule` component renders every label/CTA pill across the
deck (slide 4's step capsules, `CapsuleListSlide`, expand-cards, hotspot
labels). Authors write `CapsuleSpec` objects:

```jsonc
{
  "text":  "Research",            // required
  "color": "gold",                 // required — see 4.1
  "hoverText": "Field study",      // optional — vertical flip on hover
  "clickRevealSlide": 18,          // optional — navigate to a hidden slide
  "expand": { /* CapsuleExpandSpec — see 4.2 */ },
  "icon": "Sparkles",              // optional — lucide-react PascalCase name
  "iconBadge": true                // optional — render icon as contrast plate
}
```

### 4.1 Capsule colors — 9 variants

| Color     | Background voice                | Foreground   | Use for                         |
|-----------|----------------------------------|--------------|---------------------------------|
| `gold`    | Gold gradient (brand primary)    | Ink          | Active step, primary CTA        |
| `ember`   | Warm amber gradient              | Ink          | Secondary emphasis              |
| `cream`   | Soft cream surface               | Ink          | Quiet labels                    |
| `ink`     | Dark ink surface                 | Cream        | Inverted contrast               |
| `outline` | Transparent + border             | Cream/foreground | Default for non-active step rows |
| `violet`  | Violet gradient                  | Ink          | Multi-capsule chromatic variety |
| `teal`    | Teal gradient                    | Ink          | Multi-capsule chromatic variety |
| `rose`    | Rose gradient                    | Ink          | Multi-capsule chromatic variety |
| `sky`     | Sky-blue gradient                | White        | Multi-capsule chromatic variety |

All gradient variants pass WCAG AA against the noir background. The
active-state outline capsule (set by `data-capsule-state="active"` on the
parent row) picks up a gold tint + 0.55 border + 0.18 outer accent.

### 4.2 Icon badges (v0.188)

Optional. Two forms gated by `iconBadge`:
- `iconBadge: true`  → circular contrast plate (luminance-flipped: dark
  capsules get a light plate, light capsules get a dark plate). Glyph
  uses `currentColor`. Use for **step capsules** where the icon should
  read as an emblem.
- `iconBadge: false` (or omitted) → bare leading glyph at 0.9 opacity.
  Use as a soft hint, not a chip-within-a-chip.

`icon` accepts any `lucide-react` icon name in PascalCase
(`Sparkles`, `Zap`, `Target`, `Search`, `Compass`, `Rocket`, `Shield`,
`Star`, `Heart`, `BadgeCheck`, …). Unknown names render no icon — there
is no validation crash.

### 4.3 Expand cards — `CapsuleExpandSpec`

Inline expanding card on the same slide. Other capsules dim and the
card animates from the capsule's footprint outward. Click outside or
press Esc to collapse.

```json
{
  "expand": {
    "title":   "Strategy",
    "eyebrow": "Discover",
    "body":    "Stakeholder mapping + field study.",
    "capsules": [
      { "text": "Workshop", "color": "outline" }
    ],
    "cta":      { "text": "See case study", "onClickRevealSlide": 24 },
    "animation":      "morph",
    "labelAnimation": "stagger"
  }
}
```

#### 4.3.1 `animation` (panel entrance) — 6 variants
| Name        | Motion                                |
|-------------|----------------------------------------|
| `morph`     | Capsule → panel rect interpolation (default) |
| `fade`      | Opacity only                           |
| `slideUp`   | translateY +24 px → 0 + fade           |
| `slideDown` | translateY −24 px → 0 + fade           |
| `pushLeft`  | translateX +48 px → 0 + fade           |
| `pushRight` | translateX −48 px → 0 + fade           |

Reduced motion forces a 180 ms opacity fade.

#### 4.3.2 `labelAnimation` (inner content) — 3 variants
| Name      | Behaviour                                       |
|-----------|--------------------------------------------------|
| `slideUp` | y 10 → 0 + 180 ms fade (default)                 |
| `stagger` | Each child slides up + fades, 60 ms apart        |
| `fade`    | Single opacity-only fade                          |

---

## 5. Step motion variants — 3 rotation values

Set automatically by `stepMotionVariant(i)` for `StepTimelineSlide` rows
and `StepsChain3DSlide` accent cards. Variety is enforced — adjacent
steps never share a variant.

| Variant    | Step entrance                                       |
|------------|------------------------------------------------------|
| `lift`     | y 12 → 0 + opacity 0 → 1                             |
| `slide`    | x 24 → 0 + opacity 0 → 1                             |
| `parallax` | y 24 → 0 + scale 0.97 → 1 + opacity 0 → 1            |

Reduced motion strips all three to a clean opacity-only crossfade.

---

## 6. Click-reveal primitives — 2 triggers

Any `CapsuleSpec` (and `StepSpec`/`HotspotSpec` via `ClickRevealTrigger`)
can declare exactly one of:

| Field              | Effect                                                   |
|--------------------|----------------------------------------------------------|
| `clickRevealSlide` | Navigate the deck to a hidden slide number               |
| `expand`           | Open an inline expanding card on the current slide       |

If both are set, `expand` wins. Reveal-style capsules pick up a soft
gold ring + slow pulse when the deck has "Reveal hints" toggled on.

---

## 7. Controller positions — 2 values

| Name            | Anchor                          |
|-----------------|----------------------------------|
| `BottomCenter`  | Default; bottom-center pill      |
| `TopRight`      | Compact pill in the top-right    |

The controller is hidden by default and hover-reveals — never authored
visible-by-default. See Core memory.

---

## 8. Cross-project import / export

Decks are **JSON-portable** between Riseup-Asia-derived projects. The
runtime contract is fixed:

1. Every slide validates against [`spec/slide.schema.json`](../../slide.schema.json).
2. Every deck validates against [`spec/deck.schema.json`](../../deck.schema.json)
   and its manifest against [`spec/deck-manifest.schema.json`](../../deck-manifest.schema.json).
3. The values in this catalog are the **only** legal values for the
   matching enum fields (`type`, `transition`, `textAnimation`,
   `capsule.color`, `controllerPosition`, `expand.animation`,
   `expand.labelAnimation`).
4. Asset references (`src` paths, image URLs) must be re-pathed by the
   importing project; the loader does not auto-rewrite them.

### Import workflow (project A → project B)
```sh
# In project A — export a single deck folder.
cp -R front-end/project/<deck-slug>/ /tmp/<deck-slug>/

# In project B — drop it into the spec layout.
cp -R /tmp/<deck-slug>/ spec/26-slide-definitions/<deck-slug>/

# Register the deck in project B's manifest (if multi-deck).
# Re-resolve any image src references that referred to project A's assets.
```

### Export workflow (project B → project A)
```sh
# Same shape, reversed. The JSON files travel as-is; only the assets and
# the manifest entry need re-homing.
cp -R spec/26-slide-definitions/<deck-slug>/ /tmp/<deck-slug>/
```

The companion [`CATALOG.json`](./CATALOG.json) ships the full enum
inventory in machine-readable form. Drop it into another project to
confirm the importing engine recognises every value used in the deck.

### Validating an imported deck
```ts
import { allSlides } from '@/slides/loader';
// loader.ts runs the schema validators on import; any unknown enum
// value raises a hard error at module-evaluation time. There is no
// silent fallback.
```

---

## 9. Authoring checklist for an LLM

When a user asks an LLM to generate a deck JSON, the LLM must:

1. Pick `type` from §1 (one of 17). Anything else is rejected.
2. Pick `transition` from §2 (one of 5) and `textAnimation` from §3
   (one of 4). Vary across the deck — never use the same pair on every
   slide.
3. For lists → use `CapsuleListSlide`; for steps with a description →
   `StepTimelineSlide`; for cinematic step beats → `StepsChain3DSlide`;
   for big numbers → `MetricGridSlide`. Do not invent slide types.
4. Capsule colors come from §4.1 (one of 9). Optional `icon` is a
   `lucide-react` PascalCase name; pair with `iconBadge: true` for
   step / status capsules.
5. Reveal interactions use one of `clickRevealSlide` / `expand`
   (§6). Never both on the same capsule.
6. Reduced motion is honoured automatically by the runtime — the LLM
   does **not** author a parallel reduced-motion variant.
7. Keywords-only content (Core memory). Never write paragraphs in
   `title` / `subtitle` / `capsule.text`.

When an LLM ports a deck between projects, it follows §8.

---

## See also
- [`00-README.md`](./00-README.md) — LLM-doc index.
- [`06-json-authoring-cheatsheet.md`](./06-json-authoring-cheatsheet.md) — paste-ready JSON snippets.
- [`13-motion-system.md`](./13-motion-system.md) — full motion contract.
- [`23-slide-type-contracts.md`](./23-slide-type-contracts.md) — per-type field contracts.
- [`CATALOG.json`](./CATALOG.json) — machine-readable mirror of this doc.
