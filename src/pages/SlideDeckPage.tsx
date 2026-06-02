import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { allSlides, deck, findBySlideNumber, findLinearIndex, linearSlides } from '@/slides/loader';
import { SlideStage } from '@/slides/SlideStage';
import { FitStage } from '@/slides/components/FitStage';
import { ControllerBar } from '@/slides/controls/ControllerBar';
import { PresenterWebcamOverlay } from '@/slides/components/PresenterWebcamOverlay';
import { usePresenterWebcam } from '@/slides/components/usePresenterWebcam';
import { SlidePreview } from '@/slides/components/SlidePreview';
import { ShortcutHint, isShortcutHintDismissed, markShortcutHintSeen } from '@/slides/controls/ShortcutHint';
import { GridOverview } from '@/slides/controls/GridOverview';
import { SlideNumberBadge } from '@/slides/controls/SlideNumberBadge';
import { TopSlideJumper } from '@/slides/controls/TopSlideJumper';
import { PresenterTopBar } from '@/slides/controls/PresenterTopBar';
import { DotPagination } from '@/slides/controls/DotPagination';
import { AnimationScrubber } from '@/slides/controls/AnimationScrubber';
import { TransitionInspector } from '@/slides/controls/TransitionInspector';
import { ThumbnailStrip } from '@/slides/controls/ThumbnailStrip';
import { SlideTocSidebar } from '@/slides/controls/SlideTocSidebar';
import { getPresetSettings, mergeDeckTiming, resolveDeckTransitionOverride, subscribePresetSettings } from '@/slides/presetSettings';
import { getChannel, handleSyncMessage, isSyncMessage, type SyncMessage } from '@/slides/sync';
import type { Direction } from '@/slides/transitions';
import type { FocusTimelineHandle } from '@/slides/hooks/useFocusTimeline';
import { slideSound } from '@/slides/sound';
import { resetScrubState } from '@/slides/scrubOverride';
import { getTransitionOverrideState, resetTransitionOverrideState } from '@/slides/transitionOverride';
import { recordEvent } from '@/slides/analytics/recorder';
import { toast } from 'sonner';
import { pushJumpHistory } from '@/slides/jumpHistory';

