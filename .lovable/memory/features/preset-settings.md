---
name: preset-settings
description: /settings panel + presetSettings module — user-tunable title scale, rule thickness/color, body font; applied as CSS vars on <html>, persisted in localStorage.
type: feature
---

## What

`/settings` is a small in-app panel that tunes the premium preset globally
for every deck (existing AND new — the live CSS-var overrides win, no JSON
is rewritten).

Three knobs:
- **Title size** — slider 70%–130%, multiplies the clamp() ranges on
  `.slide-title-display` and `.slide-title-content`.
- **Brand-strip rule** — thickness slider 0–4px (0 hides) + color select
  (gold / cream / ember / border).
- **Body font** — Inter (default) or Ubuntu. Affects `.slide-subtitle`
  only. Titles always remain Ubuntu Bold by design.

## Files

- `src/slides/presetSettings.ts` — `PresetSettings` type, `getPresetSettings`,
  `setPresetSettings`, `resetPresetSettings`, `applyPresetSettings`. Storage
  key `riseup.presetSettings.v1`.
- `src/main.tsx` — calls `applyPresetSettings(getPresetSettings())` before
  `createRoot` so there's no FOUC on hard refresh.
- `src/index.css` — the four classes (`.slide-title-display`,
  `.slide-title-content`, `.slide-subtitle`) read CSS vars with fallbacks
  matching the previous hard-coded values. Zero behavior change when no
  settings are saved.
- `src/slides/components/BrandStrip.tsx` — divider switched to inline style
  consuming `--preset-rule-thickness` + `--preset-rule-color`.
- `src/pages/SettingsPage.tsx` — the panel itself; live SlidePreview of a
  CapsuleListSlide + TitleSlide as the preview surface.

## CSS variables stamped on `<html>`

| Variable | Used by |
|----------|---------|
| `--preset-title-display-size` | `.slide-title-display` |
| `--preset-title-content-size` | `.slide-title-content` |
| `--preset-body-font` | `.slide-subtitle` |
| `--preset-rule-thickness` | BrandStrip divider |
| `--preset-rule-color` | BrandStrip divider |

## Rule

If a future setting is added, extend `PresetSettings` + `applyPresetSettings`
and (if the consuming class is in CSS) add a `var(--preset-…, fallback)` in
`index.css`. Never hard-code values inside slide components — the whole
point of this module is centralised tuning.
