# Image-derived color themes

**Slug:** image-derived-themes
**Status:** pending
**Parent:** 05-slide-options-themes-and-number-controller
**Created:** 2026-06-06

## Goal
Add new color themes derived from user-supplied reference images. Store the
reference images under assets + a reference folder; extract palettes; create
theme JSON in `front-end/themes/<name>/` (`themes.json` + `colors.json`),
mirroring `noir-gold`.

## Detail
- Reference images: `src/assets/theme-references/` (or
  `front-end/themes/<name>/reference/`) — committed via lovable-assets if large.
- Document each theme's source image + extracted palette in
  `spec/21-slides-system/themes` (or a new `theme-references` reference doc) and
  add a memory entry pointing to it.
- Each theme: HSL tokens only, light/dark mode, respects capsule `.capsule-{tone}`
  contract (memory: light-theme-capsule-fg-rule). Wire into theme switcher +
  per-deck theme persistence (`riseup.theme.byDeck.v1`).

## Blocked on
User must supply the reference images first ("I will give you some images").
Plan step records this dependency; do not invent palettes without the images.

## Verification
- Each new theme selectable in the theme menu; `?theme=<id>` deep-links.
- Contrast audit (`scripts/contrast-audit.ts`) passes for each new theme.
