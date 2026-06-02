import { describe, it, expect } from 'vitest';
import { buildLlmGuideMarkdown } from '../slides/llmGuideBundle';
import { SLIDE_CONTENT_CONTRACTS, SLIDE_CONTRACTS_VERSION } from '../slides/contracts';

describe('llm-guideline pack is bundled into the downloadable guide', () => {
  const md = buildLlmGuideMarkdown({ deckName: 'test' });

  it('includes the blind-follow modification pack section', () => {
    expect(md).toContain('Blind-follow modification pack');
    expect(md).toContain('spec/llm-guideline/');
  });

  it('embeds each guideline file (non-empty)', () => {
    for (const f of [
      '01-modify-a-slide-step-by-step.md',
      '03-field-reference.md',
      '07-extended-type-recipes.md',
      '09-decision-tree.md',
    ]) {
      expect(md).toContain(`## File: \`${f}\``);
    }
  });

  it('still includes the deep authoring pack and schema', () => {
    expect(md).toContain('Authoring pack');
    expect(md).toContain('Slide JSON schema');
  });
});

describe('slideType registry is the source of truth the docs cite', () => {
  it('exposes 25 runtime contracts at version 7', () => {
    expect(Object.keys(SLIDE_CONTENT_CONTRACTS)).toHaveLength(25);
    expect(SLIDE_CONTRACTS_VERSION).toBe(7);
  });
});
