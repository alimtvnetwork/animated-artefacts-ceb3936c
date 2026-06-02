/**
 * Steps Chain 3D — automated visual QA.
 *
 * Run: `bunx vitest run src/test/stepsChain3DDepthHierarchy.test.ts`
 *
 * Validates the cinematic-3D contract from `spec/slides/61-steps-chain-3d.md`
 * without needing a real browser:
 *
 *   1. Depth-tier hierarchy is monotonic — as `distance` grows from active,
 *      `scale` and `opacity` strictly DECREASE while `blur` and `|translateZ|`
 *      strictly INCREASE.
 *   2. Active-card recognition is purely motion/depth-driven — the rendered
 *      `<button>` element MUST carry `bg-transparent` and the renderer MUST
 *      NOT introduce a `background:` (or `backgroundColor:`) inline style on
 *      the card wrapper for any depth state. The marker disc is allowed a
 *      gold gradient, but the card itself never gets a solid fill.
 *   3. No registered theme exposes a token that would be interpreted as an
 *      active-card background (`--chain-active-bg`, `--chain-card-bg`, etc.).
 *      If a future theme tries to skin the active card via CSS variables,
 *      this test fails loudly.
 *
 * Source-of-truth refs (failure messages cite these):
 *   - spec/slides/61-steps-chain-3d.md (§2.2 depth states, §10 out-of-scope)
 *   - src/slides/types/StepsChain3DSlide.tsx (STEPS_CHAIN_3D_DEPTH export)
 *   - src/slides/themes.ts (THEMES registry)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { STEPS_CHAIN_3D_DEPTH } from '../slides/types/StepsChain3DSlide';
import { THEMES } from '../slides/themes';

const RENDERER_SRC = readFileSync(
  join(process.cwd(), 'src/slides/types/StepsChain3DSlide.tsx'),
  'utf8',
);

/* ------------------------------------------------------------------ */
/* 1 — Depth-tier hierarchy                                           */
/* ------------------------------------------------------------------ */

describe('Steps Chain 3D — depth/opacity/blur hierarchy', () => {
  const order = ['active', 'adjacent', 'distant'] as const;

  it('scale strictly decreases as distance grows', () => {
    const scales = order.map(k => STEPS_CHAIN_3D_DEPTH[k].scale);
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i], `scale must shrink: ${order[i - 1]}=${scales[i - 1]} → ${order[i]}=${scales[i]}`)
        .toBeLessThan(scales[i - 1]);
    }
    // Active must always render at full size.
    expect(STEPS_CHAIN_3D_DEPTH.active.scale).toBe(1);
  });

  it('opacity strictly decreases as distance grows', () => {
    const op = order.map(k => STEPS_CHAIN_3D_DEPTH[k].opacity);
    for (let i = 1; i < op.length; i++) {
      expect(op[i], `opacity must fade: ${order[i - 1]}=${op[i - 1]} → ${order[i]}=${op[i]}`)
        .toBeLessThan(op[i - 1]);
    }
    expect(STEPS_CHAIN_3D_DEPTH.active.opacity).toBe(1);
  });

  it('blur strictly increases as distance grows (active is sharp)', () => {
    const blur = order.map(k => STEPS_CHAIN_3D_DEPTH[k].blur);
    expect(STEPS_CHAIN_3D_DEPTH.active.blur, 'active card must be sharp (blur=0)').toBe(0);
    for (let i = 1; i < blur.length; i++) {
      expect(blur[i], `blur must grow: ${order[i - 1]}=${blur[i - 1]}px → ${order[i]}=${blur[i]}px`)
        .toBeGreaterThan(blur[i - 1]);
    }
  });

  it('|translateZ| strictly increases as distance grows (siblings recede)', () => {
    const z = order.map(k => Math.abs(STEPS_CHAIN_3D_DEPTH[k].translateZ));
    expect(STEPS_CHAIN_3D_DEPTH.active.translateZ, 'active must sit at z=0').toBe(0);
    for (let i = 1; i < z.length; i++) {
      expect(z[i], `|translateZ| must grow: ${order[i - 1]}=${z[i - 1]}px → ${order[i]}=${z[i]}px`)
        .toBeGreaterThan(z[i - 1]);
    }
  });

  it('distant tier matches the spec (scale 0.70, opacity 0.30, blur 1.2px, z -140)', () => {
    expect(STEPS_CHAIN_3D_DEPTH.distant).toEqual({
      scale: 0.70, opacity: 0.30, blur: 1.2, translateZ: -140,
    });
  });
});

/* ------------------------------------------------------------------ */
/* 2 — Active card has no solid background fill                        */
/* ------------------------------------------------------------------ */

