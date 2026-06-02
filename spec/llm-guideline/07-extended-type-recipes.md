# 07 — Extended slide-type recipes

Beyond the common types in `01`–`06`, the runtime registry
(`src/slides/contracts.ts` → `SlideContract`, **v7, 25 types**) supports the
richer types below. Field names here are taken **verbatim from the zod
contracts** — they are the runtime source of truth (the JSON-schema enum in
`slide.schema.json` is a stale subset). Always validate with `bun run test`.

> ⚠️ The deep prose docs live in `llm/27a`–`27d` + `28`, but where a doc and the
> zod contract disagree, **the zod contract wins**.

---

## TableSlide  (contract `TableContent`)

```jsonc
{
  "slideType": "TableSlide",
  "content": {
    "title": "Plans",
    "tableColumns": [                       // 2-8 columns; each {key,label}
      { "key": "feature", "label": "Feature" },
      { "key": "starter", "label": "Starter" },
      { "key": "pro",     "label": "Pro" }
    ],
    "tableRows": [                          // 1-12 rows; cells keyed by column.key
      { "name": "Seats",   "cells": { "starter": "3",     "pro": "Unlimited" } },
      { "name": "Support", "cells": { "starter": "Email", "pro": "24/7" } }
    ]
  }
}
```

## DataTableSlide  (contract `DataTableContent` — denser, compact)

```jsonc
{
  "slideType": "DataTableSlide",
  "content": {
    "title": "Q3 numbers",
    "dataColumns": [                        // 1-5; align: left|right|center
      { "key": "metric", "label": "Metric", "align": "left" },
      { "key": "value",  "label": "Value",  "align": "right" }
    ],
    "dataRows": [ { "metric": "MRR", "value": "$42k" } ]   // 1-8 rows
  }
}
```

---

## CodeBlockSlide  (contract `CodeContent`)

```jsonc
{
  "slideType": "CodeBlockSlide",
  "content": {
    "title": "Fetch a deck",
    "code": "const deck = await loadDeck('showcase');",   // OR codeTokens[]
    "codeLanguage": "ts",
    "codeShowLineNumbers": true,
    "codeCaption": "loader.ts"
  }
}
```
Requires `code` (string) **or** `codeTokens` (array). Keep snippets short.

## EquationSlide  (contract `EquationContent`)

```jsonc
{ "slideType": "EquationSlide", "content": { "title": "Growth", "tex": "y = a e^{kt}" } }
```
Requires `tex` **or** `equationHtml`.

---

## BoxDiagramSlide  (contract `DiagramContent`)

```jsonc
{
  "slideType": "BoxDiagramSlide",
  "content": {
    "title": "Pipeline",
    "diagramNodes": [                       // 2-20; x/y are 0-100 % of stage
      { "id": "a", "title": "Intake", "x": 15, "y": 50 },
      { "id": "b", "title": "Build",  "x": 50, "y": 50 },
      { "id": "c", "title": "Ship",   "x": 85, "y": 50 }
    ],
    "diagramEdges": [ { "from": "a", "to": "b" }, { "from": "b", "to": "c" } ]
  }
}
```
`id`s unique; edges reference them. `ERDiagramSlide` / `DatabaseDiagramSlide`
are siblings — see contracts (`entities`/`relationships` or `dbEntities`/`diagram`).

---

## LayoutSlide  (contract `LayoutContent`)

```jsonc
{
  "slideType": "LayoutSlide",
  "content": {
    "title": "Two-up",
    "layout": "split",
    "layoutSlots": [                        // 1-6 slots; each slot is free-form
      { "kind": "text",  "body": "Key point", "bullets": ["a", "b"] },
      { "kind": "code",  "code": "x = 1", "codeLanguage": "py" }
    ]
  }
}
```
Read `llm/27d-layout-slide.md` for the supported `kind`/`variant` values.

---

## TileSlide  (contract `TileContent`)  — note the field shape

```jsonc
{
  "slideType": "TileSlide",
  "content": {
    "title": "What we value",
    "tiles": [                              // 2-4 tiles; use `name`, NOT `title`
      { "name": "Craft", "tag": "01", "desc": "Detail obsession", "glyph": "Sparkles" },
      { "name": "Speed", "tag": "02", "desc": "Ship weekly" },
      { "name": "Care",  "tag": "03", "desc": "People first" }
    ],
    "tilesCaption": "Our three pillars"
  }
}
```
Tiles center vertically by contract — see `mem://design/tileslide-vertical-centering`.

---

## ChecklistSlide / NumberCalloutSlide / BlastRadiusSlide / SessionOutlineSlide

Also registered. Briefly:
- `ChecklistSlide` → `items[]` (2-7, each `{text, detail?, capsule?}`), `progressColor?`.
- `NumberCalloutSlide` → `number{from?,to,unit?,...}`, `label?`, `capsule?`.
- `BlastRadiusSlide` → cinematic single-word `title` (+ tuning knobs).
- `SessionOutlineSlide` → agenda/outline (see contract).

For exact bounds, read `src/slides/contracts.ts` — it is the runtime truth.
