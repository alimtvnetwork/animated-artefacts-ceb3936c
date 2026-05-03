import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { forwardRef, useCallback, useEffect, useState } from 'react';
// v0.124 — read live scrubber speed so MotionConfig stretches every Framer
// transition under this stage. Speed === 1 is a no-op (the override returns
// the unscaled value). Outside the in-deck scrubber this stays at 1.
import { playbackSpeed, subscribeScrubState } from './scrubOverride';
import { transitionTypeOverride, subscribeTransitionOverride } from './transitionOverride';
import type { SlideSpec, BrandStripSpec, CapsuleExpandSpec } from './types';
import { getSlideVariants, SLIDE_TRANSITION_CONFIG, resolveSlideTransitionConfig, type Direction } from './transitions';
import { TitleSlide } from './types/TitleSlide';
import { MiddleTitleSlide } from './types/MiddleTitleSlide';
import { KeywordSlide } from './types/KeywordSlide';
import { CapsuleListSlide } from './types/CapsuleListSlide';
import { StepTimelineSlide } from './types/StepTimelineSlide';
import { StepsChain3DSlide } from './types/StepsChain3DSlide';
import { FocusTimelineSlide } from './types/FocusTimelineSlide';
import { AdvanceStepSlide } from './types/AdvanceStepSlide';
import { QrMeetingSlide } from './types/QrMeetingSlide';
import { ImageSlide } from './types/ImageSlide';
import { SectionDividerSlide } from './types/SectionDividerSlide';
import { MetricGridSlide } from './types/MetricGridSlide';
import { TableSlide } from './types/TableSlide';
import { CodeBlockSlide } from './types/CodeBlockSlide';
import { BoxDiagramSlide } from './types/BoxDiagramSlide';
import { ERDiagramSlide } from './types/ERDiagramSlide';
import { LayoutSlide } from './types/LayoutSlide';
import { DatabaseDiagramSlide } from './types/DatabaseDiagramSlide';
import { DataTableSlide } from './types/DataTableSlide';
import { NumberCalloutSlide } from './types/NumberCalloutSlide';
import { EquationSlide } from './types/EquationSlide';
import { ChecklistSlide } from './types/ChecklistSlide';
import { TileSlide } from './types/TileSlide';
import { BrandHeader } from './components/BrandHeader';
import { AmbientBackground } from './components/AmbientBackground';
import { HotspotLayer } from './components/HotspotLayer';
import { ClickRevealBadge } from './components/ClickRevealBadge';
import { ClickRevealExpandPanel, type ExpandPanelPayload } from './components/ClickRevealExpandPanel';
import { resolveAmbient } from './ambientPresets';
import type { FocusTimelineHandle } from './hooks/useFocusTimeline';

interface Props {
  slide: SlideSpec;
  direction: Direction;
  onCapsuleClickReveal: (slideNumber: number) => void;
  /** Forwarded to capsule slides — when true, click-reveal capsules pulse. */
  highlightReveal?: boolean;
  /** Called by ClickRevealBadge's "Back" button. */
  onBackToParent: (parentSlideNumber: number) => void;
  /**
   * Deck-wide default transition timing (`deck.transitionTiming`). Per-slide
   * `content.transitionTiming` overrides this field-by-field. Optional —
   * omit to use the built-in 550ms expoOut default. v0.147.
   */
  deckTransitionTiming?: import('./types').TransitionTimingSpec;
  /**
   * Deck-level per-transition-type timing map (`deck.transitionTimingByType`).
   * Looked up by `slide.transition`. Slots between `deckTransitionTiming`
   * and the per-slide overrides in the resolver. Optional. v0.168.
   */
  deckTransitionTimingByType?: Partial<Record<import('./enums').SlideTransitionValue, import('./types').TransitionTimingSpec>>;
  /**
   * v0.182 — when this number changes, the active slide is re-mounted so the
   * entrance transition replays. Used by the live TransitionInspector to
   * preview tuning without navigating away. Optional.
   */
  replayNonce?: number;
}

