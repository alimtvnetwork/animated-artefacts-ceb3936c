/**
 * Regression: switching webcam shape (`O`) must never remount/re-key the
 * live <video> node. A remount detaches MediaStream briefly and blanks the
 * camera during the circle/rectangle transition.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(
  resolve(__dirname, '..', 'slides', 'components', 'PresenterWebcamOverlay.tsx'),
  'utf8',
);

function videoTags(source: string): string[] {
  return Array.from(source.matchAll(/<video[\s\S]*?\/\>/g)).map((m) => m[0]);
}

describe('PresenterWebcamOverlay video node stability', () => {
  it('does not key any webcam video element', () => {
    const tags = videoTags(SRC);
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) {
      expect(tag).not.toMatch(/\bkey=/);
    }
  });

  it('does not use shape state to remount animation wrappers', () => {
    expect(SRC).not.toMatch(/key=\{`[^`]*shape/i);
    expect(SRC).not.toMatch(/key=\{[^}]*circleShape/i);
    expect(SRC).not.toMatch(/useState\([^)]*shapeAnim/i);
  });

  // 2026-05-02 — Shared-stream contract:
  // Circle and rectangle modes must reuse a SINGLE <video> node in the
  // floating overlay. The morph is purely CSS on the wrapper; toggling
  // shape must never branch the JSX into two <video> trees.
  it('floating overlay binds exactly one <video> via bindFloatingVideo', () => {
    const matches = SRC.match(/ref=\{bindFloatingVideo\}/g) ?? [];
    expect(matches.length).toBe(1);
  });

  // Stage and fullscreen phases each render their own <video> in
  // mutually-exclusive `if (state.phase === ...)` branches, so only one
  // is ever mounted at a time. Guard against accidental duplication
  // inside a single branch by capping each ref usage at two occurrences
  // (one per phase branch).
  it('stage/fullscreen overlays each bind exactly one <video>', () => {
    const matches = SRC.match(/ref=\{bindFullscreenVideo\}/g) ?? [];
    expect(matches.length).toBe(2);
  });

  // Defense-in-depth: no branch should conditionally render two <video>
  // elements based on circleShape.
  it('never ternary-renders <video> based on circleShape', () => {
    expect(SRC).not.toMatch(/circleShape\s*\?\s*<video/);
  });
});