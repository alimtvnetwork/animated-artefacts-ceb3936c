/**
 * Strict deck-owned asset registry + boot-time validator.
 *
 * # The contract (v0.141 — strict mode)
 * The deck root JSON owns the ENTIRE asset surface. There are no
 * built-in fallbacks. Every audio cue, branded QR, brand-chrome image,
 * and ambient icon a slide references MUST be declared in the deck's
 * `assets` block:
 *
 *   {
 *     "assets": {
 *       "audio":  { "whoosh": "/sounds/fade_swoosh_v2.mp3", "click": "/sounds/click.mp3" },
 *       "qr":     { "riseup-meeting": "/assets/brand/meeting-qr.png" },
 *       "brand":  { "logo": "/assets/brand/riseup-asia-logo.png", "presenter": "/assets/brand/alim-presenter.png" },
 *       "icons":  { "vscode": "vscode", "github-mark": "github-mark" }
 *     }
 *   }
 *
 * Why strict (no implicit defaults):
 *   - A deck JSON moved to another machine / CI / handoff context
 *     shouldn't depend on hidden fallbacks the receiver might not know
 *     about. The deck file IS the manifest.
 *   - Removing built-ins makes asset typos fail loudly at boot with a
 *     pointer to the exact `deck.assets.*` key the author needs to add.
 *   - For ambient icons specifically: the React component registry
 *     stays in `ambientIconRegistry.ts` (you can't ship React components
 *     in JSON), but the deck still has to list which of those slugs it
 *     opts into. That keeps the JSON itself the source of truth even
 *     though component implementations live in code.
 *
 * If you're migrating an older deck that relied on built-ins, copy the
 * relevant entries from `LEGACY_BUILTINS_FOR_MIGRATION` (kept commented
 * at the bottom of this file as a reference) into your deck.json.
 */
import type { DeckSpec, SlideSpec, AmbientLayerSpec } from './types';
import { AMBIENT_ICON_REGISTRY } from './ambientIconRegistry';
import { reportBrokenAsset, type BrokenAssetKind } from './brokenAssetReport';

/* ------------------------------------------------------------------ */
/* 1. Deck-level assets schema (TS shape mirrors deck.schema.json)     */
/* ------------------------------------------------------------------ */

export interface DeckAssetsSpec {
  /** Audio cue overrides keyed by SoundKind. Values are URLs. */
  audio?: Record<string, string>;
  /** QR slug → image URL. Slides reference these via `content.qrAsset`. */
  qr?: Record<string, string>;
  /** Brand-chrome slug → image URL. */
  brand?: Record<string, string>;
  /**
   * Ambient-icon slug → built-in icon-registry slug. The value MUST be a
   * key of `AMBIENT_ICON_REGISTRY` (the React component registry); the
   * key is what slides reference. This indirection lets a deck rename
   * `tool-of-the-day` → `vscode` without editing every slide.
   */
  icons?: Record<string, string>;
}

/**
 * Per-deck asset-policy block. Sibling of `deck.assets`. Lets authors mark
 * specific declared assets (e.g. brand variations, fallback QR codes) as
 * **optional** — when a file under one of these slugs 404s, the boot path
 * downgrades the failure from "throw + fatal overlay" to "console.warn +
 * include in `verifyDeclaredAssetFiles().warnings`". Strict-mode behavior
 * for everything NOT listed here is unchanged.
 *
 * Shape (all fields optional, all default to "no slugs are optional"):
 *
 * ```json
 * "assetPolicy": {
 *   "optional": {
 *     "brand": ["logo-trimmed", "presenter-alt"],
 *     "audio": ["fadeZoom"],
 *     "qr":    [],
 *     "*":     ["debug-only-asset"]
 *   }
 * }
 * ```
 *
 * The `"*"` wildcard list applies across every kind — useful for one-off
 * debug assets that may or may not be present in a given environment.
 */
