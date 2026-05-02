/**
 * Animation preview panel — wraps a SlidePreview with playback controls so
 * deck authors can scrub through the selected slide's transition + text
 * animation timing before exporting.
 *
 * # Why this shape (and not a true timeline scrubber)
 * Framer Motion doesn't expose a frame-accurate scrubber for declarative
 * variants — animations are JS-driven and start at mount. A literal
 * drag-to-time UI would require rebuilding every animation as a
 * `useAnimation` controller (painful, fragile, and bypasses the per-slide
 * animation specs the deck authoring tool is meant to preview faithfully).
 *
 * Instead we expose the three things authors actually need before export:
 *
 *   - **Playback speed (0.25×–2×)** — slow it down to 0.25× and you can
 *     watch each entrance phase land individually. Implemented via
 *     `<MotionConfig transition>` which merges into every child transition,
 *     scaling `duration` (and spring damping for natural-looking slow-mo).
 *   - **Replay** — bumps an internal `key` so the preview remounts and the
 *     entrance variants run again from `initial`.
 *   - **Auto-loop** — replays every (animation length × 1/speed) + 1.5s
 *     buffer until the user toggles it off.
 *
 * The combination delivers the practical equivalent of a scrubber: pick a
 * speed, hit replay, watch. For exports the speed always defaults back to
 * 1× — this panel never mutates the slide spec.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { Pause, Play, Repeat, RotateCw } from 'lucide-react';
import type { SlideSpec } from '../slides/types';
import { SlidePreview } from '../slides/components/SlidePreview';
import { Field } from './FormPrimitives';

interface Props {
  slide: SlideSpec | null;
  /** Width passed through to SlidePreview. */
  width: number;
}

const SPEED_PRESETS = [0.25, 0.5, 1, 1.5, 2] as const;
const SPEED_BOUNDS = { min: 0.25, max: 2, step: 0.05 } as const;

/** Roughly how long a typical slide's entrance takes at 1× speed (transition
 *  ~0.55s + text stagger ~0.5s + cinematic capsule overshoot ~0.3s tail). We
 *  pad with 1.5s so the auto-loop never cuts the animation short. */
const ESTIMATED_ENTRANCE_MS = 1500;

export function AnimationPreviewPanel({ slide, width }: Props) {
  const [speed, setSpeed] = useState<number>(1);
  const [loop, setLoop] = useState<boolean>(false);
  const [replayKey, setReplayKey] = useState<number>(0);
  const loopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-loop scheduler — recomputes after every replay so changing the
  // speed mid-loop affects the NEXT cycle's interval, not the current one.
  useEffect(() => {
    if (loopTimer.current) {
      clearTimeout(loopTimer.current);
      loopTimer.current = null;
    }
    if (!loop || !slide) return;
    const cycleMs = ESTIMATED_ENTRANCE_MS / speed + 800;
    loopTimer.current = setTimeout(() => setReplayKey(k => k + 1), cycleMs);
    return () => {
      if (loopTimer.current) clearTimeout(loopTimer.current);
    };
  }, [replayKey, loop, speed, slide]);

  // Re-replay when the user picks a new slide so they see its entrance
  // immediately rather than landing mid-animation (or post-animation).
  useEffect(() => {
    if (slide) setReplayKey(k => k + 1);
  }, [slide?.slideNumber, slide?.transition, slide?.textAnimation]);

  // Build the MotionConfig transition override. We scale `duration` directly;
  // springs respect `MotionConfig` poorly, so we approximate by also widening
  // damping at low speeds — the result feels "slowed" rather than "rubber".
  const transitionOverride = useMemo(
    () => ({
      duration: 0.55 / speed,
      // Springs ignore `duration` but framer will pass these merged values
      // when a child transition explicitly opts into spring — harmless when
      // ignored, useful when honored.
      damping: 18 / Math.max(0.5, speed),
      stiffness: 220 * speed,
    }),
    [speed],
  );

  const speedLabel = `${speed.toFixed(2).replace(/\.?0+$/, '')}×`;

  return (
    <div className="space-y-3">
      <Field label="Animation timeline">
        <div className="bg-surface-1/30 border border-border rounded-xl overflow-hidden">
          {/* ---- Preview surface ---- */}
          <div className="p-4 flex items-center justify-center min-h-[320px] bg-background/40">
            {slide ? (
              <MotionConfig transition={transitionOverride} reducedMotion="never">
                <SlidePreview
                  // Bump the key on every replay so framer remounts the slide
                  // and the entrance variants run from `initial` again.
                  key={`${slide.slideNumber}-${replayKey}`}
                  slide={slide}
                  width={width}
                  className="rounded-lg shadow-elegant"
                />
              </MotionConfig>
            ) : (
              <span className="text-xs text-muted-foreground italic">No slide selected.</span>
            )}
          </div>

          {/* ---- Controls strip ---- */}
          <div className="border-t border-border bg-surface-1/40 px-4 py-3 space-y-3">
            {/* Row 1: Play/Replay + loop toggle + speed readout */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReplayKey(k => k + 1)}
                disabled={!slide}
                className="lift-hover-subtle inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed text-[12px] font-medium"
                title="Replay entrance animation"
              >
                <RotateCw className="h-3.5 w-3.5" /> Replay
              </button>
              <button
                onClick={() => setLoop(v => !v)}
                disabled={!slide}
                aria-pressed={loop}
                className={`lift-hover-subtle inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12px] font-medium transition ${
                  loop
                    ? 'bg-gold/15 text-gold border-gold/50'
                    : 'bg-transparent text-foreground/70 border-border hover:bg-foreground/5'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={loop ? 'Stop auto-loop' : 'Auto-loop the entrance'}
              >
                {loop ? <Pause className="h-3.5 w-3.5" /> : <Repeat className="h-3.5 w-3.5" />}
                {loop ? 'Looping' : 'Loop'}
              </button>
              <div className="flex-1" />
              <span className="text-[11px] font-mono text-muted-foreground">
                Speed <span className="text-gold">{speedLabel}</span>
              </span>
            </div>

            {/* Row 2: Speed slider */}
            <div>
              <input
                type="range"
                min={SPEED_BOUNDS.min}
                max={SPEED_BOUNDS.max}
                step={SPEED_BOUNDS.step}
                value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-full accent-gold cursor-pointer"
                aria-label="Playback speed"
              />
              <div className="flex justify-between mt-1">
                {SPEED_PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => setSpeed(p)}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition ${
                      Math.abs(speed - p) < 0.025
                        ? 'text-gold bg-gold/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-label={`Set speed to ${p}×`}
                  >
                    {p}×
                  </button>
                ))}
              </div>
            </div>

            {/* Hint */}
            <p className="text-[10.5px] text-muted-foreground/80 leading-relaxed flex items-start gap-1.5">
              <Play className="h-3 w-3 mt-0.5 shrink-0" />
              <span>
                Slow to 0.25× to inspect each entrance phase. Speed never affects the
                exported deck — it's preview-only.
              </span>
            </p>
          </div>
        </div>
      </Field>
    </div>
  );
}
