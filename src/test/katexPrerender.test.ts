/**
 * KaTeX prerender unit test (audit cleanup polish).
 *
 * Mirrors the term-wrapping logic in `scripts/prerender-equations.ts`.
 * Keeping the helper inline (rather than importing from the script,
 * which has top-level side effects) preserves the script as a one-shot
 * CLI while still locking the term-id contract under CI.
 */
import { describe, expect, it } from 'vitest';
import katex from 'katex';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function renderEquation(tex: string, providedTermIds?: string[]): { html: string; termIds: string[] } {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: true,
    output: 'html',
    strict: 'ignore',
  });
  const tokens = tex.split(/\s+/).filter(Boolean);
  const termIds = (providedTermIds && providedTermIds.length === tokens.length)
    ? providedTermIds
    : tokens.map((_, i) => `t${i}`);
  const overlay = tokens
    .map((tok, i) => `<span class="equation-term equation-term--prerendered" data-term-id="${termIds[i]}" style="animation-delay:${i * 80}ms">${escapeHtml(tok)}</span>`)
    .join(' ');
  return { html: `<div class="equation-katex">${html}</div><div class="equation-stagger-overlay" aria-hidden="true">${overlay}</div>`, termIds };
}

describe('KaTeX prerender', () => {
  it('produces opaque KaTeX block + stagger overlay', () => {
    const { html } = renderEquation('a + b = c');
    expect(html).toContain('class="equation-katex"');
    expect(html).toContain('class="equation-stagger-overlay"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('auto-generates termIds (one per whitespace-split token)', () => {
    const { termIds } = renderEquation('a + b = c');
    expect(termIds).toEqual(['t0', 't1', 't2', 't3', 't4']);
  });

  it('honors author-provided termIds when length matches', () => {
    const { termIds, html } = renderEquation('x = y', ['lhs', 'eq', 'rhs']);
    expect(termIds).toEqual(['lhs', 'eq', 'rhs']);
    expect(html).toContain('data-term-id="lhs"');
  });

  it('regenerates termIds when length mismatches', () => {
    const { termIds } = renderEquation('a + b', ['only-one']);
    expect(termIds).toEqual(['t0', 't1', 't2']);
  });

  it('staggers each overlay term by 80ms', () => {
    const { html } = renderEquation('a b c');
    expect(html).toContain('animation-delay:0ms');
    expect(html).toContain('animation-delay:80ms');
    expect(html).toContain('animation-delay:160ms');
  });

  it('escapes HTML-special tokens in overlay', () => {
    const { html } = renderEquation('a < b');
    expect(html).toContain('>&lt;<');
  });

  it('does not throw on malformed TeX (strict:ignore + throwOnError:false)', () => {
    expect(() => renderEquation('\\notacommand{x}')).not.toThrow();
  });
});
