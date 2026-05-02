# 27a — TableSlide (LLM Authoring)

> Pack version: v0.181.0. Companion to `06-json-authoring-cheatsheet.md`. This file is the **field-by-field authoring contract** for `TableSlide`. If anything here contradicts an older `/spec/slides/NN-*.md`, this file wins.

`TableSlide` renders a comparison-style data table with title, columns, rows, per-row accent bars, automatic zebra striping, per-column alignment, and row-major cell fade-in animation on enter.

Use it when the brief is *"compare 4–8 options across 3–5 attributes"* — languages, frameworks, vendors, plans, regions, anything tabular. Don't use it for narrative tables of >12 rows or >8 columns; those don't fit the 1920×1080 stage at legible sizes.

---

## 1. Minimal valid example

```json
{
  "slideNumber": 12,
  "slideName": "compare-options",
  "slideType": "TableSlide",
  "transition": "FadeIn",
  "textAnimation": "Stagger",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "titleStyle": "white",
  "titleShimmer": false,
  "content": {
    "title": "Compare options",
    "tableColumns": [
      { "key": "name",    "label": "Option" },
      { "key": "speed",   "label": "Speed" },
      { "key": "cost",    "label": "Cost" },
      { "key": "verdict", "label": "Verdict" }
    ],
    "tableRows": [
      { "name": "Option A", "cells": { "speed": "Fast",   "cost": "$$",  "verdict": "Recommended" }, "accent": "gold" },
      { "name": "Option B", "cells": { "speed": "Medium", "cost": "$",   "verdict": "Good fit"    }, "accent": "teal" },
      { "name": "Option C", "cells": { "speed": "Slow",   "cost": "$$$", "verdict": "Avoid"       }, "accent": "ember" }
    ]
  }
}
```

That's the floor. Required by the contract: `title`, `tableColumns` (2–8), `tableRows` (1–12).

---

## 2. Required envelope fields (apply to every slideType)

| Field | Required | Notes |
|---|---|---|
| `slideNumber` | ✅ | `int > 0`, unique within deck. |
| `slideName` | ✅ | kebab-case, used for routing logs and grid view. |
| `slideType` | ✅ | Must be `"TableSlide"`. |
| `transition` | ✅ | Pick one: `FadeIn` `SlideIn` `PushIn` `PushLeft` `PushRight`. Vary across consecutive slides. |
| `textAnimation` | ✅ | `Bounce` `FadeIn` `SlideUp` `Stagger`. Don't repeat the previous slide's pair. |
| `isClickReveal` | ✅ | `false` for normal flow. |
| `showBrandHeader` | ✅ | Almost always `true`. |
| `showPresenterChip` | ✅ | Almost always `true`. |
| `titleStyle` | ✅ | `"white"` (default), `"cream"`, `"gold"`. House rule: titles WHITE on noir, never gold. |
| `titleShimmer` | ✅ | `false` unless this is a hero. |

---

## 3. `content.*` — field-by-field

### `title` *(required)*
Short, sentence-case headline. Keywords-first; never a sentence.

```json
"title": "Languages we use"
```

### `eyebrow` *(optional)*
Tiny ALL-CAPS label rendered above the title.

```json
"eyebrow": "STACK COMPARISON"
```

### `subtitle` *(optional)*
Single line under the title. Keep ≤8 words.

```json
"subtitle": "What we reach for and when."
```

### `tableColumns` *(required, 2–8 entries)*

Order = display order. Each column has:

| Field | Required | Type | Notes |
|---|---|---|---|
| `key` | ✅ | string | Stable id matched against `tableRows[].cells`. Pick lowerCamelCase. |
| `label` | ✅ | string | Header text. Rendered in display font. |
| `width` | optional | string | CSS width like `"22%"` or `"180px"`. Omit for auto-sizing. |
| `align` | optional | `'left' \| 'center' \| 'right'` | Flows into BOTH header and body cells in that column. Default `left`. |

```json
"tableColumns": [
  { "key": "lang",   "label": "Language" },
  { "key": "year",   "label": "Year",    "align": "right", "width": "12%" },
  { "key": "use",    "label": "Use case" },
  { "key": "rating", "label": "★",        "align": "center", "width": "8%" }
]
```

> The **first column is always the row-name column** — it pulls its value from `row.name`, NOT `row.cells[firstKey]`. Best practice: name the first column key something like `"name"` or `"option"` so the JSON reads naturally even though the runtime ignores it.

### `tableRows` *(required, 1–12 entries)*

Order = display order. Each row:

| Field | Required | Type | Notes |
|---|---|---|---|
| `name` | ✅ | string | Goes in the first column. Bold + accent bar. |
| `cells` | ✅ | `Record<string, string>` | Keyed by `tableColumns[].key`. Missing keys render as em-dash. |
| `accent` | optional | capsule color | Sets the left-edge bar color on the first cell. Default `"gold"`. One of: `gold` `ember` `cream` `ink` `outline` `violet` `teal` `rose` `sky`. |

```json
"tableRows": [
  { "name": "TypeScript", "cells": { "year": "2012", "use": "App + tooling", "rating": "★★★★★" }, "accent": "gold" },
  { "name": "Rust",       "cells": { "year": "2010", "use": "Performance",    "rating": "★★★★"  }, "accent": "ember" },
  { "name": "Python",     "cells": { "year": "1991", "use": "Data + glue",    "rating": "★★★★"  }, "accent": "teal" }
]
```

### `tableNote` *(optional)*

Muted italic note under the table. Use for footnotes, source citations, "as of {date}".

```json
"tableNote": "Source: 2025 internal stack survey."
```

### `gridPreset` *(optional, v0.181)*

Wrap the table in one of the deck-wide grid presets from `27e-layout-grid-presets.md` for consistent edge spacing. `'centered-hero'` is the most common pairing for Tables.

```json
"gridPreset": "centered-hero"
```

---

## 4. Behaviors that come for free

- **Zebra striping** — every other row gets `--surface-2 / 0.55` background. No opt-in needed.
- **Cell fade-in** — header cells stagger in (35ms each from 0.25s), body cells fade up in row-major order (35ms each from 0.45s). Suppressed under `prefers-reduced-motion`.
- **Theme awareness** — accent bar colors resolve through `ACCENT_HSL` so swapping themes (e.g. to `navy-blue`) retunes every row automatically.
- **Display font header** — `thead th` uses Ubuntu (or the theme's display override).

---

## 5. Forbidden

- ❌ More than 12 rows or 8 columns (won't fit at legible sizes on 1920×1080).
- ❌ Putting full sentences in cells. Keep cells ≤4 words.
- ❌ Hardcoding hex colors in cell text. Use `accent` to drive color.
- ❌ Promoting the cell-fade animation timings to a content field. They're locked.
- ❌ `accent` values outside the 9-color capsule palette.

---

## 6. Companion `.md` (deck author brief)

Every JSON slide ships a sibling `.md` with the design intent. For TableSlide, the brief should answer:

1. What is being compared and why now?
2. Which row is the "winner" / recommended pick (drives `accent`).
3. What metric the audience should walk away with.

Example:
```md
# 12 — Compare options

We're between three providers. Audience needs to walk away knowing
**Option A is the recommendation** (gold accent), with Option B as a
budget fallback (teal). Avoid C — flagged ember.
```
