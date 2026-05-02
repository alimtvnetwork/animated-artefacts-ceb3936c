import { useEffect, useState, type RefObject } from 'react';
import { Gauge, Play, Pause, RotateCw, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import {
  getScrubState,
  resetScrubState,
  setScrubState,
  subscribeScrubState,
} from '../scrubOverride';
import { STEP_TIMING_PRESETS } from '../stepTiming';
import type { StepTimingPresetName } from '../types';
import type { FocusTimelineHandle } from '../hooks/useFocusTimeline';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  /** Closes the scrubber (returns the deck to authored speed + preset). */
  onClose: () => void;
  /**
   * Live ref to the active slide's `FocusTimelineHandle`. Used to scrub
   * steps and trigger the "Replay entrance" action. Optional methods are
   * feature-detected so non-step slides degrade gracefully (the step strip
   * collapses to a "Not a step slide" placeholder).
   */
  focusRef: RefObject<FocusTimelineHandle | null>;
  /** Active slide number — re-poll the focus handle when it changes. */
  slideNumber: number;
}

/**
 * Floating top-right scrub panel. Three controls, one slide:
 *
 *   1. **Step scrubber** — `<input type="range">` with min=-1 (pre-reveal)
 *      to max=stepCount-1. Drag to land on any step instantly. ← / → buttons
 *      step by one for keyboard accessibility.
 *   2. **Playback speed** — chip group from 0.25× to 2×. Speed-1 is the
 *      default and short-circuits the MotionConfig override in SlideStage.
 *   3. **Step-timing preset** — chip group of every preset declared in
 *      `STEP_TIMING_PRESETS`. Picking one re-routes every step's resolved
 *      timing through that preset until the scrubber is closed.
 *
 * Plus:
 *   - **Replay** — re-runs the slide's entrance animation (-1 → 0 → 1 → …).
 *   - **Close (×)** — clears all overrides via `resetScrubState()` so the
 *     deck immediately returns to authored timing.
 *
 * The panel is `position: fixed`, top-right, marked `data-print-hide` so it
 * never escapes into PDF / SVG / PNG / JPG exports.
 */
