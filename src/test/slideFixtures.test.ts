/**
 * Verifies every per-slideType fixture in `src/slides/fixtures.ts` actually
 * behaves the way it advertises against the live `validateSlide()` contract.
 *
 * Two layers of coverage:
 *   1. **Coverage** — every key in `SLIDE_CONTENT_CONTRACTS` MUST have a
 *      matching fixture (and vice-versa). This guarantees that adding a
 *      new slideType without a fixture fails CI immediately.
 *   2. **Behavior** — for each slideType:
 *        - the `valid` fixture parses cleanly,
 *        - every `invalid` case fails on the *expected* dotted path with
 *          a message that matches the expected substring/regex.
 *
 * If you tighten a contract, add a corresponding `invalid` entry here so
 * the regression is captured in a named test, not just by an existing
 * spec/showcase JSON file that may or may not exercise the new rule.
 */
import { describe, it, expect } from 'vitest';
import { SLIDE_CONTENT_CONTRACTS, validateSlide } from '../slides/contracts';
import { SLIDE_FIXTURES } from '../slides/fixtures';

describe('slide fixtures — coverage', () => {
  it('has a fixture for every registered slideType', () => {
    const contractTypes = Object.keys(SLIDE_CONTENT_CONTRACTS).sort();
    const fixtureTypes = Object.keys(SLIDE_FIXTURES).sort();
    expect(fixtureTypes).toEqual(contractTypes);
  });
});

describe('slide fixtures — valid examples parse cleanly', () => {
  for (const [slideType, fixture] of Object.entries(SLIDE_FIXTURES)) {
    it(`${slideType}: ${fixture.description}`, () => {
      const result = validateSlide(fixture.valid);
      if (result.ok === false) {
        // Surface every issue in the failure message so a broken fixture
        // is obvious from the test output without re-running locally.
        const lines = result.issues.map((i) => `  • ${i.path}: ${i.message}`).join('\n');
        throw new Error(`Valid fixture for ${slideType} unexpectedly failed:\n${lines}`);
      }
      expect(result.ok).toBe(true);
    });
  }
});

describe('slide fixtures — invalid examples fail on the expected path', () => {
  for (const [slideType, fixture] of Object.entries(SLIDE_FIXTURES)) {
    for (const invalid of fixture.invalid) {
      it(`${slideType}: ${invalid.description}`, () => {
        const result = validateSlide(invalid.payload);
        expect(result.ok).toBe(false);
        if (result.ok === true) return; // narrow for TS
        // At least one issue must hit the documented path AND carry a
        // message matching the documented substring/regex. We don't
        // require an exact match because zod's wording can change with
        // a minor upgrade — the path is the stable contract.
        const matched = result.issues.find(
          (i) =>
            i.path === invalid.expectPath &&
            (invalid.expectedMessageMatch instanceof RegExp
              ? invalid.expectedMessageMatch.test(i.message)
              : i.message.includes(invalid.expectedMessageMatch)),
        );
        if (!matched) {
          const lines = result.issues
            .map((i) => `  • ${i.path}: ${i.message}`)
            .join('\n');
          throw new Error(
            `Expected an issue at "${invalid.expectPath}" matching ${String(
              invalid.expectedMessageMatch,
            )}.\nActual issues:\n${lines}`,
          );
        }
        expect(matched).toBeDefined();
      });
    }
  }
});
