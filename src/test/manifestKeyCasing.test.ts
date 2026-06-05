import { describe, it, expect } from 'vitest';
import { isManifest, manifestSlides } from '../slides/loader';

/**
 * Regression guard for the manifest slide-array key casing.
 *
 * The deck loader reads `Slides` (capital S — the casing every bundled
 * `front-end/project/<deck>/data/slides.json` uses). Older docs said lowercase
 * `slides`, so the loader now tolerates either casing rather than silently
 * dropping a mis-cased manifest. These tests lock both behaviours.
 */
describe('manifest slide-array key casing', () => {
  const entries = [{ title: '01', path: './slides/01-title.json' }];

  it('accepts the canonical capital-S `Slides`', () => {
    expect(isManifest({ Slides: entries })).toBe(true);
    expect(manifestSlides({ Slides: entries })).toEqual(entries);
  });

  it('tolerates lowercase `slides` as an alias', () => {
    expect(isManifest({ slides: entries })).toBe(true);
    expect(manifestSlides({ slides: entries })).toEqual(entries);
  });

  it('prefers `Slides` when both are present', () => {
    const other = [{ title: 'x', path: './slides/x.json' }];
    expect(manifestSlides({ Slides: entries, slides: other })).toEqual(entries);
  });

  it('rejects non-manifest values and returns an empty list', () => {
    expect(isManifest(null)).toBe(false);
    expect(isManifest({ Name: 'no slides key' })).toBe(false);
    expect(manifestSlides({})).toEqual([]);
  });
});
