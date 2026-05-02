/**
 * CI guard against hardcoded white colors in slide components.
 *
 * Why this test exists
 * --------------------
 * Themes like `github-light` remap `--white` → dark ink so titles + body
 * text stay legible on light slide surfaces. Any slide that paints text
 * with a literal `hsl(0 0% 100%)`, `#fff*`, or `rgb(255,255,255)` bypasses
 * that override and renders white-on-white. We caught one such bug
 * recently in `StepTimelineSlide` (the title used an inline
 * `style={{ color: 'hsl(0 0% 100%)' }}` instead of the theme token).
 *
 * This test runs the same audit script that powers
 * `bun run scripts/audit-hardcoded-white.ts` — so the *exact* set of
 * patterns + opt-out conventions stays in one place. If a future PR
 * introduces a new theme-blind white literal, this test fails with the
 * file, line, and a concrete fix suggestion.
 *
 * Opting out
 * ----------
 * If a literal IS intentional (e.g. canvas pixel fills for a QR code,
 * brand glyph colors), append a trailing comment:
 *   ctx.fillStyle = '#ffffff'; // hardcoded-white-ok: <reason>
 * The auditor records the reason and skips the line.
 */
import { describe, it, expect } from 'vitest';
import {
  auditHardcodedWhite,
  auditSource,
} from '../../scripts/audit-hardcoded-white';

describe('hardcoded white color audit — repo scan', () => {
  it('finds no theme-blind white literals in src/slides/', () => {
    const { findings } = auditHardcodedWhite();
    if (findings.length > 0) {
      const detail = findings
        .map(
          (f) =>
            `  ${f.file}:${f.line}:${f.column}  [${f.patternId}]  ${f.match}\n` +
            `    ${f.source}\n` +
            `    fix: ${f.fix}`,
        )
        .join('\n\n');
      throw new Error(
        `Found ${findings.length} hardcoded white color(s). ` +
          `Replace with a theme token (e.g. \`hsl(var(--white))\`) so ` +
          `light themes (github-light) stay legible. To intentionally allow ` +
          `a literal, append \`// hardcoded-white-ok: <reason>\` to the line.\n\n${detail}`,
      );
    }
    expect(findings).toEqual([]);
  });
});

/**
 * Pattern-level unit tests. Each runs `auditSource()` on a tiny synthetic
 * fixture so we can assert the new patterns introduced alongside the
 * `text-white` + inline-`color:` audit:
 *
 *   - tw-text-white   → flags Tailwind `text-white` in slide types
 *   - inline-color    → flags `style={{ color: <non-token> }}` in slide types
 *
 * Path is set to `src/slides/types/Foo.tsx` because both patterns are
 * scoped to slide-type files (dev/QA overlay chrome is intentionally
 * exempt — see `scopePrefixes` in the script).
 */
const TYPE_PATH = 'src/slides/types/Fixture.tsx';

describe('audit pattern: tw-text-white', () => {
  it('flags `text-white` in a className string', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      'export const X = () => <h1 className="text-white text-4xl">Hi</h1>;\n',
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.patternId).toBe('tw-text-white');
    expect(findings[0]?.match).toBe('text-white');
  });

  it('flags variant-prefixed forms (`hover:text-white`, `md:text-white`)', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<div className="hover:text-white md:text-white" />\n',
    );
    expect(findings).toHaveLength(2);
    for (const f of findings) expect(f.patternId).toBe('tw-text-white');
  });

  it('does NOT flag the themed bracket form `text-[hsl(var(--white))]`', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<div className="text-[hsl(var(--white))]" />\n',
    );
    expect(findings.filter((f) => f.patternId === 'tw-text-white')).toEqual([]);
  });

  it('does NOT flag tokens that merely contain the substring', () => {
    // `text-white-glow` is hypothetical but the lookahead/lookbehind
    // boundary checks should keep us from matching it.
    const { findings } = auditSource(
      TYPE_PATH,
      '<div className="text-white-glow stext-white" />\n',
    );
    expect(findings.filter((f) => f.patternId === 'tw-text-white')).toEqual([]);
  });

  it('does NOT scan dev/QA chrome paths', () => {
    const { findings } = auditSource(
      'src/slides/components/AlignmentGuideOverlay.tsx',
      '<div className="text-white" />\n',
    );
    expect(findings.filter((f) => f.patternId === 'tw-text-white')).toEqual([]);
  });

  it('respects the per-line opt-out comment', () => {
    const { findings, skips } = auditSource(
      TYPE_PATH,
      '<div className="text-white" /> // hardcoded-white-ok: brand glyph\n',
    );
    expect(findings).toEqual([]);
    expect(skips).toHaveLength(1);
    expect(skips[0]?.reason).toMatch(/brand glyph/);
  });
});

describe('audit pattern: inline-color', () => {
  it('flags a literal color string in style={{ color: ... }}', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<span style={{ color: "white" }}>x</span>\n',
    );
    const inline = findings.filter((f) => f.patternId === 'inline-color');
    expect(inline).toHaveLength(1);
  });

  it('flags an unknown identifier passed to color', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      'const c = redFromCdn; <i style={{ color: c }} />\n',
    );
    const inline = findings.filter((f) => f.patternId === 'inline-color');
    expect(inline).toHaveLength(1);
  });

  it('flags hex literals inside inline color', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<i style={{ color: "#ffaa00" }} />\n',
    );
    expect(findings.some((f) => f.patternId === 'inline-color')).toBe(true);
  });

  it('does NOT flag theme-token color values (`hsl(var(--gold))`)', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<i style={{ color: "hsl(var(--gold))" }} />\n',
    );
    expect(findings.filter((f) => f.patternId === 'inline-color')).toEqual([]);
  });

  it('does NOT flag theme-token color with alpha', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<i style={{ color: "hsl(var(--foreground) / 0.7)" }} />\n',
    );
    expect(findings.filter((f) => f.patternId === 'inline-color')).toEqual([]);
  });

  it('does NOT flag `color:` that appears inside a string attribute (not style={{}})', () => {
    // Regression: an earlier version of the rule matched any `color:` and
    // tripped on debug-label strings like
    //   data-debug-class=".step-title (color: hsl(var(--foreground)))"
    const { findings } = auditSource(
      TYPE_PATH,
      '<i data-debug="color: hsl(var(--foreground))" />\n',
    );
    expect(findings.filter((f) => f.patternId === 'inline-color')).toEqual([]);
  });

  it('does NOT scan dev/QA chrome paths', () => {
    const { findings } = auditSource(
      'src/slides/components/RuntimeImageQAOverlay.tsx',
      '<i style={{ color: "white" }} />\n',
    );
    expect(findings.filter((f) => f.patternId === 'inline-color')).toEqual([]);
  });
});
