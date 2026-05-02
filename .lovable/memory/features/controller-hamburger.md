---
name: controller-hamburger
description: Bottom-right controller pill gains a hamburger menu (Menu icon) consolidating presenter-cleanup affordances. Items: Overview (G), Presenter view, Top Talk Jumper (J), Reveal hints, Contrast debug, Reduce motion, Keyboard map (?). Replaces the earlier plan to put this in the left TOC sidebar (#29 Q7 superseded).
type: feature
---

## Location

Inside `ControllerBar.tsx`, mounted as a **sibling of the
`controller-pill` motion.div** (NOT inside it — the pill is
`overflow-hidden` for morph; popovers must mount as siblings; see
`mem://features/controller-popovers`).

Trigger: a Menu (`lucide-react` `Menu` icon) button placed inside the
expanded pill between Presenter and Manifest. Click opens a Radix
DropdownMenu anchored above the pill (`absolute bottom-full mb-3`).

## Items (top → bottom)

| Item | Action | Shortcut |
|------|--------|----------|
| Overview | Toggle GridOverview | `G` |
| Presenter view | Open `/present` (new window) | — |
| Top Talk Jumper | Toggle `topJumperHidden` (default = hidden) | `J` |
| Reveal hints | Toggle `revealHints` (gold-ring pulse on click-reveal) | — |
| Click-reveal mode | Toggle reveal hints + stepwise lockstep | — |
| Transition style | Submenu picker (Fade / Slide / Push / PushLeft / PushRight) — defaults to scoping to current slide; "Apply to whole deck" checkbox flips scope. Backed by `transitionOverride` store. | — |
| Step motion | Submenu picker (Default rotation / Lift / Slide in / Parallax) — locks every step entrance across StepTimelineSlide + StepsChain3DSlide to one variant deck-wide. Backed by `stepMotionOverride` store. Pairs with Transition style for a cohesive "timeline mode". | — |
| Contrast debug | Toggle `useColorDebug` overlay | — |
| Reduce motion | Toggle `useReduceMotion` | — |
| Keyboard map | Open `KeyboardShortcutsDialog` | `?` |

The standalone **Sparkles (Reveal hints)** button is removed from the
controller pill — it lives only in the dropdown now. All other
controller buttons (prev/next/indicator/grid/presenter/manifest/share/
theme/fullscreen) stay as-is.

## Forbidden

- Mounting the dropdown inside `motion.div.controller-pill` (gets
  clipped — see controller-popovers memory).
- Burying **Theme**, **Share**, **Manifest**, or **Grid** inside this
  dropdown — those are primary controller actions and stay as chips.
- Removing the `Esc` / `Ctrl+1` behavior on `SlideTocSidebar` (those
  are independent of this dropdown — see `mem://features/toc-sidebar`).

## Reference
- Spec: `spec/21-slides-system/02-controller.md` §"Hamburger menu".
- Supersedes: ambiguity #29 Q7 (which placed the hamburger in the
  sidebar).
