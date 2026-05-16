import type { SlideSpec, DeckSpec } from './types';
import { parseManifest, type DeckManifest } from './manifest';
import { validateSlide, type SlideValidationIssue } from './contracts';
import { checkDensity, type DensityViolation } from './densityCheck';
import { validateAgainstCatalog, formatCatalogViolations } from './validateAgainstCatalog';
import { normalize3DBullets, type BulletNormalizationEntry } from './normalize3DBullets';
import { initAssetRegistry, initAssetRegistrySoft, type DeckAssetPolicy } from './assetRegistry';
import { getValidationMode, type ValidationMode } from './validationMode';
import { detectMotionCollisions, type MotionCollisionWarning } from './motionCollisions';
import { auditSpecConfidence, type SpecConfidenceReport } from './specConfidence';
import {
  setActiveDeck as bindBrokenAssetDeck,
  markVerificationPassFinished,
} from './brokenAssetReport';

/** localStorage key for an imported deck manifest. Cleared by "Reset to bundled". */
export const IMPORTED_MANIFEST_KEY = 'riseup.deck.imported.v1';

/**
 * Multi-deck discovery (Option C — front-end/project/ layout).
 *
 * Per `spec/21-slides-system/architecture/architecture.md` §2.1, every deck
 * lives in `front-end/project/<slug>/` with this layout:
 *
 *   front-end/project/<slug>/
 *   ├── data/
 *   │   ├── slides.json         (manifest: Name + config + Slides[])
 *   │   └── slides/NN-name.json (per-slide payloads)
 *   └── spec/NN-name.md         (human-authoring notes)
 *
 * The two globs below pick up every manifest and every slide JSON. They
 * are joined by deck slug (the folder name).
 *
 * The active deck is selected once at module-init via the `?deck=<slug>`
 * query string, falling back to `'showcase'`. Switching decks requires a
 * reload — same model as the imported-manifest flow.
 */
const manifestModules = import.meta.glob('../../front-end/project/*/data/slides.json', { eager: true }) as Record<string, { default: unknown }>;
const slideModules    = import.meta.glob('../../front-end/project/*/data/slides/*.json', { eager: true }) as Record<string, { default: unknown }>;
const templateModules = import.meta.glob('../../front-end/slide-template/*.json', { eager: true }) as Record<string, { default: unknown }>;

/**
 * Per-slideType defaults, resolved once from
 * `front-end/slide-template/<Type>.json` `defaults` blocks. A slide JSON
 * that omits `transition` / `textAnimation` inherits the template value;
 * explicit slide values always win. Spec: architecture.md §2.3.
 */
const TEMPLATE_DEFAULTS: Record<string, { transition?: string; textAnimation?: string }> = (() => {
  const out: Record<string, { transition?: string; textAnimation?: string }> = {};
  for (const [path, mod] of Object.entries(templateModules)) {
    if (path.endsWith('/deck.json')) continue;
    const m = path.match(/front-end\/slide-template\/([^/]+)\.json$/);
    if (!m) continue;
    const data = mod.default as { templateName?: string; defaults?: { transition?: string; textAnimation?: string } } | null;
    const name = data?.templateName ?? m[1];
    if (data?.defaults) out[name] = data.defaults;
  }
  return out;
})();

function applyTemplateDefaults(slide: SlideSpec): SlideSpec {
  const defaults = TEMPLATE_DEFAULTS[slide.slideType];
  if (!defaults) return slide;
  if (slide.transition && slide.textAnimation) return slide;
  return {
    ...slide,
    transition: slide.transition ?? (defaults.transition as SlideSpec['transition']) ?? slide.transition,
    textAnimation: slide.textAnimation ?? (defaults.textAnimation as SlideSpec['textAnimation']) ?? slide.textAnimation,
  };
}

interface BundledDeckBundle { deck: DeckSpec; slides: SlideSpec[] }

/**
 * Manifest shape per architecture.md §2.1. Every legacy DeckSpec field
 * (assets, meeting, theme, presenter, assetConstraints, …) is preserved
 * inside `config` so the rest of the runtime keeps working unchanged.
 */
interface ProjectManifest {
  Name?: string;
  config?: Record<string, unknown> & { deckSlug?: string };
  Slides?: Array<{ title?: string; path?: string }>;
}

function isManifest(obj: unknown): obj is ProjectManifest {
  return typeof obj === 'object' && obj !== null && 'Slides' in obj;
}

