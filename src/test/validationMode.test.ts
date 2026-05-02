/**
 * Unit tests for the configurable validation-mode persistence layer.
 *
 * These tests intentionally do NOT exercise `loader.ts`'s strict-throw
 * behaviour — the loader runs once at module-init time, so testing it
 * properly requires a separate vitest workspace. What we cover here is
 * the contract the Settings UI relies on: read / write / clear / URL
 * override / invalid-value rejection.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_VALIDATION_MODE,
  VALIDATION_MODE_KEY,
  getValidationMode,
  resetValidationMode,
  setValidationMode,
} from '../slides/validationMode';

// jsdom defaults to "http://localhost:3000" but other test runners may pick
// a different origin — derive it dynamically so replaceState doesn't reject
// the URL as cross-origin.
const ORIGIN = window.location.origin;
const ORIGINAL_HREF = `${ORIGIN}/`;

function setUrl(pathAndQuery: string) {
  // jsdom allows replacing window.location.href via history.replaceState
  // as long as the origin is unchanged.
  window.history.replaceState(null, '', pathAndQuery);
}

describe('validationMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setUrl(ORIGINAL_HREF);
  });
  afterEach(() => {
    window.localStorage.clear();
    setUrl(ORIGINAL_HREF);
  });

  it('defaults to "warn" when nothing is stored', () => {
    expect(getValidationMode()).toBe(DEFAULT_VALIDATION_MODE);
    expect(DEFAULT_VALIDATION_MODE).toBe('warn');
  });

  it('persists and reads back a chosen mode', () => {
    setValidationMode('strict');
    expect(window.localStorage.getItem(VALIDATION_MODE_KEY)).toBe('strict');
    expect(getValidationMode()).toBe('strict');
  });

  it('clears the persisted mode on reset', () => {
    setValidationMode('strict');
    resetValidationMode();
    expect(window.localStorage.getItem(VALIDATION_MODE_KEY)).toBeNull();
    expect(getValidationMode()).toBe(DEFAULT_VALIDATION_MODE);
  });

  it('ignores invalid stored values and falls back to default', () => {
    window.localStorage.setItem(VALIDATION_MODE_KEY, 'banana');
    expect(getValidationMode()).toBe(DEFAULT_VALIDATION_MODE);
  });

  it('honours ?validation=strict URL override over storage', () => {
    setValidationMode('warn');
    setUrl('/?validation=strict');
    expect(getValidationMode()).toBe('strict');
  });

  it('honours ?validation=warn URL override over storage', () => {
    setValidationMode('strict');
    setUrl('/?validation=warn');
    expect(getValidationMode()).toBe('warn');
  });

  it('ignores invalid URL override values and uses storage', () => {
    setValidationMode('strict');
    setUrl('/?validation=loose');
    expect(getValidationMode()).toBe('strict');
  });
});
