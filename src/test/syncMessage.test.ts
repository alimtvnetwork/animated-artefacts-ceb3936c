import { describe, expect, it, vi } from 'vitest';
import {
  handleSyncMessage,
  isSyncMessage,
  type SyncMessage,
  type SyncMessageHandlers,
} from '@/slides/sync';

/**
 * v0.183 — guard the strongly-typed SyncMessage handler.
 *
 * If a new variant is added to {@link SyncMessage}, TypeScript will fail to
 * compile any `SyncMessageHandlers` literal that doesn't cover it, AND the
 * runtime tests below will fail loudly (the dispatcher's `assertNever` throws
 * for anything it can't match). Both layers are intentional belt-and-braces.
 */
describe('isSyncMessage', () => {
  it('accepts every documented variant', () => {
    const ok: SyncMessage[] = [
      { type: 'slide', n: 3 },
      { type: 'nav', dir: 'next' },
      { type: 'nav', dir: 'prev' },
      { type: 'nav', dir: 'jump', n: 7 },
      { type: 'request-state' },
      { type: 'theme', id: 'noir' },
    ];
    for (const m of ok) expect(isSyncMessage(m)).toBe(true);
  });

  it('rejects malformed payloads', () => {
    expect(isSyncMessage(null)).toBe(false);
    expect(isSyncMessage(undefined)).toBe(false);
    expect(isSyncMessage('slide')).toBe(false);
    expect(isSyncMessage({})).toBe(false);
    expect(isSyncMessage({ type: 'slide' })).toBe(false); // missing n
    expect(isSyncMessage({ type: 'slide', n: '3' })).toBe(false); // wrong shape
    expect(isSyncMessage({ type: 'nav' })).toBe(false); // missing dir
    expect(isSyncMessage({ type: 'nav', dir: 'jump' })).toBe(false); // missing n
    expect(isSyncMessage({ type: 'nav', dir: 'sideways' })).toBe(false);
    expect(isSyncMessage({ type: 'theme' })).toBe(false); // missing id
    expect(isSyncMessage({ type: 'who-knows' })).toBe(false);
  });
});

describe('handleSyncMessage', () => {
  function makeHandlers(): SyncMessageHandlers & {
    calls: { type: SyncMessage['type']; payload: SyncMessage }[];
  } {
    const calls: { type: SyncMessage['type']; payload: SyncMessage }[] = [];
    return {
      calls,
      slide: (m) => {
        calls.push({ type: 'slide', payload: m });
      },
      nav: (m) => {
        calls.push({ type: 'nav', payload: m });
      },
      'request-state': (m) => {
        calls.push({ type: 'request-state', payload: m });
      },
      theme: (m) => {
        calls.push({ type: 'theme', payload: m });
      },
    };
  }

  it('routes each variant to its handler with the narrowed payload', () => {
    const h = makeHandlers();
    handleSyncMessage({ type: 'slide', n: 12 }, h);
    handleSyncMessage({ type: 'nav', dir: 'next' }, h);
    handleSyncMessage({ type: 'nav', dir: 'jump', n: 4 }, h);
    handleSyncMessage({ type: 'request-state' }, h);
    handleSyncMessage({ type: 'theme', id: 'noir' }, h);

    expect(h.calls.map((c) => c.type)).toEqual([
      'slide',
      'nav',
      'nav',
      'request-state',
      'theme',
    ]);
    expect(h.calls[0].payload).toEqual({ type: 'slide', n: 12 });
    expect(h.calls[2].payload).toEqual({ type: 'nav', dir: 'jump', n: 4 });
    expect(h.calls[4].payload).toEqual({ type: 'theme', id: 'noir' });
  });

  it('returns the handler return value for non-void R', () => {
    const result = handleSyncMessage<string>(
      { type: 'slide', n: 1 },
      {
        slide: ({ n }) => `slide:${n}`,
        nav: () => 'nav',
        'request-state': () => 'req',
        theme: ({ id }) => `theme:${id}`,
      },
    );
    expect(result).toBe('slide:1');
  });

  it('throws on a runtime payload with an unknown discriminant', () => {
    // Force an invalid value past the type system to simulate a forward-compat
    // bug — `assertNever`'s runtime guard should catch it.
    const bad = { type: 'unknown' } as unknown as SyncMessage;
    expect(() => handleSyncMessage(bad, makeHandlers())).toThrow(/Unhandled SyncMessage/);
  });

  it('integrates with isSyncMessage as a MessageEvent guard', () => {
    const setCurrent = vi.fn<(n: number) => void>();
    const data: unknown = { type: 'slide', n: 9 };
    if (isSyncMessage(data)) {
      handleSyncMessage(data, {
        slide: ({ n }) => setCurrent(n),
        nav: () => {},
        'request-state': () => {},
        theme: () => {},
      });
    }
    expect(setCurrent).toHaveBeenCalledWith(9);
  });
});
