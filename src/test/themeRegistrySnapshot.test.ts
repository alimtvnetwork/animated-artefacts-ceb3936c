import { describe, it, expect } from 'vitest';
import { THEMES, type ThemeId } from '@/slides/themes';

/**
 * Pins the exact built-in theme registry so adding/removing a theme is a
 * deliberate, reviewed change (the contrast/QA audits iterate THEMES
 * dynamically and would silently accept a dropped id). Includes the three
 * image-derived themes — spec/21-slides-system/08-image-derived-themes.md.
 */
const EXPECTED_THEME_IDS: readonly ThemeId[] = [
  'noir-gold', 'bright-gold', 'vscode-dark', 'dracula', 'monokai',
  'github-light', 'paper-ink', 'macos-sonoma', 'windows-11', 'navy-blue',
  'glasswing', 'think-yellow', 'riseup-pro',
];

describe('theme registry snapshot', () => {
  it('exposes exactly the expected theme ids', () => {
    expect([...Object.keys(THEMES)].sort()).toEqual([...EXPECTED_THEME_IDS].sort());
  });

  it('every theme declares Ubuntu display + Poppins body for image-derived flavors', () => {
    for (const id of ['glasswing', 'think-yellow', 'riseup-pro'] as const) {
      expect(THEMES[id].fonts.display).toContain('Ubuntu');
      expect(THEMES[id].fonts.body).toContain('Poppins');
    }
  });
});
