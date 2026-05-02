/**
 * Theme import / export.
 *
 * Companion to `manifest.ts` (deck import/export). Lets a presenter share
 * a custom palette as a single JSON file the same way decks travel.
 *
 * ## What's portable
 * The serializable shape is intentionally a strict subset of the in-memory
 * `ThemePreset`:
 *   - id (string, must be unique against built-ins on import — collisions
 *     are auto-suffixed with `-imported`)
 *   - label, description
 *   - swatch (4-color picker preview)
 *   - appearance ('light' | 'dark', optional)
 *   - vars (HSL-triplet token map applied to `:root`)
 *   - fonts (optional display/body/mono CSS font-family strings)
 *
 * ## Runtime overlay
 * Imported themes are persisted under `riseup.themes.custom.v1` and
 * registered into the in-memory `THEMES` registry at boot
 * (see `registerCustomThemesOnBoot()` called from `main.tsx`). Built-in
 * themes always win on id collision — imports cannot shadow `noir-gold`
 * etc., they get auto-suffixed instead.
 *
 * ## Why a separate file (not inside `manifest.ts`)
 * Decks and themes have independent lifecycles:
 *   - You can import a custom theme once and use it across many decks.
 *   - Resetting a deck to bundled MUST NOT wipe imported themes.
 *   - A deck manifest's `deck.theme` is just a string id — it doesn't carry
 *     the palette, so the receiving project still needs the theme installed
 *     (built-in or imported separately) for the export to render correctly.
 */

import { THEMES, type ThemePreset, type ThemeId } from './themes';

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */

export type ThemeManifestVersion = 1;

const CURRENT_VERSION: ThemeManifestVersion = 1;
const SUPPORTED_VERSIONS: readonly ThemeManifestVersion[] = [1];

/** localStorage slot for imported custom themes. Survives deck reset. */
export const CUSTOM_THEMES_STORAGE_KEY = 'riseup.themes.custom.v1';

/** Single-theme manifest. */
export interface ThemeManifest {
  manifestVersion: ThemeManifestVersion;
  exportedAt: string;
  /** Originating deck slug — informational only. */
  source?: string;
  theme: SerializableTheme;
}

/**
 * The serializable subset of `ThemePreset`. Mirrors the runtime shape
 * but uses a plain `string` id (not `ThemeId`) since imports may
 * introduce ids the build doesn't statically know about.
 */
export interface SerializableTheme {
  id: string;
  label: string;
  description: string;
  swatch: string[];
  appearance?: 'light' | 'dark';
  vars: Record<string, string>;
  fonts?: {
    display?: string;
    body?: string;
    mono?: string;
  };
}

/* ------------------------------------------------------------------ */
/* Build / parse                                                       */
/* ------------------------------------------------------------------ */

/** Build a manifest for a known theme id (built-in or already imported). */
export function buildThemeManifest(id: ThemeId | string, sourceSlug?: string): ThemeManifest {
  const preset = THEMES[id as ThemeId];
  if (!preset) throw new Error(`Unknown theme id: ${id}`);
  const theme: SerializableTheme = {
    id: preset.id,
    label: preset.label,
    description: preset.description,
    swatch: [...preset.swatch],
    ...(preset.appearance ? { appearance: preset.appearance } : {}),
    vars: { ...preset.vars },
    ...(preset.fonts ? { fonts: { ...preset.fonts } } : {}),
  };
  return {
    manifestVersion: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    source: sourceSlug,
    theme,
  };
}

function isSupportedVersion(v: unknown): v is ThemeManifestVersion {
  return typeof v === 'number' && (SUPPORTED_VERSIONS as readonly number[]).includes(v);
}

