import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

import {
  detectShapeProblems,
  detectMimeMismatch,
  detectCaseDrift,
  collectResolutionFindings,
  discoverOtherDeckSlugs,
  renderCsv,
  renderJson,
  buildExportRows,
  parseSeverityArg,
  DEFAULT_SEVERITY,
  buildSummary,
  renderSummaryCsv,
  renderSummaryJson,
  renderSummaryMarkdown,
  deckJsonPathPrefix,
} from '../../scripts/audit-asset-resolutions';

/**
 * Why a real temp dir instead of a mocked fs:
 *   `detectCaseDrift` and the orphan walker both call `readdirSync` /
 *   `existsSync` against absolute paths derived from process.cwd().
 *   A temp dir lets us assert their real behaviour (case-sensitive
 *   string comparison, directory walking) without any vi.mock surface
 *   that would mask whichever of those code paths regresses.
 */

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPG_SIG = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
function makePng(): Buffer {
  // 8 PNG sig + 8 IHDR length+type + 13 IHDR data (w=h=16) + 4 crc
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(16, 8);
  ihdr.writeUInt32BE(16, 12);
  return Buffer.concat([PNG_SIG, ihdr]);
}

describe('resolution audit — shape problems', () => {
  it('flags empty URL', () => {
    const f = detectShapeProblems('', 'deck.assets.brand.x');
    expect(f.some((e) => e.reason.includes('empty'))).toBe(true);
  });
  it('flags whitespace, backslash, protocol-relative, no-leading-slash', () => {
    expect(detectShapeProblems(' /a.png', 'p').some((e) => e.reason.includes('whitespace'))).toBe(true);
    expect(detectShapeProblems('/a\\b.png', 'p').some((e) => e.reason.includes('backslash'))).toBe(true);
    expect(detectShapeProblems('//host/a.png', 'p').some((e) => e.reason.includes('protocol-relative'))).toBe(true);
    expect(detectShapeProblems('a.png', 'p').some((e) => e.reason.includes('not absolute'))).toBe(true);
  });
  it('flags traversal and outside-public', () => {
    expect(detectShapeProblems('/a/../b.png', 'p').some((e) => e.reason.includes('traversal'))).toBe(true);
    expect(detectShapeProblems('/src/img.png', 'p').some((e) => e.reason.includes('outside'))).toBe(true);
    expect(detectShapeProblems('/node_modules/x.png', 'p').some((e) => e.reason.includes('outside'))).toBe(true);
  });
  it('flags missing extension', () => {
    expect(detectShapeProblems('/asset/file', 'p').some((e) => e.reason.includes('no file extension'))).toBe(true);
  });
  it('passes a clean URL', () => {
    expect(detectShapeProblems('/assets/brand/logo.png', 'p')).toEqual([]);
  });
  it('skips remote URLs entirely', () => {
    expect(detectShapeProblems('https://cdn.example.com/x.png', 'p')).toEqual([]);
  });
});