/** Extract the deck-folder slug from a manifest path. */
function slugFromManifestPath(path: string): string | null {
  const m = path.match(/front-end\/project\/([^/]+)\/data\/slides\.json$/);
  return m ? m[1] : null;
}

/** Extract `<deck-slug>/<file>` from a per-slide path. */
function slidePathParts(path: string): { slug: string; file: string } | null {
  const m = path.match(/front-end\/project\/([^/]+)\/data\/slides\/([^/]+\.json)$/);
  return m ? { slug: m[1], file: m[2] } : null;
}

/** Convert manifest + raw slide map into a legacy-shaped DeckSpec + ordered SlideSpec[]. */
function discoverBundledDecks(): Map<string, BundledDeckBundle> {
  // Index every slide JSON by `slug/file` so manifest path entries can resolve.
  const slidesByKey = new Map<string, SlideSpec>();
  for (const [path, mod] of Object.entries(slideModules)) {
    const parts = slidePathParts(path);
    if (!parts) continue;
    const data = mod.default;
    if (data && typeof data === 'object' && 'slideNumber' in data) {
      slidesByKey.set(`${parts.slug}/${parts.file}`, applyTemplateDefaults(data as SlideSpec));
    }
  }

  const out = new Map<string, BundledDeckBundle>();
  for (const [path, mod] of Object.entries(manifestModules)) {
    const slug = slugFromManifestPath(path);
    if (!slug) continue;
    const raw = mod.default;
    if (!isManifest(raw)) continue;
    const cfg = raw.config ?? {};
    // Reconstruct the legacy DeckSpec shape — `deckSlug` + `deckName` +
    // every other field from `config`. Folder name wins as the canonical
    // slug if `config.deckSlug` is missing or disagrees.
    const deck = {
      ...cfg,
      deckSlug: slug,
      deckName: raw.Name ?? cfg.deckSlug ?? slug,
    } as unknown as DeckSpec;

    const slides: SlideSpec[] = [];
    for (const entry of raw.Slides ?? []) {
      if (!entry?.path) continue;
      // Manifest paths are like `./slides/01-title.json` — keep just the file.
      const file = entry.path.replace(/^\.\//, '').replace(/^slides\//, '');
      const slide = slidesByKey.get(`${slug}/${file}`);
      if (slide) slides.push(slide);
      else if (typeof console !== 'undefined') {
        console.warn(`[deck:${slug}] manifest references missing slide: ${entry.path}`);
      }
    }
    // Defensive: if manifest order is empty (or all entries missed), fall
    // back to slideNumber-sorted discovery so the deck still boots.
    if (slides.length === 0) {
      for (const [key, s] of slidesByKey) {
        if (key.startsWith(`${slug}/`)) slides.push(s);
      }
      slides.sort((a, b) => a.slideNumber - b.slideNumber);
    }
    out.set(slug, { deck, slides });
  }
  return out;
}

const bundledDecks = discoverBundledDecks();

/** All bundled deck slugs discovered under spec/slides/, alphabetical. */
export const availableDeckSlugs: readonly string[] = Object.freeze(
  Array.from(bundledDecks.keys()).sort(),
);

/** Read `?deck=<slug>` from the URL once at module-init. Falls back to
 *  `'showcase'` (the canonical demo deck). Unknown slugs also fall back so
 *  a typo never prevents boot. */
function resolveActiveSlug(): string {
  const preferred = 'session-4-ai-coding';
  const fallback = bundledDecks.has(preferred)
    ? preferred
    : (bundledDecks.has('showcase') ? 'showcase' : (availableDeckSlugs[0] ?? 'showcase'));
  if (typeof window === 'undefined') return fallback;
  try {
    const requested = new URLSearchParams(window.location.search).get('deck');
    if (requested && bundledDecks.has(requested)) return requested;
  } catch { /* ignore — fallback used */ }
  return fallback;
}

/** Slug of the deck currently rendering. `'showcase'` unless `?deck=<slug>`
 *  selects another bundled deck. Re-evaluated only on page reload. */
export const activeDeckSlug: string = resolveActiveSlug();

/** Read & validate the imported manifest from localStorage, or null if none/invalid. */
function loadImportedManifest(): DeckManifest | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(IMPORTED_MANIFEST_KEY);
    if (!raw) return null;
    return parseManifest(JSON.parse(raw));
  } catch (err) {
    // Corrupted manifest — drop it so we don't get stuck booting a bad deck.
    console.warn('[deck] Imported manifest invalid, falling back to bundled deck.', err);
    window.localStorage.removeItem(IMPORTED_MANIFEST_KEY);
    return null;
  }
}

