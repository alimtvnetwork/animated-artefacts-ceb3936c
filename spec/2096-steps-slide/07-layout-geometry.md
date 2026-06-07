# 07 — Layout and Geometry

This file locks the **spatial system** for step slides: the brand insets, the
vertical rail, the no-reflow row height, and the counter pill placement.

Source anchors:

- Brand insets: `src/index.css:186-200`
- Body grid margin: `src/index.css:200`
- No-reflow row height: `src/index.css:1495-1499`
- Connector rail (left: 18px): `04-css-tricks.md §1`
- Padding-top override: `src/index.css:657`

---

## 1. Brand insets (single source of truth)

Every left-edge element (title block, rail, capsules) reads its horizontal
position from one variable so they stay in lockstep:

```css
--brand-inset-x: max(48px, 218px);   /* horizontal gutter */
--brand-inset-y: 116px;              /* vertical gutter */
--body-grid-margin-left: var(--brand-inset-x);
```

- The chip / counter on the right mirrors via `--brand-inset-x`.
- The step slide's `padding-top` tracks `--brand-inset-y`
  (`src/index.css:657`), not a separate magic value.

**Rule:** never hardcode a left/right gutter — derive from `--brand-inset-x`.

---

## 2. Two-column mental model

```text
┌──────────────────────────────────────────────────────────┐
│  ← --brand-inset-y (top pad)                              │
│  EYEBROW (slide-eyebrow)                                  │
│  SLIDE TITLE (slide-title-display)                        │
│                                                           │
│  │ ① 01  Step title one          [capsule]   STEP 01 / 06 │
│  │ ② 02  Active step title (big)            (counter pill)│
│  │ ③ 03  Step title three                                 │
│  ↑ gold rail @ left:18px                    ↑ mirrors     │
│  ← --brand-inset-x →                          inset-x →   │
└──────────────────────────────────────────────────────────┘
```

- Left column: numbered chip + rail + step title + optional capsule.
- Right edge: the `STEP NN / NN` counter pill, mirrored on `--brand-inset-x`.

---

## 3. No-reflow row height (the key trick)

Each `.step-row` reserves the **tallest possible** height so growing the active
title never pushes siblings (`src/index.css:1495-1499`):

```css
.step-row {
  min-height: calc(var(--step-title-active) * 1.05);  /* leading 1.05 */
  display: flex;
  align-items: center;
}
```

> Emphasis moves; layout stays still. If you size rows to their current title
> they will jitter on every advance — this is the most common geometry bug.

---

## 4. Rail + chip alignment

- Gold rail sits at `left: 18px` (see `04-css-tricks.md §1`), inside the
  `--brand-inset-x` gutter so titles clear it.
- The numbered chip is `36×36 rounded-full` (`04-css-tricks.md §4`); its center
  aligns to the row's vertical center via the flex `align-items: center`.
- The counter pill text must match the chip label format
  (`String(i+1).padStart(2,'0')`).

---

## Acceptance

- [ ] All horizontal gutters derive from `--brand-inset-x`; none hardcoded.
- [ ] Top padding tracks `--brand-inset-y`.
- [ ] Rows use `min-height: calc(var(--step-title-active) * 1.05)` — no reflow
      when the active step grows.
- [ ] Rail at `left:18px`; chip 36×36; counter pill mirrored on the right.
