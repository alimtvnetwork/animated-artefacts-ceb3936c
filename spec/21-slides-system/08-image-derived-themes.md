# Image-Derived Themes (v1)

Three new built-in themes added from presenter reference frames. They live
in `src/slides/themes.ts` alongside the existing presets and follow the same
contract (HSL-triplet `vars`, 4-color `swatch`, optional `fonts`). Existing
themes are untouched — these are additive flavors only.

## House rule for these themes
All three pin **Ubuntu** as the display/header font and **Poppins** as the
body/text font via the preset `fonts` block:

```ts
fonts: {
  display: 'Ubuntu, Inter, sans-serif',
  body: 'Poppins, Inter, -apple-system, BlinkMacSystemFont, sans-serif',
}
```

Both families are already loaded in `src/index.css` (Google Fonts import).

## Reference frames
Stored at `src/assets/reference-themes/`:
- `01-sample.webp` → **Glasswing**
- `02-sample.webp` → **Think Yellow**
- `03-sample.jpg`  → **Riseup Pro**

## The themes

### glasswing — Glasswing
Editorial cream-on-charcoal. Quiet, premium, near-monochrome. Warm charcoal
bg (`#161513`), soft cream text (`#F2EFE6`), restrained champagne accent
(`#C9B896`, darkened for AA), muted terracotta ember. Use for slides where a
single headline should breathe (gallery-wall flavor).

### think-yellow — Think Yellow
High-energy yellow-on-black poster. Pure black canvas, vivid `#FFD60A`
yellow accent for capsules/headline pops, crisp white supporting text. Use
for punchy single-idea slides.

### riseup-pro — Riseup Pro
On-brand graphite studio matching the Riseup Pro screen-share look. Neutral
graphite bg (`#262626`), brand gold (`#f3a502`) + ember (`#E85D3A`) accents
with a gold→ember gradient, soft off-white text. The default "presenter
recording" flavor.

## Contrast notes
- Champagne (`glasswing`) and yellow (`think-yellow`) golds are tuned so the
  auto-contrast band in `applyAutoContrast()` keeps `.capsule-gold` legible.
- All three declare full `--surface-*` / `--ink` so cards and code blocks
  read correctly against the non-default backgrounds.

## How they register
Adding an id to the `ThemeId` union + a preset to `THEMES` is all that's
needed — `THEME_IDS`, the picker (`ThemeSwatchGrid`), import/export, and
per-deck persistence all derive from `THEMES` automatically.
