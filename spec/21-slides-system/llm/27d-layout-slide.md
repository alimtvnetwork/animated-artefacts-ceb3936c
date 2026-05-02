# 27d — LayoutSlide (LLM Authoring)

> Pack version: v0.181.0. Companion to `06-json-authoring-cheatsheet.md`. Field-by-field authoring contract for `LayoutSlide`. If anything here contradicts an older `/spec/slides/NN-*.md`, this file wins.

`LayoutSlide` is the **escape hatch** when none of the specialised slide types fits. It's a generic title-plus-grid wrapper: pick a grid preset, drop 1–6 slots in, each slot renders as a card / plain text block / inline code block.

Use it when the brief is *"two columns of bullets"*, *"pros vs cons"*, *"three feature cards"*, *"explanation on the left, code on the right"*. Don't reach for it when a specialised slide type fits — `KeywordSlide` for vocabulary lists, `CapsuleListSlide` for chip rows, `MetricGridSlide` for big numbers, `TableSlide` for comparisons. `LayoutSlide` is for *prose-shaped* content that doesn't have a dedicated type.

For broader designer-grid background and the deck-wide `gridPreset` field that wraps ANY slide type in the same spacing tokens, see `27e-layout-grid-presets.md`.

---

## 1. Minimal valid example

```json
{
  "slideNumber": 15,
  "slideName": "pros-cons",
  "slideType": "LayoutSlide",
  "transition": "FadeIn",
  "textAnimation": "Stagger",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "titleStyle": "white",
  "titleShimmer": false,
  "content": {
    "title": "Trade-offs",
    "layout": "split-2-equal",
    "layoutSlots": [
      { "kind": "card", "title": "Pros", "body": "Fast, simple, predictable.", "variant": "success" },
      { "kind": "card", "title": "Cons", "body": "Limited surface area.",      "variant": "danger"  }
    ]
  }
}
```

Required by the contract: `title`, `layoutSlots` (1–6).

---

## 2. Required envelope fields

Same as every slideType — see the envelope table in `27a-table-slide.md` §2. `slideType` must be `"LayoutSlide"`.

---

## 3. `content.*` — field-by-field

### `title` *(required)*
Short, sentence-case headline.

### `eyebrow` / `subtitle` *(optional)*
Standard meanings.

### `layout` *(optional, default `'split-2-equal'`)*

Which `.slide-grid-*` preset to render `layoutSlots[]` inside. One of the 9 presets from `27e-layout-grid-presets.md`:

| Value | Layout | Best for |
|---|---|---|
| `'split-5-7'` | 5fr / 7fr | explanation + visual |
| `'split-4-8'` | 4fr / 8fr | short prose + big diagram |
| `'split-3-9'` | 3fr / 9fr | sidebar + main canvas |
| `'split-2-equal'` *(default)* | 1fr / 1fr | pros/cons, before/after |
| `'3-panel'` | 1fr × 3 | comparison triplets |
| `'12-column'` | 12-track designer grid | when slots need explicit `grid-column: span N` placement |
| `'card-grid-2x3'` | 1fr / 1fr (rows wrap) | 2-col card flow |
| `'card-grid-3x3'` | 1fr × 3 | 3-col card flow |
| `'centered-hero'` | flex centered | single centered column hero |

```json
"layout": "card-grid-3x3"
```

### `layoutSlots` *(required, 1–6 entries)*

Each slot becomes one cell of the chosen grid in document order.

| Field | Required | Type | Notes |
|---|---|---|---|
| `kind` | optional | `'card' \| 'plain' \| 'codeblock'` | Default `'card'`. `card` paints `.slide-card` (border + padding). `plain` is raw text in a div. `codeblock` renders a `.slide-codeblock`. |
| `eyebrow` | optional | string | Tiny ALL-CAPS label above the slot title. |
| `title` | optional | string | Bold heading at the top of the slot. |
| `body` | optional | string | Body text. **Keywords-first; ≤2 sentences.** |
| `bullets` | optional | `string[]` | Bullet list rendered after the body. Each bullet ≤8 words. |
| `code` | optional | string | Used when `kind === 'codeblock'` — the inline code body. |
| `codeLanguage` | optional | string | Used when `kind === 'codeblock'` — language hint (currently rendered without shiki to keep slot bundles tiny). |
| `variant` | optional | `'default' \| 'success' \| 'danger' \| 'accent'` | Border color modifier on `.slide-card`. Ignored for `plain` and `codeblock` kinds. |

