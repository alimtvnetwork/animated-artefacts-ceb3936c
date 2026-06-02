# brand-source/

Original brand **design source** files — logo masters (multiple sizes/formats)
and color-token references. These are reference/source assets, **not** imported
by the app at runtime.

- `icons-image/` — raster logo masters (Logo-052…1024, light/dark).
- `icons-svg/` — vector logos (`Logo.svg`, `Logo-Dark.svg`, `Logo-White.svg`).
- `colors-themes/` — `Palette.md` + `Tokens.json` brand color references.

## Where the app actually loads brand assets
Runtime brand assets live in **`src/assets/brand/`** and are rendered via the
`BrandLogo` component (auto-swaps light/dark). Do **not** import directly from
here — this folder is the design archive that those bundled assets derive from.

Moved here from the repo root `assets/icons/` on 2026-06-02 (root cleanup).