describe('resolution audit — MIME mismatch + case drift + orphans', () => {
  let dir: string;
  let originalCwd: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'res-audit-'));
    originalCwd = process.cwd();
    // Build a fake repo: public/, spec/slides/<sibling-deck>/deck.json
    mkdirSync(join(dir, 'public/assets/brand'), { recursive: true });
    mkdirSync(join(dir, 'public/sounds'), { recursive: true });
    mkdirSync(join(dir, 'spec/slides/sibling'), { recursive: true });
    writeFileSync(join(dir, 'spec/slides/sibling/deck.json'), '{}');
    // not-a-deck dir — should NOT be picked up by discoverOtherDeckSlugs
    mkdirSync(join(dir, 'spec/slides/assets'), { recursive: true });

    // A real PNG file at a cased name.
    writeFileSync(join(dir, 'public/assets/brand/Logo.png'), makePng());
    // A JPG file masquerading as .png (mime mismatch).
    writeFileSync(join(dir, 'public/assets/brand/wrong.png'), JPG_SIG);
    // An orphan sound.
    writeFileSync(join(dir, 'public/sounds/orphan.mp3'), Buffer.from([0xff, 0xfb, 0x00, 0x00]));
    // A referenced sound (so we can prove orphan detection skips referenced files).
    writeFileSync(join(dir, 'public/sounds/used.mp3'), Buffer.from([0xff, 0xfb, 0x00, 0x00]));

    process.chdir(dir);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    rmSync(dir, { recursive: true, force: true });
  });

  it('detects mime mismatch when extension disagrees with magic bytes', () => {
    const f = detectMimeMismatch(
      '/assets/brand/wrong.png',
      resolve(dir, 'public/assets/brand/wrong.png'),
      'deck.assets.brand.wrong',
    );
    expect(f).not.toBeNull();
    expect(f!.class).toBe('mime');
    expect(f!.reason).toContain('jpg');
  });

  it('does not flag mime mismatch when extension matches', () => {
    const f = detectMimeMismatch(
      '/assets/brand/Logo.png',
      resolve(dir, 'public/assets/brand/Logo.png'),
      'deck.assets.brand.logo',
    );
    expect(f).toBeNull();
  });

  it('detects case drift when URL casing differs from on-disk filename', () => {
    // URL says LOGO.png, file is Logo.png — works on macOS dev (case-
    // insensitive) but 404s on Linux production.
    const f = detectCaseDrift('/assets/brand/LOGO.png', 'deck.assets.brand.logo', undefined, dir);
    expect(f).not.toBeNull();
    expect(f!.class).toBe('case-drift');
    expect(f!.reason).toContain('Logo.png');
  });

  it('does not flag case drift when basename casing matches exactly', () => {
    expect(detectCaseDrift('/assets/brand/Logo.png', 'p', undefined, dir)).toBeNull();
  });

  it('does not flag case drift on lowercase-only basenames (no risk)', () => {
    // Even if file is missing, we return null — that's the missing-refs job.
    expect(detectCaseDrift('/assets/brand/nope.png', 'p', undefined, dir)).toBeNull();
  });

  it('discovers sibling decks but ignores non-deck dirs', () => {
    const slugs = discoverOtherDeckSlugs(dir, 'showcase');
    expect(slugs).toEqual(['sibling']);
  });

  it('collects orphan sounds while leaving referenced files alone', () => {
    const findings = collectResolutionFindings(
      {
        deckSlug: 'showcase',
        assets: {
          audio: { used: '/sounds/used.mp3' },
          brand: { logo: '/assets/brand/Logo.png' },
        },
      },
      [],
      { repoRoot: dir, otherDeckSlugs: [] },
    );
    const orphanUrls = findings.filter((f) => f.class === 'orphan').map((f) => f.url).sort();
    expect(orphanUrls).toContain('/sounds/orphan.mp3');
    expect(orphanUrls).not.toContain('/sounds/used.mp3');
  });

  it('flags cross-deck references via namespaced segments', () => {
    const findings = collectResolutionFindings(
      {
        deckSlug: 'showcase',
        assets: {
          brand: { stolen: '/assets/sibling/logo.png' },
        },
      },
      [],
      { repoRoot: dir, otherDeckSlugs: ['sibling'] },
    );
    const cross = findings.filter((f) => f.class === 'orphan' && f.url.includes('sibling'));
    expect(cross.length).toBeGreaterThan(0);
    expect(cross[0].reason).toContain('sibling');
  });

  it('aggregates shape findings from declared assets', () => {
    const findings = collectResolutionFindings(
      {
        deckSlug: 'showcase',
        assets: {
          brand: { bad: 'not-a-path' },
        },
      },
      [],
      { repoRoot: dir, otherDeckSlugs: [] },
    );
    expect(findings.some((f) => f.class === 'shape')).toBe(true);
});

