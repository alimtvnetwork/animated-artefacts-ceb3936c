# Reference Image Index — annotated overlay

> **Phase 15/20** · One stop to find every visual reference cited
> across files 00–18. If a playbook mentions a screenshot, this file
> tells you exactly where it lives and what to look at in it.

---

## How to read this file

Each row pairs an **asset path** with the **playbook section** that
cites it and a one-line **what to notice** caption. When you add a
new screenshot to a `{topic}/` folder, also add a row here.

---

## 1. Step timeline

| Asset | Cited by | What to notice |
|---|---|---|
| `assets/step/target.png` | `02-step-system-complete.md` §1, `12-steps-pattern.md` §1 | Active row pure white + 1.0 opacity; gold connector pinned at `left: 18px`; detail panel = only description surface. |
| `assets/step/broken-reference.png` | `12-steps-pattern.md` §3 | Anti-pattern: description rendered under list rows, list column too narrow, connector floats off-axis. Use as a "not this" diff against `target.png`. |

## 2. Title slide

| Asset | Cited by | What to notice |
|---|---|---|
| `assets/title/riseup-asia-logo.png` | `04-ambient-and-title-background.md` Part B, `09-title-background.md` | Brand wordmark proportions; never recolor, never crop, never re-kern. |
| `assets/title/presenter.png` | `04-ambient-and-title-background.md` Part B | MD ALIM UL KARIM portrait; framed circular at title slide bottom-left. |

## 3. Controller

| Asset | Cited by | What to notice |
|---|---|---|
| `assets/controller/controller-pill.png` | `00-README.md` commandment 7 | Hidden by default, hover-reveals; pill at bottom-center; order: prev / "N/total" / next / share / fullscreen. |

## 4. Canvas

| Asset | Cited by | What to notice |
|---|---|---|
| `assets/canvas/canvas-1920x1080.png` | `07-canvas-and-scaling.md`, `19-remediation-pack.md` §G1.1 | 1920×1080 frame; reserved 96px top/bottom bands; centered safe area 1440×760 split 560 list / 80 gutter / 800 detail. |

## 5. Background

| Asset | Cited by | What to notice |
|---|---|---|
| `assets/background/ambient-drift.png` | `04-ambient-and-title-background.md` Part A, `08-background-system.md`, `19-remediation-pack.md` §G1.2 | Soft gold radial glow centered; ember dots + cream wisp; default ambient preset. |

## 6. Typography

| Asset | Cited by | What to notice |
|---|---|---|
| `assets/typography/scale.png` | `10-typography.md`, `19-remediation-pack.md` §G1.3 | 8-rung type ladder: Display XL/LG/MD, Title, Body, Eyebrow (gold uppercase), Capsule, Caption. Never invent sizes between rungs. |

## 7. Authoring

| Asset | Cited by | What to notice |
|---|---|---|
| `assets/authoring/json-flow.png` | `15-authoring-template.md`, `16-voice-to-slide-protocol.md` §7, `19-remediation-pack.md` §G1.4 | Voice/text → intake → template → variety guard → 3 atomic artifacts → 40-box checklist. |

---

## 8. Cross-deck mirrors

These live outside the `llm/assets/` mirror but are the canonical
sources. If you re-export them, copy the new version into the matching
`llm/assets/{topic}/` folder so the pack stays self-contained.

| Source | Mirror in pack |
|---|---|
| `spec/slides/assets/step-timeline-reference/step-timeline-target.png` | `assets/step/target.png` |
| `spec/slides/assets/step-timeline-reference/step-timeline-broken.png` | `assets/step/broken-reference.png` |

---

## 9. Acceptance + changelog

- Every image path cited by files 00–18 resolves to a real file under
  `assets/` **or** is listed here as "empty — add when authored" with
  the playbook that will use it.
- 2026-04-26 (v0.80.9): Phase 15 — consolidated asset index across
  step/title/controller (present) + canvas/background/typography/
  authoring (placeholders) + cross-deck mirror table.
- 2026-04-27 (v0.135.0): All canvas/background/typography/authoring
  reference images authored and mirrored to `/public/reference/{topic}/`
  so the in-app **Reference gallery** on `/style-guide` can render them
  one-click. Removed the "(still empty)" sandwich-rule + font-pairs rows.
  See `src/slides/components/ReferenceGallery.tsx`.
