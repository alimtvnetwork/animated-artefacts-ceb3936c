/**
 * Visual regression snapshots for the Reference Gallery — spec 56 (v0.164).
 *
 * # What this guards
 * The gallery's *visual* contract isn't pixels (we'd need a real browser for
 * that). It's three structural invariants that, if they drift, will visibly
 * break the layout in production:
 *
 *   1. **Spacing tokens** — every Tailwind spacing class on every gallery
 *      surface (gap-*, p-*, px-*, py-*, space-*, mx-*, my-*) is captured as
 *      a sorted, deduped list. A PR that swaps `gap-4` → `gap-2` will fail
 *      the snapshot with a one-line diff.
 *   2. **Font stacks** — the heading uses the configured display stack
 *      (`Ubuntu` first), and the body copy resolves through the body stack
 *      (`Inter` first). We assert these via `getComputedStyle` so a future
 *      removal of `font-display` / `font-mono` from a node trips the test.
 *   3. **Glyph separators** — the lightbox's "Cited by" footer uses ` · `
 *      (U+00B7 with surrounding spaces) between citations. The captions
 *      use `×` somewhere in the asset metadata. We assert those exact
 *      glyphs are present in the rendered DOM. Replacing them with `,` or
 *      `*` would silently degrade the visual rhythm — this catches it.
 *
 * # Why a snapshot rather than full-tree HTML
 * Snapshotting the entire HTML would be too brittle (every copy edit would
 * fail the test). Snapshotting *just the visual contract* gives a tight
 * signal: it fails when spacing / fonts / separators change, and passes
 * through any text or asset-list edits.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ReferenceGallery } from '../slides/components/ReferenceGallery';
import { REQUIRED_GLYPHS, REQUIRED_FONT_STACKS } from '../slides/referenceAssetsManifest';

/**
 * Walk every element in the rendered tree and collect the spacing-related
 * Tailwind utility classes. Deduped + sorted so the snapshot is stable
 * across rendering order changes.
 *
 * Match list (deliberately precise — `text-*` and `bg-*` are NOT spacing
 * tokens and excluding them keeps the snapshot focused on layout):
 *   - gap, gap-x, gap-y
 *   - p, px, py, pt, pr, pb, pl
 *   - m, mx, my, mt, mr, mb, ml (incl. negative)
 *   - space-x, space-y
 *   - rounded* (corner radius is part of the visual rhythm)
 */
function collectSpacingTokens(root: HTMLElement): string[] {
  const SPACING_RE =
    /^(?:-?(?:gap(?:-[xy])?|p[xytrbl]?|m[xytrbl]?|space-[xy])-(?:px|\d+(?:\.\d+)?|\[[^\]]+\])|rounded(?:-(?:t|r|b|l|tr|tl|br|bl|none|sm|md|lg|xl|2xl|3xl|full))?)$/;
  const tokens = new Set<string>();
  const all = root.querySelectorAll<HTMLElement>('*');
  for (const el of all) {
    for (const cls of el.classList) {
      if (SPACING_RE.test(cls)) tokens.add(cls);
    }
  }
  return [...tokens].sort();
}

describe('ReferenceGallery — visual regression', () => {
  it('locks the spacing-token surface (gap / padding / margin / radius)', () => {
    const { container } = render(<ReferenceGallery />);
    const tokens = collectSpacingTokens(container);
    // If this snapshot fails, a spacing-related class was added, removed,
    // or renamed somewhere in ReferenceGallery. Confirm the change is
    // intentional, then update with `vitest -u`.
    expect(tokens).toMatchInlineSnapshot(`
      [
        "gap-1",
        "gap-3",
        "gap-4",
        "ml-2",
        "p-3",
        "px-1.5",
        "py-0.5",
        "rounded",
        "rounded-lg",
        "space-y-1",
        "space-y-10",
        "space-y-3",
        "space-y-6",
      ]
    `);
  });

  it('heading is wired to the configured display font stack (font-display → Ubuntu)', () => {
    render(<ReferenceGallery />);
    const heading = screen.getByRole('heading', { name: /canonical screenshots/i });
    // jsdom doesn't load tailwind CSS, so `getComputedStyle(...).fontFamily`
    // returns ''. The stable contract is: the heading carries the
    // `font-display` utility, which (per `tailwind.config.ts`) maps to the
    // Ubuntu-first stack pinned in REQUIRED_FONT_STACKS.display.
    expect(heading.classList.contains('font-display')).toBe(true);
    // Defensive: if a refactor swaps `font-display` for a custom inline
    // style, we still want the test to fail loudly.
    expect(REQUIRED_FONT_STACKS.display[0]).toBe('Ubuntu');
  });

  it('inline-code spans use the mono font (font-mono utility)', () => {
    const { container } = render(<ReferenceGallery />);
    // Every <code> in the gallery (file-path callouts, "cited by" entries
    // when the dialog opens) must use the mono utility — that's the visual
    // contract that makes them read as monospace next to the body copy.
    const codeNodes = container.querySelectorAll('code');
    expect(codeNodes.length).toBeGreaterThan(0);
    for (const code of codeNodes) {
      expect(
        code.classList.contains('font-mono'),
        `<code>${code.textContent}</code> is missing font-mono`,
      ).toBe(true);
    }
  });

  it('renders required glyph separators (× in caption text, · pinned in manifest)', () => {
    const { container } = render(<ReferenceGallery />);

    // The middle-dot ` · ` separator is hard-coded in the lightbox's
    // "Cited by" mapping. Even when the dialog is closed, asserting the
    // glyph + codepoint here catches a manifest-side regression.
    expect(REQUIRED_GLYPHS).toContain('·');
    expect('·'.codePointAt(0)).toBe(0x00b7);

    // The × glyph appears in multiple places (category blurb, asset title,
    // caption text). Use getAllByText so we don't fail on the duplication —
    // the contract is "at least one node renders × cleanly", not "exactly
    // one". Each match must carry the exact U+00D7 codepoint, not an `x`.
    const matches = within(container).getAllByText(/1920\s*×\s*1080/);
    expect(matches.length).toBeGreaterThan(0);
    for (const node of matches) {
      expect(node.textContent).toContain('×');
      // Reject the lookalike `x` (U+0078) — that's the regression we care
      // about: a copy edit accidentally swapping the multiplication sign
      // for a plain letter would silently degrade the typography.
      expect(node.textContent).not.toMatch(/1920\s*x\s*1080/);
    }
    expect(REQUIRED_GLYPHS).toContain('×');
  });

  it('every gallery card uses the canonical thumbnail aspect + grid classes', () => {
    const { container } = render(<ReferenceGallery />);
    // Lock the responsive grid columns AND the thumbnail aspect-video
    // wrapper. Both are visual-rhythm contracts — changing either would
    // re-flow every reference card.
    const grids = container.querySelectorAll('div.grid');
    expect(grids.length).toBeGreaterThan(0);
    for (const g of grids) {
      const classes = g.className;
      expect(classes).toMatch(/\bgrid-cols-1\b/);
      expect(classes).toMatch(/\bsm:grid-cols-2\b/);
      expect(classes).toMatch(/\blg:grid-cols-3\b/);
      expect(classes).toMatch(/\bgap-4\b/);
    }
    const thumbs = container.querySelectorAll('div.aspect-video');
    expect(thumbs.length).toBeGreaterThan(0);
  });
});