describe('resolution audit — CSV / JSON export', () => {
  // Synthesize an ExportRow inline via renderCsv to avoid coupling to
  // the deck-loading path (already exercised above). The shape contract
  // is what the spreadsheet importers care about.
  const rows = [
    {
      source: 'resolution-finding' as const,
      severity: 'warn' as const,
      kind: 'brand',
      slug: 'logo',
      url: '/assets/brand/Logo.png',
      rule: 'case-drift',
      expected: 'on-disk basename is "Logo.png"',
      actual: 'lowercase the URL or rename the file',
      referencedAt: 'deck.assets.brand.logo',
      category: 'case-drift',
    },
    {
      source: 'violation' as const,
      severity: 'error' as const,
      kind: 'qr',
      slug: 'meeting',
      url: '/assets/qr/meeting,v2.png',
      rule: 'maxBytes',
      expected: '≤ 262144',
      actual: '512000, with "quotes" and\nnewline',
      referencedAt: 'deck.meeting.qrAsset',
      category: '',
    },
  ];

  it('renderCsv emits a header row + one row per finding with RFC 4180 escaping', () => {
    const csv = renderCsv(rows);
    const lines = csv.trimEnd().split('\n');
    expect(lines[0]).toBe('source,severity,kind,slug,url,rule,expected,actual,referencedAt,category');
    // 4 physical lines: header + row1 + row2 split across an embedded
    // newline inside a quoted field. Spreadsheet importers reassemble.
    expect(lines).toHaveLength(4);
    // The second row's URL has a comma → must be quoted.
    expect(lines[2]).toContain('"/assets/qr/meeting,v2.png"');
    // The actual field contains a quote AND a newline → must be quoted
    // and quotes doubled. Newline is preserved INSIDE the quoted field,
    // which is why we split on real lines and assert length 3 above.
    expect(csv).toContain('"512000, with ""quotes"" and\nnewline"');
    // severity column populated for both row sources.
    expect(lines[1]).toContain(',warn,');
    expect(lines[2].split(',')[1]).toBe('error');
    // Trailing newline preserved so tools like wc -l count rows correctly.
    expect(csv.endsWith('\n')).toBe(true);
  });

  it('renderJson wraps findings with deck metadata and flag state', () => {
    const json = renderJson(
      'spec/slides/showcase/deck.json',
      { deckSlug: 'showcase', deckName: 'Showcase' },
      rows,
      { strictReferences: true, resolutionAudit: true },
    );
    const parsed = JSON.parse(json);
    expect(parsed.deckSlug).toBe('showcase');
    expect(parsed.deckName).toBe('Showcase');
    expect(parsed.deckFile).toBe('spec/slides/showcase/deck.json');
    expect(parsed.strictReferences).toBe(true);
    expect(parsed.resolutionAudit).toBe(true);
    expect(parsed.totalFindings).toBe(2);
    expect(parsed.findings).toHaveLength(2);
    expect(parsed.findings[0].rule).toBe('case-drift');
    expect(parsed.findings[0].severity).toBe('warn');
    expect(parsed.findings[1].severity).toBe('error');
    expect(typeof parsed.generatedAt).toBe('string');
  });

  it('renderCsv handles zero rows (header only + trailing newline)', () => {
    const csv = renderCsv([]);
    expect(csv).toBe('source,severity,kind,slug,url,rule,expected,actual,referencedAt,category\n');
  });
});
});

describe('resolution audit — severity flag', () => {
  it('parseSeverityArg merges into defaults; unspecified classes keep their default level', () => {
    const m = parseSeverityArg('shape=warn,case-drift=error');
    expect(m.shape).toBe('warn');
    expect(m['case-drift']).toBe('error');
    // Untouched classes retain DEFAULT_SEVERITY values.
    expect(m.mime).toBe(DEFAULT_SEVERITY.mime);
    expect(m.orphan).toBe(DEFAULT_SEVERITY.orphan);
  });

  it('parseSeverityArg accepts off, supports whitespace, ignores empty entries', () => {
    const m = parseSeverityArg(' orphan = off , , shape=warn ');
    expect(m.orphan).toBe('off');
    expect(m.shape).toBe('warn');
  });

  it('parseSeverityArg throws on unknown class or level', () => {
    expect(() => parseSeverityArg('bogus=warn')).toThrow(/unknown class/);
    expect(() => parseSeverityArg('shape=loud')).toThrow(/unknown level/);
    expect(() => parseSeverityArg('shape')).toThrow(/class=level/);
  });

  it('buildExportRows drops findings whose class severity is "off"', () => {
    const findings = [
      { class: 'shape' as const, url: '/a', deckJsonPath: 'p', reason: 'r' },
      { class: 'orphan' as const, url: '/b', deckJsonPath: 'p', reason: 'r' },
    ];
    const sev = parseSeverityArg('orphan=off');
    const out = buildExportRows([], [], findings, sev);
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe('/a');
    expect(out[0].severity).toBe('error'); // shape default
  });

  it('buildExportRows tags surviving resolution findings with their severity level', () => {
    const findings = [
      { class: 'case-drift' as const, url: '/a', deckJsonPath: 'p', reason: 'r' },
      { class: 'mime' as const, url: '/b', deckJsonPath: 'p', reason: 'r' },
    ];
    const out = buildExportRows([], [], findings); // defaults
    const byUrl = Object.fromEntries(out.map((r) => [r.url, r.severity]));
    expect(byUrl['/a']).toBe('warn');  // case-drift default
    expect(byUrl['/b']).toBe('error'); // mime default
  });

  it('non-resolution rows (probe-error, missing-reference) are always severity=error', () => {
    const out = buildExportRows(
      [],
      [{ category: 'declared', url: '/m', deckJsonPath: 'deck.assets.brand.x' }],
      [],
      parseSeverityArg('shape=off,mime=off,case-drift=off,orphan=off'),
    );
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('missing-reference');
    expect(out[0].severity).toBe('error');
  });
});

