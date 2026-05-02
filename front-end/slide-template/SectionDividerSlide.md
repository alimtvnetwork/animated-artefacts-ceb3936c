# SectionDividerSlide — authoring guide

**Purpose**: A clean section break inside a deck. Eyebrow + title + optional subtitle, with a strong horizontal rule treatment so the audience reads it as "new chapter".

**Template**: [`SectionDividerSlide.json`](./SectionDividerSlide.json)

---

## When to use

- Between major sections in a long deck (Discovery → Build → Ship).
- For a centred *interlude* moment with ambient atmosphere, prefer **MiddleTitleSlide**.
- For the deck *opener* use **TitleSlide**.

## Required content fields

| Field   | Type     | Notes                            |
|---------|----------|----------------------------------|
| `title` | `string` | Section name. Single line.       |

## Recommended content fields

| Field      | Type     | Notes |
|------------|----------|-------|
| `eyebrow`  | `string` | E.g. `"Section 02"`, `"Part II"`. |
| `subtitle` | `string` | One-line tagline. |

## Animation

- `transition`: `FadeIn` (default). `SlideIn` works if it doesn't collide with neighbouring slides.
- `textAnimation`: `FadeIn` (default).

## House rules

- Keep `titleStyle` `"cream"` or `"gold"` — divider slides are calm and warm, not white-bright.
- No capsules, no steps. The whole point is that this slide *contains nothing* but the section name.

## Related specs

- [`mem://features/slide-types`](../../.lovable/memory/features/slide-types.md).