describe('Steps Chain 3D — active card has no solid background fill', () => {
  /**
   * Locate the step-card `<button>` block by anchoring on the unique
   * `cardRefs.current[i] = el` ref assignment, then walk back to the
   * opening `<button` tag. Card recognition must come from scale +
   * sharpness + marker glow only — never from a coloured rectangle.
   */
  const refIdx = RENDERER_SRC.indexOf('cardRefs.current[i] = el');
  const openIdx = refIdx >= 0 ? RENDERER_SRC.lastIndexOf('<button', refIdx) : -1;
  const closeIdx = refIdx >= 0 ? RENDERER_SRC.indexOf('>', refIdx) : -1;
  const buttonOpenTag = openIdx >= 0 && closeIdx > openIdx
    ? RENDERER_SRC.slice(openIdx, closeIdx + 1)
    : '';
  const classMatch = buttonOpenTag.match(/className="([^"]+)"/);
  const styleMatch = buttonOpenTag.match(/style=\{\{([\s\S]*?)\}\}/);

  it('renders the step as a real <button> with discoverable className', () => {
    expect(buttonOpenTag, 'could not locate the step <button> opening tag').not.toBe('');
    expect(classMatch, 'step <button> is missing a className attribute').not.toBeNull();
  });

  it('card <button> is bg-transparent and border-0 (no fill, no chrome)', () => {
    const cls = classMatch?.[1] ?? '';
    expect(cls, `button className was: "${cls}"`).toMatch(/\bbg-transparent\b/);
    expect(cls, `button className was: "${cls}"`).toMatch(/\bborder-0\b/);
    // Defensive: no incidental tailwind bg-* utility on the card itself.
    const otherBg = cls.match(/\bbg-(?!transparent\b)[\w/.[\]-]+/g);
    expect(otherBg, `card carries bg utilities other than bg-transparent: ${otherBg?.join(', ')}`).toBeNull();
  });

  it('renderer never sets `background` or `backgroundColor` on the card style', () => {
    expect(styleMatch, 'could not locate the card style block').not.toBeNull();
    const styleBody = styleMatch![1];
    expect(styleBody, 'card style must not declare a background fill')
      .not.toMatch(/\bbackground(?:Color)?\s*:/);
  });

  it('runtime depth-tier paths only mutate transform / opacity / filter on the card', () => {
    const allowed = new Set(['transform', 'opacity', 'filter', 'transition']);
    const assigns = [...RENDERER_SRC.matchAll(/\bel\.style\.(\w+)\s*=/g)].map(m => m[1]);
    const offenders = assigns.filter(p => !allowed.has(p));
    expect(offenders, `card style mutations must stay on transform/opacity/filter, found: ${offenders.join(', ')}`)
      .toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* 3 — Presenter-driven navigation only                               */
/* ------------------------------------------------------------------ */

describe('Steps Chain 3D — no internal auto-direction timer', () => {
  it('does not schedule timer-based step movement', () => {
    expect(RENDERER_SRC, 'StepsChain3DSlide must not use setTimeout for auto step advance')
      .not.toMatch(/window\.setTimeout|\bsetTimeout\s*\(/);
    expect(RENDERER_SRC, 'StepsChain3DSlide must not use setInterval for auto step advance')
      .not.toMatch(/window\.setInterval|\bsetInterval\s*\(/);
  });

  it('does not keep internal autoplay state or callbacks', () => {
    expect(RENDERER_SRC, 'slide 4 is click/keyboard/controller driven; no autoplay state allowed')
      .not.toMatch(/autoplayRef|stopAutoplay|AUTOPLAY_INTERVAL|setAutoplay/i);
  });

  it('deck disables hold-to-autoplay while StepsChain3DSlide is active', () => {
    const deckSrc = readFileSync(join(process.cwd(), 'src/pages/SlideDeckPage.tsx'), 'utf8');
    expect(deckSrc).toMatch(/isManualOnly3D\s*=\s*slide\?\.slideType === 'StepsChain3DSlide'/);
    expect(deckSrc).toMatch(/if \(isManualOnly3D\) return;/);
  });
});

/* ------------------------------------------------------------------ */
/* 4 — No theme injects an active-card background                     */
/* ------------------------------------------------------------------ */

describe('Steps Chain 3D — no theme paints a solid active-card fill', () => {
  // Tokens that, if a theme defined them, would imply a per-theme attempt to
  // skin the active card. Matches both the canonical name and likely typos.
  const FORBIDDEN_TOKENS = [
    /^--chain-active-bg$/,
    /^--chain-card-bg$/,
    /^--chain-active-background$/,
    /^--steps-chain-active-bg$/,
  ];

  for (const [id, theme] of Object.entries(THEMES)) {
    it(`theme "${id}" defines no active-card background token`, () => {
      const offenders = Object.keys(theme.vars).filter(name =>
        FORBIDDEN_TOKENS.some(rx => rx.test(name)),
      );
      expect(offenders,
        `theme "${id}" exposes forbidden active-card fill token(s): ${offenders.join(', ')}\n` +
        `Active state must be communicated via scale/depth/opacity only — see spec 61 §10.`,
      ).toHaveLength(0);
    });
  }

  it('covers every registered theme (sanity — no themes silently skipped)', () => {
    expect(Object.keys(THEMES).length).toBeGreaterThanOrEqual(5);
  });
});
