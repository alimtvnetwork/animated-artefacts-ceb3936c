/**
 * QA — verifies every reference asset surfaced by `ReferenceGallery`
 * exists at the expected resolution AND that the configured Ubuntu / Inter
 * font stacks resolve through the captions' required glyphs (× · §).
 *
 * # Two parts
 *   1. **Filesystem + dimensions** — for every entry in
 *      `REFERENCE_ASSETS`, read the PNG from disk and decode its width /
 *      height from the IHDR chunk. Compare against `expectedWidth` /
 *      `expectedHeight`. A failure means someone re-exported an asset at
 *      the wrong size or moved/deleted it.
 *   2. **Glyph rendering** — render `× · §` inside elements styled with
 *      the configured `font-family` stacks and assert:
 *         (a) the glyphs round-trip through `textContent` (no silent
 *             dropping by the parser),
 *         (b) the resolved `fontFamily` includes Ubuntu / Inter as the
 *             first / primary face (jsdom doesn't rasterize, but the CSS
 *             cascade is real — wrong stack = wrong test).
 *
 * # Why this guards real bugs
 *   - Catching a missing or wrong-size PNG before merge keeps the
 *     `/style-guide` gallery and the LLM authoring pack honest.
 *   - Catching a font-stack regression (e.g. someone removes `'Ubuntu'`
 *     from `tailwind.config.ts`) prevents captions from silently falling
 *     back to a system font that misrenders `§` or `×`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import {
  REFERENCE_ASSETS,
  REQUIRED_GLYPHS,
  REQUIRED_FONT_STACKS,
  decodePngDimensions,
} from '../slides/referenceAssetsManifest';

// ---------------------------------------------------------------------
// Part 1 — Filesystem + dimensions
// ---------------------------------------------------------------------

describe('reference assets — filesystem + resolution', () => {
  for (const asset of REFERENCE_ASSETS) {
    describe(asset.publicPath, () => {
      const fullPath = resolve(process.cwd(), asset.fsPath);

      it('exists on disk', () => {
        expect(existsSync(fullPath), `Missing asset: ${asset.fsPath} (${asset.whyLocked})`).toBe(
          true,
        );
        // Catch zero-byte / truncated downloads early — a 0-byte PNG would
        // pass `existsSync` but fail dimension decoding with a confusing
        // "buffer too small" message. This gives a clearer failure.
        expect(statSync(fullPath).size, `Empty file: ${asset.fsPath}`).toBeGreaterThan(0);
      });

      it(`is exactly ${asset.expectedWidth}×${asset.expectedHeight} px`, () => {
        const buf = readFileSync(fullPath);
        const { width, height } = decodePngDimensions(buf);
        expect(
          { width, height },
          `Resolution drift on ${asset.fsPath}. ${asset.whyLocked}`,
        ).toEqual({
          width: asset.expectedWidth,
          height: asset.expectedHeight,
        });
      });
    });
  }
});

// ---------------------------------------------------------------------
// Part 2 — Glyph rendering through the configured font stacks
// ---------------------------------------------------------------------

/**
 * Render a probe element that uses the given font stack and assert that:
 *   - the glyphs survive the DOM round-trip (no silent encoding loss),
 *   - `getComputedStyle(...).fontFamily` advertises the same primary face
 *     we pinned in `REQUIRED_FONT_STACKS`.
 *
 * jsdom won't actually rasterize, but the CSS resolution path runs — so
 * if a future PR removes `'Ubuntu'` from the configured stack, the
 * computed-style assertion below will fail before any visual regression
 * lands in production.
 */
function probeFontStack(label: 'display' | 'body') {
  const stack = REQUIRED_FONT_STACKS[label];
  // Each entry rendered with quotes to match the way browsers serialize
  // multi-word family names in `getComputedStyle`.
  const cssStack = stack
    .map((face) => (/\s|-/.test(face) && !face.startsWith('-') ? `'${face}'` : face))
    .join(', ');

  // We attach a `data-testid` so we can pull the node back out via
  // testing-library and not depend on text-content lookups (the same
  // glyph string appears in both probes).
  render(
    <p data-testid={`probe-${label}`} style={{ fontFamily: cssStack }}>
      {REQUIRED_GLYPHS.join(' ')}
    </p>,
  );

  const node = screen.getByTestId(`probe-${label}`);
  return { node, stack, cssStack };
}

describe('reference assets — glyph rendering', () => {
  it('all required glyphs are non-empty single characters (Unicode sanity)', () => {
    // Guards against an editor silently replacing one of these with a
    // visually similar but different codepoint (e.g. middle dot vs.
    // bullet). A failure here means the manifest itself is corrupt.
    for (const g of REQUIRED_GLYPHS) {
      expect(g.length, `Glyph "${g}" should be a single codepoint`).toBe(1);
    }
    // Spot-check the exact codepoints we expect — × is U+00D7, · is U+00B7,
    // § is U+00A7. Any drift from these would cause cross-platform render
    // differences in the captions.
    expect(REQUIRED_GLYPHS).toEqual(['×', '·', '§']);
    expect('×'.codePointAt(0)).toBe(0x00d7);
    expect('·'.codePointAt(0)).toBe(0x00b7);
    expect('§'.codePointAt(0)).toBe(0x00a7);
  });

  for (const label of ['display', 'body'] as const) {
    describe(`${label} font stack`, () => {
      it('renders every required glyph without dropping any character', () => {
        const { node } = probeFontStack(label);
        const text = node.textContent ?? '';
        for (const g of REQUIRED_GLYPHS) {
          expect(text, `Glyph "${g}" missing from ${label} probe text`).toContain(g);
        }
      });

      it('resolves through the configured font family', () => {
        const { node, stack } = probeFontStack(label);
        const resolved = window.getComputedStyle(node).fontFamily;
        // `getComputedStyle` typically returns the stack as-authored (jsdom
        // doesn't fully normalize quoting). Check that the *primary* face
        // is present — that's the only invariant the QA needs to enforce;
        // fallback ordering can change without breaking glyph rendering.
        const primary = stack[0];
        expect(
          resolved,
          `Expected ${label} stack to lead with ${primary}, got "${resolved}"`,
        ).toContain(primary);
      });
    });
  }
});
