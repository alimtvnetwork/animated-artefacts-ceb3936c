import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildLlmGuideMarkdown } from '../slides/llmGuideBundle';
import { SLIDE_CONTENT_CONTRACTS, SLIDE_CONTRACTS_VERSION } from '../slides/contracts';

describe('downloadable guide is slide-content only', () => {
  const md = buildLlmGuideMarkdown({ deckName: 'test' });

  it('instructs the AI to write output to the filesystem first (default .lovable/)', () => {
    expect(md).toContain('write your output to the filesystem first');
    expect(md).toContain('`.lovable/`');
  });

  it('includes the slide JSON schema, enum catalog, and theme tokens', () => {
    expect(md).toContain('Slide JSON schema');
    expect(md).toContain('Runtime catalog (enumerated values)');
    expect(md).toContain('Active theme & color tokens');
  });

  it('embeds the simplified single-file slide-authoring guide', () => {
    expect(md).toContain('Slide authoring guide');
    expect(md).toContain('single-file manifest contract');
  });

  it('excludes process / "how to work" material', () => {
    expect(md).not.toContain('Fast path (root');
    expect(md).not.toContain('Blind-follow modification pack');
    expect(md).not.toContain('Authoring pack');
    expect(md).not.toContain('## File: `01-modify-a-slide-step-by-step.md`');
  });
});

describe('slideType registry is the source of truth the docs cite', () => {
  it('exposes 31 runtime contracts at version 9', () => {
    expect(Object.keys(SLIDE_CONTENT_CONTRACTS)).toHaveLength(31);
    expect(SLIDE_CONTRACTS_VERSION).toBe(9);
  });

  it('slide.schema.json enum matches the runtime contract list (no drift)', () => {
    const schemaPath = resolve(__dirname, '../../spec/21-slides-system/slide.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const enumTypes: string[] = schema.properties.slideType.enum;
    expect([...enumTypes].sort()).toEqual(Object.keys(SLIDE_CONTENT_CONTRACTS).sort());
  });

  it('slide.schema.json oneOf has a content variant for every slideType', () => {
    const schemaPath = resolve(__dirname, '../../spec/21-slides-system/slide.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const variantConsts: string[] = schema.oneOf.map(
      (v: { properties: { slideType: { const: string } } }) => v.properties.slideType.const,
    );
    expect([...variantConsts].sort()).toEqual(Object.keys(SLIDE_CONTENT_CONTRACTS).sort());
  });
});
