import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(__dirname, '..', 'pages', 'SlideDeckPage.tsx'), 'utf8');

describe('SlideDeckPage fullscreen fallback contract', () => {
  it('keeps an in-app fullscreen fallback when requestFullscreen is rejected', () => {
    expect(SRC).toMatch(/await document\.documentElement\.requestFullscreen\(\)/);
    expect(SRC).toMatch(/setIsFullscreen\(true\)/);
    expect(SRC).toMatch(/catch \{[\s\S]*setIsFullscreen\(\(v\) => !v\)/);
  });

  it('handles exitFullscreen failure without wedging the fullscreen state', () => {
    expect(SRC).toMatch(/await document\.exitFullscreen\(\)/);
    expect(SRC).toMatch(/catch \{[\s\S]*setIsFullscreen\(false\)/);
  });
});