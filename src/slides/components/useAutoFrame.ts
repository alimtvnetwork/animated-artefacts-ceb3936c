/**
 * useAutoFrame — face-tracking framing for the presenter webcam.
 *
 * Why
 * ---
 * Presenters drift left/right while speaking. With a static crop, they walk
 * out of the rectangle. Auto-frame detects the largest face every ~250ms
 * and smoothly translates+scales the inner <video> so the face stays
 * centered, mimicking a Center Stage / Continuity Camera effect.
 *
 * Implementation
 * --------------
 * Uses the browser-native `FaceDetector` API (Chromium desktop). When
 * unavailable (Firefox / Safari / mobile) the hook degrades to a no-op:
 * `supported` is false, transform stays identity, and the toggle button
 * is rendered disabled. We deliberately avoid MediaPipe / TF.js to keep
 * the bundle slim — face-detection here is a polish feature, not core.
 *
 * Smoothing
 * ---------
 * Raw detection coords jitter ±5–10px frame to frame. We run an EMA with
 * α=0.18 against the target translate/scale so motion looks like a
 * gimbal, not a strobe. When detection is lost for more than 3 ticks we
 * ease back toward identity rather than freezing on a stale offset.
 *
 * Wiring
 * ------
 *   const { transform, supported, enabled, toggle } = useAutoFrame(stream, mirrored);
 *   <video style={{ transform }} />
 *
 * The `mirrored` flag matters: the camera box mirrors the video via
 * `scaleX(-1)`, so any horizontal offset we compute must be negated to
 * follow the visible face position.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'riseup.webcam.autoframe';
const DETECT_INTERVAL_MS = 250;
const EMA_ALPHA = 0.18;
const TARGET_FACE_HEIGHT_RATIO = 0.55; // face should occupy ~55% of the box height
const MAX_SCALE = 1.6;
const MIN_SCALE = 1.0;
const LOST_TICKS_BEFORE_RESET = 3;

// Subset of the (still non-standard) FaceDetector interface we use.
interface FaceDetectorCtor {
  new (init?: { fastMode?: boolean; maxDetectedFaces?: number }): {
    detect(source: CanvasImageSource): Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
  };
}

function getFaceDetectorCtor(): FaceDetectorCtor | null {
  if (typeof window === 'undefined') return null;
  const ctor = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector;
  return typeof ctor === 'function' ? ctor : null;
}

export interface AutoFrameResult {
  /** CSS transform string to apply to the inner <video>. Includes mirror flip. */
  transform: string;
  /** Browser supports the underlying FaceDetector API. */
  supported: boolean;
  /** User has auto-frame turned on. */
  enabled: boolean;
  /** A face was detected within the last few ticks. */
  tracking: boolean;
  /** Toggle on/off — persists to localStorage. */
  toggle: () => void;
}

function readInitialEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function useAutoFrame(
  stream: MediaStream | null,
  mirrored: boolean,
): AutoFrameResult {
  const [supported] = useState<boolean>(() => getFaceDetectorCtor() !== null);
  const [enabled, setEnabled] = useState<boolean>(readInitialEnabled);
  const [tracking, setTracking] = useState<boolean>(false);
  const [transform, setTransform] = useState<string>(
    mirrored ? 'scaleX(-1)' : 'none',
  );

  // Smoothed offsets in *unmirrored* video coordinate space, normalized
  // to [-0.5, 0.5] of the crop box. Scale is a multiplier ≥ 1.
  const smoothedRef = useRef({ tx: 0, ty: 0, scale: 1 });
  const lostTicksRef = useRef(0);

  const toggle = useCallback(() => {
    setEnabled((cur) => {
      const next = !cur;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Update transform string whenever the mirror flag flips OR when the
  // user disables tracking — keeps the live video at identity transform.
  useEffect(() => {
    if (!enabled || !supported) {
      setTransform(mirrored ? 'scaleX(-1)' : 'none');
      smoothedRef.current = { tx: 0, ty: 0, scale: 1 };
      lostTicksRef.current = 0;
      setTracking(false);
    }
  }, [enabled, supported, mirrored]);

  // Detection loop. Mounts a hidden <video> + canvas pair so the source
  // never has to be the on-screen <video> (which the overlay already
  // mirrors with CSS — sampling that would add layout coupling).
  useEffect(() => {
    if (!enabled || !supported || !stream) return;
    const ctor = getFaceDetectorCtor();
    if (!ctor) return;

    const detector = new ctor({ fastMode: true, maxDetectedFaces: 1 });
    const offscreenVideo = document.createElement('video');
    offscreenVideo.muted = true;
    offscreenVideo.playsInline = true;
    offscreenVideo.srcObject = stream;
    void offscreenVideo.play().catch(() => {
      /* autoplay blocked — already had a user gesture for the live overlay */
    });

    // Scratch canvas — small (downscale to ≤320px wide) to keep detect()
    // fast even on integrated GPUs.
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let cancelled = false;
    let timer: number | null = null;

    const tick = async () => {
      if (cancelled) return;
      try {
        const vw = offscreenVideo.videoWidth;
        const vh = offscreenVideo.videoHeight;
        if (vw === 0 || vh === 0 || !ctx) {
          schedule();
          return;
        }
        // Downscale snapshot for cheap detection.
        const targetW = 320;
        const targetH = Math.round((vh / vw) * targetW);
        if (canvas.width !== targetW) canvas.width = targetW;
        if (canvas.height !== targetH) canvas.height = targetH;
        ctx.drawImage(offscreenVideo, 0, 0, targetW, targetH);

        const faces = await detector.detect(canvas);
        if (cancelled) return;

        if (faces.length > 0) {
          // Pick the largest face (closest to camera).
          const face = faces.reduce((best, f) =>
            f.boundingBox.width * f.boundingBox.height >
            best.boundingBox.width * best.boundingBox.height
              ? f
              : best,
          );
          const bb = face.boundingBox;
          // Normalized face center in [0, 1] in unmirrored video coords.
          const cx = (bb.x + bb.width / 2) / targetW;
          const cy = (bb.y + bb.height / 2) / targetH;
          // Translate so center is at viewport center → offset from 0.5.
          const targetTx = 0.5 - cx;
          const targetTy = 0.5 - cy;
          // Zoom so the face fills TARGET_FACE_HEIGHT_RATIO of the box.
          const faceFraction = bb.height / targetH;
          const rawScale = TARGET_FACE_HEIGHT_RATIO / Math.max(faceFraction, 0.05);
          const targetScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, rawScale));

          const s = smoothedRef.current;
          s.tx = s.tx + (targetTx - s.tx) * EMA_ALPHA;
          s.ty = s.ty + (targetTy - s.ty) * EMA_ALPHA;
          s.scale = s.scale + (targetScale - s.scale) * EMA_ALPHA;
          lostTicksRef.current = 0;
          setTracking(true);
        } else {
          lostTicksRef.current += 1;
          if (lostTicksRef.current > LOST_TICKS_BEFORE_RESET) {
            // Ease back to identity rather than freezing.
            const s = smoothedRef.current;
            s.tx = s.tx * (1 - EMA_ALPHA);
            s.ty = s.ty * (1 - EMA_ALPHA);
            s.scale = s.scale + (1 - s.scale) * EMA_ALPHA;
            setTracking(false);
          }
        }

        // Compose CSS transform. The visible video is mirrored, so the
        // tx must be flipped sign-wise to follow the on-screen face.
        const s = smoothedRef.current;
        // tx/ty are normalized (-0.5..0.5); convert to percentage shift.
        const txPct = (mirrored ? -s.tx : s.tx) * 100;
        const tyPct = s.ty * 100;
        const mirrorPart = mirrored ? 'scaleX(-1) ' : '';
        setTransform(
          `${mirrorPart}translate(${txPct.toFixed(2)}%, ${tyPct.toFixed(2)}%) scale(${s.scale.toFixed(3)})`,
        );
      } catch {
        /* detect() can throw on tab visibility changes — swallow & retry next tick */
      }
      schedule();
    };

    const schedule = () => {
      if (cancelled) return;
      timer = window.setTimeout(tick, DETECT_INTERVAL_MS);
    };

    // Kick off after the offscreen video reports dimensions.
    const onMeta = () => {
      schedule();
    };
    if (offscreenVideo.readyState >= 1) onMeta();
    else offscreenVideo.addEventListener('loadedmetadata', onMeta, { once: true });

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      offscreenVideo.srcObject = null;
      offscreenVideo.removeEventListener('loadedmetadata', onMeta);
    };
  }, [enabled, supported, stream, mirrored]);

  return { transform, supported, enabled, tracking, toggle };
}
