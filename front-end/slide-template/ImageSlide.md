# ImageSlide — authoring guide

**Purpose**: Hero image with optional eyebrow / title / subtitle / capsules overlaid. Use for product shots, screenshots, photography, or any slide where a single image carries the message.

**Template**: [`ImageSlide.json`](./ImageSlide.json)

---

## When to use

- A single image IS the slide.
- Screenshots that need a small caption bar.
- Photography moments inside a content-heavy deck.

## Required content fields

| Field   | Type     | Notes                                            |
|---------|----------|--------------------------------------------------|
| `image` | `string` | Image URL. Public path or registered brand slug. |

## Recommended content fields

| Field      | Type             | Notes |
|------------|------------------|-------|
| `eyebrow`  | `string`         | Wide-tracking line above the title. |
| `title`    | `string`         | Caption headline. Optional — image-only slides leave blank. |
| `subtitle` | `string`         | One-line caption under the title. |
| `capsules` | `CapsuleSpec[]`  | 1–3 chips — credit, year, tag. |

## Animation

- `transition`: `FadeIn` (default). Avoid `PushIn` on full-bleed images — it looks janky.
- `textAnimation`: `FadeIn` keeps the focus on the image.

## House rules

- Use the deck's `assets.brand` registry for any branded artwork; never hard-code paths in slide JSON.
- Image MUST exist in `/public` or be registered in `deck.assets.brand` so the boot-time validator catches typos.
- Alt text comes from `title` (when set) or `slideName` — write `title` even on image-only slides for a11y.

## Related specs

- [`mem://features/asset-registry`](../../.lovable/memory/features/asset-registry.md) — strict-mode asset rules.