export interface DeckAssetPolicy {
  optional?: {
    audio?: string[];
    qr?: string[];
    brand?: string[];
    /** Slugs allowed to be missing regardless of `kind`. */
    '*'?: string[];
  };
  /**
   * v0.173 — opt-in to non-fatal asset failures. When `true`, the boot
   * path collects slug-validation, file-existence, and decode failures
   * into the `BrokenAssetReport` store (surfaced by `BrokenAssetOverlay`)
   * instead of throwing a fatal error. Imported decks are soft-fail by
   * default regardless of this flag.
   *
   * Use for decks shared between machines / handoff contexts where some
   * brand assets may be intentionally absent in certain environments
   * (e.g. an internal-only logo that doesn't exist on the public host).
   */
  softFail?: boolean;
}

/* ------------------------------------------------------------------ */
/* 2. Resolved (effective) registries — populated from the deck only   */
/* ------------------------------------------------------------------ */

/** Currently active registries. Empty until `initAssetRegistry` runs. */
let RESOLVED: {
  audio: Record<string, string>;
  qr: Record<string, string>;
  brand: Record<string, string>;
  icons: Record<string, string>;
} = { audio: {}, qr: {}, brand: {}, icons: {} };

export function getAudioUrl(kind: string): string | undefined {
  return RESOLVED.audio[kind];
}
export function getQrUrl(slug: string): string | undefined {
  return RESOLVED.qr[slug];
}
export function getBrandUrl(slug: string): string | undefined {
  return RESOLVED.brand[slug];
}
export function isKnownIconSlug(slug: string): boolean {
  return slug in RESOLVED.icons;
}

/* ------------------------------------------------------------------ */
/* 3. Boot-time validator                                              */
/* ------------------------------------------------------------------ */

export interface AssetValidationError {
  scope: 'deck' | 'slide';
  slideNumber: number | null;
  kind: 'audio' | 'qr' | 'brand' | 'icon';
  slug: string;
  /**
   * Dotted JSON pointer rooted at the deck object that an author can
   * search for in their deck JSON. Examples:
   *   - `deck.meeting.qrAsset`
   *   - `deck.slides[3].sound.kind`
   *   - `deck.slides[5].content.titleAmbient.iconPool[2]`
   */
  deckJsonPath: string;
  /** The root-level deck JSON key the author needs to add. */
  expectedRegistryKey: `deck.assets.${'audio' | 'qr' | 'brand' | 'icons'}.${string}`;
  /** URL the slug currently resolves to, if any. `null` when unregistered. */
  resolvedUrl: string | null;
  message: string;
}

/**
 * Extract the trailing filename segment of a URL/path. Returns `'(no filename)'`
 * for empty/trailing-slash inputs so the error block always has *something*
 * to print on the "missing filename" line.
 */
