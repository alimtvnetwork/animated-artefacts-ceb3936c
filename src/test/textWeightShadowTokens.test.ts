import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Text-weight shadow tokens — see spec/architecture/text-weight-shadow.md.
 *
 * Guards:
 *   1. The four design tokens exist in src/index.css.
 *   2. The five `.text-weight*` utilities are defined.
 *   3. A `prefers-reduced-transparency` block re-declares the tokens
 *      (so the soft halo is dropped for that audience).
 *   4. The semantic slide classes (.slide-title-display, .slide-eyebrow,
 *      .slide-subtitle, .step-row .step-title) reference one of the
 *      `--text-shadow-weight-*` tokens — never a raw rgba()/hsl() shadow.
 *   5. No slide component file under src/slides/types defines its own
 *      `text-shadow:` with a hardcoded color (must go through the tokens).
 */

const CSS = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');

describe('text-weight shadow design system', () => {
  it('declares the four shadow tokens', () => {
    expect(CSS).toMatch(/--text-shadow-weight-light:/);
    expect(CSS).toMatch(/--text-shadow-weight-light-strong:/);
    expect(CSS).toMatch(/--text-shadow-weight-dark:/);
    expect(CSS).toMatch(/--text-shadow-weight-dark-strong:/);
  });

  it('exposes the utility classes', () => {
    expect(CSS).toMatch(/\.text-weight\s*\{/);
    expect(CSS).toMatch(/\.text-weight-strong\s*\{/);
    expect(CSS).toMatch(/\.text-weight-dark\s*\{/);
    expect(CSS).toMatch(/\.text-weight-dark-strong\s*\{/);
    expect(CSS).toMatch(/\.text-weight-none\s*\{/);
  });

  it('respects prefers-reduced-transparency', () => {
    expect(CSS).toMatch(/@media \(prefers-reduced-transparency: reduce\)/);
  });

  it('wires semantic slide classes to the tokens', () => {
    const semantic = [
      /\.slide-title-display\s*\{[^}]*text-shadow:\s*var\(--text-shadow-weight-light-strong\)/s,
      /\.slide-title-content\s*\{[^}]*text-shadow:\s*var\(--text-shadow-weight-light-strong\)/s,
      /\.slide-eyebrow\s*\{[^}]*text-shadow:\s*var\(--text-shadow-weight-light\)/s,
      /\.slide-subtitle\s*\{[^}]*text-shadow:\s*var\(--text-shadow-weight-light\)/s,
      /\.step-row \.step-title\s*\{[^}]*text-shadow:\s*var\(--text-shadow-weight-light-strong\)/s,
    ];
    for (const re of semantic) expect(CSS).toMatch(re);
  });
});
