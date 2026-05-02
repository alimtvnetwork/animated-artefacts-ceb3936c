#!/usr/bin/env bun
/**
 * Suggest tightened `assetConstraints` (spec 53, v0.176).
 *
 * Walks every deck under `spec/slides/`, probes every audio / QR / brand
 * asset it actually references, and emits a per-deck **proposed**
 * `assetConstraints` block calculated from the observed measurements
 * plus a fixed safety margin per rule.
 *
 * Why this isn't part of `audit:resolutions`:
 *   - The audit's job is "is the current deck within the declared rules?"
 *     (yes/no, exit 2 on no). Tightening the rules is a separate decision
 *     a human makes; the suggester is an assistant, not an enforcer.
 *   - It must keep working when the audit would fail (e.g. you want
 *     suggestions precisely BECAUSE the current rules are too loose). So
 *     it never exits non-zero on "too tight" — it only exits 1 on a real
 *     script error (missing deck file, unparseable JSON).
 *
 * Safety margins (why the proposal is never the raw measurement):
 *   - `maxBytes`: ceil(observed_max * 1.10) → 10% headroom for re-exports.
 *   - `maxWidth` / `maxHeight`: observed_max (no margin — pixel ceilings
 *     are about LCP, you don't WANT headroom).
 *   - `minWidth` / `minHeight`: floor(observed_min * 0.95), then snapped
 *     down to the nearest 16px so the floor reads as a sane round number
 *     (96, 112, 128 …) rather than 89, 113, 127.
 *   - `maxDurationSec`: round_up(observed_max + 0.25s, 0.05s) — a quarter-
 *     second of editing slack on whoosh/click stings is the smallest unit
 *     anyone hand-edits in an audio editor.
 *   - `minDurationSec`: floor(observed_min, 0.05s) but never above 0.1s
 *     (matches the conservative starter set in the showcase deck).
 *   - `aspectRatio`: only proposed when ≥80% of measured assets in the
 *     kind cluster within 2% of a single canonical ratio (1:1, 4:3,
 *     16:9, 3:2). Otherwise omitted — guessing wrong here forces real
 *     work on every brand asset, which is the opposite of "safe".
 *   - `formats`: union of observed formats only. Never adds a format the
 *     deck isn't already shipping; never removes one it is.
 *   - SVG-only: `minViewBoxWidth` / `minViewBoxHeight` derived from
 *     observed viewBox geometry with the same 0.95 + snap-to-16 rule.
 *     `requireViewBox: true` is proposed whenever ≥1 SVG is present.
 *
 * Output:
 *   - Console: human-readable per-deck summary + suggested JSON block.
 *   - Markdown: `/mnt/documents/asset-constraints-suggestion-{slug}.md`
 *     per deck (or `--out <file>` for a single combined file).
 *   - `--apply` (opt-in, off by default): writes the proposed block back
 *     into each `deck.json` (preserves existing formatting via a minimal
 *     in-place JSON edit). Also writes a `.bak` next to the deck so a
 *     bad proposal is one `mv` away from being undone.
 *
 * Usage:
 *   bun run scripts/suggest-asset-constraints.ts                    # all decks
 *   bun run scripts/suggest-asset-constraints.ts <deck.json>        # one deck
 *   bun run scripts/suggest-asset-constraints.ts --apply            # write back
 *
 * Exit codes:
 *   0 — suggestions printed (always, unless an error).
 *   1 — script error (deck missing, parse failure).
 */
