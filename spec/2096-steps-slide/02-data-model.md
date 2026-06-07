# 02 — Data Model (`items[]` vs `steps[]`)

Both step types are a `SlideSpec`; the renderer reads `spec.content`. The two
types differ in **which array key** they consume. Source of truth:
`src/slides/types.ts` (`StepSpec` at line 116, `SlideContent` at line 538).

---

## Type A — static outline: `content.items[]`

```ts
interface StepSlideContent {
  /** Small uppercase label above the title. Optional. */
  eyebrow?: string;
  /** Slide headline. REQUIRED. Keywords-only, ≤ ~6 words. */
  title: string;
  /** One short supporting line under the title. Optional, ≤ ~60 chars. */
  kicker?: string;
  /** The ordered list. REQUIRED. min 2, max 8 items. */
  items: StepItem[];
  /**
   * Zero-based index of the item to STATICALLY highlight. Optional.
   * Omit (or -1) → no active row (all items full opacity).
   * When set, active row glows; every other row dims to opacity 0.55.
   */
  activeIndex?: number;
}

interface StepItem {
  title: string;                 // REQUIRED. Keywords-only.
  subtitle?: string;             // One supporting line.
  meta?: string;                 // Trailing plain text (e.g. "5 min") → .capsule-meta
  capsule?: { text: string; color: string }; // PREFERRED for emphasis → <Capsule>
}
```

### Valid Type A JSON (annotated)

```json
{
  "slideType": "SessionOutlineSlide",   // ← Type A variant
  "transition": "FadeIn",
  "textAnimation": "Stagger",
  "content": {
    "eyebrow": "Today",                  // optional
    "title": "What we'll cover",         // REQUIRED
    "kicker": "Four moves, forty minutes.",
    "activeIndex": 0,                    // optional static spotlight (item 0 → label 01)
    "items": [                            // REQUIRED, 2–8 entries
      { "title": "Recap", "subtitle": "Where we left off", "capsule": { "text": "5 min", "color": "gold" } },
      { "title": "The problem", "subtitle": "Why it matters now", "meta": "10 min" },
      { "title": "The build", "subtitle": "Live walkthrough", "capsule": { "text": "20 min", "color": "ember" } },
      { "title": "Q&A", "subtitle": "Open floor", "meta": "5 min" }
    ]
  }
}
```

---

## Type B — interactive focus: `content.steps[]`

`steps[]` is a **superset** of the Type A item: same index+title+capsule plus
presenter narration and click affordances. Real shape (`StepSpec`, line 116):

```ts
interface StepSpec {
  label: string;                 // "Step 1" — short index label. REQUIRED.
  title: string;                 // keywords-only headline. REQUIRED.
  subtitle?: string;             // one supporting line under the title
  /** Right-panel narration — the ONLY place full sentences are allowed.
   *  string (Timeline/Focus, 1–2 sentences) OR
   *  { title?, bullets[]?, meta?, body? } (StepsChain3D, keywords-only). */
  description?: string | { title?: string; bullets?: string[]; meta?: string; body?: string };
  capsule?: { text: string; color: string };   // .capsule-{tone} only
  image?: string;                // optional per-step thumbnail (asset/svg/base64/data-uri)
  imageRole?: 'inlineThumbnail' | 'iconBadge' | 'bodyFigure';  // default inlineThumbnail
  cta?: StepCtaSpec;             // optional per-step CTA pill in the right panel
  expand?: CapsuleExpandSpec;    // inline expanding card on click
  revealSlide?: number;          // click routes the deck to this slide number
  revealLabel?: string;          // accessible label for the reveal action
  topOffsetPx?: number;          // per-step horizontal/vertical nudge (0–80)
}
```

### Valid Type B JSON (annotated)

```json
{
  "slideType": "StepTimelineSlide",      // ← Type B variant
  "transition": "SlideIn",
  "textAnimation": "SlideUp",
  "content": {
    "eyebrow": "How we work",
    "title": "Our process",              // REQUIRED
    "steps": [                            // REQUIRED, 2–6 recommended
      { "label": "Step 1", "title": "Discover",
        "description": "Listen, audit, align on the real problem.",
        "capsule": { "text": "Week 1", "color": "gold" } },
      { "label": "Step 2", "title": "Design",
        "description": "Prototype, test, narrow to one direction.",
        "capsule": { "text": "Week 2", "color": "ember" } },
      { "label": "Step 3", "title": "Deliver",
        "description": "Ship, measure, hand off.",
        "revealSlide": 12, "revealLabel": "See the case study" }
    ]
  }
}
```

---

## Field rules (both types)

- `title` (slide) is always required. Type A requires `items` (≥2, ≤8); Type B
  requires `steps` (≥2; >6 overflows the 1080px stage — split the slide).
- **`activeIndex` is zero-based in data** even though the label is 1-based:
  item 0 → label `01`.
- `meta` vs `capsule`: prefer `capsule`. If both present, capsule renders first.
- `description` is the **only** place full sentences are allowed — and only in
  Type B's right panel. Never put paragraphs in `subtitle`.
- **Never invent a third per-slide key.** `items[]` and `steps[]` are the only
  two arrays. Switch type by switching the key + `slideType`, not by adding new
  fields (see `01-two-step-types.md` → migration cost).

## Companion authoring doc

When adding a real step slide to a deck, also write the JSON+MD pair under
`spec/26-slide-definitions/{deck}/NN-name.{json,md}` (Core rule: spec-first).
The JSON there is the runtime source of truth; the MD explains intent.
