# 27c — BoxDiagramSlide (LLM Authoring)

> Pack version: v0.181.0. Companion to `06-json-authoring-cheatsheet.md`. Field-by-field authoring contract for `BoxDiagramSlide`. If anything here contradicts an older `/spec/slides/NN-*.md`, this file wins.

`BoxDiagramSlide` renders an inline-SVG diagram of titled boxes with optional field rows, connected by directional edges with crow's-foot / single-tick cardinality markers.

Use it for ER schemas, microservice maps, state machines, dependency graphs, DAGs — any "boxes connected by labeled arrows" picture. For ER specifically, prefer the dedicated `ERDiagramSlide` (auto navy-blue palette + `entities` / `relationships` field names) — see `27d` for that variant.

Stage canvas: 1600×900 with positions in **percent** (0–100) of the canvas, NOT pixels. This keeps diagrams responsive across the editor, presenter, and PDF export.

---

## 1. Minimal valid example

```json
{
  "slideNumber": 14,
  "slideName": "service-map",
  "slideType": "BoxDiagramSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "titleStyle": "white",
  "titleShimmer": false,
  "content": {
    "title": "How it connects",
    "diagramNodes": [
      { "id": "api", "title": "API",   "x": 10, "y": 30 },
      { "id": "db",  "title": "Postgres", "x": 70, "y": 30 }
    ],
    "diagramEdges": [
      { "from": "api", "to": "db", "label": "writes" }
    ]
  }
}
```

Required by the contract: `title`, `diagramNodes` (2–20 entries).

---

## 2. Required envelope fields

Same as every slideType — see the envelope table in `27a-table-slide.md` §2. `slideType` must be `"BoxDiagramSlide"`.

---

## 3. `content.*` — field-by-field

### `title` *(required)*
Short, sentence-case headline.

```json
"title": "How it connects"
```

### `eyebrow` / `subtitle` *(optional)*
Standard meanings; see TableSlide doc.

### `diagramExplanation` *(optional)*
Short paragraph rendered to the LEFT of the diagram in a 4/8 split. Use for "what to look at" guidance — keep to 2–3 short sentences max.

```json
"diagramExplanation": "All writes flow through the API. The DB never receives traffic from the edge directly."
```

### `diagramNodes` *(required, 2–20 entries)*

Each node is an absolutely-positioned box. Position is in **% of the 1600×900 canvas**, NOT pixels.

| Field | Required | Type | Notes |
|---|---|---|---|
| `id` | ✅ | string | Stable id, must be unique. Edges reference these. Pick lowerCamelCase. |
| `title` | ✅ | string | Header text rendered in the box's navy header bar. |
| `x` | ✅ | `number` 0–100 | Top-left x as % of canvas. |
| `y` | ✅ | `number` 0–100 | Top-left y as % of canvas. |
| `w` | optional | `number` 0–100 | Box width as % of canvas. Default `22`. |
| `fields` | optional | `DiagramFieldSpec[]` | Field rows inside the box. Empty array = title-only box. |

#### `DiagramFieldSpec`

| Field | Required | Type | Notes |
|---|---|---|---|
| `name` | ✅ | string | Left-aligned label. |
| `type` | optional | string | Right-aligned, muted (good for SQL types, units, defaults). |
| `role` | optional | `'pk' \| 'fk' \| 'plain'` | `pk` = primary-accent (cyan in navy-blue, gold elsewhere). `fk` = secondary-accent (orange/ember). `plain` (default) = default foreground. |

```json
"diagramNodes": [
  {
    "id": "users",
    "title": "users",
    "x": 8, "y": 18, "w": 24,
    "fields": [
      { "name": "id",         "type": "uuid",      "role": "pk" },
      { "name": "email",      "type": "text" },
      { "name": "created_at", "type": "timestamp" }
    ]
  },
  {
    "id": "posts",
    "title": "posts",
    "x": 68, "y": 18, "w": 24,
    "fields": [
      { "name": "id",      "type": "uuid", "role": "pk" },
      { "name": "user_id", "type": "uuid", "role": "fk" },
      { "name": "body",    "type": "text" }
    ]
  }
]
```

### `diagramEdges` *(optional)*

Directed edges between two nodes. Renders as a connector with cardinality markers at each end.

| Field | Required | Type | Notes |
|---|---|---|---|
| `from` | ✅ | string | `diagramNodes[].id` of source. |
| `to` | ✅ | string | `diagramNodes[].id` of target. |
| `label` | optional | string | Verb rendered at the connector midpoint (`"writes"`, `"depends on"`, `"emits"`). Keep ≤2 words. |
| `cardinality` | optional | `['1' \| 'N', '1' \| 'N']` | `'1'` = single perpendicular tick. `'N'` = crow's-foot. Default `['1','N']`. |

```json
"diagramEdges": [
  { "from": "users", "to": "posts", "label": "authors", "cardinality": ["1", "N"] }
]
```

> Bad-id edges (referencing a `from` or `to` that's not in `diagramNodes`) render no connector but don't throw — keep ids in sync.

### `gridPreset` *(optional, v0.181)*
Diagrams usually look best with the default centered framing. If the diagram is busy, try `'split-3-9'` to put the explanation on the left.

---

## 4. Layout tips

- **Two boxes:** `x: 10` left, `x: 68` right, `y: 30` for both. Width 22.
- **Three boxes in a row:** `x: 6 / 39 / 72`, `y: 30`, `w: 22`.
- **Hub-and-spoke:** put the hub at `x: 39, y: 38` (centered, slightly lower) and arrange spokes around it.
- **Layered architecture:** stack `y` at 12 / 38 / 64, edges all flow downward.
- **Don't crowd the title** — keep `y >= 14` so the diagram doesn't collide with the header bar.

---

## 5. Forbidden

- ❌ Pixel coordinates (`x: 320`). Always %.
- ❌ More than 20 nodes (contract caps at 20).
- ❌ Edges with non-existent `from` / `to` ids.
- ❌ `cardinality` values other than `'1'` or `'N'`.
- ❌ Long labels (>2 words) — they overflow the connector midpoint.
- ❌ Hardcoded hex colors. Field colors come from `role`.
- ❌ Filling >6 fields per box — they'll overflow vertically.

---

## 6. Companion `.md` brief

Should answer:
1. What's the *insight* the diagram delivers? (one sentence)
2. Which entity is the "main character"? (drives node placement / accent)
3. Which connection is the one to talk about?

For ER-style schema diagrams specifically, use `ERDiagramSlide` (see `27d`) — it gives you `entities` / `relationships` field names, an automatic navy-blue palette, and the exact same JSON shape under different keys.
