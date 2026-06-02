# 01 — Data Model (shared `content` schema)

Every step-based slide is a `SlideSpec`. The renderer reads `spec.content`.
This is the **complete, normative** schema for the outline / step family.

## TypeScript contract

```ts
interface StepSlideContent {
  /** Small uppercase label above the title. Optional. */
  eyebrow?: string;

  /** The slide headline. REQUIRED. Keywords-only, ≤ ~6 words. */
  title: string;

  /** One short supporting line under the title. Optional, ≤ ~60 chars. */
  kicker?: string;

  /** The ordered list. REQUIRED. min 2, max 8 items. */
  items: StepItem[];

  /**
   * Zero-based index of the item to highlight. Optional.
   * Omit (or -1) for "no active row" (all items at full opacity).
   * When set, the active row glows and every other row dims to 0.55.
   */
  activeIndex?: number;

  /**
   * Optional per-region animation preset overrides. Each value is a
   * preset name resolved by `resolvePreset()` (see 04-animation-and-reveal.md).
   * When omitted, each region inherits the slide's `textAnimation`.
   */
  animations?: {
    eyebrow?: string;
    title?: string;
    kicker?: string;
    items?: string;
  };
}

interface StepItem {
  /** Item headline. REQUIRED. Keywords-only. */
  title: string;

  /** One supporting line. Optional. */
  subtitle?: string;

  /** Trailing plain-text meta (e.g. "5 min"). Optional. Rendered as `.capsule-meta`. */
  meta?: string;

  /**
   * Trailing colored pill. Optional. PREFERRED over `meta` for emphasis.
   * `color` is a capsule tone: 'gold' | 'ember' | 'cream' | 'ink' | ...
   * Rendered via the shared <Capsule> component (which uses `.capsule-{tone}`).
   */
  capsule?: { text: string; color: string };
}
```

## Field rules

- `title` (slide) and `items` are the only required fields. A slide with fewer
  than 2 items is invalid; more than 8 will overflow the 1080px stage — split
  into two slides instead of shrinking type.
- `meta` vs `capsule`: if `capsule` is present, prefer it. If both are present,
  the capsule renders first, then the meta text (rare; only when you genuinely
  need both a tag and a raw value).
- `activeIndex` is **zero-based** in the data even though the displayed label is
  1-based. Item 0 → label `01`.
- Never put paragraphs in `subtitle`. One line. If you need more, it belongs in
  presenter notes, not on the slide.

## Example JSON (a valid outline slide)

```json
{
  "slideNumber": 3,
  "slideName": "Agenda",
  "slideType": "SessionOutlineSlide",
  "transition": "FadeIn",
  "textAnimation": "Stagger",
  "content": {
    "eyebrow": "Today",
    "title": "What we'll cover",
    "kicker": "Four moves, forty minutes.",
    "activeIndex": 0,
    "items": [
      { "title": "Recap", "subtitle": "Where we left off", "capsule": { "text": "5 min", "color": "gold" } },
      { "title": "The problem", "subtitle": "Why it matters now", "meta": "10 min" },
      { "title": "The build", "subtitle": "Live walkthrough", "capsule": { "text": "20 min", "color": "ember" } },
      { "title": "Q&A", "subtitle": "Open floor", "meta": "5 min" }
    ]
  }
}
```

## Companion authoring doc

When you add a real outline slide to a deck, also write the JSON+MD pair under
`spec/26-slide-definitions/{deck-name}/NN-name.{json,md}` (Core rule: spec-first).
The JSON there is the runtime source of truth; the MD explains intent.
