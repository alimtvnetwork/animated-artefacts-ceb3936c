/**
 * Tests — non-fatal broken-asset overlay (v0.173).
 *
 * Covers the two halves of the soft-fail path:
 *   1. `BrokenAssetReport` store: dedupe + subscriber semantics.
 *   2. `initAssetRegistrySoft` / `reportDeclaredAssetFiles`: routes the
 *      same failures the strict path would throw on into the store, so
 *      the overlay can render them while the deck keeps booting.
 *
 * We don't render the React component here — `BrokenAssetOverlay` is a
 * thin subscriber on top of the store, so testing the store covers the
 * data flow. A separate visual check is owned by manual QA.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  reportBrokenAsset,
  getBrokenAssetReport,
  subscribeBrokenAssetReport,
  setActiveDeck,
  markVerificationPassFinished,
  __resetBrokenAssetReport,
  type BrokenAssetReport,
} from '../slides/brokenAssetReport';
import {
  initAssetRegistry,
  initAssetRegistrySoft,
  reportDeclaredAssetFiles,
} from '../slides/assetRegistry';
import type { DeckSpec, SlideSpec } from '../slides/types';

const baseDeck: DeckSpec = {
  deckSlug: 'soft-deck',
  deckName: 'Soft',
  presenter: 'Tester',
} as DeckSpec;

function slide(
  overrides: Partial<SlideSpec> & Pick<SlideSpec, 'slideNumber' | 'slideName'>,
): SlideSpec {
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

beforeEach(() => {
  __resetBrokenAssetReport();
  // Each test starts with a clean localStorage so persistence assertions
  // are deterministic across the suite.
  try { window.localStorage.clear(); } catch { /* jsdom is fine, native may not be */ }
});