function loadBundled(): BundledDeckBundle {
  const bundle = bundledDecks.get(activeDeckSlug);
  if (!bundle) {
    throw new Error(
      `Missing slides.json manifest for active deck slug "${activeDeckSlug}". ` +
      `Discovered decks: [${availableDeckSlugs.join(', ') || 'none'}]. ` +
      `Add front-end/project/${activeDeckSlug}/data/slides.json or pass ?deck=<existing-slug>.`,
    );
  }
  return bundle;
}

/**
 * Audit entry produced by `stripRejectedBrandStrip`. One entry per field
 * removed, so the on-screen audit panel can list exactly which deck/slide
 * the strip touched. Source `'imported'` means localStorage manifest;
 * `'bundled'` means the spec/showcase JSON files baked into the build
 * (a hit there indicates a content bug, not user data).
 */
export interface BrandStripAuditEntry {
  source: 'imported' | 'bundled';
  /** Where the field lived. `'deck'` = deck-level `brandStrip`. */
  scope: 'deck' | 'slide';
  /** Slide number when scope === 'slide'; null for deck-level strips. */
  slideNumber: number | null;
  /** Slide name for slide-scoped entries; deck slug for deck-scoped. */
  label: string;
  /** Raw value we removed (`true`, an object, etc.) — useful for the audit row. */
  removedValue: unknown;
}

/** Mutable buffer; flushed into the exported `brandStripAudit` after load. */
const auditBuffer: BrandStripAuditEntry[] = [];

function stripRejectedBrandStrip<T extends { deck?: DeckSpec; slides?: SlideSpec[] }>(
  payload: T,
  source: 'imported' | 'bundled',
): T {
  // User-rejected forever: remove BrandStrip from both bundled/imported deck
  // manifests and any slide overrides. This prevents older localStorage
  // imports from resurrecting the top logo/tagline banner. Every removal is
  // logged into `auditBuffer` so the on-screen audit panel can prove the
  // root-cause fix kept working across reloads / re-imports.
  if (payload.deck && 'brandStrip' in payload.deck) {
    const removed = (payload.deck as DeckSpec & { brandStrip?: unknown }).brandStrip;
    auditBuffer.push({
      source,
      scope: 'deck',
      slideNumber: null,
      label: payload.deck.deckSlug ?? 'deck',
      removedValue: removed,
    });
    delete (payload.deck as DeckSpec & { brandStrip?: unknown }).brandStrip;
  }
  payload.slides?.forEach((slide) => {
    if ('brandStrip' in slide && slide.brandStrip !== false) {
      auditBuffer.push({
        source,
        scope: 'slide',
        slideNumber: slide.slideNumber,
        label: slide.slideName ?? `slide-${slide.slideNumber}`,
        removedValue: slide.brandStrip,
      });
      slide.brandStrip = false;
    }
  });
  return payload;
}

function loadActive(): { deck: DeckSpec; slides: SlideSpec[]; isImported: boolean } {
  const imported = loadImportedManifest();
  if (imported) {
    const clean = stripRejectedBrandStrip(imported, 'imported');
    return {
      deck: clean.deck,
      slides: [...clean.slides].sort((a, b) => a.slideNumber - b.slideNumber),
      isImported: true,
    };
  }
  const bundled = stripRejectedBrandStrip(loadBundled(), 'bundled');
  return { ...bundled, isImported: false };
}

const cache = loadActive();

/**
 * Run the legacy `description.body` → `description.bullets[]` migration on
 * the loaded slides BEFORE validation. Mutates `cache.slides` in place
 * (mirrors how `stripRejectedBrandStrip` works above) so every downstream
 * consumer — validator, contract overlay, exports, AT readers — sees the
 * normalized, keyword-only shape.
 *
 * The audit array is exported so the dev console + the contract-issues
 * overlay can summarise what was migrated. Empty array means every loaded
 * deck was already on the modern bullets[] shape.
 *
 * Idempotent: re-running on already-normalized slides is a no-op.
 */
