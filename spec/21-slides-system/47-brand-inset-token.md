# Spec 47 — Single brand-inset token (`--brand-inset-x`)

Status: locked (v0.88.0)
Related: spec 34 (body grid alignment), spec 35 (alignment guide), spec 37 (true full-width header), spec 38 (preview alignment guide).
Reference image: `images/47-aligned-baseline-reference.png` (slide /3 BEFORE this change — header & body in lockstep at the previous flush-left inset, used as the geometry baseline).

## Root cause analysis (from reference image)

In the reference screenshot the user confirmed the deck was "perfectly
aligned" — meaning:

1. The logo's visible **"R" left edge** (the trimmed PNG's true alpha
   start, post spec 37) sat at roughly `x = 8px` (header's `px-2`).
2. The body grid's left edge (`.step-timeline-content`'s `margin-left`)
   sat at the same x via the spec-34 `header-anchored` token, which
   resolved to `clamp(0.625rem, 1vw + 2px, 1.125rem)` = ~10–18px.
3. The presenter chip's right edge mirrored the logo's left edge by
   reading the same header padding (`px-2 sm:px-3 lg:px-4`).

So the alignment chain was: `header padding` → `logo visible edge` →
`body grid margin-left` → `step rail x`. That chain is what the
alignment-guide overlay (spec 35/38) verifies live.

## Decision

The deck moves from **flush-left chrome** to a **15% bracketed inset**:

- Logo height shrinks 15% (`h-16` / 64px → `h-[54px]` / 54px). The
  logo image is the trimmed asset (spec 37), so 54px tall ≈ 218px wide.
- Logo + presenter chip both inset by `clamp(48px, 15vw, 288px)` from
  their respective viewport edges. On a 1920px canvas that lands at
  exactly 288px (= 15% × 1920). On a 1280px laptop it lands at 192px
  (= 15% × 1280). On a 320px phone it floors at 48px so the logo
  doesn't disappear.
- The body grid (StepTimeline title block, rail, capsules, capsule
  list, etc.) inherits the SAME inset via a single CSS variable —
  `header-anchored` mode now resolves to `var(--brand-inset-x)` instead
  of its own clamp.

## Single source of truth

Defined ONCE in `src/index.css`:

```css
:root {
  --brand-inset-x: clamp(48px, 15vw, 288px);
  --body-grid-margin-left: var(--brand-inset-x);
  --body-grid-margin-right: auto;
}
```

Consumed by:

| Element             | File                                          | How                             |
|---------------------|------------------------------------------------|----------------------------------|
| Logo (left inset)   | `src/slides/components/BrandHeader.tsx`        | `paddingLeft: 'var(--brand-inset-x)'` |
| Chip (right inset)  | `src/slides/components/BrandHeader.tsx`        | `paddingRight: 'var(--brand-inset-x)'` |
| Body grid (anchored)| `src/slides/presetSettings.ts` (line 187+)     | `--body-grid-margin-left: var(--brand-inset-x)` |
| `bodyGridNudge`     | same                                           | adds 0–8px responsive nudge ON TOP |

## Math (for the next AI / human)

- Canvas: **1920 × 1080** (the locked design grid).
- Inset target: **15%** of canvas width = **288px** at full size.
- Floor: **48px** (~ a fingertip width on mobile, keeps logo readable).
- Linear scale: **15vw** between floor and ceiling.

So `clamp(48px, 15vw, 288px)` resolves to:

| Viewport | `15vw` | Resolved inset |
|----------|--------|----------------|
| 320px    | 48px   | 48px (floor)   |
| 640px    | 96px   | 96px           |
| 1280px   | 192px  | 192px          |
| 1920px   | 288px  | 288px (ceiling)|
| 2560px   | 384px  | 288px (ceiling)|

## Logo size math

- Trimmed PNG `riseup-asia-logo-trimmed.png` natural size: ~830 × 207
  (after spec-37 trim).
- Old: `h-16` = 64px → width ≈ `64 × (830/207)` ≈ **256px**.
- New: `h-[54px]` = 54px → width ≈ `54 × (830/207)` ≈ **217px**.
- Reduction: `(64 − 54) / 64 ≈ 15.6%` ✓ (user asked for ~15%).

## Verification

1. Open `/3` (StepTimeline). Logo + "HOW WE WORK" + "Engagement Process"
   + step rail all share the same x. The "R" of "Riseup" lines up with
   the "E" of "Engagement" within ≤1px.
2. Toggle `Settings → Alignment guide ON`. The gold (logo) and cream
   (body) dashed lines must overlap; HUD shows `Δ: 0px ✓`.
3. Resize window 1280px → 1920px → 2560px. Logo + body inset both
   scale together (logo never drifts away from body left edge).
4. Open `/2`, `/4`, `/6` (TitleSlide, etc.). Logo position is consistent
   across the deck (same `--brand-inset-x`), no per-slide override.
5. Presenter chip mirrors on the right at exactly the same inset.

## Constraints (locked)

- The brand inset MUST stay defined in exactly ONE place
  (`--brand-inset-x` in `index.css`). No component may hard-code
  `px-2`, `pl-[288px]`, etc., for the brand inset. Always read the var.
- `header-anchored` body grid mode MUST use `var(--brand-inset-x)` as
  its base (not a separate clamp). Otherwise spec-35's alignment guide
  will report Δ ≠ 0.
- Logo height MUST stay as `h-[54px]` (or any future tweak) on the
  trimmed PNG asset. Reverting to `h-16` re-introduces the visual
  imbalance with the new inset.
- The inset chain assumes the logo PNG is the **trimmed** asset
  (spec 37). If the logo asset changes, re-measure and update this
  spec's "Logo size math" section.

## Future tuning

To globally shift the deck inward/outward in a future revision, change
ONE line in `index.css`:

```css
--brand-inset-x: clamp(48px, 15vw, 288px); /* current */
--brand-inset-x: clamp(48px, 18vw, 346px); /* example: 18% inset */
--brand-inset-x: clamp(8px, 1vw, 16px);    /* example: revert to flush */
```

Header, chip, body grid, step rail, capsules — everything follows.
