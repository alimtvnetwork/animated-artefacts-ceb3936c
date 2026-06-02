import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Walks every bundled deck slide and asserts each declared image source is
 * resolvable: `/assets/...` paths must exist under `public/`, data URIs must
 * be well-formed, and inline data URIs stay under the soft size budget.
 * Guards the image-authoring contract (spec/21-slides-system/images/01).
 */
const PROJECT_ROOT = join(__dirname, '..', '..');
const DECKS_DIR = join(PROJECT_ROOT, 'front-end', 'project');
const PUBLIC_DIR = join(PROJECT_ROOT, 'public');
const INLINE_SOFT_LIMIT = 20_000;

function walkJson(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walkJson(p));
    else if (entry.endsWith('.json')) out.push(p);
  }
  return out;
}

function collectImageSrcs(content: any): string[] {
  const srcs: string[] = [];
  if (!content || typeof content !== 'object') return srcs;
  if (typeof content.image === 'string') srcs.push(content.image);
  if (Array.isArray(content.images)) srcs.push(...content.images.filter((s: unknown) => typeof s === 'string'));
  if (Array.isArray(content.steps)) {
    for (const s of content.steps) if (typeof s?.image === 'string') srcs.push(s.image);
  }
  return srcs;
}

function assertResolvable(src: string) {
  if (src.startsWith('data:')) {
    expect(src, `data URI must declare a mime type: ${src.slice(0, 32)}`).toMatch(/^data:image\/[a-z+]+[;,]/);
    expect(src.length, `inline image under ${INLINE_SOFT_LIMIT} bytes`).toBeLessThan(INLINE_SOFT_LIMIT);
    return;
  }
  if (src.startsWith('/')) {
    expect(existsSync(join(PUBLIC_DIR, src)), `public asset must exist: ${src}`).toBe(true);
    return;
  }
  // http(s) or relative imports are out of scope for this static check.
  expect(/^https?:\/\//.test(src) || !src.startsWith('/'), `unexpected src form: ${src}`).toBe(true);
}

describe('deck image-source sanity', () => {
  const files = walkJson(join(DECKS_DIR)).filter((f) => f.includes(`${join('data', 'slides')}`));

  it('finds bundled slide JSON files', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const json = JSON.parse(readFileSync(file, 'utf8'));
    const srcs = collectImageSrcs(json.content);
    if (srcs.length === 0) continue;
    it(`resolves image srcs in ${file.split('/project/')[1]}`, () => {
      for (const src of srcs) assertResolvable(src);
    });
  }
});
