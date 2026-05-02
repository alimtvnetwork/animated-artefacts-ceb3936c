import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec, StepSpec } from '../types';
import { Capsule } from '../components/Capsule';
import { useFocusTimeline, type FocusTimelineHandle } from '../hooks/useFocusTimeline';
import { slideSound } from '../sound';
import { toDescriptionString } from '../utils/descriptionString';

/**
 * `AdvanceStepSlide` — cinematic camera-zoom step chain.
 *
 * Spec of record: `spec/slides/18-advance-step-cinematic.md` ("**advance step**").
 *
 * # Mental model
 * A vertical "reel" of full-viewport step frames. The active frame fills the
 * stage at scale 1.0. Adjacent frames render at scale 0.78 / opacity 0.4 so
 * the audience peeks at what's coming. Far-away frames fade to 0. Next/Prev
 * dollies the camera by exactly one viewport height with a slight spring
 * overshoot, then the new active frame's text fades in via a short stagger
 * (eyebrow → title with blur-out → 60px gold rule width tween → body →
 * capsule).
 *
 * # Deck integration
 * Like `FocusTimelineSlide`, it consumes the deck's Next/Prev internally via
 * `tryAdvance(dir): boolean`. Returns `false` at the chain edges so the deck
 * advances to a sibling slide. ArrowLeft/Right + Space/Enter are handled by
 * `SlideDeckPage`, NOT here, so the global keyboard contract is preserved.
 *
 * # Reduced motion
 * Camera dolly + scale + blur are skipped (snap). Functionality preserved.
 */
export const AdvanceStepSlide = forwardRef<FocusTimelineHandle, { spec: SlideSpec }>(
  function AdvanceStepSlide({ spec }, ref) {
    const c = spec.content;
    const steps = c.steps ?? [];
    const total = steps.length;
    const reduced = useReducedMotion();

    const { focusIndex, focusOn, next, prev } = useFocusTimeline(total);

    useImperativeHandle(
      ref,
      () => ({ tryAdvance: (dir) => (dir === 'forward' ? next() : prev()) }),
      [next, prev],
    );

    // Slide-scoped Home/End jumps. Other navigation comes through the deck
    // and into `tryAdvance`. Guarded against form fields.
    useEffect(() => {
      function onKey(e: KeyboardEvent) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;
        if (e.key === 'Home') { e.preventDefault(); focusOn(0); }
        else if (e.key === 'End') { e.preventDefault(); focusOn(total - 1); }
      }
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [focusOn, total]);

    // Sound on focus arrival (spec 20 + 21). Defaults to a whoosh on every
    // focusIndex change, including the very first arrival when the slide
    // mounts. Authors can mute via `sound.mute: true` or swap `kind`.
    const lastPlayedFocus = useRef<number | null>(null);
    useEffect(() => {
      const s = spec.sound ?? { on: 'focus' as const, kind: 'whoosh' as const, volume: 0.45 };
      if (s.mute) return;
      if ((s.on ?? 'focus') !== 'focus') return;
      if (lastPlayedFocus.current === focusIndex) return;
      lastPlayedFocus.current = focusIndex;
      slideSound.play(s.kind ?? 'whoosh', s.volume ?? 0.45);
    }, [focusIndex, spec.sound]);

    // Camera Y as a percentage of the strip's full height. Translating the
    // strip by -focusIndex * 100% reveals the matching frame.
    const cameraY = -focusIndex * 100;

    return (
      <div
        className="relative h-full w-full overflow-hidden bg-background"
        role="region"
        aria-roledescription="step carousel"
      >
        {/* Fixed deck-level header (eyebrow + deck title) — NOT inside the
            dolly so it stays put while the camera moves. */}
        {(c.eyebrow || c.title) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-12 left-12 z-20 max-w-md pointer-events-none"
          >
            {c.eyebrow && (
              <span className="block text-[11px] font-semibold uppercase tracking-[0.32em] text-gold mb-2">
                {c.eyebrow}
              </span>
            )}
            {c.title && (
              <h2 className="font-display text-2xl text-foreground/85 leading-tight">{c.title}</h2>
            )}
          </motion.div>
        )}

        {/* The reel. Translates Y by -focusIndex * 100% with a spring so the
            camera "settles" with a tiny overshoot. */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          animate={{ y: `${cameraY}%` }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: 'spring', stiffness: 90, damping: 20, mass: 1 }
          }
        >
          {steps.map((step, i) => {
            const distance = i - focusIndex;
            const state = distanceToState(distance);
            return (
              <Frame
                key={i}
                step={step}
                state={state}
                isActive={i === focusIndex}
                indexLabel={`${i + 1}`.padStart(2, '0')}
                totalLabel={`${total}`.padStart(2, '0')}
                reduced={Boolean(reduced)}
              />
            );
          })}
        </motion.div>

        {/* Right-edge dot column — tap-target for jumping anywhere in the chain. */}
        {total > 1 && (
          <div
            className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3"
            aria-label="Step navigation"
          >
            {steps.map((_, i) => {
              const isActive = i === focusIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => focusOn(i)}
                  aria-label={`Go to step ${i + 1}`}
                  aria-current={isActive ? 'step' : undefined}
                  className={
                    isActive
                      ? 'h-6 w-1.5 rounded-full bg-gold shadow-[0_0_10px_hsl(var(--gold)/0.7)] transition-all'
                      : 'h-1.5 w-1.5 rounded-full bg-foreground/25 hover:bg-foreground/55 transition-all'
                  }
                />
              );
            })}
            <span
              className="mt-2 text-[10px] font-mono tracking-[0.18em] text-gold/80 tabular-nums"
              aria-live="polite"
            >
              {`${focusIndex + 1}`.padStart(2, '0')} / {`${total}`.padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
    );
  },
);

