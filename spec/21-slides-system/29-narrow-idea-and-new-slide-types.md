# 29 — Narrow Idea Per Slide + four new slide types

**Status:** Spec addendum. Runtime not yet built (Phase 3 of `plan.md`).
**Authoritative for:** `DatabaseDiagramSlide`, `DataTableSlide`, `NumberCalloutSlide`, `EquationSlide`, plus the deck-wide *Narrow Idea Per Slide* density rule.
**Supersedes:** nothing. Extends `spec/21-slides-system/llm/CATALOG.json` + `23-slide-type-contracts.md`.

---

## 1. Narrow Idea Per Slide (deck-wide rule)

Every slide MUST communicate exactly one narrow idea. If a slide tries to teach two concepts, split it into two slides. Keywords only. Presenter narrates. Density is a defect.

**Per-type density caps (enforced via Zod where possible, asserted in `src/test/contracts.test.ts`):**

| Slide type | Cap |
|---|---|
| `KeywordSlide` | ≤6 capsules (existing) |
| `CapsuleListSlide` | ≤3 sections × ≤6 capsules each |
| `DataTableSlide` | ≤5 columns, ≤8 rows |
| `NumberCalloutSlide` | exactly 1 number |
| `EquationSlide` | exactly 1 equation |
| `DatabaseDiagramSlide` | ≤5 entities, ≤6 relationships |

**Authoring test:** read the slide aloud as the presenter. If the narration needs the word "and" twice, the slide has two ideas — split it.

---

## 2. New slide types

### 2.1 `DatabaseDiagramSlide`

**Purpose.** Show ONE schema concept (e.g. `users ↔ orders ↔ order_items`) as an entity-relationship diagram. NOT for full schemas — split across slides.

**Renderer.** Mermaid `erDiagram`, dynamic-imported on first mount of the slide. Theme variables wired to CSS tokens — never hardcoded:

```ts
const mermaidTheme = {
  primaryColor:        'hsl(var(--surface-2))',
  primaryTextColor:    'hsl(var(--cream))',
  primaryBorderColor:  'hsl(var(--gold))',
  lineColor:           'hsl(var(--gold) / 0.6)',
  secondaryColor:      'hsl(var(--surface-1))',
  tertiaryColor:       'hsl(var(--ember) / 0.18)',
  fontFamily:          'Inter, system-ui, sans-serif',
};
```

**JSON shape (preview — final Zod in Phase 3):**

```jsonc
{
  "type": "DatabaseDiagramSlide",
  "title": "Order graph",
  "eyebrow": "Schema · core",
  "content": {
    "diagram": "erDiagram\n  USERS ||--o{ ORDERS : places\n  ORDERS ||--|{ ORDER_ITEMS : contains",
    "caption": "Three entities, two relationships."
  },
  "transition": "FadeIn",
  "textAnimation": "FadeIn"
}
```

**Reduced motion.** No auto-pan, no auto-zoom, no entrance scale. The diagram fades in once and stays still.

### 2.2 `DataTableSlide`

**Purpose.** Compact, capsule-styled comparison or summary table. Caps: 5 columns × 8 rows.

**Behavior.** Header row: display font + `--gold` underline. Body rows: zebra via existing `--surface-2` token. First-cell accent bar via `data-accent` (reuse existing `TableSlide` infrastructure — this type is its narrow-idea-enforced sibling). Reveal: header at 0.25s, body rows Stagger 35ms, suppressed under `prefers-reduced-motion`.

**JSON shape (preview):**

```jsonc
{
  "type": "DataTableSlide",
  "title": "Plan comparison",
  "content": {
    "columns": [
      { "key": "plan",   "label": "Plan",   "align": "left" },
      { "key": "seats",  "label": "Seats",  "align": "right" },
      { "key": "price",  "label": "Price",  "align": "right" }
    ],
    "rows": [
      { "plan": "Solo",   "seats": "1",   "price": "$0",   "accent": "cream" },
      { "plan": "Team",   "seats": "10",  "price": "$49",  "accent": "gold" },
      { "plan": "Studio", "seats": "50",  "price": "$199", "accent": "ember" }
    ]
  },
  "transition": "SlideIn",
  "textAnimation": "Stagger"
}
```

### 2.3 `NumberCalloutSlide`

**Purpose.** ONE oversized animated number. Comparisons require a separate slide or `MetricGridSlide`.

**Animation.** Count-up from `0` (or `from`) to `to` over duration `dur`. Easing union:

```ts
type CountUp = 'linear' | 'easeOutQuint' | 'spring';
```

Timing constants (added to `index.css` `:root`):

```css
:root {
  --dur-count-fast: 900ms;
  --dur-count-slow: 1800ms;
}
```

`prefers-reduced-motion` → snap to final value, no tween.

**JSON shape (preview):**

```jsonc
{
  "type": "NumberCalloutSlide",
  "eyebrow": "Engagement",
  "content": {
    "number": { "from": 0, "to": 92, "unit": "%", "easing": "easeOutQuint", "duration": "slow" },
    "label":  "of users return within 7 days",
    "capsule": { "color": "gold", "text": "Cohort: Apr 2026" }
  },
  "transition": "PushIn",
  "textAnimation": "FadeIn"
}
```

### 2.4 `EquationSlide`

**Purpose.** ONE equation. Derivations are a step timeline of single-equation slides.

**Renderer.** Pre-rendered KaTeX HTML produced at build time by `scripts/prerender-equations.ts` (Phase 3). NO runtime KaTeX dependency on the host. The slide receives an opaque `equationHtml` string and a list of term ids for the Stagger animation.

**JSON shape (preview):**

```jsonc
{
  "type": "EquationSlide",
  "title": "Compound growth",
  "content": {
    "tex": "A = P\\,(1 + r)^t",
    "termIds": ["A", "P", "factor", "exp"],
    "labels": {
      "left":  { "color": "cream",  "text": "P = principal" },
      "right": { "color": "ember",  "text": "t = years" }
    }
  },
  "transition": "FadeIn",
  "textAnimation": "Stagger"
}
```

Reveal: each term fades in 80ms apart, total ≤ 0.6s. Reduced motion → all visible at once.

---

## 3. Sample deck additions

Authored under `spec/26-slide-definitions/sample/` (Phase 1 of `plan.md`):

| Seq | File | Type | Narrow idea |
|---|---|---|---|
| 40 | `40-database-erd.{json,md}` | `DatabaseDiagramSlide` | "Three entities link the order graph." |
| 41 | `41-data-table.{json,md}` | `DataTableSlide` | "Three plans, three price points." |
| 42 | `42-number-callout.{json,md}` | `NumberCalloutSlide` | "92 % of users return in week one." |
| 43 | `43-equation.{json,md}` | `EquationSlide` | "Compound growth in one line." |

Every MD companion documents: narrow idea (one sentence), capsule colors, transition + text animation, image refs, why it is narrow.

---

## 4. Cross-references

- Memory: `mem://design/slide-narrow-idea` (rule rationale + how-to-apply).
- Catalog: `spec/21-slides-system/llm/CATALOG.json` will gain four `slideTypes` entries in Phase 3.
- Contracts: `spec/21-slides-system/llm/23-slide-type-contracts.md` required-fields table will be extended in Phase 3.
- Audit: `audit/subsystems/15-mermaid-and-erd.md`, `16-equation-rendering.md`, `17-number-animation.md`, `18-data-table.md` will reference this addendum as the spec source.
