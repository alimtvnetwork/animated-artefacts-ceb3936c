#!/usr/bin/env bun
/**
 * Asset diagnostic report.
 *
 * Walks every slide JSON in a deck folder and cross-references each asset
 * reference with the deck's `assets.{audio,qr,brand,icons}` registries.
 * Produces a Markdown report listing:
 *
 *   - REGISTERED & USED        — declared in deck.assets.* and referenced ≥1 time
 *   - REGISTERED but UNUSED    — declared but never referenced (dead entries)
 *   - REFERENCED but MISSING   — referenced by a slide but not declared (broken)
 *
 * For each row we show the registry key (root JSON source) and every
 * `deck.slides[N].<path>` location that touched it, so a typo is one
 * grep away.
 *
 * Usage:
 *   bun ./scripts/asset-diagnostic.ts                      # showcase deck
 *   bun ./scripts/asset-diagnostic.ts <path-to-deck.json>  # custom deck
 *   bun ./scripts/asset-diagnostic.ts <deck> --out report.md
 */
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import process from 'node:process';

const REPO_ROOT = process.cwd();
const DEFAULT_DECK = 'spec/slides/showcase/deck.json';

type AssetKind = 'audio' | 'qr' | 'brand' | 'icon';

interface Reference {
  /** `deck.slides[3] ("process").content.titleAmbient.iconPool[2]` */
  location: string;
  slideNumber: number | null;
  slideName: string | null;
}

interface Row {
  kind: AssetKind;
  slug: string;
  /** `deck.assets.audio.whoosh` etc., or null if unregistered. */
  registryKey: string | null;
  /** Resolved URL (audio/qr/brand) or remap target (icon). */
  resolvedTo: string | null;
  references: Reference[];
}

/* ------------------------------------------------------------------ */
/* Deck + slide loading                                                */
/* ------------------------------------------------------------------ */

interface DeckShape {
  deckSlug?: string;
  deckName?: string;
  meeting?: { qrAsset?: string };
  assets?: {
    audio?: Record<string, string>;
    qr?: Record<string, string>;
    brand?: Record<string, string>;
    icons?: Record<string, string>;
  };
  slides?: string[];
}

interface SlideShape {
  slideNumber?: number;
  slideName?: string;
  sound?: { kind?: string };
  content?: {
    qrAsset?: string;
    titleAmbient?: AmbientShape;
    stepAmbient?: AmbientShape;
    [k: string]: unknown;
  };
}

interface AmbientShape {
  iconPool?: string[];
  positions?: Array<{ icon?: string }>;
}

function loadDeck(deckPath: string): { deck: DeckShape; slides: SlideShape[] } {
  const deck = JSON.parse(readFileSync(deckPath, 'utf8')) as DeckShape;
  const deckDir = dirname(deckPath);
  const slideIds = deck.slides ?? [];
  const slides: SlideShape[] = [];
  for (const id of slideIds) {
    const slidePath = resolve(deckDir, `${id}.json`);
    if (!existsSync(slidePath)) {
      console.warn(`  ! slide file missing: ${id}.json`);
      continue;
    }
    slides.push(JSON.parse(readFileSync(slidePath, 'utf8')) as SlideShape);
  }
  return { deck, slides };
}

/* ------------------------------------------------------------------ */
/* Reference walker                                                    */
/* ------------------------------------------------------------------ */

