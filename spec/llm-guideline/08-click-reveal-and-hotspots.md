# 08 — Click-reveal & hotspots (interactive detail)

Two ways to attach a hidden "detail" slide that the presenter opens on demand.
Both live outside the linear flow. Deep detail:
[`../21-slides-system/llm/26-click-reveal-contract.md`](../21-slides-system/llm/26-click-reveal-contract.md)
and [`../21-slides-system/llm/21-click-reveal-and-hotspots.md`](../21-slides-system/llm/21-click-reveal-and-hotspots.md).

## Pattern A — capsule triggers a reveal

On the **parent** slide, add `clickRevealSlide` to a capsule:

```jsonc
{ "text": "Growth", "color": "ember", "clickRevealSlide": 9 }
```

Then the **target** slide (`slideNumber: 9`) marks itself hidden:

```jsonc
{
  "slideNumber": 9,
  "slideType": "KeywordSlide",
  "isClickReveal": true,
  "parentSlide": 2,
  "content": { "keywords": ["+38% YoY", "3 new markets"] }
}
```

- `isClickReveal: true` removes it from the linear flow and the indicator.
- `parentSlide` is **required** — Next from the reveal returns there.
- A "Hidden detail" badge + "Back to {parent}" button render automatically.

## Pattern B — free-floating hotspots

Any slide can declare invisible clickable rectangles, positioned in
**percentages of the 1920×1080 stage**:

```jsonc
{
  "content": {
    "title": "Strategy map",
    "hotspots": [
      { "revealSlide": 12, "x": 10, "y": 30, "width": 25, "height": 20,
        "label": "Strategy detail", "style": "ghost" }
    ]
  }
}
```

- `style: "outline"` while authoring (you can see the box), flip to `"ghost"`
  (default, invisible) for the live show.
- Use to make a word, image region, or timeline step interactive without
  redesigning the slide around capsules.

## Reveal-hints toggle (presenter aid)

Slides with reveal entrypoints show an Eye toggle in the controller. When on,
reveal capsules get a gold ring + pulse. State persists via `localStorage`
(`riseup.revealHints`). Nothing to author — it appears automatically.

## Validation checklist

1. Every `clickRevealSlide` / `revealSlide` points to an existing `slideNumber`.
2. Every reveal target has `isClickReveal: true` **and** `parentSlide`.
3. Hotspot `x/y/width/height` are percentages (0-100), not pixels.
