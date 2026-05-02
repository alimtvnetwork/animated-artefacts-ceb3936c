---
name: reference-gallery-visual-regression
description: v0.164 — `src/test/referenceGalleryVisual.test.tsx` snapshots the visual contract of `<ReferenceGallery />`: spacing tokens (gap/padding/margin/radius), font utilities (font-display on heading, font-mono on every <code>), and glyph separators (× U+00D7, · U+00B7). Inline snapshot for the spacing list; classlist + manifest checks for fonts/glyphs. 5 tests, runs in jsdom, no new deps.
type: feature
---
v0.164.0.

# Why
`/style-guide`'s gallery silently degrades when (a) someone swaps a spacing
utility, (b) a refactor drops `font-display` / `font-mono`, or (c) a copy
edit replaces `×`/`·` with lookalikes. Spec 25 + spec 55 cover the asset and
manifest layers; this test covers the *rendered visual contract*.

# Tests
1. **Spacing snapshot** — collects every `gap-*` / `p*-*` / `m*-*` /
   `space-{x,y}-*` / `rounded*` class from the rendered tree, sorted +
   deduped, asserted via `toMatchInlineSnapshot`.
2. **Heading font** — `<h2>` must carry the `font-display` class (which
   maps to the Ubuntu-first stack in `tailwind.config.ts`).
3. **Inline-code font** — every `<code>` must carry `font-mono`.
4. **Glyph separators** — `1920 × 1080` text contains U+00D7 (not `x`);
   `REQUIRED_GLYPHS` still includes `·` at U+00B7.
5. **Grid + thumbnail shape** — every `.grid` carries
   `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`; every thumbnail
   wrapper carries `aspect-video`.

# Why classlist instead of getComputedStyle
jsdom doesn't load Tailwind's generated CSS, so `font-family` resolves to
`''`. The utility class is the source-of-truth contract; the manifest assert
(`REQUIRED_FONT_STACKS.display[0] === 'Ubuntu'`) backstops a rename in
`tailwind.config.ts`.

# Update workflow
`bunx vitest run referenceGalleryVisual -u` regenerates the inline spacing
snapshot. Review the diff in the source file; commit alongside the component
change.

# Files
- `src/test/referenceGalleryVisual.test.tsx` — new (5 tests)
- `spec/slides/56-reference-gallery-visual-regression.md` — full spec
- `package.json` — 0.164.0