function collectReferences(deck: DeckShape, slides: SlideShape[]): Map<string, Reference[]> {
  // Key format: `${kind}:${slug}` — kind disambiguates same slug across categories.
  const refs = new Map<string, Reference[]>();
  const push = (kind: AssetKind, slug: string, ref: Reference) => {
    const k = `${kind}:${slug}`;
    if (!refs.has(k)) refs.set(k, []);
    refs.get(k)!.push(ref);
  };

  // Deck-level meeting QR.
  if (deck.meeting?.qrAsset) {
    push('qr', deck.meeting.qrAsset, {
      location: 'deck.meeting.qrAsset',
      slideNumber: null,
      slideName: null,
    });
  }

  for (const slide of slides) {
    const n = slide.slideNumber ?? null;
    const name = slide.slideName ?? null;
    const root = `deck.slides[${n}] ("${name ?? '?'}")`;
    const c = slide.content ?? {};

    if (c.qrAsset) {
      push('qr', c.qrAsset, { location: `${root}.content.qrAsset`, slideNumber: n, slideName: name });
    }
    const soundKind = slide.sound?.kind;
    // `pop` is procedural — has no asset by design.
    if (soundKind && soundKind !== 'pop') {
      push('audio', soundKind, { location: `${root}.sound.kind`, slideNumber: n, slideName: name });
    }

    for (const [blockName, block] of [
      ['titleAmbient', c.titleAmbient],
      ['stepAmbient', c.stepAmbient],
    ] as Array<[string, AmbientShape | undefined]>) {
      if (!block) continue;
      block.iconPool?.forEach((slug, i) => {
        push('icon', slug, {
          location: `${root}.content.${blockName}.iconPool[${i}]`,
          slideNumber: n,
          slideName: name,
        });
      });
      block.positions?.forEach((p, i) => {
        if (p.icon) {
          push('icon', p.icon, {
            location: `${root}.content.${blockName}.positions[${i}].icon`,
            slideNumber: n,
            slideName: name,
          });
        }
      });
    }
  }

  return refs;
}

/* ------------------------------------------------------------------ */
/* Row builder + report                                                */
/* ------------------------------------------------------------------ */

function buildRows(deck: DeckShape, refs: Map<string, Reference[]>): Row[] {
  const rows: Row[] = [];
  const seen = new Set<string>();
  const a = deck.assets ?? {};

  const KINDS: Array<{ kind: AssetKind; block: Record<string, string> | undefined }> = [
    { kind: 'audio', block: a.audio },
    { kind: 'qr', block: a.qr },
    { kind: 'brand', block: a.brand },
    { kind: 'icon', block: a.icons },
  ];

  // 1. Every registered slug — used or unused.
  for (const { kind, block } of KINDS) {
    if (!block) continue;
    for (const [slug, value] of Object.entries(block)) {
      const k = `${kind}:${slug}`;
      seen.add(k);
      const registryKey = `deck.assets.${kind === 'icon' ? 'icons' : kind}.${slug}`;
      rows.push({
        kind,
        slug,
        registryKey,
        resolvedTo: value,
        references: refs.get(k) ?? [],
      });
    }
  }

  // 2. Referenced-but-unregistered (the broken set).
  for (const [k, references] of refs.entries()) {
    if (seen.has(k)) continue;
    const [kind, slug] = k.split(':') as [AssetKind, string];
    rows.push({ kind, slug, registryKey: null, resolvedTo: null, references });
  }

  return rows;
}

function categorise(row: Row): 'used' | 'unused' | 'missing' {
  if (!row.registryKey) return 'missing';
  if (row.references.length === 0) return 'unused';
  return 'used';
}

