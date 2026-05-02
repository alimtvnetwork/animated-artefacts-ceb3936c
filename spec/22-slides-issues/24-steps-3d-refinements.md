# Change Request 24 — Steps 3D Refinements

> **Status:** shipped (2026-04-28) — all CRs (reorder, logo/chip offsets, staggered description, top markers, hover/click activation, tooltips) merged.
> **Targets:** `src/slides/types/StepsChain3DSlide.tsx`,
> `spec/26-slide-definitions/showcase/deck.json`,
> `spec/26-slide-definitions/showcase/0*-process-3d.{json,md}`,
> `src/slides/presetSettings.ts`,
> base spec [`spec/21-slides-system/61-steps-chain-3d.md`](../21-slides-system/61-steps-chain-3d.md).
> **Verbatim source:** voice prompt captured 2026-04-28; cleaned in
> `prompts/06-steps-3d-refinements.md` (mirrored at top of this doc by the AI loop).

This change is **additive** to spec 61. None of the existing motion behaviour
is removed; we add five refinements.

---

## 1. Reorder — 3D slide moves to slot 4

| Before slot | After slot | File rename                                         |
| ----------- | ---------- | --------------------------------------------------- |
| 04          | 05         | `04-strategy-detail.*` → `05-strategy-detail.*`     |
| 05          | 06         | `05-impact-metrics.*`  → `06-impact-metrics.*`      |
| 06          | 07         | `06-contact.*`         → `07-contact.*`             |
| 07          | 08         | `07-meeting-link.*`    → `08-meeting-link.*`        |
| 08          | 04         | `08-process-3d.*`      → `04-process-3d.*`          |

Slides 01/02/03 unchanged. `slideNumber` field inside each JSON updated to
match the new file prefix. `deck.json` `slides[]` reordered.

---

## 2. Logo and presenter-chip nudge (–10% size, +15% lower)

Both the Riseup Asia logo and the author chip move down by 15% of the
existing brand inset, and the logo shrinks by 10%. Implementation is **purely
via the existing preset tokens** — no new units, no hard-coded pixels in
slide components.

| PresetSetting     | Old default | New default | Derivation                          |
| ----------------- | ----------- | ----------- | ----------------------------------- |
| `logoScale`       | 0.85        | **0.765**   | 0.85 × 0.90 (–10%)                  |
| `logoOffsetY`     | 0           | **+18**     | round(0.15 × 116px brand-inset-y)   |
| `chipOffsetY`     | 0           | **+18**     | same as logo, mirrors symmetrically |

Because `--brand-inset-y` is already coupled to `logoScale` (CR from prior
loop), the StepTimeline rail and step text column auto-shift with the logo
— no extra alignment logic required. This also applies to the new 3D slide:
the right-side description panel inherits `--brand-inset-y` for its top
padding and `--brand-inset-x` mirror for its right gutter.

---

## 3. Right-side description panel on the 3D slide

Mirrors the regular slide's two-column layout: 3D chain on the left, text
column on the right. Per-step content is added to the spec under
`content.steps[].description`:

```json
{
  "label": "Step 1",
  "title": "Discovery",
  "subtitle": "Listen, audit, align",
  "capsule": { "text": "Week 1", "color": "gold" },
  "description": {
    "title": "Discovery & alignment",
    "bullets": [
      "Stakeholder interviews",
      "System audit",
      "One-page brief"
    ],
    "meta": "Week 1"
  }
}
```

> **Keywords-only (v0.214).** The 3D right panel renders ONLY
> `description.bullets[]` — never prose. Legacy `description.body` strings
> from earlier decks are auto-split on `.` `;` `,` at render via
> `deriveBullets()` so older decks keep working, but new authoring MUST use
> `bullets[]`. See `src/slides/utils/legacyBodyToBullets.ts`.

### Animation

Triggered **on `activeIndex` change**, in lockstep with the card's spring:

- Outgoing description: inverse slide-in-left + fade (translateX `0 → -32px`,
  opacity `1 → 0`, rotateY `0 → 6deg`), 180ms.
- Incoming description: slide-in-left + fade (translateX `-32px → 0`,
  opacity `0 → 1`, rotateY `6deg → 0`), spring damping 14 / stiffness 180.
- **Stagger:** title @ 0ms, bullets staggered +60ms each, meta chip last
  (matches spec 61 §4 right-panel cadence — we just promote it to first-class).
- `prefers-reduced-motion`: 180ms linear opacity crossfade only, no
  translate, no rotateY.

---

## 4. Top numeric markers above each step

Additive to the existing line-side markers from spec 61 §2.3 — the line-side
markers stay; new markers sit **above** each card.

- Style: same family / weight / treatment as `StepTimelineSlide` (slide 03)
  number, scaled to **50%** of slide-3's font size (token
  `--step-number-size-3d` = `calc(var(--step-number-size, 96px) * 0.5)`).
- Animation: reuse slide-3 number entrance (scale `0.6 → 1.1 → 1.0` overshoot
  + opacity `0 → 1`, 320ms spring), triggered when the step becomes active.
- Inactive top markers stay at 0.55 opacity, no glow; active gets the
  accent-coloured glow already defined in spec 61 §2.3.

---

## 5. Hover + click interactivity on the 3D chain

Each step card becomes a button (`role="button"`, `tabIndex=0`).

- **Hover** (non-active step): soft gold glow ring
  (`box-shadow: 0 0 24px hsl(var(--accent) / 0.35)`), top marker brightens
  to 0.85 opacity. Cursor is `pointer`. Under
  `prefers-reduced-motion` the glow is instant on/off, no pulse.
- **Click / Enter / Space:** sets `activeIndex` to that step. Transition
  uses the **existing** spring zoom from spec 61 §4 — no new easing.
- Focus ring visible on keyboard nav. `aria-current="step"` on the active
  card. `aria-label` of the form `"Step 2: Strategy"`.

---

## 6. Acceptance criteria

1. Deck order shows the 3D slide as `/4` and the rest shifted by one.
2. Logo is visibly smaller and lower; presenter chip is lower; both align
   automatically with the step text column at every viewport because the
   shift is derived from `--brand-inset-y` / `--brand-inset-x`.
3. Right-side description panel renders on the 3D slide and animates in
   with the active step using slide-in-left + fade + rotateY, staggered.
4. Each 3D step has a top numeric marker at 50% of slide-3's number size
   that animates in sync with activation.
5. Hovering a step shows a soft glow; clicking activates it with the
   existing spring zoom; Enter/Space work; focus ring is visible;
   `aria-current="step"` is set on the active card.
6. `prefers-reduced-motion` users get fades only — no glow pulse, no 3D
   motion, no rotateY.
7. The existing step-change SFX still fires unchanged.

---

## 7. Non-goals

- Do **not** modify the spec 61 motion language for the 3D chain itself
  beyond the additions above.
- Do **not** introduce new colour tokens or a new easing curve.
- Do **not** hard-code logo / chip / panel offsets in slide components —
  always derive from existing CSS tokens.