function basenameOf(url: string | null | undefined): string {
  if (!url) return '(no filename)';
  // Strip query/hash before splitting so `?v=2` doesn't show up as the name.
  const clean = url.split(/[?#]/, 1)[0];
  const seg = clean.replace(/\/+$/, '').split('/').pop() ?? '';
  return seg.length > 0 ? seg : '(no filename)';
}

/** Build the canonical 5-line error block. Centralized so every error
 *  has the same shape: what + where + how-to-fix + filename + example.
 *
 *  The block reliably names the THREE things an author needs to grep for:
 *    1. `deckJsonPath`        — the exact root-deck JSON key that referenced it
 *    2. `expectedRegistryKey` — the `deck.assets.{kind}.{slug}` key to add/fix
 *    3. `filename`            — the trailing filename segment (or `(no filename)`)
 */
function buildAssetErrorMessage(args: {
  kind: AssetValidationError['kind'];
  slug: string;
  deckJsonPath: string;
  expectedRegistryKey: AssetValidationError['expectedRegistryKey'];
  resolvedUrl: string | null;
  exampleUrl: string;
}): string {
  const { kind, slug, deckJsonPath, expectedRegistryKey, resolvedUrl, exampleUrl } = args;
  const header = resolvedUrl
    ? `Asset registered but file not found.`
    : `Unknown ${kind} slug "${slug}".`;
  const where = `  ↳ referenced at  ${deckJsonPath}`;
  const fixKey = `  ↳ register at   ${expectedRegistryKey}`;
  const filename = `  ↳ filename       ${basenameOf(resolvedUrl ?? exampleUrl)}`;
  const url = resolvedUrl
    ? `  ↳ resolved URL   ${resolvedUrl}  (file is missing — check the path or replace the asset)`
    : `  ↳ expected URL   e.g. "${exampleUrl}"  (or any path Vite serves)`;
  return [header, where, fixKey, filename, url].join('\n');
}

/**
 * Validate the deck.assets block itself BEFORE walking slide references.
 * Catches invalid icon remaps (a `deck.assets.icons.foo` value that
 * isn't a real component-registry slug) so the slide-level "unknown
 * icon" errors stay focused on actual slide bugs, not deck config bugs.
 */
function validateDeckAssetsBlock(
  assets: DeckAssetsSpec | undefined,
  errors: AssetValidationError[],
): void {
  if (!assets) return;
  if (assets.icons) {
    for (const [slug, target] of Object.entries(assets.icons)) {
      if (!(target in AMBIENT_ICON_REGISTRY)) {
        const path = `deck.assets.icons.${slug}`;
        errors.push({
          scope: 'deck',
          slideNumber: null,
          kind: 'icon',
          slug,
          deckJsonPath: path,
          expectedRegistryKey: `deck.assets.icons.${slug}`,
          resolvedUrl: null,
          message: [
            `Invalid icon remap: "${slug}" → "${target}".`,
            `  ↳ at              ${path}`,
            `  ↳ "${target}" is not a built-in icon-registry slug`,
            `  ↳ valid slugs    ${Object.keys(AMBIENT_ICON_REGISTRY).slice(0, 8).join(', ')}, ... (${Object.keys(AMBIENT_ICON_REGISTRY).length} total)`,
          ].join('\n'),
        });
      }
    }
  }
}

/**
 * Internal: walk the deck + slide tree and collect every asset-reference
 * violation without throwing. Used by both the strict `initAssetRegistry`
 * (which throws on a non-empty list) and the soft-fail boot path (which
 * funnels each entry into `BrokenAssetReport`).
 *
 * Side effect: ALSO populates the resolved registry from `deck.assets`,
 * because the registry must be live regardless of which mode the boot
 * path is running in (slides still call `getAudioUrl` / `getQrUrl`).
 */
export function collectAssetValidationErrors(
  deck: DeckSpec,
  slides: SlideSpec[],
): AssetValidationError[] {
  // 1. Resolve registries from the deck ONLY (no built-in mixin).
  const overrides = (deck as DeckSpec & { assets?: DeckAssetsSpec }).assets;
  RESOLVED = {
    audio: { ...(overrides?.audio ?? {}) },
    qr: { ...(overrides?.qr ?? {}) },
    brand: { ...(overrides?.brand ?? {}) },
    icons: { ...(overrides?.icons ?? {}) },
  };

  const errors: AssetValidationError[] = [];

  // 2. Validate the deck.assets block itself first (icon remap targets).
  validateDeckAssetsBlock(overrides, errors);

  // 3. Deck-level meeting QR.
  const deckQr = deck.meeting?.qrAsset;
  if (deckQr && !RESOLVED.qr[deckQr]) {
    errors.push({
      scope: 'deck',
      slideNumber: null,
      kind: 'qr',
      slug: deckQr,
      deckJsonPath: 'deck.meeting.qrAsset',
      expectedRegistryKey: `deck.assets.qr.${deckQr}`,
      resolvedUrl: null,
      message: buildAssetErrorMessage({
        kind: 'qr',
        slug: deckQr,
        deckJsonPath: 'deck.meeting.qrAsset',
        expectedRegistryKey: `deck.assets.qr.${deckQr}`,
        resolvedUrl: null,
        exampleUrl: '/assets/brand/meeting-qr.png',
      }),
    });
  }

  // 4. Per-slide references.
  for (const slide of slides) {
    const c = slide.content;
    const slidePathRoot = `deck.slides[${slide.slideNumber}] ("${slide.slideName}")`;

    if (c.qrAsset && !RESOLVED.qr[c.qrAsset]) {
      const path = `${slidePathRoot}.content.qrAsset`;
      errors.push({
        scope: 'slide',
        slideNumber: slide.slideNumber,
        kind: 'qr',
        slug: c.qrAsset,
        deckJsonPath: path,
        expectedRegistryKey: `deck.assets.qr.${c.qrAsset}`,
        resolvedUrl: null,
        message: buildAssetErrorMessage({
          kind: 'qr',
          slug: c.qrAsset,
          deckJsonPath: path,
          expectedRegistryKey: `deck.assets.qr.${c.qrAsset}`,
          resolvedUrl: null,
          exampleUrl: '/assets/brand/meeting-qr.png',
        }),
      });
    }

    const soundKind = slide.sound?.kind;
    // The procedural `pop` synth has no asset by design — skip it.
    if (soundKind && soundKind !== 'pop' && !RESOLVED.audio[soundKind]) {
      const path = `${slidePathRoot}.sound.kind`;
      errors.push({
        scope: 'slide',
        slideNumber: slide.slideNumber,
        kind: 'audio',
        slug: soundKind,
        deckJsonPath: path,
        expectedRegistryKey: `deck.assets.audio.${soundKind}`,
        resolvedUrl: null,
        message: buildAssetErrorMessage({
          kind: 'audio',
          slug: soundKind,
          deckJsonPath: path,
          expectedRegistryKey: `deck.assets.audio.${soundKind}`,
          resolvedUrl: null,
          exampleUrl: '/sounds/your-cue.mp3',
        }),
      });
    }

    for (const [blockName, block] of [
      ['titleAmbient', c.titleAmbient],
      ['stepAmbient', c.stepAmbient],
    ] as Array<[string, AmbientLayerSpec | undefined]>) {
      if (!block) continue;
      block.iconPool?.forEach((slug, i) => {
        if (!RESOLVED.icons[slug]) {
          const path = `${slidePathRoot}.content.${blockName}.iconPool[${i}]`;
          errors.push({
            scope: 'slide',
            slideNumber: slide.slideNumber,
            kind: 'icon',
            slug,
            deckJsonPath: path,
            expectedRegistryKey: `deck.assets.icons.${slug}`,
            resolvedUrl: null,
            message: buildAssetErrorMessage({
              kind: 'icon',
              slug,
              deckJsonPath: path,
              expectedRegistryKey: `deck.assets.icons.${slug}`,
              resolvedUrl: null,
              exampleUrl: 'remap to a built-in slug like "vscode"',
            }),
          });
        }
      });
      block.positions?.forEach((p, i) => {
        if (!RESOLVED.icons[p.icon]) {
          const path = `${slidePathRoot}.content.${blockName}.positions[${i}].icon`;
          errors.push({
            scope: 'slide',
            slideNumber: slide.slideNumber,
            kind: 'icon',
            slug: p.icon,
            deckJsonPath: path,
            expectedRegistryKey: `deck.assets.icons.${p.icon}`,
            resolvedUrl: null,
            message: buildAssetErrorMessage({
              kind: 'icon',
              slug: p.icon,
              deckJsonPath: path,
              expectedRegistryKey: `deck.assets.icons.${p.icon}`,
              resolvedUrl: null,
              exampleUrl: 'remap to a built-in slug like "vscode"',
            }),
          });
        }
      });
    }
  }

  // 5. Strict-source guard (v0.158): any rogue `assets` block on an
  //    individual slide is a contract violation — assets MUST live on the
  //    root deck JSON only. Catches authoring drift early.
  for (const slide of slides) {
    if ('assets' in slide && (slide as unknown as { assets?: unknown }).assets) {
      const path = `deck.slides[${slide.slideNumber}] ("${slide.slideName}").assets`;
      errors.push({
        scope: 'slide',
        slideNumber: slide.slideNumber,
        kind: 'brand', // closest existing kind; surfaced via message text
        slug: '<rogue-block>',
        deckJsonPath: path,
        expectedRegistryKey: `deck.assets.brand.${slide.slideName}`,
        resolvedUrl: null,
        message: [
          `Rogue \`assets\` block on a slide.`,
          `  ↳ at              ${path}`,
          `  ↳ contract        assets MUST live on the root deck JSON only`,
          `  ↳ how to fix      move the entries into deck.assets.{audio|qr|brand|icons} and delete the slide-level block`,
        ].join('\n'),
      });
    }
  }

  return errors;
}

/**
 * Initialise the registry from the active deck and validate every asset
 * reference made by the deck + slides. Throws an aggregated `Error` with
 * one block per missing reference if anything fails to resolve.
 *
 * Strict-mode behavior: there are NO built-in fallbacks. A deck that
 * doesn't declare `deck.assets.audio.whoosh` will throw the moment any
 * slide references `sound.kind === "whoosh"`.
 *
 * Called once from `loader.ts` after the deck is loaded.
 */
export function initAssetRegistry(deck: DeckSpec, slides: SlideSpec[]): void {
  const errors = collectAssetValidationErrors(deck, slides);
  if (errors.length > 0) {
    const blocks = errors.map((e, i) => `${i + 1}. [${e.kind}] ${e.message}`).join('\n\n');
    throw new Error(
      `Deck asset validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n\n` +
      `${blocks}\n\n` +
      `Strict mode: every audio / qr / brand / icon slug must be declared in deck.assets.{audio|qr|brand|icons}.\n` +
      `No built-in fallbacks exist. Add the missing entries and reload.`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* 4. Strict file-existence verifier (v0.158)                          */
/* ------------------------------------------------------------------ */

/** A single file that was declared in deck.assets.* but couldn't be loaded. */
export interface MissingAssetFile {
  /** JSON pointer relative to deck root: `deck.assets.audio.whoosh`, etc. */
  deckJsonPath: string;
  kind: 'audio' | 'qr' | 'brand';
  slug: string;
  url: string;
  /** HTTP status when the response came back; null when fetch itself rejected. */
  status: number | null;
}

/**
 * Strictly verify every URL declared in `deck.assets.{audio,qr,brand}` is
 * actually loadable. Icons are skipped — they're component-registry remaps,
 * not files. Throws a single aggregated `Error` listing every missing file
 * if anything 404s or fails to fetch.
 *
 * Why async (and called from `main.tsx` before render):
 *   - The synchronous `initAssetRegistry` validates SLUG references only
 *     (does the deck declare every slug a slide references?). It cannot
 *     hit the network from a synchronous module-init path.
 *   - File existence must be checked at runtime against the current build
 *     output / `public/` dir, which is exactly the contract this verifier
 *     enforces. We block the first paint so a broken deck can never reach
 *     the audience — the entry point shows a fatal error overlay instead.
 *
 * # Concurrency
 * 8 in-flight HEADs at most so a 30-asset deck doesn't hammer the dev
 * server with simultaneous sockets. Wall time on a typical deck: ~50–
 * 200ms on localhost, ~300–800ms over a slow CDN.
 *
 * # Bypass
 * Remote (`http://` / `https://`) URLs are skipped — CORS would cause
 * spurious failures and cross-origin HEADs aren't a reliable signal of
 * file existence. The contract assumes deck-owned local `/public` paths.
 */
/**
 * Result of `verifyDeclaredAssetFiles` — separates fatal failures from
 * tolerated warnings. Both arrays use the same `MissingAssetFile` shape;
 * the only difference is whether the slug appears in the deck's
 * `assetPolicy.optional` list (warning) or not (fatal).
 */
export interface DeclaredFileVerification {
  /** Required assets that failed to load — caller must throw / overlay. */
  missing: MissingAssetFile[];
  /** Optional assets (per `deck.assetPolicy.optional`) that failed to
   *  load — caller should log + ignore, never block boot. */
  warnings: MissingAssetFile[];
}

/** Look up the deck's `assetPolicy.optional` block (if any), with safe
 *  defaults so the rest of the verifier can call `isOptional(kind, slug)`
 *  without re-checking shape on every iteration. */
function buildOptionalPredicate(
  deck: DeckSpec,
): (kind: MissingAssetFile['kind'], slug: string) => boolean {
  const policy = (deck as DeckSpec & { assetPolicy?: DeckAssetPolicy }).assetPolicy;
  const optional = policy?.optional;
  if (!optional) return () => false;

  // Pre-build sets for O(1) membership tests; `*` is the cross-kind wildcard.
  const wildcard = new Set<string>(optional['*'] ?? []);
  const perKind: Record<MissingAssetFile['kind'], Set<string>> = {
    audio: new Set(optional.audio ?? []),
    qr: new Set(optional.qr ?? []),
    brand: new Set(optional.brand ?? []),
  };
  return (kind, slug) => wildcard.has(slug) || perKind[kind].has(slug);
}

/**
 * Strictly verify every URL declared in `deck.assets.{audio,qr,brand}` is
 * actually loadable. Icons are skipped — they're component-registry remaps,
 * not files. Returns a `{ missing, warnings }` split: fatal failures land in
 * `missing`; failures whose slug appears in `deck.assetPolicy.optional` land
 * in `warnings` and should be tolerated by the caller.
 *
 * Why async (and called from `main.tsx` before render):
 *   - The synchronous `initAssetRegistry` validates SLUG references only
 *     (does the deck declare every slug a slide references?). It cannot
 *     hit the network from a synchronous module-init path.
 *   - File existence must be checked at runtime against the current build
 *     output / `public/` dir, which is exactly the contract this verifier
 *     enforces. We block the first paint so a broken deck can never reach
 *     the audience — the entry point shows a fatal error overlay instead.
 *
 * # Concurrency
 * 8 in-flight HEADs at most so a 30-asset deck doesn't hammer the dev
 * server with simultaneous sockets. Wall time on a typical deck: ~50–
 * 200ms on localhost, ~300–800ms over a slow CDN.
 *
 * # Bypass
 * Remote (`http://` / `https://`) URLs are skipped — CORS would cause
 * spurious failures and cross-origin HEADs aren't a reliable signal of
 * file existence. The contract assumes deck-owned local `/public` paths.
 */
export async function verifyDeclaredAssetFiles(
  deck: DeckSpec,
): Promise<DeclaredFileVerification> {
  const overrides = (deck as DeckSpec & { assets?: DeckAssetsSpec }).assets;
  if (!overrides) return { missing: [], warnings: [] };

  const isOptional = buildOptionalPredicate(deck);

  type Task = { deckJsonPath: string; kind: MissingAssetFile['kind']; slug: string; url: string };
  const tasks: Task[] = [];
  for (const kind of ['audio', 'qr', 'brand'] as const) {
    const block = overrides[kind];
    if (!block) continue;
    for (const [slug, url] of Object.entries(block)) {
      if (typeof url !== 'string' || url.length === 0) continue;
      if (url.startsWith('http://') || url.startsWith('https://')) continue;
      tasks.push({ deckJsonPath: `deck.assets.${kind}.${slug}`, kind, slug, url });
    }
  }

  const missing: MissingAssetFile[] = [];
  const warnings: MissingAssetFile[] = [];
  const MAX_CONCURRENT = 8;
  let cursor = 0;

  function record(t: Task, status: number | null): void {
    const entry: MissingAssetFile = {
      deckJsonPath: t.deckJsonPath, kind: t.kind, slug: t.slug, url: t.url, status,
    };
    (isOptional(t.kind, t.slug) ? warnings : missing).push(entry);
  }

  async function worker(): Promise<void> {
    while (cursor < tasks.length) {
      const t = tasks[cursor++];
      try {
        const res = await fetch(t.url, { method: 'HEAD', cache: 'no-store' });
        if (!res.ok) record(t, res.status);
      } catch {
        record(t, null);
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(MAX_CONCURRENT, tasks.length); i++) workers.push(worker());
  await Promise.all(workers);

  missing.sort((a, b) => a.deckJsonPath.localeCompare(b.deckJsonPath));
  warnings.sort((a, b) => a.deckJsonPath.localeCompare(b.deckJsonPath));
  return { missing, warnings };
}

/**
 * Convenience wrapper: run `verifyDeclaredAssetFiles`, log any tolerated
 * warnings (optional assets that 404'd), and throw an aggregated `Error`
 * if any REQUIRED file is still missing. The thrown message uses the same
 * 5-line block style as the slug validator so the on-screen overlay
 * (rendered by `main.tsx`) reads consistently with boot-time slug errors.
 *
 * Returns the warnings list so callers (e.g. dev-only debug overlays) can
 * surface them in-app without re-running the verifier.
 */
export async function assertDeclaredAssetFiles(
  deck: DeckSpec,
): Promise<MissingAssetFile[]> {
  const { missing, warnings } = await verifyDeclaredAssetFiles(deck);

  // Optional-asset warnings are non-fatal but worth surfacing so the
  // author knows their `assetPolicy.optional` whitelist actually fired.
  if (warnings.length > 0 && typeof console !== 'undefined') {
    console.warn(
      `[assetRegistry] ${warnings.length} optional asset${warnings.length === 1 ? '' : 's'} missing (allowed by deck.assetPolicy.optional):\n` +
      warnings.map((w) => `  • ${w.deckJsonPath} → ${w.url}${w.status === null ? ' (network)' : ` (HTTP ${w.status})`}`).join('\n'),
    );
  }

  if (missing.length === 0) return warnings;

  const blocks = missing.map((m, i) => {
    const statusLine = m.status === null
      ? `  ↳ status         fetch rejected (network / CORS / offline)`
      : `  ↳ status         HTTP ${m.status}`;
    // The deckJsonPath IS the deck.assets.{kind}.{slug} key for this code
    // path (see verifyDeclaredAssetFiles), but we surface both labels
    // explicitly so the on-screen overlay matches the slug-validation
    // error shape exactly: `referenced at` + `register at` + `filename`.
    const expectedRegistryKey = `deck.assets.${m.kind}.${m.slug}`;
    return [
      `${i + 1}. [${m.kind}] Missing file for declared asset.`,
      `  ↳ referenced at  ${m.deckJsonPath}`,
      `  ↳ register at    ${expectedRegistryKey}`,
      `  ↳ filename       ${basenameOf(m.url)}`,
      `  ↳ resolved URL   ${m.url}`,
      statusLine,
      `  ↳ how to fix     restore the file at the path above, or update the URL in ${expectedRegistryKey}, or mark "${m.slug}" optional via deck.assetPolicy.optional.${m.kind}`,
    ].join('\n');
  }).join('\n\n');
  throw new Error(
    `Strict asset loader: ${missing.length} required file${missing.length === 1 ? '' : 's'} could not be loaded.\n\n` +
    `${blocks}\n\n` +
    `Every URL in deck.assets.{audio|qr|brand} must resolve to a real file before the deck boots,\n` +
    `unless the slug is whitelisted in deck.assetPolicy.optional.{audio|qr|brand|*}.`,
  );
}

/** Inspect the currently resolved registries — used by tests + debug overlays. */
export function getResolvedAssetRegistry() {
  return {
    audio: { ...RESOLVED.audio },
    qr: { ...RESOLVED.qr },
    brand: { ...RESOLVED.brand },
    icons: { ...RESOLVED.icons },
  };
}

/* ------------------------------------------------------------------ */
/* 5. Soft-fail boot helpers (v0.173)                                  */
/* ------------------------------------------------------------------ */


/**
 * Soft variant of `initAssetRegistry`: walks the same validators but,
 * instead of throwing on any unresolved slug, reports each one to the
 * `BrokenAssetReport` store and returns the raw error list (handy for
 * tests). The resolved registry is still populated so slides that DO
 * have valid assets keep working — broken ones simply render with the
 * existing missing-asset placeholders (e.g. BrandedQR's striped fallback).
 *
 * Restricts itself to slugs the overlay can act on (`audio` / `qr` /
 * `brand`). Icon-remap and rogue-block errors stay console-only — they
 * indicate authoring drift, not a missing FILE the user can replace, so
 * showing them in the user-facing card would be noise.
 */
export function initAssetRegistrySoft(
  deck: DeckSpec,
  slides: SlideSpec[],
): AssetValidationError[] {
  const errors = collectAssetValidationErrors(deck, slides);
  for (const e of errors) {
    if (e.kind === 'icon') continue; // not a file the user can replace
    if (e.slug === '<rogue-block>') continue; // authoring bug, not asset
    reportBrokenAsset({
      kind: e.kind as BrokenAssetKind,
      slug: e.slug,
      reason: 'missing-slug',
      url: e.resolvedUrl,
      detail: `Referenced at ${e.deckJsonPath}; declare ${e.expectedRegistryKey}.`,
    });
  }
  return errors;
}

/**
 * Soft variant of `assertDeclaredAssetFiles`: HEAD-checks every declared
 * URL, pipes failures into the report store, and resolves with the
 * verification split. Never throws. Optional-policy warnings still fire
 * the same console.warn path so authors using `assetPolicy.optional`
 * don't see double surfacing.
 */
export async function reportDeclaredAssetFiles(
  deck: DeckSpec,
): Promise<DeclaredFileVerification> {
  const result = await verifyDeclaredAssetFiles(deck);
  for (const m of result.missing) {
    reportBrokenAsset({
      kind: m.kind,
      slug: m.slug,
      reason: 'url-fetch-failed',
      url: m.url,
      detail:
        m.status === null
          ? `Fetch rejected (network / CORS / offline)`
          : `HTTP ${m.status} from ${m.url}`,
    });
  }
  return result;
}

/**
 * Decode-probe every declared `qr` + `brand` image in the active deck
 * and report any that fail to decode. This catches "file exists (HEAD
 * 200) but bytes are corrupt" — a class of failure the HEAD-check can't
 * see by design. Audio decode failures are caught by `sound.ts` at play
 * time and reported through the same store.
 *
 * Skips remote URLs (CORS-tainted decode is unreliable) and images that
 * already failed the URL-fetch step (no point double-reporting). Runs
 * with concurrency 4 so it doesn't compete with the first paint.
 */
export async function probeDeclaredImageDecode(
  deck: DeckSpec,
): Promise<void> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return;
  const overrides = (deck as DeckSpec & { assets?: DeckAssetsSpec }).assets;
  if (!overrides) return;

  type Task = { kind: 'qr' | 'brand'; slug: string; url: string };
  const tasks: Task[] = [];
  for (const kind of ['qr', 'brand'] as const) {
    const block = overrides[kind];
    if (!block) continue;
    for (const [slug, url] of Object.entries(block)) {
      if (typeof url !== 'string' || url.length === 0) continue;
      if (url.startsWith('http://') || url.startsWith('https://')) continue;
      tasks.push({ kind, slug, url });
    }
  }

  let cursor = 0;
  const MAX = 4;
  async function decodeOne(t: Task): Promise<void> {
    const img = new Image();
    img.src = t.url;
    try {
      // `decode()` rejects when the bytes can't be parsed as a valid
      // image — the exact failure mode we're trying to catch.
      await img.decode();
    } catch (err) {
      reportBrokenAsset({
        kind: t.kind,
        slug: t.slug,
        reason: 'image-decode-failed',
        url: t.url,
        detail: err instanceof Error ? err.message : 'decode() rejected',
      });
    }
  }
  async function worker(): Promise<void> {
    while (cursor < tasks.length) {
      await decodeOne(tasks[cursor++]);
    }
  }
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(MAX, tasks.length); i++) workers.push(worker());
  await Promise.all(workers);
}


/* deck.json under "assets" if you were relying on these.              */
/* ------------------------------------------------------------------ */
//
// LEGACY_BUILTINS_FOR_MIGRATION = {
//   audio: {
//     whoosh:    '/sounds/fade_swoosh_v2.mp3',
//     click:     '/sounds/click.mp3',
//     fadeClick: '/sounds/click.mp3',
//     zoom:      '/sounds/zoom.mp3',
//     fadeZoom:  '/sounds/fade_zoom.mp3',
//   },
//   qr: {
//     'riseup-meeting': '/assets/brand/meeting-qr.png',
//   },
//   brand: {
//     logo:           '/assets/brand/riseup-asia-logo.png',
//     'logo-trimmed': '/assets/brand/riseup-asia-logo-trimmed.png',
//     presenter:      '/assets/brand/alim-presenter.png',
//   },
// };
