import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import type { LucideProps } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Pause, Play, ArrowUpRight,
  Code2, Terminal, GitBranch, Github, Figma, Boxes, Container, Cpu,
  Cloud, Database, Braces, Bug,
} from 'lucide-react';
import type { SlideSpec, StepCtaSpec, StepSpec } from '../types';
import type { ExpandPanelPayload } from '../components/ClickRevealExpandPanel';
import { resolveStepEnter, resolveStepExit, resolveStepTopOffset, resolveSlideTopOffset, resolveStepRevealOrder, stepRevealDelayMs } from '../stepTiming';
import { titleClassFor } from '../preset';
import { Capsule } from '../components/Capsule';
import { toDescriptionString } from '../utils/descriptionString';
import { stepMotionVariant } from '../utils/stepMotionVariant';
import { useStepMotionOverride } from '../stepMotionOverride';
import { AmbientBackground } from '../components/AmbientBackground';
import { slideSound } from '../sound';
import { resolveIconSlugs, AMBIENT_ICON_REGISTRY, AMBIENT_DEFAULT_BRAND_COLORS } from '../ambientIconRegistry';
import { resolveAmbient } from '../ambientPresets';
import type { FocusTimelineHandle } from '../hooks/useFocusTimeline';
import { ColorTokenDebugOverlay, useColorDebug } from '../components/ColorTokenDebugOverlay';

/** Per-spec-24 — StepTimeline ambient icon pool.
 *  v3.2 — fewer, bigger silhouettes. We render only AMBIENT_PER_STEP icons at
 *  a time, picked deterministically from this pool by the active step index,
 *  so the ambient flavor swaps as the presenter walks the chain (without
 *  ever stealing focus from the timeline text).
 *
 *  One icon per step gets a real brand-color accent; the rest stay faded
 *  monochrome silhouettes so the field reads as deliberate texture. */
const STEP_AMBIENT_POOL: ComponentType<LucideProps>[] = [
  Code2, Terminal, GitBranch, Github, Figma, Boxes,
  Container, Cpu, Cloud, Database, Braces, Bug,
];

/** Brand colors keyed by the icon component itself — applied whenever that
 *  icon happens to be the accent slot for the current step. */
const ICON_BRAND_COLORS = new Map<ComponentType<LucideProps>, string>([
  [Code2,    '#007ACC'], // VS Code blue
  [Figma,    '#F24E1E'], // Figma orange
  [Github,   '#FFFFFF'], // hardcoded-white-ok: GitHub brand glyph color, theme-independent
  [Cloud,    '#4FC3F7'], // generic cloud blue
  [Database, '#F0DB4F'], // amber
]);

/** Render this many ambient icons at once on a step slide.
 *  v0.46 — sizes pulled WAY down (was 72–128) after the brand-color
 *  accents started overlapping the description text in the right column.
 *  At 36–72px icons read as deliberate background texture instead of
 *  competing focal points. */
const AMBIENT_PER_STEP = 6;
const AMBIENT_SIZE_RANGE: [number, number] = [36, 72];

/**
 * Step-timeline slide v2 (with v2.1 + §13.4 side-panel + §13.6 nav-ownership
 * addenda).
 *
 * Spec of record: `spec/slides/17-step-timeline-v2.md` ("**steps implementation**").
 *
 * Behavior summary (full detail in the spec):
 *   - Steps reveal sequentially on mount; first arrival lands on step 0.
 *   - Autoplay is OFF by default. Toggle is an icon-only Play/Pause button.
 *   - Click on a step jumps to it AND pauses autoplay for `PAUSE_MS`.
 *   - Owns deck Next/Prev: `tryAdvance(dir)` walks the steps and only returns
 *     `false` at the chain edges (so the deck advances to a sibling slide).
 *     Same handle as AdvanceStepSlide / FocusTimelineSlide.
 *   - Slide-scoped keyboard nav: ↑/↓, j/k, Home/End, 1-9, P.
 *     ArrowLeft/Right + Space/Enter are reserved for the deck (which routes
 *     them through `tryAdvance` first).
 *   - Two-column layout: timeline left, single description side panel right.
 *     The right panel cinematically swaps left→right with a soft blur ramp
 *     on every active/hover change (§13.4).
 *   - Active row is a dim gold-tinted CARD (no border) so the focus reads
 *     without the harsh outline rectangle (§13.6).
 *   - Sound on every `active` change (whoosh by default; spec 21).
 *   - Respects `prefers-reduced-motion`: snaps to final state, no autoplay,
 *     side panel uses a 150ms opacity crossfade with no x or blur.
 */

const STEP_INTERVAL_MS = 2200;
const PAUSE_MS = 6000;
// v0.145 — reveal-order cadence (base delay + per-row stagger) is now
// authored per slide via `content.stepTiming.baseDelayMs` / `staggerMs`.
// `resolveStepRevealOrder()` returns the legacy 300ms / 180ms when the
// slide doesn't override, so default behaviour is unchanged.

interface StepTimelineProps {
  spec: SlideSpec;
  /** Spec 26 — navigate-style click-reveal opener (forwarded by SlideStage). */
  onReveal?: (slideNumber: number) => void;
  /** Spec 26 — inline-expand opener (forwarded by SlideStage). */
  onOpenExpand?: (payload: ExpandPanelPayload) => void;
  /** v0.160 — kept on the prop API for source-compat with SlideStage and
   *  the showcase pages, but no longer rendered: the soft pulse ring on
   *  reveal-bearing rows visually split steps 1-2 from 3-4 in the same
   *  slide. The click-reveal still works via row click + the
   *  `data-has-reveal` data attribute (used for tooling / a11y). */
  highlightReveal?: boolean;
}

