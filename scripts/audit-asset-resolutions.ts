#!/usr/bin/env bun
/**
 * Asset resolution + format audit (spec 53, v0.161 → v0.175).
 *
 * Walks every slide JSON in a deck, gathers each referenced audio / QR /
 * brand asset, opens the file from `public/<url>` on disk, parses its
 * format / dimensions / duration / size, and compares them to the rules
 * declared in `deck.assetConstraints[kind]`.
 *
 * Why this is its own script (not folded into `check:assets`):
 *   - `check:assets` is the cheap save-grade existence pass (statSync only).
 *   - This audit opens and parses every file — CI-grade signal, not for
 *     every keystroke.
 *
 * Why zero deps for the parsers:
 *   - We already pay for `pptxgenjs`, `qrcode`, etc. at runtime; an extra
 *     image-decode dep just for CI bytes-on-disk reading is overkill.
 *   - PNG / JPEG / WEBP / MP3 all expose dimensions and (for MP3) duration
 *     in their headers — a few hundred bytes of fread per file is enough.
 *   - Deterministic across machines: no native-binary path differences,
 *     no Sharp / libvips version drift between dev and CI.
 *
 * Usage:
 *   bun run scripts/audit-asset-resolutions.ts                                  # showcase
 *   bun run scripts/audit-asset-resolutions.ts spec/slides/<deck>/deck.json
 *   bun run scripts/audit-asset-resolutions.ts <deck> --out report.md
 *   bun run scripts/audit-asset-resolutions.ts <deck> --strict-references      # v0.174 — also flag missing referenced files
 *   bun run scripts/audit-asset-resolutions.ts <deck> --resolution-audit       # v0.187 — flag URLs that can't be resolved (shape / mime / case-drift / orphan)
 *
 * Strict-references mode (v0.174, opt-in)
 *   When `--strict-references` (or `-S`) is passed, the audit walks three
 *   distinct reference surfaces and reports any that point at a file
 *   missing from `public/`:
 *     1. `deck.assets.{audio,qr,brand}` — every declared URL.
 *     2. Slide registry references — `sound.kind`, `content.qrAsset`,
 *        `deck.meeting.qrAsset` resolved through `deck.assets`.
 *     3. Any `/`-prefixed string in any slide JSON (e.g. `content.imageAsset`,
 *        future `content.videoAsset`) — wider net, catches assets the
 *        registry doesn't formally know about.
 *   Each missing file is reported under "Missing References" with the
 *   exact JSON pointer + category, and forces exit 2 so CI fails.
 *   Without the flag, the existing format/dimension audit runs unchanged.
 *
 * SVG viewBox audit (v0.175, always-on for SVG brand assets)
 *   When a probed asset is an SVG, the audit additionally:
 *     1. Parses the root `<svg>` for `viewBox`, `width`, `height` attrs.
 *     2. Flags missing `viewBox` (`requireViewBox`, default `true` when a
 *        constraint rule exists for the kind) — without it the asset can't
 *        scale cleanly inside CSS-sized chrome (BrandHeader/BrandStrip).
 *     3. Flags `viewBox` width/height below `minViewBoxWidth`/
 *        `minViewBoxHeight` (or, when those aren't declared, the existing
 *        `minWidth`/`minHeight`) so a tiny-viewBox SVG can't sneak past
 *        the same size floor a raster brand asset would have to clear.
 *   Existing dimension rules (`minWidth`/`maxWidth`/`aspectRatio`) keep
 *   evaluating against the SVG's parsed render-intent dims.
 *
 * Exit codes mirror `scripts/asset-diagnostic.ts`:
 *   0 — no violations
 *   1 — script error (missing deck, unparseable JSON, etc.)
 *   2 — violations found (so CI can fail PRs without ambiguity)
 */
import { existsSync, readFileSync, writeFileSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import process from 'node:process';

const REPO_ROOT = process.cwd();
const DEFAULT_DECK = 'spec/slides/showcase/deck.json';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type AssetKind = 'audio' | 'qr' | 'brand';

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
  assetConstraints?: Partial<Record<AssetKind, ConstraintRule>>;
  slides?: string[];
}

interface ConstraintRule {
  formats?: string[];
  maxBytes?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** "1:1", "16:9", "W:H". */
  aspectRatio?: string;
  aspectRatioTolerance?: number;
  minDurationSec?: number;
  maxDurationSec?: number;
  /* ---- v0.175 — SVG-specific rules ---- */
  /**
   * Require an explicit `viewBox` attribute on the root `<svg>`. Defaults
   * to `true` when the rule object exists and the file is an SVG — a missing
   * viewBox makes the asset non-scalable in flex/CSS-sized containers
   * (BrandHeader/BrandStrip both size logos by CSS height), causing blurry
   * or zero-sized renders depending on browser. Set to `false` to silence.
   */
  requireViewBox?: boolean;
  /**
   * Minimum viewBox width/height (in user units). Even when CSS scales the
   * SVG up, a tiny viewBox combined with stroked geometry rounds badly at
   * presentation render sizes. Defaults: when omitted, fall back to
   * `minWidth`/`minHeight` so authors can declare one constraint and have
   * it apply to both raster and vector brand assets.
   */
  minViewBoxWidth?: number;
  minViewBoxHeight?: number;
}

interface SlideShape {
  slideNumber?: number;
  slideName?: string;
  sound?: { kind?: string };
  content?: {
    qrAsset?: string;
    [k: string]: unknown;
  };
}

interface AssetRef {
  kind: AssetKind;
  slug: string;
  /** A representative location string for the report. */
  firstReferencedAt: string;
}

interface ProbeResult {
  format: 'png' | 'jpg' | 'webp' | 'mp3' | 'svg' | 'unknown';
  /** Pixel width (raster) OR parsed render-intent width (SVG). For SVG, this
   *  is the root `width` attr if numeric, else the viewBox width. */
  width: number | null;
  height: number | null;
  /** Audio duration in seconds (mp3 only). */
  durationSec: number | null;
  bytes: number;
  /** v0.175 — SVG only. `null` when the file is non-SVG OR has no parseable
   *  viewBox. The audit treats `viewBox === null` on an SVG as a "missing
   *  viewBox" condition for `requireViewBox`. */
  viewBox: { minX: number; minY: number; width: number; height: number } | null;
  /** v0.175 — SVG only. Whether the root `<svg>` declared explicit
   *  `width`/`height` attributes (as opposed to inheriting from viewBox).
   *  Informational; surfaced in the report so authors can audit
   *  scaling-by-CSS readiness. */
  hasExplicitDims?: boolean;
}

interface Violation {
  kind: AssetKind;
  slug: string;
  url: string;
  rule: string;
  expected: string;
  actual: string;
}

/* ------------------------------------------------------------------ */
/* Deck loading                                                        */
/* ------------------------------------------------------------------ */

export function loadDeck(deckPath: string): { deck: DeckShape; slides: SlideShape[] } {
  const deck = JSON.parse(readFileSync(deckPath, 'utf8')) as DeckShape;
  const deckDir = dirname(deckPath);
  const slides: SlideShape[] = [];
  for (const id of deck.slides ?? []) {
    const slidePath = resolve(deckDir, `${id}.json`);
    if (!existsSync(slidePath)) continue;
    slides.push(JSON.parse(readFileSync(slidePath, 'utf8')) as SlideShape);
  }
  return { deck, slides };
}

/**
 * Collect every asset reference made by the deck + slides. Mirrors
 * `scripts/asset-diagnostic.ts` so the two audits agree on what's in scope.
 * Icons are intentionally omitted — they're component-registry remaps,
 * not files to probe.
 */
export function collectReferences(deck: DeckShape, slides: SlideShape[]): AssetRef[] {
  const seen = new Map<string, AssetRef>();
  const push = (kind: AssetKind, slug: string, location: string) => {
    const k = `${kind}:${slug}`;
    if (!seen.has(k)) seen.set(k, { kind, slug, firstReferencedAt: location });
  };

  if (deck.meeting?.qrAsset) {
    push('qr', deck.meeting.qrAsset, 'deck.meeting.qrAsset');
  }
  for (const slide of slides) {
    const root = `deck.slides[${slide.slideNumber}] ("${slide.slideName ?? '?'}")`;
    const c = slide.content ?? {};
    if (c.qrAsset) push('qr', c.qrAsset, `${root}.content.qrAsset`);
    const sk = slide.sound?.kind;
    if (sk && sk !== 'pop') push('audio', sk, `${root}.sound.kind`);
  }
  // Every brand asset declared in the deck — they're consumed by chrome
  // (BrandHeader/BrandStrip) on every slide, so any declared brand entry
  // is implicitly referenced. Probing them all matches user expectation
  // ("audit ALL brand assets, not just ones a slide names directly").
  for (const slug of Object.keys(deck.assets?.brand ?? {})) {
    push('brand', slug, 'deck.assets.brand (chrome-wide)');
  }
  return Array.from(seen.values()).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.slug.localeCompare(b.slug);
  });
}

/* ------------------------------------------------------------------ */
/* Strict-references collection (v0.174 opt-in)                        */
/* ------------------------------------------------------------------ */

/**
 * One row of the strict-references missing-file report.
 *
 * `category` records WHICH of the three reference surfaces flagged the
 * file so the report can group them. `deckJsonPath` is the precise
 * pointer the author needs to grep for in their deck/slide JSON.
 */
interface MissingReference {
  category: 'declared' | 'registry' | 'slide-path';
  url: string;
  deckJsonPath: string;
  /** Optional kind hint when we know it (declared / registry references). */
  kind?: AssetKind;
  /** Optional slug hint when we know it. */
  slug?: string;
}

/**
 * Walk every `/`-prefixed string in a slide JSON value and yield
 * `{ value, path }` pairs. Catches `content.imageAsset`, future
 * `content.videoAsset`, and ad-hoc raw URL refs the registry doesn't
 * formally know about.
 *
 * Why we don't extend `collectReferences` to cover this: it's a much
 * wider net (any string that LOOKS like a public path) and we only want
 * to scan it under `--strict-references`. Keeping the wider scan in its
 * own walker means the default audit's surface stays unchanged.
 */