export const bulletNormalizationAudit: readonly BulletNormalizationEntry[] = (() => {
  const source: 'imported' | 'bundled' = cache.isImported ? 'imported' : 'bundled';
  const entries = normalize3DBullets(cache.slides, source);
  if (entries.length > 0 && typeof console !== 'undefined') {
    const slideCount = new Set(entries.map(e => e.slideNumber)).size;
    console.info(
      `[deck] Normalized ${entries.length} 3D step${entries.length === 1 ? '' : 's'} ` +
      `across ${slideCount} slide${slideCount === 1 ? '' : 's'} ` +
      `(legacy description.body → description.bullets[]). Source: ${source}.`,
    );
  }
  return Object.freeze(entries);
})();

export const deck = cache.deck;
export const allSlides = cache.slides;
/** True when the active deck came from an imported manifest (not the bundled spec). */
export const isImportedDeck = cache.isImported;

/**
 * v0.173 — opt-in non-fatal asset failures. Imported decks default to
 * soft-fail (a typo in a custom localStorage manifest shouldn't lock
 * the user out of the workspace), and any deck can opt in via
 * `assetPolicy.softFail: true`. The soft path funnels slug failures
 * into `BrokenAssetReport` (surfaced by `BrokenAssetOverlay`) instead
 * of throwing. Bundled showcase decks remain strict by default — a
 * regression there is a build-time bug we want to surface loudly.
 */
const declaredSoftFail = ((): boolean => {
  const policy = (deck as DeckSpec & { assetPolicy?: DeckAssetPolicy }).assetPolicy;
  return policy?.softFail === true;
})();
export const useSoftAssetFailures: boolean = isImportedDeck || declaredSoftFail;

// v0.181 — bind the broken-asset store to this deck's slug BEFORE running
// soft-fail validation so any failures the validators report are persisted
// (and any previously-persisted entries are hydrated, so the overlay can
// show "from previous session" entries before re-verification finishes).
// Imported decks have no `deckSlug` collision with bundled ones in
// practice, but we still scope by the active slug we actually loaded.
if (useSoftAssetFailures) {
  bindBrokenAssetDeck(deck.deckSlug ?? activeDeckSlug);
}

if (useSoftAssetFailures) {
  initAssetRegistrySoft(deck, allSlides);
  // After the synchronous slug-resolution pass, any cached `missing-slug`
  // entry that didn't re-fail this session was actually fixed by the
  // user — drop it. URL-fetch + image-decode prunes happen in main.tsx
  // once those async passes resolve.
  markVerificationPassFinished(['missing-slug']);
} else {
  // Hard-fail at boot if any audio/QR/brand/icon reference can't resolve.
  // Throws an aggregated Error listing every missing slug + which slide it's on.
  // See `src/slides/assetRegistry.ts`.
  initAssetRegistry(deck, allSlides);
}

/**
 * Active validation mode for this page-load. See `validationMode.ts`:
 *   - `'warn'`   → collect issues, console.warn, render anyway (default).
 *   - `'strict'` → throw an aggregated Error so the deck never boots with
 *                  contract violations. The Settings page lets the user
 *                  switch modes; `?validation=strict` overrides per-load.
 */
export const validationMode: ValidationMode = getValidationMode();

/**
 * Per-slide contract violations detected at boot. Empty when every slide
 * matched its zod contract in `src/slides/contracts.ts`. Surfaced via the
 * console (warn) and the on-screen `ContractIssuesOverlay`.
 *
 * In `'strict'` mode the loader throws *before* React mounts when this
 * array would have been non-empty — see the throw-block below.
 */
export const slideContractIssues: readonly SlideValidationIssue[] = (() => {
  const issues: SlideValidationIssue[] = [];
  for (const slide of cache.slides) {
    const r = validateSlide(slide);
    if (r.ok === false) issues.push(...r.issues);
  }
  if (issues.length > 0 && typeof console !== 'undefined') {
    console.warn(
      `[deck] ${issues.length} slide-contract violation(s) at boot ` +
      `(mode=${validationMode}). First:`,
      issues[0],
    );
  }
  return Object.freeze(issues);
})();

