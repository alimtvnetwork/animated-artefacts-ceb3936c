/**
 * Webcam squircle rim — CSS-only contract guard (2026-06-02 v2).
 *
 * The rejected look (a thick opaque gold/white ring) came from the baked
 * `04-squircle-plate-gold-shadow.png` plate + `02-squircle-mask-black.png`
 * crop. The approved look is the live video cropped via border-radius with a
 * thin gold→ember rim + soft shadow drawn purely in CSS, transparent interior.
 *
 * This test reads the overlay source and locks that contract so nobody
 * reintroduces a plate/mask PNG, a `platePad` rim, or a fill plate.
 *
 * Spec: spec/camera-2026/05-backgrounds-and-shapes.md §8 (v2).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(
  join(process.cwd(), 'src/slides/components/PresenterWebcamOverlay.tsx'),
  'utf8',
);

describe('PresenterWebcamOverlay — CSS-only squircle rim contract', () => {
  it('does not import the plate or mask PNGs', () => {
    expect(SRC).not.toMatch(/04-squircle-plate-gold-shadow/);
    expect(SRC).not.toMatch(/02-squircle-mask-black/);
  });

  it('has no plate scaffolding (platePad / showPlate / squirclePlate)', () => {
    expect(SRC).not.toMatch(/platePad/);
    expect(SRC).not.toMatch(/showPlate/);
    expect(SRC).not.toMatch(/squirclePlate/);
    expect(SRC).not.toMatch(/squircleMask/);
  });

  it('does not crop the camera with a url() mask-image (radial halo masks are fine)', () => {
    // Any image mask referencing a file would re-introduce the PNG crop.
    expect(SRC).not.toMatch(/[Mm]askImage:\s*`?url\(/);
  });

  it('renders the rim via a gold border + transparent interior', () => {
    expect(SRC).toMatch(/border:\s*'2px solid hsl\(var\(--gold\)/);
    expect(SRC).toMatch(/background:\s*'transparent'/);
  });

  it('keeps the squircle silhouette on border-radius (38% / 34%, circle 50%, puck 999)', () => {
    // The shape must come from border-radius so the rim border traces it.
    expect(SRC).toMatch(/'38% \/ 34%'/);
    expect(SRC).toMatch(/frameRadius = minimized \? 999 : circleShape \? '50%' : '38% \/ 34%'/);
  });

  it('layers ember + gold + drop shadow in the resting rim box-shadow', () => {
    expect(SRC).toMatch(/hsl\(var\(--ember\) \/ 0\.25\)/);
    expect(SRC).toMatch(/0 16px 40px hsl\(var\(--background\) \/ 0\.7\)/);
  });
});

