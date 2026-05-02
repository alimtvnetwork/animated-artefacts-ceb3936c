/**
 * CapsuleListSlide — title + flexible row of capsules.
 *
 * # Background
 * Renders a centered radial amber glow behind the capsule cluster (offset
 * to `50% 60%` so it sits behind the capsules, not the title). This matches
 * the deck's hero treatment introduced in TitleSlide v2 — see
 * `spec/slides/15-title-slide-v2.md` and
 * `spec/slides/16-cinematic-capsule-animation.md`.
 *
 * # Capsule animation
 * When `content.animations.capsules === "cinematicCapsules"` (recommended
 * for the showcase Capabilities slide), each capsule blurs in from below
 * with a spring overshoot. The container uses a longer per-child stagger
 * (0.09s) and a delayed start (0.25s after entrance) so capsules land one
 * by one, giving the presenter a natural beat to talk to.
 *
 * # Interactive capsules (spec 22)
 *   - `hoverText` on a capsule → vertical label flip on hover.
 *   - `expand` payload on a capsule → clicking grows the capsule into a
 *     full panel on this slide. Other capsules dim. Click outside / Esc
 *     to collapse. Layout-driven via Framer `layoutId` so the card
 *     visibly morphs out of the source capsule.
 *   - `clickRevealSlide` (legacy) without `expand` → still routes to the
 *     hidden detail slide via `onCapsuleClickReveal`.
 */
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import type { CapsuleSpec, SlideSpec } from '../types';
import { getContainerVariants, getItemVariants, resolvePreset } from '../textAnimations';
import { titleClassFor } from '../preset';
import { Capsule } from '../components/Capsule';
import { slideSound } from '../sound';
import { resolveCapsuleLayout } from '../capsuleLayout';

interface Props {
  spec: SlideSpec;
  onCapsuleClickReveal: (slideNumber: number) => void;
  /** When true, click-reveal capsules pulse so presenters can spot them. */
  highlightReveal?: boolean;
}

/** Stagger config tailored for the cinematic preset — longer beats than the
 *  default container, with a `delayChildren` that waits for the title's
 *  entrance to settle. */
const CINEMATIC_CAPSULE_CONTAINER: Variants = {
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } },
};

