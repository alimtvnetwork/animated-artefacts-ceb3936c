/**
 * QA check — reference-asset registry + manifest verifier.
 *
 * # What this is for
 * The Reference Gallery on `/style-guide` (and the LLM authoring pack at
 * `spec/slides/llm/assets/INDEX.md`) both depend on a fixed set of PNG
 * screenshots existing at known paths AND at known resolutions. A silent
 * 404 (missing file) or a re-export at the wrong size would degrade the
 * gallery without surfacing any runtime error — so we pin both invariants
 * here and assert them in `src/test/referenceAssets.test.ts`.
 *
 * # Why dimensions matter
 * Several assets are aspect-ratio-locked to the surfaces that cite them:
 *   - `canvas/canvas-1920x1080.png` MUST be 1920×1080 — it's the literal
 *     deck canvas. A re-export at a different size would invalidate the
 *     "reserved 96px bands" annotations baked into the image.
 *   - The `step/*.png` references are 16:9 thumbnails of the step slide
 *     at editor resolution. Resolution drift = misleading "target" image.
 *   - `title/riseup-asia-logo.png` and `controller/controller-pill.png`
 *     are wordmark-/pill-cropped — wrong size = wrong proportions.
 *
 * # Glyph fonts (× · §)
 * The captions in `ReferenceGallery` and several playbook docs use these
 * glyphs as separators / annotations. They MUST render in the configured
 * Ubuntu (display) + Inter (body) stacks. We verify that here by checking
 * the glyphs are present in the source manifests and (in the companion
 * test) by rendering them and asserting the computed `font-family`.
 */

/** Required glyphs that must round-trip through Ubuntu / Inter without
 *  falling back to a system font. Extend ONLY when a new caption / playbook
 *  introduces another non-ASCII separator that we can't tolerate breaking. */
export const REQUIRED_GLYPHS = ['×', '·', '§'] as const;

/** The two configured font families that captions / playbook UI use. */
export const REQUIRED_FONT_STACKS = {
  display: ['Ubuntu', 'Inter', 'sans-serif'] as const,
  body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'] as const,
} as const;

export interface ReferenceAssetManifest {
  /** Path under `public/` — what the `<img>` `src` resolves to in-app. */
  publicPath: string;
  /** Filesystem path relative to repo root (used by Node-side tests). */
  fsPath: string;
  /** Pixel width the PNG MUST decode to. */
  expectedWidth: number;
  /** Pixel height the PNG MUST decode to. */
  expectedHeight: number;
  /** Why this size is locked — kept short so a failing test is debuggable. */
  whyLocked: string;
}

/**
 * Pinned manifest of every reference asset surfaced by `ReferenceGallery`.
 * Resolutions match the current authored PNGs (read once at v0.136 via
 * `python3` IHDR decode). If you re-export an asset, update the
 * matching entry below and the test will keep enforcing the new size.
 *
 * Adding a new asset:
 *   1. Author the PNG into `public/reference/{topic}/foo.png`.
 *   2. Mirror it into `spec/slides/llm/assets/{topic}/foo.png` so the
 *      LLM pack stays self-contained.
 *   3. Add an entry below + a row in `ReferenceGallery.tsx` + a row in
 *      `spec/slides/llm/assets/INDEX.md`.
 */
export const REFERENCE_ASSETS: readonly ReferenceAssetManifest[] = [
  {
    publicPath: '/reference/canvas/canvas-1920x1080.png',
    fsPath: 'public/reference/canvas/canvas-1920x1080.png',
    expectedWidth: 1920,
    expectedHeight: 1080,
    whyLocked: 'Literal deck canvas — annotated 96px bands assume 1920×1080.',
  },
  {
    publicPath: '/reference/background/ambient-drift.png',
    fsPath: 'public/reference/background/ambient-drift.png',
    expectedWidth: 1600,
    expectedHeight: 900,
    whyLocked: '16:9 ambient preset thumbnail.',
  },
  {
    publicPath: '/reference/typography/scale.png',
    fsPath: 'public/reference/typography/scale.png',
    expectedWidth: 1600,
    expectedHeight: 1500,
    whyLocked: 'Type-ladder portrait composition — re-flowing it would re-rank the rungs.',
  },
  {
    publicPath: '/reference/authoring/json-flow.png',
    fsPath: 'public/reference/authoring/json-flow.png',
    expectedWidth: 1800,
    expectedHeight: 700,
    whyLocked: 'Wide horizontal flow diagram (intake → 40-box checklist).',
  },
  {
    publicPath: '/reference/step/target.png',
    fsPath: 'public/reference/step/target.png',
    expectedWidth: 1023,
    expectedHeight: 573,
    whyLocked: 'Editor-capture of the canonical step-timeline target look.',
  },
  {
    publicPath: '/reference/step/broken-reference.png',
    fsPath: 'public/reference/step/broken-reference.png',
    expectedWidth: 1024,
    expectedHeight: 576,
    whyLocked: 'Editor-capture of the step-timeline anti-pattern.',
  },
  {
    publicPath: '/reference/title/presenter.png',
    fsPath: 'public/reference/title/presenter.png',
    expectedWidth: 1024,
    expectedHeight: 1024,
    whyLocked: 'Square portrait — used circular-cropped on the title slide.',
  },
  {
    publicPath: '/reference/title/riseup-asia-logo.png',
    fsPath: 'public/reference/title/riseup-asia-logo.png',
    expectedWidth: 854,
    expectedHeight: 214,
    whyLocked: 'Wordmark proportions — never recolor / crop / re-kern.',
  },
  {
    publicPath: '/reference/controller/controller-pill.png',
    fsPath: 'public/reference/controller/controller-pill.png',
    expectedWidth: 441,
    expectedHeight: 110,
    whyLocked: 'Bottom-center controller pill at native screenshot ratio.',
  },
] as const;

/**
 * Decode width + height from a PNG buffer's IHDR chunk.
 *
 * The PNG format is fixed-layout for the first 24 bytes:
 *   - bytes 0..7   → 8-byte signature (89 50 4E 47 0D 0A 1A 0A)
 *   - bytes 8..15  → IHDR chunk length (4) + type "IHDR" (4)
 *   - bytes 16..19 → big-endian uint32 width
 *   - bytes 20..23 → big-endian uint32 height
 *
 * We avoid pulling in `image-size` / `sharp` because Node's built-in Buffer
 * + this 8-line decoder is enough for QA: we only need the dimensions, and
 * we want zero new dependencies for a test-time check.
 */
export function decodePngDimensions(buf: Uint8Array): { width: number; height: number } {
  if (buf.length < 24) {
    throw new Error(`PNG buffer too small (${buf.length} bytes) — not a valid PNG.`);
  }
  // Signature check — anything else is a corrupted file or a JPG masquerading as a PNG.
  const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < SIG.length; i++) {
    if (buf[i] !== SIG[i]) throw new Error('Missing PNG signature — not a PNG file.');
  }
  // Big-endian uint32 reads.
  const readU32 = (offset: number) =>
    (buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3];
  return { width: readU32(16) >>> 0, height: readU32(20) >>> 0 };
}
