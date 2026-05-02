---
name: svg-viewbox-audit
description: v0.175 — SVG brand assets in `audit:resolutions` get viewBox parsed and checked. New rules `requireViewBox` (default ON), `minViewBoxWidth`, `minViewBoxHeight`; existing pixel rules apply via parsed render-intent dims (explicit width/height attrs > viewBox geometry).
type: feature
---
v0.175.0.

# Why
`BrandHeader` / `BrandStrip` size logos by CSS height alone (e.g.
`calc(64px * var(--brand-logo-scale, 0.85))`). An SVG with no viewBox has
no intrinsic ratio for the browser to scale against → it collapses or
blurs. A tiny-viewBox SVG (e.g. `0 0 16 16`) on stroked geometry rounds
badly at presentation render sizes. Neither was caught by spec 53.

# What gets parsed
`parseSvgRoot(head)` regex-extracts the root `<svg …>` opener:
- `viewBox` → `{ minX, minY, width, height }` (whitespace OR comma-sep).
- `width` / `height` → numeric, accepts `px` suffix; rejects `%` and other
  relative units (treated as "no usable value").
- `hasExplicitDims` flag — both `width` AND `height` attrs present.

Effective `probe.width` / `probe.height` for an SVG = explicit attr if
present, else viewBox geometry. Matches browser fallback exactly.

Tolerant of XML decls, DOCTYPE, comments, BOM. Reads same 64KB head as
the raster parsers — overkill for SVG but cheap.

# Rules
On `ConstraintRule`:
- `requireViewBox?: boolean` — default `true` when the kind's rule object
  exists. SVGs without a viewBox produce a `requireViewBox` violation.
- `minViewBoxWidth?: number` / `minViewBoxHeight?: number` — when omitted,
  fall back to `minWidth` / `minHeight`. Lets authors declare one floor
  that covers both raster pixels and vector user units.

Existing rules (`formats`, `min/maxWidth`, `min/maxHeight`, `aspectRatio`,
`maxBytes`) keep working on SVG via the parsed dims.

# Report
Every SVG row (clean OR violating) gets a second metadata line:
`- **viewBox:** \`0 0 200 200\` · **Root attrs:** \`width\`+\`height\` set`
so authors comparing logos can spot geometry drift at a glance.

# Files
- `scripts/audit-asset-resolutions.ts` — `parseSvgRoot`, extended
  `ConstraintRule`, extended `ProbeResult`, SVG branch in `evaluate`,
  per-row `viewBox` line in `renderReport`, header docstring.
- `package.json` — 0.175.0.
- `readme.md` — v0.175.0 changelog.

# Not done (deferred)
- `preserveAspectRatio` validation — orthogonal; would belong in a
  future "rendering hints" rule.
- Currently only the showcase brand block has its rules tightened
  enough to bite — when we ship SVG brand marks, add explicit
  `minViewBoxWidth: 96, minViewBoxHeight: 96` (or rely on inheritance
  from the existing `minWidth: 96`).
