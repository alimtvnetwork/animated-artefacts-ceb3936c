/**
 * usePresenterWebcam — context + hook for the global webcam overlay.
 *
 * Spec: `spec/21-slides-system/64-presenter-webcam.md` (v2).
 *
 * Phases:
 *   off → requesting → on ↔ tray ↔ fullscreen → off
 *
 * `tray` = soft-hide icon, stream stays alive INDEFINITELY (no grace
 * timer). Only `close()` (the X button) stops the stream. `fullscreen`
 * is a position:fixed layer over the stage (NOT requestFullscreen) so
 * the deck keeps responding to nav under it.
 *
 * Sizes: 4 stepped presets (S/M/L/XL) plus free pointer-drag resize
 * (16:9 locked). Persisted in `riseup.webcam.size`.
 *
 * Keyboard shortcuts (`i` `m` `f` `+` `-` `Esc`, NO Shift) live on the
 * overlay — see PresenterWebcamOverlay.tsx for the listener.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { slideSound } from '@/slides/sound';
import { toast } from 'sonner';

const POS_KEY = 'riseup.webcam.pos';
const MIN_KEY = 'riseup.webcam.min';
const SIZE_KEY = 'riseup.webcam.size';
const HALO_KEY = 'riseup.webcam.halo';
const CIRCLE_KEY = 'riseup.webcam.circle';
const MINI_W = 96;
const MINI_H = 96;

export type WebcamPhase =
  | 'off'
  | 'requesting'
  | 'on'
  | 'tray'
  | 'fullscreen'
  /** v3 — stage-fill: covers the 1920×1080 stage (absolute, not fixed). Toggled by `1`. */
  | 'stage'
  | 'denied';

export type SizeStep = 'S' | 'M' | 'L' | 'XL';

const SIZE_STEPS: Record<SizeStep, { w: number; h: number }> = {
  S: { w: 240, h: 135 },
  M: { w: 320, h: 180 },
  L: { w: 480, h: 270 },
  XL: { w: 720, h: 405 },
};
const STEP_ORDER: SizeStep[] = ['S', 'M', 'L', 'XL'];

const FREE_MIN_W = 160;
const FREE_MAX_W = 960;
const ASPECT_H_OVER_W = 9 / 16;

// Stage is 1920×1080; default top-right with 32 px inset.
const DEFAULT_POS = { x: 1920 - SIZE_STEPS.M.w - 32, y: 32 };

type SizeConfig =
  | { kind: 'step'; id: SizeStep }
  | { kind: 'free'; w: number; h: number };

const DEFAULT_SIZE: SizeConfig = { kind: 'step', id: 'M' };

export interface WebcamState {
  phase: WebcamPhase;
  stream: MediaStream | null;
  error: string | null;
}

export interface NavHandlers {
  goNext: () => void;
  goPrev: () => void;
}

type FullscreenAction = 'enter-fullscreen' | 'goNext' | 'goPrev';

