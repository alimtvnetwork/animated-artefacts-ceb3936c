# 07 — Extended slide-type recipes

The 12 schema types are covered in `01`–`06`. These five **extended renderer
types** have richer `content`; this file is the fast recipe, the deep contract
is in the linked `llm/` file. Always validate against the schema after editing.

---

## TableSlide  (see [`../21-slides-system/llm/27a-table-slide.md`](../21-slides-system/llm/27a-table-slide.md))

```jsonc
{
  "slideType": "TableSlide",
  "content": {
    "eyebrow": "Comparison",
    "title": "Plans",
    "columns": [ "Feature", "Starter", "Pro" ],
    "rows": [
      [ "Seats", "3", "Unlimited" ],
      [ "Support", "Email", "24/7" ]
    ]
  }
}
```
Keep ≤5 columns and ≤6 rows so cells stay legible when projected.

---

## CodeBlockSlide  (see [`../21-slides-system/llm/27b-code-block-slide.md`](../21-slides-system/llm/27b-code-block-slide.md))

```jsonc
{
  "slideType": "CodeBlockSlide",
  "content": {
    "eyebrow": "API",
    "title": "Fetch a deck",
    "language": "ts",
    "code": "const deck = await loadDeck('showcase');"
  }
}
```
Short snippets only (≤12 lines). The renderer syntax-highlights by `language`.

---

## BoxDiagramSlide  (see [`../21-slides-system/llm/27c-box-diagram-slide.md`](../21-slides-system/llm/27c-box-diagram-slide.md))

```jsonc
{
  "slideType": "BoxDiagramSlide",
  "content": {
    "title": "Pipeline",
    "boxes": [
      { "id": "a", "label": "Intake" },
      { "id": "b", "label": "Build" },
      { "id": "c", "label": "Ship" }
    ],
    "arrows": [ { "from": "a", "to": "b" }, { "from": "b", "to": "c" } ]
  }
}
```
Keep ≤6 boxes. Box `id`s must be unique; arrows reference those ids.

---

## LayoutSlide  (see [`../21-slides-system/llm/27d-layout-slide.md`](../21-slides-system/llm/27d-layout-slide.md))

```jsonc
{
  "slideType": "LayoutSlide",
  "content": {
    "title": "Two-up",
    "regions": [
      { "slot": "left",  "kind": "text",  "value": "Key point" },
      { "slot": "right", "kind": "image", "value": "images/chart.jpg" }
    ]
  }
}
```
Use for split / multi-region compositions. Read `27d` for the legal `slot`
names and `kind` values — do not invent slots.

---

## TileSlide  (see [`../21-slides-system/llm/28-component-and-animation-catalog.md`](../21-slides-system/llm/28-component-and-animation-catalog.md))

```jsonc
{
  "slideType": "TileSlide",
  "content": {
    "eyebrow": "Pillars",
    "title": "What we value",
    "tiles": [
      { "title": "Craft",  "capsule": { "text": "01", "color": "gold" } },
      { "title": "Speed",  "capsule": { "text": "02", "color": "ember" } },
      { "title": "Care",   "capsule": { "text": "03", "color": "teal" } }
    ]
  }
}
```
Tiles center vertically (`justify-center`) by contract — see
[`mem://design/tileslide-vertical-centering`]. Keep 2-4 tiles per row.
