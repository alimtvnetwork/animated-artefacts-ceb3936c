/**
 * Bulk theme import / export.
 *
 * Wraps the single-theme `themeManifest` helpers so a presenter can ship
 * every custom palette in one file (and re-import the whole set). Built-in
 * themes are included for portability, but `installAllThemes` relies on
 * `installThemeManifest`, which refuses to shadow built-ins — so importing a
 * bundle into a fresh project only ever installs the customs.
 */

import { THEMES, type ThemeId } from './themes';
import {
  buildThemeManifest,
  installThemeManifest,
  isCustomThemeId,
  type SerializableTheme,
} from './themeManifest';
import { downloadJson } from './downloadJson';

export type ThemeBundleVersion = 1;

const BUNDLE_VERSION: ThemeBundleVersion = 1;

export interface ThemeBundle {
  manifestVersion: ThemeBundleVersion;
  exportedAt: string;
  themes: SerializableTheme[];
}

/** Collect serializable themes — customs only by default, or all built-ins too. */
export function collectThemes(includeBuiltins: boolean): SerializableTheme[] {
  const ids = (Object.keys(THEMES) as ThemeId[]).filter(
    (id) => includeBuiltins || isCustomThemeId(id),
  );
  return ids.map((id) => buildThemeManifest(id).theme);
}

/** Build a bundle of every available theme (built-ins + imported customs). */
export function buildThemeBundle(): ThemeBundle {
  return {
    manifestVersion: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    themes: collectThemes(true),
  };
}

/** Build + download the full theme bundle. Returns the filename used. */
export function exportAllThemes(): string {
  const bundle = buildThemeBundle();
  const date = bundle.exportedAt.slice(0, 10);
  const filename = `riseup-themes-all-${date}.json`;
  downloadJson(bundle, filename);
  return filename;
}

function isSerializableTheme(x: unknown): x is SerializableTheme {
  if (!x || typeof x !== 'object') return false;
  const t = x as Partial<SerializableTheme>;
  return typeof t.id === 'string' && Array.isArray(t.swatch) && !!t.vars;
}

/** Validate an unknown JSON value as a ThemeBundle. Throws on failure. */
export function parseThemeBundle(raw: unknown): ThemeBundle {
  if (!raw || typeof raw !== 'object') throw new Error('Theme bundle must be a JSON object.');
  const b = raw as Partial<ThemeBundle>;
  if (b.manifestVersion !== BUNDLE_VERSION) {
    throw new Error(`Unsupported theme bundle version: ${String(b.manifestVersion)}.`);
  }
  if (!Array.isArray(b.themes) || !b.themes.every(isSerializableTheme)) {
    throw new Error('Theme bundle `themes` must be an array of themes.');
  }
  return b as ThemeBundle;
}

/** Install every theme in a bundle. Returns the count actually installed. */
export function installAllThemes(bundle: ThemeBundle): number {
  let installed = 0;
  for (const theme of bundle.themes) {
    installThemeManifest({ manifestVersion: 1, exportedAt: bundle.exportedAt, theme });
    installed++;
  }
  return installed;
}
