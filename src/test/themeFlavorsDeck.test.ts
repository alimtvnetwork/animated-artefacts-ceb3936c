import { describe, it, expect } from 'vitest';
import { THEMES } from '@/slides/themes';
import manifest from '../../front-end/project/theme-flavors/data/slides.json';
import cover from '../../front-end/project/theme-flavors/data/slides/01-cover.json';
import glasswing from '../../front-end/project/theme-flavors/data/slides/02-glasswing.json';
import thinkYellow from '../../front-end/project/theme-flavors/data/slides/03-think-yellow.json';
import riseupPro from '../../front-end/project/theme-flavors/data/slides/04-riseup-pro.json';

/**
 * Pins the `theme-flavors` showcase deck so edits can't silently change its
 * shape. Guards: slide count/types, the deck's declared theme, and that the
 * three image-derived themes it demos still exist in the registry.
 * See spec/21-slides-system/08-image-derived-themes.md.
 */
const IMAGE_DERIVED = ['glasswing', 'think-yellow', 'riseup-pro'] as const;

describe('theme-flavors deck', () => {
  it('declares an image-derived theme and 4 slides', () => {
    expect(IMAGE_DERIVED).toContain(manifest.config.theme);
    expect(manifest.Slides).toHaveLength(4);
  });

  it('pins slide types in order', () => {
    const types = [cover, glasswing, thinkYellow, riseupPro].map((s) => s.slideType);
    expect(types).toEqual(['TitleSlide', 'CapsuleListSlide', 'CapsuleListSlide', 'CapsuleListSlide']);
  });

  it('every demoed image-derived theme is registered', () => {
    for (const id of IMAGE_DERIVED) expect(THEMES[id]).toBeDefined();
  });
});