#### Slot kind: `'card'`

```json
{
  "kind": "card",
  "eyebrow": "RECOMMENDED",
  "title": "Option A",
  "body": "Fastest path to launch.",
  "bullets": ["1-day install", "No infra changes", "Audit-ready"],
  "variant": "success"
}
```

#### Slot kind: `'plain'`

```json
{
  "kind": "plain",
  "title": "What we're solving",
  "body": "Manual reconciliation eats 8h/week per analyst."
}
```

#### Slot kind: `'codeblock'`

```json
{
  "kind": "codeblock",
  "title": "Install",
  "code": "bun add @riseup/sdk\nbun riseup init",
  "codeLanguage": "bash"
}
```

> If you need real syntax highlighting + copy button + line emphasis, use the dedicated `CodeBlockSlide` (see `27b`). The slot-level `codeblock` is a lightweight fallback for *one slot among many* — it does NOT highlight tokens, render a copy button, or animate per-line emphasis.

---

## 4. Worked examples

### Pros vs cons (`split-2-equal`)
```json
"content": {
  "title": "Buy vs build",
  "layout": "split-2-equal",
  "layoutSlots": [
    { "kind": "card", "title": "Buy", "bullets": ["Live in 2 weeks", "$$ recurring", "Vendor lock-in"], "variant": "success" },
    { "kind": "card", "title": "Build", "bullets": ["3 months", "Full control", "Carries forever"], "variant": "danger" }
  ]
}
```

### Three feature cards (`3-panel`)
```json
"content": {
  "title": "What ships in v1",
  "layout": "3-panel",
  "layoutSlots": [
    { "kind": "card", "eyebrow": "CORE", "title": "Sync engine", "body": "Bidirectional, conflict-aware." },
    { "kind": "card", "eyebrow": "CORE", "title": "Audit log",   "body": "Immutable, queryable." },
    { "kind": "card", "eyebrow": "ADD-ON", "title": "Webhooks",  "body": "Per-event, retry-safe." }
  ]
}
```

### Explanation + code (`split-5-7`)
```json
"content": {
  "title": "How auth works",
  "layout": "split-5-7",
  "layoutSlots": [
    { "kind": "plain", "title": "Flow", "body": "We exchange the OAuth code for a session JWT, then store the refresh token httpOnly." },
    { "kind": "codeblock", "title": "Exchange call", "code": "POST /auth/callback\n{ code }", "codeLanguage": "http" }
  ]
}
```

### 12-column with explicit slot widths

When you pick `'12-column'`, slots inherit equal `1fr` columns by default. To make a slot span N tracks, use the standard wrapper field for that slot — currently the slot doesn't expose a `colSpan` field, so any non-equal split should use one of the named presets (`split-5-7`, `split-3-9`, etc.) instead. `'12-column'` is most useful when **wrapping a non-LayoutSlide via `gridPreset`** and styling slot children directly with Tailwind `col-span-*` utilities.

---

## 5. Forbidden

- ❌ More than 6 slots (contract caps at 6 — anything bigger should be a different slide type).
- ❌ Multi-paragraph `body` text. House rule is keywords-first; ≤2 sentences per slot.
- ❌ Markdown emphasis in any string field — strings are rendered verbatim.
- ❌ Reaching for `LayoutSlide` when a specialised type fits (`KeywordSlide`, `CapsuleListSlide`, `MetricGridSlide`, `TableSlide`, `BoxDiagramSlide`).
- ❌ Inline hex colors. `variant` is the only color knob.
- ❌ Heavy code in a slot's `codeblock`. >5 lines belongs on a real `CodeBlockSlide`.

---

## 6. Companion `.md` brief

Should answer:
1. Why `LayoutSlide` instead of a specialised type? (rejection criteria for the alternatives.)
2. Why this `layout` preset? (split-2-equal vs 3-panel vs 12-column.)
3. What does the audience walk away with?
