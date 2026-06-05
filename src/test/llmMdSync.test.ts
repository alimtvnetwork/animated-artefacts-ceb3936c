import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SLIDE_CONTENT_CONTRACTS } from '../slides/contracts';
import { SlideTransition, TextAnimation, CapsuleColor } from '../slides/enums';

/**
 * Drift guard for the root `LLM.md` — the single shareable authoring guide.
 *
 * `LLM.md` duplicates the canonical enums for portability (so it can be handed
 * to any LLM standalone). These tests fail the build if the doc falls out of
 * sync with the source of truth (`contracts.ts` + `enums.ts`), which is exactly
 * how it drifted before (listed a non-existent type, omitted ZoomOut, etc.).
 */
describe('root LLM.md stays in sync with canonical enums', () => {
  const md = readFileSync(resolve(__dirname, '../../LLM.md'), 'utf8');

  it('lists every renderable slideType (SLIDE_CONTENT_CONTRACTS)', () => {
    for (const type of Object.keys(SLIDE_CONTENT_CONTRACTS)) {
      expect(md, `LLM.md missing slideType ${type}`).toContain(type);
    }
  });

  it('lists every slide transition', () => {
    for (const t of Object.values(SlideTransition)) {
      expect(md, `LLM.md missing transition ${t}`).toContain(t);
    }
  });

  it('lists every text animation', () => {
    for (const a of Object.values(TextAnimation)) {
      expect(md, `LLM.md missing textAnimation ${a}`).toContain(a);
    }
  });

  it('lists every capsule tone', () => {
    for (const c of Object.values(CapsuleColor)) {
      expect(md, `LLM.md missing capsule tone ${c}`).toContain(`\`${c}\``);
    }
  });
});
