import type { DeckSpec, SlideSpec } from './types';
import { coerceThemeId, getStoredTheme, type ThemeId } from './themes';

/**
 * A self-contained, portable representation of an entire deck:
 * the deck spec + every slide spec inlined into one JSON document.
 *
 * Use this to move presentations between projects, share with a teammate,
 * or back up a deck before refactoring. JSON is the only source of truth —
 * no images are inlined; image paths must be resolvable in the destination
 * project (or replaced with absolute URLs before export).
 *
 * The active theme id is written into `deck.theme` at export time so the
 * receiving project applies the same palette on import.
 */
/**
 * Manifest schema version history:
 *   - v1: original shape — `manifestVersion`, `exportedAt`, `source?`,
 *         `deck`, `slides`. No `editor` block.
 *   - v2: added optional `editor.themeDebug` so the ThemeMenu debug panel
 *         state round-trips across export/import.
 *
 * Imports of older versions are upgraded in-place by {@link parseManifest}
 * (any missing fields default safely — e.g. `editor.themeDebug` becomes
 * `undefined`, which import sites treat as "leave the current local
 * preference untouched"). Bumping `CURRENT_VERSION` on a breaking change
 * lets us reject incompatible files with a clear error rather than
 * crashing later at runtime.
 */
export type ManifestVersion = 1 | 2;

export interface DeckManifest {
  /** Bumped when the manifest shape changes. Importer accepts any known version. */
  manifestVersion: ManifestVersion;
  /** ISO-8601 UTC timestamp of when this manifest was produced. */
  exportedAt: string;
  /** Original source slug (e.g. "showcase"). Informational. */
  source?: string;
  /** Top-level deck metadata. `deck.theme` carries the palette id. */
  deck: DeckSpec;
  /** Every slide in the deck, in display order. Includes disabled slides (`enabled: false`). */
  slides: SlideSpec[];
  /**
   * Optional editor-only state that doesn't belong on the deck spec but
   * should round-trip across export/import so a reviewer's setup is
   * reproducible. Anything here is purely a UX convenience — runtime
   * rendering must never depend on it.
   *
   * Added in manifestVersion 2. Always absent on v1 imports — readers must
   * tolerate `undefined` and fall back to the user's current local state.
   */
  editor?: {
    /** Whether the ThemeMenu debug panel was open at export time. */
    themeDebug?: boolean;
  };
}

/** localStorage key shared with `ThemeMenu` for the debug panel toggle. */
export const THEME_DEBUG_STORAGE_KEY = 'slides:theme-menu-debug';

/** Read the persisted ThemeMenu debug flag. Safe in SSR / privacy mode. */
export function readThemeDebugFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(THEME_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Persist the ThemeMenu debug flag. No-op in SSR / privacy mode. */
export function writeThemeDebugFlag(on: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_DEBUG_STORAGE_KEY, on ? '1' : '0');
  } catch {
    /* ignore quota / privacy-mode failures */
  }
}

const CURRENT_VERSION: ManifestVersion = 2;
const SUPPORTED_VERSIONS: readonly ManifestVersion[] = [1, 2];

/** True if `v` is a manifest version this build can import. */
export function isSupportedManifestVersion(v: unknown): v is ManifestVersion {
  return typeof v === 'number' && (SUPPORTED_VERSIONS as readonly number[]).includes(v);
}

/** Options for {@link buildManifest}. */
export interface BuildManifestOptions {
  /** Override the active theme. Defaults to the user's stored selection. */
  themeId?: ThemeId;
  /**
   * Whether to include the ThemeMenu debug toggle in `editor.themeDebug`.
   * Defaults to true so debug state round-trips by default; set false from
   * the export modal to ship a "clean" manifest with no editor metadata.
   */
  includeThemeDebug?: boolean;
}

/**
 * Build a manifest from the deck + slides currently loaded in memory.
 * Stamps the currently-active theme into `deck.theme` so the export carries
 * the palette choice. Always emits the latest CURRENT_VERSION shape.
 */
export function buildManifest(
  deck: DeckSpec,
  slides: SlideSpec[],
  optionsOrThemeId?: BuildManifestOptions | ThemeId,
): DeckManifest {
  const opts: BuildManifestOptions =
    typeof optionsOrThemeId === 'string'
      ? { themeId: optionsOrThemeId }
      : optionsOrThemeId ?? {};
  const includeThemeDebug = opts.includeThemeDebug ?? true;

  const ordered = [...slides].sort((a, b) => a.slideNumber - b.slideNumber);
  const theme = opts.themeId ?? getStoredTheme();
  const manifest: DeckManifest = {
    manifestVersion: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    source: deck.deckSlug,
    deck: { ...deck, theme },
    slides: ordered,
  };
  if (includeThemeDebug) {
    manifest.editor = { themeDebug: readThemeDebugFlag() };
  }
  return manifest;
}

/** Read the theme id stored on a manifest's deck, defaulting to the system default. */
export function manifestTheme(m: DeckManifest): ThemeId {
  return coerceThemeId(m.deck.theme);
}

/**
 * Validate an unknown JSON value as a DeckManifest. Returns the parsed
 * manifest on success or throws an Error with a human-readable reason.
 *
 * Accepts any version listed in {@link SUPPORTED_VERSIONS}. Older versions
 * are upgraded in-place: missing optional fields stay missing (callers must
 * tolerate `undefined`), so a v1 file imports cleanly with `editor` absent
 * — the ThemeMenu debug toggle then defaults to the user's current local
 * preference rather than crashing the import.
 */
export function parseManifest(raw: unknown): DeckManifest {
  if (!raw || typeof raw !== 'object') throw new Error('Manifest must be a JSON object.');
  const m = raw as Partial<DeckManifest>;
  if (!isSupportedManifestVersion(m.manifestVersion)) {
    throw new Error(
      `Unsupported manifestVersion: ${String(m.manifestVersion)}. ` +
        `This build accepts ${SUPPORTED_VERSIONS.join(', ')}.`,
    );
  }
  if (!m.deck || typeof m.deck !== 'object') throw new Error('Manifest is missing `deck`.');
  if (!Array.isArray(m.slides) || m.slides.length === 0) {
    throw new Error('Manifest must contain a non-empty `slides` array.');
  }
  const seen = new Set<number>();
  for (const s of m.slides) {
    if (!s || typeof s !== 'object') throw new Error('Each slide must be an object.');
    if (typeof s.slideNumber !== 'number') throw new Error('Each slide needs a numeric `slideNumber`.');
    if (seen.has(s.slideNumber)) throw new Error(`Duplicate slideNumber: ${s.slideNumber}.`);
    seen.add(s.slideNumber);
    if (!s.slideType || !s.content) throw new Error(`Slide ${s.slideNumber} is missing slideType or content.`);
  }
  // v1 → v2 upgrade is a no-op at the data level: `editor` simply stays
  // undefined. We only need to bump the surfaced version so downstream
  // code that branches on `manifestVersion` (e.g. UI status notes) sees a
  // consistent shape after parse.
  return m as DeckManifest;
}

/** Trigger a browser download of the manifest as a JSON file. */
export function downloadManifest(manifest: DeckManifest, filename?: string) {
  const name = filename ?? `${manifest.deck.deckSlug}-deck-${manifest.exportedAt.slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
