# TitleSlide — authoring guide

**Purpose**: Hero opener. Eyebrow + headline + subtitle + capsule chips, on top of a deterministic ambient icon scatter (with optional brand accents).

**Template**: [`TitleSlide.json`](./TitleSlide.json)

---

## When to use

- Slide 1 of any deck.
- Any "section opener" where you want a full-bleed atmospheric background.
- For a centered mid-deck divider use **MiddleTitleSlide** instead.

## Required content fields

| Field      | Type                  | Notes                                              |
|------------|-----------------------|----------------------------------------------------|
| `title`    | `string`              | Multiline OK (`\n`). Wraps at the natural breakpoint. |

## Recommended content fields

| Field          | Type                          | Notes |
|----------------|-------------------------------|-------|
| `eyebrow`      | `string`                      | Brand line above the headline (e.g. `"Riseup Asia LLC"`). |
| `subtitle`     | `string`                      | One-line tagline beneath the title. |
| `capsules`     | `CapsuleSpec[]`               | 1–3 small chips (cohort tag, year, "Confidential"). |
| `titleAmbient` | `AmbientLayerSpec`            | **Required for hero slides.** Pin the icon scatter so it reproduces 1:1. See [`spec/slides/llm/04-ambient-and-title-background.md`](../../spec/slides/llm/04-ambient-and-title-background.md). |

## Animation

- `transition`: `FadeIn` (default) or `SlideIn`.
- `textAnimation`: `Bounce` for impact, `FadeIn` for restraint.
- Per-block overrides via `content.animations.{eyebrow,title,subtitle,capsules}`.

## House rules

- `titleStyle` MUST be `"white"` on noir backgrounds. Never `"gold"` for a hero title — that violates the contrast rule (`mem://design/contrast`).
- Eyebrow stays gold/cream, never white.
- Keep `titleShimmer: false` unless the user explicitly asks for the one-shot shimmer.

## Related specs

- [`spec/slides/15-title-slide-v2.md`](../../spec/slides/15-title-slide-v2.md) — full title-slide v2 contract.
- [`spec/slides/30-fullscreen-layout-polish.md`](../../spec/slides/30-fullscreen-layout-polish.md) — fullscreen layout polish.
- [`spec/slides/llm/09-title-background.md`](../../spec/slides/llm/09-title-background.md) — title background recipes.
