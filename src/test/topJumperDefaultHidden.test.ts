/**
 * Regression: Top Slide Jumper default visibility = HIDDEN.
 *
 * Spec sources:
 *  - `spec/21-slides-system/65-presenter-shortcuts-v5.md` §2 — "hidden by default"
 *  - `spec/21-slides-system/64-presenter-webcam.md` §"Top Talk Jumper"
 *  - `updates/spec/17-top-jumper-default-hidden.md`
 *  - `.lovable/memory/features/top-jumper-visibility-toggle.md`
 *
 * Storage contract for `localStorage['riseup.topJumperHidden']`:
 *   missing | '1' | anything else  → hidden
 *   '0'                             → shown (user opted in)
 *
 * Static source assertions: mounting `SlideDeckPage` requires the router,
 * deck loader, webcam provider and FitStage — overkill for asserting a
 * 6-line state initialiser. We re-evaluate the initialiser in isolation
 * against a stubbed `window.localStorage` to lock the contract.
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

/**
 * Compile the initialiser as a function we can call with a fake
 * `localStorage`. We swap the `window.localStorage` reference so we can
 * drive different stored values.
 */
function runInitialiser(storedValue: string | null): boolean {
  const fakeStorage = {
    getItem: (_k: string) => storedValue,
  };
  // eslint-disable-next-line no-new-func
  const fn = new Function('window', initBody) as (w: unknown) => boolean;
  return fn({ localStorage: fakeStorage });
}

describe('Top Slide Jumper — default-hidden contract', () => {
  it('source: initialiser reads from riseup.topJumperHidden', () => {
    expect(initBody).toMatch(/riseup\.topJumperHidden/);
  });

  it("source: returns true (hidden) when stored value is anything except '0'", () => {
    expect(initBody).toMatch(/stored\s*!==\s*'0'/);
  });

  it('default (no key set) → HIDDEN', () => {
    expect(runInitialiser(null)).toBe(true);
  });

  it("legacy explicit '1' → HIDDEN", () => {
    expect(runInitialiser('1')).toBe(true);
  });

  it("explicit '0' (user opted in) → SHOWN", () => {
    expect(runInitialiser('0')).toBe(false);
  });

  it('garbage value → HIDDEN (defensive)', () => {
    expect(runInitialiser('lolwut')).toBe(true);
    expect(runInitialiser('')).toBe(true);
  });

  it('SSR / no window → HIDDEN', () => {
    // Re-run with `window` undefined; the initialiser must early-return true
    // before touching `window.localStorage`.
    // eslint-disable-next-line no-new-func
    const fn = new Function('window', initBody) as (w: unknown) => boolean;
    expect(fn(undefined)).toBe(true);
  });

  it('write path: J-toggle persists "1" when hiding and "0" when showing', () => {
    // The storage write happens in the toggle handler; assert the inverse
    // mapping is preserved so existing users keep their choice.
    expect(SRC).toMatch(
      /setItem\(\s*'riseup\.topJumperHidden'\s*,\s*next\s*\?\s*'1'\s*:\s*'0'/,
    );
  });

  it('render gate: chip is mounted only when !gridOpen && !topJumperHidden', () => {
    expect(SRC).toMatch(/!gridOpen\s*&&\s*!topJumperHidden/);
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

  it('memory note records HIDDEN as the active default', () => {
    const memo = readFileSync(
      resolve(__dirname, '..', '..', '.lovable', 'memory', 'features', 'top-jumper-visibility-toggle.md'),
      'utf8',
    );
    expect(memo).toMatch(/Default.*HIDDEN/i);
    expect(memo).toMatch(/stored\s*!==\s*'0'|missing key OR `'1'`.*hidden/);
  });
});
