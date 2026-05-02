import type { Variants } from 'framer-motion';
import { flattenVariants, prefersReducedMotion } from './motionPreferences';

/**
 * Reusable text animation presets. Reference these by name from slide JSON —
 * either at the slide level (legacy `textAnimation` field, capitalised values)
 * or per text block via `content.animations.{block}` (camelCase values listed
 * here).
 *
 * To add a new preset:
 *   1. Add a key + Variants object to `TEXT_ANIMATION_PRESETS` below.
 *   2. Add the key to `TextAnimationPresetNames` for type-checking.
 *   3. Add it to the `enum` in `spec/slides/slide.schema.json`.
 *   4. Document the visual character in `spec/slides/03-animation-rules.md`.
 */
export const TEXT_ANIMATION_PRESETS = {
  /** No animation — element appears instantly. Use sparingly. */
  none: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
  },
  /** Soft fade with a tiny upward drift. The safe default. */
  fadeIn: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  },
  /** Larger upward slide. Good for headlines. */
  slideUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
  /** Enters from the left edge. */
  slideInLeft: {
    initial: { opacity: 0, x: -48 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
  /** Enters from the right edge. */
  slideInRight: {
    initial: { opacity: 0, x: 48 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
  /** Stronger left push — like a slide transition applied to one block. */
  pushLeft: {
    initial: { opacity: 0, x: -120 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  },
  /** Stronger right push. */
  pushRight: {
    initial: { opacity: 0, x: 120 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  },
  /** Springy scale-in — playful, use on a single hero element. */
  bounce: {
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 16 } },
  },
  /** Same as fadeIn but signals to parents to stagger children harder. */
  stagger: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  },
  /**
   * Cinematic capsule entrance — blur→focus + slide-up + spring overshoot.
   * Designed for capsule rows on `CapsuleListSlide`. Each capsule lands with
   * a deliberate, designer-grade beat the presenter can speak to.
   *
   * Sequence: hidden (`opacity 0, y 32, scale 0.92, blur 8px`) → focus
   * (0.55s ease-out cubic) → settle (spring overshoot to scale 1).
   *
   * Reduced-motion handling: framer's spring respects `prefers-reduced-motion`
   * automatically; the blur is the expensive bit, so we keep it short. If the
   * user has reduced-motion enabled, the global `index.css` rule shortens
   * transitions site-wide — this preset stays cheap because the blur only
   * lasts 0.55s and is the only filter being animated.
   *
   * See `spec/slides/16-cinematic-capsule-animation.md`.
   */
  cinematicCapsules: {
    initial: { opacity: 0, y: 32, scale: 0.92, filter: 'blur(8px)' },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
        scale: { type: 'spring', stiffness: 220, damping: 18 },
      },
    },
  },
  /**
   * Hero title preset — pure scale-spring with no translate. Designed for
   * `TitleSlide`'s headline so the bounce reads as "landing" rather than
   * "drifting". See spec 31 §4.1.
   */
  titleSlide: {
    initial: { opacity: 0, scale: 0.94 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 240, damping: 18, mass: 0.9 },
    },
  },
  /** Reduced-motion fallback — instant opacity flip, preserves rhythm via delay. */
  reducedFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.18, ease: 'linear' } },
  },
} as const satisfies Record<string, Variants>;

export type TextAnimationPreset = keyof typeof TEXT_ANIMATION_PRESETS;

/** Map slide-level `textAnimation` enum values to preset keys (legacy bridge). */
const LEGACY_MAP: Record<string, TextAnimationPreset> = {
  FadeIn: 'fadeIn',
  Bounce: 'bounce',
  SlideUp: 'slideUp',
  Stagger: 'stagger',
};

/* ------------------------------------------------------------------ */
/* Per-block timing overrides                                          */
/* ------------------------------------------------------------------ */

/**
 * Named easing aliases the schema accepts. Mirrors framer-motion's built-in
 * keyword set plus a few cubic-bezier convenience names. Authors can also
 * pass a 4-tuple `[x1, y1, x2, y2]` directly for fully custom curves.
 */
export type EasingName =
  | 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  | 'expoIn' | 'expoOut' | 'expoInOut'
  | 'circIn' | 'circOut' | 'circInOut'
  | 'backIn' | 'backOut' | 'backInOut';

export type EasingValue = EasingName | [number, number, number, number];

/**
 * Authoring shape for `content.animations.<block>`. Either a bare preset
 * name (back-compat with v0.140 and earlier) or an object pinning the
 * timing knobs that make the preset reproducible.
 *
 * # Why per-block overrides exist
 * Two slides can both use `fadeIn` and still feel different — one with a
 * 200ms snap, another with a 700ms drift. Without overrides the author's
 * only knob was "pick a different preset", which churns the visual
 * vocabulary. Now timing is content-controlled while the preset stays the
 * intent ("this is a fade").
 *
 * # What the knobs DO
 * - `delayMs`     — wait this long after the slide enters before this block animates.
 * - `durationMs`  — how long the tween/spring runs. Springs ignore this; see notes.
 * - `easing`      — replaces the preset's curve. Strings (e.g. `easeOut`) or
 *                   a 4-tuple cubic-bezier `[0.22, 1, 0.36, 1]`.
 *
 * # Spring presets (`bounce`, `cinematicCapsules`, `titleSlide`)
 * `durationMs` and `easing` have no effect on the spring itself — physics
 * solves the curve. They DO still apply to any non-spring channel in the
 * preset (e.g. opacity in `cinematicCapsules` uses the easing). `delayMs`
 * always works regardless of preset type.
 */