// Strict mode → fail-fast at boot so a broken deck never reaches an
// audience. We aggregate every violation into one multi-line Error so the
// author sees the full picture in one shot (matching `assertValidSlides`'s
// formatting). The error is also surfaced by Vite's overlay, so users on
// the dev server get a readable failure screen instead of a blank page.
if (validationMode === 'strict' && slideContractIssues.length > 0) {
  const lines = slideContractIssues.map(
    (i) =>
      `  • Slide #${i.slideNumber ?? '?'} "${i.slideName ?? '?'}" ` +
      `(${i.slideType ?? 'unknown'}) — ${i.path}: ${i.message}`,
  );
  throw new Error(
    `[deck] Strict validation: ${slideContractIssues.length} contract ` +
    `violation(s) refused boot.\n${lines.join('\n')}\n` +
    `Switch to "Warn" mode in /settings to render the deck anyway.`,
  );
}

/**
 * Phase 4 / A-02 — Narrow Idea density caps. Every slide's optional
 * `densityCheck` block is enforced here. In `'strict'` mode a violation
 * refuses boot (same shape as contract violations); in `'warn'` mode we
 * surface to the console and let the deck render.
 */
export const slideDensityViolations: readonly DensityViolation[] = (() => {
  const v = checkDensity(cache.slides);
  if (v.length > 0 && typeof console !== 'undefined') {
    console.warn(
      `[deck] ${v.length} density-cap violation(s) at boot (mode=${validationMode}). First:`,
      v[0],
    );
  }
  return Object.freeze(v);
})();
if (validationMode === 'strict' && slideDensityViolations.length > 0) {
  const lines = slideDensityViolations.map(
    (x) =>
      `  • Slide #${x.slideNumber} "${x.slideName}" (${x.slideType}) — ` +
      `${x.field}: ${x.actual} > cap ${x.cap}`,
  );
  throw new Error(
    `[deck] Density-cap violations (Narrow Idea Per Slide rule):\n${lines.join('\n')}\n` +
    `Reduce content or raise the cap in the slide JSON's densityCheck block.`,
  );
}

/**
 * Phase 4 / A-03 — Catalog probe. Dev-only advisory: warns when a deck
 * uses a slideType / transition / textAnimation / capsule.color that
 * isn't registered in `spec/21-slides-system/llm/CATALOG.json`. Never
 * blocks boot — structural validity is contracts.ts's job.
 */
if (import.meta.env.DEV) {
  const v = validateAgainstCatalog(cache.slides);
  if (v.length > 0 && typeof console !== 'undefined') {
    console.warn(formatCatalogViolations(v));
  }
}

/** Frozen audit log of every BrandStrip field stripped during boot. The
 *  `BrandStripAuditOverlay` component renders this on-screen so the user
 *  can verify the root-cause fix actually ran (and against which source). */
export const brandStripAudit: ReadonlyArray<BrandStripAuditEntry> = Object.freeze([...auditBuffer]);

/**
 * If the active deck declares a `theme`, surface it so callers (e.g. main.tsx)
 * can apply it before first paint. The picker's localStorage choice still wins
 * if the user has explicitly chosen a different palette since import.
 */
export const deckTheme: string | undefined =
  typeof deck.theme === 'string' && deck.theme.length > 0 ? deck.theme : undefined;

// A slide is "active" unless it explicitly opts out via `enabled: false`.
const isActive = (s: SlideSpec) => s.enabled !== false;
export const linearSlides = allSlides.filter(s => !s.isClickReveal && isActive(s));

/**
 * Per-slide motion-collision warnings (transition × textAnimation
 * variety rule from `spec/slides/llm/13-motion-system.md`). Computed
 * over `linearSlides` only — click-reveal slides never appear back-to-
 * back with their parent in the linear cadence, so they're excluded.
 *
 * Always non-fatal: even in `'strict'` mode we don't block boot on
 * motion warnings (the spec frames variety as a "reads as one cinematic
 * flow" concern, not a contract violation). Surfaced via the console
 * and the existing `ContractIssuesOverlay`.
 */
export const motionCollisionWarnings: readonly MotionCollisionWarning[] = (() => {
  const w = detectMotionCollisions(linearSlides);
  if (w.length > 0 && typeof console !== 'undefined') {
    console.warn(
      `[deck] ${w.length} motion-collision warning(s) at boot. First:`,
      w[0],
    );
  }
  return w;
})();

export function findBySlideNumber(n: number): SlideSpec | undefined {
  return allSlides.find(s => s.slideNumber === n);
}

export function findLinearIndex(slideNumber: number): number {
  return linearSlides.findIndex(s => s.slideNumber === slideNumber);
}