interface BodyProps {
  slide: SlideSpec;
  onCapsuleClickReveal: (n: number) => void;
  highlightReveal: boolean;
  /**
   * Spec 26 — generic inline-expand opener. Any slide type may forward this
   * to its trigger elements (step rows, capsules, etc.) so they can open
   * the shared `ClickRevealExpandPanel` without owning the dialog state.
   */
  onOpenExpand: (payload: ExpandPanelPayload) => void;
  /**
   * Forwarded to slides that consume Next/Prev internally before yielding
   * to the deck (currently only `FocusTimelineSlide`). Other slide types
   * ignore it.
   */
  focusRef: React.Ref<FocusTimelineHandle>;
}

/** Maps `content.gridPreset` literal → matching `.slide-grid-*` utility class. */
const GRID_PRESET_CLASS: Record<NonNullable<SlideSpec['content']['gridPreset']>, string> = {
  'split-5-7':     'slide-grid-5-7',
  'split-4-8':     'slide-grid-4-8',
  'split-3-9':     'slide-grid-3-9',
  'split-2-equal': 'slide-grid-2-equal',
  '3-panel':       'slide-grid-3-panel',
  '12-column':     'slide-grid-12-column',
  'card-grid-2x3': 'slide-grid-card-2x3',
  'card-grid-3x3': 'slide-grid-card-3x3',
  'centered-hero': 'slide-grid-centered',
};

function SlideBody({ slide, onCapsuleClickReveal, highlightReveal, onOpenExpand, focusRef }: BodyProps) {
  const inner = renderSlideBody({ slide, onCapsuleClickReveal, highlightReveal, onOpenExpand, focusRef });
  // v0.181 — deck-wide `gridPreset`: wrap any slide body (except LayoutSlide,
  // which owns its own grid via `content.layout`) in a stage-level grid
  // wrapper that enforces the shared spacing tokens. The wrapper itself
  // does NOT mutate the inner slide markup — it just provides consistent
  // padding + an opt-in grid container the slide can fill into.
  const preset = slide.content.gridPreset;
  if (!preset || slide.slideType === 'LayoutSlide') return inner;
  return (
    <div
      className={`slide-grid-wrapper ${GRID_PRESET_CLASS[preset]}`}
      data-grid-preset={preset}
    >
      {inner}
    </div>
  );
}

function renderSlideBody({ slide, onCapsuleClickReveal, highlightReveal, onOpenExpand, focusRef }: BodyProps) {
  switch (slide.slideType) {
    case 'TitleSlide': return <TitleSlide spec={slide} />;
    case 'MiddleTitleSlide': return <MiddleTitleSlide spec={slide} />;
    case 'KeywordSlide': return <KeywordSlide spec={slide} />;
    case 'CapsuleListSlide': return <CapsuleListSlide spec={slide} onCapsuleClickReveal={onCapsuleClickReveal} highlightReveal={highlightReveal} />;
    case 'StepTimelineSlide': return <StepTimelineSlide ref={focusRef} spec={slide} onReveal={onCapsuleClickReveal} onOpenExpand={onOpenExpand} highlightReveal={highlightReveal} />;
    case 'StepsChain3DSlide': return <StepsChain3DSlide ref={focusRef} spec={slide} />;
    case 'FocusTimelineSlide': return <FocusTimelineSlide ref={focusRef} spec={slide} />;
    case 'AdvanceStepSlide': return <AdvanceStepSlide ref={focusRef} spec={slide} />;
    case 'QrMeetingSlide': return <QrMeetingSlide spec={slide} />;
    case 'ImageSlide': return <ImageSlide spec={slide} />;
    case 'SectionDividerSlide': return <SectionDividerSlide spec={slide} />;
    case 'MetricGridSlide': return <MetricGridSlide spec={slide} />;
    case 'TableSlide': return <TableSlide spec={slide} />;
    case 'CodeBlockSlide': return <CodeBlockSlide spec={slide} />;
    case 'BoxDiagramSlide': return <BoxDiagramSlide spec={slide} />;
    case 'ERDiagramSlide': return <ERDiagramSlide spec={slide} />;
    case 'LayoutSlide': return <LayoutSlide spec={slide} />;
    case 'DatabaseDiagramSlide': return <DatabaseDiagramSlide spec={slide} />;
    case 'DataTableSlide': return <DataTableSlide spec={slide} />;
    case 'NumberCalloutSlide': return <NumberCalloutSlide spec={slide} />;
    case 'EquationSlide': return <EquationSlide spec={slide} />;
    case 'ChecklistSlide': return <ChecklistSlide spec={slide} />;
    default: return <TitleSlide spec={slide} />;
  }
}