export interface TextAnimationOverride {
  /** Preset name (camelCase or legacy capitalised). Unknown names fall back
   *  to the caller's `fallback` at resolve time. Typed as `string` so JSON
   *  data flows through without per-call casts. */
  preset: string;
  /** Delay before the block animates, ms. Stacks with parent stagger. */
  delayMs?: number;
  /** Tween duration, ms. Ignored by spring channels. */
  durationMs?: number;
  /** Easing curve. Replaces the preset's default. String name or 4-tuple. */
  easing?: string | [number, number, number, number];
}

/** Authored value type: legacy string OR override object. */
export type TextAnimationAuthored = string | TextAnimationOverride;

/**
 * Deep-merge timing overrides into a preset's `transition` block while
 * preserving channel-level overrides (e.g. `cinematicCapsules.transition.scale`).
 *
 * Why deep-merge instead of overwrite: spring-driven channels live inside
 * `transition.<channel>` and we don't want a global `easing` override to
 * silently kill the spring on `scale`. We patch the parent and let
 * channel-specific overrides survive.
 */
function applyOverrides(variants: Variants, override: TextAnimationOverride): Variants {
  const animate = variants.animate as Record<string, unknown> | undefined;
  if (!animate) return variants;
  const baseTransition = (animate.transition as Record<string, unknown> | undefined) ?? {};
  const patched: Record<string, unknown> = { ...baseTransition };
  if (override.delayMs !== undefined) patched.delay = override.delayMs / 1000;
  if (override.durationMs !== undefined) patched.duration = override.durationMs / 1000;
  if (override.easing !== undefined) patched.ease = override.easing;
  return {
    ...variants,
    animate: { ...animate, transition: patched },
  };
}

/** Type guard so callers can pass the raw authored value. */
export function isOverrideObject(v: unknown): v is TextAnimationOverride {
  return typeof v === 'object' && v !== null && 'preset' in v;
}

/** Resolve a preset name (camelCase, legacy capitalised, or unknown) to a
 *  preset key. Unknown names fall back. */
function resolvePresetKey(name: string, fallback: TextAnimationPreset): TextAnimationPreset {
  if (name in TEXT_ANIMATION_PRESETS) return name as TextAnimationPreset;
  return LEGACY_MAP[name] ?? fallback;
}

/**
 * Resolve any preset reference (legacy capitalised, new camelCase, or
 * override object) to Variants.
 *
 * Reduced-motion behavior: when the OS setting is enabled, ALL presets are
 * funnelled through `flattenVariants` so transforms (slide-up, push, scale,
 * blur, spring overshoot) drop to a 10ms opacity cross-fade. Authors can keep
 * choosing varied animations per slide — the renderer makes them safe at the
 * read site, so no per-slide opt-out is needed. Timing overrides are also
 * dropped under reduced motion (the flattened cross-fade has its own fixed
 * timing) — this is intentional: an author's 800ms bounce should not become
 * an 800ms opacity flash.
 */
export function resolvePreset(
  name: TextAnimationAuthored | undefined,
  fallback: TextAnimationPreset = 'fadeIn',
): Variants {
  const reduced = prefersReducedMotion();
  if (!name) {
    const v = TEXT_ANIMATION_PRESETS[reduced ? 'reducedFade' : fallback];
    return reduced ? flattenVariants(v) : v;
  }
  if (isOverrideObject(name)) {
    const base = TEXT_ANIMATION_PRESETS[resolvePresetKey(name.preset, fallback)];
    if (reduced) return flattenVariants(base);
    return applyOverrides(base, name);
  }
  const v = TEXT_ANIMATION_PRESETS[resolvePresetKey(name, fallback)];
  return reduced ? flattenVariants(v) : v;
}

/**
 * Container variants used to drive child stagger. The slide-level animation
 * decides whether children stagger tightly (default) or with a longer delay
 * (for `stagger` / `slideUp`).
 */
/**
 * Container variants used to drive child stagger. Reduced-motion collapses
 * the cascade window so children appear near-simultaneously while preserving
 * source order.
 */
export function getContainerVariants(anim: string): Variants {
  if (prefersReducedMotion()) {
    // Stagger window matches the 150 ms safe cross-fade (spec 13 §5) so a
    // row of capsules/steps cascades visibly instead of snapping in lockstep.
    return { animate: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } } };
  }
  if (anim === 'Stagger' || anim === 'SlideUp' || anim === 'stagger' || anim === 'slideUp') {
    return { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
  }
  return { animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
}

/** Slide-level default item variants (unchanged signature for backwards compat). */
export function getItemVariants(anim: string): Variants {
  return resolvePreset(anim, 'fadeIn');
}
