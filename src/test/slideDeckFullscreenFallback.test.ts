import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(__dirname, '..', 'pages', 'SlideDeckPage.tsx'), 'utf8');

describe('SlideDeckPage fullscreen fallback contract', () => {
  it('keeps an in-app fullscreen fallback when requestFullscreen is rejected', () => {
    expect(SRC).toMatch(/await document\.documentElement\.requestFullscreen\(\)/);
    expect(SRC).toMatch(/setIsFullscreen\(true\)/);
    expect(SRC).toMatch(/pseudoFullscreenRef\.current = true/);
    expect(SRC).toMatch(/catch \{[\s\S]*setIsFullscreen\(true\)/);
  });

  it('handles exitFullscreen failure without wedging the fullscreen state', () => {
    expect(SRC).toMatch(/await document\.exitFullscreen\(\)/);
    expect(SRC).toMatch(/catch \{[\s\S]*setIsFullscreen\(false\)/);
  });

  it('does not let fullscreenchange clear the fallback layout while pseudo fullscreen is active', () => {
    expect(SRC).toMatch(/if \(pseudoFullscreenRef\.current\) return;/);
    expect(SRC).toMatch(/if \(pseudoFullscreenRef\.current\) \{[\s\S]*setIsFullscreen\(false\)/);
  });
});