interface Ctx {
  state: WebcamState;
  position: { x: number; y: number };
  size: { w: number; h: number };
  sizeStep: SizeStep | null;
  minimized: boolean;
  toggle: () => Promise<void>;
  show: () => Promise<void>;
  /** Soft hide → tray icon. Stream stays alive. */
  hide: () => void;
  /** Hard stop — kills every track on the stream. Used by the X button. */
  close: () => void;
  toggleMinimized: () => void;
  setPosition: (x: number, y: number) => void;
  setSizeStep: (s: SizeStep) => void;
  growSize: () => void;
  shrinkSize: () => void;
  resizeFree: (w: number, h?: number) => void;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => void;
  /** Internal-only mutator used by passthrough handlers; consumers SHOULD
   *  not call directly. Exposed so the overlay can record forward-key
   *  events into the action stack. */
  pushFullscreenAction: (a: FullscreenAction) => void;
  /** SlideDeckPage registers its goNext/goPrev once. */
  registerNavHandlers: (h: NavHandlers) => () => void;
  /** v3 — opt-in vignette halo around the on-surface camera box. */
  haloVisible: boolean;
  /** v3 — flip halo on/off. Persisted in localStorage. */
  toggleHalo: () => void;
  /** v3 — stage-fill toggle. Round-trips exact size + position + phase. */
  toggleStage: () => void;
  /** v5 (2026-05-02) — circular vs rectangular camera frame. Persisted in
   *  localStorage. Bound to the `O` shortcut. Applies to floating, minimized,
   *  fullscreen, and stage phases via `border-radius: 999px`. */
  circleShape: boolean;
  toggleCircleShape: () => void;
  /** v6 (2026-06-02) — the `O` 3-state shaping cycle:
   *    1. rectangle (circle off, halo off)
   *    2. circle    (circle on,  halo off)
   *    3. circle + overlay/halo (circle on, halo on)
   *  Third press lights up the glow overlay; a fourth wraps back to
   *  rectangle. Bound to the `O` shortcut. */
  cycleShapeOverlay: () => void;
  /** v5 (2026-05-02) — true while the cinematic `]` cycle is squishing
   *  the fullscreen wrapper to nothing. Overlay reads this and applies
   *  the 0.8s scale+fade transform. Auto-clears when the phase flips
   *  to 'off'. See `spec/21-slides-system/65-presenter-shortcuts-v5.md`. */
  cinematicExiting: boolean;
  /** v5 — the `]` 3-state cycle (fullscreen→off → off→on → on→fullscreen).
   *  Idempotent: callable from any phase, picks the right next step. */
  runCinematicCycle: () => void;
}

const WebcamCtx = createContext<Ctx | null>(null);

function readStoredPos(): { x: number; y: number } {
  if (typeof window === 'undefined') return DEFAULT_POS;
  try {
    const raw = window.localStorage.getItem(POS_KEY);
    if (!raw) return DEFAULT_POS;
    const parsed = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {
    /* corrupt — fall through */
  }
  return DEFAULT_POS;
}

function readStoredSize(): SizeConfig {
  if (typeof window === 'undefined') return DEFAULT_SIZE;
  try {
    const raw = window.localStorage.getItem(SIZE_KEY);
    if (!raw) return DEFAULT_SIZE;
    const parsed = JSON.parse(raw) as Partial<SizeConfig>;
    if (parsed && parsed.kind === 'step' && parsed.id && STEP_ORDER.includes(parsed.id)) {
      return { kind: 'step', id: parsed.id };
    }
    if (
      parsed &&
      parsed.kind === 'free' &&
      typeof parsed.w === 'number' &&
      typeof parsed.h === 'number'
    ) {
      return { kind: 'free', w: parsed.w, h: parsed.h };
    }
  } catch {
    /* corrupt — fall through */
  }
  return DEFAULT_SIZE;
}

function writeStoredSize(cfg: SizeConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SIZE_KEY, JSON.stringify(cfg));
  } catch {
    /* quota — silently drop, the in-memory state still wins */
  }
}

function clampFreeWidth(w: number): number {
  return Math.round(Math.max(FREE_MIN_W, Math.min(FREE_MAX_W, w)));
}

function nearestStep(w: number): SizeStep {
  let best: SizeStep = 'M';
  let bestDelta = Infinity;
  for (const id of STEP_ORDER) {
    const d = Math.abs(SIZE_STEPS[id].w - w);
    if (d < bestDelta) {
      bestDelta = d;
      best = id;
    }
  }
  return best;
}