/* ------------------------------------------------------------------ */
/* One frame in the reel                                               */
/* ------------------------------------------------------------------ */

type FrameState = 'far-prev' | 'prev' | 'active' | 'next' | 'far-next';

function distanceToState(distance: number): FrameState {
  if (distance === 0) return 'active';
  if (distance === -1) return 'prev';
  if (distance === 1) return 'next';
  if (distance < -1) return 'far-prev';
  return 'far-next';
}

const STATE_VISUALS: Record<FrameState, { scale: number; opacity: number }> = {
  'far-prev': { scale: 0.65, opacity: 0 },
  prev: { scale: 0.78, opacity: 0.4 },
  active: { scale: 1.0, opacity: 1 },
  next: { scale: 0.78, opacity: 0.4 },
  'far-next': { scale: 0.65, opacity: 0 },
};

interface FrameProps {
  step: StepSpec;
  state: FrameState;
  isActive: boolean;
  indexLabel: string;
  totalLabel: string;
  reduced: boolean;
}

function Frame({ step, state, isActive, indexLabel, totalLabel, reduced }: FrameProps) {
  const visuals = STATE_VISUALS[state];

  // Active frame uses a spring scale for the satisfying overshoot. Inactive
  // frames use a plain tween so they don't bounce in the periphery.
  const scaleTransition = reduced
    ? { duration: 0 }
    : isActive
      ? { type: 'spring' as const, stiffness: 220, damping: 22 }
      : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <motion.section
      aria-hidden={isActive ? undefined : true}
      aria-current={isActive ? 'step' : undefined}
      className="relative h-full w-full"
      animate={{ scale: visuals.scale, opacity: visuals.opacity }}
      transition={scaleTransition}
      style={{ transformOrigin: 'center center' }}
    >
      {/* Soft radial glow only on the active frame so the eye is drawn there. */}
      {isActive && (
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, hsl(var(--gold) / 0.08), transparent 60%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
      )}

      <div className="relative h-full w-full flex flex-col items-center justify-center px-16 md:px-24 text-center">
        {/* Re-key on every active arrival so the text-stagger fires each time
            the camera lands on this frame (forward OR backward). Inactive
            frames keep their text in final state to avoid jank in the periphery. */}
        <FrameText step={step} indexLabel={indexLabel} totalLabel={totalLabel} active={isActive} reduced={reduced} />
      </div>

      {/* Capsule anchored top-right, fades in late on the active frame. */}
      {step.capsule && (
        <motion.div
          className="absolute top-12 right-12"
          initial={{ opacity: isActive ? 0 : 1, scale: isActive ? 0.92 : 1 }}
          animate={{ opacity: visuals.opacity, scale: 1 }}
          transition={
            reduced ? { duration: 0 } : { delay: isActive ? 0.92 : 0, duration: 0.3, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <Capsule spec={step.capsule} size="sm" />
        </motion.div>
      )}
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* Text stagger inside the active frame                                */
/* ------------------------------------------------------------------ */

interface TextProps {
  step: StepSpec;
  indexLabel: string;
  totalLabel: string;
  active: boolean;
  reduced: boolean;
}

/**
 * Re-mounted (via the parent's `key`) every time the active step changes so
 * the entrance stagger always plays. When inactive we render the same content
 * statically (no transitions) — visible only as a faint peek.
 */
function FrameText({ step, indexLabel, totalLabel, active, reduced }: TextProps) {
  // Spec 20 type ramp — the active frame becomes the visual focus, not a peek.
  // eyebrow 16-18px, title 7.5-11rem, leading 0.92, rule 88x2, subtitle 24-30px,
  // description 18-20px, max-w-5xl. Inactive frames render the same ramp
  // statically (visible only as a faint shrunken peek).
  if (!active || reduced) {
    return (
      <div className="max-w-5xl">
        <div className="text-[16px] md:text-[18px] font-semibold uppercase tracking-[0.32em] text-gold mb-5">
          Step {indexLabel} / {totalLabel}
        </div>
        <h3 className="font-display text-[7.5rem] md:text-[9rem] xl:text-[11rem] text-foreground leading-[0.92]">
          {step.title}
        </h3>
        <div className="mx-auto my-10 h-[2px] w-[88px] bg-gold/60" />
        {step.subtitle && (
          <p className="mx-auto max-w-3xl text-foreground/75 text-2xl md:text-3xl leading-snug">{step.subtitle}</p>
        )}
        {(() => { const d = toDescriptionString(step.description); return d ? (
          <p className="mx-auto mt-4 max-w-3xl text-foreground/60 text-lg md:text-xl leading-relaxed">{d}</p>
        ) : null; })()}
      </div>
    );
  }

  return (
    <motion.div key="text" className="max-w-5xl" initial="hidden" animate="visible">
      <motion.div
        variants={fadeUp}
        custom={0.55}
        className="text-[16px] md:text-[18px] font-semibold uppercase tracking-[0.32em] text-gold mb-5"
      >
        Step {indexLabel} / {totalLabel}
      </motion.div>
      <motion.h3
        variants={fadeBlurUp}
        custom={0.62}
        className="font-display text-[7.5rem] md:text-[9rem] xl:text-[11rem] text-foreground leading-[0.92]"
      >
        {step.title}
      </motion.h3>
      <motion.div
        variants={ruleGrow}
        custom={0.78}
        className="mx-auto my-10 h-[2px] bg-gold/60"
        style={{ originX: 0.5 }}
      />
      {step.subtitle && (
        <motion.p
          variants={fadeUp}
          custom={0.88}
          className="mx-auto max-w-3xl text-foreground/75 text-2xl md:text-3xl leading-snug"
        >
          {step.subtitle}
        </motion.p>
      )}
      {(() => { const d = toDescriptionString(step.description); return d ? (
        <motion.p
          variants={fadeUp}
          custom={0.96}
          className="mx-auto mt-4 max-w-3xl text-foreground/60 text-lg md:text-xl leading-relaxed"
        >
          {d}
        </motion.p>
      ) : null; })()}
    </motion.div>
  );
}

/* Variants — `custom` is the per-element delay (seconds). */
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const fadeBlurUp = {
  hidden: { opacity: 0, y: 8, filter: 'blur(6px)' },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const ruleGrow = {
  hidden: { width: 0 },
  visible: (delay: number) => ({
    width: 88,
    transition: { delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};
