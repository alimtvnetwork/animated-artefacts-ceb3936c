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
    "layout": "split-2-equal",               // see preset list below
    "layoutVerticalAlign": "start",          // "start" | "center"
    "layoutSlots": [                          // 1-6 slots
      { "kind": "card", "variant": "accent", "body": "Key point", "bullets": ["a", "b"] },
      { "kind": "codeblock", "code": "x = 1", "codeLanguage": "py" }
    ]
  }
}
```
Legal values (verbatim from `src/slides/types.ts`):
- **`content.layout`** (`LayoutGridPreset`): `split-5-7`, `split-4-8`, `split-3-9`,
  `split-2-equal`, `3-panel`, `12-column`, `card-grid-2x3`, `card-grid-3x3`, `centered-hero`.
- **slot `kind`**: `card` (default), `plain`, `codeblock`.
- **slot `variant`**: `default`, `success`, `danger`, `accent`.

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

## QrMeetingSlide  (contract `QrMeetingContent`)

```jsonc
{
  "slideType": "QrMeetingSlide",
  "content": {
    "meetingUrl": "https://riseup.example/join",   // one of meetingUrl|qrUrl|qrAsset
    "qrStyle": "riseup-finder"                       // "clean" | "riseup-finder" (default)
  }
}
```
`qrStyle` legal values: `clean`, `riseup-finder` (default). A `qrAsset` always renders `clean`.

---

## ChecklistSlide  (contract `ChecklistContent`)

```jsonc
{
  "slideType": "ChecklistSlide",
  "content": {
    "title": "Launch readiness",
    "progressColor": "gold",                 // "gold" | "ember" | "cream"
    "items": [                               // 2-7 items
      { "text": "Tests green", "detail": "878 passing", "capsule": { "color": "teal", "text": "QA" } },
      { "text": "Docs updated" }
    ]
  }
}
```
Each item: `text` (required), `detail?` (≤120 chars), `capsule?` (full 9-color enum).

---

## NumberCalloutSlide  (contract `NumberCalloutContent`)

```jsonc
{
  "slideType": "NumberCalloutSlide",
  "content": {
    "number": {                              // `to` required; rest optional
      "from": 0, "to": 42, "unit": "%",
      "easing": "easeOutQuint",              // "linear" | "easeOutQuint" | "spring"
      "duration": "slow",                    // "fast" | "slow"
      "decimals": 0                          // 0-6
    },
    "label": "Faster onboarding",
    "capsule": { "color": "gold", "text": "2026" }   // color: gold|ember|cream only
  }
}
```

---

## BlastRadiusSlide  (contract `BlastRadiusContent`) — cinematic single-word moment

```jsonc
{
  "slideType": "BlastRadiusSlide",
  "content": {
    "title": "Impact",                       // required, ≤40 chars
    "eyebrow": "What changes",                // optional, ≤40
    "subtitle": "Everything downstream",      // optional, ≤80
    "particleCount": 60,                      // optional 0-80
    "shardCount": 10,                         // optional 0-14
    "gradientAngle": 135                      // optional 0-360
  }
}
```
Usually only `title` is set — tuning knobs have baked defaults.

---

## SessionOutlineSlide  (contract `SessionOutlineContent`) — numbered agenda

```jsonc
{
  "slideType": "SessionOutlineSlide",
  "content": {
    "title": "Today",                        // required ≤80
    "eyebrow": "Agenda",                      // optional ≤40
    "kicker": "Three acts",                   // optional ≤160
    "activeIndex": 1,                          // optional 0-7 — dims all but this row
    "items": [                                // 2-8 items
      { "title": "Setup",   "subtitle": "Why we're here", "meta": "10m" },
      { "title": "Build",   "meta": "30m", "capsule": { "color": "ember", "text": "live" } },
      { "title": "Wrap-up", "meta": "5m" }
    ]
  }
}
```
Each item: `title` (required ≤60), `subtitle?` (≤120), `meta?` (≤20), `capsule?` (9-color).

---

## ERDiagramSlide / DatabaseDiagramSlide  (siblings of BoxDiagram)

- `ERDiagramSlide` → `entities[]`/`relationships[]` (preferred) **or** `diagramNodes[]`/`diagramEdges[]`; 2-20 entities.
- `DatabaseDiagramSlide` → `dbEntities[]` (2-5, each `{id,name,x?,y?,fields?[]}`) + `dbRelationships[]`, **or** a Mermaid `diagram` string (≥10 chars).

For exact bounds, `src/slides/contracts.ts` is the runtime truth — always validate with `bun run test`.
