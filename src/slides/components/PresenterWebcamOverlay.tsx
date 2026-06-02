/**
 * PresenterWebcamOverlay — themed webcam surface (spec 64 v2).
 *
 * Renders four mutually-exclusive surfaces depending on `state.phase`:
 *   - `on`         → draggable card with chrome (+/-, fullscreen, focus,
 *                    minimize, X) + a bottom-right resize handle.
 *   - `tray`       → 40×40 floating icon w/ ember pulse; on hover, a
 *                    horizontal fan reveals Expand / Fullscreen / Stop.
 *   - `fullscreen` → fixed-position layer over the deck stage with its
 *                    own minimal chrome; forwards forward keys to the
 *                    deck via `pushFullscreenAction` + the registered
 *                    NavHandlers.
 *   - any other    → null.
 *
 * Single-letter shortcuts (`i` `m` `f` `+` `-` `Escape`) are bound at
 * window level and guarded against text-input focus.
 *
 * Drag/resize math divides pointer deltas by `--stage-scale` so motion
 * matches what the user expects on scaled FitStage viewports.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GripHorizontal,
  X,
  Minimize2,
  Maximize2,
  Focus,
  Plus,
  Minus,
  Expand,
  Camera,
  Sparkles,
  Circle,
  Square,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePresenterWebcam } from './usePresenterWebcam';
import { useAutoFrame } from './useAutoFrame';
import { useAutoHideCursor } from './useAutoHideCursor';
// spec/camera-2026/05 — decorative squircle "plate" that sits behind the
// live camera to read as a bigger, OBS-style framed surface with a soft
// drop shadow + gold rim. The PNG already bakes the squircle curve, gold
// rim and shadow, so we just lay it behind the masked video.
import squirclePlateGold from '@/assets/camera-2026/04-squircle-plate-gold-shadow.png';
import squircleMaskBlack from '@/assets/camera-2026/02-squircle-mask-black.png';
import squirclePlateWhite from '@/assets/camera-2026/03-squircle-plate-white-shadow.png';

function readStageScale(): number {
  if (typeof document === 'undefined') return 1;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--stage-scale');
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

const HALO = 28;
const FREE_MIN_W = 160;
const FREE_MAX_W = 960;

function WebcamChromeButton({
  label,
  shortcut,
  side = 'top',
  align = 'center',
  pressed,
  children,
  style,
  onPointerDown,
  onClick,
}: {
  label: string;
  shortcut?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  pressed?: boolean;
  children: React.ReactNode;
  style: React.CSSProperties;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  const title = shortcut ? `${label} (${shortcut})` : label;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onPointerDown={onPointerDown}
          onClick={onClick}
          aria-label={title}
          aria-pressed={pressed}
          title={title}
          style={style}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

export function PresenterWebcamOverlay() {
  const {
    state,
    position,
    size,
    minimized,
    close,
    hide,
    show,
    setPosition,
    toggleMinimized,
    growSize,
    shrinkSize,
    resizeFree,
    enterFullscreen,
    exitFullscreen,
    pushFullscreenAction,
    haloVisible,
    toggleHalo,
    toggleStage,
    circleShape,
    cycleShapeOverlay,
    cinematicExiting,
  } = usePresenterWebcam();
  const autoFrame = useAutoFrame(state.stream, /* mirrored */ true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const shapeFrameRef = useRef<HTMLDivElement | null>(null);
  const shapeHaloRef = useRef<HTMLDivElement | null>(null);
  const forceHideCursorNow = useCallback(() => {
    const frame = shapeFrameRef.current;
    if (!frame) return;
    frame.classList.add('cam-cursor-hidden');
  }, []);
  const attachStreamToVideo = useCallback(
    (node: HTMLVideoElement | null) => {
      if (!node) return;
      if (state.stream) {
        if (node.srcObject !== state.stream) node.srcObject = state.stream;
        node.play().catch(() => {
          /* autoplay blocked — user gesture already happened */
        });
      } else if (node.srcObject) {
        node.srcObject = null;
      }
    },
    [state.stream],
  );
  const bindFloatingVideo = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      attachStreamToVideo(node);
    },
    [attachStreamToVideo],
  );
  const bindFullscreenVideo = useCallback(
    (node: HTMLVideoElement | null) => {
      fullscreenVideoRef.current = node;
      attachStreamToVideo(node);
    },
    [attachStreamToVideo],
  );
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [trayHover, setTrayHover] = useState(false);

  // ──────────────────────────────────────────────────────────────────
  // Auto-hide the mouse cursor over the camera surfaces. The cursor
  // disappears after ~2.5s of pointer inactivity (and immediately after a
  // drag/resize gesture ends), reappears on the next mouse move, then hides
  // again. Active for the live `on` card and the stage/fullscreen layers —
  // never for tray/off so the small icon stays clickable. `cursor: none` is
  // applied to each surface root below via `cursorStyle`.
  // ──────────────────────────────────────────────────────────────────
  const cursorActive =
    state.phase === 'on' || state.phase === 'stage' || state.phase === 'fullscreen';
  const autoHideCursor = useAutoHideCursor({ active: cursorActive });
  const cursorStyle = autoHideCursor.hidden ? ('none' as const) : undefined;
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const resizeRef = useRef<{
    pointerId: number;
    startX: number;
    baseW: number;
  } | null>(null);

  // 2026-05-02 — Shape-toggle pop animation. Important: do NOT use a React
  // key or conditional <video> tree for this. Shape changes only animate the
  // clipping wrapper via WAAPI, so the live MediaStream remains attached to
  // the same video node and never blanks mid-transition.
  const firstShapeRef = useRef(true);
  useEffect(() => {
    if (firstShapeRef.current) { firstShapeRef.current = false; return; }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    shapeFrameRef.current?.animate(
      [
        { transform: 'scale(1)', boxShadow: '0 0 32px hsl(var(--gold) / 0.18), 0 12px 32px hsl(var(--background) / 0.6)' },
        { transform: 'scale(0.965)', boxShadow: '0 0 48px hsl(var(--gold) / 0.36), 0 12px 32px hsl(var(--background) / 0.6)', offset: 0.3 },
        { transform: 'scale(0.985)', boxShadow: '0 0 60px hsl(var(--gold) / 0.50), 0 12px 32px hsl(var(--background) / 0.6)', offset: 0.5 },
        { transform: 'scale(1.018)', boxShadow: '0 0 44px hsl(var(--gold) / 0.30), 0 12px 32px hsl(var(--background) / 0.6)', offset: 0.7 },
        { transform: 'scale(1)', boxShadow: '0 0 32px hsl(var(--gold) / 0.18), 0 12px 32px hsl(var(--background) / 0.6)' },
      ],
      { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
    shapeHaloRef.current?.animate(
      [
        { opacity: 1, filter: 'brightness(1) saturate(1)' },
        { opacity: 1, filter: 'brightness(1.18) saturate(1.15)', offset: 0.3 },
        { opacity: 1, filter: 'brightness(1.32) saturate(1.25)', offset: 0.5 },
        { opacity: 1, filter: 'brightness(1.18) saturate(1.15)', offset: 0.7 },
        { opacity: 1, filter: 'brightness(1) saturate(1)' },
      ],
      { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }, [circleShape]);

  // ──────────────────────────────────────────────────────────────────
  // Single-letter shortcuts (i / m / f / + / - / Escape).
  // Guarded against text-input focus.
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Allow modifier-free keys only — don't steal Cmd/Ctrl combos.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      const key = e.key;
      const phase = state.phase;

      // Escape — exit fullscreen OR stage. No-op otherwise so other
      // listeners (modal close, etc.) keep working.
      if (key === 'Escape') {
        if (phase === 'fullscreen' || phase === 'stage') {
          e.preventDefault();
          exitFullscreen();
        }
        return;
      }

      // While in fullscreen OR stage, forward nav keys to the deck FIRST.
      // Letter shortcuts (i/m/f/h/1) still work via the fall-through below.
      if (phase === 'fullscreen' || phase === 'stage') {
        if (
          key === 'ArrowRight' ||
          key === 'ArrowDown' ||
          key === 'Enter' ||
          key === ' ' ||
          key === 'PageDown'
        ) {
          // Defer handling to the capture-phase listener installed below;
          // returning here avoids double-fire.
          return;
        }
        if (key === 'ArrowLeft' || key === 'PageUp') {
          return;
        }
      }

      if (key === 'i' || key === 'I') {
        e.preventDefault();
        // 2026-05-02 — `i` is now a HARD suppress: stop all tracks so
        // the camera light goes off and no frames are captured while
        // hidden. Pressing `i` again re-acquires via getUserMedia.
        // (The soft `tray` state remains reachable via `m` / minimize
        // and the tray fan UI — those keep the stream alive on purpose.)
        if (phase === 'on' || phase === 'tray' || phase === 'stage') {
          close();
        } else if (phase === 'fullscreen') {
          exitFullscreen();
          queueMicrotask(() => close());
        } else {
          void show();
        }
        return;
      }
      if (key === 'm' || key === 'M') {
        if (phase !== 'on') return;
        e.preventDefault();
        toggleMinimized();
        return;
      }
      if (key === 'f' || key === 'F') {
        if (!autoFrame.supported) return;
        if (phase !== 'on' && phase !== 'fullscreen') return;
        e.preventDefault();
        autoFrame.toggle();
        return;
      }
      if (key === '+' || key === '=') {
        if (phase !== 'on') return;
        e.preventDefault();
        growSize();
        return;
      }
      if (key === '-' || key === '_') {
        if (phase !== 'on') return;
        e.preventDefault();
        shrinkSize();
        return;
      }
      // v3 — halo toggle. Works from any phase; pure visual flag.
      if (key === 'h' || key === 'H') {
        e.preventDefault();
        toggleHalo();
        return;
      }
      // v3 — stage-fill toggle. Only active from `on` (entering) or
      // `stage` (exiting). Ignored from off/requesting/tray/denied
      // per spec §14.5 — no surprise camera prompts.
      if (key === '1') {
        if (phase !== 'on' && phase !== 'stage') return;
        e.preventDefault();
        toggleStage();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    state.phase,
    hide,
    show,
    close,
    exitFullscreen,
    toggleMinimized,
    autoFrame,
    growSize,
    shrinkSize,
    toggleHalo,
    toggleStage,
  ]);

  // ──────────────────────────────────────────────────────────────────
  // Fullscreen slide-nav passthrough — capture-phase so we beat the
  // deck's own keyboard listener. We push to the action stack BEFORE
  // delegating, then call the registered nav handlers.
  // ──────────────────────────────────────────────────────────────────
  const navHandlersRef = useRef<{
    goNext: () => void;
    goPrev: () => void;
  } | null>(null);
  const ctx = usePresenterWebcam();
  // Stash the ctx fns we use into a ref so the keydown listener stays
  // stable across renders (no add/remove churn on every state change).
  useEffect(() => {
    navHandlersRef.current = {
      goNext: () => ctx.pushFullscreenAction('goNext'),
      goPrev: () => ctx.pushFullscreenAction('goPrev'),
    };
  }, [ctx]);

  useEffect(() => {
    if (state.phase !== 'fullscreen' && state.phase !== 'stage') return;
    const onCaptureKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      const key = e.key;
      const forward =
        key === 'ArrowRight' ||
        key === 'ArrowDown' ||
        key === 'Enter' ||
        key === ' ' ||
        key === 'PageDown';
      const back = key === 'ArrowLeft' || key === 'PageUp';
      if (!forward && !back) return;
      e.preventDefault();
      e.stopPropagation();
      if (forward) {
        pushFullscreenAction('goNext');
        // Forward to deck — the registered NavHandlers run goNext on the
        // mounted SlideDeckPage. We dispatch a custom event the deck
        // listens for instead of calling directly so the wiring stays
        // local to this component.
        window.dispatchEvent(new CustomEvent('riseup:webcam-passthrough', {
          detail: { direction: 'next' },
        }));
      } else {
        // Back — exit fullscreen if the most recent action was the
        // fullscreen entry, else delegate to deck goPrev.
        const last = (window as unknown as { __riseupWebcamLastAction?: string }).__riseupWebcamLastAction;
        if (last === 'enter-fullscreen') {
          exitFullscreen();
        } else {
          pushFullscreenAction('goPrev');
          window.dispatchEvent(new CustomEvent('riseup:webcam-passthrough', {
            detail: { direction: 'prev' },
          }));
        }
      }
    };
    window.addEventListener('keydown', onCaptureKey, true);
    return () => window.removeEventListener('keydown', onCaptureKey, true);
  }, [state.phase, pushFullscreenAction, exitFullscreen]);

  // Mirror the action-stack top into a window flag so the back-key
  // branch above can read it without subscribing to context.
  useEffect(() => {
    if (state.phase === 'fullscreen' || state.phase === 'stage') {
      (window as unknown as { __riseupWebcamLastAction?: string }).__riseupWebcamLastAction =
        'enter-fullscreen';
    } else {
      delete (window as unknown as { __riseupWebcamLastAction?: string }).__riseupWebcamLastAction;
    }
  }, [state.phase]);

  // ──────────────────────────────────────────────────────────────────
  // Bind / rebind the live MediaStream onto every <video> element that
  // currently exists. The same MediaStream can safely feed multiple video
  // elements; never move it exclusively from one surface to another.
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    for (const v of [videoRef.current, fullscreenVideoRef.current]) {
      attachStreamToVideo(v);
    }
  }, [attachStreamToVideo]);

  // ──────────────────────────────────────────────────────────────────
  // Drag math (shared by box header and tray icon).
  // ──────────────────────────────────────────────────────────────────
  const onDragPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        baseX: position.x,
        baseY: position.y,
      };
      setDragging(true);
    },
    [position.x, position.y],
  );
  const onDragPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Wake the cursor on ANY movement over the camera surface — not only
      // while dragging — so a simple hover brings the cursor back (it then
      // auto-hides again after the idle delay). The outer wrapper is
      // pointer-events:none, so this inner-frame handler is the surface's
      // real activity source.
      autoHideCursor.registerActivity(e);
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const scale = readStageScale();
      const dx = (e.clientX - d.startX) / scale;
      const dy = (e.clientY - d.startY) / scale;
      setPosition(d.baseX + dx, d.baseY + dy);
    },
    [autoHideCursor, setPosition],
  );
  const onDragPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    dragRef.current = null;
    setDragging(false);
    // After moving the camera, hide the cursor immediately (it reappears on
    // the next mouse move, then auto-hides again). See useAutoHideCursor.
    autoHideCursor.hideNow(e);
    forceHideCursorNow();
  }, [autoHideCursor, forceHideCursorNow]);

  // ──────────────────────────────────────────────────────────────────
  // Resize math — only width is dragged; height stays 16:9.
  // ──────────────────────────────────────────────────────────────────
  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        baseW: size.w,
      };
      setResizing(true);
    },
    [size.w],
  );
  const onResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      autoHideCursor.registerActivity(e);
      const d = resizeRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const scale = readStageScale();
      const dx = (e.clientX - d.startX) / scale;
      const nextW = Math.max(FREE_MIN_W, Math.min(FREE_MAX_W, d.baseW + dx));
      resizeFree(nextW);
    },
    [autoHideCursor, resizeFree],
  );
  const onResizePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = resizeRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    resizeRef.current = null;
    setResizing(false);
    autoHideCursor.hideNow(e);
    forceHideCursorNow();
  }, [autoHideCursor, forceHideCursorNow]);

  // ──────────────────────────────────────────────────────────────────
  // Render branching.
  // ──────────────────────────────────────────────────────────────────
  if (state.phase === 'tray') {
    // Tray surface — 40×40 icon at top-right of the box's last position.
    const trayX = position.x + size.w - 40;
    const trayY = position.y;
    return (
      <div
        role="region"
        aria-label="Presenter camera (tray)"
        style={{
          position: 'absolute',
          left: trayX,
          top: trayY,
          zIndex: 60,
          // Reserve space for the fan-out chrome to the LEFT of the icon.
          width: 40 + (trayHover ? (28 + 6) * 3 + 8 : 0),
          height: 40,
          display: 'flex',
          flexDirection: 'row-reverse',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'auto',
        }}
        onPointerEnter={() => setTrayHover(true)}
        onPointerLeave={() => setTrayHover(false)}
        onFocus={() => setTrayHover(true)}
        onBlur={() => setTrayHover(false)}
      >
        {/* The icon itself — also a drag handle. */}
        <div
          aria-hidden="false"
          tabIndex={0}
          aria-label="Open camera (or hover for actions)"
          aria-haspopup="menu"
          aria-expanded={trayHover}
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: 12,
            border: '1px solid hsl(var(--gold) / 0.5)',
            background: 'hsl(var(--card) / 0.9)',
            color: 'hsl(var(--cream))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <Camera size={18} />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 6,
              height: 6,
              borderRadius: 999,
              background: 'hsl(var(--ember))',
              boxShadow: '0 0 8px hsl(var(--ember) / 0.7)',
              animation: 'camTrayPulse 1.4s ease-in-out infinite',
            }}
          />
        </div>

        {trayHover && (
          <>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                void show();
              }}
              aria-label="Expand camera"
              title="Expand camera (i)"
              style={trayChromeBtnStyle}
            >
              <Maximize2 size={14} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                void enterFullscreen();
              }}
              aria-label="Fullscreen camera"
              title="Fullscreen"
              style={trayChromeBtnStyle}
            >
              <Expand size={14} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              aria-label="Stop camera"
              title="Stop camera"
              style={{
                ...trayChromeBtnStyle,
                color: 'hsl(var(--ember))',
                borderColor: 'hsl(var(--ember) / 0.5)',
              }}
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // v3 — Stage-fill phase. Same nav-passthrough chrome as fullscreen,
  // but layered as `position: absolute; inset: 0` so it fills the
  // 1920×1080 FitStage rather than the whole browser viewport. When
  // the deck IS in real fullscreen, the stage IS the screen — same
  // visual result. Toggled exclusively by the `1` shortcut. Esc, the
  // Minimize2 button, and another `1` press all exit back to the
  // exact prior size+position+phase via `stageRestoreRef`.
  // ──────────────────────────────────────────────────────────────────
  if (state.phase === 'stage') {
    return (
      <div
        role="region"
        aria-label="Camera stage-fill"
        className={autoHideCursor.hidden ? 'cam-cursor-hidden' : undefined}
        onPointerMove={autoHideCursor.registerActivity}
        onPointerDown={autoHideCursor.registerActivity}
        onWheel={autoHideCursor.registerActivity}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'hsl(0 0% 0%)',
          zIndex: 65,
          cursor: cursorStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
      >
        {/* Wrapper carries the pop animation so the keyframed `transform:
            scale(...)` doesn't clobber the inner <video>'s autoFrame
            transform. Wrapper also owns the border-radius + clip so the
            keyframe's `box-shadow` traces the active shape (circle vs
            square) cleanly against the black stage backdrop. */}
        <div
          ref={shapeFrameRef}
          style={{
            width: circleShape ? 'min(100vmin, 100vh)' : '100%',
            height: circleShape ? 'min(100vmin, 100vh)' : '100%',
            borderRadius: circleShape ? '50%' : 0,
            overflow: 'hidden',
            transition: 'border-radius 360ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <video
            ref={bindFullscreenVideo}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: autoFrame.transform.replace(/$/, ' scaleX(-1)'),
              transformOrigin: 'center center',
              transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => toggleStage()}
            aria-label="Exit stage-fill camera (1 or Esc)"
            title="Exit stage (1 / Esc)"
            style={fullscreenChromeBtnStyle}
          >
            <Minimize2 size={16} />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Stop camera"
            title="Stop camera"
            style={{
              ...fullscreenChromeBtnStyle,
              color: 'hsl(var(--ember))',
              borderColor: 'hsl(var(--ember) / 0.5)',
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'hsl(var(--cream) / 0.6)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          → / Enter advances slides · 1 / Esc exits
        </div>
      </div>
    );
  }

  if (state.phase === 'fullscreen') {
    return (
      <div
        role="region"
        aria-label="Camera fullscreen"
        className={autoHideCursor.hidden ? 'cam-cursor-hidden' : undefined}
        onPointerMove={autoHideCursor.registerActivity}
        onPointerDown={autoHideCursor.registerActivity}
        onWheel={autoHideCursor.registerActivity}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'hsl(0 0% 0%)',
          zIndex: 70,
          cursor: cursorStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // v5 (`]` cinematic cycle, step 1): squish + fade out over 0.8s.
          // The wrapper scales toward zero on Y first (squish), shrinks
          // overall, fades, and tilts slightly — paired with a one-shot
          // `whoosh` cue from the hook.
          transform: cinematicExiting
            ? 'scale(0.18) scaleY(0.04) rotate(-2deg)'
            : 'scale(1) scaleY(1) rotate(0deg)',
          opacity: cinematicExiting ? 0 : 1,
          transition: cinematicExiting
            ? 'transform 800ms cubic-bezier(0.6, -0.05, 0.7, 0.2), opacity 800ms ease-in'
            : 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 240ms ease-out',
          transformOrigin: 'center center',
          willChange: 'transform, opacity',
        }}
      >
        {/* Wrapper carries the pop animation so the keyframed scale
            doesn't clobber the inner <video>'s autoFrame transform.
            Mirror of the stage-fill structure above. */}
        <div
          ref={shapeFrameRef}
          style={{
            width: circleShape ? 'min(100vmin, 100vh)' : '100%',
            height: circleShape ? 'min(100vmin, 100vh)' : '100%',
            borderRadius: circleShape ? '50%' : 0,
            overflow: 'hidden',
            transition: 'border-radius 360ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <video
            ref={bindFullscreenVideo}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: autoFrame.transform.replace(/$/, ' scaleX(-1)'),
              transformOrigin: 'center center',
              transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={exitFullscreen}
            aria-label="Exit fullscreen camera (Esc)"
            title="Exit fullscreen (Esc)"
            style={fullscreenChromeBtnStyle}
          >
            <Minimize2 size={16} />
          </button>
          {autoFrame.supported && (
            <button
              type="button"
              onClick={() => autoFrame.toggle()}
              aria-label={autoFrame.enabled ? 'Disable auto-frame (f)' : 'Enable auto-frame (f)'}
              aria-pressed={autoFrame.enabled}
              title={autoFrame.enabled ? 'Auto-frame ON (f)' : 'Auto-frame OFF (f)'}
              style={{
                ...fullscreenChromeBtnStyle,
                background: autoFrame.enabled
                  ? 'hsl(var(--gold) / 0.85)'
                  : fullscreenChromeBtnStyle.background,
                color: autoFrame.enabled ? 'hsl(var(--background))' : fullscreenChromeBtnStyle.color,
              }}
            >
              <Focus size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={close}
            aria-label="Stop camera"
            title="Stop camera"
            style={{
              ...fullscreenChromeBtnStyle,
              color: 'hsl(var(--ember))',
              borderColor: 'hsl(var(--ember) / 0.5)',
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'hsl(var(--cream) / 0.6)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          → / Enter advances slides · ← exits · Esc exits
        </div>
      </div>
    );
  }

  // Fall through — render full overlay (phase === 'on') or nothing.
  if (state.phase !== 'on') return null;

  const circleDiameter = Math.min(size.w, size.h);
  const visualLeft = circleShape ? position.x + (size.w - circleDiameter) / 2 : position.x;
  const visualTop = circleShape ? position.y + (size.h - circleDiameter) / 2 : position.y;
  const visualWidth = circleShape ? circleDiameter : size.w;
  const visualHeight = circleShape ? circleDiameter : size.h;
  // spec/camera-2026/05 §3a — squircle = superellipse. The cheap, crisp,
  // theme-tinting path is a border-radius superellipse approximation
  // (38% / 34%). Circle (`O`) overrides to 50%; minimized is a puck (999).
  const frameRadius = minimized ? 999 : circleShape ? '50%' : '38% / 34%';
  // spec/camera-2026/05 §2 — the decorative plate sits BEHIND the video and
  // extends ~7% beyond each edge, so a gold-rimmed, soft-shadowed border of
  // the squircle plate shows on all sides and the camera reads as bigger.
  // The implementation uses TWO stacked plates: a lower neutral plate for the
  // soft paper/shadow read, plus the gold plate on top for the branded rim.
  // Hidden while minimized (puck) and while in circle mode (the round crop
  // has its own ring and the squircle plate would not match its silhouette).
  const platePad = Math.round(visualWidth * 0.07);
  const showPlate = !minimized && !circleShape;
  const showCircleControls = !minimized && circleShape;



  return (
    <div
      role="region"
      aria-label="Presenter webcam"
      className="presenter-webcam-overlay"
      onPointerMove={autoHideCursor.registerActivity}
      onPointerDown={autoHideCursor.registerActivity}
      onWheel={autoHideCursor.registerActivity}
      style={{
        position: 'absolute',
        // Outer wrapper always tracks the FULL rectangle footprint. The
        // circle morph happens entirely on the inner frame so the camera
        // never appears to translate independently in two layers.
        left: position.x - HALO,
        top: position.y - HALO,
        width: size.w + HALO * 2,
        height: size.h + HALO * 2,
        zIndex: 60,
        opacity: 1,
        cursor: cursorStyle,
        transformOrigin: 'top right',
        transition: 'opacity 320ms ease-out',
        pointerEvents: 'none',
      }}
    >
      {/*
       * v3 — opt-in vignette halo (replaces v2's blurred-video mirror).
       *
       * Single CSS-only element. No <video>, no `filter: blur` — just a
       * radial gold gradient with a soft mask so the box edge bleeds
       * into the slide background instead of sitting on top as a
       * cloudy patch. Default OFF; toggled by `h` or the Sparkles
       * chrome button. Pointer-events: none so it never intercepts.
       */}
      {haloVisible && (
        <div
          // Halo uses a stable DOM node; the WAAPI pulse above retriggers
          // without a React key, so shape changes never remount video.
          ref={shapeHaloRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            // Halo tracks the inner frame's morph so the gold ring stays
            // wrapped around the visible camera (rectangle OR circle).
            left: circleShape ? (size.w - circleDiameter) / 2 : 0,
            top: circleShape ? (size.h - circleDiameter) / 2 : 0,
            width: (circleShape ? circleDiameter : size.w) + HALO * 2,
            height: (circleShape ? circleDiameter : size.h) + HALO * 2,
            borderRadius: circleShape ? '50%' : 28,
            background:
              'radial-gradient(ellipse at center, hsl(var(--gold) / 0.18) 0%, hsl(var(--gold) / 0.08) 45%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, hsl(0 0% 0% / 1) 30%, hsl(0 0% 0% / 0.4) 65%, hsl(0 0% 0% / 0) 100%)',
            maskImage:
              'radial-gradient(ellipse at center, hsl(0 0% 0% / 1) 30%, hsl(0 0% 0% / 0.4) 65%, hsl(0 0% 0% / 0) 100%)',
            pointerEvents: 'none',
            transition:
              'opacity 240ms ease, left 420ms cubic-bezier(0.22, 1, 0.36, 1), top 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 420ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 420ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      )}
      {/*
       * spec/camera-2026/05 §2 + §6 — decorative squircle PLATE behind the
       * camera. The PNG bakes the squircle curve, the gold→ember rim and the
       * soft drop shadow, so we simply lay it behind the masked video,
       * grown by `platePad` on every side. pointer-events:none so it never
       * intercepts drags; aria-hidden because it is purely decorative.
       */}
      {showPlate && (
        <>
          <img
            src={squirclePlateWhite}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: 'absolute',
              left: HALO - platePad,
              top: HALO - platePad,
              width: visualWidth + platePad * 2,
              height: visualHeight + platePad * 2,
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 0,
              opacity: 0.92,
              transition:
                'left 420ms cubic-bezier(0.22, 1, 0.36, 1), top 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
            }}
          />
          <img
            src={squirclePlateGold}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: 'absolute',
              left: HALO - platePad,
              top: HALO - platePad,
              width: visualWidth + platePad * 2,
              height: visualHeight + platePad * 2,
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 1,
              transition:
                'left 420ms cubic-bezier(0.22, 1, 0.36, 1), top 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 420ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </>
      )}
      {/* Sharp box. */}

      <div
        ref={shapeFrameRef}
        className={autoHideCursor.hidden ? 'cam-cursor-hidden' : undefined}
        style={{
          position: 'absolute',
          zIndex: 2,
          // Inner frame morphs INSIDE the stable outer wrapper. Offsets
          // re-center the circle horizontally/vertically over the same
          // pixel region the rectangle occupied, so the morph reads as a
          // single in-place crop animation instead of two layers moving.
          left: HALO + (circleShape ? (size.w - circleDiameter) / 2 : 0),
          top: HALO + (circleShape ? (size.h - circleDiameter) / 2 : 0),
          width: visualWidth,
          height: visualHeight,
          borderRadius: frameRadius,
          overflow: 'hidden',
          WebkitMaskImage: !minimized && !circleShape ? `url(${squircleMaskBlack})` : undefined,
          maskImage: !minimized && !circleShape ? `url(${squircleMaskBlack})` : undefined,
          WebkitMaskSize: !minimized && !circleShape ? '100% 100%' : undefined,
          maskSize: !minimized && !circleShape ? '100% 100%' : undefined,
          WebkitMaskRepeat: !minimized && !circleShape ? 'no-repeat' : undefined,
          maskRepeat: !minimized && !circleShape ? 'no-repeat' : undefined,
          WebkitMaskPosition: !minimized && !circleShape ? 'center' : undefined,
          maskPosition: !minimized && !circleShape ? 'center' : undefined,
          background: 'hsl(var(--background))',
          border: '1.5px solid hsl(var(--gold) / 0.6)',
          boxShadow:
            '0 0 32px hsl(var(--gold) / 0.18), 0 12px 32px hsl(var(--background) / 0.6)',
          cursor: cursorStyle ?? (dragging ? 'grabbing' : 'grab'),
          userSelect: 'none',
          touchAction: 'none',
          pointerEvents: 'auto',
          willChange: 'border-radius, clip-path, left, top, width, height',
          transition:
            'border-radius 420ms cubic-bezier(0.22, 1, 0.36, 1), left 420ms cubic-bezier(0.22, 1, 0.36, 1), top 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 420ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 320ms ease',
        }}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
      >
        <video
          ref={bindFloatingVideo}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: autoFrame.transform,
            transformOrigin: 'center center',
            transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            background: 'hsl(var(--background))',
            pointerEvents: 'none',
          }}
        />

        {/* Top chrome — Live + grip + chrome buttons. */}
        {!minimized && !circleShape && (
          <div
            style={{
              position: 'absolute',
              inset: '0 0 auto 0',
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              gap: 6,
              background:
                'linear-gradient(to bottom, hsl(var(--background) / 0.7), hsl(var(--background) / 0))',
              color: 'hsl(var(--cream))',
              pointerEvents: 'none',
            }}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.18em] uppercase">
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: 'hsl(var(--ember))',
                  boxShadow: '0 0 8px hsl(var(--ember) / 0.7)',
                }}
              />
              <span>Live</span>
            </div>
            <GripHorizontal
              aria-hidden="true"
              size={14}
              style={{ color: 'hsl(var(--cream) / 0.7)' }}
            />
            <div style={{ display: 'inline-flex', gap: 4, pointerEvents: 'auto' }}>
              <WebcamChromeButton
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  shrinkSize();
                }}
                label="Shrink camera"
                shortcut="-"
                style={chromeBtnStyle}
              >
                <Minus size={11} />
              </WebcamChromeButton>
              <WebcamChromeButton
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  growSize();
                }}
                label="Grow camera"
                shortcut="+"
                style={chromeBtnStyle}
              >
                <Plus size={11} />
              </WebcamChromeButton>
              {autoFrame.supported && (
                <WebcamChromeButton
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    autoFrame.toggle();
                  }}
                  label={autoFrame.enabled ? 'Auto-frame on' : 'Auto-frame off'}
                  shortcut="F"
                  pressed={autoFrame.enabled}
                  style={{
                    ...chromeBtnStyle,
                    background: autoFrame.enabled
                      ? autoFrame.tracking
                        ? 'hsl(var(--gold) / 0.85)'
                        : 'hsl(var(--gold) / 0.45)'
                      : chromeBtnStyle.background,
                    color: autoFrame.enabled ? 'hsl(var(--background))' : chromeBtnStyle.color,
                    borderColor: autoFrame.enabled ? 'hsl(var(--gold))' : chromeBtnStyle.borderColor,
                  }}
                >
                  <Focus size={11} />
                </WebcamChromeButton>
              )}
              {/* v3 — halo (vignette) toggle. Sits between Focus and Expand. */}
              <WebcamChromeButton
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHalo();
                }}
                label={haloVisible ? 'Glow halo on' : 'Glow halo off'}
                shortcut="H"
                pressed={haloVisible}
                style={{
                  ...chromeBtnStyle,
                  background: haloVisible
                    ? 'hsl(var(--gold) / 0.45)'
                    : chromeBtnStyle.background,
                  color: haloVisible ? 'hsl(var(--background))' : chromeBtnStyle.color,
                  borderColor: haloVisible ? 'hsl(var(--gold))' : chromeBtnStyle.borderColor,
                }}
              >
                <Sparkles size={11} />
              </WebcamChromeButton>
              {/* v5 — circle/rectangle frame mode toggle. Persisted across
                * reloads via usePresenterWebcam's CIRCLE_KEY. Icon swaps to
                * communicate current mode at a glance: Circle = "currently
                * round, click to make rectangular", Square vice-versa. */}
              <WebcamChromeButton
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  cycleShapeOverlay();
                }}
                label="Cycle frame shaping"
                shortcut="O"
                pressed={circleShape}
                style={{
                  ...chromeBtnStyle,
                  background: circleShape
                    ? 'hsl(var(--gold) / 0.45)'
                    : chromeBtnStyle.background,
                  color: circleShape ? 'hsl(var(--background))' : chromeBtnStyle.color,
                  borderColor: circleShape ? 'hsl(var(--gold))' : chromeBtnStyle.borderColor,
                }}
              >
                {circleShape ? <Circle size={11} /> : <Square size={11} />}
              </WebcamChromeButton>
              <WebcamChromeButton
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  void enterFullscreen();
                }}
                label="Fullscreen camera"
                shortcut="P"
                style={chromeBtnStyle}
              >
                <Expand size={11} />
              </WebcamChromeButton>
              <WebcamChromeButton
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimized();
                }}
                label="Minimize camera"
                shortcut="M"
                style={chromeBtnStyle}
              >
                <Minimize2 size={11} />
              </WebcamChromeButton>
              <WebcamChromeButton
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  hide();
                }}
                label="Hide to tray"
                shortcut="I"
                style={chromeBtnStyle}
              >
                <Camera size={11} />
              </WebcamChromeButton>
              <WebcamChromeButton
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                }}
                label="Stop camera"
                style={chromeBtnStyle}
              >
                <X size={12} />
              </WebcamChromeButton>
            </div>
          </div>
        )}

        {showCircleControls && (
          <div
            style={{
              position: 'absolute',
              left: HALO + (size.w - circleDiameter) / 2 + circleDiameter + 12,
              top: HALO + Math.max(10, circleDiameter / 2 - 96),
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              pointerEvents: 'auto',
            }}
          >
            <WebcamChromeButton
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                growSize();
              }}
              label="Grow camera"
              shortcut="+"
              side="left"
              style={circleChromeBtnStyle}
            >
              <Plus size={16} />
            </WebcamChromeButton>
            <WebcamChromeButton
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                shrinkSize();
              }}
              label="Shrink camera"
              shortcut="-"
              side="left"
              style={circleChromeBtnStyle}
            >
              <Minus size={16} />
            </WebcamChromeButton>
            <WebcamChromeButton
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                toggleMinimized();
              }}
              label="Minimize camera"
              shortcut="M"
              side="left"
              style={circleChromeBtnStyle}
            >
              <Minimize2 size={16} />
            </WebcamChromeButton>
            <WebcamChromeButton
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              label="Stop camera"
              side="left"
              style={{
                ...circleChromeBtnStyle,
                background: 'hsl(var(--destructive) / 0.16)',
                borderColor: 'hsl(var(--destructive) / 0.45)',
                color: 'hsl(var(--cream))',
              }}
            >
              <X size={18} />
            </WebcamChromeButton>
          </div>
        )}

        {/* Resize handle — bottom-right corner, only when not minimized. */}
        {!minimized && !circleShape && (
          <div
            role="slider"
            tabIndex={0}
            aria-label="Resize camera"
            aria-valuemin={FREE_MIN_W}
            aria-valuemax={FREE_MAX_W}
            aria-valuenow={size.w}
            aria-orientation="horizontal"
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerCancel={onResizePointerUp}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 32 : 8;
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                resizeFree(size.w + step);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                resizeFree(size.w - step);
              }
            }}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 18,
              height: 18,
              cursor: cursorStyle ?? (resizing ? 'nwse-resize' : 'nwse-resize'),
              touchAction: 'none',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              padding: 3,
              color: 'hsl(var(--gold) / 0.7)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path
                d="M2 8 L8 2 M5 8 L8 5 M8 8 L8 8"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        {/* Minimized puck affordance. */}
        {minimized && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimized();
            }}
            aria-label="Expand camera (m)"
            title="Expand (m)"
            style={{
              position: 'absolute',
              right: 4,
              bottom: 4,
              width: 22,
              height: 22,
              borderRadius: 999,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card) / 0.9)',
              color: 'hsl(var(--cream))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            <Maximize2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

const chromeBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  borderRadius: 999,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card) / 0.85)',
  color: 'hsl(var(--cream))',
  cursor: 'pointer',
};

const circleChromeBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 999,
  border: '1px solid hsl(var(--gold) / 0.45)',
  background: 'hsl(var(--card) / 0.94)',
  color: 'hsl(var(--cream))',
  cursor: 'pointer',
  boxShadow: '0 10px 22px -12px hsl(var(--background) / 0.9), 0 0 0 1px hsl(var(--gold) / 0.08)',
};

const trayChromeBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 999,
  border: '1px solid hsl(var(--gold) / 0.5)',
  background: 'hsl(var(--card) / 0.9)',
  color: 'hsl(var(--cream))',
  cursor: 'pointer',
};

const fullscreenChromeBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 999,
  border: '1px solid hsl(var(--gold) / 0.5)',
  background: 'hsl(0 0% 0% / 0.65)',
  color: 'hsl(var(--cream))',
  cursor: 'pointer',
};
