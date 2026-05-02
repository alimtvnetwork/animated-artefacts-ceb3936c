---
name: style-guide
description: /style-guide is a single-page in-app cheat sheet — preset tokens (typography + color + shimmer), resolution rules, capsule colors, and live SlidePreview thumbnails of every slide type.
type: feature
---

## What

`/style-guide` (StyleGuidePage) is the canonical reference for anyone
authoring slides in this deck. Single page, no nav, scroll top → bottom:

1. Intro — what the premium preset is.
2. Typography scale — 4 classes (`.slide-title-display`, `.slide-title-content`, `.slide-eyebrow`, `.slide-subtitle`) with verbatim spec + a live example block.
3. Title color tokens — 4 classes + `.shimmer-sweep` with live samples.
4. Color resolution — the 3-tier precedence list from `resolveTitleStyle`.
5. Capsule colors — the 5 fills rendered live (gold/ember/cream/ink/outline) with usage notes.
6. Slide types — every `SlideTypeValue` rendered as a live `SlidePreview` (seeded from `SLIDE_TYPE_SCHEMAS` defaults via `makeSlide(type, n, 'premium')`).

## Why live, not screenshots

Thumbnails are the actual slide components. The page doubles as a smoke
test — a broken slide type shows up here immediately. Authors also see the
*current* preset output, never a stale screenshot.

## Where it lives

- Route: `/style-guide` registered in `src/App.tsx`.
- File: `src/pages/StyleGuidePage.tsx`.
- Token tables (`TYPOGRAPHY_TOKENS`, `TITLE_COLOR_TOKENS`, `CAPSULE_TOKENS`) are inline and must be kept in sync with `src/index.css` and `src/slides/preset.ts`.

## Authoring rule

If a new preset token is added to `index.css` (or a new title color class),
it MUST be added to the corresponding table in this page so authors can
discover it.