function* walkPublicPaths(
  node: unknown,
  path: string,
): Generator<{ value: string; path: string }> {
  if (node == null) return;
  if (typeof node === 'string') {
    // `/`-prefixed only — relative paths and remote URLs are NOT in scope.
    // We also exclude `//` (protocol-relative) and `/?…` style strings
    // because those aren't asset references.
    if (node.length > 1 && node.startsWith('/') && !node.startsWith('//')) {
      yield { value: node, path };
    }
    return;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      yield* walkPublicPaths(node[i], `${path}[${i}]`);
    }
    return;
  }
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      yield* walkPublicPaths(v, `${path}.${k}`);
    }
  }
}

/**
 * Collect every reference, from all three surfaces, whose `public/<url>`
 * doesn't exist on disk. Dedupes by URL across categories so a single
 * missing file isn't reported three times.
 *
 * Order of preference when the same URL appears in multiple categories:
 *   declared > registry > slide-path. The most specific origin wins so
 *   the "fix this" pointer in the report is the most actionable one.
 */
export function collectMissingReferences(
  deck: DeckShape,
  slides: SlideShape[],
): MissingReference[] {
  const byUrl = new Map<string, MissingReference>();
  const order: Record<MissingReference['category'], number> = {
    declared: 0, registry: 1, 'slide-path': 2,
  };
  const consider = (entry: MissingReference): void => {
    const fsPath = urlToFsPath(entry.url);
    if (!fsPath) return; // remote / non-`/` — not an in-repo file.
    if (existsSync(fsPath)) return;
    const prev = byUrl.get(entry.url);
    if (!prev || order[entry.category] < order[prev.category]) byUrl.set(entry.url, entry);
  };

  // 1. Declared in deck.assets — every URL the registry exposes.
  for (const kind of ['audio', 'qr', 'brand'] as const) {
    const block = deck.assets?.[kind];
    if (!block) continue;
    for (const [slug, url] of Object.entries(block)) {
      if (typeof url !== 'string' || url.length === 0) continue;
      consider({
        category: 'declared',
        url,
        kind,
        slug,
        deckJsonPath: `deck.assets.${kind}.${slug}`,
      });
    }
  }

  // 2. Slide registry references — slugs resolved through deck.assets.
  //    A slug that fails to resolve at all is already reported via the
  //    legacy probeError path; here we focus on URLs that DO resolve but
  //    point at a missing file. Reporting them here too means the
  //    "Missing References" section is the single place to look in
  //    strict mode.
  const registryHits: Array<{ kind: AssetKind; slug: string; deckJsonPath: string }> = [];
  if (deck.meeting?.qrAsset) {
    registryHits.push({
      kind: 'qr', slug: deck.meeting.qrAsset, deckJsonPath: 'deck.meeting.qrAsset',
    });
  }
  for (const slide of slides) {
    const root = `deck.slides[${slide.slideNumber}] ("${slide.slideName ?? '?'}")`;
    if (slide.content?.qrAsset) {
      registryHits.push({
        kind: 'qr', slug: slide.content.qrAsset, deckJsonPath: `${root}.content.qrAsset`,
      });
    }
    const sk = slide.sound?.kind;
    if (sk && sk !== 'pop') {
      registryHits.push({
        kind: 'audio', slug: sk, deckJsonPath: `${root}.sound.kind`,
      });
    }
  }
  for (const hit of registryHits) {
    const url = deck.assets?.[hit.kind]?.[hit.slug];
    if (!url) continue; // unregistered slug — caught by existing probeError flow.
    consider({
      category: 'registry',
      url,
      kind: hit.kind,
      slug: hit.slug,
      deckJsonPath: hit.deckJsonPath,
    });
  }

  // 3. Any `/`-prefixed string in any slide JSON.
  for (const slide of slides) {
    const root = `deck.slides[${slide.slideNumber}] ("${slide.slideName ?? '?'}")`;
    for (const hit of walkPublicPaths(slide, root)) {
      consider({ category: 'slide-path', url: hit.value, deckJsonPath: hit.path });
    }
  }

  return Array.from(byUrl.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.url.localeCompare(b.url);
  });
}

/* ------------------------------------------------------------------ */
/* Resolution-audit collectors (v0.187 — `--resolution-audit`)         */
/* ------------------------------------------------------------------ */
/**
 * Why this is its own pass (not folded into strict-references):
 *   strict-references answers "does the file exist on disk?".
 *   resolution-audit answers "is this URL even resolvable?" — a wider
 *   class of failures that fire BEFORE existence matters:
 *
 *     1. shape       — URL is malformed (empty, traversal, backslash,
 *                      not /-prefixed, escapes /public, missing extension).
 *                      Caught synchronously, no I/O.
 *     2. mime        — File exists but its sniffed magic-bytes format
 *                      disagrees with the URL extension. Catches the
 *                      classic "Vite SPA fallback returned index.html"
 *                      and the .png-but-actually-jpg upload mistake.
 *     3. case-drift  — File exists at the cased path AND at a lowercased
 *                      basename — works on macOS dev (case-insensitive)
 *                      but the lowercase path will resolve in production
 *                      on Linux even though the author wrote the cased
 *                      one. Reported when basename has any uppercase
 *                      letter and a sibling lowercased file exists.
 *     4. orphan      — File present in `public/assets/brand|sounds`
 *                      that no slide/deck references, OR a slide/deck
 *                      references an asset URL that resolves but lives
 *                      outside the active deck's known directories
 *                      (cross-deck reference).
 *
 * Exit treatment: every finding bumps exit code to 2 so CI fails. The
 * shape + mime classes are hard errors. case-drift and orphan are
 * informational by default but still bump exit when --resolution-audit
 * is on, because the user asked for a strict pass.
 */

type ResolutionFindingClass = 'shape' | 'mime' | 'case-drift' | 'orphan';

/**
 * v0.189 — per-class severity. `off` drops the finding entirely (it
 * doesn't appear in the report or exports), `warn` reports it but does
 * NOT bump exit code, `error` reports AND bumps exit to 2 so CI fails.
 *
 * Defaults reflect spec 53 intent:
 *   shape / mime  → error  (hard correctness bugs — broken paths or
 *                          extension lying about format)
 *   case-drift    → warn   (works on macOS dev, breaks on Linux prod —
 *                          want visibility but some teams ship on macOS
 *                          servers and don't care)
 *   orphan        → warn   (unreferenced files / cross-deck refs — common
 *                          during refactors, shouldn't block PRs by default)
 *
 * Override per-class via `--severity shape=warn,case-drift=error,orphan=off`
 * or shorthand `--severity-shape error` (both forms compose).
 */
export type Severity = 'error' | 'warn' | 'off';

export type SeverityMap = Record<ResolutionFindingClass, Severity>;

export const DEFAULT_SEVERITY: SeverityMap = {
  shape: 'error',
  mime: 'error',
  'case-drift': 'warn',
  orphan: 'warn',
};

interface ResolutionFinding {
  class: ResolutionFindingClass;
  url: string;
  deckJsonPath: string;
  /** Human-readable reason; surfaced in console + report verbatim. */
  reason: string;
  /** Optional remediation hint. */
  hint?: string;
  kind?: AssetKind;
  slug?: string;
}

/**
 * Parse a `--severity` value like `shape=error,mime=warn,orphan=off`.
 * Throws on unknown class names or unknown severity levels — better to
 * fail loudly than silently apply a default the author didn't ask for.
 */
export function parseSeverityArg(value: string, base: SeverityMap = DEFAULT_SEVERITY): SeverityMap {
  const out: SeverityMap = { ...base };
  const validClasses: ResolutionFindingClass[] = ['shape', 'mime', 'case-drift', 'orphan'];
  const validLevels: Severity[] = ['error', 'warn', 'off'];
  for (const part of value.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) {
      throw new Error(`--severity entry "${trimmed}" must be of the form class=level (e.g. shape=warn)`);
    }
    const cls = trimmed.slice(0, eq).trim() as ResolutionFindingClass;
    const lvl = trimmed.slice(eq + 1).trim() as Severity;
    if (!validClasses.includes(cls)) {
      throw new Error(`--severity unknown class "${cls}" (expected one of: ${validClasses.join(', ')})`);
    }
    if (!validLevels.includes(lvl)) {
      throw new Error(`--severity unknown level "${lvl}" for class "${cls}" (expected one of: ${validLevels.join(', ')})`);
    }
    out[cls] = lvl;
  }
  return out;
}


/**
 * Validate a URL string against the path-shape rules. Pure / synchronous —
 * no I/O. Returns one finding per distinct shape problem so a single
 * mangled URL can list every reason it's broken.
 */
export function detectShapeProblems(url: string, deckJsonPath: string): ResolutionFinding[] {
  const out: ResolutionFinding[] = [];
  const push = (reason: string, hint?: string): void => {
    out.push({ class: 'shape', url, deckJsonPath, reason, hint });
  };
  // Remote URLs are out of scope for shape checks (CORS-opaque, no /public mapping).
  if (url.startsWith('http://') || url.startsWith('https://')) return out;
  if (url.length === 0) {
    push('URL is empty');
    return out;
  }
  if (/^\s|\s$/.test(url)) {
    push('URL has leading or trailing whitespace', 'Trim the value in deck.assets / slide JSON');
  }
  if (url.includes('\\')) {
    push('URL contains a backslash', 'Use forward slashes only — backslashes break on Linux');
  }
  if (url.startsWith('//')) {
    push('URL is protocol-relative (`//host/...`)', 'Public-asset paths must start with a single `/`');
  } else if (!url.startsWith('/')) {
    push('URL is not absolute (missing leading `/`)', 'Prefix with `/` — relative paths resolve differently between dev and production');
  }
  // Normalise for traversal/extension checks. Drop query + hash.
  const clean = url.split('#')[0].split('?')[0];
  if (clean.includes('/../') || clean.endsWith('/..') || clean.startsWith('../')) {
    push('URL contains a `..` traversal segment', 'Rewrite the path so it stays inside `/public`');
  }
  // Everything reachable from `public/` is fine. Reject explicit `/src`
  // or `/node_modules` prefixes — those are bundler-internal and won't
  // resolve at runtime.
  if (/^\/(src|node_modules|spec)\//.test(clean)) {
    push(
      `URL points outside \`/public\` (\`${clean.split('/')[1]}/\`)`,
      'Move the file under `public/` or import it as an ES module asset',
    );
  }
  // Missing extension on the basename. We allow trailing slashes (rare,
  // but a directory reference might be intentional in some routing setups).
  const base = clean.endsWith('/') ? '' : clean.slice(clean.lastIndexOf('/') + 1);
  if (base && !/\.[a-z0-9]+$/i.test(base)) {
    push('URL has no file extension', 'Append the file extension so MIME detection and runtime probes can disambiguate');
  }
  return out;
}