export const StepTimelineSlide = forwardRef<FocusTimelineHandle, StepTimelineProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function StepTimelineSlide({ spec, onReveal, onOpenExpand, highlightReveal: _highlightReveal = false }, ref) {
  const c = spec.content;
  const steps = c.steps ?? [];
  const total = steps.length;
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  // Subscribed read so the overlay shows/hides immediately when the
  // chrome toggle (or another tab) flips `riseup.colorDebug`.
  const colorDebugOn = useColorDebug();
  // Re-render when the presenter changes the deck-wide step-motion lock
  // from the controller hamburger so `data-motion-variant` updates live.
  useStepMotionOverride();

  /** Per-step CTA click handler (spec 17 §step-CTA addendum). Plays a soft
   *  click cue, then either opens the external URL in a new tab or routes
   *  the deck to the reveal target. Volume matches the deck-wide click cue
   *  (`slideSound.play('click', 0.18)` — see v0.57 sound polish). */
  const handleCtaClick = useCallback((cta: StepCtaSpec) => {
    slideSound.play('click', 0.18);
    if (cta.href) {
      window.open(cta.href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (typeof cta.revealSlide === 'number') {
      navigate(`/${cta.revealSlide}`);
    }
  }, [navigate]);

  /**
   * Spec 26 — fire the step's implicit click-reveal trigger. Called by both
   * the row chip's "Open ↗" affordance and the auto-CTA in the right panel.
   * `expand` wins over `revealSlide` when both are set, mirroring CapsuleSpec.
   */
  const fireStepReveal = useCallback((step: StepSpec, idx: number) => {
    slideSound.play('click', 0.18);
    if (step.expand) {
      onOpenExpand?.({
        expand: step.expand,
        layoutId: `step-${spec.slideNumber}-${idx}`,
        fallbackTitle: step.title,
      });
      return;
    }
    if (typeof step.revealSlide === 'number') {
      if (onReveal) {
        onReveal(step.revealSlide);
      } else {
        navigate(`/${step.revealSlide}`);
      }
    }
  }, [navigate, onOpenExpand, onReveal, spec.slideNumber]);

  // -1 means "still revealing — no active highlight yet". Once reveal finishes
  // we set it to 0 (Step 1 active). The first arrival is intentionally quiet:
  // Step 1 is already visible during the reveal phase, so replaying its active
  // text/badge animation + whoosh on initial load looks like a double-fire.
  const [active, setActive] = useState<number>(reduced && total > 0 ? 0 : -1);
  const [autoplay, setAutoplay] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // (v0.121 removed `hasLeftInitialStep` — step 1 now animates uniformly
  // with steps 2..N on its first activation; see render block ~L786 for the
  // detailed rationale + the `skippedInitialFocusSound` whoosh-dedupe that
  // still prevents the audio double-fire concern.)
  const pauseUntilRef = useRef<number>(0);
  const skippedInitialFocusSound = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  /** v0.73 — per-row refs so we can keep the active step in view after
   *  every nav action (Enter, Right Arrow, Left Arrow, click, autoplay).
   *  Without this, advancing past the visible window leaves the focused
   *  row clipped at the bottom of the timeline column on shorter
   *  viewports. See spec/slides/33-step-timeline-interactions.md §4.1. */
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [wideStage, setWideStage] = useState(false);

  /** Push the manual-pause window forward by PAUSE_MS. Called by every
   *  user-initiated cursor move (click / keyboard) but NOT by hover. */
  const pushPause = useCallback(() => {
    pauseUntilRef.current = Date.now() + PAUSE_MS;
  }, []);

  // Kick off auto-advance after the reveal animation completes.
  useEffect(() => {
    if (reduced || total === 0) return;
    const revealDoneMs = stepRevealDelayMs(c.stepTiming, total - 1) + 500;
    const startTimer = window.setTimeout(() => setActive(0), revealDoneMs);
    return () => window.clearTimeout(startTimer);
  }, [reduced, total, c.stepTiming]);

  // (v0.121 removed the `hasLeftInitialStep` tracking effect — step 1 now
  // animates uniformly on its first activation, and the whoosh dedupe lives
  // in the focus-cue effect via `skippedInitialFocusSound`.)

  /** v0.73 — keep the active step row centered in its scroll viewport after
   *  every nav (Enter / Right / Left arrow / click / autoplay tick). The
   *  step list itself doesn't usually scroll on a desktop preview, but on
   *  smaller viewports — and crucially inside the maximized fullscreen
   *  layout when the deck is opened on a 13" laptop — rows past the visible
   *  window get clipped. We use `block: 'nearest'` so we never scroll the
   *  page when the row is already on screen, and `behavior: 'smooth'` to
   *  match the cinematic vibe of the active-row swap. Skipped during
   *  reduced-motion (snap layout) and during the pre-reveal phase
   *  (`active < 0`) so the initial mount doesn't trigger a jolt. */
  useEffect(() => {
    if (active < 0) return;
    const el = stepRefs.current[active];
    if (!el) return;
    el.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [active, reduced]);

  // Layout intelligence for maximized/browser-fullscreen previews: CSS
  // `:fullscreen` only fires for the Fullscreen API, so measure the actual
  // slide stage and apply the same left/down composition when the canvas is
  // already wide + tall enough to benefit from it.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setWideStage(width >= 1180 && height >= 680);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Auto-advance loop. Skips ticks while a manual interaction is still within
  // its pause window OR when `autoplay` is OFF. Loops back to 0 after the last.
  useEffect(() => {
    if (reduced || active < 0 || total === 0 || !autoplay) return;
    const interval = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      setLastInteraction('auto');
      setActive((prev) => (prev + 1) % total);
    }, STEP_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [reduced, active, total, autoplay]);

  // Sound on focus arrival (spec 17 + 21). Fires once per `active` change so
  // the audience hears the cursor land. Defaults to a whoosh; authors can
  // override via `spec.sound = { kind, volume, mute }`.
  const lastPlayedActive = useRef<number | null>(null);
  useEffect(() => {
    if (active < 0) return;
    if (active === 0 && !skippedInitialFocusSound.current) {
      skippedInitialFocusSound.current = true;
      lastPlayedActive.current = active;
      return;
    }
    const s = spec.sound ?? { on: 'focus' as const, kind: 'whoosh' as const, volume: 0.6 };
    if (s.mute) return;
    if ((s.on ?? 'focus') !== 'focus') return;
    if (lastPlayedActive.current === active) return;
    lastPlayedActive.current = active;
    // v0.57 — bumped default 0.35 → 0.5 per user feedback ("step page
    // whoosh needs to be a little bit louder").
    // v0.121 — bumped 0.5 → 0.6 (+20%) per repeat user request, paired
    // with the louder fade_swoosh_v3.mp3 source (see sound.ts ASSETS).
    slideSound.play(s.kind ?? 'whoosh', s.volume ?? 0.6);
  }, [active, spec.sound]);

  /** Tracks the most recent way the focused step was set. Drives the
   *  right-panel transition profile — clicks get a punchy "snap" with
   *  blur clear + subtle scale; auto/hover uses the gentler cinematic
   *  fade. Reset to 'auto' on every active change that wasn't manual. */
  const [lastInteraction, setLastInteraction] = useState<'auto' | 'click' | 'hover'>('auto');

  /** Click on a step row → make it the active/focused step immediately,
   *  hide every other step's detail panel, pause autoplay for PAUSE_MS,
   *  and clear any lingering hover so the clicked step wins (otherwise
   *  the right-panel `focusedIndex` would stay on the previously hovered
   *  row until the cursor moved). */
  const handleStepClick = (idx: number) => {
    pushPause();
    setHoveredIndex(null);
    setLastInteraction('click');
    setActive(idx);
  };

  /** Move the active step within the chain. Returns true when it actually
   *  moved; false at the chain edges so the deck can advance to a sibling.
   *
   *  v0.60 — Left/Right arrows from the deck (and any other keyboard-driven
   *  step change) now share the same "premium snap" transition profile as
   *  clicking a step row, by tagging `lastInteraction = 'click'` here and
   *  clearing any stale hover focus. */
  const tryStep = useCallback(
    (dir: 'forward' | 'backward'): boolean => {
      if (total === 0) return false;
      const commit = (next: number) => {
        pushPause();
        setHoveredIndex(null);
        setLastInteraction('click');
        setActive(next);
      };
      // Pre-reveal phase: forward should snap to step 0 (and consume the nav)
      // so the user doesn't blow past the slide before the first step lands.
      if (active < 0) {
        if (dir === 'forward') {
          commit(0);
          return true;
        }
        return false;
      }
      if (dir === 'forward') {
        if (active >= total - 1) return false;
        commit(active + 1);
        return true;
      }
      // backward
      if (active <= 0) return false;
      commit(active - 1);
      return true;
    },
    [active, total, pushPause],
  );

  // Expose the step-first nav handle. Deck Next/Prev call this BEFORE
  // navigating to a sibling slide (see `SlideDeckPage.tsx`). v0.124 also
  // exposes setStep / getStep / getStepCount / replay for the in-deck
  // animation scrubber overlay.
  useImperativeHandle(
    ref,
    () => ({
      tryAdvance: tryStep,
      setStep: (idx: number) => {
        pushPause();
        setHoveredIndex(null);
        setLastInteraction('click');
        if (idx < 0) {
          // Return to pre-reveal so the entrance animations can replay.
          setActive(-1);
          // Allow the `setActive(0)` reveal-done timer to refire by clearing
          // the dedupe flag the focus-cue effect uses.
          skippedInitialFocusSound.current = false;
          lastPlayedActive.current = null;
          return;
        }
        const clamped = Math.max(0, Math.min(total - 1, idx));
        setActive(clamped);
      },
      getStep: () => active,
      getStepCount: () => total,
      replay: () => {
        // Drop back to the pre-reveal phase; the existing `revealDoneMs`
        // timer (started by the `[reduced, total]` effect) re-fires on
        // remount-equivalent state changes. To force re-arm even when the
        // dependency array doesn't change, we toggle `active` to -1; the
        // setup effect runs once at mount only, so we additionally schedule
        // a manual `setActive(0)` after the reveal duration here.
        skippedInitialFocusSound.current = false;
        lastPlayedActive.current = null;
        setActive(-1);
        const revealDoneMs = stepRevealDelayMs(c.stepTiming, total - 1) + 500;
        window.setTimeout(() => setActive(0), revealDoneMs);
      },
    }),
    [tryStep, active, total, pushPause],
  );

  // Slide-scoped keyboard control. Guarded against form fields so the
  // builder/settings inputs keep working when this slide is mounted.
  // ArrowLeft/Right + Space/Enter are intentionally NOT handled here — the
  // deck owns those for prev/next/grid.
  useEffect(() => {
    if (total === 0) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;

      const move = (delta: number) => {
        e.preventDefault();
        pushPause();
        setHoveredIndex(null);
        setLastInteraction('click');
        setActive((prev) => {
          const start = prev < 0 ? 0 : prev;
          return ((start + delta) % total + total) % total;
        });
      };

      const jumpTo = (idx: number) => {
        e.preventDefault();
        pushPause();
        setHoveredIndex(null);
        setLastInteraction('click');
        setActive(idx);
      };

      if (e.key === 'ArrowDown' || e.key === 'j') return move(1);
      if (e.key === 'ArrowUp' || e.key === 'k') return move(-1);
      if (e.key === 'Home') return jumpTo(0);
      if (e.key === 'End') return jumpTo(total - 1);
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); setAutoplay((a) => !a); return; }
      // Digit jump: 1..9 → step 0..8 (clamped to total-1).
      if (/^[1-9]$/.test(e.key)) {
        return jumpTo(Math.min(parseInt(e.key, 10) - 1, total - 1));
      }
    }
    // Spec 44 §5 — only listen while the tab is visible. Detach on hide so
    // a backgrounded deck never hijacks keys belonging to another tab.
    function attach() { window.addEventListener('keydown', onKey); }
    function detach() { window.removeEventListener('keydown', onKey); }
    function onVisibility() {
      if (document.visibilityState === 'visible') attach();
      else detach();
    }
    if (document.visibilityState === 'visible') attach();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      detach();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [total, pushPause]);

  // For the progress pill we treat the pre-reveal phase as "Step 1 of M" so
  // the bar isn't empty/zero before the cursor kicks in.
  const displayActive = active < 0 ? 0 : active;
  const progressPct = total > 0 ? ((displayActive + 1) / total) * 100 : 0;

  // The right-hand description panel follows hover (if hovering a row) and
  // otherwise tracks `active`. Chip glow + connector stay bound to `active`
  // so the autoplay cursor isn't disturbed by mouse movement.
  const focusedIndex = hoveredIndex ?? (active < 0 ? 0 : active);
  const focusedStep = steps[focusedIndex];

  // Below `lg` the right panel stacks under the timeline → use a shorter
  // slide distance so the entrance still reads on narrow viewports.
  // v3 — slightly longer travel pairs with the 1.1s expo-out fade.
  const slideInDist = -48;
  const slideOutDist = 28;

  // Ghost numeral string — 1-indexed and zero-padded. Pre-reveal shows "01".
  const ghostNumber = String(displayActive + 1).padStart(2, '0');

  // v3.1 — alternate the ghost-numeral entrance: even steps fade, odd steps
  // slide. Keeps the cinematic feel from getting repetitive on long chains.
  // useMemo so the variant is stable per active change (not per render).
  const ghostVariant: 'fade' | 'slide-right' | 'slide-up' = useMemo(() => {
    const i = displayActive;
    if (i % 3 === 0) return 'fade';
    if (i % 3 === 1) return 'slide-right';
    return 'slide-up';
  }, [displayActive]);

  const ghostInitial = reduced
    ? { opacity: 0 }
    : ghostVariant === 'fade'
      ? { opacity: 0 }
      : ghostVariant === 'slide-right'
        ? { opacity: 0, x: 64 }
        : { opacity: 0, y: 48 };
  const ghostAnimate = reduced
    ? { opacity: 1 }
    : { opacity: 1, x: 0, y: 0 };
  const ghostExit = reduced
    ? { opacity: 0 }
    : ghostVariant === 'fade'
      ? { opacity: 0 }
      : ghostVariant === 'slide-right'
        ? { opacity: 0, x: -32 }
        : { opacity: 0, y: -28 };

  // Per-step ambient set: rotate a window of AMBIENT_PER_STEP icons through
  // the pool, anchored on the active step so each step has its own visible
  // mix. The first icon in the window also gets a brand-color accent when
  // the icon component has one in `ICON_BRAND_COLORS`.
  //
  // v0.83 — When `content.stepAmbient` is authored on the slide, that JSON
  // block becomes the source of truth (knobs and/or explicit positions).
  // Otherwise we fall back to the legacy hard-coded behavior so existing
  // decks keep working unchanged.
  const ambientStep = displayActive;
  const authored = c.stepAmbient;

  // Resolve the per-step JSON block (when authored) into shapes Ambient-
  // Background understands. We support either the seeded path (knobs only)
  // or the explicit-positions path (1:1 reproducible).
  const authoredPool = useMemo(
    () => (authored?.iconPool ? resolveIconSlugs(authored.iconPool) : null),
    [authored?.iconPool],
  );
  const authoredExplicit = useMemo(() => {
    if (!authored?.positions || authored.positions.length === 0) return undefined;
    return authored.positions.map((p) => ({
      Icon: AMBIENT_ICON_REGISTRY[p.icon] ?? Code2,
      top: p.top,
      left: p.left,
      size: p.size,
      accent: p.accent ?? AMBIENT_DEFAULT_BRAND_COLORS[p.icon],
      float: p.float,
    }));
  }, [authored?.positions]);

  // Legacy seeded fallback (current behavior — used when no JSON authored).
  // v0.150 — when the slide doesn't author `content.stepAmbient` but DOES set
  // `slide.ambientBackground = "devtools"` (or another preset name / spec),
  // resolve that preset and use its icon set as the pool. This unifies
  // StepTimeline with the rest of the deck's ambient system: a slide that
  // wants the productivity icon flavour can opt in with one line of JSON
  // instead of repeating the icon list. Per-step window rotation behaviour
  // stays identical — only the pool source changes.
  const presetAmbient = useMemo(
    () => (authoredPool ? null : resolveAmbient(spec.ambientBackground)),
    [authoredPool, spec.ambientBackground],
  );
  const stepIcons = useMemo(() => {
    if (authoredPool && authoredPool.length > 0) return authoredPool;
    const pool = presetAmbient?.icons && presetAmbient.icons.length > 0
      ? presetAmbient.icons
      : STEP_AMBIENT_POOL;
    const out: typeof STEP_AMBIENT_POOL = [];
    for (let i = 0; i < AMBIENT_PER_STEP; i++) {
      out.push(pool[(ambientStep * 2 + i * 3) % pool.length]);
    }
    return out;
  }, [ambientStep, authoredPool, presetAmbient]);

  const stepAccents = useMemo(() => {
    // Authored accents map (string keys → numeric indexes for the renderer).
    if (authored?.accents) {
      const out: Record<number, string> = {};
      for (const [k, v] of Object.entries(authored.accents)) {
        const n = Number(k);
        if (!Number.isNaN(n)) out[n] = v;
      }
      return out;
    }
    // Legacy: brand-color the first 1–2 icons whose component has a default.
    const out: Record<number, string> = {};
    stepIcons.forEach((Icon, i) => {
      const color = ICON_BRAND_COLORS.get(Icon);
      if (color && i < 2) out[i] = color;
    });
    return out;
  }, [stepIcons, authored?.accents]);

  // Spec 44 §4 — slide root is a labelled landmark so screen readers can
  // jump to the timeline as a region and announce its title once.
  const slideAriaLabel = `Step timeline: ${c.title ?? spec.slideName}`;
  return (
    <div
      ref={rootRef}
      role="region"
      aria-label={slideAriaLabel}
      data-wide-stage={wideStage ? 'true' : undefined}
      className="step-timeline-root relative h-full w-full overflow-hidden"
    >
      {/* Layer 0 — ambient icon scatter. JSON-driven when `content.stepAmbient`
          is authored (knobs and/or explicit positions); otherwise the legacy
          seeded scatter that rotates through STEP_AMBIENT_POOL by active step. */}
      <AmbientBackground
        key={`step-ambient-${ambientStep}`}
        seed={`step-${c.title ?? spec.slideName}-${ambientStep}`}
        icons={stepIcons}
        count={authored?.count ?? AMBIENT_PER_STEP}
        opacity={authored?.opacity ?? 0.05}
        drift={authored?.drift ?? 0.5}
        parallax={authored?.parallax ?? 22}
        sizeRange={authored?.sizeRange ?? AMBIENT_SIZE_RANGE}
        accentColors={stepAccents}
        floatIndexes={authored?.floatIndexes}
        glow={authored?.glow}
        explicitPositions={authoredExplicit}
      />

      {/* Layer 1 — ghost step numeral. Cross-fades on every active change,
          stamping the slide bg with a giant "you are here" watermark
          (spec 23 §3). v3.1 — alternates entrance variant (fade / slide
          from right / slide up) so the chain feels varied. */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="sync" initial={false}>
          <motion.span
            key={ghostNumber}
            className="absolute font-display font-black select-none leading-none tabular-nums"
            style={{
              /* Spec 32 §3a — anchor behind the right column instead of
                 bleeding off-canvas. `right` accounts for the 12.5%
                 symmetric margin so the numeral sits visually behind the
                 detail panel area. */
              right: 'max(2vw, calc((100vw - 1440px) / 2 + 1rem))',
              top: '22vh',
              fontSize: 'clamp(18rem, 30vw, 36rem)',
              color: 'hsl(var(--gold) / 0.045)',
              letterSpacing: '-0.06em',
            }}
            initial={ghostInitial}
            animate={ghostAnimate}
            exit={ghostExit}
            transition={
              reduced
                ? { duration: 0.15 }
                : {
                    opacity: { duration: 1.2, ease: [0.19, 1, 0.22, 1] },
                    x:       { duration: 1.2, ease: [0.19, 1, 0.22, 1] },
                    y:       { duration: 1.2, ease: [0.19, 1, 0.22, 1] },
                  }
            }
          >
            {ghostNumber}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Layer 2 — actual slide content. v0.36: outer padding aligned to
          BrandHeader logo edge (`px-10`) so eyebrow/title/step-1 share
          the same left sight line as the logo. v0.38: `step-timeline-content`
          marker class lets `:fullscreen` rules in index.css push the
          column down + widen padding when the browser enters fullscreen
          (no React state needed — see spec 31 §2). */}
      {/* v0.68 — header-anchored master container by default. The user's
          repeated complaint was specifically that Slide 3's body starts too
          far right versus the RiseupAsia logo. We keep the 1440px max cap,
          but the default left edge now follows the logo line instead of a
          centered 75% viewport gutter. */}
      <div
        className="step-timeline-content relative z-10 flex h-full flex-col justify-start w-[75%] max-w-[1440px] pb-16"
        style={{
          // Spec 34 — alignment toggle. `--body-grid-margin-{left,right}`
          // are stamped on <html> by `applyPresetSettings`. Default values
          // (`auto`/`auto`) center the column; `header-anchored` mode
          // anchors the left edge to the BrandHeader logo's x while still
          // letting the column breathe with `auto` on the right.
          marginLeft: 'var(--body-grid-margin-left, auto)',
          marginRight: 'var(--body-grid-margin-right, auto)',
          // v0.207 — VERTICAL chrome inheritance. Replaces the previous
          // hardcoded `pt-24 lg:pt-28` on this element so the eyebrow,
          // title, AND every step row/chip/connector below them slide
          // down in lockstep whenever the user adjusts the brand chrome
          // height (or pixelSnap rounds it to an integer). Falls back to
          // the historical 116px when the var hasn't been stamped yet
          // (e.g. SSR snapshot, isolated unit test).
          paddingTop: 'var(--brand-inset-y, 116px)',
        }}
      >
      {(() => {
        // v0.85 — JSON-driven header offset. `content.headerOffsetPx`
        // shifts ONLY the eyebrow + title (not the steps below). Clamped
        // to [-160, +160]. Spec 40 §"Header offset".
        // v0.144 — companion `content.topOffsetPx` does the same thing on
        // the vertical axis. Combined into one transform so a slide can
        // nudge the header in both directions without nested wrappers.
        const rawOffset = c.headerOffsetPx ?? 0;
        const headerOffset = Math.max(-160, Math.min(160, rawOffset));
        const slideTopOffset = resolveSlideTopOffset(c);
        const transformParts: string[] = [];
        if (headerOffset !== 0) transformParts.push(`translateX(${headerOffset}px)`);
        if (slideTopOffset !== 0) transformParts.push(`translateY(${slideTopOffset}px)`);
        // v0.210 — global StepTimeline shift slider in /settings. Stamped as a
        // CSS var so it composes with per-slide offsets above without React
        // having to re-read storage on every render. Always appended (even when
        // the var is "0px") so the transform recomputes when the slider moves.
        transformParts.push('translateX(var(--step-timeline-shift-x, 0px))');
        const headerStyle = transformParts.length > 0
          ? { transform: transformParts.join(' ') }
          : undefined;
        return (
          <div
            className="step-timeline-header"
            data-header-offset={headerOffset || undefined}
            data-top-offset={slideTopOffset || undefined}
            style={headerStyle}
          >
            {c.eyebrow && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="slide-eyebrow mb-3"
                data-debug-token="eyebrow"
                data-debug-class="slide-eyebrow"
              >
                {c.eyebrow}
              </motion.span>
            )}
            {c.title && (
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className={`slide-title-content mb-12 ${titleClassFor(spec)}`}
                style={{ color: 'hsl(var(--white))' }}
                data-debug-token="title"
                data-debug-class={`inline: hsl(var(--white)) · ${titleClassFor(spec)}`}
              >
                {c.title}
              </motion.h2>
            )}
          </div>
        );
      })()}

      {/* Discreet autoplay control — no full progress-bar banner. Just a
          tiny "Step N / M" counter and the icon-only Play/Pause button so
          the slide reads as content, not a dashboard. */}
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-6 flex items-center gap-3"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={() => setAutoplay((a) => !a)}
            aria-label={autoplay ? 'Pause autoplay' : 'Play autoplay'}
            aria-pressed={autoplay}
            className={`inline-flex items-center justify-center h-7 w-7 rounded-full border transition ${
              autoplay
                ? 'bg-gold/15 border-gold/50 text-gold hover:bg-gold/25'
                : 'bg-transparent border-foreground/25 text-foreground/65 hover:text-foreground hover:border-foreground/55'
            }`}
          >
            {autoplay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 translate-x-[1px]" />}
          </button>

          {/* v0.62 — Step progress pill. Tracks `focusedIndex` so hover
              previews update the readout too (autoplay + click already
              feed `active`, which feeds `focusedIndex`). The current
              number swaps with a tiny vertical flip so the change is
              visible without distracting from the slide content. */}
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 backdrop-blur-sm"
            role="status"
            aria-label={`Step ${focusedIndex + 1} of ${total}`}
          >
            <span className="text-[10px] font-semibold tracking-[0.28em] uppercase text-gold/80">
              Step
            </span>
            <span className="relative inline-flex items-baseline tabular-nums text-[12px] font-bold text-gold leading-none min-w-[1.4em] justify-center overflow-hidden h-[1em]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={focusedIndex}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                >
                  {String(focusedIndex + 1).padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-[11px] font-medium text-foreground/40">of</span>
            <span className="text-[12px] font-bold tabular-nums text-foreground/65 leading-none">
              {String(total).padStart(2, '0')}
            </span>
          </div>
        </motion.div>
      )}

      {/* Two-column layout: timeline left, description tucked beside the
          chain (v0.36 — pulled in from the far right so it reads as the
          step's own explanation, not a separate panel). v0.38 marker
          `step-timeline-grid` lets `:fullscreen` widen the gap. */}
      <div className="step-timeline-grid grid grid-cols-1 lg:grid-cols-[minmax(0,560fr)_minmax(0,800fr)] gap-10 xl:gap-14 items-center">
        {/* LEFT — timeline. */}
        <div className="relative min-w-0">
          {/* Base connector (dim) */}
          <motion.div
            initial={{ scaleY: reduced ? 1 : 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top' }}
            className="absolute left-[14px] top-2 bottom-2 w-px bg-gold/20"
            data-timeline-rail="true"
          />
          {/* Active connector — fills to the active step's chip */}
          {total > 1 && (
            <motion.div
              className="absolute left-[14px] top-2 w-px bg-gold shadow-[0_0_8px_hsl(var(--gold)/0.6)]"
              initial={{ height: 0 }}
              animate={{
                height:
                  active < 0 ? 0 : `calc(${(active / (total - 1)) * 100}% * ${(total - 1) / total} + ${active * 28}px)`,
              }}
              style={{ transformOrigin: 'top' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          )}

          {/*
            Hover-preview connector (spec: timeline-style hover).
            Fills toward the hovered step independently of `active`, painted
            in a softer cream/gold so it reads as a *preview* without erasing
            the canonical active fill underneath. Hidden when nothing is
            hovered or when the user is hovering the already-active row
            (no need to double-paint the same height). Honours
            `prefers-reduced-motion` by snapping instead of animating.
           */}
          {total > 1 && (
            <motion.div
              aria-hidden="true"
              className="absolute left-[14px] top-2 w-px bg-cream/55 shadow-[0_0_6px_hsl(var(--cream)/0.35)] pointer-events-none"
              initial={false}
              animate={{
                height:
                  hoveredIndex == null || hoveredIndex === active
                    ? 0
                    : `calc(${(hoveredIndex / (total - 1)) * 100}% * ${(total - 1) / total} + ${hoveredIndex * 28}px)`,
                opacity: hoveredIndex == null || hoveredIndex === active ? 0 : 1,
              }}
              style={{ transformOrigin: 'top' }}
              transition={reduced
                ? { duration: 0 }
                : { height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.18 } }}
              data-timeline-hover-rail="true"
            />
          )}

          {/* Spec 44 §4 — list semantics so AT enumerates "N of M" per row. */}
          <div role="list" aria-label="Steps" className="space-y-4 lg:space-y-6">
            {steps.map((s, i) => {
              const isActive = i === active;
              const isHovered = i === hoveredIndex;
              const isComplete = active >= 0 && i < active;
              const referenceIdx = active < 0 ? 0 : active;
              const dist = Math.abs(i - referenceIdx);
              const stateAttr: 'active' | 'adjacent' | 'far' =
                dist === 0 ? 'active' : dist === 1 ? 'adjacent' : 'far';
              // v0.84 — "Step timeline reveal" mode. Originally locked to
              // `leftOffsetPx > 0` so a snap-aligned row would visually "land"
              // onto its guide instead of just fading in.
              //
              // v0.122 — `revealMode` per step decouples the SHAPE of the
              // entrance from snap offsets. Authors can now pick from:
              //   • 'fade'         — opacity only, no movement.
              //   • 'slide'        — legacy x:-24→0 + fade.
              //   • 'pushLeft'     — mirror; enters from the right (x:+24→0).
              //   • 'timelineLand' — the cinematic 1.1s lands-onto-guide
              //                       slide, regardless of `leftOffsetPx`.
              //
              // Backwards-compatible default chain when `revealMode` is
              // unset: `leftOffsetPx > 0` ⇒ 'timelineLand', else 'slide'.
              // Slide-level `content.stepTiming` and per-step `step.enter`
              // still own the TEMPO (duration / delay / easing) for fade /
              // slide / pushLeft. timelineLand pins its own 1.1s expo-out
              // because it's a behavioural choice, not a tempo override.
              // Spec: spec/slides/53-step-reveal-mode.md.
              const offsetPx = Math.min(80, Math.max(0, s.leftOffsetPx ?? 0));
              const rightOffset = Math.min(160, Math.max(0, s.rightOffsetPx ?? 0));
              const topOffset = resolveStepTopOffset(s);
              // v0.211 — Spec 49 snap-reveal short-circuit: when the author
              // pins `step.enter.durationMs = 0` AND has a `leftOffsetPx`
              // snap, suppress the cinematic 1.1s timelineLand and fall
              // through to a flat fade. This lets a deck keep a row's
              // snap-aligned RESTING position without paying the dramatic
              // entrance for that one step.
              const explicitInstantEnter = s.enter?.durationMs === 0;
              const resolvedRevealMode: 'fade' | 'slide' | 'pushLeft' | 'timelineLand' =
                s.revealMode
                  ?? (offsetPx > 0 && !explicitInstantEnter ? 'timelineLand' : 'slide');
              const isTimelineLand = resolvedRevealMode === 'timelineLand';
              const initialX = (() => {
                if (reduced) return 0;
                if (isTimelineLand) return -(Math.max(offsetPx, 24) + 32);
                if (resolvedRevealMode === 'slide') return -24;
                if (resolvedRevealMode === 'pushLeft') return 24;
                return 0; // 'fade' — opacity-only, no horizontal travel
              })();

              // Animation timing. timelineLand still gets its dramatic 1.1s
              // expo-out (behaviour, not tempo). Every other mode resolves
              // through the timing preset chain so the deck author can pick
              // a slide-wide voice and override per-step.
              const legacyStaggerMs = stepRevealDelayMs(c.stepTiming, i);
              // v0.144 — `resolveStepEnter` / `resolveStepExit` now also surface
              // an `offsetPx` field. When the author pinned a motion distance
              // we apply it as a Y offset overlaid on the X reveal so the row
              // travels diagonally with the exact distance the deck specified.
              const resolvedEnter = resolveStepEnter(s, c.stepTiming, legacyStaggerMs);
              const resolvedExit = resolveStepExit(s, c.stepTiming);
              const enterOffsetY = reduced ? 0 : (resolvedEnter.offsetPx ?? 0);
              const exitOffsetY = reduced ? 0 : (resolvedExit.offsetPx ?? 0);
              const enterTiming = isTimelineLand
                ? { duration: reduced ? 0.001 : 1.1, delay: stepRevealDelayMs(c.stepTiming, i) / 1000, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
                : reduced
                  ? { duration: 0.001, delay: 0, ease: 'linear' as const }
                  // Cast: our `EasingValue` (`string | [n,n,n,n]`) is a subset
                  // of Framer's broader `Easing` union; the resolver clamps
                  // numbers and only emits the valid named easings.
                  : { duration: resolvedEnter.duration, delay: resolvedEnter.delay, ease: resolvedEnter.ease as [number, number, number, number] };
              const padStyle: CSSProperties | undefined =
                offsetPx > 0 || rightOffset > 0 || topOffset !== 0
                  ? {
                      paddingLeft: offsetPx > 0 ? `${offsetPx}px` : undefined,
                      paddingRight: rightOffset > 0 ? `${rightOffset}px` : undefined,
                      // translateY preserves the column's natural layout slot
                      // (no neighbour reflow) while visually shifting the row.
                      transform: topOffset !== 0 ? `translateY(${topOffset}px)` : undefined,
                    }
                  : undefined;
              const hasReveal = Boolean(s.expand) || typeof s.revealSlide === 'number';
              return (
                <motion.div
                  key={i}
                  ref={(el) => { stepRefs.current[i] = el; }}
                  // v0.160 — `layoutId` removed even on `expand` steps. The
                  // shared-layout morph was intercepting the bubble + text-
                  // slide entrance and making `expand`-bearing steps animate
                  // visibly differently from non-expand siblings (steps 1-2 vs
                  // 3-4 in the showcase deck). The inline-expand panel uses
                  // its own `<motion.div>` mount via SlideStage and never
                  // depended on the shared layoutId for correctness.
                  role="listitem"
                  aria-setsize={total}
                  aria-posinset={i + 1}
                  initial={{ opacity: 0, x: initialX, y: enterOffsetY }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={exitOffsetY !== 0 ? { opacity: 0, y: exitOffsetY } : undefined}
                  transition={enterTiming}
                  onMouseEnter={() => { setHoveredIndex(i); setLastInteraction('hover'); }}
                  onMouseLeave={() => setHoveredIndex((h) => (h === i ? null : h))}
                  className={`step-row${isTimelineLand ? ' step-row--snap-reveal' : ''}`}
                  data-state={stateAttr}
                  // v1.3 — alternating entrance variant per step index
                  // (lift → slide → parallax → …). CSS in index.css picks
                  // up the matching keyframe under
                  // `.step-row[data-motion-variant="…"][data-state="active"]`.
                  // Reduced-motion override in the same file kills all
                  // three so the rotation is a no-op for those users.
                  data-motion-variant={stepMotionVariant(i)}
                  data-reveal-mode={resolvedRevealMode}
                  data-snap-reveal={isTimelineLand ? 'true' : undefined}
                  data-right-offset={rightOffset || undefined}
                  data-top-offset={topOffset || undefined}
                  data-enter-offset={enterOffsetY || undefined}
                  data-exit-offset={exitOffsetY || undefined}
                  data-has-reveal={hasReveal ? 'true' : undefined}
                  style={padStyle}
                >
                  <button
                    type="button"
                    onClick={() => handleStepClick(i)}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={
                      hasReveal
                        ? `Step ${i + 1} of ${total}: ${s.title} — focus, then open details`
                        : `Step ${i + 1} of ${total}: ${s.title}`
                    }
                    className="flex items-start gap-6 text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink bg-transparent rounded-md"
                  >
                    {/* v0.121 — uniform per-step animation. The previous
                        `(hasLeftInitialStep || i !== 0)` guard suppressed
                        the bubble + text-slide reveal on step 1's FIRST
                        activation (to avoid a "double-fire" against the row
                        entrance stagger). Side-effect: steps 1 and 2
                        looked visually different from steps 3 and 4 because
                        step 1's chip never bubbled and step 2's chip
                        bubbled into a slot that step 1 had already settled
                        into. Per the user "first/second animation is
                        wrong, third/fourth is correct — make them match",
                        we now key purely on `isActive` so every step gets
                        an identical bubble + text-slide entrance the first
                        time it becomes the active row. The whoosh
                        double-fire concern is already handled separately
                        by `skippedInitialFocusSound` in the focus-cue
                        effect (line ~237). */}
                    <div
                      key={isActive ? `active-${i}-${active}` : `chip-idle-${i}`}
                      className={[
                        'relative z-10 -mt-1 rounded-full flex items-center justify-center font-display font-bold transition-all duration-300 shrink-0',
                        isActive
                          ? 'h-9 w-9 text-sm bg-gold text-ink step-badge-bubble step-badge-radiate'
                          : isComplete
                            ? 'h-7 w-7 text-xs bg-gold/30 text-gold border border-gold/50'
                            : 'h-7 w-7 text-xs bg-transparent text-gold/50 border border-gold/30',
                      ].join(' ')}
                    >
                      {isComplete ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                    </div>

                    <div
                      key={isActive ? `text-active-${i}-${active}` : `text-idle-${i}`}
                      className={`flex-1 min-w-0 pb-2 ${isActive ? 'step-text-slide' : ''}`}
                    >
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <span
                          className={`text-xs uppercase tracking-[0.3em] transition-colors duration-300 ${
                            isActive ? 'text-gold' : 'text-gold/60'
                          }`}
                          data-debug-token="step-label"
                          data-debug-class={isActive ? 'text-gold' : 'text-gold/60'}
                        >
                          {s.label}
                        </span>
                        {s.capsule && (
                          // Capsule fades in when the row is active OR hovered
                          // (timeline-style hover spec). Mounted always so the
                          // layout doesn't shift; opacity + 4px lift drive the
                          // reveal. Reduced motion → instant.
                          <motion.span
                            initial={false}
                            animate={{
                              opacity: isActive || isHovered ? 1 : 0,
                              y: isActive || isHovered ? 0 : 4,
                            }}
                            transition={reduced ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="inline-flex"
                            data-capsule-state={isActive ? 'active' : isHovered ? 'hover' : 'idle'}
                          >
                            <Capsule spec={s.capsule} size="sm" />
                          </motion.span>
                        )}
                      </div>
                      <h3
                        className="step-title font-display font-bold leading-[1.05] inline-flex items-center gap-2"
                        data-debug-token={isActive ? 'step-title (active)' : 'step-title'}
                        data-debug-class=".step-title (CSS — color: hsl(var(--foreground)) ✓ themed)"
                      >
                        {s.title}
                        {/* v0.160 — ArrowUpRight icon removed. It was emitted
                            only on steps with `expand` / `revealSlide`, making
                            those steps look visually inconsistent with their
                            non-reveal siblings (steps 1-2 vs 3-4 in the
                            showcase deck). The click-reveal contract is still
                            announced via `data-has-reveal` + the aria-label
                            "focus, then open details", and reveal interactions
                            still fire from the row click. */}
                      </h3>
                      {s.subtitle && isActive && (
                        <p
                          className="text-foreground/70 text-lg mt-2"
                          data-debug-token="step-subtitle"
                          data-debug-class="text-foreground/70"
                        >
                          {s.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — description side panel.
            ONE panel for the whole slide, keyed by `focusedIndex`. v0.36 —
            pulled left with `lg:pl-4` so it sits inside the timeline's
            gold rule, and timing tightened to a 1.0s slide so the right
            description and the active chain row land together. */}
        <div
          className="step-detail-panel min-w-0 lg:sticky lg:top-32 lg:pl-4"
          aria-live="polite"
          aria-atomic="true"
          aria-label={focusedStep ? `Step ${focusedIndex + 1} detail` : undefined}
        >
          {/* v0.59 — distinct interaction-aware transitions:
                • CLICK   → punchy "premium snap": fast 320ms slide-up + scale
                  spring with overshoot, blur clears in 180ms. Feels immediate.
                • HOVER   → quick 240ms cross-fade, no travel — preview only.
                • AUTO    → cinematic 1.0s expo slide (the original v0.36 feel).
              The `key` includes `lastInteraction` so AnimatePresence treats
              every click as a fresh enter even when re-clicking the same row. */}
          <AnimatePresence mode="wait" initial={false}>
            {focusedStep && (
              <motion.div
                key={`${focusedIndex}-${lastInteraction}`}
                initial={
                  reduced
                    ? { opacity: 0 }
                    : lastInteraction === 'click'
                      ? { opacity: 0, y: 22, scale: 0.985, filter: 'blur(4px)' }
                      : lastInteraction === 'hover'
                        ? { opacity: 0, x: -16, filter: 'blur(2px)' }
                        : { opacity: 0, x: slideInDist, y: 14, filter: 'blur(6px)' }
                }
                animate={
                  reduced
                    ? { opacity: 1 }
                    : { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }
                }
                exit={
                  reduced
                    ? { opacity: 0 }
                    : lastInteraction === 'click'
                      ? { opacity: 0, y: -14, scale: 0.99, filter: 'blur(3px)' }
                      : lastInteraction === 'hover'
                        ? { opacity: 0, x: 12, filter: 'blur(2px)' }
                        : { opacity: 0, x: slideOutDist, y: 12, filter: 'blur(4px)' }
                }
                transition={
                  reduced
                    ? { duration: 0.15 }
                    : lastInteraction === 'click'
                      ? {
                          // Premium snap — overshoot spring on y+scale, fast
                          // blur clear, opacity rides the spring tail.
                          y:       { type: 'spring', stiffness: 420, damping: 30, mass: 0.7 },
                          scale:   { type: 'spring', stiffness: 420, damping: 28, mass: 0.7 },
                          opacity: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                          filter:  { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
                        }
                      : lastInteraction === 'hover'
                        ? {
                            // Light cross-fade preview, no spring weight.
                            x:       { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                            filter:  { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
                          }
                        : {
                            // AUTO — the original v0.36 cinematic feel.
                            y: { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 },
                            x:       { duration: 1.0, ease: [0.19, 1, 0.22, 1] },
                            opacity: { duration: 1.0, ease: [0.19, 1, 0.22, 1] },
                            filter:  { duration: 0.7, ease: [0.19, 1, 0.22, 1] },
                          }
                }
                className="relative"
              >
                {/* eyebrow — v3: pure white, no longer gold (the small gold
                    pill above each step row in the timeline already owns the
                    gold STEP-NN signal). */}
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduced ? 0 : 0.05, duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                  className="text-[12px] font-semibold uppercase tracking-[0.32em] text-[hsl(var(--white))]"
                  data-debug-token="panel-eyebrow"
                  data-debug-class="text-[hsl(var(--white))]"
                >
                  Step {String(focusedIndex + 1).padStart(2, '0')} — {focusedStep.title}
                </motion.div>
                {/* gold rule grows from 0 to 56px */}
                <motion.div
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: 56 }}
                  transition={{ delay: reduced ? 0 : 0.18, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
                  className="h-[2px] bg-gold mt-3 mb-6"
                />
                {focusedStep.description && (
                  <motion.p
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduced ? 0 : 0.28, duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
                    className="text-foreground text-xl md:text-2xl leading-relaxed max-w-prose"
                    data-debug-token="panel-body"
                    data-debug-class="text-foreground"
                  >
                    {toDescriptionString(focusedStep.description)}
                  </motion.p>
                )}
                {focusedStep.capsule && (
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduced ? 0 : 0.26, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-6"
                  >
                    <Capsule spec={focusedStep.capsule} size="md" />
                  </motion.div>
                )}
                {focusedStep.cta && (
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduced ? 0 : 0.38, duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                    className="mt-8"
                  >
                    <button
                      type="button"
                      onClick={() => handleCtaClick(focusedStep.cta!)}
                      className={[
                        'group inline-flex items-center gap-2 rounded-full px-5 py-2.5',
                        'text-sm font-semibold tracking-wide transition-all duration-300',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        (focusedStep.cta.variant ?? 'gold') === 'gold'
                          ? 'bg-gold text-ink hover:bg-gold/90 hover:shadow-[0_8px_24px_-8px_hsl(var(--gold)/0.55)] hover:-translate-y-[1px]'
                          : 'bg-transparent border border-gold/50 text-gold hover:bg-gold/10 hover:border-gold/80 hover:-translate-y-[1px]',
                      ].join(' ')}
                    >
                      <span>{focusedStep.cta.text}</span>
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
                    </button>
                  </motion.div>
                )}
                {/* Spec 26 — auto-rendered click-reveal pill. Appears when the
                    step opts into a reveal/expand trigger AND the author hasn't
                    already supplied an explicit `step.cta`. Keeps the affordance
                    discoverable without requiring extra JSON. */}
                {!focusedStep.cta && (focusedStep.expand || typeof focusedStep.revealSlide === 'number') && (
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduced ? 0 : 0.38, duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                    className="mt-8"
                  >
                    <button
                      type="button"
                      onClick={() => fireStepReveal(focusedStep, focusedIndex)}
                      className={[
                        'group inline-flex items-center gap-2 rounded-full px-5 py-2.5',
                        'text-sm font-semibold tracking-wide transition-all duration-300',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        'bg-gold text-ink hover:bg-gold/90 hover:shadow-[0_8px_24px_-8px_hsl(var(--gold)/0.55)] hover:-translate-y-[1px]',
                      ].join(' ')}
                    >
                      <span>
                        {focusedStep.revealLabel ??
                          (focusedStep.expand ? 'Open details' : 'Open step page')}
                      </span>
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
      {/* Debug-only: visualize which CSS color tokens each annotated text
          element resolves to. Activated via `?colorDebug=1`. The overlay
          itself is null when disabled, so this stays free in production. */}
      <ColorTokenDebugOverlay targetRef={rootRef} enabled={colorDebugOn} />
    </div>
  );
});
