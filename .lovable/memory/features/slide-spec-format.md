---
name: slide-spec-format
description: JSON+MD spec structure per slide, including enabled flag, titleStyle, titleShimmer, and controller/header rules
type: feature
---

Every slide is one JSON file in `spec/slides/{deck}/NN-name.json` plus an MD companion. JSON is runtime source of truth (loaded via `import.meta.glob`).

## Top-level flags

- `slideNumber`, `slideName`, `slideType`, `transition`, `textAnimation` — required.
- **`enabled`** (bool, default `true`) — kill switch. `false` removes the slide from linear flow + indicator without deleting the file. Click-reveal targets are also unreachable when disabled.
- `isClickReveal` (bool) + `parentSlide` (int) — click-reveal slides live outside linear flow.
- `showBrandHeader`, `showPresenterChip` — booleans.
- **`titleStyle`** — `"cream"` (default, solid cream), `"gold"` (solid gold-glow), `"gradient"` (legacy — avoid).
- **`titleShimmer`** (bool, default false) — one-shot animated highlight sweep across the title on entrance. Use this instead of always-on gradients.
- `content` — slide-type-specific payload.

## Color rule

- No always-on gradients. Solid colors preferred.
- If gradient is used, it must be paired with motion (e.g. `shimmer-sweep` utility).

## Layout contract

- `BrandHeader` is `h-24`. Every slide body uses `pt-32 pb-20` so titles don't collide with the logo.
- Logo size: `h-16` (was `h-9`) for stronger brand presence.

## Controller

- Position: **bottom-right** (`fixed bottom-6 right-6`).
- Idle opacity 15%, scale 0.92. Hover or recent mousemove (2.2s) → opacity 1, scale 1.
- Always mounted; only opacity/scale animate.

Full reference: `spec/slides/00-fundamentals.md`.
