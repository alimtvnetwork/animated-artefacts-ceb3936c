/**
 * Tests — `initAssetRegistry` produces explicit, copy-pasteable error
 * blocks naming (a) the deck JSON path that referenced the missing
 * asset, (b) the `deck.assets.*` root key where the fix belongs, and
 * (c) an example URL the author can model after.
 *
 * We don't test the registry resolution itself (covered indirectly by
 * `slideFixtures.test.ts` and the boot path) — only the *messages*,
 * because the user's request was specifically about the diagnostic
 * surface.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { initAssetRegistry, assertDeclaredAssetFiles } from '../slides/assetRegistry';
import type { DeckSpec, SlideSpec } from '../slides/types';

const baseDeck: DeckSpec = {
  deckSlug: 'test-deck',
  deckName: 'Test',
  presenter: 'Tester',
} as DeckSpec;

function slide(overrides: Partial<SlideSpec> & Pick<SlideSpec, 'slideNumber' | 'slideName'>): SlideSpec {
  return {
    slideType: 'TitleSlide',
    transition: 'FadeIn',
    textAnimation: 'FadeIn',
    isClickReveal: false,
    showBrandHeader: true,
    showPresenterChip: false,
    content: {},
    ...overrides,
  } as unknown as SlideSpec;
}

describe('initAssetRegistry — explicit error messages', () => {
  it('names the exact deck JSON path for a deck-level missing QR', () => {
    const deck: DeckSpec = {
      ...baseDeck,
      meeting: { url: 'x', label: 'x', qrAsset: 'no-such-qr' },
    } as DeckSpec;
    expect(() => initAssetRegistry(deck, [])).toThrowError(/deck\.meeting\.qrAsset/);
    try {
      initAssetRegistry(deck, []);
    } catch (e) {
      const msg = (e as Error).message;
      // Block must name (a) the referrer path, (b) the registry key to
      // add, and (c) an example URL — all three on one error.
      expect(msg).toContain('deck.meeting.qrAsset');
      expect(msg).toContain('deck.assets.qr.no-such-qr');
      expect(msg).toMatch(/expected URL/);
    }
  });

  it('names the slide index, slug, and content path for a missing slide QR', () => {
    const deck = baseDeck;
    const s = slide({
      slideNumber: 7,
      slideName: 'contact',
      content: { qrAsset: 'broken-qr' } as never,
    });
    try {
      initAssetRegistry(deck, [s]);
      throw new Error('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('deck.slides[7] ("contact").content.qrAsset');
      expect(msg).toContain('deck.assets.qr.broken-qr');
    }
  });

  it('names the exact array index for a missing ambient icon in iconPool', () => {
    const s = slide({
      slideNumber: 2,
      slideName: 'capabilities',
      content: {
        titleAmbient: { iconPool: ['vscode', 'definitely-not-a-real-icon'] },
      } as never,
    });
    try {
      initAssetRegistry(baseDeck, [s]);
      throw new Error('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      // Index 1 — the bad icon — must appear, not 0 or the parent block.
      expect(msg).toContain('content.titleAmbient.iconPool[1]');
      expect(msg).toContain('deck.assets.icons.definitely-not-a-real-icon');
    }
  });

  it('names the audio kind on the sound block', () => {
    const s = slide({
      slideNumber: 3,
      slideName: 'process',
      sound: { kind: 'unknown-cue' } as never,
    });
    try {
      initAssetRegistry(baseDeck, [s]);
      throw new Error('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('deck.slides[3] ("process").sound.kind');
      expect(msg).toContain('deck.assets.audio.unknown-cue');
      expect(msg).toMatch(/\.mp3/); // example URL hint
    }
  });

  it('aggregates multiple errors into numbered blocks', () => {
    const s = slide({
      slideNumber: 4,
      slideName: 'multi',
      content: {
        qrAsset: 'bad-qr',
        titleAmbient: { iconPool: ['bad-icon'] },
      } as never,
      sound: { kind: 'bad-sound' } as never,
    });
    try {
      initAssetRegistry(baseDeck, [s]);
      throw new Error('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      // 3 issues → "1. ", "2. ", "3. " prefixes.
      expect(msg).toMatch(/^Deck asset validation failed \(3 issues\)/m);
      expect(msg).toMatch(/^1\. \[/m);
      expect(msg).toMatch(/^2\. \[/m);
      expect(msg).toMatch(/^3\. \[/m);
    }
  });

  it('does NOT throw when a procedural pop sound is referenced (no asset needed)', () => {
    const s = slide({
      slideNumber: 1,
      slideName: 'pop-only',
      sound: { kind: 'pop' } as never,
    });
    expect(() => initAssetRegistry(baseDeck, [s])).not.toThrow();
  });

  it('includes the filename hint extracted from the example URL', () => {
    // Audio errors carry an `.mp3` example URL — its basename should appear
    // on the `filename` line so an author can grep their public/ folder.
    const s = slide({
      slideNumber: 5,
      slideName: 'sound-only',
      sound: { kind: 'mystery-cue' } as never,
    });
    try {
      initAssetRegistry(baseDeck, [s]);
      throw new Error('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      // Filename line is present and shows the trailing segment of the URL.
      expect(msg).toMatch(/filename\s+your-cue\.mp3/);
    }
  });
});

describe('assertDeclaredAssetFiles — file-existence error block', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('names the registry key, filename, and resolved URL when a declared file 404s', async () => {
    const deck = {
      ...baseDeck,
      assets: {
        audio: { whoosh: '/sounds/fade_swoosh_v4.mp3' },
      },
    } as DeckSpec;

    // Stub fetch so the HEAD comes back 404.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response));

    let caught: Error | null = null;
    try {
      await assertDeclaredAssetFiles(deck);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught, 'should have thrown').not.toBeNull();
    const msg = caught!.message;
    // Must name the EXACT root-deck JSON key the author needs to grep for.
    expect(msg).toContain('deck.assets.audio.whoosh');
    expect(msg).toContain('referenced at  deck.assets.audio.whoosh');
    expect(msg).toContain('register at    deck.assets.audio.whoosh');
    // Must surface the missing filename (basename of the resolved URL).
    expect(msg).toMatch(/filename\s+fade_swoosh_v4\.mp3/);
    // Must surface the resolved URL + HTTP status.
    expect(msg).toContain('/sounds/fade_swoosh_v4.mp3');
    expect(msg).toContain('HTTP 404');
  });

  it('reports filename "(no filename)" when the URL has no path segment', async () => {
    // A bare `/` (or empty after trim) has no filename to surface — the
    // helper should fall back to the literal `(no filename)` placeholder
    // so the error block still renders cleanly.
    const deck = {
      ...baseDeck,
      assets: {
        brand: { logo: '/' },
      },
    } as DeckSpec;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response));
    try {
      await assertDeclaredAssetFiles(deck);
      throw new Error('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('(no filename)');
    }
  });
});

describe('assertDeclaredAssetFiles — assetPolicy.optional', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('downgrades a per-kind optional miss from fatal to warning (does NOT throw)', async () => {
    const deck = {
      ...baseDeck,
      assets: {
        brand: { 'logo-trimmed': '/assets/brand/riseup-asia-logo-trimmed.png' },
      },
      assetPolicy: {
        optional: { brand: ['logo-trimmed'] },
      },
    } as DeckSpec;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const warnings = await assertDeclaredAssetFiles(deck);
    expect(warnings.length).toBe(1);
    expect(warnings[0]?.deckJsonPath).toBe('deck.assets.brand.logo-trimmed');
    expect(warnings[0]?.status).toBe(404);
    // The warning is logged through console.warn so a developer sees it.
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('deck.assetPolicy.optional');
  });

  it('still throws when a REQUIRED asset is missing alongside optional warnings', async () => {
    const deck = {
      ...baseDeck,
      assets: {
        audio: { whoosh: '/sounds/required.mp3' },
        brand: { 'logo-alt': '/assets/brand/optional.png' },
      },
      assetPolicy: { optional: { brand: ['logo-alt'] } },
    } as DeckSpec;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    let caught: Error | null = null;
    try {
      await assertDeclaredAssetFiles(deck);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught, 'should have thrown on the required miss').not.toBeNull();
    const msg = caught!.message;
    // Required asset appears in the fatal block...
    expect(msg).toContain('deck.assets.audio.whoosh');
    // ...but the optional one does not (it's in warnings, not the throw).
    expect(msg).not.toContain('deck.assets.brand.logo-alt');
    // The error message hints at the policy as a remediation path.
    expect(msg).toContain('deck.assetPolicy.optional');
  });

  it('honors the "*" wildcard list across every kind', async () => {
    const deck = {
      ...baseDeck,
      assets: {
        audio: { 'debug-cue': '/sounds/debug.mp3' },
        brand: { 'debug-img': '/assets/debug.png' },
      },
      assetPolicy: { optional: { '*': ['debug-cue', 'debug-img'] } },
    } as DeckSpec;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const warnings = await assertDeclaredAssetFiles(deck);
    // Both should be tolerated — the wildcard covered them regardless of kind.
    expect(warnings.length).toBe(2);
    const paths = warnings.map((w) => w.deckJsonPath).sort();
    expect(paths).toEqual([
      'deck.assets.audio.debug-cue',
      'deck.assets.brand.debug-img',
    ]);
  });

  it('does NOT exempt slugs not listed in the optional whitelist', async () => {
    const deck = {
      ...baseDeck,
      assets: {
        brand: {
          'logo-trimmed': '/assets/brand/optional.png',
          logo: '/assets/brand/required.png',
        },
      },
      assetPolicy: { optional: { brand: ['logo-trimmed'] } }, // only logo-trimmed
    } as DeckSpec;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    let caught: Error | null = null;
    try {
      await assertDeclaredAssetFiles(deck);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).not.toBeNull();
    const msg = caught!.message;
    // The non-whitelisted slug must show up in the fatal error block.
    expect(msg).toContain('deck.assets.brand.logo');
    // The whitelisted one must NOT (it's only in warnings).
    expect(msg).not.toMatch(/deck\.assets\.brand\.logo-trimmed/);
  });
});
