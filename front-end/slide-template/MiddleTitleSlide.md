# MiddleTitleSlide — authoring guide

**Purpose**: Mid-deck section break / interlude ("Ideas to share" moment). Centred eyebrow + headline + optional subtitle on a dark slate with a warm amber spotlight and scattered ambient icons.

**Template**: [`MiddleTitleSlide.json`](./MiddleTitleSlide.json)

---

## When to use

- Interludes between major sections of a deck.
- Anywhere you want a calm pause beat — single sentence, full bleed.
- For the deck *opener* use **TitleSlide** instead.

## Required content fields

| Field   | Type     | Notes                                  |
|---------|----------|----------------------------------------|
| `title` | `string` | Single line preferred; multiline OK.   |

## Recommended content fields

| Field      | Type     | Notes |
|------------|----------|-------|
| `eyebrow`  | `string` | Wide-tracking line above the title (e.g. `"Section 02"`). |
| `subtitle` | `string` | One-line tagline under the title. |

## Animation

- `transition`: `FadeIn` (default) — keeps the pause beat calm. `PushIn` if you want momentum.
- `textAnimation`: `FadeIn` (default). `Stagger` works if you have eyebrow + title + subtitle.

## House rules

- Keep `titleStyle` `"cream"` or `"white"`. Gold titles compete with the amber spotlight.
- No capsules, no steps — this slide intentionally has nothing else on it.
- `showBrandHeader: false` is the norm so the moment reads as a true pause.

## Related specs

- [`spec/slides/26-middle-title-slide.md`](../../spec/slides/26-middle-title-slide.md) — canonical contract.
- [`mem://features/middle-title-slide`](../../.lovable/memory/features/middle-title-slide.md).