/**
 * MIME / extension mismatch. Compares sniffed magic-bytes format
 * against the URL's extension. Skips files we can't sniff (svg, ico,
 * unknown extensions) and files that don't exist (existence is the
 * strict-references job). Returns a finding only when both sides have
 * a definite, conflicting answer.
 */
export function detectMimeMismatch(
  url: string,
  fsPath: string,
  deckJsonPath: string,
  ref?: { kind: AssetKind; slug: string },
): ResolutionFinding | null {
  const ext = urlExtension(url);
  if (!ext) return null;
  if (!existsSync(fsPath)) return null;
  let probe: ProbeResult;
  try {
    probe = probeFile(fsPath, ext);
  } catch {
    return null;
  }
  if (probe.format === 'unknown') return null;
  // SVG sniffing relies on extension already, so a "svg" probe of a non-
  // svg file would be a false positive — only flag raster/audio mismatches.
  if (probe.format === 'svg') return null;
  if (probe.format === ext) return null;
  // Treat jpg/jpeg as identical (urlExtension already normalises jpeg→jpg).
  return {
    class: 'mime',
    url,
    deckJsonPath,
    kind: ref?.kind,
    slug: ref?.slug,
    reason: `URL extension is \`.${ext}\` but file's magic bytes say \`${probe.format}\``,
    hint: `Rename the file to \`.${probe.format}\` or re-encode it as \`.${ext}\``,
  };
}

/**
 * Case-drift detector. macOS / Windows dev filesystems are case-
 * insensitive; Linux production is not. If a referenced URL has any
 * uppercase letter in its basename AND the on-disk filename's casing
 * doesn't match exactly, the URL "works" locally but 404s in
 * production. We detect this by reading the directory and looking for
 * the basename with case-sensitive comparison.
 */
export function detectCaseDrift(
  url: string,
  deckJsonPath: string,
  ref?: { kind: AssetKind; slug: string },
  repoRoot: string = REPO_ROOT,
): ResolutionFinding | null {
  // Resolve against the supplied repo root rather than the module-level
  // capture so tests (and any future programmatic caller) can audit a
  // synthetic tree without chdir'ing.
  if (url.startsWith('http://') || url.startsWith('https://')) return null;
  if (!url.startsWith('/')) return null;
  const fsPath = resolve(repoRoot, 'public' + url.split('?')[0].split('#')[0]);
  const dir = dirname(fsPath);
  const wanted = basename(fsPath);
  // Skip when the basename has no uppercase — exact-match is guaranteed.
  if (wanted === wanted.toLowerCase()) return null;
  let entries: string[];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    entries = (require('node:fs') as typeof import('node:fs')).readdirSync(dir);
  } catch {
    return null;
  }
  if (entries.includes(wanted)) return null; // exact match — fine.
  const ciHit = entries.find((e) => e.toLowerCase() === wanted.toLowerCase());
  if (!ciHit) return null; // no match at all — caught by missing-references pass.
  return {
    class: 'case-drift',
    url,
    deckJsonPath,
    kind: ref?.kind,
    slug: ref?.slug,
    reason: `URL references \`${wanted}\` but on-disk filename is \`${ciHit}\``,
    hint: 'Rename the file or update the URL — Linux production is case-sensitive',
  };
}

/**
 * Orphan + cross-deck audit. Walks `public/assets/brand`, `public/sounds`,
 * and `public/assets` for raster files, then subtracts the set of
 * `urlToFsPath`-resolved references the deck declares. Anything left is
 * an orphan upload (uploaded but never referenced).
 *
 * "Cross-deck" overlap is detected when a referenced URL lives under a
 * sibling deck's namespaced directory — e.g. the showcase deck pointing
 * at `/assets/brand/<other-deck>/logo.png`. We approximate this by
 * flagging any `/assets/<top>/` segment that does NOT match the deck's
 * own slug when the directory tree clearly uses per-deck namespacing.
 * Conservative: only fires when at least one sibling directory exists
 * that matches another known deck slug under spec/slides/.
 */
export function collectResolutionFindings(
  deck: DeckShape,
  slides: SlideShape[],
  opts: { repoRoot: string; otherDeckSlugs: string[] },
): ResolutionFinding[] {
  const findings: ResolutionFinding[] = [];
  const referencedUrls = new Set<string>();

  // 1. Shape + mime + case-drift on every declared URL.
  for (const kind of ['audio', 'qr', 'brand'] as const) {
    const block = deck.assets?.[kind];
    if (!block) continue;
    for (const [slug, url] of Object.entries(block)) {
      if (typeof url !== 'string') continue;
      const where = `deck.assets.${kind}.${slug}`;
      referencedUrls.add(url);
      findings.push(...detectShapeProblems(url, where));
      const fsPath = urlToFsPath(url);
      if (fsPath) {
        const mime = detectMimeMismatch(url, fsPath, where, { kind, slug });
        if (mime) findings.push(mime);
        const drift = detectCaseDrift(url, where, { kind, slug }, opts.repoRoot);
        if (drift) findings.push(drift);
      }
    }
  }

  // 2. Shape on every `/`-prefixed slide-JSON path. (mime/case checked
  //    via the declared block above — slide paths typically resolve
  //    through deck.assets, so re-running them would dupe findings.)
  for (const slide of slides) {
    const root = `deck.slides[${slide.slideNumber}] ("${slide.slideName ?? '?'}")`;
    for (const hit of walkPublicPaths(slide, root)) {
      referencedUrls.add(hit.value);
      findings.push(...detectShapeProblems(hit.value, hit.path));
      const fsPath = urlToFsPath(hit.value);
      if (fsPath) {
        const drift = detectCaseDrift(hit.value, hit.path, undefined, opts.repoRoot);
        if (drift) findings.push(drift);
      }
    }
  }

  // 3. Cross-deck: any referenced URL whose path segment matches another
  //    deck's slug rather than this deck's. Only fires when other slugs
  //    exist; on a fresh project with one deck this is always empty.
  const ownSlug = deck.deckSlug;
  if (ownSlug && opts.otherDeckSlugs.length > 0) {
    for (const url of referencedUrls) {
      const clean = url.split('?')[0].split('#')[0];
      const segs = clean.split('/').filter(Boolean);
      const hit = segs.find((s) => opts.otherDeckSlugs.includes(s) && s !== ownSlug);
      if (hit) {
        findings.push({
          class: 'orphan',
          url,
          deckJsonPath: `deck (referenced URL)`,
          reason: `URL is namespaced under another deck (\`${hit}/\`) but this deck is \`${ownSlug}\``,
          hint: `Either move the file under this deck's namespace or copy it into a shared location`,
        });
      }
    }
  }

  // 4. Orphan files in public/. Walk a small allow-list of asset dirs
  //    so the audit stays fast and predictable. We deliberately don't
  //    walk all of public/ — many files there (placeholder.svg,
  //    robots.txt, vite static fixtures) aren't deck assets.
  const referencedFsPaths = new Set<string>();
  for (const url of referencedUrls) {
    if (url.startsWith('http://') || url.startsWith('https://')) continue;
    if (!url.startsWith('/')) continue;
    // Resolve against opts.repoRoot — `urlToFsPath` captures REPO_ROOT at
    // module load, which is wrong for tests (and any caller that audits
    // a synthetic tree under a different cwd).
    const p = resolve(opts.repoRoot, 'public' + url.split('?')[0].split('#')[0]);
    referencedFsPaths.add(p);
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs');
  const orphanScanDirs = ['public/assets/brand', 'public/sounds'];
  for (const dirRel of orphanScanDirs) {
    const abs = resolve(opts.repoRoot, dirRel);
    if (!fs.existsSync(abs)) continue;
    let entries: import('node:fs').Dirent[];
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (!ent.isFile()) continue;
      const full = resolve(abs, ent.name);
      if (referencedFsPaths.has(full)) continue;
      findings.push({
        class: 'orphan',
        url: '/' + dirRel.replace(/^public\//, '') + '/' + ent.name,
        deckJsonPath: '(not referenced)',
        reason: `File exists under \`${dirRel}/\` but no deck reference resolves to it`,
        hint: 'Reference it from a slide or remove the file',
      });
    }
  }

  return findings.sort((a, b) => {
    if (a.class !== b.class) return a.class.localeCompare(b.class);
    return a.url.localeCompare(b.url);
  });
}

/**
 * Best-effort sibling-deck discovery. Reads `spec/slides/*` directories
 * and returns their slug names so the cross-deck check can detect
 * namespaced overlap. Pure / synchronous; returns [] on error so the
 * audit never fails because of a discovery hiccup.
 */
export function discoverOtherDeckSlugs(repoRoot: string, ownSlug: string | undefined): string[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs');
  const root = resolve(repoRoot, 'spec/slides');
  if (!fs.existsSync(root)) return [];
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      // Only directories that actually hold a deck.json — `assets/`,
      // `images/`, `llm/` etc. are spec-shared dirs, not decks, and
      // would otherwise generate false-positive cross-deck findings on
      // any URL that happens to contain that path segment.
      .filter((e) => fs.existsSync(resolve(root, e.name, 'deck.json')))
      .map((e) => e.name)
      .filter((n) => n !== ownSlug);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* File probing — zero-dep header parsers                              */
/* ------------------------------------------------------------------ */

/** Read the first N bytes of a file without slurping the whole thing. */
function readHead(path: string, n: number): Buffer {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(n);
    const read = readSync(fd, buf, 0, n, 0);
    return buf.subarray(0, read);
  } finally {
    closeSync(fd);
  }
}

function detectFormat(head: Buffer, urlExt: string): ProbeResult['format'] {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) {
    return 'png';
  }
  // JPEG: FF D8 FF
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'jpg';
  }
  // WEBP: 'RIFF' .... 'WEBP'
  if (
    head.length >= 12 &&
    head.toString('ascii', 0, 4) === 'RIFF' &&
    head.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  // MP3: 'ID3' tag OR raw frame sync (FF Fx)
  if (head.length >= 3 && head.toString('ascii', 0, 3) === 'ID3') return 'mp3';
  if (head.length >= 2 && head[0] === 0xff && (head[1] & 0xe0) === 0xe0) return 'mp3';
  // SVG is text; fall back to extension.
  if (urlExt === 'svg') return 'svg';
  return 'unknown';
}

