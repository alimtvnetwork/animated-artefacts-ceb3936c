# Update 11 — TileSlide horizontal padding must match brand inset

## Problem

Slide 05 (TileSlide) had the headline left-padded at `px-24` (96px), but the
brand logo and presenter chip live at `var(--brand-inset-x)` (≈218px). Result:
"Today's goal / We'll build two CLIs along the way." sat far to the LEFT of
the Riseup Asia logo, breaking the vertical column the rest of the deck uses.

## Rule (authoring contract)

Any slide that has a left-aligned header MUST share the same x-axis as the
brand logo. Use the design token, never raw rem/px:

```tsx
style={{
  paddingLeft: 'var(--brand-inset-x)',
  paddingRight: 'var(--brand-inset-x)',
}}
```

Do NOT hard-code `px-24`, `px-20`, or any tailwind padding utility on the
outer slide section — those drift from `--brand-inset-x` whenever the
brand inset is re-tuned.

## Applied

- `src/slides/types/TileSlide.tsx` — replaced `px-24` with inline
  `paddingLeft/Right: var(--brand-inset-x)`.

## Test

Open `/5`. The "T" of "Today's goal" must align vertically with the "R" of
the Riseup Asia logo. The right edge of the tile grid must mirror the
presenter chip.
