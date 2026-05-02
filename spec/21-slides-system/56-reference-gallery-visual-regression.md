# Spec 56 — Reference Gallery visual regression snapshots — v0.164

## Why

`/style-guide`'s **Reference Gallery** is the canonical surface for the LLM
authoring pack screenshots (canvas, ambient, typography, step timeline,
controller pill, etc.). Three categories of regression silently break it
without throwing any runtime error:

1. **Spacing drift** — a PR swaps `gap-4` → `gap-2`, or removes a `space-y-3`
   wrapper, and the cards re-flow tighter than the rest of the playbook.
2. **Font-stack drift** — a refactor removes `font-display` from the
   heading, or `font-mono` from the inline `<code>` callouts, and the
   gallery's typographic rhythm decouples from the rest of the app.
3. **Glyph drift** — a copy edit replaces the multiplication sign `×`
   (U+00D7) with a plain `x`, or the middle dot `·` (U+00B7) with `,` /
   `*`. The page still renders; it just looks wrong.

`src/test/referenceAssets.test.tsx` already verifies the **assets** (file
existence + decoded dimensions) and the **font-stack manifest** (codepoints
present in the global config). Spec 56 adds a complementary visual-contract
snapshot test scoped to the rendered `ReferenceGallery` itself.

## Test — `src/test/referenceGalleryVisual.test.tsx`

Five focused checks, all running in jsdom (no extra deps):

| # | Test | Failure means |
|---|---|---|
| 1 | `locks the spacing-token surface (gap / padding / margin / radius)` | A spacing utility (`gap-*`, `p*-*`, `m*-*`, `space-{x,y}-*`, `rounded*`) was added/removed/renamed somewhere in `ReferenceGallery`. Confirm intent, then run `bunx vitest -u`. |
| 2 | `heading is wired to the configured display font stack (font-display → Ubuntu)` | The `<h2>` lost its `font-display` class — the heading is no longer routed through the Ubuntu-first stack. |
| 3 | `inline-code spans use the mono font (font-mono utility)` | A `<code>` callout dropped `font-mono`, breaking the monospace rhythm of file-path / cited-by markup. |
| 4 | `renders required glyph separators (× in caption text, · pinned in manifest)` | The multiplication sign `×` was swapped for `x` somewhere in the gallery copy, OR the middle dot `·` was dropped from the manifest. |
| 5 | `every gallery card uses the canonical thumbnail aspect + grid classes` | The responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`) or the `aspect-video` thumbnail wrapper changed shape. |

### Why classlist instead of `getComputedStyle`

jsdom doesn't load Tailwind's generated CSS, so `getComputedStyle(h2).fontFamily`
returns `''`. The stable contract is the **utility class itself** —
`font-display` is the source-of-truth that maps to the Ubuntu stack via
`tailwind.config.ts`. We assert the class on the node AND assert that
`REQUIRED_FONT_STACKS.display[0] === 'Ubuntu'` so a config-side rename trips
the test too.

### Why an inline snapshot

The spacing-token list is sorted + deduped, so the snapshot is small,
diff-friendly, and survives any rendering-order changes inside the gallery.
A copy edit that doesn't touch spacing/layout passes through without
needing an `-u` regen — it only fails when the visual rhythm actually drifts.

### Update workflow when a change is intentional

```bash
bunx vitest run referenceGalleryVisual -u
```

Then review the new snapshot in the source file (it lives inline) and commit
both the component change and the snapshot together.

## Related

- Spec 25 — Strict asset preload + slug validation
- Spec 53 — Asset-resolution audit (deck-asset content audit)
- Spec 54 — Runtime image QA (browser-side decode probe)
- Spec 55 — Reference QA report (CI artifact: assets + glyphs + font stacks)
- This spec (56) — Visual contract for the rendered `<ReferenceGallery />`