/** PNG IHDR is at bytes 16-23 (width @16, height @20). */
function parsePngDims(head: Buffer): { width: number; height: number } | null {
  if (head.length < 24) return null;
  const w = head.readUInt32BE(16);
  const h = head.readUInt32BE(20);
  return { width: w, height: h };
}

/** WEBP VP8/VP8L/VP8X — only handles VP8 (lossy) and VP8L (lossless) for the
 *  common cases. Returns null on unsupported variants rather than guessing. */
function parseWebpDims(head: Buffer): { width: number; height: number } | null {
  if (head.length < 30) return null;
  const fourcc = head.toString('ascii', 12, 16);
  if (fourcc === 'VP8 ') {
    // Lossy: width @26 (LE 16-bit, mask 0x3FFF), height @28.
    const w = head.readUInt16LE(26) & 0x3fff;
    const h = head.readUInt16LE(28) & 0x3fff;
    return { width: w, height: h };
  }
  if (fourcc === 'VP8L') {
    // Lossless: 14-bit dims packed across bytes 21-24, +1 each.
    const b0 = head[21], b1 = head[22], b2 = head[23], b3 = head[24];
    const w = 1 + (((b1 & 0x3f) << 8) | b0);
    const h = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width: w, height: h };
  }
  if (fourcc === 'VP8X') {
    // Extended: dims @24 (3 bytes LE, +1 each).
    const w = 1 + (head[24] | (head[25] << 8) | (head[26] << 16));
    const h = 1 + (head[27] | (head[28] << 8) | (head[29] << 16));
    return { width: w, height: h };
  }
  return null;
}

/**
 * JPEG: scan SOFn markers (C0..CF, except C4/C8/CC). Each starts with FF Cn,
 * then 2-byte length, then 1 byte precision, then height (BE16), width (BE16).
 * We need the first 32KB to be safe — most JPEGs put SOF early but EXIF can
 * push it back.
 */
function parseJpegDims(buf: Buffer): { width: number; height: number } | null {
  // Skip SOI (FFD8). Walk markers.
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i++; continue; }
    // Skip filler bytes.
    while (i < buf.length && buf[i] === 0xff) i++;
    if (i >= buf.length) return null;
    const marker = buf[i++];
    // Standalone markers (no length): 01, D0..D7.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (i + 2 > buf.length) return null;
    const segLen = buf.readUInt16BE(i);
    // SOF0..SOF15 minus DHT(C4)/JPG(C8)/DAC(CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (i + 7 > buf.length) return null;
      const h = buf.readUInt16BE(i + 3);
      const w = buf.readUInt16BE(i + 5);
      return { width: w, height: h };
    }
    i += segLen;
  }
  return null;
}

/**
 * MP3 duration. Strategy:
 *   1. Skip the ID3v2 tag if present (size is encoded as 4 syncsafe bytes
 *      starting at offset 6).
 *   2. Find the first frame sync (FF Ex/Fx).
 *   3. Try to read a Xing/Info or VBRI header inside the first frame — those
 *      give the total frame count, which is precise even for VBR.
 *   4. If no Xing/VBRI, fall back to (fileBytes - audioStart) / bitrate.
 *
 * We only need the first ~8KB to find the Xing/VBRI tag. The frame header
 * gives us sample rate, MPEG version, layer, channel mode → samples-per-frame.
 */
const MPEG_BITRATES: Record<string, number[]> = {
  // Index by `${version}-${layer}` → bitrate table (kbps; 0 = free, -1 = bad).
  '1-1': [-1, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, -1],
  '1-2': [-1, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, -1],
  '1-3': [-1, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, -1],
  '2-1': [-1, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, -1],
  '2-2': [-1, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, -1],
  '2-3': [-1, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, -1],
};
const MPEG_SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000, 0], // MPEG-1
  2: [22050, 24000, 16000, 0], // MPEG-2
  0: [11025, 12000, 8000, 0],  // MPEG-2.5
};

function parseMp3Duration(path: string, totalBytes: number): number | null {
  const buf = readHead(path, Math.min(totalBytes, 16 * 1024));
  let offset = 0;
  // Skip ID3v2 tag.
  if (buf.length >= 10 && buf.toString('ascii', 0, 3) === 'ID3') {
    const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
    offset = 10 + size;
  }
  // Find frame sync.
  while (offset < buf.length - 4) {
    if (buf[offset] === 0xff && (buf[offset + 1] & 0xe0) === 0xe0) break;
    offset++;
  }
  if (offset >= buf.length - 4) return null;
  const b1 = buf[offset + 1];
  const b2 = buf[offset + 2];
  const b3 = buf[offset + 3];
  const versionBits = (b1 >> 3) & 0x03;     // 3=MPEG1, 2=MPEG2, 0=MPEG2.5
  const layerBits = (b1 >> 1) & 0x03;        // 3=L1, 2=L2, 1=L3
  const bitrateIdx = (b2 >> 4) & 0x0f;
  const sampleRateIdx = (b2 >> 2) & 0x03;
  const padding = (b2 >> 1) & 0x01;
  if (versionBits === 1 || layerBits === 0) return null; // reserved
  const versionKey = versionBits === 3 ? '1' : '2';
  const layerKey = layerBits === 3 ? '1' : layerBits === 2 ? '2' : '3';
  const bitrate = MPEG_BITRATES[`${versionKey}-${layerKey}`]?.[bitrateIdx];
  const sampleRate = MPEG_SAMPLE_RATES[versionBits]?.[sampleRateIdx];
  if (!bitrate || bitrate <= 0 || !sampleRate) return null;
  const samplesPerFrame = layerKey === '1' ? 384 : layerKey === '2' ? 1152 : versionKey === '1' ? 1152 : 576;
  // Try Xing/Info header — it lives inside the first frame's audio data.
  // Side-info offset (post-header): MPEG1 stereo=32, MPEG1 mono=17, MPEG2/2.5 stereo=17, mono=9.
  const channelMode = (b3 >> 6) & 0x03; // 3 = mono
  const sideInfoOffset =
    versionKey === '1'
      ? channelMode === 3 ? 17 : 32
      : channelMode === 3 ? 9 : 17;
  const xingStart = offset + 4 + sideInfoOffset;
  if (xingStart + 12 < buf.length) {
    const tag = buf.toString('ascii', xingStart, xingStart + 4);
    if (tag === 'Xing' || tag === 'Info') {
      const flags = buf.readUInt32BE(xingStart + 4);
      if (flags & 0x01) {
        // Frames count present.
        const frames = buf.readUInt32BE(xingStart + 8);
        return (frames * samplesPerFrame) / sampleRate;
      }
    }
    if (tag === 'VBRI' && xingStart + 32 < buf.length) {
      const frames = buf.readUInt32BE(xingStart + 14);
      return (frames * samplesPerFrame) / sampleRate;
    }
  }
  // CBR fallback.
  const audioBytes = totalBytes - offset;
  return (audioBytes * 8) / (bitrate * 1000);
}

/* ------------------------------------------------------------------ */
/* SVG parser — root-tag attribute extraction (v0.175)                 */
/* ------------------------------------------------------------------ */

/**
 * Why text-regex parsing instead of a full XML parser:
 *   - The audit's zero-dep ethos (mirrors the PNG/JPEG/MP3 header walkers).
 *   - We only ever read the root `<svg …>` opening tag — never the body.
 *   - That tag is well-formed by definition: an SVG that doesn't open with
 *     `<svg …>` isn't an SVG. So a tolerant regex over the first ~8KB is
 *     enough to pull `viewBox`, `width`, `height` reliably across hand-
 *     written, Figma-exported, Inkscape, and SVGO-minified files.
 *
 * What we deliberately don't parse:
 *   - `<style>` blocks, `<defs>`, transforms — none of them affect the
 *     "does this asset render at the required minimum dimensions" check.
 *   - `preserveAspectRatio` — orthogonal to viewBox geometry; would
 *     belong in a future "rendering hints" rule.
 */
interface SvgRootInfo {
  viewBox: { minX: number; minY: number; width: number; height: number } | null;
  width: number | null;
  height: number | null;
  hasExplicitDims: boolean;
}

function parseSvgRoot(head: Buffer): SvgRootInfo {
  // SVG can start with an XML decl, a DOCTYPE, comments, then `<svg …>`.
  // Decode as UTF-8; strip BOM if present.
  let text = head.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const open = text.match(/<svg\b[^>]*>/i);
  if (!open) {
    return { viewBox: null, width: null, height: null, hasExplicitDims: false };
  }
  const tag = open[0];

  // Attribute extractor — supports both quote styles, attr boundaries handled
  // via the leading whitespace lookbehind so `viewBox` doesn't match
  // `data-viewBox`.
  const attr = (name: string): string | null => {
    const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"|(?:^|\\s)${name}\\s*=\\s*'([^']*)'`, 'i');
    const m = re.exec(tag);
    if (!m) return null;
    return (m[1] ?? m[2] ?? '').trim();
  };

  // Length parser — accepts plain numbers, `px`, and unitless. Rejects
  // percentages and other relative units (we can't validate "50%" against
  // an absolute pixel constraint, so we treat it as "no usable value").
  const lengthToPx = (raw: string | null): number | null => {
    if (raw == null) return null;
    const m = /^(-?\d+(?:\.\d+)?)\s*(px)?$/i.exec(raw);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };

  // viewBox = "minX minY width height" (whitespace OR comma-separated per
  // SVG spec). We accept both.
  const vbRaw = attr('viewBox');
  let viewBox: SvgRootInfo['viewBox'] = null;
  if (vbRaw) {
    const parts = vbRaw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n)) && parts[2] > 0 && parts[3] > 0) {
      viewBox = { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
    }
  }

  const wRaw = attr('width');
  const hRaw = attr('height');
  const wPx = lengthToPx(wRaw);
  const hPx = lengthToPx(hRaw);
  const hasExplicitDims = wRaw != null && hRaw != null;

  // Effective render-intent dims: explicit width/height attrs win, fall
  // back to viewBox geometry (which is what every browser does when only
  // a viewBox is supplied).
  const width = wPx ?? viewBox?.width ?? null;
  const height = hPx ?? viewBox?.height ?? null;
  return { viewBox, width, height, hasExplicitDims };
}

