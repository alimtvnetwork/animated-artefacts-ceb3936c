import { describe, it, expect } from 'vitest';
import { deriveBullets } from '../slides/utils/legacyBodyToBullets';

describe('deriveBullets — legacy body auto-conversion', () => {
  it('returns undefined when description is missing', () => {
    expect(deriveBullets(undefined)).toBeUndefined();
  });

  it('returns authored bullets verbatim (filtering empties)', () => {
    expect(deriveBullets({ bullets: ['Listen', 'Build', '  '] })).toEqual(['Listen', 'Build']);
  });

  it('prefers authored bullets over legacy body', () => {
    expect(
      deriveBullets({ bullets: ['Authored'], body: 'Should. Not. Win.' }),
    ).toEqual(['Authored']);
  });

  it('splits legacy body on periods', () => {
    expect(deriveBullets({ body: 'Listen. Build. Ship.' })).toEqual(['Listen', 'Build', 'Ship']);
  });

  it('splits on semicolons and commas too', () => {
    expect(deriveBullets({ body: 'Audit; interview, align' })).toEqual(['Audit', 'interview', 'align']);
  });

  it('dedupes case-insensitively, preserves first casing', () => {
    expect(deriveBullets({ body: 'Build, BUILD, ship' })).toEqual(['Build', 'ship']);
  });

  it('caps at 6 fragments', () => {
    const body = 'a. b. c. d. e. f. g. h.';
    expect(deriveBullets({ body })).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('returns undefined for empty/whitespace body', () => {
    expect(deriveBullets({ body: '   ' })).toBeUndefined();
    expect(deriveBullets({ body: '' })).toBeUndefined();
  });

  it('ignores non-string body', () => {
    expect(deriveBullets({ body: 42 as unknown as string })).toBeUndefined();
  });
});