export function PresenterWebcamProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WebcamState>({
    phase: 'off',
    stream: null,
    error: null,
  });
  const [position, setPositionState] = useState<{ x: number; y: number }>(readStoredPos);
  const [sizeCfg, setSizeCfg] = useState<SizeConfig>(readStoredSize);
  const [minimized, setMinimized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(MIN_KEY) === '1';
  });
  /** v3 — vignette halo visibility. Default OFF, persisted. */
  const [haloVisible, setHaloVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(HALO_KEY) === '1';
  });
  /** v5 — circular frame toggle. Default OFF (rectangle), persisted. */
  const [circleShape, setCircleShape] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(CIRCLE_KEY) === '1';
  });
  /** v5 — true while the cinematic `]` cycle's step-1 squish is animating
   *  the fullscreen wrapper away. Auto-clears when phase reaches 'off'. */
  const [cinematicExiting, setCinematicExiting] = useState<boolean>(false);

  // Phase to return to after exitFullscreen() — captured at enter time.
  const fullscreenReturnPhaseRef = useRef<'on' | 'tray'>('on');
  // Action stack — only meaningful while phase === 'fullscreen' or 'stage'.
  const actionStackRef = useRef<FullscreenAction[]>([]);
  // Nav handlers registered by SlideDeckPage. Latest wins.
  const navHandlersRef = useRef<NavHandlers | null>(null);
  /**
   * v3 — round-trip restore for `'stage'` phase. Captures the EXACT
   * size config, position, and prior phase at enter time so a second
   * `1` press can restore them all atomically. Cleared on exit.
   */
  const stageRestoreRef = useRef<{
    fromPhase: 'on' | 'tray';
    sizeCfg: SizeConfig;
    position: { x: number; y: number };
  } | null>(null);

  const toggleMinimized = useCallback(() => {
    setMinimized((m) => {
      const next = !m;
      try {
        window.localStorage.setItem(MIN_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /** Internal — force minimized OFF (used by +/- so growing/shrinking
   *  the puck actually scales the visible surface instead of being
   *  silently absorbed by the 96×96 minimized override). */
  const clearMinimized = useCallback(() => {
    setMinimized((m) => {
      if (!m) return m;
      try {
        window.localStorage.setItem(MIN_KEY, '0');
      } catch {
        /* ignore */
      }
      return false;
    });
  }, []);

  const stopStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((t) => t.stop());
  }, []);

  const show = useCallback(async () => {
    // Re-show from tray: stream is still live, just flip phase.
    if (state.phase === 'tray' && state.stream) {
      setState({ phase: 'on', stream: state.stream, error: null });
      return;
    }
    // Re-show from fullscreen: reuse existing stream.
    if (state.phase === 'fullscreen' && state.stream) {
      setState({ phase: 'on', stream: state.stream, error: null });
      return;
    }
    if (state.phase === 'on' || state.phase === 'requesting') return;

    setState({ phase: 'requesting', stream: null, error: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      setState({ phase: 'on', stream, error: null });
    } catch (e) {
      const err = e as Error;
      const reason =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Enable it in your browser site settings.'
          : err.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : err.message || 'Could not start camera.';
      setState({ phase: 'denied', stream: null, error: reason });
    }
  }, [state.phase, state.stream]);

  /**
   * Soft hide → tray. Stream stays ALIVE. Different from spec-64-v1
   * `hidden` (which scheduled a stop after 10s); here the camera light
   * stays on indefinitely until the user expands again or hits Stop.
   */
  const hide = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'on' || !prev.stream) return prev;
      return { phase: 'tray', stream: prev.stream, error: null };
    });
  }, []);

  /**
   * Hard-stop. Used by the X button on the overlay AND on the tray fan.
   * Kills every track and resets phase to off.
   */
  const close = useCallback(() => {
    actionStackRef.current = [];
    setState((prev) => {
      stopStream(prev.stream);
      return { phase: 'off', stream: null, error: null };
    });
  }, [stopStream]);

  const enterFullscreen = useCallback(async () => {
    // Auto-show first if camera is off/tray.
    if (state.phase === 'off' || state.phase === 'denied') {
      await show();
      // After show resolves, state in this closure is stale, but the next
      // setState call reads fresh state.
    }
    setState((prev) => {
      if (prev.phase !== 'on' && prev.phase !== 'tray') return prev;
      fullscreenReturnPhaseRef.current = prev.phase === 'tray' ? 'tray' : 'on';
      actionStackRef.current = ['enter-fullscreen'];
      return { phase: 'fullscreen', stream: prev.stream, error: null };
    });
  }, [show, state.phase]);

  const exitFullscreen = useCallback(() => {
    setState((prev) => {
      // v3: Esc exits BOTH fullscreen and stage phases via the same
      // path. Stage uses its own restore ref (size + position + phase),
      // fullscreen uses the simpler return-phase ref.
      if (prev.phase === 'stage') {
        const r = stageRestoreRef.current;
        actionStackRef.current = [];
        if (r) {
          // Restore size + position synchronously alongside the phase
          // flip so the user sees one atomic transition back.
          setSizeCfg(r.sizeCfg);
          setPositionState(r.position);
          stageRestoreRef.current = null;
          return { phase: r.fromPhase, stream: prev.stream, error: null };
        }
        return { phase: 'on', stream: prev.stream, error: null };
      }
      if (prev.phase !== 'fullscreen') return prev;
      const back = fullscreenReturnPhaseRef.current;
      actionStackRef.current = [];
      return { phase: back, stream: prev.stream, error: null };
    });
  }, []);

  const pushFullscreenAction = useCallback((a: FullscreenAction) => {
    actionStackRef.current.push(a);
  }, []);

  const registerNavHandlers = useCallback((h: NavHandlers) => {
    navHandlersRef.current = h;
    return () => {
      if (navHandlersRef.current === h) {
        navHandlersRef.current = null;
      }
    };
  }, []);

  const toggle = useCallback(async () => {
    if (state.phase === 'on') {
      hide();
      return;
    }
    if (state.phase === 'tray') {
      await show();
      return;
    }
    await show();
  }, [hide, show, state.phase]);

  const setPosition = useCallback((x: number, y: number) => {
    // Clamp to stage bounds (1920×1080) using DEFAULT_W as a safe right-edge
    // budget — even the largest persisted box still fits with this margin.
    const cx = Math.max(0, Math.min(1920 - SIZE_STEPS.M.w, Math.round(x)));
    const cy = Math.max(0, Math.min(1080 - SIZE_STEPS.M.h, Math.round(y)));
    const next = { x: cx, y: cy };
    setPositionState(next);
    try {
      window.localStorage.setItem(POS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const setSizeStep = useCallback((s: SizeStep) => {
    const cfg: SizeConfig = { kind: 'step', id: s };
    setSizeCfg(cfg);
    writeStoredSize(cfg);
  }, []);

  const growSize = useCallback(() => {
    // If the puck is minimized, +/- should restore the box first so the
    // user actually sees a size step instead of staring at a 96×96 puck.
    clearMinimized();
    setSizeCfg((prev) => {
      const currentW = prev.kind === 'step' ? SIZE_STEPS[prev.id].w : prev.w;
      const baseStep = prev.kind === 'step' ? prev.id : nearestStep(currentW);
      const idx = STEP_ORDER.indexOf(baseStep);
      // If the previous size was free and not exactly on a step, stepping
      // up snaps to the next step ABOVE the current width — feels right
      // because the user pressed +.
      const targetIdx =
        prev.kind === 'free' && SIZE_STEPS[baseStep].w <= currentW
          ? Math.min(STEP_ORDER.length - 1, idx + 1)
          : Math.min(STEP_ORDER.length - 1, idx + 1);
      const next: SizeConfig = { kind: 'step', id: STEP_ORDER[targetIdx] };
      writeStoredSize(next);
      return next;
    });
  }, [clearMinimized]);

  const shrinkSize = useCallback(() => {
    clearMinimized();
    setSizeCfg((prev) => {
      const currentW = prev.kind === 'step' ? SIZE_STEPS[prev.id].w : prev.w;
      const baseStep = prev.kind === 'step' ? prev.id : nearestStep(currentW);
      const idx = STEP_ORDER.indexOf(baseStep);
      const targetIdx =
        prev.kind === 'free' && SIZE_STEPS[baseStep].w >= currentW
          ? Math.max(0, idx - 1)
          : Math.max(0, idx - 1);
      const next: SizeConfig = { kind: 'step', id: STEP_ORDER[targetIdx] };
      writeStoredSize(next);
      return next;
    });
  }, [clearMinimized]);

  const resizeFree = useCallback((w: number, _h?: number) => {
    const cw = clampFreeWidth(w);
    const ch = Math.round(cw * ASPECT_H_OVER_W);
    const cfg: SizeConfig = { kind: 'free', w: cw, h: ch };
    setSizeCfg(cfg);
    writeStoredSize(cfg);
  }, []);

  // ──────────────────────────────────────────────────────────────────
  // v3 — halo visibility + stage-fill toggle.
  // ──────────────────────────────────────────────────────────────────
  const toggleHalo = useCallback(() => {
    setHaloVisible((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(HALO_KEY, next ? '1' : '0');
      } catch {
        /* quota / privacy mode — in-memory state still wins */
      }
      return next;
    });
  }, []);

  /**
   * v5 — circle/rectangle frame toggle (the `O` shortcut). Applies a 999px
   * border-radius to every camera surface (floating, minimized, fullscreen,
   * stage). Persisted in localStorage so the presenter's preferred frame
   * shape survives reloads. No phase guard — it's a pure visual flag.
   */
  const toggleCircleShape = useCallback(() => {
    setCircleShape((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(CIRCLE_KEY, next ? '1' : '0');
      } catch {
        /* quota / privacy mode — in-memory state still wins */
      }
      // Confirmation toast — fires for every trigger (O key, chrome button,
      // controller dropdown). Single sonner id keeps rapid toggles from
      // stacking; the toast just updates in place.
      toast(next ? 'Webcam: circle' : 'Webcam: rectangle', {
        id: 'webcam-shape',
        description: next
          ? 'Frame is now round. Press O to switch back.'
          : 'Frame is now rectangular. Press O to switch back.',
        duration: 1600,
      });
      return next;
    });
  }, []);

  /**
   * v6 (2026-06-02) — the `O` 3-state shaping cycle. Cycles:
   *   rectangle → circle → circle+overlay → rectangle …
   * "Overlay" is the glow halo. This replaces the old plain
   * rectangle↔circle toggle so the third press reveals the shaping
   * overlay the presenter asked for. Persists both flags via the same
   * localStorage keys used by toggleCircleShape / toggleHalo.
   */
  const cycleShapeOverlay = useCallback(() => {
    // Derive the current step from the two persisted flags:
    //   step 0 = (circle off, halo off) → go to circle on, halo off
    //   step 1 = (circle on,  halo off) → go to circle on, halo on
    //   step 2 = (circle on,  halo on ) → wrap to rectangle (both off)
    let nextCircle: boolean;
    let nextHalo: boolean;
    if (!circleShape && !haloVisible) {
      nextCircle = true;
      nextHalo = false;
    } else if (circleShape && !haloVisible) {
      nextCircle = true;
      nextHalo = true;
    } else {
      nextCircle = false;
      nextHalo = false;
    }

    setCircleShape(nextCircle);
    setHaloVisible(nextHalo);
    try {
      window.localStorage.setItem(CIRCLE_KEY, nextCircle ? '1' : '0');
      window.localStorage.setItem(HALO_KEY, nextHalo ? '1' : '0');
    } catch {
      /* quota / privacy mode — in-memory state still wins */
    }

    const label = !nextCircle
      ? 'Webcam: rectangle'
      : nextHalo
        ? 'Webcam: circle + glow'
        : 'Webcam: circle';
    toast(label, {
      id: 'webcam-shape',
      description: 'Press O to cycle frame shaping.',
      duration: 1600,
    });
  }, [circleShape, haloVisible]);

  /**
   * Stage-fill toggle (the `1` shortcut). When entering, captures the
   * exact size + position + phase so a second `1` press atomically
   * restores all three. Ignored from off/requesting/tray/denied per
   * spec §14.5 — no surprise camera prompts.
   */
  const toggleStage = useCallback(() => {
    setState((prev) => {
      if (prev.phase === 'stage') {
        const r = stageRestoreRef.current;
        actionStackRef.current = [];
        if (r) {
          setSizeCfg(r.sizeCfg);
          setPositionState(r.position);
          stageRestoreRef.current = null;
          return { phase: r.fromPhase, stream: prev.stream, error: null };
        }
        return { phase: 'on', stream: prev.stream, error: null };
      }
      if (prev.phase !== 'on') return prev;
      stageRestoreRef.current = {
        fromPhase: 'on',
        sizeCfg,
        position,
      };
      actionStackRef.current = ['enter-fullscreen'];
      return { phase: 'stage', stream: prev.stream, error: null };
    });
  }, [sizeCfg, position]);

  /**
   * v5 (2026-05-02) — the `]` cinematic 3-state cycle.
   * Spec: `spec/21-slides-system/65-presenter-shortcuts-v5.md` §4.
   *
   *   1. fullscreen → off  (squish + whoosh, 0.8s)
   *   2. off / tray / denied → on  (bouncy fade-in via existing show())
   *   3. on / stage → fullscreen  (bouncy zoom via enterFullscreen())
   *
   * Reduced motion collapses every step to instant + skips the whoosh.
   */
  const runCinematicCycle = useCallback(() => {
    const phase = state.phase;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (phase === 'fullscreen') {
      // Step 1: squish + whoosh, then hide().
      if (reduced) {
        // Instant exit — just go straight to off, no sound.
        setState((prev) => {
          stopStream(prev.stream);
          return { phase: 'off', stream: null, error: null };
        });
        return;
      }
      try {
        slideSound.play?.('whoosh');
      } catch {
        /* sound subsystem optional */
      }
      setCinematicExiting(true);
      window.setTimeout(() => {
        setCinematicExiting(false);
        setState((prev) => {
          stopStream(prev.stream);
          return { phase: 'off', stream: null, error: null };
        });
      }, 800);
      return;
    }

    if (phase === 'off' || phase === 'tray' || phase === 'denied' || phase === 'requesting') {
      // Step 2: show() — the floating overlay's existing appear animation
      // already supplies a bouncy fade-in.
      void show();
      return;
    }

    if (phase === 'on' || phase === 'stage') {
      // Step 3: enterFullscreen() — the overlay's fullscreen mount animation
      // supplies the bouncy zoom-in.
      void enterFullscreen();
      return;
    }
  }, [state.phase, show, enterFullscreen, stopStream]);


  // Cleanup on unmount: stop any active stream.
  useEffect(() => {
    return () => {
      stopStream(state.stream);
    };
    // We only want this on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive the live { w, h } the overlay paints — minimized puck always
  // wins over step/free.
  const computedSize = useMemo(() => {
    if (minimized) return { w: MINI_W, h: MINI_H };
    if (sizeCfg.kind === 'step') return SIZE_STEPS[sizeCfg.id];
    return { w: sizeCfg.w, h: sizeCfg.h };
  }, [minimized, sizeCfg]);

  const sizeStep: SizeStep | null = sizeCfg.kind === 'step' ? sizeCfg.id : null;

  const value = useMemo<Ctx>(
    () => ({
      state,
      position,
      size: computedSize,
      sizeStep,
      minimized,
      toggle,
      show,
      hide,
      close,
      toggleMinimized,
      setPosition,
      setSizeStep,
      growSize,
      shrinkSize,
      resizeFree,
      enterFullscreen,
      exitFullscreen,
      pushFullscreenAction,
      registerNavHandlers,
      haloVisible,
      toggleHalo,
      toggleStage,
      circleShape,
      toggleCircleShape,
      cycleShapeOverlay,
      cinematicExiting,
      runCinematicCycle,
    }),
    [
      state,
      position,
      computedSize,
      sizeStep,
      minimized,
      toggle,
      show,
      hide,
      close,
      toggleMinimized,
      setPosition,
      setSizeStep,
      growSize,
      shrinkSize,
      resizeFree,
      enterFullscreen,
      exitFullscreen,
      pushFullscreenAction,
      registerNavHandlers,
      haloVisible,
      toggleHalo,
      toggleStage,
      circleShape,
      toggleCircleShape,
      cycleShapeOverlay,
      cinematicExiting,
      runCinematicCycle,
    ],
  );

  return <WebcamCtx.Provider value={value}>{children}</WebcamCtx.Provider>;
}

export function usePresenterWebcam(): Ctx {
  const ctx = useContext(WebcamCtx);
  if (!ctx) {
    throw new Error('usePresenterWebcam must be used inside <PresenterWebcamProvider>');
  }
  return ctx;
}

/* Test-only — stable internal exports for the spec-64 v2 test suite. */
export const _SIZE_STEPS_FOR_TEST = SIZE_STEPS;
export const _STEP_ORDER_FOR_TEST = STEP_ORDER;
export const _SIZE_KEY_FOR_TEST = SIZE_KEY;