describe('resolution audit — summary aggregation', () => {
  it('deckJsonPathPrefix returns the top two segments ignoring dots inside parens', () => {
    expect(deckJsonPathPrefix('deck.assets.brand.logo')).toBe('deck.assets');
    expect(deckJsonPathPrefix('deck.slides[3] ("v1.2 release").content.qrAsset'))
      .toBe('deck.slides[3] ("v1.2 release")');
    expect(deckJsonPathPrefix('deck.meeting.qrAsset')).toBe('deck.meeting');
    expect(deckJsonPathPrefix('')).toBe('');
    expect(deckJsonPathPrefix('singletoken')).toBe('singletoken');
    expect(deckJsonPathPrefix('only.two')).toBe('only.two');
  });

  it('buildSummary aggregates by source, class, and deckJsonPath with severity totals', () => {
    const findings = [
      { class: 'shape' as const, url: '/a', deckJsonPath: 'deck.assets.brand.a', reason: 'r' },
      { class: 'shape' as const, url: '/b', deckJsonPath: 'deck.assets.brand.b', reason: 'r' },
      { class: 'orphan' as const, url: '/c', deckJsonPath: 'deck.slides[1].content.x', reason: 'r' },
    ];
    const rows = buildExportRows([], [{ category: 'declared', url: '/m', deckJsonPath: 'deck.assets.brand.x' }], findings);
    const s = buildSummary(rows);
    expect(s.totalFindings).toBe(4);
    expect(s.totalErrors).toBe(3);   // 2 shape + 1 missing-reference
    expect(s.totalWarnings).toBe(1); // orphan default warn
    const src = Object.fromEntries(s.bySource.map((b) => [b.key, b]));
    expect(src['resolution-finding'].total).toBe(3);
    expect(src['missing-reference'].total).toBe(1);
    const cls = Object.fromEntries(s.byClass.map((b) => [b.key, b]));
    expect(cls['shape'].total).toBe(2);
    expect(cls['shape'].errors).toBe(2);
    expect(cls['orphan'].warnings).toBe(1);
    const path = Object.fromEntries(s.byDeckJsonPath.map((b) => [b.key, b]));
    expect(path['deck.assets'].total).toBe(3); // 2 shape + 1 missing-reference under deck.assets.*
    expect(path['deck.slides[1]'].total).toBe(1);
  });

  it('buildSummary buckets are sorted by total desc then key asc', () => {
    const findings = [
      { class: 'shape' as const, url: '/a', deckJsonPath: 'a.x', reason: 'r' },
      { class: 'mime' as const, url: '/b', deckJsonPath: 'b.x', reason: 'r' },
      { class: 'mime' as const, url: '/c', deckJsonPath: 'b.y', reason: 'r' },
    ];
    const rows = buildExportRows([], [], findings);
    const s = buildSummary(rows);
    expect(s.byClass.map((b) => b.key)).toEqual(['mime', 'shape']);
  });

  it('renderSummaryCsv emits dimension column with all three groupings', () => {
    const findings = [{ class: 'shape' as const, url: '/a', deckJsonPath: 'deck.assets.brand.a', reason: 'r' }];
    const rows = buildExportRows([], [], findings);
    const csv = renderSummaryCsv(buildSummary(rows));
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('dimension,key,total,errors,warnings');
    expect(lines.some((l) => l.startsWith('source,resolution-finding,1,1,0'))).toBe(true);
    expect(lines.some((l) => l.startsWith('class,shape,1,1,0'))).toBe(true);
    expect(lines.some((l) => l.startsWith('deckJsonPath,deck.assets,1,1,0'))).toBe(true);
  });

  it('renderSummaryJson includes deck metadata + summary payload', () => {
    const findings = [{ class: 'mime' as const, url: '/a', deckJsonPath: 'p', reason: 'r' }];
    const rows = buildExportRows([], [], findings);
    const j = JSON.parse(renderSummaryJson('deck.json', { deckSlug: 'd', deckName: 'D' } as any, buildSummary(rows), { strictReferences: false, resolutionAudit: true }));
    expect(j.deckSlug).toBe('d');
    expect(j.resolutionAudit).toBe(true);
    expect(j.summary.totalFindings).toBe(1);
    expect(j.summary.bySource[0].key).toBe('resolution-finding');
  });

  it('renderSummaryMarkdown produces all three sections + totals', () => {
    const md = renderSummaryMarkdown('d.json', { deckSlug: 'd' } as any, buildSummary([]));
    expect(md).toMatch(/By source/);
    expect(md).toMatch(/By class \/ category/);
    expect(md).toMatch(/By deckJsonPath/);
    expect(md).toMatch(/Total findings: \*\*0\*\*/);
  });
});