/**
 * BrandStrip is permanently disabled by user constraint.
 *
 * Root cause of the recurring banner bug:
 * - I removed `deck.brandStrip` from the bundled showcase `deck.json`, but
 *   the runtime can load imported manifests from localStorage.
 * - Any older imported manifest that still contains `deck.brandStrip` would
 *   continue to render the top logo/tagline banner through this resolver.
 * - Therefore the correct fix is not only config cleanup; the resolver itself
 *   must return null unless the user explicitly asks to restore the feature.
 */
export function resolveBrandStrip(_slide: SlideSpec): BrandStripSpec | null {
  return null;
}

/**
 * `SlideStage` forwards a ref to the underlying focus-timeline handle when
 * the slide type is `FocusTimelineSlide`. The deck's Next/Prev calls
 * `ref.current?.tryAdvance()` first; only when it returns `false` (chain
 * boundary) does the deck navigate to a sibling slide.
 *
 * Owns the generic `ClickRevealExpandPanel` (spec 26) so any slide type or
 * the hotspot layer can open inline-expand cards through `onOpenExpand`
 * without each slide reimplementing the dialog plumbing.
 */
export const SlideStage = forwardRef<FocusTimelineHandle, Props>(function SlideStage(
  { slide, direction, onCapsuleClickReveal, onBackToParent, highlightReveal = false, deckTransitionTiming, deckTransitionTimingByType, replayNonce = 0 },
  focusRef,
) {
  // v0.187 — Live transition-type override (TransitionInspector "Type"
  // dropdown). When in scope (deck-wide or pinned to this slide number) it
  // replaces the authored `slide.transition` so the user can swap Fade ↔
  // Slide ↔ Push variants without editing JSON. Out of scope → null → use
  // authored value. Re-renders via `subscribeTransitionOverride` below.
  const typeOverride = transitionTypeOverride(slide.slideNumber);
  const effectiveTransition = typeOverride ?? slide.transition;
  const variants = getSlideVariants(effectiveTransition, direction);
  const [expandPayload, setExpandPayload] = useState<ExpandPanelPayload | null>(null);
  const openExpand = useCallback((payload: ExpandPanelPayload) => {
    setExpandPayload(payload);
  }, []);
  const closeExpand = useCallback(() => setExpandPayload(null), []);
  // v0.124 — local re-render trigger so MotionConfig picks up speed changes
  // pushed from the scrubber. We don't store the speed itself in state; we
  // read `playbackSpeed()` at render time so we always see the latest value
  // (avoids one-frame stale reads on rapid slider drags).
  const [, setScrubTick] = useState(0);
  useEffect(() => subscribeScrubState(() => setScrubTick((t) => t + 1)), []);
  // v0.187 — re-render when the live transition-type override flips so the
  // next entrance picks up the user's new pick on the same slide.
  useEffect(() => subscribeTransitionOverride(() => setScrubTick((t) => t + 1)), []);
  const speed = playbackSpeed();
  // Spec 24 §6 — opt-in ambient layer for any slide. StepTimelineSlide owns
  // its own scene-specific ambient layer (dev-tools, theme-coupled), so we
  // skip injecting one here for that type to avoid double-rendering.
  const ambient =
    slide.slideType === 'StepTimelineSlide' ? null : resolveAmbient(slide.ambientBackground);
  // v0.38 — universal warm-amber halo + faint dotted gold lattice on every
  // slide stage (except QrMeetingSlide, which paints its own bespoke radial
  // background per spec 12). The dot lattice + halo are CSS-only and live
  // BEHIND every other layer so they never compete with content. See
  // `.slide-stage-ambient` in `src/index.css` and spec 31 §1.
  const showStageAmbient = slide.slideType !== 'QrMeetingSlide';
  // v0.52 — extend the dot lattice to the TitleSlide (home) too. User:
  // "you don't have the lattice dots in the home page, why … add at
  // least 40% intensity in the glow section". Other slides still keep
  // just the warm halo so the deck stays varied.
  const lattice =
    slide.slideType === 'StepTimelineSlide' || slide.slideType === 'TitleSlide';
  const ambientClass = 'slide-stage-ambient' + (lattice ? ' with-dot-lattice' : '');
  return (
    // v0.124 — MotionConfig multiplies every nested transition.duration by
    // (1 / speed) so the entire stage can be slowed down for inspection.
    // When speed === 1 we omit the override so we don't shadow per-component
    // transition configs (each child still wins on its own duration tuning).
    <MotionConfig transition={speed === 1 ? undefined : { duration: 0.5 / speed }}>
    <div className="relative h-full w-full overflow-hidden noise" data-slide-stage="true" data-non-empty="true">
      {showStageAmbient && <div aria-hidden="true" className={ambientClass} />}
      {ambient && (
        <AmbientBackground
          seed={`stage-${slide.slideNumber}-${slide.slideName}`}
          icons={ambient.icons}
          count={ambient.count}
          opacity={ambient.opacity}
          drift={ambient.drift}
          glow={ambient.glow}
          parallax={ambient.parallax}
          accentColors={ambient.accentColors}
        />
      )}
      {slide.showBrandHeader && (
        <BrandHeader
          showPresenter={slide.showPresenterChip}
          offsetTop={0}
        />
      )}
      <ClickRevealBadge slide={slide} onBack={onBackToParent} />
      <AnimatePresence mode="wait" custom={direction}>
        {(() => {
          // Resolve enter + exit configs separately so the inspector can tune
          // them independently. Exit goes onto the `exit` variant's per-variant
          // transition, which Framer prioritizes over the parent `transition`
          // prop. Enter stays on the parent for backward compatibility. v0.186.
          const enterCfg = resolveSlideTransitionConfig(slide.content.transitionTiming, deckTransitionTiming, {
            transition: effectiveTransition,
            slideByType: slide.content.transitionTimingByType,
            deckByType: deckTransitionTimingByType,
            slideNumber: slide.slideNumber,
            phase: 'enter',
          });
          const exitCfg = resolveSlideTransitionConfig(slide.content.transitionTiming, deckTransitionTiming, {
            transition: effectiveTransition,
            slideByType: slide.content.transitionTimingByType,
            deckByType: deckTransitionTimingByType,
            slideNumber: slide.slideNumber,
            phase: 'exit',
          });
          const exitVariant = variants.exit;
          const variantsWithExit = exitVariant && typeof exitVariant === 'object' && !Array.isArray(exitVariant)
            ? { ...variants, exit: { ...exitVariant, transition: exitCfg } }
            : variants;
          return (
        <motion.div
          key={`${slide.slideNumber}-${replayNonce}`}
          variants={variantsWithExit}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={enterCfg}
          className="absolute inset-0"
        >
          <SlideBody
            slide={slide}
            onCapsuleClickReveal={onCapsuleClickReveal}
            highlightReveal={highlightReveal}
            onOpenExpand={openExpand}
            focusRef={focusRef}
          />
          {slide.content.hotspots && (
            <HotspotLayer
              hotspots={slide.content.hotspots}
              onReveal={onCapsuleClickReveal}
              onExpand={openExpand}
              layoutScope={slide.slideNumber}
            />
          )}
        </motion.div>
          );
        })()}
      </AnimatePresence>
      <ClickRevealExpandPanel
        payload={expandPayload}
        onClose={closeExpand}
        onCtaReveal={onCapsuleClickReveal}
      />
    </div>
    </MotionConfig>
  );
});
