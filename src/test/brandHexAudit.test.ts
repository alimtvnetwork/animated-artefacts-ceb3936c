/**
 * CI guard against hardcoded brand hex literals in slide source files.
 *
 * Companion to `hardcodedWhiteAudit.test.ts`. Where that test catches
 * literal whites that defeat the GitHub-Light remap, THIS one catches
 * literal brand colors (gold, ember, cream, ink, bright-gold) that
 * defeat the theme system entirely — they break per-theme remapping,
 * the gold-brightness fine-tune slider, and the auto-contrast tokens.
 *
 * Rule of thumb
 * -------------
 * Slide components must reference brand colors via `hsl(var(--gold))`,
 * `hsl(var(--ember))`, `hsl(var(--cream))`, `hsl(var(--ink))` (or via
 * the `.capsule-{tone}` semantic classes). Never paste the raw hex.
 *
 * Opting out
 * ----------
 * If a literal IS intentional (e.g. brand-mark export, PPTX rasterizer
 * that needs RGB pixels), append a trailing comment:
 *   ctx.fillStyle = '#c9a84c'; // brand-hex-ok: pptx pixel export
 */
import { describe, it, expect } from 'vitest';
import {
  auditBrandHex,
  auditSource,
} from '../../scripts/audit-brand-hex';

describe('brand hex audit — repo scan', () => {
  it('finds no hardcoded brand hex literals in src/slides/', () => {
    const { findings } = auditBrandHex();
    if (findings.length > 0) {
      const detail = findings
        .map(
          (f) =>
            `  ${f.file}:${f.line}:${f.column}  ${f.match}\n` +
            `    ${f.source}\n` +
            `    fix: ${f.fix}`,
        )
        .join('\n\n');
      throw new Error(
        `Found ${findings.length} hardcoded brand hex literal(s). ` +
          `Replace with a theme token (e.g. \`hsl(var(--gold))\`) so themes, ` +
          `brightness fine-tune, and auto-contrast keep working. ` +
          `To intentionally allow, append \`// brand-hex-ok: <reason>\`.\n\n${detail}`,
      );
    }
    expect(findings).toEqual([]);
  });
});

const TYPE_PATH = 'src/slides/types/Fixture.tsx';

describe('audit pattern: brand-hex', () => {
  it('flags canonical brand gold #C9A84C', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<i style={{ color: "#C9A84C" }} />\n',
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.patternId).toBe('brand-hex');
    expect(findings[0]?.fix).toMatch(/--gold/);
  });

  it('flags ember, cream, ink', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      [
        '<i style={{ background: "#e85d3a" }} />',
        '<i style={{ color: "#F0D78C" }} />',
        '<i style={{ background: "#0d0d0d" }} />',
      ].join('\n') + '\n',
    );
    expect(findings).toHaveLength(3);
    expect(findings.map((f) => f.fix.match(/--[a-z-]+/)?.[0])).toEqual([
      '--ember', '--cream', '--ink',
    ]);
  });

  it('flags both bright-gold variants (legacy + current)', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<i style={{ color: "#f3a502" }} />\n<i style={{ color: "#FFBE2E" }} />\n',
    );
    expect(findings).toHaveLength(2);
  });

  it('flags 8-digit hex (with alpha) too', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<i style={{ color: "#c9a84c80" }} />\n',
    );
    expect(findings).toHaveLength(1);
  });

  it('does NOT flag `hsl(var(--gold))` (the prescribed form)', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<i style={{ color: "hsl(var(--gold))" }} />\n',
    );
    expect(findings).toEqual([]);
  });

  it('does NOT flag unrelated hexes (e.g. a neutral gray)', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '<i style={{ color: "#777777" }} />\n',
    );
    expect(findings).toEqual([]);
  });

  it('does NOT flag hexes inside identifiers', () => {
    // `tokenC9A84C` should not match — `(?<![\w])` boundary.
    const { findings } = auditSource(
      TYPE_PATH,
      'const tokenC9A84C = 1;\n',
    );
    expect(findings).toEqual([]);
  });

  it('does NOT flag hexes inside comments', () => {
    const { findings } = auditSource(
      TYPE_PATH,
      '// gold baseline is #c9a84c — see themes.ts\n',
    );
    expect(findings).toEqual([]);
  });

  it('respects the per-line opt-out comment', () => {
    const { findings, skips } = auditSource(
      TYPE_PATH,
      '<i style={{ color: "#c9a84c" }} /> // brand-hex-ok: pptx export pixel\n',
    );
    expect(findings).toEqual([]);
    expect(skips).toHaveLength(1);
    expect(skips[0]?.reason).toMatch(/pptx/);
  });
});

/**
 * Positive coverage: confirm the prescribed form (`hsl(var(--gold))`)
 * is the SAME token the audit auto-suggests as the fix. This locks
 * down the contract from `mem://core` ("never raw hex in components").
 */
describe('audit fix-suggestion targets the canonical token', () => {
  it('suggests `hsl(var(--gold))` for a gold hex', () => {
    const { findings } = auditSource(TYPE_PATH, 'const x = "#c9a84c";\n');
    expect(findings[0]?.fix).toContain('hsl(var(--gold))');
  });
});
