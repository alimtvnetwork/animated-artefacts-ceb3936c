/**
 * Regression: Top Slide Jumper default visibility = HIDDEN, with the
 * one-shot legacy-`'0'` migration applied on first load.
 *
 * Spec sources:
 *  - `spec/21-slides-system/65-presenter-shortcuts-v5.md` §2 — "hidden by default"
 *  - `spec/21-slides-system/64-presenter-webcam.md` §"Top Talk Jumper"
 *  - `updates/spec/17-top-jumper-default-hidden.md` — first pass + migration
 *  - `.lovable/memory/features/top-jumper-visibility-toggle.md`
 *
 * Storage contract:
 *   `riseup.topJumperHidden`              missing | '1' | other → hidden
 *                                         '0'                  → shown
 *   `riseup.topJumperHidden.migrated.v1`  '1' = migration ran (do not re-run)
 *
 * Static source assertions: mounting `SlideDeckPage` requires the router,
 * deck loader, webcam provider and FitStage — overkill for a state
 * initialiser. We re-evaluate the initialiser body in isolation against a
 * stubbed `window.localStorage` to lock the contract end-to-end.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(
  resolve(__dirname, '..', 'pages', 'SlideDeckPage.tsx'),
  'utf8',
);

/** Pull the lazy initialiser body out of `useState<boolean>(() => { … })`. */
function extractInitialiser(): string {
  const head = SRC.indexOf('const [topJumperHidden, setTopJumperHidden]');
  expect(head).toBeGreaterThan(-1);
  const arrow = SRC.indexOf('() => {', head);
  expect(arrow).toBeGreaterThan(-1);
  let depth = 0;
  const open = SRC.indexOf('{', arrow);
  for (let i = open; i < SRC.length; i++) {
    if (SRC[i] === '{') depth++;
    else if (SRC[i] === '}') {
      depth--;
      if (depth === 0) return SRC.slice(open + 1, i);
    }
  }
  throw new Error('initialiser closer not found');
}

const initBody = extractInitialiser();
const KEY = 'riseup.topJumperHidden';
const MIGRATED = 'riseup.topJumperHidden.migrated.v1';

interface RunResult {
  result: boolean;
  finalStore: Record<string, string>;
  removed: string[];
}

/** Run the initialiser against a fresh fake `localStorage`. */
function runInitialiser(initial: Record<string, string>): RunResult {
  const store: Record<string, string> = { ...initial };
  const removed: string[] = [];
  const fakeStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { removed.push(k); delete store[k]; },
  };
  const fn = new Function('window', initBody) as (w: unknown) => boolean;
  const result = fn({ localStorage: fakeStorage });
  return { result, finalStore: store, removed };
}

describe('Top Slide Jumper — source contract', () => {
  it('initialiser reads from riseup.topJumperHidden', () => {
    expect(initBody).toMatch(/riseup\.topJumperHidden/);
  });

  it("returns true (hidden) when stored value is anything except '0'", () => {
    expect(initBody).toMatch(/stored\s*!==\s*'0'/);
  });

  it('one-shot migration is gated by riseup.topJumperHidden.migrated.v1', () => {
    expect(initBody).toMatch(/riseup\.topJumperHidden\.migrated\.v1/);
    expect(initBody).toMatch(/removeItem\(\s*'riseup\.topJumperHidden'/);
  });

  it('write path: J-toggle persists "1" when hiding and "0" when showing', () => {
    expect(SRC).toMatch(
      /setItem\(\s*'riseup\.topJumperHidden'\s*,\s*next\s*\?\s*'1'\s*:\s*'0'/,
    );
  });

  it('render gate: chip mounts only when !gridOpen && !topJumperHidden', () => {
    expect(SRC).toMatch(/!gridOpen\s*&&\s*!topJumperHidden/);
  });
});

describe('Top Slide Jumper — fresh-browser defaults', () => {
  it('no key set → HIDDEN', () => {
    expect(runInitialiser({}).result).toBe(true);
  });

  it("legacy explicit '1' → HIDDEN", () => {
    // First-load migration removes the key (legacy '1' is already hidden,
    // so the practical effect is identical), then the read resolves null → hidden.
    expect(runInitialiser({ [KEY]: '1' }).result).toBe(true);
  });

  it("garbage value → HIDDEN (defensive)", () => {
    expect(runInitialiser({ [KEY]: 'lolwut' }).result).toBe(true);
    expect(runInitialiser({ [KEY]: '' }).result).toBe(true);
  });

  it('SSR / no window → HIDDEN', () => {
    const fn = new Function('window', initBody) as (w: unknown) => boolean;
    expect(fn(undefined)).toBe(true);
  });
});

describe('Top Slide Jumper — one-shot legacy migration', () => {
  it("legacy '0' (opted-in under old default) is reset to HIDDEN on first load", () => {
    const r = runInitialiser({ [KEY]: '0' });
    expect(r.result).toBe(true);
    expect(r.removed).toContain(KEY);
    expect(r.finalStore[MIGRATED]).toBe('1');
    expect(KEY in r.finalStore).toBe(false);
  });

  it('migration sets the marker even when no legacy key was present', () => {
    const r = runInitialiser({});
    expect(r.finalStore[MIGRATED]).toBe('1');
  });

  it("migration does NOT re-run after the marker is set — opt-ins are preserved", () => {
    // Simulate: first load happened (marker set), user pressed J → '0' written,
    // user refreshes. The chip must remain SHOWN.
    const r = runInitialiser({ [KEY]: '0', [MIGRATED]: '1' });
    expect(r.result).toBe(false);
    expect(r.removed).not.toContain(KEY);
    expect(r.finalStore[KEY]).toBe('0');
  });

  it('user who hid the chip after migration stays HIDDEN on reload', () => {
    const r = runInitialiser({ [KEY]: '1', [MIGRATED]: '1' });
    expect(r.result).toBe(true);
    expect(r.removed).not.toContain(KEY);
  });
});

describe('Top Slide Jumper — spec parity', () => {
  it('shortcuts v5 spec declares the chip hidden by default', () => {
    const spec = readFileSync(
      resolve(__dirname, '..', '..', 'spec', '21-slides-system', '65-presenter-shortcuts-v5.md'),
      'utf8',
    );
    expect(spec).toMatch(/Top Talk Jumper.*hidden by default/i);
  });

  it('memory note records HIDDEN as the active default and documents the migration marker', () => {
    const memo = readFileSync(
      resolve(__dirname, '..', '..', '.lovable', 'memory', 'features', 'top-jumper-visibility-toggle.md'),
      'utf8',
    );
    expect(memo).toMatch(/Default.*HIDDEN/i);
    expect(memo).toMatch(/riseup\.topJumperHidden\.migrated\.v1/);
  });

  it('updates/spec/17 documents the migration second pass', () => {
    const update = readFileSync(
      resolve(__dirname, '..', '..', 'updates', 'spec', '17-top-jumper-default-hidden.md'),
      'utf8',
    );
    expect(update).toMatch(/migrated\.v1/);
    expect(update).toMatch(/one-shot/i);
  });
});
