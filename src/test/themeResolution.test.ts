/**
 * v0.173 — boot-time theme resolution.
 *
 * Locks in the priority order documented on `getInitialTheme()`:
 *   1. `?theme=<id>` URL override
 *   2. `?testMode=1` + deck-declared theme
 *   3. localStorage
 *   4. DEFAULT_THEME
 *
 * Test mode also suppresses `setTheme`'s localStorage write so a reload
 * always lands back on the deck theme — that's the whole point of the
 * deterministic preview flag (screenshot diffs, contrast audits, shareable
 * preview URLs).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  getInitialTheme,
  getStoredTheme,
  getStoredThemeForDeck,
  getUrlThemeOverride,
  isTestMode,
  setActiveDeckSlug,
  setTheme,
} from '../slides/themes';

const STORAGE_KEY = 'riseup.theme.v1';
const STORAGE_KEY_BY_DECK = 'riseup.theme.byDeck.v1';

function setUrl(search: string) {
  // jsdom respects history.replaceState for window.location.search reads.
  window.history.replaceState(null, '', `/${search}`);
}

describe('theme resolution', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setUrl('');
    setActiveDeckSlug(null);
  });
  afterEach(() => {
    window.localStorage.clear();
    setUrl('');
    setActiveDeckSlug(null);
  });

  it('falls back to DEFAULT_THEME when nothing is set', () => {
    expect(getInitialTheme()).toBe(DEFAULT_THEME);
  });

  it('returns localStorage value when no URL flags', () => {
    window.localStorage.setItem(STORAGE_KEY, 'github-light');
    expect(getStoredTheme()).toBe('github-light');
    expect(getInitialTheme()).toBe('github-light');
  });

  it('?theme= overrides localStorage', () => {
    window.localStorage.setItem(STORAGE_KEY, 'github-light');
    setUrl('?theme=noir-gold');
    expect(getUrlThemeOverride()).toBe('noir-gold');
    expect(getInitialTheme('macos-sonoma')).toBe('noir-gold');
  });

  it('?theme= with unknown id is ignored', () => {
    setUrl('?theme=not-a-real-theme');
    expect(getUrlThemeOverride()).toBeNull();
    expect(getInitialTheme()).toBe(DEFAULT_THEME);
  });

  it('?testMode=1 forces deckTheme over localStorage', () => {
    window.localStorage.setItem(STORAGE_KEY, 'noir-gold');
    setUrl('?testMode=1');
    expect(isTestMode()).toBe(true);
    expect(getInitialTheme('github-light')).toBe('github-light');
  });

  it('?testMode=1 still yields to explicit ?theme=', () => {
    setUrl('?testMode=1&theme=noir-gold');
    expect(getInitialTheme('github-light')).toBe('noir-gold');
  });

  it('?testMode=1 without a valid deckTheme falls back to localStorage/default', () => {
    window.localStorage.setItem(STORAGE_KEY, 'macos-sonoma');
    setUrl('?testMode=1');
    expect(getInitialTheme(undefined)).toBe('macos-sonoma');
    expect(getInitialTheme('not-a-real-theme')).toBe('macos-sonoma');
  });

  it.each(['1', 'true', 'TRUE', 'yes', 'on'])(
    '?testMode=%s is truthy',
    (value) => {
      setUrl(`?testMode=${value}`);
      expect(isTestMode()).toBe(true);
    },
  );

  it.each(['0', 'false', 'no', 'off', ''])(
    '?testMode=%s is falsy',
    (value) => {
      setUrl(`?testMode=${value}`);
      expect(isTestMode()).toBe(false);
    },
  );

  it('setTheme suppresses localStorage write under testMode but still applies', () => {
    setUrl('?testMode=1');
    setTheme('github-light');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(document.documentElement.getAttribute('data-theme')).toBe('github-light');
  });

  it('per-deck pin wins over the global slot when slug is provided', () => {
    window.localStorage.setItem(STORAGE_KEY, 'noir-gold');
    window.localStorage.setItem(
      STORAGE_KEY_BY_DECK,
      JSON.stringify({ 'deck-a': 'github-light' }),
    );
    expect(getInitialTheme(undefined, 'deck-a')).toBe('github-light');
    // Different slug → no per-deck pin → falls through to global slot.
    expect(getInitialTheme(undefined, 'deck-b')).toBe('noir-gold');
  });

  it('getStoredThemeForDeck returns null for unknown / missing slugs', () => {
    expect(getStoredThemeForDeck(null)).toBeNull();
    expect(getStoredThemeForDeck('never-seen')).toBeNull();
  });

  it('setTheme writes per-deck slot when an active slug is registered', () => {
    setActiveDeckSlug('deck-a');
    setTheme('github-light');
    const raw = window.localStorage.getItem(STORAGE_KEY_BY_DECK);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual({ 'deck-a': 'github-light' });
    // Global slot still updated too.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('github-light');
  });

  it('per-deck pin survives across deck switches', () => {
    setActiveDeckSlug('deck-a');
    setTheme('github-light');
    setActiveDeckSlug('deck-b');
    setTheme('noir-gold');
    // Re-opening deck-a: pin should restore github-light even though the
    // global slot now points at noir-gold.
    expect(getInitialTheme(undefined, 'deck-a')).toBe('github-light');
    expect(getInitialTheme(undefined, 'deck-b')).toBe('noir-gold');
  });

  it('?theme= URL override still wins over per-deck pin', () => {
    window.localStorage.setItem(
      STORAGE_KEY_BY_DECK,
      JSON.stringify({ 'deck-a': 'github-light' }),
    );
    setUrl('?theme=noir-gold');
    expect(getInitialTheme(undefined, 'deck-a')).toBe('noir-gold');
  });

  it('testMode + deckTheme still wins over per-deck pin', () => {
    window.localStorage.setItem(
      STORAGE_KEY_BY_DECK,
      JSON.stringify({ 'deck-a': 'github-light' }),
    );
    setUrl('?testMode=1');
    expect(getInitialTheme('noir-gold', 'deck-a')).toBe('noir-gold');
  });
});