export default function SlideDeckPage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // v0.230 — webcam ctx for plain `i` (hard on/off) and `m` (minimize).
  const webcam = usePresenterWebcam();
  const slideParam = params.slideNumber;
  const slideQuery = new URLSearchParams(location.search).get('slide');
  const rawRequested = slideParam ?? slideQuery ?? '1';
  const requested = parseInt(rawRequested, 10);
  const initial = Number.isNaN(requested) ? 1 : requested;
  // v0.124 — `?scrub=1` opens the in-deck animation scrubber on first paint.
  // Also exposed as a keyboard shortcut (Shift+S) so authors can flip it on
  // mid-walk-through. Closing the scrubber clears every override.
  const [scrubberOpen, setScrubberOpen] = useState<boolean>(() =>
    new URLSearchParams(location.search).get('scrub') === '1',
  );
  // v0.182 — `?inspect=transition` (or `Shift+R`) opens the live slide-
  // transition inspector. Closing it clears every duration/easing override.
  const [transitionInspectorOpen, setTransitionInspectorOpen] = useState<boolean>(() =>
    new URLSearchParams(location.search).get('inspect') === 'transition',
  );
  // Bumping this remounts the active slide so the entrance transition
  // replays — drives the inspector's "Replay" button.
  const [replayNonce, setReplayNonce] = useState(0);

  const [current, setCurrent] = useState<number>(initial);
  const [direction, setDirection] = useState<Direction>('forward');
  const [controllerVisible, setControllerVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  /** Bottom thumbnail strip — opt-in, persisted in localStorage. Toggleable
   *  with the `T` keyboard shortcut and the strip's own toggle pill. */
  const [thumbStripOpen, setThumbStripOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('riseup.thumbStrip') === '1';
  });
  /** Persistent presenter setting — when on, click-reveal capsules pulse so
   *  they're visible at a glance during a live walkthrough. */
  const [revealHints, setRevealHints] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('riseup.revealHints') === '1';
  });
  /** Persistent presenter setting (v0.152) — when on, the top-center
   *  "NN / NN" jumper chip is hidden for a clean fullscreen stage.
   *  Toggle via the controller's PanelTop button or the `J` shortcut. */
  const [topJumperHidden, setTopJumperHidden] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    // One-time migration (2026-05-06): the default flipped from visible →
    // hidden per spec 65 §2 + updates/spec/17. Users who had the previous
    // default-visible state never wrote a localStorage key, but anyone who
    // had toggled the chip ON in the previous regime carried `'0'` forward,
    // which now contradicts the spec default. We reset that legacy `'0'`
    // exactly once, marked by `riseup.topJumperHidden.migrated.v1`. Users
    // who *intentionally* opt-in via `J` after this point will write `'0'`
    // again and the marker keeps us from migrating a second time.
    try {
      const migrated = window.localStorage.getItem('riseup.topJumperHidden.migrated.v1');
      if (migrated !== '1') {
        window.localStorage.removeItem('riseup.topJumperHidden');
        window.localStorage.setItem('riseup.topJumperHidden.migrated.v1', '1');
      }
    } catch { /* ignore quota / disabled storage */ }
    // Default: hidden. Explicit '0' (user chose to show) overrides; any other
    // value — missing key, '1', legacy strings — collapses to hidden.
    const stored = window.localStorage.getItem('riseup.topJumperHidden');
    return stored !== '0';
  });
  /** Persistent presenter setting — searchable left-edge slide TOC.
   *  Toggle via `Ctrl+1` / `⌘+1` (the previous `O` binding was retired
   *  on 2026-05-02 — `O` now toggles the webcam circle shape).
   *  Default: closed so the slide stage stays uncluttered. */
  const [tocOpen, setTocOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('riseup.tocSidebar') === '1';
  });
  /** v5 (2026-05-02) — small auto-fading hints that surface the two
   *  rebound shortcuts (Ctrl+1 → TOC, O → webcam shape) once each per
   *  browser. The component handles its own auto-hide; we only flip
   *  these flags from `false` to `true` when the trigger condition
   *  fires. Pressing the bound key elsewhere short-circuits the
   *  trigger via `markShortcutHintSeen()`. */
  const [tocHintOpen, setTocHintOpen] = useState<boolean>(false);
  const [shapeHintOpen, setShapeHintOpen] = useState<boolean>(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Quick-jump number buffer — typing digits accumulates a slide number and
   * `Enter` jumps. `Escape` or 1.6s of inactivity clears the buffer. Lets
   * the presenter type "12⏎" mid-talk without opening the slide indicator
   * input. Capped at 4 digits — total deck < 10k slides forever.
   */
  const [jumpBuffer, setJumpBuffer] = useState<string>('');
  const [jumpRejected, setJumpRejected] = useState<null | 'zero' | 'range'>(null);
  const jumpRejectedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashJumpRejected = useCallback((reason: 'zero' | 'range') => {
    if (jumpRejectedTimerRef.current) clearTimeout(jumpRejectedTimerRef.current);
    setJumpRejected(reason);
    jumpRejectedTimerRef.current = setTimeout(() => setJumpRejected(null), 1400);
  }, []);
  /** Transient flag set for ~450 ms when Enter commits a valid in-range
   *  slide. Drives the `.animate-jump-confirm` pulse on the live
   *  thumbnail preview so the presenter sees a confirmation beat before
   *  the deck transitions away. */
  const [jumpConfirmed, setJumpConfirmed] = useState<boolean>(false);
  const jumpConfirmedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashJumpConfirmed = useCallback(() => {
    if (jumpConfirmedTimerRef.current) clearTimeout(jumpConfirmedTimerRef.current);
    setJumpConfirmed(true);
    jumpConfirmedTimerRef.current = setTimeout(() => setJumpConfirmed(false), 480);
  }, []);
  const jumpClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Subscribe to PresetSettings so toggling /settings live-updates without
   *  a page reload (currently powers the dot pagination opt-in). */
  const [showDots, setShowDots] = useState<boolean>(() => getPresetSettings().showDotPagination);
  // v0.167 — live deck-wide transition timing override (merged with deck JSON
  // before being handed to <SlideStage />). Re-derived on every preset
  // change so dragging the duration slider updates the next transition.
  const [deckTransitionTiming, setDeckTransitionTiming] = useState(() => mergeDeckTiming(deck.transitionTiming, resolveDeckTransitionOverride(getPresetSettings())));
  useEffect(() => subscribePresetSettings(() => {
    setShowDots(getPresetSettings().showDotPagination);
    setDeckTransitionTiming(mergeDeckTiming(deck.transitionTiming, resolveDeckTransitionOverride(getPresetSettings())));
  }), []);
  /** Imperative handle for slides that consume Next/Prev internally
   *  (currently only `FocusTimelineSlide`). The deck calls
   *  `focusRef.current?.tryAdvance(dir)` first; only when it returns `false`
   *  (chain boundary) does the deck navigate to a sibling slide. */
  const focusRef = useRef<FocusTimelineHandle | null>(null);
  // 2026-05-02 — Debounce window for the `O` webcam shape toggle. Holding the
  // key (auto-repeat) or rapid double-taps would otherwise flicker between
  // circle/rectangle. 250ms is below human double-tap intent but above the
  // OS auto-repeat interval (~30ms), so a deliberate second press still works.
  const shapeToggleLastRef = useRef<number>(0);

  /* ──────────────────────────────────────────────────────────────────
   * Analytics instrumentation (Window-2 task 24).
   * No-op when `isAnalyticsEnabled()` is false (the recorder gates
   * `recordEvent` itself, so the deck never branches on the flag).
   * Three loops:
   *   1. session-start once per mount + session-end on beforeunload.
   *   2. slide-enter on every `current` change; cleanup logs slide-exit
   *      with dwellMs = (now - enter time).
   *   3. recordEvent('click-reveal', …) is fired by ClickRevealExpandPanel
   *      when a capsule/hotspot opens (see that component).
   * ────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    recordEvent('session-start', current, { deckSlug: deck.deckSlug });
    const onBeforeUnload = () => recordEvent('session-end', current);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      // The component is unmounting — treat it like the tab closing
      // so the timeline always has a session-end bookend.
      recordEvent('session-end', current);
    };
    // Intentionally one-shot — we DON'T want a new session row every
    // time `current` flips. The slide-level effect below tracks that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ──────────────────────────────────────────────────────────────────
   * Shortcut discovery hints (v5, 2026-05-02).
   * Fire AT MOST ONCE per browser per kind. Both hints are gated on
   * `isShortcutHintDismissed()` so a user who has used the binding
   * (or clicked ✕) never sees them again.
   *
   *   • TOC hint:   1.4s after first mount, only if the deck has more
   *                 than 4 slides (tiny decks don't need an outline).
   *   • Shape hint: when the camera phase first becomes `'on'`. Other
   *                 phases (`requesting`, `tray`, `denied`) are ignored.
   * ────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isShortcutHintDismissed('toc')) return;
    if (linearSlides.length <= 4) return;
    const t = window.setTimeout(() => setTocHintOpen(true), 1400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (webcam.state.phase !== 'on') return;
    if (isShortcutHintDismissed('shape')) return;
    setShapeHintOpen(true);
  }, [webcam.state.phase]);

  useEffect(() => {
    const enteredAt = Date.now();
    // Resolve slideType at enter+exit so the analytics roll-up can group by
    // type without re-loading the deck. We deliberately re-read on exit
    // (rather than capturing once) so a hot-edited slide type is reported
    // accurately at the moment the dwell ends.
    const enterType = findBySlideNumber(current)?.slideType;
    recordEvent('slide-enter', current, enterType ? { slideType: enterType } : undefined);
    return () => {
      const exitType = findBySlideNumber(current)?.slideType ?? enterType;
      recordEvent('slide-exit', current, {
        dwellMs: Date.now() - enteredAt,
        ...(exitType ? { slideType: exitType } : {}),
      });
    };
  }, [current]);

  // Confirm to index.html boot watchdog that an actual slide has rendered.
  // Combined with the route-mount beacon and DOM heuristics, this stops
  // false-positive blank-root reports when the deck is healthy.
  useEffect(() => {
    const w = window as unknown as {
      __previewBoot__?: { markSlideRendered?: (id: string) => void };
    };
    w.__previewBoot__?.markSlideRendered?.(String(current));
  }, [current]);


  // Resolve the requested slide; if it's missing OR disabled, fall back to the first active slide.
  const slide = useMemo(() => {
    const found = findBySlideNumber(current);
    if (found && found.enabled !== false) return found;
    return linearSlides[0];
  }, [current]);
  const total = linearSlides.length;
  const linearIdx = findLinearIndex(current);

  const goTo = useCallback((n: number, dir: Direction) => {
    const target = findBySlideNumber(n);
    if (!target || target.enabled === false) return; // never navigate to a disabled slide
    setDirection(dir);
    setCurrent(n);
    // Preserve query string (e.g. `?deck=<slug>`, `?scrub=1`) across navigation
    // so that switching slides on a non-default deck doesn't fall back to the
    // bundled showcase deck on the next page load. v0.149.
    navigate(`/${n}${location.search}`, { replace: false });
  }, [navigate, location.search]);

  const next = useCallback(() => {
    // Focus-timeline slides consume Next internally until the chain ends.
    if (focusRef.current?.tryAdvance('forward')) return;
    slideSound.play('click');
    if (slide.isClickReveal && slide.parentSlide) {
      goTo(slide.parentSlide, 'forward');
      return;
    }
    const idx = findLinearIndex(current);
    const nextSlide = linearSlides[idx + 1];
    if (nextSlide) goTo(nextSlide.slideNumber, 'forward');
  }, [current, slide, goTo]);

  const prev = useCallback(() => {
    if (focusRef.current?.tryAdvance('backward')) return;
    slideSound.play('click');
    if (slide.isClickReveal && slide.parentSlide) {
      goTo(slide.parentSlide, 'backward');
      return;
    }
    const idx = findLinearIndex(current);
    const prevSlide = linearSlides[idx - 1];
    if (prevSlide) goTo(prevSlide.slideNumber, 'backward');
  }, [current, slide, goTo]);

  const jump = useCallback((n: number) => {
    const target = linearSlides[n - 1];
    if (target) {
      slideSound.play('click');
      goTo(target.slideNumber, n > linearIdx + 1 ? 'forward' : 'backward');
    }
  }, [goTo, linearIdx]);

  const onCapsuleClickReveal = useCallback((slideNumber: number) => {
    const target = allSlides.find(s => s.slideNumber === slideNumber);
    if (target && target.enabled !== false) {
      slideSound.play('click');
      goTo(slideNumber, 'forward');
    }
  }, [goTo]);

  /** Whether the active slide exposes any click-reveal entrypoints — drives
   *  the visibility of the "Reveal hints" toggle in the controller. */
  const hasRevealCapsules = useMemo(
    () =>
      Boolean(slide?.content.capsules?.some((c) => c.clickRevealSlide || c.expand)) ||
      Boolean(slide?.content.hotspots?.length) ||
      Boolean(slide?.content.steps?.some((s) => s.expand || typeof s.revealSlide === 'number')),
    [slide],
  );

  const toggleRevealHints = useCallback(() => {
    setRevealHints((prev) => {
      const next = !prev;
      try { window.localStorage.setItem('riseup.revealHints', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }, []);

  /** Toggle the bottom thumbnail strip and persist the choice. Bound to `T`
   *  and to the strip's own header pill. */
  const toggleThumbStrip = useCallback(() => {
    setThumbStripOpen((prev) => {
      const next = !prev;
      try { window.localStorage.setItem('riseup.thumbStrip', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }, []);

  /** Toggle the top-center slide jumper visibility and persist the choice.
   *  Bound to `J` and the controller's PanelTop button. */
  const toggleTopJumper = useCallback(() => {
    setTopJumperHidden((prev) => {
      const next = !prev;
      try { window.localStorage.setItem('riseup.topJumperHidden', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }, []);

  /** Toggle the searchable slide TOC sidebar and persist the choice.
   *  Bound to the `O` shortcut and the sidebar's own header/edge controls. */
  const toggleToc = useCallback(() => {
    setTocOpen((prev) => {
      const next = !prev;
      try { window.localStorage.setItem('riseup.tocSidebar', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }, []);
  // Bindings (resolved here, single source of truth):
  //   Next:  ArrowRight, Enter, Space
  //   Prev:  ArrowLeft, Backspace
  //   Grid:  G
  //   Fullscreen toggle: F          (v0.107 — quick presenter shortcut)
  //   Exit fullscreen: Escape
  //
  // v0.120 — Press-and-hold Enter autoplay
  // ---------------------------------------
  // First Enter press → immediate `next()` (unchanged contract).
  // If Enter is held down past `AUTOPLAY_HOLD_MS` (400ms), an interval starts
  // ticking `next()` every `AUTOPLAY_TICK_MS` (900ms) until Enter is released.
  // Because `next()` already routes through `focusRef.current?.tryAdvance`,
  // a held Enter on a `StepTimelineSlide` / `FocusTimelineSlide` walks each
  // step reveal in turn (with the slide's own fade/slide transitions), then
  // crosses into the next deck slide at the chain boundary — exactly the
  // step-by-step autoplay the user asked for.
  //
  // Browsers fire `keydown` repeatedly while a key is held (OS keyrepeat),
  // but at unpredictable cadences and AFTER an OS-controlled delay. We
  // ignore those repeats (`e.repeat === true`) and drive our own interval
  // so the autoplay rhythm is consistent across platforms and matches the
  // slide transitions instead of the OS keyrepeat rate.
  //
  // Guarded against form controls + contenteditable so Backspace/Enter never
  // hijack typing in the slide-jump input or any future inline editor.
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAutoplayingRef = useRef<boolean>(false);
  // v0.159 — read hold/tick from preset settings (live-updated via the
  // subscription below) so /settings can adjust autoplay rhythm without a
  // reload. Stored in refs so the keydown closure always sees fresh values
  // without re-binding the listener on every settings change.
  const autoplayHoldRef = useRef<number>(getPresetSettings().autoplayHoldMs);
  const autoplayTickRef = useRef<number>(getPresetSettings().autoplayTickMs);
  useEffect(() => {
    return subscribePresetSettings(() => {
      const s = getPresetSettings();
      autoplayHoldRef.current = s.autoplayHoldMs;
      autoplayTickRef.current = s.autoplayTickMs;
    });
  }, []);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) { clearTimeout(autoplayTimerRef.current); autoplayTimerRef.current = null; }
    if (autoplayIntervalRef.current) { clearInterval(autoplayIntervalRef.current); autoplayIntervalRef.current = null; }
    isAutoplayingRef.current = false;
  }, []);

  useEffect(() => {
    if (slide?.slideType === 'StepsChain3DSlide') stopAutoplay();
  }, [slide?.slideType, stopAutoplay]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      const isFormField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable;
      if (isFormField) return;
      // ── TOC sidebar Esc-to-close ─────────────────────────────────
      // If the slide outline sidebar is open, Esc closes it BEFORE any
      // other Esc behaviour (fullscreen exit, jump cancel, etc.) so a
      // stray Esc never lingers. See `mem://features/toc-sidebar`.
      if (e.key === 'Escape' && tocOpen) {
        e.preventDefault();
        setTocOpen(false);
        try { window.localStorage.setItem('riseup.tocSidebar', '0'); } catch { /* ignore */ }
        return;
      }
      // ── Quick-jump number buffer ─────────────────────────────────
      // Type digits to compose a slide number, Enter to jump, Escape to cancel.
      // Backspace removes the last digit; auto-clears after 1.6s of inactivity.
      // Ignored while modifiers are held so it never collides with browser
      // shortcuts (Ctrl+1, ⌘+2 etc).
      //
      // Leading zeros are stripped on insert so `01`, `007`, `0012` all behave
      // as their numeric value (1, 7, 12). A lone `0` is held in the buffer
      // until the next non-zero digit arrives — Enter on `0` alone is a no-op
      // (slides are 1-indexed). The 4-digit cap is applied AFTER stripping
      // so the user can pad freely without losing significant digits.
      const isPlainKey = !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;
      const armJumpClearTimer = () => {
        if (jumpClearTimerRef.current) clearTimeout(jumpClearTimerRef.current);
        jumpClearTimerRef.current = setTimeout(() => setJumpBuffer(''), 1600);
      };
      // Separators that are silently ignored mid-buffer so paste-like inputs
      // such as "0 12", "1,234", or "1.2" still resolve to a clean number.
      // We only swallow the keystroke (preventing browser default) when a
      // jump buffer is already active — otherwise space would block normal
      // shortcuts like ArrowRight=Space=advance.
      const isJumpSeparator = e.key === ' ' || e.key === ',' || e.key === '.';
      if (isPlainKey && /^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setJumpBuffer((b) => {
          const next = b + e.key;
          // Strip leading zeros, but keep a single '0' placeholder when the
          // user has only typed zeros so far (so backspace + visual feedback
          // still feel responsive).
          const stripped = next.replace(/^0+/, '');
          const normalized = stripped.length === 0 ? '0' : stripped;
          return normalized.length > 4 ? normalized.slice(-4) : normalized;
        });
        armJumpClearTimer();
        return;
      }
      if (isPlainKey && isJumpSeparator && jumpBuffer.length > 0) {
        // Eat the separator so it doesn't fire other shortcuts (e.g. Space
        // = advance) while the user is composing a multi-digit number.
        // The buffer itself is unchanged — we just keep the timer alive.
        e.preventDefault();
        armJumpClearTimer();
        return;
      }
      if (jumpBuffer.length > 0 && isPlainKey) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const n = parseInt(jumpBuffer, 10);
          const inRange = Number.isFinite(n) && n >= 1 && n <= linearSlides.length;
          if (inRange) {
            flashJumpConfirmed();
            setJumpBuffer('');
            if (jumpClearTimerRef.current) { clearTimeout(jumpClearTimerRef.current); jumpClearTimerRef.current = null; }
            jump(n);
            pushJumpHistory(n);
          } else if (jumpBuffer === '0' || /^0+$/.test(jumpBuffer)) {
            // Lone zero(s) — explain why nothing happened, keep buffer so the
            // presenter can append more digits (e.g. "0" → "01" → "12").
            flashJumpRejected('zero');
            toast.info('Slides start at 1', {
              description: 'Type a slide number from 1 to ' + linearSlides.length + ', then press Enter.',
              duration: 2200,
            });
            armJumpClearTimer();
          } else {
            // Out of range — also surface a hint so the user isn't confused.
            flashJumpRejected('range');
            toast.error(`No slide ${n}`, {
              description: 'Deck has ' + linearSlides.length + ' slides.',
              duration: 2200,
            });
            setJumpBuffer('');
            if (jumpClearTimerRef.current) { clearTimeout(jumpClearTimerRef.current); jumpClearTimerRef.current = null; }
          }
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setJumpBuffer('');
          if (jumpClearTimerRef.current) { clearTimeout(jumpClearTimerRef.current); jumpClearTimerRef.current = null; }
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          setJumpBuffer((b) => b.slice(0, -1));
          armJumpClearTimer();
          return;
        }
      }
      const isManualOnly3D = slide?.slideType === 'StepsChain3DSlide';
      const isDeckNavKey = e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'Backspace';
      if (isManualOnly3D && e.repeat && isDeckNavKey) { e.preventDefault(); return; }
      if (e.key === 'g' || e.key === 'G') { e.preventDefault(); setGridOpen(v => !v); return; }
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); return; }
      // v0.126 — `T` toggles the bottom thumbnail strip.
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); toggleThumbStrip(); return; }
      // v0.152 — `J` toggles the top-center slide jumper visibility.
      if (e.key === 'j' || e.key === 'J') { e.preventDefault(); toggleTopJumper(); return; }
      // 2026-05-02 — `O` is reserved for the webcam circle/rectangle toggle
      // (see SHORTCUTS table). The TOC sidebar moved to `Ctrl+1` / `⌘+1` to
      // free this key. Note: only fire when the camera is actually on,
      // otherwise `O` is a no-op so it doesn't surprise the presenter.
      if ((e.key === 'o' || e.key === 'O') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        // Ignore OS key-repeat outright — holding `O` should not strobe the shape.
        if (e.repeat) return;
        // Debounce rapid re-presses (250ms window) to prevent double-toggle flicker.
        const now = performance.now();
        if (now - shapeToggleLastRef.current < 250) return;
        shapeToggleLastRef.current = now;
        // User has now used the binding — the discovery hint can stop
        // appearing on future loads (and dismisses one if it's on screen).
        markShortcutHintSeen('shape');
        setShapeHintOpen(false);
        if (webcam.state.phase === 'on' || webcam.state.phase === 'fullscreen' || webcam.state.phase === 'stage') {
          // v6 (2026-06-02) — `O` is now a 3-state shaping cycle:
          // rectangle → circle → circle+overlay(glow) → rectangle.
          webcam.cycleShapeOverlay();
        }
        return;
      }
      // 2026-05-02 — Webcam fullscreen shortcuts (v5).
      //   P  → enterFullscreen (auto-shows camera if off)
      //   [  → exitFullscreen plain (only when phase === 'fullscreen')
      //   ]  → cinematic 3-state cycle (fs→off squish+whoosh, off→on bouncy
      //         fade, on→fs bouncy zoom). See `mem://features/webcam-halo-and-stage`.
      if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        void webcam.enterFullscreen();
        return;
      }
      if (e.key === '[' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (webcam.state.phase === 'fullscreen') webcam.exitFullscreen();
        return;
      }
      if (e.key === ']' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        webcam.runCinematicCycle();
        return;
      }
      // Ctrl+1 / ⌘+1 — toggle the searchable slide outline (TOC sidebar).
      // The `key === '1'` check guards against numpad / non-US layouts that
      // still emit "1" but matters less than catching the modifier.
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key === '1') {
        e.preventDefault();
        markShortcutHintSeen('toc');
        setTocHintOpen(false);
        toggleToc();
        return;
      }
      // v0.124 — Shift+S toggles the animation scrubber overlay.
      if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        setScrubberOpen((v) => { if (v) resetScrubState(); return !v; });
        return;
      }
      // v0.230 — Shift+R toggles the live transition inspector. Moved
      // from Shift+I (now reserved for camera show/hide per user request).
      if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        setTransitionInspectorOpen((v) => {
          if (v && !getTransitionOverrideState().persist) resetTransitionOverrideState();
          return !v;
        });
        return;
      }
      // v0.230 — plain `i` hard-toggles presenter camera on/off.
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        void webcam.toggle();
        return;
      }
      // v0.230 — plain `m` minimizes / expands the camera (only when on).
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        if (webcam.state.phase === 'on') webcam.toggleMinimized();
        return;
      }
      if (gridOpen) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        // Ignore OS keyrepeat — we run our own cadence below.
        if (e.repeat) return;
        // First press fires immediately so a tap still advances one step.
        next();
        if (isManualOnly3D) return;
        // Arm the hold-to-autoplay timer. After autoplayHoldRef.current ms
        // without a keyup, start ticking next() every autoplayTickRef.current ms.
        if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = setTimeout(() => {
          isAutoplayingRef.current = true;
          autoplayIntervalRef.current = setInterval(() => next(), autoplayTickRef.current);
        }, autoplayHoldRef.current);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); prev(); }
      else if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'Enter') stopAutoplay();
    }
    // If the window loses focus mid-hold (alt-tab, OS dialog), cancel autoplay
    // so we don't keep advancing slides while the user is elsewhere.
    function onBlur() { stopAutoplay(); }
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      stopAutoplay();
      if (jumpClearTimerRef.current) { clearTimeout(jumpClearTimerRef.current); jumpClearTimerRef.current = null; }
    };
  }, [next, prev, gridOpen, stopAutoplay, toggleThumbStrip, toggleTopJumper, toggleToc, slide?.slideType, webcam, jump, jumpBuffer, flashJumpRejected, flashJumpConfirmed, tocOpen]);

  // v0.190 — Touch double-tap navigation. Mirrors the Enter/Arrow keyboard
  // contract on touch devices so click-reveal slides (and every other slide)
  // advance with the same gesture everywhere. Single taps are NEVER consumed
  // here so capsules, hotspots, the controller, and the back-badge keep
  // their native onClick behavior. A double-tap on the right half goes
  // forward; left half goes back. Interactive targets (button/a/input/
  // [role=button]/contenteditable) are skipped so a quick double-press on a
  // capsule reveals it twice instead of jumping slides.
  useEffect(() => {
    const DOUBLE_TAP_MS = 350;
    const DOUBLE_TAP_PX = 40;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    function isInteractiveTarget(el: EventTarget | null): boolean {
      const node = el as HTMLElement | null;
      if (!node || !node.closest) return false;
      if (node.closest('button, a, input, textarea, select, [role="button"], [role="link"], [contenteditable="true"]')) return true;
      // Skip taps that land inside the controller, jumper, TOC, scrubber,
      // grid, or any other overlay panel — they own their own gestures.
      if (node.closest('[data-deck-overlay], [data-controller], [data-no-deck-tap]')) return true;
      return false;
    }

    function onTouchEnd(e: TouchEvent) {
      // Only react to single-finger taps so pinch/zoom is untouched.
      if (e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0];
      const target = e.target;
      if (isInteractiveTarget(target)) {
        // Reset so the next tap on empty stage isn't paired with this one.
        lastTapTime = 0;
        return;
      }
      const now = Date.now();
      const dx = Math.abs(t.clientX - lastTapX);
      const dy = Math.abs(t.clientY - lastTapY);
      if (now - lastTapTime <= DOUBLE_TAP_MS && dx <= DOUBLE_TAP_PX && dy <= DOUBLE_TAP_PX) {
        // Second tap of a double-tap pair — navigate.
        e.preventDefault();
        const half = window.innerWidth / 2;
        if (t.clientX >= half) next(); else prev();
        lastTapTime = 0; // consume the pair
        return;
      }
      lastTapTime = now;
      lastTapX = t.clientX;
      lastTapY = t.clientY;
    }

    window.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => window.removeEventListener('touchend', onTouchEnd);
  }, [next, prev]);

  // Sync URL → state when user uses back/forward. Disabled / missing slide numbers
  // are redirected to the first active slide so the URL never points at a hidden slide.
  useEffect(() => {
    if (Number.isNaN(requested)) return;
    const target = findBySlideNumber(requested);
    if (!target || target.enabled === false) {
      const fallback = linearSlides[0]?.slideNumber ?? 1;
      if (fallback !== current) {
        setCurrent(fallback);
        const params = new URLSearchParams(location.search);
        params.delete('slide');
        const nextSearch = params.toString();
        navigate(`/${fallback}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
      }
      return;
    }
    if (requested !== current) {
      setDirection(requested > current ? 'forward' : 'backward');
      setCurrent(requested);
    }
  }, [requested, current, navigate, location.search]);

  // Canonicalize the URL to `/N` ONLY after the deck has confirmed it
  // mounted the resolved slide (i.e. `current === slide.slideNumber`,
  // which only holds after React has re-rendered with that value). We use
  // `history.replaceState` instead of router `navigate` so the change is
  // in-place — no redirect hop, no extra render cycle, no chance of
  // stalling startup. Click-reveal URLs are intentionally preserved.
  useEffect(() => {
    if (!slide) return;
    if (slide.isClickReveal) return;
    if (current !== slide.slideNumber) {
      // Resolved slide differs from URL — sync state first; canonicalize
      // on the next pass once React has actually mounted the new slide.
      setCurrent(slide.slideNumber);
      return;
    }
    const params = new URLSearchParams(location.search);
    params.delete('slide');
    const nextSearch = params.toString();
    const canonical = `/${slide.slideNumber}${nextSearch ? `?${nextSearch}` : ''}`;
    const currentUrl = `${location.pathname}${location.search}`;
    if (currentUrl !== canonical) {
      window.history.replaceState(window.history.state, '', canonical);
    }
  }, [slide, current, location.pathname, location.search]);

  // Controller hover/auto-hide
  function showController() {
    setControllerVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControllerVisible(false), 2200);
  }

  // Fullscreen
  useEffect(() => {
    function onFs() { setIsFullscreen(Boolean(document.fullscreenElement)); }
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  // Presenter sync — broadcast our current slide on every change, and accept
  // navigation commands from any presenter window opened on /present.
  // The channel is created ONCE on mount; handler refs are kept fresh so we
  // never close/reopen the channel mid-session (which used to drop messages).
  const channelRef = useRef<BroadcastChannel | null>(null);
  const handlersRef = useRef({ next, prev, goTo, current });
  useEffect(() => { handlersRef.current = { next, prev, goTo, current }; }, [next, prev, goTo, current]);

  useEffect(() => {
    const ch = getChannel();
    channelRef.current = ch;
    if (!ch) return;
    // Capture as a non-null local so TS keeps the narrowing inside `onMsg`
    // under `strict` / `strictNullChecks` (v0.170 — strict-mode flip).
    const channel: BroadcastChannel = ch;
    function onMsg(e: MessageEvent<unknown>) {
      if (!isSyncMessage(e.data)) return;
      const h = handlersRef.current;
      // Exhaustive dispatch — every SyncMessage variant must be handled here
      // (or the build breaks). Drives the audience deck from presenter input
      // and answers `request-state` snapshots.
      handleSyncMessage(e.data, {
        nav: (msg) => {
          if (msg.dir === 'next') h.next();
          else if (msg.dir === 'prev') h.prev();
          else if (msg.dir === 'jump') h.goTo(msg.n, msg.n > h.current ? 'forward' : 'backward');
        },
        'request-state': () => {
          channel.postMessage({ type: 'slide', n: h.current } satisfies SyncMessage);
        },
        // The deck is the source of truth for slide changes — it never reacts
        // to inbound `slide` echoes (would create a feedback loop with itself).
        slide: () => {},
        // Theme broadcasts are emitted by ThemePicker directly; the deck just
        // applies its stored theme on mount and doesn't need to re-handle them.
        theme: () => {},
      });
    }
    channel.addEventListener('message', onMsg);
    return () => { channel.removeEventListener('message', onMsg); channel.close(); channelRef.current = null; };
  }, []);

  // Push current slide to any listening presenter windows.
  useEffect(() => {
    channelRef.current?.postMessage({ type: 'slide', n: current } satisfies SyncMessage);
  }, [current]);

  if (!slide) return null;

  // Indicator must always reflect the slide actually on stage.
  // Three cases the raw `linearIdx` gets wrong:
  //  1. URL points to a click-reveal slide  → use the parent's linear index
  //     (the audience sees "we're on slide N expanded", not slide 1).
  //  2. URL points to a disabled slide      → resolved slide is the fallback
  //     (linearSlides[0]); use its real linear index.
  //  3. URL is out-of-range / unknown       → same fallback.
  // Also re-sync the URL in cases 2 & 3 so address bar matches the indicator.
  const resolvedLinearIdx = (() => {
    if (linearIdx >= 0) return linearIdx;
    if (slide.isClickReveal && slide.parentSlide) {
      const parentIdx = findLinearIndex(slide.parentSlide);
      if (parentIdx >= 0) return parentIdx;
    }
    return linearSlides.findIndex(s => s.slideNumber === slide.slideNumber);
  })();
  const currentLinear = Math.max(1, resolvedLinearIdx + 1);
  const isStepsChain3D = slide.slideType === 'StepsChain3DSlide';

  // Live announcement string for screen readers — re-emitted on every
  // navigation so SR users hear "Slide N of M: <title>" without the visual
  // chrome being aware of it. Polite + atomic so it never barges into a
  // prior announcement and always reads in full. (WCAG 4.1.3 Status Messages)
  const announcement = `Slide ${currentLinear} of ${total}${slide?.content?.title ? `: ${slide.content.title}` : ''}`;

  return (
    <>
      {/* WCAG 2.4.1 Bypass Blocks — keyboard users can skip the chrome
          (controller, top jumper, sidebar) directly to slide content. */}
      <a href="#slide-content" className="skip-to-content">
        Skip to slide content
      </a>
      <main
        id="slide-content"
        className={`h-screen w-screen relative bg-background ${isFullscreen ? 'is-slide-fullscreen' : ''}`}
        onMouseMove={showController}
        aria-label={`${deck.deckName} — slide ${currentLinear} of ${total}`}
      >
      {/* Polite live region — announces slide changes for SR users.
          `key` forces React to remount the node so identical text on
          re-navigation still triggers the announcement. */}
      <div
        key={`announce-${current}-${replayNonce}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      <FitStage>
        <SlideStage
          ref={focusRef}
          slide={slide}
          direction={direction}
          onCapsuleClickReveal={onCapsuleClickReveal}
          onBackToParent={(n) => goTo(n, 'backward')}
          highlightReveal={revealHints}
          deckTransitionTiming={deckTransitionTiming}
          deckTransitionTimingByType={deck.transitionTimingByType}
          replayNonce={replayNonce}
        />
        <PresenterWebcamOverlay />
      </FitStage>
      <ControllerBar
        current={currentLinear}
        total={total}
        visible={controllerVisible}
        onPrev={prev}
        onNext={next}
        onJump={jump}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onToggleGrid={() => setGridOpen(v => !v)}
        revealHints={revealHints}
        onToggleRevealHints={hasRevealCapsules ? toggleRevealHints : undefined}
        topJumperHidden={topJumperHidden}
        onToggleTopJumper={toggleTopJumper}
      />
      <GridOverview
        open={gridOpen}
        current={current}
        onJump={(n) => goTo(n, n > current ? 'forward' : 'backward')}
        onClose={() => setGridOpen(false)}
      />
      {/* Top-center jumper — always-visible "NN / NN" pinned to the top.
          Double-click opens a section/slide popover. Hidden in grid view to
          avoid stacking with the overview UI, and when the presenter has
          opted to hide it via the controller / `J` shortcut (v0.152). */}
      {!gridOpen && !topJumperHidden && !isStepsChain3D && (
        <PresenterTopBar
          current={currentLinear}
          total={total}
        />
      )}
      {/* Section-jumper popover — opened via double-click on its NN/NN chip.
          Hidden by default now that the new PresenterTopBar (v0.220) covers
          the always-visible counter; flip on with `?jumper=1` to bring back
          the popover gesture during long decks. */}
      {!gridOpen && !topJumperHidden && new URLSearchParams(location.search).get('jumper') === '1' && (
        <TopSlideJumper
          current={currentLinear}
          total={total}
          slides={linearSlides}
          onJump={jump}
        />
      )}
      {/* Persistent on-screen slide indicator — independent of the hover-
          revealed controller pill so the audience always knows where we are. */}
      {!gridOpen && <SlideNumberBadge current={currentLinear} total={total} />}
      {/* Shortcut discovery hints — fire-once-per-browser nudges that surface
          the two rebound keys (Ctrl+1 → TOC, O → webcam shape). Suppressed in
          grid view so they don't fight the overview chrome. */}
      {!gridOpen && (
        <>
          <ShortcutHint
            kind="toc"
            open={tocHintOpen}
            onClose={() => setTocHintOpen(false)}
          />
          <ShortcutHint
            kind="shape"
            open={shapeHintOpen}
            onClose={() => setShapeHintOpen(false)}
          />
        </>
      )}
      {/* Quick-jump number buffer indicator — shows the digits the presenter
          is composing. Press Enter to jump, Esc to cancel. */}
      {jumpBuffer.length > 0 && !gridOpen && (
        <>
          {/*
            Visible (sighted) buffer card. Marked aria-hidden so screen
            readers don't double-announce alongside the polite live region
            below. The card uses ember styling + shake when rejected.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed top-1/2 left-1/2 z-[60] -translate-x-1/2 -translate-y-1/2"
          >
            <div
              className={[
                'rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-md animate-fade-in border bg-[hsl(var(--chrome-bg))]/95 transition-colors',
                jumpRejected ? 'border-[hsl(var(--ember))]/70 animate-jump-reject' : 'border-gold/40',
              ].join(' ')}
            >
              {/* Live preview of the target slide. Only renders when the
                  parsed buffer is in range — out-of-range / zero shows a
                  dimmed placeholder card so the layout doesn't jump.
                  The preview pulses (`animate-jump-confirm`) on a valid
                  Enter commit, shakes (`animate-jump-reject`) on reject. */}
              {(() => {
                const parsed = parseInt(jumpBuffer, 10);
                const inRange = Number.isFinite(parsed) && parsed >= 1 && parsed <= total;
                const target = inRange ? linearSlides[parsed - 1] : null;
                const wrapClass = [
                  'mx-auto mb-3 rounded-lg overflow-hidden ring-1 transition-shadow',
                  jumpConfirmed ? 'animate-jump-confirm ring-gold' : '',
                  jumpRejected ? 'ring-[hsl(var(--ember))]/60' : !jumpConfirmed ? 'ring-gold/30' : '',
                ].join(' ');
                return (
                  <div className={wrapClass} style={{ width: 240 }}>
                    {target ? (
                      <SlidePreview slide={target} width={240} />
                    ) : (
                      <div
                        className="flex items-center justify-center bg-[hsl(var(--chrome-bg))]/60 text-[hsl(var(--chrome-fg-muted))] font-display text-3xl"
                        style={{ width: 240, height: 135 /* 16:9 */ }}
                      >
                        —
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--chrome-fg-muted))] text-center mb-1">
                {jumpRejected === 'zero' ? 'Slides start at 1' : jumpRejected === 'range' ? 'Out of range' : 'Jump to slide'}
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span
                  className={[
                    'font-display text-5xl font-bold tabular-nums',
                    jumpRejected ? 'text-[hsl(var(--ember))]' : 'text-gold',
                  ].join(' ')}
                >
                  {jumpBuffer}
                </span>
                <span className="text-sm text-[hsl(var(--chrome-fg-muted))] tabular-nums">
                  / {total}
                </span>
              </div>
              <div className="mt-2 text-center text-[10px] text-[hsl(var(--chrome-fg-muted))]">
                {jumpRejected === 'zero' ? (
                  <>Type <kbd className="font-mono">1</kbd>–<kbd className="font-mono">{total}</kbd>, then <kbd className="font-mono">Enter</kbd></>
                ) : jumpRejected === 'range' ? (
                  <>Max is <kbd className="font-mono">{total}</kbd> · <kbd className="font-mono">Esc</kbd> cancel</>
                ) : (
                  <><kbd className="font-mono">Enter</kbd> jump · <kbd className="font-mono">Esc</kbd> cancel</>
                )}
              </div>
            </div>
          </div>
          {/*
            Screen-reader-only ARIA live region. We render announcement text
            as the live region's *children* (not aria-label) because some
            assistive tech only re-announces on subtree mutations when the
            label is absent. Text is the parsed numeric value — never the
            raw buffer — so leading zeros / separators are already
            normalized away by the time SR users hear it.

            `role="status"` + `aria-live="polite"` queues the update behind
            the user's current speech; `aria-atomic` makes the whole
            sentence re-read on each change instead of just the diff.

            The `key` prop forces React to swap the node when the announced
            content changes, which causes VoiceOver/NVDA to re-trigger
            even if the new text happens to share a prefix with the old.
          */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            key={`jump-announce-${jumpRejected ?? 'pending'}-${jumpBuffer}`}
          >
            {(() => {
              const parsed = parseInt(jumpBuffer, 10);
              const normalized = Number.isFinite(parsed) ? String(parsed) : jumpBuffer;
              if (jumpRejected === 'zero') {
                return `Slides start at 1. Type a number from 1 to ${total}, then press Enter.`;
              }
              if (jumpRejected === 'range') {
                return `No slide ${normalized}. Deck has ${total} slides.`;
              }
              return `Jump to slide ${normalized} of ${total}. Press Enter to confirm or Escape to cancel.`;
            })()}
          </div>
        </>
      )}
      {/* Opt-in dot pagination — toggled via /settings. Hidden in grid view and
          on StepsChain3DSlide so the card surface is the only click target. */}
      {showDots && !gridOpen && slide?.slideType !== 'StepsChain3DSlide' && (
        <DotPagination
          current={currentLinear}
          total={total}
          slides={linearSlides}
          onJump={jump}
        />
      )}
      {/* v0.124 — in-deck animation scrubber. Lives outside any printable
          chrome (data-print-hide) and clears its overrides on close. */}
      {scrubberOpen && (
        <AnimationScrubber
          focusRef={focusRef}
          slideNumber={current}
          onClose={() => setScrubberOpen(false)}
        />
      )}
      {/* v0.182 — live transition inspector (Shift+R or `?inspect=transition`). */}
      {transitionInspectorOpen && (
        <TransitionInspector
          onClose={() => {
            if (!getTransitionOverrideState().persist) resetTransitionOverrideState();
            setTransitionInspectorOpen(false);
          }}
          onReplay={() => setReplayNonce((n) => n + 1)}
          currentSlideNumber={current}
        />
      )}
      {/* v0.126 — bottom thumbnail strip. Hidden in grid view (which already
          shows every slide) and during the click-reveal popovers. */}
      {!gridOpen && (
        <ThumbnailStrip
          slides={linearSlides}
          currentLinear={currentLinear}
          onJump={jump}
          open={thumbStripOpen}
          onToggle={toggleThumbStrip}
        />
      )}
      {/* v0.184 — searchable left-edge slide TOC. Hidden in grid view since
          the grid already exposes every slide as a clickable thumbnail. */}
      {!gridOpen && (
        <SlideTocSidebar
          slides={linearSlides}
          currentLinear={currentLinear}
          onJump={jump}
          open={tocOpen}
          onToggle={toggleToc}
        />
      )}
      </main>
    </>
  );
}
