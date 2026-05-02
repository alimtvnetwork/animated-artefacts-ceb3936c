# 27 — Step Timeline v3.2 (Fixed-Slot Rows + Poppins + Pure White)

**Typography superseded by spec 36 / v0.68.0:** fixed-slot rows and
pure-white text remain locked, but the Poppins step-title rule is retired.
Step row headers now use **Ubuntu Bold** to match the deck title system.

**Supersedes the layout + typography rules in spec 23 (v3.1).** Motion
timing, ghost numeral, breathing badge halo, and ambient parallax field
are unchanged. v3.2 fixes one specific complaint: when the active step
grows from `--step-title-far` → `--step-title-active`, the size jump
used to push the rows below it downward, making the whole chain feel
like it was "moving" instead of "focusing in place."

## 1. Fixed-slot row rule (the "no reflow" rule)

Every `.step-row` reserves the *active* size as its slot height:

```css
.step-row {
  min-height: calc(var(--step-title-active) * 1.05); /* 1.05 = leading */
  display: flex;
  align-items: center;
}
```

Result: the slot is always tall enough to hold the active title. When
a row activates and its `.step-title` font-size grows, the row's outer
box does NOT change height → siblings stay still. Emphasis moves; the
chain does not.

Still no `transform: scale()` anywhere — depth still reads through real
font-size jumps + opacity ramp + color (now constant white).

## 2. Poppins on the step slide

The deck-wide defaults stay:
- Titles: Ubuntu Bold (`.font-display`)
- Body: Inter

The step slide opts into **Poppins** for both the row title and the
row body, scoped to `.step-row` + `.step-row .step-title`. This is a
deliberate, slide-local typeface change so the step chain reads as a
distinct moment in the deck. Weights used: 700 for `.step-title`,
500/600 for the eyebrow + subtitle.

```css
.step-row,
.step-row .step-title {
  font-family: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

The slide-level `<h2>` ("Engagement Process") is unaffected and still
follows the deck's `.font-display` (Ubuntu) — it's slide chrome, not
step content.

## 3. Pure white at every state

Inactive rows used to fade through `hsl(0 0% 100% / 0.75)` → `0.55`,
which read as "dim cream" against noir. v3.2 keeps the title pure
white at every state and lets the row's outer `opacity` do all the
fading work:

```css
.step-row[data-state="active"]   .step-title { color: hsl(0 0% 100%); }
.step-row[data-state="adjacent"] .step-title { color: hsl(0 0% 100%); }
.step-row[data-state="far"]      .step-title { color: hsl(0 0% 100%); }
```

The row container still applies `opacity: 1 / 0.55 / 0.30` so dim
states look correctly recessed — they're just "white at low opacity"
instead of "translucent cream."

## 4. Slide title is pure white

`spec/slides/showcase/03-process.json` flipped `titleStyle` from
`"cream"` → `"white"` and `titleShimmer` from `true` → `false`. The
slide header "Engagement Process" now matches the row text.

## 5. What v3.2 preserves

- All v3 / v3.1 motion (1.5s expo-out fade, ghost numeral, breathing
  halo, alternating ghost entrance, cursor parallax field).
- NO `transform: scale()` anywhere.
- Step-first deck Next/Prev via `tryAdvance`.
- Discreet "STEP NN / NN" counter.
- Single right-side description panel, hybrid spring entrance.
- 6s pause-after-interaction window.
- Whoosh sound on every active change.
- Reduced motion: no slide-in, instant size/opacity swaps.

## 6. Reusability checklist

When you want a chain of focusable rows that grow in place without
reflowing siblings:

1. Reserve the *active* height as `min-height` on every row.
2. Use real font-size changes (not transform:scale).
3. Keep color constant; use the row's `opacity` for the dim ramp.
4. Pair with the v3 expo-out timing (1.5s fade, 1300ms size tween).