/** Validate an unknown JSON value as a ThemeManifest. Throws on failure. */
export function parseThemeManifest(raw: unknown): ThemeManifest {
  if (!raw || typeof raw !== 'object') throw new Error('Theme manifest must be a JSON object.');
  const m = raw as Partial<ThemeManifest>;
  if (!isSupportedVersion(m.manifestVersion)) {
    throw new Error(
      `Unsupported theme manifestVersion: ${String(m.manifestVersion)}. ` +
        `This build accepts ${SUPPORTED_VERSIONS.join(', ')}.`,
    );
  }
  const t = m.theme;
  if (!t || typeof t !== 'object') throw new Error('Theme manifest is missing `theme`.');
  const tt = t as Partial<SerializableTheme>;
  if (typeof tt.id !== 'string' || !tt.id) throw new Error('Theme is missing a non-empty `id`.');
  if (typeof tt.label !== 'string' || !tt.label) throw new Error('Theme is missing a `label`.');
  if (typeof tt.description !== 'string') throw new Error('Theme is missing a `description`.');
  if (!Array.isArray(tt.swatch) || tt.swatch.length === 0) {
    throw new Error('Theme `swatch` must be a non-empty array of colors.');
  }
  if (!tt.vars || typeof tt.vars !== 'object') throw new Error('Theme `vars` must be an object.');
  for (const [k, v] of Object.entries(tt.vars)) {
    if (typeof v !== 'string') throw new Error(`Theme var \`${k}\` must be a string.`);
  }
  return m as ThemeManifest;
}

/**
 * Trigger a browser download of a theme manifest.
 *
 * Filename strategy (collision-safe + human-readable):
 *   `riseup-theme-{label-slug}-{id-slug}-{YYYY-MM-DD}-{HHMMSS}.json`
 * The HH-MM-SS suffix means re-exporting the same theme twice in one
 * day still produces a unique filename, so the browser never appends
 * its own ` (1)` / ` (2)` disambiguators.
 */
export function downloadThemeManifest(manifest: ThemeManifest, filename?: string) {
  const slug = (s: string) =>
    s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
      .replace(/[^a-z0-9]+/gi, '-')      // non-alphanum → dash
      .replace(/^-+|-+$/g, '')           // trim dashes
      .toLowerCase()
      .slice(0, 40) || 'theme';

  const labelSlug = slug(manifest.theme.label || manifest.theme.id);
  const idSlug = slug(manifest.theme.id);
  // Avoid duplicating the same token twice (label and id are often the same).
  const stem = labelSlug === idSlug ? labelSlug : `${labelSlug}-${idSlug}`;

  const exported = new Date(manifest.exportedAt);
  const date = isNaN(exported.getTime())
    ? new Date().toISOString().slice(0, 10)
    : exported.toISOString().slice(0, 10);
  const time = (isNaN(exported.getTime()) ? new Date() : exported)
    .toISOString()
    .slice(11, 19)
    .replace(/:/g, ''); // HHMMSS

  const name = filename ?? `riseup-theme-${stem}-${date}-${time}.json`;
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

/* ------------------------------------------------------------------ */
/* Custom-theme registry (localStorage overlay)                        */
/* ------------------------------------------------------------------ */

/** IDs of built-in themes — never overwritable by imports. */
const BUILTIN_IDS = new Set(Object.keys(THEMES));

/** Read all imported custom themes from localStorage. Safe in SSR. */
export function readCustomThemes(): SerializableTheme[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is SerializableTheme =>
      x && typeof x === 'object' && typeof (x as SerializableTheme).id === 'string',
    );
  } catch {
    return [];
  }
}

function writeCustomThemes(themes: SerializableTheme[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(themes));
  } catch {
    /* ignore quota / privacy-mode failures */
  }
}

/**
 * Resolve a non-colliding id for an incoming theme. Built-in ids cannot
 * be shadowed; on collision we suffix `-imported`, then `-imported-2`, etc.
 */
