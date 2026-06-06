import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SlideTransition } from '../slides/enums';

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(__dirname, path), 'utf8'));
}

describe('transition registries stay in sync with runtime enums', () => {
  it('slide.schema.json transition enum matches SlideTransition', () => {
    const schema = readJson('../../spec/21-slides-system/slide.schema.json');
    const schemaTransitions: string[] = schema.properties.transition.enum;
    expect([...schemaTransitions].sort()).toEqual(Object.values(SlideTransition).sort());
  });

  it('CATALOG.json transition registry matches SlideTransition', () => {
    const catalog = readJson('../../spec/21-slides-system/llm/CATALOG.json');
    const catalogTransitions: string[] = catalog.registries.slideTransitions.values
      .map((value: { name: string }) => value.name);
    expect([...catalogTransitions].sort()).toEqual(Object.values(SlideTransition).sort());
    expect(catalog.registries.slideTransitions.count).toBe(Object.values(SlideTransition).length);
  });
});