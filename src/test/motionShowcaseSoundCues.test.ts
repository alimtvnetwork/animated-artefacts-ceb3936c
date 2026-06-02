import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * motion-showcase deck: the four step-family slides (08–11) must each carry a
 * DISTINCT, registered sound cue so the demo is audibly different per motion
 * family. Guards against accidental cue collisions or unregistered kinds.
 */
const DECK = path.resolve(
  __dirname,
  '../../front-end/project/motion-showcase/data/slides',
);

// Mirror of SoundKind in src/slides/sound.ts.
const REGISTERED = new Set(['whoosh', 'click', 'fadeClick', 'pop', 'zoom', 'fadeZoom']);

const STEP_FAMILY = [
  '08-step-timeline',
  '09-focus-timeline',
  '10-advance-step',
  '11-steps-3d',
];

function read(slug: string) {
  return JSON.parse(fs.readFileSync(path.join(DECK, `${slug}.json`), 'utf8'));
}

describe('motion-showcase step-family sound cues', () => {
  it('every step-family slide declares a registered sound kind', () => {
    for (const slug of STEP_FAMILY) {
      const spec = read(slug);
      expect(spec.sound, `${slug} missing sound block`).toBeTruthy();
      expect(REGISTERED.has(spec.sound.kind), `${slug} kind=${spec.sound.kind}`).toBe(true);
    }
  });

  it('the four cues are mutually distinct', () => {
    const kinds = STEP_FAMILY.map((s) => read(s).sound.kind);
    expect(new Set(kinds).size).toBe(STEP_FAMILY.length);
  });
});
