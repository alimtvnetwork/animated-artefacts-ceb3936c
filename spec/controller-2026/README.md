# Slides Controller — Spec Pack (controller-2026)

> **Audience:** a *blind* AI agent with **zero prior context**. Read this folder
> top-to-bottom and you can re-implement the entire **slide controller** for the
> Riseup Asia slide-presentation app (and adapt it to any deck app) — the
> hover-reveal pill, navigation, fullscreen, keyboard shortcuts, theming from a
> single brand color, the first-run onboarding popup, and the background-music
> on/off option. It is **self-contained**: it explains the *why* and the *how*,
> with code-shaped examples, so you never need to read `src/` to reproduce it.

---

## What is the "controller"?

The **controller** is the small floating control surface the presenter uses to
drive the deck without leaving the slide: go prev/next, see "N / total", jump to
a slide, share a link, toggle fullscreen, open the overview grid, switch themes,
and (new) toggle background music. It is **hidden by default and reveals on
hover** so it never pollutes the live stage, and it can be **mounted in any
position** (top, bottom, any corner, or center of an edge).

It is **presenter-local runtime UI**: never exported, never part of slide JSON.

---

## Folder map (read in this order)

| File | What it covers |
|------|----------------|
| [`README.md`](./README.md) | This overview + glossary. |
| [`01-controller-100-steps.md`](./01-controller-100-steps.md) | The canonical **100-step** blind-AI build order for the whole controller. |
| [`02-implementation-steps-C01-C10.md`](./02-implementation-steps-C01-C10.md) | Code **implementation** steps **C01–C10** (maps groups A→J) with reasoning + time. |

---

## Glossary

- **Stage** — the 1920×1080 slide surface that scales to fit the viewport.
- **Pill** — the collapsed/expanded rounded controller container.
- **Chip** — one button inside the pill (prev, next, share, …).
- **Position anchor** — where the pill is mounted: `TopLeft · TopCenter · TopRight · BottomLeft · BottomCenter · BottomRight · LeftCenter · RightCenter`.
- **Onboarding coachmark** — the first-run popup that teaches the core keys.
- **Theme token** — a CSS custom property (HSL) that drives all colors.

---

## Cross-references

- Existing code: `src/slides/controls/ControllerBar.tsx`, `KeyboardShortcutsDialog.tsx`, `ThemeMenu.tsx`, `ShareMenu.tsx`, `SlideIndicator.tsx`.
- Memory: `mem://features/controller-hamburger`, `mem://features/keyboard-shortcuts-dialog`.
- Camera pack: `spec/camera-2026/` (presenter webcam, separate surface).
