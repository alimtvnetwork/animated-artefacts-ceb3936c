/**
 * Full-deck ZIP bundle (export + import).
 *
 * The last "Soon" rows in the import/export menu. A bundle packs the entire
 * deck manifest and the full theme set into a single `.zip` so a presenter
 * can hand off everything (slides + palettes) in one file:
 *
 *   riseup-bundle-<slug>-<date>.zip
 *     ├── deck.json     → DeckManifest  (parseManifest)
 *     ├── themes.json   → ThemeBundle   (parseThemeBundle)
 *     └── bundle.json   → BundleMeta    (version + provenance)
 *
 * JSON stays the only source of truth — images are referenced by path, never
 * inlined, matching the manifest contract. Import validates BOTH documents
 * before mutating any storage, so a corrupt archive fails loudly instead of
 * half-applying.
 */

import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { buildManifest, parseManifest, type DeckManifest } from './manifest';
import {
  buildThemeBundle,
  parseThemeBundle,
  installAllThemes,
  type ThemeBundle,
} from './themeBulk';
import { deck, allSlides, IMPORTED_MANIFEST_KEY } from './loader';

export type BundleVersion = 1;
const BUNDLE_VERSION: BundleVersion = 1;

const DECK_ENTRY = 'deck.json';
const THEMES_ENTRY = 'themes.json';
const META_ENTRY = 'bundle.json';

export interface BundleMeta {
  bundleVersion: BundleVersion;
  exportedAt: string;
  source: string;
}

export interface ParsedBundle {
  manifest: DeckManifest;
  themes: ThemeBundle;
  meta: BundleMeta;
}

export interface BundleImportResult {
  manifest: DeckManifest;
  slideCount: number;
  themeCount: number;
}

/** Build the in-memory zip bytes for the current deck + all themes. */
export function buildBundleZip(): { bytes: Uint8Array; filename: string } {
  const manifest = buildManifest(deck, allSlides);
  const themes = buildThemeBundle();
  const exportedAt = new Date().toISOString();
  const meta: BundleMeta = { bundleVersion: BUNDLE_VERSION, exportedAt, source: deck.deckSlug };

  const files: Record<string, Uint8Array> = {
    [DECK_ENTRY]: strToU8(JSON.stringify(manifest, null, 2)),
    [THEMES_ENTRY]: strToU8(JSON.stringify(themes, null, 2)),
    [META_ENTRY]: strToU8(JSON.stringify(meta, null, 2)),
  };
  const bytes = zipSync(files, { level: 6 });
  const filename = `riseup-bundle-${deck.deckSlug}-${exportedAt.slice(0, 10)}.zip`;
  return { bytes, filename };
}

/** Build + download the full deck bundle. Returns the filename used. */
export function exportBundleZip(): string {
  const { bytes, filename } = buildBundleZip();
  // Copy into a fresh ArrayBuffer-backed view so Blob accepts it cleanly.
  const blob = new Blob([bytes.slice()], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  console.info(`[zipBundle] Exported ${filename} (${bytes.length} bytes).`);
  return filename;
}

/** Parse + validate zip bytes into a deck manifest and theme bundle. Throws on any problem. */
export function parseBundleZip(bytes: Uint8Array): ParsedBundle {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch (err) {
    throw new Error(`Not a readable ZIP archive: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!entries[DECK_ENTRY]) throw new Error(`Bundle is missing ${DECK_ENTRY}.`);
  if (!entries[THEMES_ENTRY]) throw new Error(`Bundle is missing ${THEMES_ENTRY}.`);

  const manifest = parseManifest(JSON.parse(strFromU8(entries[DECK_ENTRY])));
  const themes = parseThemeBundle(JSON.parse(strFromU8(entries[THEMES_ENTRY])));

  const rawMeta = entries[META_ENTRY] ? JSON.parse(strFromU8(entries[META_ENTRY])) : undefined;
  const meta: BundleMeta =
    rawMeta && typeof rawMeta === 'object'
      ? (rawMeta as BundleMeta)
      : { bundleVersion: BUNDLE_VERSION, exportedAt: manifest.exportedAt, source: manifest.source ?? 'unknown' };

  return { manifest, themes, meta };
}

/**
 * Apply a parsed bundle: install all custom themes, then persist the deck
 * manifest for the next reload. Themes are applied first so the imported
 * deck boots with its palette already available.
 */
export function applyBundle(parsed: ParsedBundle): BundleImportResult {
  const themeCount = installAllThemes(parsed.themes);
  window.localStorage.setItem(IMPORTED_MANIFEST_KEY, JSON.stringify(parsed.manifest));
  console.info(
    `[zipBundle] Applied bundle: ${parsed.manifest.slides.length} slide(s), ${themeCount} custom theme(s).`,
  );
  return { manifest: parsed.manifest, slideCount: parsed.manifest.slides.length, themeCount };
}

/** Read a File, validate, and apply it. Returns the import summary. */
export async function importBundleFile(file: File): Promise<BundleImportResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const parsed = parseBundleZip(bytes);
  return applyBundle(parsed);
}