export function CapsuleListSlide({ spec, onCapsuleClickReveal, highlightReveal }: Props) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const slideContainer = getContainerVariants(spec.textAnimation);
  const defaultItem = getItemVariants(spec.textAnimation);
  const eyebrowV  = c.animations?.eyebrow  ? resolvePreset(c.animations.eyebrow)  : defaultItem;
  const titleV    = c.animations?.title    ? resolvePreset(c.animations.title)    : defaultItem;

  const capsulePresetName = c.animations?.capsules;
  const isCinematic = capsulePresetName === 'cinematicCapsules';
  const capsuleContainerV = isCinematic ? CINEMATIC_CAPSULE_CONTAINER : slideContainer;
  const capsuleItemV = capsulePresetName ? resolvePreset(capsulePresetName) : defaultItem;

  // Index of the capsule whose `expand` card is currently open. `null` =
  // no card is showing. Reset whenever the slide spec changes (i.e. user
  // navigated to a different slide). spec 22 §3.
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  useEffect(() => { setExpandedIdx(null); }, [spec.slideNumber]);

  // Esc closes the card (slide-scoped, guarded against form fields).
  useEffect(() => {
    if (expandedIdx === null) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setExpandedIdx(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expandedIdx]);

  /** Decide what happens when a capsule is clicked. Expand wins over the
   *  legacy click-reveal so authors can migrate slide-by-slide. */
  const handleCapsuleClick = useCallback(
    (cap: CapsuleSpec, idx: number) => {
      // v0.57 — unified press cue across the deck. The hard mechanical
      // click + heavy fadeZoom combo was harsh on capsule activation.
      // Now we play the soft `fadeClick` (low-volume, long-fade variant
      // of click.mp3) followed by the same gentle `whoosh` used on the
      // StepTimeline focus arrival — that pairing tested as the most
      // pleasant "tap → reveal" cue in the deck.
      slideSound.play('fadeClick');
      if (cap.expand) {
        // Whoosh rides the spring-driven layoutId morph from capsule →
        // expanded card. Slightly higher volume than the focus-cue whoosh
        // since the user is actively triggering it (vs ambient autoplay).
        slideSound.play('whoosh', 0.5);
        setExpandedIdx(idx);
        return;
      }
      if (cap.clickRevealSlide) {
        onCapsuleClickReveal(cap.clickRevealSlide);
      }
    },
    [onCapsuleClickReveal],
  );

  const expandedCap = expandedIdx !== null ? c.capsules?.[expandedIdx] : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Radial glow — same vibe as TitleSlide v2 but offset down so it sits
          behind the capsule cluster rather than the title. Theme-driven via
          `--slide-bloom` so light themes (GitHub Light, macOS, etc.) get a
          tonally-correct wash instead of the noir-era warm brown smudge. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 65% 50% at 50% 65%,
            hsl(var(--slide-bloom, 28 75% 11%) / var(--slide-bloom-strength, 0.85)) 0%,
            hsl(var(--slide-bloom, 28 75% 11%) / calc(var(--slide-bloom-strength, 0.85) * 0.53)) 25%,
            transparent 60%)`,
        }}
      />

      <motion.div
        variants={slideContainer}
        initial="initial"
        animate="animate"
        className="relative flex h-full flex-col justify-center px-16 max-w-6xl mx-auto pt-32 pb-20"
      >
        {c.eyebrow && (
          <motion.span variants={eyebrowV} className="slide-eyebrow mb-5">{c.eyebrow}</motion.span>
        )}
        {c.title && (
          <motion.h2
            variants={titleV}
            className={`slide-title-display mb-12 ${titleClassFor(spec)}`}
          >
            {c.title}
          </motion.h2>
        )}
        {c.capsules && (() => {
          // `content.capsuleLayout` (optional) lets a deck pin the row to an
          // explicit grid + gap + alignment + opacity so the layout
          // reproduces 1:1 across renderers. Falls back to legacy flex-wrap
          // with sensible defaults when omitted.
          const resolved = resolveCapsuleLayout(c.capsuleLayout);
          const justifyMap: Record<string, string> = {
            start: 'justify-start', center: 'justify-center',
            end: 'justify-end', between: 'justify-between',
          };
          const alignItemsMap: Record<string, string> = {
            start: 'items-start', center: 'items-center',
            end: 'items-end', stretch: 'items-stretch',
          };
          const useGrid = resolved.columns !== undefined;
          const containerStyle: React.CSSProperties = useGrid
            ? {
                display: 'grid',
                gridTemplateColumns: `repeat(${resolved.columns}, minmax(0, 1fr))`,
                columnGap: `${resolved.gapPx}px`,
                rowGap: `${resolved.rowGapPx}px`,
                alignItems: resolved.verticalAlign,
              }
            : {
                columnGap: `${resolved.gapPx}px`,
                rowGap: `${resolved.rowGapPx}px`,
              };
          const containerClass = useGrid
            ? 'w-full'
            : `flex flex-wrap ${justifyMap[resolved.align] ?? 'justify-start'} ${alignItemsMap[resolved.verticalAlign] ?? 'items-center'}`;
          return (
          <motion.div
            variants={capsuleContainerV}
            initial="initial"
            animate="animate"
            className={containerClass}
            style={containerStyle}
          >
            {c.capsules.map((cap, i) => {
              const isExpanding = expandedIdx === i;
              const isDimmed = expandedIdx !== null && expandedIdx !== i;
              // Click-reveal dimming multiplies on top of the deck's
              // baseline `capsuleOpacity` so the row's overall feel is
              // preserved even while one item is spotlighted.
              const restingOpacity = resolved.capsuleOpacity;
              const targetOpacity = isDimmed ? restingOpacity * 0.25 : restingOpacity;
              return (
                <motion.div
                  key={i}
                  variants={capsuleItemV}
                  layoutId={`capsule-${spec.slideNumber}-${i}`}
                  animate={{
                    opacity: targetOpacity,
                    filter: isDimmed ? 'blur(1px)' : 'blur(0px)',
                  }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Capsule
                    spec={cap}
                    size="lg"
                    highlightReveal={highlightReveal}
                    isExpanding={isExpanding}
                    onClick={
                      cap.expand || cap.clickRevealSlide
                        ? () => handleCapsuleClick(cap, i)
                        : undefined
                    }
                  />
                </motion.div>
              );
            })}
          </motion.div>
          );
        })()}
      </motion.div>

      {/* Expanding-card overlay (spec 22 §3). Renders ONLY when a capsule
          with an `expand` payload is open. The card uses `layoutId` linked
          to the source capsule so Framer interpolates the rect — the card
          visually morphs OUT OF the capsule rather than fading in from
          nowhere. Click the backdrop to close. */}
      <AnimatePresence>
        {expandedCap?.expand && expandedIdx !== null && (() => {
          const animKind = expandedCap.expand.animation ?? 'morph';
          const labelKind = expandedCap.expand.labelAnimation ?? 'slideUp';

          // Per-preset panel motion. Reduced motion always = flat fade.
          // We deliberately AVOID layoutId for non-morph presets so the
          // capsule doesn't visually "fly" into the panel rect when the
          // author asked for a slide/push entrance.
          const panelMotion = (() => {
            if (reduced) {
              return {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit:    { opacity: 0 },
                transition: { duration: 0.18, ease: 'linear' as const },
                useLayoutId: false,
              };
            }
            switch (animKind) {
              case 'fade':
                return {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit:    { opacity: 0 },
                  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
                  useLayoutId: false,
                };
              case 'slideUp':
                return {
                  initial: { opacity: 0, y: 24 },
                  animate: { opacity: 1, y: 0 },
                  exit:    { opacity: 0, y: 16 },
                  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
                  useLayoutId: false,
                };
              case 'slideDown':
                return {
                  initial: { opacity: 0, y: -24 },
                  animate: { opacity: 1, y: 0 },
                  exit:    { opacity: 0, y: -16 },
                  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
                  useLayoutId: false,
                };
              case 'pushLeft':
                return {
                  initial: { opacity: 0, x: 48 },
                  animate: { opacity: 1, x: 0 },
                  exit:    { opacity: 0, x: 32 },
                  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
                  useLayoutId: false,
                };
              case 'pushRight':
                return {
                  initial: { opacity: 0, x: -48 },
                  animate: { opacity: 1, x: 0 },
                  exit:    { opacity: 0, x: -32 },
                  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
                  useLayoutId: false,
                };
              case 'morph':
              default:
                // Existing behavior: layoutId spring morph from capsule.
                return {
                  initial: false as const,
                  animate: undefined,
                  exit: undefined,
                  transition: { type: 'spring' as const, stiffness: 320, damping: 32, mass: 0.7 },
                  useLayoutId: true,
                };
            }
          })();

          // Per-preset inner-label motion. `stagger` uses a Framer
          // container/item pair so children animate in sequence; `fade`
          // and `slideUp` use a single block-level transition. Reduced
          // motion always collapses to a no-translation opacity fade.
          const labelDelay = animKind === 'morph' ? 0.18 : 0.08;
          const labelBlock = (() => {
            if (reduced) {
              return {
                mode: 'block' as const,
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.18, delay: 0, ease: 'linear' as const },
              };
            }
            switch (labelKind) {
              case 'fade':
                return {
                  mode: 'block' as const,
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: { duration: 0.4, delay: labelDelay, ease: [0.22, 1, 0.36, 1] as const },
                };
              case 'stagger':
                return {
                  mode: 'stagger' as const,
                  container: {
                    initial: 'hidden',
                    animate: 'show',
                    variants: {
                      hidden: {},
                      show: { transition: { staggerChildren: 0.06, delayChildren: labelDelay } },
                    },
                  },
                  itemVariants: {
                    hidden: { opacity: 0, y: 8 },
                    show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } },
                  },
                };
              case 'slideUp':
              default:
                return {
                  mode: 'block' as const,
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.4, delay: labelDelay, ease: [0.22, 1, 0.36, 1] as const },
                };
            }
          })();

          return (
          <motion.div
            key="expand-backdrop"
            className="absolute inset-0 z-40 flex items-center justify-center px-8"
            initial={{ backdropFilter: 'blur(0px)', backgroundColor: 'hsl(0 0% 5% / 0)' }}
            animate={{ backdropFilter: reduced ? 'blur(0px)' : 'blur(6px)', backgroundColor: 'hsl(0 0% 5% / 0.55)' }}
            exit={{ backdropFilter: 'blur(0px)', backgroundColor: 'hsl(0 0% 5% / 0)' }}
            transition={{ duration: reduced ? 0.18 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setExpandedIdx(null)}
            role="dialog"
            aria-modal="true"
            aria-label={expandedCap.expand.title ?? expandedCap.text}
          >
            <motion.div
              {...(panelMotion.useLayoutId
                ? { layoutId: `capsule-${spec.slideNumber}-${expandedIdx}` }
                : {})}
              initial={panelMotion.initial as never}
              animate={panelMotion.animate as never}
              exit={panelMotion.exit as never}
              transition={panelMotion.transition as never}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-3xl bg-card/95 border border-gold/30 shadow-[0_30px_80px_-20px_hsl(0_0%_0%_/_0.7),0_0_0_1px_hsl(var(--gold)/0.15)] p-10 md:p-12"
            >
              {/* Close button — top-right of the card. */}
              <button
                type="button"
                onClick={() => setExpandedIdx(null)}
                aria-label="Close details"
                className="absolute top-4 right-4 h-9 w-9 rounded-full inline-flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/10 transition"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Eyebrow / title / body inside the card. The author's `text`
                  field falls back as the title if no `title` is given.
                  Renders in `block` (single shared transition) or `stagger`
                  (per-child) mode depending on `labelAnimation`. */}
              {labelBlock.mode === 'block' ? (
                <motion.div
                  initial={reduced ? false : (labelBlock.initial as never)}
                  animate={labelBlock.animate as never}
                  transition={labelBlock.transition as never}
                >
                  {expandedCap.expand.eyebrow && (
                    <div className="text-[12px] font-semibold uppercase tracking-[0.32em] text-gold mb-3">
                      {expandedCap.expand.eyebrow}
                    </div>
                  )}
                  <h3 className="font-display text-3xl md:text-4xl text-title-cream leading-[1.05] mb-2">
                    {expandedCap.expand.title ?? expandedCap.text}
                  </h3>
                  <div className="h-[2px] w-14 bg-gold my-5" />
                  {expandedCap.expand.body && (
                    <p className="text-foreground/85 text-lg md:text-xl leading-relaxed max-w-prose">
                      {expandedCap.expand.body}
                    </p>
                  )}
                  {expandedCap.expand.capsules && expandedCap.expand.capsules.length > 0 && (
                    <div className="mt-7 flex flex-wrap gap-2">
                      {expandedCap.expand.capsules.map((sub, i) => (
                        <Capsule key={i} spec={sub} size="sm" />
                      ))}
                    </div>
                  )}
                  {expandedCap.expand.cta && (
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={() => {
                          if (expandedCap.expand?.cta?.onClickRevealSlide) {
                            onCapsuleClickReveal(expandedCap.expand.cta.onClickRevealSlide);
                            setExpandedIdx(null);
                          } else if (expandedCap.expand?.cta?.href) {
                            window.open(expandedCap.expand.cta.href, '_blank', 'noopener');
                          }
                        }}
                        className="capsule capsule-gold text-base px-5 py-2.5 lift-hover cursor-pointer"
                      >
                        {expandedCap.expand.cta.text}
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={labelBlock.container.initial}
                  animate={labelBlock.container.animate}
                  variants={labelBlock.container.variants}
                >
                  {expandedCap.expand.eyebrow && (
                    <motion.div
                      variants={labelBlock.itemVariants}
                      className="text-[12px] font-semibold uppercase tracking-[0.32em] text-gold mb-3"
                    >
                      {expandedCap.expand.eyebrow}
                    </motion.div>
                  )}
                  <motion.h3
                    variants={labelBlock.itemVariants}
                    className="font-display text-3xl md:text-4xl text-title-cream leading-[1.05] mb-2"
                  >
                    {expandedCap.expand.title ?? expandedCap.text}
                  </motion.h3>
                  <motion.div variants={labelBlock.itemVariants} className="h-[2px] w-14 bg-gold my-5" />
                  {expandedCap.expand.body && (
                    <motion.p
                      variants={labelBlock.itemVariants}
                      className="text-foreground/85 text-lg md:text-xl leading-relaxed max-w-prose"
                    >
                      {expandedCap.expand.body}
                    </motion.p>
                  )}
                  {expandedCap.expand.capsules && expandedCap.expand.capsules.length > 0 && (
                    <motion.div variants={labelBlock.itemVariants} className="mt-7 flex flex-wrap gap-2">
                      {expandedCap.expand.capsules.map((sub, i) => (
                        <Capsule key={i} spec={sub} size="sm" />
                      ))}
                    </motion.div>
                  )}
                  {expandedCap.expand.cta && (
                    <motion.div variants={labelBlock.itemVariants} className="mt-8">
                      <button
                        type="button"
                        onClick={() => {
                          if (expandedCap.expand?.cta?.onClickRevealSlide) {
                            onCapsuleClickReveal(expandedCap.expand.cta.onClickRevealSlide);
                            setExpandedIdx(null);
                          } else if (expandedCap.expand?.cta?.href) {
                            window.open(expandedCap.expand.cta.href, '_blank', 'noopener');
                          }
                        }}
                        className="capsule capsule-gold text-base px-5 py-2.5 lift-hover cursor-pointer"
                      >
                        {expandedCap.expand.cta.text}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