describe('BrokenAssetReport persistence (per-deck)', () => {
  it('writes new entries to localStorage under the active deck slug', () => {
    setActiveDeck('persist-deck-a');
    reportBrokenAsset({
      kind: 'audio',
      slug: 'whoosh',
      reason: 'audio-decode-failed',
      url: '/sounds/whoosh.mp3',
      detail: 'bad bytes',
    });
    const raw = window.localStorage.getItem('riseup.brokenAssets.v1.persist-deck-a');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual([
      {
        kind: 'audio',
        slug: 'whoosh',
        reason: 'audio-decode-failed',
        url: '/sounds/whoosh.mp3',
        detail: 'bad bytes',
      },
    ]);
  });

  it('hydrates persisted entries on setActiveDeck and tags them cached:true', () => {
    window.localStorage.setItem(
      'riseup.brokenAssets.v1.persist-deck-b',
      JSON.stringify([
        { kind: 'qr', slug: 'meeting', reason: 'url-fetch-failed', url: '/qr.png', detail: 'HTTP 404' },
      ]),
    );
    setActiveDeck('persist-deck-b');
    const r = getBrokenAssetReport();
    expect(r.entries).toHaveLength(1);
    expect(r.entries[0]).toMatchObject({
      kind: 'qr',
      slug: 'meeting',
      reason: 'url-fetch-failed',
      cached: true,
    });
  });

  it('clears the cached flag when a fresh report re-confirms the failure', () => {
    window.localStorage.setItem(
      'riseup.brokenAssets.v1.persist-deck-c',
      JSON.stringify([
        { kind: 'brand', slug: 'logo', reason: 'image-decode-failed', url: '/l.png' },
      ]),
    );
    setActiveDeck('persist-deck-c');
    expect(getBrokenAssetReport().entries[0].cached).toBe(true);
    const added = reportBrokenAsset({
      kind: 'brand',
      slug: 'logo',
      reason: 'image-decode-failed',
      url: '/l.png',
    });
    expect(added).toBe(false);
    expect(getBrokenAssetReport().entries[0].cached).toBe(false);
  });

  it('markVerificationPassFinished drops cached entries the user has fixed', () => {
    window.localStorage.setItem(
      'riseup.brokenAssets.v1.persist-deck-d',
      JSON.stringify([
        { kind: 'qr', slug: 'fixed', reason: 'url-fetch-failed', url: '/fixed.png' },
        { kind: 'qr', slug: 'still-broken', reason: 'url-fetch-failed', url: '/x.png' },
        { kind: 'audio', slug: 'whoosh', reason: 'audio-decode-failed', url: '/w.mp3' },
      ]),
    );
    setActiveDeck('persist-deck-d');
    reportBrokenAsset({
      kind: 'qr',
      slug: 'still-broken',
      reason: 'url-fetch-failed',
      url: '/x.png',
    });
    markVerificationPassFinished(['url-fetch-failed']);
    const slugs = getBrokenAssetReport().entries.map((e) => e.slug).sort();
    // `fixed` dropped (cached + verified pass + not re-reported).
    // `still-broken` kept (re-reported, no longer cached).
    // `whoosh` kept (audio is never auto-pruned).
    expect(slugs).toEqual(['still-broken', 'whoosh']);
  });

  it('persists across "reload" simulated by reset+rebind', () => {
    setActiveDeck('persist-deck-e');
    reportBrokenAsset({
      kind: 'audio',
      slug: 'click',
      reason: 'audio-decode-failed',
      url: '/c.mp3',
    });
    const raw = window.localStorage.getItem('riseup.brokenAssets.v1.persist-deck-e');
    __resetBrokenAssetReport();
    window.localStorage.setItem('riseup.brokenAssets.v1.persist-deck-e', raw!);
    setActiveDeck('persist-deck-e');
    const r = getBrokenAssetReport();
    expect(r.entries).toHaveLength(1);
    expect(r.entries[0]).toMatchObject({ slug: 'click', cached: true });
  });

  it('scopes persistence per deck — different slugs hydrate different lists', () => {
    window.localStorage.setItem(
      'riseup.brokenAssets.v1.deck-x',
      JSON.stringify([{ kind: 'qr', slug: 'x-only', reason: 'missing-slug', url: null }]),
    );
    window.localStorage.setItem(
      'riseup.brokenAssets.v1.deck-y',
      JSON.stringify([{ kind: 'qr', slug: 'y-only', reason: 'missing-slug', url: null }]),
    );
    setActiveDeck('deck-x');
    expect(getBrokenAssetReport().entries.map((e) => e.slug)).toEqual(['x-only']);
    __resetBrokenAssetReport();
    setActiveDeck('deck-y');
    expect(getBrokenAssetReport().entries.map((e) => e.slug)).toEqual(['y-only']);
  });

  it('drops a corrupted localStorage blob without throwing', () => {
    window.localStorage.setItem('riseup.brokenAssets.v1.bad-deck', 'not json {');
    setActiveDeck('bad-deck');
    expect(getBrokenAssetReport().entries).toEqual([]);
    expect(window.localStorage.getItem('riseup.brokenAssets.v1.bad-deck')).toBeNull();
  });
});