/* ------------------------------------------------------------------ */
/* Probe orchestration                                                 */
/* ------------------------------------------------------------------ */

export function probeFile(path: string, urlExt: string): ProbeResult {
  const stat = statSync(path);
  const head = readHead(path, Math.min(stat.size, 64 * 1024));
  const format = detectFormat(head, urlExt);
  let width: number | null = null;
  let height: number | null = null;
  let durationSec: number | null = null;
  let viewBox: ProbeResult['viewBox'] = null;
  let hasExplicitDims: boolean | undefined;

  if (format === 'png') {
    const d = parsePngDims(head);
    width = d?.width ?? null;
    height = d?.height ?? null;
  } else if (format === 'webp') {
    const d = parseWebpDims(head);
    width = d?.width ?? null;
    height = d?.height ?? null;
  } else if (format === 'jpg') {
    const d = parseJpegDims(head);
    width = d?.width ?? null;
    height = d?.height ?? null;
  } else if (format === 'mp3') {
    durationSec = parseMp3Duration(path, stat.size);
  } else if (format === 'svg') {
    const info = parseSvgRoot(head);
    width = info.width;
    height = info.height;
    viewBox = info.viewBox;
    hasExplicitDims = info.hasExplicitDims;
  }
  return { format, width, height, durationSec, bytes: stat.size, viewBox, hasExplicitDims };
}

/* ------------------------------------------------------------------ */
/* Rule evaluation                                                     */
/* ------------------------------------------------------------------ */

function parseAspect(aspect: string): { w: number; h: number } | null {
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(aspect);
  if (!m) return null;
  return { w: Number(m[1]), h: Number(m[2]) };
}

