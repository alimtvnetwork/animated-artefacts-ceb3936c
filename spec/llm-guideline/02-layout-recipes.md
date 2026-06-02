# 02 — Layout recipes (copy-paste answers)

Concrete answers to the most common "how do I…" requests. Each recipe is a
minimal JSON delta. Always validate after editing (see `01` Phase D).

---

## Centering

Centering is owned by the **slide-type renderer**, not by a position field. The
schema has **no** free-form `x` / `y` / `align` field — do not invent one.

- Want a single phrase dead-center? → use `MiddleTitleSlide` or `KeywordSlide`.
  Both center their content vertically and horizontally by default.
- Want a centered hero title? → `TitleSlide`.

```jsonc
{
  "slideType": "MiddleTitleSlide",
  "titleStyle": "cream",
  "content": { "eyebrow": "Chapter Two", "title": "Ideas to Share" }
}
```

---

## Bigger text / stronger emphasis

Titles auto-scale with `clamp()`. To make a title read **bigger / heavier**,
change *style*, not pixels:

```jsonc
{ "titleStyle": "white", "titleShimmer": true }   // max contrast + sparkle
```

- For a genuinely large hero phrase, move the content to `TitleSlide` /
  `MiddleTitleSlide` (they render the display-size title).
- For emphasis on a *word inside a list*, give it its own capsule with a strong
  color (`gold`/`ember`) rather than enlarging body text.
- Never add `text-[Npx]` or a fixed font size in JSON — the engine scales the
  1920×1080 stage to fit any screen, so fixed sizes break.

See size tokens in [`../21-slides-system/llm/10-typography.md`](../21-slides-system/llm/10-typography.md).

---

## Header (logo + presenter chip)

```jsonc
{ "showBrandHeader": true,  "showPresenterChip": true }   // default
{ "showBrandHeader": false, "showPresenterChip": false }  // clean / hero slide
```

- `AdvanceStepSlide` paints its own header → set `showBrandHeader: false` there
  or two logos stack.

---

## Eyebrow / kicker (small label above the title)

```jsonc
{ "content": { "eyebrow": "What we do", "title": "Capabilities" } }
```

---

## Capsules (chips)

```jsonc
{ "content": { "capsules": [
  { "text": "Strategy", "color": "gold" },
  { "text": "Design",   "color": "ember" },
  { "text": "Growth",   "color": "cream", "clickRevealSlide": 9 }
] } }
```

Tokens (9): `gold` · `ember` · `cream` · `ink` · `outline` · `violet` · `teal` · `rose` · `sky`. Keep ≤6 chips.
Add `hoverText` for a hover label, `clickRevealSlide: N` to open a hidden slide.

---

## Steps / timeline

```jsonc
{ "content": { "steps": [
  { "label": "Step 1", "title": "Discovery", "subtitle": "Listen, audit, align",
    "description": "Two-week intake.", "capsule": { "text": "Week 1", "color": "gold" } }
] } }
```

Read [`../21-slides-system/llm/02-step-system-complete.md`](../21-slides-system/llm/02-step-system-complete.md)
before editing step slides.

---

## Line break inside a title

Use `\n`:

```jsonc
{ "content": { "title": "Building Asia's\nNext Wave" } }
```

---

## Entrance animation

```jsonc
{ "transition": "SlideIn", "textAnimation": "Stagger" }
```

`transition`: `FadeIn` · `SlideIn` · `PushIn` · `PushLeft` · `PushRight`.
`textAnimation`: `FadeIn` · `Bounce` · `SlideUp` · `Stagger`.

---

## Hide a slide without deleting it

```jsonc
{ "enabled": false }
```

---

## Image

```jsonc
{ "slideType": "ImageSlide", "content": { "title": "The team", "image": "images/team.jpg" } }
```