describe('BrokenAssetReport store', () => {
  it('records the first push and exposes it via getReport', () => {
    reportBrokenAsset({
      kind: 'audio',
      slug: 'whoosh',
      reason: 'audio-decode-failed',
      url: '/sounds/whoosh.mp3',
      detail: 'bad bytes',
    });
    const r = getBrokenAssetReport();
    expect(r.entries).toHaveLength(1);
    expect(r.entries[0]).toMatchObject({
      kind: 'audio',
      slug: 'whoosh',
      reason: 'audio-decode-failed',
      url: '/sounds/whoosh.mp3',
      detail: 'bad bytes',
    });
  });

  it('dedupes by (kind, slug, reason) — repeat pushes are no-ops', () => {
    expect(
      reportBrokenAsset({ kind: 'audio', slug: 'click', reason: 'audio-decode-failed', url: '/x.mp3' }),
    ).toBe(true);
    expect(
      reportBrokenAsset({ kind: 'audio', slug: 'click', reason: 'audio-decode-failed', url: '/x.mp3' }),
    ).toBe(false);
    expect(getBrokenAssetReport().entries).toHaveLength(1);
  });

  it('keeps separate entries when reason differs even for the same slug', () => {
    reportBrokenAsset({ kind: 'qr', slug: 'meeting', reason: 'missing-slug', url: null });
    reportBrokenAsset({ kind: 'qr', slug: 'meeting', reason: 'url-fetch-failed', url: '/qr.png' });
    expect(getBrokenAssetReport().entries).toHaveLength(2);
  });

  it('notifies subscribers on every change with the current snapshot', async () => {
    const calls: BrokenAssetReport[] = [];
    const unsub = subscribeBrokenAssetReport((r) => calls.push(r));
    // Initial subscribe fires with empty snapshot via microtask.
    await Promise.resolve();
    expect(calls).toHaveLength(1);
    expect(calls[0].entries).toEqual([]);

    reportBrokenAsset({ kind: 'brand', slug: 'logo', reason: 'image-decode-failed', url: '/l.png' });
    expect(calls).toHaveLength(2);
    expect(calls[1].entries).toHaveLength(1);
    unsub();
    reportBrokenAsset({ kind: 'brand', slug: 'logo2', reason: 'image-decode-failed', url: '/l2.png' });
    // After unsub, no further calls.
    expect(calls).toHaveLength(2);
  });
});

describe('initAssetRegistrySoft — non-fatal slug validation', () => {
  it('does NOT throw when the strict variant would, and reports each missing slug', () => {
    const s = slide({
      slideNumber: 3,
      slideName: 'cta',
      content: { qrAsset: 'no-such-qr' } as never,
      sound: { kind: 'whoosh', trigger: 'enter' },
    } as unknown as Partial<SlideSpec> & Pick<SlideSpec, 'slideNumber' | 'slideName'>);

    // Sanity — strict throws.
    expect(() => initAssetRegistry(baseDeck, [s])).toThrow();

    // Soft variant returns the same errors but does not throw, and pushes
    // overlay-eligible entries (audio + qr, not icon) into the store.
    const errors = initAssetRegistrySoft(baseDeck, [s]);
    expect(errors.length).toBeGreaterThanOrEqual(2);
    const entries = getBrokenAssetReport().entries;
    const slugs = entries.map((e) => `${e.kind}:${e.slug}`).sort();
    expect(slugs).toEqual(['audio:whoosh', 'qr:no-such-qr']);
    for (const e of entries) expect(e.reason).toBe('missing-slug');
  });

  it('skips icon errors and rogue-block errors (not file-replaceable)', () => {
    const s = slide({
      slideNumber: 1,
      slideName: 'open',
      content: {
        titleAmbient: { iconPool: ['unknown-icon'] },
      } as never,
    });
    initAssetRegistrySoft(baseDeck, [s]);
    expect(getBrokenAssetReport().entries).toHaveLength(0);
  });
});

describe('reportDeclaredAssetFiles — pipes HEAD failures into the store', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('reports each non-2xx URL with HTTP status detail', async () => {
    const deck = {
      ...baseDeck,
      assets: {
        audio: { whoosh: '/sounds/missing.mp3' },
        brand: { logo: '/brand/missing.png' },
      },
    } as unknown as DeckSpec;

    globalThis.fetch = vi.fn(async () =>
      // Simulate every URL 404'ing — only HTTP status matters here.
      new Response(null, { status: 404, statusText: 'Not Found' }),
    ) as unknown as typeof fetch;

    await reportDeclaredAssetFiles(deck);
    const entries = getBrokenAssetReport().entries;
    const keys = entries.map((e) => `${e.kind}:${e.slug}:${e.reason}`).sort();
    expect(keys).toEqual([
      'audio:whoosh:url-fetch-failed',
      'brand:logo:url-fetch-failed',
    ]);
    for (const e of entries) {
      expect(e.detail).toMatch(/HTTP 404/);
    }
  });
});
