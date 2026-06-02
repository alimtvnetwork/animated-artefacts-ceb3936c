# 06 — Worked example (full before → after)

A complete, blind-followable edit. User request:

> "On slide 2, make the title bigger and add a 'Growth' tag in ember, and center it."

## Step 1 — Locate (recipe `01` Phase A)

Deck `showcase`. Manifest `front-end/project/showcase/data/slides.json` lists
`"02-capabilities"`. Open
`front-end/project/showcase/data/slides/02-capabilities.json`.

## Step 2 — Read current state

```jsonc
{
  "slideNumber": 2,
  "slideName": "capabilities",
  "slideType": "CapsuleListSlide",
  "transition": "SlideIn",
  "textAnimation": "FadeIn",
  "titleStyle": "cream",
  "showBrandHeader": true,
  "showPresenterChip": true,
  "content": {
    "eyebrow": "What we do",
    "title": "Capabilities",
    "capsules": [
      { "text": "Brand Strategy", "color": "gold" },
      { "text": "Product Design", "color": "cream" }
    ]
  }
}
```

## Step 3 — Map the request to recipes

| Ask | Recipe | Action |
|---|---|---|
| "bigger title" | `02` §Bigger text | `titleStyle: "white"` + `titleShimmer: true` (no pixel size) |
| "add Growth tag in ember" | `02` §Capsules | append `{ "text": "Growth", "color": "ember" }` |
| "center it" | `02` §Centering | `CapsuleListSlide` already centers its column — no field to add; if a *hero-centered* phrase were wanted we'd switch type, but here centering is already correct |

## Step 4 — Apply (after)

```jsonc
{
  "slideNumber": 2,
  "slideName": "capabilities",
  "slideType": "CapsuleListSlide",
  "transition": "SlideIn",
  "textAnimation": "FadeIn",
  "titleStyle": "white",
  "titleShimmer": true,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "content": {
    "eyebrow": "What we do",
    "title": "Capabilities",
    "capsules": [
      { "text": "Brand Strategy", "color": "gold" },
      { "text": "Product Design", "color": "cream" },
      { "text": "Growth",         "color": "ember" }
    ]
  }
}
```

## Step 5 — Validate (recipe `04`)

1. JSON parses (no trailing comma after the last capsule).
2. `titleStyle: "white"` and `color: "ember"` are legal tokens.
3. No invented `align`/`fontSize` fields.
4. `bun run test` → green.
5. Open `/2` → title reads stronger, three capsules wrap, nothing overflows.

Done. Note what we did **not** do: no hex, no pixel size, no `align` field,
no narration text added to visible content.
