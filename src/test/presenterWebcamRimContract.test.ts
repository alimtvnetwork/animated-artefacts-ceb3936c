/**
 * Webcam squircle rim — v3 PNG-plate + transparent-mask contract guard
 * (2026-06-05).
 *
 * Per presenter direction the rim is a baked PNG **plate**
 * (`squircle-plate-gold.png`) composited behind the live video, and the video
 * is cropped to a transparent squircle with a PNG **mask**
 * (`squircle-mask.png`) via `mask-image`. The plate carries the gold→ember rim
 * + soft drop shadow; the mask alpha keeps the interior transparent. Circle
 * (`O`) + the minimized puck fall back to CSS border-radius.
 *
 * This test reads the overlay source and locks that v3 contract.
 *
 * Spec: spec/camera-2026/05-backgrounds-and-shapes.md §8 (v3).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(
  join(process.cwd(), 'src/slides/components/PresenterWebcamOverlay.tsx'),
  'utf8',
);

describe('PresenterWebcamOverlay — v3 plate + mask squircle contract', () => {
  it('imports the runtime plate and mask PNGs from src/assets/camera-2026', () => {
    expect(SRC).toMatch(/import\s+squirclePlate\s+from\s+'@\/assets\/camera-2026\/squircle-plate-gold\.png'/);
    expect(SRC).toMatch(/import\s+squircleMask\s+from\s+'@\/assets\/camera-2026\/squircle-mask\.png'/);
  });

  it('crops the live video with the mask PNG via mask-image', () => {
    expect(SRC).toMatch(/maskImage:\s*`url\(\$\{squircleMask\}\)`/);
    expect(SRC).toMatch(/WebkitMaskImage:\s*`url\(\$\{squircleMask\}\)`/);
    expect(SRC).toMatch(/SQUIRCLE_MASK_STYLE/);
  });

  it('renders the plate behind the video via the SquirclePlate component', () => {
    expect(SRC).toMatch(/function SquirclePlate/);
    // Plate is rendered on the floating, stage, and fullscreen surfaces.
    const occurrences = (SRC.match(/<SquirclePlate /g) ?? []).length;
    expect(occurrences).toBeGreaterThanOrEqual(3);
  });

  it('keeps the squircle silhouette + circle/puck CSS fallbacks', () => {
    expect(SRC).toMatch(/'38% \/ 34%'/);
    expect(SRC).toMatch(/frameRadius = minimized \? 999 : circleShape \? '50%' : '38% \/ 34%'/);
  });

  it('gates plate/mask to squircle mode (not circle, not minimized)', () => {
    expect(SRC).toMatch(/const useSquircle = !circleShape && !minimized/);
    expect(SRC).toMatch(/<SquirclePlate show=\{useSquircle\} \/>/);
    expect(SRC).toMatch(/<SquirclePlate show=\{!circleShape\} \/>/);
  });
});
