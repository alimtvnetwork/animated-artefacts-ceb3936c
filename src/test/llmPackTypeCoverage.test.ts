import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SlideType } from '../slides/enums';

/**
 * Coverage guard for the LLM authoring pack. Every renderable `SlideType`
 * enum value MUST be documented in both the portable root `LLM.md` and the
 * per-type contracts doc (`23-slide-type-contracts.md`). New media types
 * (FullBleed/SplitMedia/MediaGrid) previously shipped runtime-only and were
 * invisible to LLM authors — this test fails the build if that recurs.
 */
const PACK_DOC = '../../spec/21-slides-system/llm/23-slide-type-contracts.md';

function read(path: string): string {
  return readFileSync(resolve(__dirname, path), 'utf8');
}

describe('LLM pack documents every SlideType', () => {
  const contracts = read(PACK_DOC);
  const llmMd = read('../../LLM.md');

  for (const type of Object.values(SlideType)) {
    it(`23-slide-type-contracts.md lists ${type}`, () => {
      expect(contracts, `missing ${type} in contracts doc`).toContain(type);
    });
    it(`LLM.md lists ${type}`, () => {
      expect(llmMd, `missing ${type} in LLM.md`).toContain(type);
    });
  }
});