export function AnimationScrubber({ onClose, focusRef, slideNumber }: Props) {
  // Mirror the runtime store into local state so chip selections re-render
  // immediately. We also re-poll the focus handle when the slide changes
  // because the new slide may not be a step slide.
  const [state, setState] = useState(() => getScrubState());
  const [step, setStep] = useState<number>(-1);
  const [stepCount, setStepCount] = useState<number>(0);

  // Re-read scrub store on every external change.
  useEffect(() => subscribeScrubState(() => setState(getScrubState())), []);

  // Poll the focus handle for current step + total. Polling (rather than
  // wiring callbacks through every slide type) keeps the scrubber fully
  // self-contained — slides only need to expose the optional methods, no
  // event plumbing required.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const handle = focusRef.current;
      const cnt = handle?.getStepCount?.() ?? 0;
      const cur = handle?.getStep?.() ?? -1;
      setStepCount(cnt);
      setStep(cur);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [focusRef, slideNumber]);

  const scrubStep = (idx: number) => {
    const handle = focusRef.current;
    if (!handle?.setStep) return;
    handle.setStep(idx);
  };

  const isStepSlide = stepCount > 0 && typeof focusRef.current?.setStep === 'function';

  const handleClose = () => {
    resetScrubState();
    onClose();
  };

  return (
    <div
      data-print-hide="true"
      role="dialog"
      aria-label="Animation scrubber"
      className="fixed top-6 right-6 z-50 w-[340px] rounded-2xl controller-pill p-4 shadow-2xl space-y-4 text-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="font-semibold tracking-tight">Animation scrubber</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClose}
              aria-label="Close scrubber and reset overrides"
              className="lift-hover-subtle h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/5 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close & reset</TooltipContent>
        </Tooltip>
      </div>

      {/* ----- Step scrubber ----- */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            Step
          </label>
          <span className="text-[11px] font-mono text-foreground/70">
            {isStepSlide
              ? step < 0
                ? `pre-reveal · 0 / ${stepCount}`
                : `${step + 1} / ${stepCount}`
              : '— not a step slide'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrubStep(Math.max(-1, step - 1))}
            disabled={!isStepSlide || step <= -1}
            aria-label="Previous step"
            className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gold/15 disabled:opacity-30 disabled:cursor-not-allowed transition lift-hover-subtle"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min={-1}
            max={Math.max(0, stepCount - 1)}
            step={1}
            value={step}
            onChange={(e) => scrubStep(Number(e.target.value))}
            disabled={!isStepSlide}
            className="flex-1 accent-gold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Scrub through step enters and exits"
          />
          <button
            onClick={() => scrubStep(Math.min(stepCount - 1, step + 1))}
            disabled={!isStepSlide || step >= stepCount - 1}
            aria-label="Next step"
            className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gold/15 disabled:opacity-30 disabled:cursor-not-allowed transition lift-hover-subtle"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={() => focusRef.current?.replay?.()}
          disabled={!isStepSlide || !focusRef.current?.replay}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-gold/15 text-gold hover:bg-gold/25 transition disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium lift-hover-subtle"
        >
          <RotateCw className="h-3 w-3" />
          Replay entrance
        </button>
      </section>

      {/* ----- Playback speed ----- */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            Playback speed
          </label>
          <span className="text-[11px] font-mono text-foreground/70">{state.playbackSpeed}×</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[0.25, 0.5, 1, 1.5, 2].map((s) => {
            const active = state.playbackSpeed === s;
            return (
              <button
                key={s}
                onClick={() => setScrubState({ playbackSpeed: s })}
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition lift-hover-subtle ${
                  active
                    ? 'bg-gold/25 text-gold ring-1 ring-gold/60'
                    : 'bg-white/5 text-foreground/70 hover:bg-white/10'
                }`}
                aria-pressed={active}
              >
                {s}×
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-foreground/45 leading-relaxed">
          Slows or speeds every Framer transition under this slide. 1× returns to authored timing.
        </p>
      </section>

      {/* ----- Step-timing preset ----- */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            Step-timing preset
          </label>
          {state.presetOverride && (
            <button
              onClick={() => setScrubState({ presetOverride: null })}
              className="text-[10px] text-foreground/50 hover:text-foreground/80 underline-offset-2 hover:underline"
            >
              clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(STEP_TIMING_PRESETS) as StepTimingPresetName[]).map((name) => {
            const active = state.presetOverride === name;
            const preset = STEP_TIMING_PRESETS[name];
            return (
              <Tooltip key={name}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setScrubState({ presetOverride: name })}
                    className={`px-2.5 py-1 rounded-full text-[11px] capitalize transition lift-hover-subtle ${
                      active
                        ? 'bg-ember/25 text-cream ring-1 ring-ember/60'
                        : 'bg-white/5 text-foreground/70 hover:bg-white/10'
                    }`}
                    aria-pressed={active}
                  >
                    {name}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <span className="font-mono text-[10px]">
                    in {preset.enter.durationMs}ms · out {preset.exit.durationMs}ms
                  </span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <p className="text-[10px] text-foreground/45 leading-relaxed">
          Override the slide's authored stepTiming preset. Cleared when you close the scrubber —
          the deck JSON is never modified.
        </p>
      </section>

      {/* ----- Status footer ----- */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="inline-flex items-center gap-1.5 text-[10px] text-foreground/45">
          {state.playbackSpeed === 1 && state.presetOverride === null ? (
            <>
              <Pause className="h-3 w-3" />
              Idle — authored timing
            </>
          ) : (
            <>
              <Play className="h-3 w-3 text-gold" />
              Override active
            </>
          )}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-foreground/40">
          <Gauge className="h-3 w-3" />
          live
        </span>
      </div>
    </div>
  );
}
