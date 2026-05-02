# Spec 48 — Global brand-logo scale setting

Status: locked (v0.89.0)
Related: spec 47 (`--brand-inset-x` token), spec 35 (alignment guide), spec 38 (preview alignment guide).

## Why

Spec 47 hard-coded the logo at `h-[54px]` (= 64 × 0.85, the −15%
treatment). The user requested a **global setting** to make this
multiplier tunable from `/settings` so future trims/grows are a slider
drag, not a code edit.

## Decision

A new preset setting `logoScale: number` (range 0.6–1.2, step 0.05,
default **0.85**) drives a single CSS variable `--brand-logo-scale`
applied to `<html>` by `applyPresetSettings()`. The default 0.85 is
chosen so existing decks render identically to v0.88 — i.e. the
shipping default is *exactly* "15% smaller", per the user's request.

Both elements that visually represent the brand follow the scale
together so the right side stays balanced with the left:

| Element              | Base size | Computed size                                        |
|----------------------|-----------|------------------------------------------------------|
| Logo (wordmark img)  | 64px tall | `calc(64px * var(--brand-logo-scale, 0.85))`         |
| Presenter chip avatar| 28×28px   | `calc(28px * var(--brand-logo-scale, 0.85))` (sq.)   |

Width on the wordmark stays `auto` so the trimmed PNG (~830×207, see
spec 37) keeps its aspect ratio. At default 0.85, that's **54px tall ×
~217px wide** — same as v0.88.

## Files

- `src/slides/presetSettings.ts` — added `logoScale` to `PresetSettings`
  interface, default `0.85`, bounds `LOGO_SCALE_BOUNDS = {min:0.6,
  max:1.2, step:0.05}`. `applyPresetSettings()` writes
  `--brand-logo-scale` with a clamped value (defensive: rejects any
  out-of-range value from a tampered localStorage payload).
- `src/slides/components/BrandHeader.tsx` — replaced the hard-coded
  `h-[54px]` (and `h-7 w-7` on the avatar) with inline-style
  `calc(BASE * var(--brand-logo-scale, 0.85))` so the elements track
  the live var without React re-renders.
- `src/pages/SettingsPage.tsx` — new "Brand logo size" slider
  immediately under "Title size", with a percentage readout and helper
  copy that explains the 85% default.
- Dirty-flag check + reset both updated.

## Spec 47 supersession note

Spec 47's "Logo size math" section is still accurate **at the default
scale** (0.85 → 54px → ~217px wide). When tuning the slider:

```
height_px = 64 * logoScale
width_px  = 64 * logoScale * (830 / 207)  // trimmed PNG aspect
```

So at scale 1.0: `64 × 4.01 ≈ 257px wide`. At scale 1.2: ~308px wide.
At scale 0.6: ~154px wide. The `--brand-inset-x` token is independent —
it controls *position*, not *size* — so the logo slot grows/shrinks in
place without re-aligning the body grid.

## Verification

1. `/settings` → "Brand logo size" reads **85%**. Drag to 100%: logo
   visibly grows; presenter chip avatar grows in lockstep.
2. Drag back to 85%; on `/3` the body grid (title, rail, capsules)
   stays anchored to the same x — only the logo size changes, not its
   left edge.
3. Refresh page → slider reads same value (localStorage persistence).
4. "Reset to defaults" → slider snaps back to 85%; deck renders
   identical to v0.88 / v0.89 default.
5. Slider min (60%) → logo shrinks but never disappears. Slider max
   (120%) → logo grows but stays within the 96px-tall header band
   (76.8px logo on 96px header = 19px clearance, looks good).

## Constraints (locked)

- Default value MUST stay 0.85 so existing decks don't visually shift
  on upgrade. Any future change to the default requires a major-version
  bump and a migration note.
- The token name MUST be `--brand-logo-scale`. Both BrandHeader and
  any future brand-mark consumer (e.g. an SVG export) must read this
  exact name.
- Avatar height MUST scale with the logo (not separately) so the chip
  stays visually balanced. Do NOT add a separate `chipScale` setting
  unless the user explicitly asks for one.
