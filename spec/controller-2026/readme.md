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
| [`readme.md`](./readme.md) | This overview + glossary. |
| [`01-controller-100-steps.md`](./01-controller-100-steps.md) | The canonical **100-step** blind-AI build order for the whole controller. |
| [`02-implementation-steps-c01-c10.md`](./02-implementation-steps-c01-c10.md) | Code **implementation** steps **C01–C10** (maps groups A→J) with reasoning + time. |
| [`03-test-execution-steps-ct01-ct10.md`](./03-test-execution-steps-ct01-ct10.md) | **Test / verification** steps **CT01–CT10** with reasoning + time. |
| [`04-test-execution-steps-ct11-ct20.md`](./04-test-execution-steps-ct11-ct20.md) | **Hardening / release / maintenance** steps **CT11–CT20** with reasoning + time. |
| [`05-build-substeps-c01.md`](./05-build-substeps-c01.md) | **C01 expanded** into 10 code-ready sub-steps **C01.1–C01.10** with files + time. |
| [`06-build-substeps-c02.md`](./06-build-substeps-c02.md) | **C02 expanded** into 10 code-ready sub-steps **C02.1–C02.10** with files + time. |
| [`07-build-substeps-c03.md`](./07-build-substeps-c03.md) | **C03 expanded** into 10 code-ready sub-steps **C03.1–C03.10** with files + time. |
| [`08-build-substeps-c04.md`](./08-build-substeps-c04.md) | **C04 expanded** into 10 code-ready sub-steps **C04.1–C04.10** with files + time. |
| [`09-build-substeps-c05.md`](./09-build-substeps-c05.md) | **C05 expanded** into 10 code-ready sub-steps **C05.1–C05.10** with files + time. |
| [`10-build-substeps-c06.md`](./10-build-substeps-c06.md) | **C06 expanded** into 10 code-ready sub-steps **C06.1–C06.10** with files + time. |
| [`11-build-substeps-c07.md`](./11-build-substeps-c07.md) | **C07 expanded** into 10 code-ready sub-steps **C07.1–C07.10** with files + time. **✅ BUILT** — `useOnboardingFlag.ts`, `OnboardingCoachmark.tsx`, wired into `ControllerBar` ("Show intro again"), 8 tests in `src/test/onboarding.test.tsx` passing. |

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