function resolveImportId(desired: string, existing: ReadonlySet<string>): string {
  if (!BUILTIN_IDS.has(desired) && !existing.has(desired)) return desired;
  const base = BUILTIN_IDS.has(desired) ? `${desired}-imported` : desired;
  if (!existing.has(base) && !BUILTIN_IDS.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!existing.has(candidate) && !BUILTIN_IDS.has(candidate)) return candidate;
  }
  // Pathological fallback — timestamped to guarantee uniqueness.
  return `${base}-${Date.now()}`;
}

/**
 * Compute (without mutating anything) the id that `installThemeManifest`
 * would actually use for the given manifest, AND whether the desired id
 * collides with a built-in or another already-imported theme. Used by
 * the validation preview dialog to warn the presenter ahead of install.
 */
export function previewImportId(manifest: ThemeManifest): {
  finalId: string;
  collides: boolean;
} {
  const desired = manifest.theme.id;
  const existing = readCustomThemes();
  const existingIds = new Set(existing.map((t) => t.id));

  // Match installThemeManifest's own logic: importing the same custom id
  // again updates in place (no suffix, no collision).
  if (existingIds.has(desired) && !BUILTIN_IDS.has(desired)) {
    return { finalId: desired, collides: false };
  }
  const collides = BUILTIN_IDS.has(desired) || existingIds.has(desired);
  const finalId = resolveImportId(desired, existingIds);
  return { finalId, collides };
}

/**
 * Install a parsed theme manifest into the persistent custom-theme list
 * AND the in-memory THEMES registry. Returns the final id used (may
 * differ from the incoming id if collision-suffixed).
 *
 * Idempotent: importing the same id twice updates the existing entry
 * in place (no auto-suffix).
 */
export function installThemeManifest(manifest: ThemeManifest): string {
  const incoming = manifest.theme;
  const existing = readCustomThemes();
  const existingIds = new Set(existing.map((t) => t.id));

  // Existing custom id → in-place update. Otherwise resolve a fresh id.
  let finalId = incoming.id;
  if (!existingIds.has(incoming.id)) {
    finalId = resolveImportId(incoming.id, existingIds);
  }

  const stored: SerializableTheme = { ...incoming, id: finalId };
  const next = existing.filter((t) => t.id !== finalId).concat(stored);
  writeCustomThemes(next);
  registerInMemory(stored);
  return finalId;
}

/** Remove an imported theme by id. Built-ins are ignored. */
export function uninstallCustomTheme(id: string): void {
  if (BUILTIN_IDS.has(id)) return;
  const next = readCustomThemes().filter((t) => t.id !== id);
  writeCustomThemes(next);
  // Drop the runtime entry too so the picker stops listing it. We delete
  // by string key because `THEMES` is typed against the static union but
  // we've been adding string-keyed entries at runtime.
  delete (THEMES as Record<string, ThemePreset>)[id];
}

function toPreset(s: SerializableTheme): ThemePreset {
  return {
    id: s.id as ThemeId,
    label: s.label,
    description: s.description,
    swatch: [...s.swatch],
    ...(s.appearance ? { appearance: s.appearance } : {}),
    vars: { ...s.vars },
    ...(s.fonts ? { fonts: { ...s.fonts } } : {}),
  };
}

function registerInMemory(theme: SerializableTheme): void {
  if (BUILTIN_IDS.has(theme.id)) return; // never shadow built-ins
  (THEMES as Record<string, ThemePreset>)[theme.id] = toPreset(theme);
}

/**
 * Boot-time hook: hydrate the THEMES registry from localStorage so
 * imported palettes appear in the picker AND can be applied as the
 * initial theme. MUST be called before `applyTheme()` in `main.tsx`.
 */
export function registerCustomThemesOnBoot(): void {
  for (const t of readCustomThemes()) registerInMemory(t);
}

/** True if `id` was imported (i.e. not a built-in). */
export function isCustomThemeId(id: string): boolean {
  return !BUILTIN_IDS.has(id) && Object.prototype.hasOwnProperty.call(THEMES, id);
}