function renderReport(deckPath: string, deck: DeckShape, rows: Row[]): string {
  const out: string[] = [];
  const now = new Date().toISOString();
  out.push(`# Asset Diagnostic — ${deck.deckSlug ?? basename(deckPath)}`);
  out.push('');
  out.push(`- **Deck name:** ${deck.deckName ?? '—'}`);
  out.push(`- **Deck file:** \`${deckPath}\``);
  out.push(`- **Generated:** ${now}`);
  out.push('');

  // Headline counts.
  const counts = { used: 0, unused: 0, missing: 0 };
  for (const r of rows) counts[categorise(r)]++;
  out.push('## Summary');
  out.push('');
  out.push(`| Status | Count |`);
  out.push(`|---|---|`);
  out.push(`| ✅ Registered & used | ${counts.used} |`);
  out.push(`| ⚠️ Registered but unused | ${counts.unused} |`);
  out.push(`| ❌ Referenced but missing | ${counts.missing} |`);
  out.push('');
  if (counts.missing > 0) {
    out.push(`> ❌ ${counts.missing} broken reference${counts.missing === 1 ? '' : 's'}. Add the missing slug${counts.missing === 1 ? '' : 's'} under \`deck.assets.*\` or fix the typo${counts.missing === 1 ? '' : 's'} in the slide JSON.`);
    out.push('');
  }
  if (counts.unused > 0) {
    out.push(`> ⚠️ ${counts.unused} dead registry entr${counts.unused === 1 ? 'y' : 'ies'}. Safe to delete from \`deck.assets.*\` to keep the manifest tight.`);
    out.push('');
  }

  // Sections by kind.
  for (const kind of ['audio', 'qr', 'brand', 'icon'] as AssetKind[]) {
    const inKind = rows.filter((r) => r.kind === kind);
    if (inKind.length === 0) continue;
    out.push(`## ${kind.toUpperCase()}`);
    out.push('');
    inKind.sort((a, b) => {
      // missing first, then unused, then used; alpha within each.
      const order = { missing: 0, unused: 1, used: 2 } as const;
      const oa = order[categorise(a)];
      const ob = order[categorise(b)];
      if (oa !== ob) return oa - ob;
      return a.slug.localeCompare(b.slug);
    });
    for (const r of inKind) {
      const cat = categorise(r);
      const icon = cat === 'used' ? '✅' : cat === 'unused' ? '⚠️' : '❌';
      out.push(`### ${icon} \`${r.slug}\``);
      out.push('');
      out.push(`- **Registry key:** ${r.registryKey ? `\`${r.registryKey}\`` : '_(not registered)_'}`);
      out.push(`- **Resolves to:** ${r.resolvedTo ? `\`${r.resolvedTo}\`` : '_(no resolution — slug is dangling)_'}`);
      out.push(`- **References (${r.references.length}):**`);
      if (r.references.length === 0) {
        out.push(`  - _(none — entry is unused)_`);
      } else {
        for (const ref of r.references) {
          out.push(`  - \`${ref.location}\``);
        }
      }
      out.push('');
    }
  }

  return out.join('\n');
}

/* ------------------------------------------------------------------ */
/* Console pretty-print (so you don't have to open the .md)            */
/* ------------------------------------------------------------------ */

function printConsoleSummary(rows: Row[]): void {
  const grouped: Record<AssetKind, Row[]> = { audio: [], qr: [], brand: [], icon: [] };
  for (const r of rows) grouped[r.kind].push(r);
  for (const kind of ['audio', 'qr', 'brand', 'icon'] as AssetKind[]) {
    const list = grouped[kind];
    if (list.length === 0) continue;
    console.log(`\n  ${kind.toUpperCase()}`);
    for (const r of list.sort((a, b) => a.slug.localeCompare(b.slug))) {
      const cat = categorise(r);
      const tag = cat === 'used' ? '✓' : cat === 'unused' ? '·' : '✗';
      const refs = r.references.length;
      console.log(`    ${tag} ${r.slug.padEnd(20)} ${refs.toString().padStart(2)} ref${refs === 1 ? '' : 's'}  ${r.registryKey ? '' : '(unregistered)'}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

function main(): number {
  const args = process.argv.slice(2);
  let deckArg: string | undefined;
  let outArg: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') outArg = args[++i];
    else if (!deckArg) deckArg = args[i];
  }
  const deckPath = deckArg ?? DEFAULT_DECK;
  const fullPath = resolve(REPO_ROOT, deckPath);
  if (!existsSync(fullPath)) {
    console.error(`✗ Deck not found: ${deckPath}`);
    return 1;
  }

  const { deck, slides } = loadDeck(fullPath);
  const refs = collectReferences(deck, slides);
  const rows = buildRows(deck, refs);

  const counts = { used: 0, unused: 0, missing: 0 };
  for (const r of rows) counts[categorise(r)]++;

  console.log(`\n  Deck: ${deck.deckSlug ?? deckPath}  ·  ${slides.length} slide${slides.length === 1 ? '' : 's'}`);
  console.log(`  ✅ ${counts.used} used   ⚠️  ${counts.unused} unused   ❌ ${counts.missing} missing`);
  printConsoleSummary(rows);

  const outPath = outArg ?? `/mnt/documents/asset-diagnostic-${deck.deckSlug ?? 'deck'}.md`;
  const md = renderReport(deckPath, deck, rows);
  writeFileSync(outPath, md);
  console.log(`\n  📄 Full report: ${outPath}`);

  // Exit non-zero only when there are MISSING references — unused is
  // informational. Mirrors the build-time asset check semantics.
  return counts.missing === 0 ? 0 : 2;
}

process.exit(main());