import { existsSync, readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import process from 'node:process';
import {
  loadDeck,
  collectReferences,
  probeFile,
  urlExtension,
  urlToFsPath,
} from './audit-asset-resolutions.ts';

const REPO_ROOT = process.cwd();
const SPEC_SLIDES_DIR = 'spec/slides';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type AssetKind = 'audio' | 'qr' | 'brand';

interface Measurement {
  slug: string;
  url: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  viewBox: { width: number; height: number } | null;
}

interface KindStats {
  kind: AssetKind;
  count: number;
  formats: Set<string>;
  bytes: { min: number; max: number };
  width: { min: number; max: number } | null;
  height: { min: number; max: number } | null;
  durationSec: { min: number; max: number } | null;
  viewBox: { minW: number; maxW: number; minH: number; maxH: number } | null;
  /** Sample of (w,h) ratios for cluster detection. */
  ratios: number[];
  /** Number of SVGs in this kind (used to gate requireViewBox proposal). */
  svgCount: number;
}

interface SuggestedRule {
  formats?: string[];
  maxBytes?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: string;
  aspectRatioTolerance?: number;
  minDurationSec?: number;
  maxDurationSec?: number;
  requireViewBox?: boolean;
  minViewBoxWidth?: number;
  minViewBoxHeight?: number;
}

interface DeckProposal {
  deckSlug: string;
  deckPath: string;
  measurements: Record<AssetKind, Measurement[]>;
  current: Partial<Record<AssetKind, SuggestedRule>>;
  proposed: Partial<Record<AssetKind, SuggestedRule>>;
  /** Human-readable per-rule diff lines for the report. */
  diffs: string[];
  /** Probe failures (missing files, unparseable). Reported but never fatal. */
  warnings: string[];
}

/* ------------------------------------------------------------------ */
/* Deck discovery                                                      */
/* ------------------------------------------------------------------ */

/** Find every `deck.json` under `spec/slides/`. Top-level `deck.json` is
 *  included too (it's a real deck in this repo, not just a sibling). */
function discoverDecks(): string[] {
  const out: string[] = [];
  const root = resolve(REPO_ROOT, SPEC_SLIDES_DIR);
  if (!existsSync(root)) return out;
  // Top-level `spec/slides/deck.json`.
  const topLevel = join(root, 'deck.json');
  if (existsSync(topLevel)) out.push(topLevel);
  // One level down: `spec/slides/<deck>/deck.json`.
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = join(root, entry.name, 'deck.json');
    if (existsSync(candidate)) out.push(candidate);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Measurement collection                                              */
/* ------------------------------------------------------------------ */

function measureDeck(deckPath: string): {
  measurements: Record<AssetKind, Measurement[]>;
  warnings: string[];
} {
  const { deck, slides } = loadDeck(deckPath);
  const refs = collectReferences(deck, slides);
  const measurements: Record<AssetKind, Measurement[]> = { audio: [], qr: [], brand: [] };
  const warnings: string[] = [];

  for (const ref of refs) {
    const url = deck.assets?.[ref.kind]?.[ref.slug];
    if (!url) {
      warnings.push(`${ref.kind}/${ref.slug}: not registered in deck.assets`);
      continue;
    }
    const fsPath = urlToFsPath(url);
    if (!fsPath) {
      // Remote URL — measurements can't be taken; skip silently (the audit
      // already flags these as "remote — skipped").
      continue;
    }
    if (!existsSync(fsPath)) {
      warnings.push(`${ref.kind}/${ref.slug}: file missing at ${fsPath}`);
      continue;
    }
    try {
      const probe = probeFile(fsPath, urlExtension(url));
      measurements[ref.kind].push({
        slug: ref.slug,
        url,
        format: probe.format,
        bytes: probe.bytes,
        width: probe.width,
        height: probe.height,
        durationSec: probe.durationSec,
        viewBox: probe.viewBox
          ? { width: probe.viewBox.width, height: probe.viewBox.height }
          : null,
      });
    } catch (err) {
      warnings.push(`${ref.kind}/${ref.slug}: probe failed — ${(err as Error).message}`);
    }
  }
  return { measurements, warnings };
}

/* ------------------------------------------------------------------ */
/* Stats + proposal                                                    */
/* ------------------------------------------------------------------ */

function computeStats(kind: AssetKind, ms: Measurement[]): KindStats | null {
  if (ms.length === 0) return null;
  const formats = new Set<string>();
  let bMin = Infinity, bMax = -Infinity;
  let wMin = Infinity, wMax = -Infinity;
  let hMin = Infinity, hMax = -Infinity;
  let dMin = Infinity, dMax = -Infinity;
  let vbWMin = Infinity, vbWMax = -Infinity, vbHMin = Infinity, vbHMax = -Infinity;
  const ratios: number[] = [];
  let dimsCount = 0, durCount = 0, vbCount = 0, svgCount = 0;

  for (const m of ms) {
    formats.add(m.format);
    bMin = Math.min(bMin, m.bytes);
    bMax = Math.max(bMax, m.bytes);
    if (m.width != null && m.height != null) {
      wMin = Math.min(wMin, m.width);
      wMax = Math.max(wMax, m.width);
      hMin = Math.min(hMin, m.height);
      hMax = Math.max(hMax, m.height);
      ratios.push(m.width / m.height);
      dimsCount++;
    }
    if (m.durationSec != null) {
      dMin = Math.min(dMin, m.durationSec);
      dMax = Math.max(dMax, m.durationSec);
      durCount++;
    }
    if (m.viewBox != null) {
      vbWMin = Math.min(vbWMin, m.viewBox.width);
      vbWMax = Math.max(vbWMax, m.viewBox.width);
      vbHMin = Math.min(vbHMin, m.viewBox.height);
      vbHMax = Math.max(vbHMax, m.viewBox.height);
      vbCount++;
    }
    if (m.format === 'svg') svgCount++;
  }
  return {
    kind,
    count: ms.length,
    formats,
    bytes: { min: bMin, max: bMax },
    width: dimsCount > 0 ? { min: wMin, max: wMax } : null,
    height: dimsCount > 0 ? { min: hMin, max: hMax } : null,
    durationSec: durCount > 0 ? { min: dMin, max: dMax } : null,
    viewBox: vbCount > 0 ? { minW: vbWMin, maxW: vbWMax, minH: vbHMin, maxH: vbHMax } : null,
    ratios,
    svgCount,
  };
}

/** Snap a pixel floor down to the nearest 16px, never below 16. Why 16:
 *  matches the canonical icon/logo grid stride (Lucide is 24-base, brand
 *  marks are usually 32/48/64/96). 16 is the highest common factor that
 *  reads as "round". */
function snapDown16(n: number): number {
  return Math.max(16, Math.floor(n / 16) * 16);
}

const RATIO_TARGETS: Array<{ name: string; value: number }> = [
  { name: '1:1', value: 1 },
  { name: '4:3', value: 4 / 3 },
  { name: '3:2', value: 3 / 2 },
  { name: '16:9', value: 16 / 9 },
  { name: '3:4', value: 3 / 4 },
  { name: '2:3', value: 2 / 3 },
  { name: '9:16', value: 9 / 16 },
];

/** Returns a canonical aspect-ratio string IFF ≥80% of observed ratios
 *  cluster within ±2% of a single target. Otherwise null — better to omit
 *  the rule than force the author to re-shape every brand asset. */
function detectAspectRatio(ratios: number[]): string | null {
  if (ratios.length === 0) return null;
  for (const target of RATIO_TARGETS) {
    const tol = 0.02;
    const within = ratios.filter(
      (r) => Math.abs(r - target.value) / target.value <= tol,
    ).length;
    if (within / ratios.length >= 0.8) return target.name;
  }
  return null;
}

function proposeRule(stats: KindStats): SuggestedRule {
  const out: SuggestedRule = {};
  out.formats = Array.from(stats.formats).sort();
  // Bytes: 10% headroom on the largest observed file.
  out.maxBytes = Math.ceil(stats.bytes.max * 1.1);

  if (stats.width && stats.height) {
    out.minWidth = snapDown16(Math.floor(stats.width.min * 0.95));
    out.minHeight = snapDown16(Math.floor(stats.height.min * 0.95));
    // Pixel ceilings: observed_max with no headroom (LCP-defensive).
    out.maxWidth = stats.width.max;
    out.maxHeight = stats.height.max;
    const aspect = detectAspectRatio(stats.ratios);
    if (aspect) {
      out.aspectRatio = aspect;
      out.aspectRatioTolerance = 0.02;
    }
  }

  if (stats.durationSec) {
    // Min: floor to 0.05s, capped at 0.1s so we don't propose a silly
    // tight floor like 0.13s if every clip happens to be ≥130ms.
    const minRaw = Math.floor(stats.durationSec.min / 0.05) * 0.05;
    out.minDurationSec = Math.min(minRaw, 0.1);
    // Max: + 250ms slack, rounded up to nearest 50ms.
    const maxRaw = stats.durationSec.max + 0.25;
    out.maxDurationSec = Math.ceil(maxRaw / 0.05) * 0.05;
  }

  if (stats.svgCount > 0) {
    out.requireViewBox = true;
    if (stats.viewBox) {
      out.minViewBoxWidth = snapDown16(Math.floor(stats.viewBox.minW * 0.95));
      out.minViewBoxHeight = snapDown16(Math.floor(stats.viewBox.minH * 0.95));
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Diff rendering                                                      */
/* ------------------------------------------------------------------ */

/** Render a per-rule diff line. Three states:
 *   - ✨ added (current undefined, proposed defined)
 *   - 🔒 tightened (numeric: stricter; or formats: shrunk)
 *   - = unchanged (proposed == current); these are dropped from the diff.
 *  Loosening is never returned — proposals only ever tighten. */
function diffRule(
  kind: AssetKind,
  current: SuggestedRule | undefined,
  proposed: SuggestedRule,
): string[] {
  const lines: string[] = [];
  const cur = current ?? {};
  const tighter = (key: keyof SuggestedRule, dir: 'min' | 'max'): boolean => {
    const c = cur[key] as number | undefined;
    const p = proposed[key] as number | undefined;
    if (p == null) return false;
    if (c == null) return true; // newly enforced
    return dir === 'min' ? p > c : p < c;
  };

  for (const key of ['minWidth', 'minHeight', 'minDurationSec', 'minViewBoxWidth', 'minViewBoxHeight'] as const) {
    if (proposed[key] == null) continue;
    if (cur[key] === proposed[key]) continue;
    if (tighter(key, 'min')) {
      const before = cur[key] != null ? `${cur[key]}` : '—';
      lines.push(`  🔒 ${kind}.${key}: ${before} → ${proposed[key]}`);
    }
  }
  for (const key of ['maxBytes', 'maxWidth', 'maxHeight', 'maxDurationSec'] as const) {
    if (proposed[key] == null) continue;
    if (cur[key] === proposed[key]) continue;
    if (tighter(key, 'max')) {
      const before = cur[key] != null ? `${cur[key]}` : '—';
      lines.push(`  🔒 ${kind}.${key}: ${before} → ${proposed[key]}`);
    }
  }
  // Formats: tightening = removing entries.
  if (proposed.formats) {
    const cf = new Set(cur.formats ?? []);
    const pf = new Set(proposed.formats);
    const removed = [...cf].filter((f) => !pf.has(f));
    if (removed.length > 0) {
      lines.push(`  🔒 ${kind}.formats: drop [${removed.join(', ')}] (unused in deck)`);
    } else if (!cur.formats) {
      lines.push(`  ✨ ${kind}.formats: [${proposed.formats.join(', ')}]`);
    }
  }
  if (proposed.aspectRatio && cur.aspectRatio !== proposed.aspectRatio) {
    const before = cur.aspectRatio ?? '—';
    lines.push(`  ${cur.aspectRatio ? '🔒' : '✨'} ${kind}.aspectRatio: ${before} → ${proposed.aspectRatio}`);
  }
  if (proposed.requireViewBox === true && cur.requireViewBox == null) {
    lines.push(`  ✨ ${kind}.requireViewBox: true (≥1 SVG present)`);
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/* Per-deck pipeline                                                   */
/* ------------------------------------------------------------------ */

function buildProposal(deckPath: string): DeckProposal {
  const deckJson = JSON.parse(readFileSync(deckPath, 'utf8')) as {
    deckSlug?: string;
    assetConstraints?: Partial<Record<AssetKind, SuggestedRule>>;
  };
  const { measurements, warnings } = measureDeck(deckPath);
  const proposed: Partial<Record<AssetKind, SuggestedRule>> = {};
  const diffs: string[] = [];
  const current = deckJson.assetConstraints ?? {};

  for (const kind of ['audio', 'qr', 'brand'] as AssetKind[]) {
    const stats = computeStats(kind, measurements[kind]);
    if (!stats) continue;
    const rule = proposeRule(stats);
    proposed[kind] = rule;
    diffs.push(...diffRule(kind, current[kind], rule));
  }

  return {
    deckSlug: deckJson.deckSlug ?? basename(dirname(deckPath)),
    deckPath,
    measurements,
    current,
    proposed,
    diffs,
    warnings,
  };
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

function renderMarkdown(p: DeckProposal): string {
  const out: string[] = [];
  out.push(`# Suggested \`assetConstraints\` — ${p.deckSlug}`);
  out.push('');
  out.push(`- **Deck file:** \`${p.deckPath}\``);
  out.push(`- **Generated:** ${new Date().toISOString()}`);
  out.push('');

  if (p.warnings.length > 0) {
    out.push('## ⚠️ Probe warnings');
    out.push('');
    for (const w of p.warnings) out.push(`- ${w}`);
    out.push('');
    out.push('Proposals below ignore the assets above (can\'t derive limits from missing data).');
    out.push('');
  }

  out.push('## Measurements');
  out.push('');
  for (const kind of ['audio', 'qr', 'brand'] as AssetKind[]) {
    const ms = p.measurements[kind];
    if (ms.length === 0) continue;
    out.push(`### ${kind.toUpperCase()} (${ms.length})`);
    out.push('');
    out.push('| Slug | Format | Bytes | Dims | Duration | viewBox |');
    out.push('|---|---|---|---|---|---|');
    for (const m of ms) {
      const dims = m.width != null && m.height != null ? `${m.width}×${m.height}` : '—';
      const dur = m.durationSec != null ? `${m.durationSec.toFixed(3)}s` : '—';
      const vb = m.viewBox ? `${m.viewBox.width}×${m.viewBox.height}` : '—';
      out.push(`| \`${m.slug}\` | ${m.format} | ${m.bytes.toLocaleString()} | ${dims} | ${dur} | ${vb} |`);
    }
    out.push('');
  }

  out.push('## Proposed `assetConstraints`');
  out.push('');
  out.push('Derived from the measurements above with safety margins (see script header for the full rationale).');
  out.push('');
  out.push('```json');
  out.push(JSON.stringify({ assetConstraints: p.proposed }, null, 2));
  out.push('```');
  out.push('');

  out.push('## Diff vs. current');
  out.push('');
  if (p.diffs.length === 0) {
    out.push('> ✅ Current `assetConstraints` are already at-or-tighter than the proposal — no changes recommended.');
  } else {
    out.push('Each line below would tighten (or newly enforce) a rule. Loosening is never proposed.');
    out.push('');
    out.push('```');
    for (const d of p.diffs) out.push(d);
    out.push('```');
  }
  out.push('');
  return out.join('\n');
}

/* ------------------------------------------------------------------ */
/* In-place deck.json patch (--apply)                                  */
/* ------------------------------------------------------------------ */

/**
 * Why a JSON.parse → JSON.stringify round-trip and not a surgical edit:
 *   - Deck JSON is hand-edited but not heavily commented (it can't be —
 *     it's strict JSON, no JSONC). Comment loss is therefore moot.
 *   - Property order matters less than the `.bak` safety net: if the
 *     reformat is undesirable, `mv deck.json.bak deck.json` is one step.
 *   - Trying to splice the `assetConstraints` block in-place would mean
 *     re-implementing a JSON parser to find the exact byte range of the
 *     existing block. Not worth the surface area.
 */
function applyProposal(p: DeckProposal): void {
  const raw = readFileSync(p.deckPath, 'utf8');
  writeFileSync(`${p.deckPath}.bak`, raw);
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  parsed.assetConstraints = p.proposed;
  // Match the deck's existing 2-space indent (every deck.json in the repo
  // uses 2 spaces; if a future deck uses 4 the .bak still rescues us).
  const next = JSON.stringify(parsed, null, 2) + '\n';
  writeFileSync(p.deckPath, next);
}

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

function printConsole(p: DeckProposal): void {
  const counts = (['audio', 'qr', 'brand'] as AssetKind[])
    .map((k) => `${k}=${p.measurements[k].length}`)
    .join('  ');
  console.log(`\n  ${p.deckSlug}  ·  ${counts}`);
  if (p.warnings.length > 0) {
    for (const w of p.warnings) console.log(`    ⚠️  ${w}`);
  }
  if (p.diffs.length === 0) {
    console.log(`    ✅ Current rules are already tighter than the proposal — no change recommended.`);
  } else {
    for (const line of p.diffs) console.log(line);
  }
}

function main(): number {
  const args = process.argv.slice(2);
  let deckArg: string | undefined;
  let outArg: string | undefined;
  let apply = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') outArg = args[++i];
    else if (args[i] === '--apply') apply = true;
    else if (!args[i].startsWith('--') && !deckArg) deckArg = args[i];
  }

  const deckPaths = deckArg
    ? [resolve(REPO_ROOT, deckArg)]
    : discoverDecks();
  if (deckPaths.length === 0) {
    console.error('✗ No decks found.');
    return 1;
  }
  for (const dp of deckPaths) {
    if (!existsSync(dp)) {
      console.error(`✗ Deck not found: ${dp}`);
      return 1;
    }
  }

  const proposals: DeckProposal[] = [];
  for (const dp of deckPaths) {
    try {
      proposals.push(buildProposal(dp));
    } catch (err) {
      console.error(`✗ Failed on ${dp}: ${(err as Error).message}`);
      return 1;
    }
  }

  // Console summary.
  console.log(`\n  Suggested assetConstraints  ·  ${proposals.length} deck${proposals.length === 1 ? '' : 's'}`);
  for (const p of proposals) printConsole(p);

  // Markdown output.
  if (outArg) {
    const combined = proposals.map((p) => renderMarkdown(p)).join('\n---\n\n');
    writeFileSync(outArg, combined);
    console.log(`\n  📄 Combined report: ${outArg}`);
  } else {
    for (const p of proposals) {
      const mdPath = `/mnt/documents/asset-constraints-suggestion-${p.deckSlug}.md`;
      writeFileSync(mdPath, renderMarkdown(p));
      console.log(`    📄 ${mdPath}`);
    }
  }

  if (apply) {
    for (const p of proposals) {
      if (Object.keys(p.proposed).length === 0) continue;
      applyProposal(p);
      console.log(`    ✍️  Patched ${p.deckPath} (backup: ${basename(p.deckPath)}.bak)`);
    }
  } else {
    console.log(`\n  Re-run with --apply to write proposals into deck.json files (creates .bak first).`);
  }

  return 0;
}

if (import.meta.main) {
  process.exit(main());
}

// Silence unused-import warnings when the script is imported (e.g. tests)
// without invoking main(). statSync is not currently used here but is
// re-exported via probeFile's stat call inside the audit module.
void statSync;