function evaluate(
  ref: AssetRef,
  url: string,
  probe: ProbeResult,
  rule: ConstraintRule | undefined,
): Violation[] {
  if (!rule) return [];
  const v: Violation[] = [];
  const push = (r: string, expected: string, actual: string) =>
    v.push({ kind: ref.kind, slug: ref.slug, url, rule: r, expected, actual });

  if (rule.formats && !rule.formats.includes(probe.format)) {
    push('formats', `one of [${rule.formats.join(', ')}]`, probe.format);
  }
  if (rule.maxBytes != null && probe.bytes > rule.maxBytes) {
    push('maxBytes', `≤ ${rule.maxBytes} bytes`, `${probe.bytes} bytes`);
  }
  if (probe.width != null && probe.height != null) {
    if (rule.minWidth != null && probe.width < rule.minWidth) {
      push('minWidth', `≥ ${rule.minWidth}px`, `${probe.width}px`);
    }
    if (rule.maxWidth != null && probe.width > rule.maxWidth) {
      push('maxWidth', `≤ ${rule.maxWidth}px`, `${probe.width}px`);
    }
    if (rule.minHeight != null && probe.height < rule.minHeight) {
      push('minHeight', `≥ ${rule.minHeight}px`, `${probe.height}px`);
    }
    if (rule.maxHeight != null && probe.height > rule.maxHeight) {
      push('maxHeight', `≤ ${rule.maxHeight}px`, `${probe.height}px`);
    }
    if (rule.aspectRatio) {
      const target = parseAspect(rule.aspectRatio);
      if (target) {
        const targetRatio = target.w / target.h;
        const actualRatio = probe.width / probe.height;
        const tol = rule.aspectRatioTolerance ?? 0.02;
        const drift = Math.abs(actualRatio - targetRatio) / targetRatio;
        if (drift > tol) {
          push(
            'aspectRatio',
            `${rule.aspectRatio} (±${(tol * 100).toFixed(1)}%)`,
            `${probe.width}×${probe.height} = ${actualRatio.toFixed(3)}`,
          );
        }
      }
    }
  }
  if (probe.durationSec != null) {
    if (rule.minDurationSec != null && probe.durationSec < rule.minDurationSec) {
      push('minDurationSec', `≥ ${rule.minDurationSec}s`, `${probe.durationSec.toFixed(3)}s`);
    }
    if (rule.maxDurationSec != null && probe.durationSec > rule.maxDurationSec) {
      push('maxDurationSec', `≤ ${rule.maxDurationSec}s`, `${probe.durationSec.toFixed(3)}s`);
    }
  }

  /* ---- v0.175 — SVG-specific viewBox checks ----
   * Why these only fire for SVG: the rules name viewBox geometry, which
   * doesn't exist on raster formats. We deliberately leave existing
   * minWidth/aspectRatio behaviour untouched — they already evaluated
   * against probe.width/height (which for SVG is the parsed render-intent
   * width), so authors get one consistent set of dimension constraints
   * across raster + vector brand assets.
   */
  if (probe.format === 'svg') {
    // requireViewBox defaults to ON whenever a rule object exists for this
    // kind. Rationale: presentation chrome (BrandHeader/BrandStrip) sizes
    // logos by CSS height alone — without a viewBox the browser has no
    // intrinsic ratio to scale against and the asset collapses or blurs.
    const requireViewBox = rule.requireViewBox ?? true;
    if (requireViewBox && probe.viewBox == null) {
      push(
        'requireViewBox',
        'root <svg> with valid `viewBox="minX minY w h"`',
        'no viewBox attribute (or unparseable values)',
      );
    }
    if (probe.viewBox != null) {
      // Min viewBox dims: explicit rule wins, otherwise inherit from
      // minWidth/minHeight so a single declaration covers both raster
      // pixels and vector user-units (1:1 mapping is the common case for
      // brand marks designed at presentation scale).
      const minVbW = rule.minViewBoxWidth ?? rule.minWidth;
      const minVbH = rule.minViewBoxHeight ?? rule.minHeight;
      if (minVbW != null && probe.viewBox.width < minVbW) {
        push(
          'minViewBoxWidth',
          `viewBox width ≥ ${minVbW} user units`,
          `${probe.viewBox.width}`,
        );
      }
      if (minVbH != null && probe.viewBox.height < minVbH) {
        push(
          'minViewBoxHeight',
          `viewBox height ≥ ${minVbH} user units`,
          `${probe.viewBox.height}`,
        );
      }
    }
  }
  return v;
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

interface Row {
  ref: AssetRef;
  url: string | null;
  probe: ProbeResult | null;
  violations: Violation[];
  /** Set when the file couldn't be probed (already caught by check:assets, but
   *  we surface it here too so the report is self-contained). */
  probeError: string | null;
}

function renderReport(
  deckPath: string,
  deck: DeckShape,
  rows: Row[],
  missingRefs: MissingReference[],
  strictReferences: boolean,
  resolutionFindings: ResolutionFinding[],
  resolutionAudit: boolean,
): string {
  const out: string[] = [];
  out.push(`# Asset Resolution Audit — ${deck.deckSlug ?? basename(deckPath)}`);
  out.push('');
  out.push(`- **Deck name:** ${deck.deckName ?? '—'}`);
  out.push(`- **Deck file:** \`${deckPath}\``);
  out.push(`- **Generated:** ${new Date().toISOString()}`);
  out.push(
    `- **Strict-references mode:** ${strictReferences ? '`on`' : '`off` (default)'}`,
  );
  out.push(
    `- **Resolution-audit mode:** ${resolutionAudit ? '`on`' : '`off` (default)'}`,
  );
  out.push('');

  const allViolations = rows.flatMap((r) => r.violations);
  const probeErrors = rows.filter((r) => r.probeError);

  out.push('## Summary');
  out.push('');
  out.push('| Metric | Count |');
  out.push('|---|---|');
  out.push(`| Assets audited | ${rows.length} |`);
  out.push(`| Probe errors | ${probeErrors.length} |`);
  out.push(`| Violations | ${allViolations.length} |`);
  if (strictReferences) {
    out.push(`| Missing references | ${missingRefs.length} |`);
  }
  if (resolutionAudit) {
    const byClass = new Map<ResolutionFindingClass, number>();
    for (const f of resolutionFindings) byClass.set(f.class, (byClass.get(f.class) ?? 0) + 1);
    out.push(`| Resolution findings — shape | ${byClass.get('shape') ?? 0} |`);
    out.push(`| Resolution findings — mime | ${byClass.get('mime') ?? 0} |`);
    out.push(`| Resolution findings — case-drift | ${byClass.get('case-drift') ?? 0} |`);
    out.push(`| Resolution findings — orphan | ${byClass.get('orphan') ?? 0} |`);
  }
  out.push('');

  const noFindings =
    allViolations.length === 0 &&
    probeErrors.length === 0 &&
    missingRefs.length === 0 &&
    resolutionFindings.length === 0;
  if (noFindings) {
    out.push(`> ✅ All assets meet the deck's declared constraints.`);
    out.push('');
  } else {
    if (probeErrors.length > 0) {
      out.push(`> ❌ ${probeErrors.length} asset${probeErrors.length === 1 ? '' : 's'} could not be probed (file missing on disk). Run \`bun run check:assets\` for details.`);
      out.push('');
    }
    if (allViolations.length > 0) {
      out.push(`> ❌ ${allViolations.length} resolution / format violation${allViolations.length === 1 ? '' : 's'}. Fix the asset file or relax the matching rule in \`deck.assetConstraints\`.`);
      out.push('');
    }
    if (strictReferences && missingRefs.length > 0) {
      out.push(`> ❌ ${missingRefs.length} referenced file${missingRefs.length === 1 ? '' : 's'} missing from \`public/\`. See "Missing References" below.`);
      out.push('');
    }
    if (resolutionAudit && resolutionFindings.length > 0) {
      out.push(`> ❌ ${resolutionFindings.length} resolution finding${resolutionFindings.length === 1 ? '' : 's'} (shape / mime / case-drift / orphan). See "Resolution Findings" below.`);
      out.push('');
    }
  }

  if (strictReferences) {
    out.push('## Missing References');
    out.push('');
    if (missingRefs.length === 0) {
      out.push('> ✅ Every referenced asset path resolves to a real file under `public/`.');
      out.push('');
    } else {
      out.push('Each row below is a referenced URL whose `public/<url>` does not exist on disk. Categories:');
      out.push('');
      out.push('- `declared` — listed in `deck.assets.{audio|qr|brand}`.');
      out.push('- `registry` — referenced by a slide via the asset registry (`sound.kind`, `content.qrAsset`, `deck.meeting.qrAsset`).');
      out.push('- `slide-path` — any other `/`-prefixed string in a slide JSON.');
      out.push('');
      out.push('| Category | Kind/Slug | URL | Referenced at |');
      out.push('|---|---|---|---|');
      for (const m of missingRefs) {
        const ks = m.kind && m.slug ? `${m.kind}/${m.slug}` : '—';
        out.push(`| \`${m.category}\` | ${ks} | \`${m.url}\` | \`${m.deckJsonPath}\` |`);
      }
      out.push('');
    }
  }

  if (resolutionAudit) {
    out.push('## Resolution Findings');
    out.push('');
    if (resolutionFindings.length === 0) {
      out.push('> ✅ No path-shape, MIME, case-drift, or orphan issues detected.');
      out.push('');
    } else {
      out.push('Each row is one URL that fails a resolution check that fires BEFORE existence matters. Classes:');
      out.push('');
      out.push('- `shape` — URL is malformed (empty, traversal, backslash, not `/`-prefixed, escapes `/public`, missing extension).');
      out.push('- `mime` — File exists but its magic bytes disagree with the URL extension.');
      out.push('- `case-drift` — URL casing differs from the on-disk filename (works on macOS dev, 404s on Linux production).');
      out.push('- `orphan` — File exists in `public/assets/brand` or `public/sounds` but isn\'t referenced, OR a referenced URL is namespaced under another deck.');
      out.push('');
      out.push('| Class | URL | Reason | Referenced at | Hint |');
      out.push('|---|---|---|---|---|');
      for (const f of resolutionFindings) {
        out.push(
          `| \`${f.class}\` | \`${f.url}\` | ${f.reason} | \`${f.deckJsonPath}\` | ${f.hint ?? '—'} |`,
        );
      }
      out.push('');
    }
  }

  for (const kind of ['audio', 'qr', 'brand'] as AssetKind[]) {
    const inKind = rows.filter((r) => r.ref.kind === kind);
    if (inKind.length === 0) continue;
    out.push(`## ${kind.toUpperCase()}`);
    out.push('');
    const rule = deck.assetConstraints?.[kind];
    out.push('**Rule:**');
    out.push('');
    out.push('```json');
    out.push(JSON.stringify(rule ?? {}, null, 2));
    out.push('```');
    out.push('');

    for (const row of inKind) {
      const status = row.probeError ? '❌' : row.violations.length > 0 ? '❌' : '✅';
      out.push(`### ${status} \`${row.ref.slug}\``);
      out.push('');
      out.push(`- **First referenced at:** \`${row.ref.firstReferencedAt}\``);
      out.push(`- **URL:** \`${row.url ?? '(unregistered)'}\``);
      if (row.probeError) {
        out.push(`- **Probe error:** ${row.probeError}`);
      } else if (row.probe) {
        const p = row.probe;
        const dims = p.width != null && p.height != null ? `${p.width}×${p.height}` : '—';
        const dur = p.durationSec != null ? `${p.durationSec.toFixed(3)}s` : '—';
        out.push(`- **Format:** \`${p.format}\` · **Size:** ${p.bytes.toLocaleString()} bytes · **Dims:** ${dims} · **Duration:** ${dur}`);
        if (p.format === 'svg') {
          // Surface viewBox + explicit-dims state on every SVG row, not
          // just violating ones — authors fixing one logo often want to
          // see the geometry of neighbouring marks for consistency.
          const vb = p.viewBox
            ? `\`${p.viewBox.minX} ${p.viewBox.minY} ${p.viewBox.width} ${p.viewBox.height}\``
            : '`(none)`';
          const explicit = p.hasExplicitDims ? '`width`+`height` set' : 'inherits from viewBox';
          out.push(`- **viewBox:** ${vb} · **Root attrs:** ${explicit}`);
        }
      }
      if (row.violations.length > 0) {
        out.push(`- **Violations:**`);
        for (const v of row.violations) {
          out.push(`  - \`${v.rule}\` — expected ${v.expected}, got ${v.actual}`);
        }
      }
      out.push('');
    }
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ */
/* CSV / JSON export (v0.188)                                          */
/* ------------------------------------------------------------------ */
/**
 * Why a flat row schema instead of nested JSON of the existing report:
 *   The whole point of CSV/JSON export is "drop into Sheets / DuckDB
 *   without writing a parser." A row per finding (with `source` column
 *   distinguishing violation / probe-error / missing-ref / resolution-
 *   finding) lets the spreadsheet user pivot by `source`, `kind`,
 *   `class`, etc. without any preprocessing.
 *
 * Why we surface CSV + JSON via the same row builder:
 *   Single source of truth — if we add a column to the CSV we get it
 *   in JSON for free, and vice versa. JSON additionally carries deck
 *   metadata at the top level so a single file is enough context.
 */

interface ExportRow {
  /** Discriminator: which audit pass produced this row. */
  source: 'violation' | 'probe-error' | 'missing-reference' | 'resolution-finding';
  /**
   * v0.189 — finding severity. `error` = bumps CI exit code; `warn` =
   * informational. Resolution findings get their level from the severity
   * map (`off`-level findings are dropped before this row is built);
   * everything else (constraint violations, probe errors, missing refs)
   * is always `error` because those are hard correctness failures with
   * no spec-level toggle today.
   */
  severity: Severity;
  /** AssetKind when known; empty otherwise (e.g. shape findings on raw URLs). */
  kind: string;
  /** Slug when known; empty otherwise. */
  slug: string;
  /** The asset URL (or empty). */
  url: string;
  /** Constraint rule name (violations) OR finding class (resolution / missing). */
  rule: string;
  /** Expected value (violations) OR human-readable reason (other rows). */
  expected: string;
  /** Actual value (violations) OR remediation hint (other rows). */
  actual: string;
  /** JSON pointer / location string. */
  referencedAt: string;
  /** For missing-references: declared|registry|slide-path. Empty otherwise. */
  category: string;
}

export function buildExportRows(
  rows: Row[],
  missingRefs: MissingReference[],
  resolutionFindings: ResolutionFinding[],
  severity: SeverityMap = DEFAULT_SEVERITY,
): ExportRow[] {
  const out: ExportRow[] = [];
  for (const r of rows) {
    if (r.probeError) {
      out.push({
        source: 'probe-error',
        severity: 'error',
        kind: r.ref.kind,
        slug: r.ref.slug,
        url: r.url ?? '',
        rule: 'probe',
        expected: 'file probeable on disk',
        actual: r.probeError,
        referencedAt: r.ref.firstReferencedAt,
        category: '',
      });
    }
    for (const v of r.violations) {
      out.push({
        source: 'violation',
        severity: 'error',
        kind: v.kind,
        slug: v.slug,
        url: v.url,
        rule: v.rule,
        expected: v.expected,
        actual: v.actual,
        referencedAt: r.ref.firstReferencedAt,
        category: '',
      });
    }
  }
  for (const m of missingRefs) {
    out.push({
      source: 'missing-reference',
      severity: 'error',
      kind: m.kind ?? '',
      slug: m.slug ?? '',
      url: m.url,
      rule: 'file-exists',
      expected: 'file present at public/<url>',
      actual: 'missing on disk',
      referencedAt: m.deckJsonPath,
      category: m.category,
    });
  }
  for (const f of resolutionFindings) {
    const lvl = severity[f.class];
    if (lvl === 'off') continue; // Dropped entirely — caller can also filter upstream.
    out.push({
      source: 'resolution-finding',
      severity: lvl,
      kind: f.kind ?? '',
      slug: f.slug ?? '',
      url: f.url,
      rule: f.class,
      expected: f.reason,
      actual: f.hint ?? '',
      referencedAt: f.deckJsonPath,
      category: f.class,
    });
  }
  return out;
}

/**
 * RFC 4180 CSV escaping: wrap any field containing comma, quote, CR, or LF
 * in double-quotes and double any embedded double-quotes. Sheets / Excel /
 * DuckDB / pandas all parse this correctly.
 */
function csvEscape(value: string): string {
  if (value === '') return '';
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export function renderCsv(rows: ExportRow[]): string {
  const cols: Array<keyof ExportRow> = [
    'source', 'severity', 'kind', 'slug', 'url', 'rule',
    'expected', 'actual', 'referencedAt', 'category',
  ];
  const lines: string[] = [cols.join(',')];
  for (const r of rows) {
    lines.push(cols.map((c) => csvEscape(r[c])).join(','));
  }
  // Trailing newline so `wc -l` and POSIX tools match the row count.
  return lines.join('\n') + '\n';
}

export function renderJson(
  deckPath: string,
  deck: DeckShape,
  rows: ExportRow[],
  flags: { strictReferences: boolean; resolutionAudit: boolean },
): string {
  const payload = {
    deckSlug: deck.deckSlug ?? null,
    deckName: deck.deckName ?? null,
    deckFile: deckPath,
    generatedAt: new Date().toISOString(),
    strictReferences: flags.strictReferences,
    resolutionAudit: flags.resolutionAudit,
    totalFindings: rows.length,
    findings: rows,
  };
  return JSON.stringify(payload, null, 2) + '\n';
}

/* ------------------------------------------------------------------ */
/* Summary export (v0.190)                                             */
/* ------------------------------------------------------------------ */
/**
 * Why a separate summary alongside the detailed CSV/JSON:
 *   The detailed export is one row per finding — great for filtering /
 *   debugging in a spreadsheet, but useless for "give me a single
 *   number to put on the dashboard". The summary aggregates the same
 *   ExportRow stream three ways so reviewers can answer at a glance:
 *
 *     1. by `source`         — violation / probe-error / missing-reference
 *                              / resolution-finding. Tells you WHICH
 *                              audit pass is firing, so a regression
 *                              localizes to the right subsystem.
 *     2. by `classCategory`  — `rule` for violations and probe-errors,
 *                              `category` for missing-references and
 *                              resolution-findings. The shared name maps
 *                              cleanly to "what kind of problem".
 *     3. by `deckJsonPath`   — top-level JSON pointer (everything before
 *                              the first `.` after the root). Bucketing
 *                              by the deck-level location surface
 *                              (`deck.assets.brand`, `deck.slides[3]`,
 *                              etc.) tells reviewers WHERE in the spec
 *                              the problems cluster without exploding
 *                              into every leaf field.
 *
 * Severity is broken out per bucket too — a `warn`-only bucket is a
 * different signal from one that mixes `error` + `warn`, and CI dashboards
 * often want to chart the two independently.
 */

export interface SummaryBucket {
  /** The grouping key (source name, rule/category, or deckJsonPath prefix). */
  key: string;
  /** Total findings in this bucket. */
  total: number;
  /** Findings whose `severity === 'error'` (CI-failing). */
  errors: number;
  /** Findings whose `severity === 'warn'` (informational). */
  warnings: number;
}

export interface AuditSummary {
  totalFindings: number;
  totalErrors: number;
  totalWarnings: number;
  bySource: SummaryBucket[];
  byClass: SummaryBucket[];
  byDeckJsonPath: SummaryBucket[];
}

/**
 * Reduce a JSON pointer like `deck.slides[3] ("kw-2").content.qrAsset`
 * to the top TWO segments (`deck.slides[3] ("kw-2")`) so the by-path
 * bucket aggregates intra-slide / intra-block findings instead of
 * fragmenting per leaf field. Two segments is the sweet spot:
 *   - 1 segment collapses everything under `deck` into one bucket.
 *   - 3+ segments fragments brand assets per slug.
 *   - 2 segments groups by slide / by deck-asset-block — the natural
 *     "where in the spec do I look" surface.
 * Returns the original string when fewer than two segments exist.
 * Dots inside parentheses (slide titles like `("v1.2 release")`) do
 * NOT count as separators.
 */
export function deckJsonPathPrefix(pointer: string): string {
  if (!pointer) return '';
  let depth = 0;
  let dots = 0;
  for (let i = 0; i < pointer.length; i++) {
    const c = pointer[i];
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === '.' && depth === 0) {
      dots++;
      if (dots === 2) return pointer.slice(0, i);
    }
  }
  return pointer;
}

/**
 * The "class/category" key for a row. Violations + probe-errors carry
 * their constraint name in `rule`; missing-references + resolution
 * findings carry their class in `category`. Prefer `category` when set
 * so the buckets line up across sources (e.g. all `shape` findings
 * collapse to one row regardless of which surface flagged them).
 */
function classCategoryKey(row: ExportRow): string {
  return row.category && row.category.length > 0 ? row.category : (row.rule || '(none)');
}

export function buildSummary(rows: ExportRow[]): AuditSummary {
  const bumpInto = (
    map: Map<string, SummaryBucket>,
    key: string,
    severity: Severity,
  ): void => {
    const cur = map.get(key) ?? { key, total: 0, errors: 0, warnings: 0 };
    cur.total++;
    if (severity === 'error') cur.errors++;
    else if (severity === 'warn') cur.warnings++;
    map.set(key, cur);
  };

  const bySource = new Map<string, SummaryBucket>();
  const byClass = new Map<string, SummaryBucket>();
  const byPath = new Map<string, SummaryBucket>();

  let totalErrors = 0;
  let totalWarnings = 0;
  for (const row of rows) {
    if (row.severity === 'error') totalErrors++;
    else if (row.severity === 'warn') totalWarnings++;
    bumpInto(bySource, row.source, row.severity);
    bumpInto(byClass, classCategoryKey(row), row.severity);
    bumpInto(byPath, deckJsonPathPrefix(row.referencedAt), row.severity);
  }

  // Sort by total desc, then key asc — gives reviewers a stable
  // "biggest offender first" ordering that's also deterministic across
  // runs with identical input.
  const sortBuckets = (m: Map<string, SummaryBucket>): SummaryBucket[] =>
    Array.from(m.values()).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.key.localeCompare(b.key);
    });

  return {
    totalFindings: rows.length,
    totalErrors,
    totalWarnings,
    bySource: sortBuckets(bySource),
    byClass: sortBuckets(byClass),
    byDeckJsonPath: sortBuckets(byPath),
  };
}

export function renderSummaryJson(
  deckPath: string,
  deck: DeckShape,
  summary: AuditSummary,
  flags: { strictReferences: boolean; resolutionAudit: boolean },
): string {
  const payload = {
    deckSlug: deck.deckSlug ?? null,
    deckName: deck.deckName ?? null,
    deckFile: deckPath,
    generatedAt: new Date().toISOString(),
    strictReferences: flags.strictReferences,
    resolutionAudit: flags.resolutionAudit,
    summary,
  };
  return JSON.stringify(payload, null, 2) + '\n';
}

export function renderSummaryCsv(summary: AuditSummary): string {
  // One CSV with a `dimension` discriminator so all three aggregations
  // live in a single file — Sheets pivot tables can split on `dimension`
  // and reviewers don't have to juggle three artifacts.
  const cols = ['dimension', 'key', 'total', 'errors', 'warnings'] as const;
  const lines: string[] = [cols.join(',')];
  const push = (dimension: string, b: SummaryBucket): void => {
    lines.push([
      csvEscape(dimension),
      csvEscape(b.key),
      String(b.total),
      String(b.errors),
      String(b.warnings),
    ].join(','));
  };
  for (const b of summary.bySource) push('source', b);
  for (const b of summary.byClass) push('class', b);
  for (const b of summary.byDeckJsonPath) push('deckJsonPath', b);
  return lines.join('\n') + '\n';
}

export function renderSummaryMarkdown(
  deckPath: string,
  deck: DeckShape,
  summary: AuditSummary,
): string {
  const lines: string[] = [];
  lines.push(`# Asset Resolution Audit — Summary`);
  lines.push('');
  lines.push(`- Deck: \`${deck.deckSlug ?? deckPath}\``);
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Total findings: **${summary.totalFindings}**  (❌ ${summary.totalErrors} error · ⚠️ ${summary.totalWarnings} warn)`);
  lines.push('');
  const section = (title: string, buckets: SummaryBucket[]): void => {
    lines.push(`## ${title}`);
    lines.push('');
    if (buckets.length === 0) {
      lines.push('_no findings_');
      lines.push('');
      return;
    }
    lines.push('| Key | Total | Errors | Warnings |');
    lines.push('|---|---:|---:|---:|');
    for (const b of buckets) {
      lines.push(`| \`${b.key}\` | ${b.total} | ${b.errors} | ${b.warnings} |`);
    }
    lines.push('');
  };
  section('By source', summary.bySource);
  section('By class / category', summary.byClass);
  section('By deckJsonPath (top-level)', summary.byDeckJsonPath);
  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

export function urlExtension(url: string): string {
  const m = /\.([a-z0-9]+)(?:\?.*)?$/i.exec(url);
  if (!m) return '';
  const ext = m[1].toLowerCase();
  return ext === 'jpeg' ? 'jpg' : ext;
}

export function urlToFsPath(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return '';
  if (!url.startsWith('/')) return '';
  return resolve(REPO_ROOT, 'public' + url);
}

function main(): number {
  const args = process.argv.slice(2);
  let deckArg: string | undefined;
  let outArg: string | undefined;
  // v0.174 — opt-in flag enabling the missing-references pass on top
  // of the existing format/dimension audit. Off by default so local
  // runs that intentionally have missing fixtures keep working.
  let strictReferences = false;
  // v0.187 — opt-in resolution audit (path-shape, MIME mismatch, case
  // drift, orphan / cross-deck refs). Off by default for the same
  // reason: it's noisy on partially-imported decks.
  let resolutionAudit = false;
  // v0.188 — sidecar export flags. Both can be set independently of each
  // other and of --out; they always write alongside the markdown report
  // (or to the explicit path provided as the flag value).
  //   --export-csv [path]      — RFC 4180 CSV, one row per finding
  //   --export-json [path]     — JSON document with deck metadata + findings
  //   --export-summary [path]  — Aggregate counts (source / class / deckJsonPath).
  //                              Format inferred from extension (.csv / .json / .md).
  //   --format md|csv|json     — change the PRIMARY --out format (default md)
  let exportCsv: string | true | null = null;
  let exportJson: string | true | null = null;
  // v0.190 — `--export-summary [path]` writes an aggregate report
  // (counts by source, class/category, deckJsonPath). Format is inferred
  // from the path extension (.csv / .json / .md); defaults to .md when
  // no path is supplied.
  let exportSummary: string | true | null = null;
  let primaryFormat: 'md' | 'csv' | 'json' = 'md';
  // v0.189 — per-class severity. Build atop DEFAULT_SEVERITY so unspecified
  // classes keep their sensible defaults (shape/mime=error, others=warn).
  let severity: SeverityMap = { ...DEFAULT_SEVERITY };
  const isFlagValue = (s: string | undefined): boolean =>
    s != null && !s.startsWith('-');
  const SHORTHAND: Record<string, ResolutionFindingClass> = {
    '--severity-shape': 'shape',
    '--severity-mime': 'mime',
    '--severity-case-drift': 'case-drift',
    '--severity-orphan': 'orphan',
  };
  try {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--out') outArg = args[++i];
      else if (args[i] === '--strict-references' || args[i] === '-S') strictReferences = true;
      else if (args[i] === '--resolution-audit' || args[i] === '-R') resolutionAudit = true;
      else if (args[i] === '--export-csv') {
        exportCsv = isFlagValue(args[i + 1]) ? args[++i] : true;
      } else if (args[i] === '--export-json') {
        exportJson = isFlagValue(args[i + 1]) ? args[++i] : true;
      } else if (args[i] === '--export-summary') {
        exportSummary = isFlagValue(args[i + 1]) ? args[++i] : true;
      } else if (args[i] === '--format') {
        const v = args[++i];
        if (v !== 'md' && v !== 'csv' && v !== 'json') {
          console.error(`✗ --format must be one of: md, csv, json (got "${v}")`);
          return 1;
        }
        primaryFormat = v;
      } else if (args[i] === '--severity') {
        severity = parseSeverityArg(args[++i] ?? '', severity);
      } else if (SHORTHAND[args[i]]) {
        // Shorthand: --severity-shape error  ≡  --severity shape=error
        const cls = SHORTHAND[args[i]];
        const lvl = args[++i];
        severity = parseSeverityArg(`${cls}=${lvl}`, severity);
      } else if (!deckArg) deckArg = args[i];
    }
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    return 1;
  }
  const deckPath = deckArg ?? DEFAULT_DECK;
  const fullPath = resolve(REPO_ROOT, deckPath);
  if (!existsSync(fullPath)) {
    console.error(`✗ Deck not found: ${deckPath}`);
    return 1;
  }

  let loaded: { deck: DeckShape; slides: SlideShape[] };
  try {
    loaded = loadDeck(fullPath);
  } catch (err) {
    console.error(`✗ Failed to parse deck: ${(err as Error).message}`);
    return 1;
  }
  const { deck, slides } = loaded;

  if (!deck.assetConstraints) {
    console.warn(
      `  ! deck has no \`assetConstraints\` block — audit is a dry run.\n` +
        `    Add per-kind rules (audio / qr / brand) to deck.json to enforce.`,
    );
  }

  const refs = collectReferences(deck, slides);
  const rows: Row[] = [];

  for (const ref of refs) {
    const block = deck.assets?.[ref.kind];
    const url = block?.[ref.slug];
    if (!url) {
      rows.push({ ref, url: null, probe: null, violations: [], probeError: 'Slug not registered in deck.assets — run check:assets.' });
      continue;
    }
    const fsPath = urlToFsPath(url);
    if (!fsPath) {
      // Remote URL — skip probing (CORS / opaque).
      rows.push({ ref, url, probe: null, violations: [], probeError: 'Remote URL — probe skipped.' });
      continue;
    }
    if (!existsSync(fsPath)) {
      rows.push({ ref, url, probe: null, violations: [], probeError: `File missing at ${fsPath}.` });
      continue;
    }
    let probe: ProbeResult;
    try {
      probe = probeFile(fsPath, urlExtension(url));
    } catch (err) {
      rows.push({ ref, url, probe: null, violations: [], probeError: `Probe failed: ${(err as Error).message}` });
      continue;
    }
    const rule = deck.assetConstraints?.[ref.kind];
    const violations = evaluate(ref, url, probe, rule).sort((a, b) => a.rule.localeCompare(b.rule));
    rows.push({ ref, url, probe, violations, probeError: null });
  }

  // Strict-references pass — only run when the flag is set so the default
  // audit output stays exactly as it was before v0.174.
  const missingRefs: MissingReference[] = strictReferences
    ? collectMissingReferences(deck, slides)
    : [];

  // Resolution-audit pass — independent of strict-references. Discovers
  // sibling deck slugs once so the cross-deck check can fire.
  const allResolutionFindings: ResolutionFinding[] = resolutionAudit
    ? collectResolutionFindings(deck, slides, {
        repoRoot: REPO_ROOT,
        otherDeckSlugs: discoverOtherDeckSlugs(REPO_ROOT, deck.deckSlug),
      })
    : [];
  // v0.189 — drop classes the user marked `--severity {class}=off`. The
  // filter happens BEFORE rendering so off-classes don't appear in the
  // markdown report, console output, or sidecar exports — exactly the
  // "I never want to see this" semantics the flag promises.
  const resolutionFindings = allResolutionFindings.filter(
    (f) => severity[f.class] !== 'off',
  );
  // Partition surviving findings by their resolved severity for the
  // console summary + exit-code logic below.
  const errorFindings = resolutionFindings.filter((f) => severity[f.class] === 'error');
  const warnFindings = resolutionFindings.filter((f) => severity[f.class] === 'warn');

  const exportRows = buildExportRows(rows, missingRefs, resolutionFindings, severity);
  const baseName = `asset-resolution-audit-${deck.deckSlug ?? 'deck'}`;
  // Render the primary output in the requested format. CSV / JSON share
  // the row builder above so spreadsheet importers don't need to understand
  // the markdown structure.
  let primaryBody: string;
  let primaryExt: string;
  if (primaryFormat === 'csv') {
    primaryBody = renderCsv(exportRows);
    primaryExt = 'csv';
  } else if (primaryFormat === 'json') {
    primaryBody = renderJson(deckPath, deck, exportRows, { strictReferences, resolutionAudit });
    primaryExt = 'json';
  } else {
    primaryBody = renderReport(deckPath, deck, rows, missingRefs, strictReferences, resolutionFindings, resolutionAudit);
    primaryExt = 'md';
  }
  const outPath = outArg ?? `/mnt/documents/${baseName}.${primaryExt}`;
  writeFileSync(outPath, primaryBody);

  // Sidecar exports — only written when explicitly requested. Each can
  // take an explicit path; otherwise we drop next to the primary report.
  const sidecarPaths: string[] = [];
  if (exportCsv != null && primaryFormat !== 'csv') {
    const p = typeof exportCsv === 'string'
      ? exportCsv
      : `/mnt/documents/${baseName}.csv`;
    writeFileSync(p, renderCsv(exportRows));
    sidecarPaths.push(p);
  }
  if (exportJson != null && primaryFormat !== 'json') {
    const p = typeof exportJson === 'string'
      ? exportJson
      : `/mnt/documents/${baseName}.json`;
    writeFileSync(p, renderJson(deckPath, deck, exportRows, { strictReferences, resolutionAudit }));
    sidecarPaths.push(p);
  }
  if (exportSummary != null) {
    // Format inferred from the explicit path's extension; default .md
    // when no path was supplied — markdown is the most reviewer-friendly
    // shape for a one-shot summary.
    const summary = buildSummary(exportRows);
    const explicit = typeof exportSummary === 'string' ? exportSummary : null;
    const ext = explicit ? (explicit.match(/\.([a-z]+)$/i)?.[1].toLowerCase() ?? 'md') : 'md';
    const p = explicit ?? `/mnt/documents/${baseName}-summary.md`;
    let body: string;
    if (ext === 'csv') body = renderSummaryCsv(summary);
    else if (ext === 'json') body = renderSummaryJson(deckPath, deck, summary, { strictReferences, resolutionAudit });
    else body = renderSummaryMarkdown(deckPath, deck, summary);
    writeFileSync(p, body);
    sidecarPaths.push(p);
  }

  // Console summary.
  const violations = rows.flatMap((r) => r.violations);
  const probeErrors = rows.filter((r) => r.probeError);
  const flags: string[] = [];
  if (strictReferences) flags.push('strict-references ON');
  if (resolutionAudit) flags.push('resolution-audit ON');
  console.log(`\n  Deck: ${deck.deckSlug ?? deckPath}  ·  ${rows.length} asset${rows.length === 1 ? '' : 's'} audited${flags.length ? '  ·  ' + flags.join(' · ') : ''}`);
  const cleanCount = rows.length - probeErrors.length - new Set(violations.map((v) => `${v.kind}:${v.slug}`)).size;
  const tailParts: string[] = [];
  if (strictReferences) tailParts.push(`📎 ${missingRefs.length} missing reference${missingRefs.length === 1 ? '' : 's'}`);
  if (resolutionAudit) tailParts.push(`🔎 ${resolutionFindings.length} resolution finding${resolutionFindings.length === 1 ? '' : 's'}`);
  const tail = tailParts.length ? '   ' + tailParts.join('   ') : '';
  console.log(`  ✅ ${cleanCount} clean   ❌ ${violations.length} violation${violations.length === 1 ? '' : 's'}   ⚠️  ${probeErrors.length} probe error${probeErrors.length === 1 ? '' : 's'}${tail}`);

  for (const r of rows) {
    if (r.violations.length === 0 && !r.probeError) continue;
    console.log(`\n    ${r.ref.kind}/${r.ref.slug}  (${r.url ?? '?'})`);
    if (r.probeError) console.log(`      ⚠️  ${r.probeError}`);
    for (const v of r.violations) {
      console.log(`      ✗ ${v.rule}: expected ${v.expected}, got ${v.actual}`);
    }
  }
  if (strictReferences && missingRefs.length > 0) {
    console.log('\n  Missing references:');
    for (const m of missingRefs) {
      const ks = m.kind && m.slug ? `${m.kind}/${m.slug}` : '—';
      console.log(`    📎 [${m.category}] ${ks}  ${m.url}  ↳ ${m.deckJsonPath}`);
    }
  }
  if (resolutionAudit && resolutionFindings.length > 0) {
    // Print the severity map up front so the reader can map symbols
    // to "will this fail CI?" without scrolling back to the flag list.
    const map = (['shape', 'mime', 'case-drift', 'orphan'] as ResolutionFindingClass[])
      .map((c) => `${c}=${severity[c]}`).join(' · ');
    const droppedCount = allResolutionFindings.length - resolutionFindings.length;
    const dropTag = droppedCount > 0 ? `   (${droppedCount} suppressed via severity=off)` : '';
    console.log(`\n  Resolution findings   [severity: ${map}]${dropTag}`);
    // Group by class so the console summary is scannable even with many findings.
    const groups = new Map<ResolutionFindingClass, ResolutionFinding[]>();
    for (const f of resolutionFindings) {
      const arr = groups.get(f.class) ?? [];
      arr.push(f);
      groups.set(f.class, arr);
    }
    for (const cls of ['shape', 'mime', 'case-drift', 'orphan'] as ResolutionFindingClass[]) {
      const arr = groups.get(cls);
      if (!arr || arr.length === 0) continue;
      const lvl = severity[cls];
      const sym = lvl === 'error' ? '❌' : '⚠️ ';
      console.log(`    ${sym} [${cls}: ${lvl}] ${arr.length}`);
      for (const f of arr) {
        console.log(`      🔎 ${f.url}`);
        console.log(`         ${f.reason}`);
        if (f.hint) console.log(`         ↳ ${f.hint}`);
        console.log(`         at ${f.deckJsonPath}`);
      }
    }
  }
  console.log(`\n  📄 Full report: ${outPath}`);
  for (const p of sidecarPaths) {
    console.log(`  📄 Sidecar export: ${p}`);
  }
  if (warnFindings.length > 0 && errorFindings.length === 0) {
    console.log(`\n  ⚠️  ${warnFindings.length} resolution warning${warnFindings.length === 1 ? '' : 's'} (severity=warn) — exit 0. Promote to error via --severity to fail CI.`);
  }

  // v0.189 — exit code now ignores `warn`-level resolution findings.
  // Hard correctness failures (probe errors, constraint violations,
  // missing refs) still always bump to 2; resolution findings only
  // do so when the user mapped their class to `error`.
  if (
    probeErrors.length > 0 ||
    violations.length > 0 ||
    missingRefs.length > 0 ||
    errorFindings.length > 0
  ) return 2;
  return 0;
}

// Only auto-run when invoked directly. v0.176 introduced
// `scripts/suggest-asset-constraints.ts` which imports the helpers above —
// without this guard the importer would re-trigger main() and exit 0/2 on
// the wrong deck before the suggester could do anything.
if ((import.meta as ImportMeta & { main?: boolean }).main) {
  process.exit(main());
}
