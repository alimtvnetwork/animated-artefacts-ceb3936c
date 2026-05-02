/**
 * v0.207 — Brand chrome inheritance chain regression tests.
 *
 * The user's invariant (memory + spec 47): every brand-chrome offset the
 * logo respects MUST also be respected by the body-grid eyebrow/title AND
 * by the step rail / chips / step rows below. These tests lock the chain
 * so a future refactor can't silently break alignment on any slide.
 *
 * Chain:
 *   logoScale  →  --brand-inset-x  (horizontal)   →  body-grid-margin-left
 *                                                  →  step-timeline-content margin-left
 *                                                  →  rail/connector/chips (left-[14px] inside)
 *                                                  →  step rows (paddingLeft from leftOffsetPx)
 *
 *   logoScale  →  --brand-inset-y  (vertical)    →  step-timeline-content padding-top
 *                                                  →  eyebrow / title / rail / rows top edge
 *
 * We drive `applyPresetSettings` directly with a fake `<html>` so the
 * resolver math is exercised without a browser, then read the stamped
 * vars back off `documentElement.style`.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  applyPresetSettings,
  DEFAULT_PRESET_SETTINGS,
  computeAutoBrandInsetX,
} from '@/slides/presetSettings';

function reset() {
  // jsdom provides documentElement; clear any inline styles between tests.
  const root = document.documentElement;
  root.removeAttribute('style');
  root.removeAttribute('data-pixel-snap');
}

describe('brand chrome inheritance — horizontal (--brand-inset-x)', () => {
  beforeEach(reset);

  it('default settings stamp the auto-inset value tied to the default logoScale', () => {
    applyPresetSettings(DEFAULT_PRESET_SETTINGS);
    const x = document.documentElement.style.getPropertyValue('--brand-inset-x');
    // Default ships with `autoInsetFromLogo: true` + logoScale 0.765 (not 0.85),
    // which maps to round(218 * 0.765 / 0.85) = 196px via `computeAutoBrandInsetX`.
    // The 218px anchor is now only hit at logoScale 0.85 (the LOGO_INSET_ANCHOR
    // sweet-spot). v0.X test was on the old default (0.85 → 218px) — see
    // `presetSettings.ts` DEFAULT_PRESET_SETTINGS.logoScale.
    expect(x).toContain('196');
  });

  it('body-grid-margin-left tracks --brand-inset-x in header-anchored mode', () => {
    applyPresetSettings({
      ...DEFAULT_PRESET_SETTINGS,
      bodyAlignment: 'header-anchored',
    });
    const margin = document.documentElement.style.getPropertyValue('--body-grid-margin-left');
    // The body-grid-margin-left token is wired to read `--brand-inset-x`,
    // so changing brandInsetX must propagate without touching the body-grid
    // margin assignment elsewhere. The exact form is `var(--brand-inset-x)`
    // (optionally wrapped in `calc(... + responsiveNudge)` when the user
    // sets `bodyGridNudge`).
    expect(margin).toContain('var(--brand-inset-x)');
  });

  it('autoInsetFromLogo couples horizontal inset to logoScale', () => {
    applyPresetSettings({
      ...DEFAULT_PRESET_SETTINGS,
      autoInsetFromLogo: true,
      logoScale: 1.0,
    });
    const x = document.documentElement.style.getPropertyValue('--brand-inset-x');
    // logoScale 1.0 → ratio 218 / 0.85 ≈ 256.5 → rounded 257
    const expected = computeAutoBrandInsetX(1.0);
    expect(x).toContain(String(expected));
  });

  it('pixel-snap rounds horizontal inset to whole pixel and drops max() wrapper', () => {
    applyPresetSettings({
      ...DEFAULT_PRESET_SETTINGS,
      pixelSnap: true,
      autoInsetFromLogo: false,
      brandInsetX: 218,
    });
    const x = document.documentElement.style.getPropertyValue('--brand-inset-x');
    expect(x).toBe('218px');
    expect(document.documentElement.getAttribute('data-pixel-snap')).toBe('true');
  });
});

describe('brand chrome inheritance — vertical (--brand-inset-y)', () => {
  beforeEach(reset);

  it('default settings stamp a positive vertical inset', () => {
    applyPresetSettings(DEFAULT_PRESET_SETTINGS);
    const y = document.documentElement.style.getPropertyValue('--brand-inset-y');
    expect(y).toMatch(/^\d+px$/);
    const px = parseInt(y, 10);
    // Sanity bounds: must clear the 96px header reserve (h-24) and cannot
    // exceed the historical 11rem (~176px) fullscreen ceiling.
    expect(px).toBeGreaterThanOrEqual(80);
    expect(px).toBeLessThanOrEqual(176);
  });

  it('vertical inset scales with logoScale (bigger logo ⇒ more breathing)', () => {
    applyPresetSettings({ ...DEFAULT_PRESET_SETTINGS, logoScale: 0.6 });
    const small = parseInt(document.documentElement.style.getPropertyValue('--brand-inset-y'), 10);

    applyPresetSettings({ ...DEFAULT_PRESET_SETTINGS, logoScale: 1.2 });
    const large = parseInt(document.documentElement.style.getPropertyValue('--brand-inset-y'), 10);

    expect(large).toBeGreaterThan(small);
    // Roughly 2× the scale ratio (1.2 / 0.6 = 2)
    expect(large / small).toBeGreaterThan(1.5);
  });

  it('pixel-snap leaves vertical inset as a whole-pixel value', () => {
    applyPresetSettings({ ...DEFAULT_PRESET_SETTINGS, pixelSnap: true });
    const y = document.documentElement.style.getPropertyValue('--brand-inset-y');
    expect(y).toMatch(/^\d+px$/); // no fractional digit
  });
});

describe('brand chrome inheritance — chain integrity', () => {
  beforeEach(reset);

  it('flipping bodyAlignment to "centered" decouples body-grid margin from --brand-inset-x', () => {
    applyPresetSettings({ ...DEFAULT_PRESET_SETTINGS, bodyAlignment: 'centered' });
    const margin = document.documentElement.style.getPropertyValue('--body-grid-margin-left');
    expect(margin).toBe('auto');
  });

  it('a single setPresetSettings() call propagates to BOTH axes simultaneously', () => {
    applyPresetSettings({
      ...DEFAULT_PRESET_SETTINGS,
      autoInsetFromLogo: true,
      logoScale: 1.1,
    });
    const x = document.documentElement.style.getPropertyValue('--brand-inset-x');
    const y = document.documentElement.style.getPropertyValue('--brand-inset-y');
    // Both must be present after a single apply — no two-pass setup.
    expect(x).toBeTruthy();
    expect(y).toBeTruthy();
    expect(parseInt(y, 10)).toBeGreaterThan(0);
  });
});
