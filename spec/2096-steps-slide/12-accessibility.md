# 12 — Accessibility

ARIA, focus order, and contrast for step slides. The goal: a screen-reader user
and a keyboard-only user get the same "one step is focused" model that sighted
users get from opacity/blur.

Source anchors:

- ARIA on rows/cards: `src/slides/types/FocusTimelineSlide.tsx:92` (`aria-label`),
  `:109` (`aria-hidden="true"` decorative rail), `:145` (`aria-current="step"`),
  `:146` (`aria-hidden={!inWindow}`), `:147` (`tabIndex={inWindow ? 0 : -1}`).
- Contrast guard: `src/test/stepTimelineGithubLightContrast.test.ts` +
  color math in `src/test/lib/contrast.ts`.
- Alpha ramp: `src/index.css:1551-1582` (active 1.0 / adjacent 0.62 / far 0.55).

---

## 1. ARIA roles & attributes

| Element | Attribute | Why |
|---|---|---|
| Clickable focus button | `aria-label="Focus step {n}"` | names an icon/number-only control |
| Active row | `aria-current="step"` | announces "current step" |
| Out-of-window rows | `aria-hidden={!inWindow}` | hides far steps from the AT tree |
| Decorative rail/connector | `aria-hidden="true"` | pure ornament, never announced |

Use `aria-current="step"` — not `aria-selected` — because this is a sequential
position, not a selection within a listbox.

## 2. Focus order

- In-window rows: `tabIndex={0}` — reachable by Tab in DOM order.
- Out-of-window rows: `tabIndex={-1}` — removed from the tab sequence so the
  user never tabs into a blurred/hidden step.
- Tabbing follows visual order top→bottom; the active step is the natural anchor.

## 3. Contrast (WCAG 2.1)

The dimming ramp uses **alpha on `--foreground`**, not a hardcoded gray, so it
holds in both noir and github-light:

| State | Alpha | Min ratio | Role basis |
|---|---|---|---|
| active | 1.0 | 4.5 (or 3.0 large) | primary reading |
| adjacent | 0.62 | 3.0 | large dimmed display |
| far | 0.55 | 3.0 | large dimmed display |

`far` was raised from 0.40 → 0.55 because 0.40 failed AA-large (≈2.36:1 on
white). The `stepTimelineGithubLightContrast.test.ts` test composites each alpha
over the theme background and fails below threshold — it is the regression
guard; never lower these alphas without re-running it.

---

## Acceptance

- [ ] Active row exposes `aria-current="step"`; decorative rail is `aria-hidden`.
- [ ] Only in-window rows are tabbable (`tabIndex` 0 vs -1) and announced.
- [ ] All three states pass their contrast threshold in the guard test.
