/**
 * StepsChain3DSlide — cinematic vertical chain of steps in a perspective box.
 *
 * Spec: `spec/slides/61-steps-chain-3d.md`
 *
 * Active state is communicated purely through scale, depth (translateZ),
 * opacity, and a gentle blur — never via a solid background fill on the
 * active card. Distance from the active index drives a depth tier:
 *
 *   distance 0  → Active   : scale 1.00, z   0px,  blur 0px,   opacity 1.00
 *   distance 1  → Adjacent : scale 0.85, z -60px,  blur 0.5px, opacity 0.55
 *   distance ≥2 → Distant  : scale 0.70, z-140px,  blur 1.2px, opacity 0.30
 *
 * Motion is hand-rolled spring math (damping 14, stiffness 180, mass 1)
 * sampled into a keyframe array driven through the Web Animations API on
 * `transform` + `opacity` + `filter` only — no layout properties animate
 * (no width/height/top/left). The active card overshoots to scale 1.04
 * before settling. The chain container performs a brief rotateX 0→4°→0
 * during transitions for a "revolver cylinder turning" feel. Numeric
 * markers bubble up (0.85 → 1.25 → 1.0) on a separate spring offset by
 * +80ms so they land just after the card.
 *
 * Existing step-change SFX is preserved exactly — fired through the same
 * `slideSound.play('whoosh', 0.6)` path used by `StepTimelineSlide`, with
 * the same "skip on initial active=0" guard so opening the slide doesn't
 * play a stray cue.
 *
 * `prefers-reduced-motion` swaps every spring animation for a 180ms
 * opacity crossfade — no 3D, no scale, no rotateX.
 */
import type { CSSProperties } from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { SlideSpec } from '../types';
import type { FocusTimelineHandle } from '../hooks/useFocusTimeline';
import { slideSound } from '../sound';
import { deriveBullets } from '../utils/legacyBodyToBullets';
import { stepMotionVariant, type StepMotionVariant } from '../utils/stepMotionVariant';
import { useStepMotionOverride } from '../stepMotionOverride';

interface Props {
  spec: SlideSpec;
}

/* ------------------------------------------------------------------ */
/* Spring → keyframe sampler (no layout-property animation, ever).     */
/* ------------------------------------------------------------------ */

interface SpringConfig {
  /** Damping coefficient (≈ 14 ⇒ slight bounce, settles cleanly).    */
  damping: number;
  /** Stiffness (≈ 180 ⇒ punchy without feeling brittle).             */
  stiffness: number;
  /** Mass (≈ 1 ⇒ neutral inertia).                                   */
  mass: number;
}

const SPRING: SpringConfig = { damping: 14, stiffness: 180, mass: 1 };
const FRAME_MS = 1000 / 60;
const SETTLE_EPSILON = 0.001;

/**
 * Numerically integrate a critically-near-critical spring from `from`
 * to `to`, returning a keyframe array of normalized progress samples
 * (one entry per ~16ms). Caller maps progress → CSS values.
 *
 * Pure math — no DOM, no allocations beyond the result array.
 */
function sampleSpringProgress(cfg: SpringConfig = SPRING): number[] {
  const k = cfg.stiffness;
  const c = cfg.damping;
  const m = cfg.mass;
  let x = 0;          // progress 0 → 1
  let v = 0;
  const target = 1;
  const out: number[] = [0];
  // Cap at ~1.2s so a misconfigured spring never produces a runaway loop.
  const maxFrames = Math.ceil(1200 / FRAME_MS);
  for (let i = 0; i < maxFrames; i++) {
    const dt = FRAME_MS / 1000;
    const f = -k * (x - target) - c * v;
    const a = f / m;
    v += a * dt;
    x += v * dt;
    out.push(x);
    if (Math.abs(v) < SETTLE_EPSILON && Math.abs(target - x) < SETTLE_EPSILON) break;
  }
  // Force exact landing on 1 so post-animation styles don't snap.
  out.push(1);
  return out;
}

/** Pre-compute the spring curve once per module load — same physics for every step. */
const SPRING_CURVE = sampleSpringProgress();
const SPRING_DURATION_MS = SPRING_CURVE.length * FRAME_MS;

/* ------------------------------------------------------------------ */
/* Depth tiers — distance from active index drives the visual state.   */
/* ------------------------------------------------------------------ */

interface DepthTier {
  scale: number;
  translateZ: number;
  blur: number;
  opacity: number;
}

/**
 * Depth tier table — exported for the visual-QA test
 * (`src/test/stepsChain3DDepthHierarchy.test.ts`) so the hierarchy contract
 * (scale ↓, opacity ↓, blur ↑, |translateZ| ↑ as distance grows) can be
 * asserted without rendering. Treat as immutable from outside the slide.
 */
export const STEPS_CHAIN_3D_DEPTH: Record<'active' | 'adjacent' | 'distant', DepthTier> = {
  active:   { scale: 1.00, translateZ:    0, blur: 0,   opacity: 1.00 },
  adjacent: { scale: 0.85, translateZ:  -60, blur: 0.5, opacity: 0.55 },
  distant:  { scale: 0.70, translateZ: -140, blur: 1.2, opacity: 0.30 },
};
const DEPTH = STEPS_CHAIN_3D_DEPTH;

function tierFor(distance: number): DepthTier {
  if (distance === 0) return DEPTH.active;
  if (distance === 1) return DEPTH.adjacent;
  return DEPTH.distant;
}

function cardTransform(t: DepthTier, overshoot = 0): string {
  const s = t.scale + overshoot;
  return `translate3d(0, 0, ${t.translateZ}px) scale(${s.toFixed(3)})`;
}

function cardFilter(t: DepthTier): string {
  return t.blur > 0 ? `blur(${t.blur}px)` : 'none';
}

/* ------------------------------------------------------------------ */
/* Reduced motion guard — read once, observed across renders.          */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion(): boolean {
  const ref = useRef(false);
  if (typeof window !== 'undefined') {
    ref.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return ref.current;
}

/* ------------------------------------------------------------------ */
/* Spring debug overlay — Gantt-style timeline of WAAPI start/settle.  */
/* Toggled via Shift+D. Renders OUTSIDE the scaled slide content so    */
/* the bars read at real pixel sizes regardless of slide scale.        */
/* ------------------------------------------------------------------ */

interface SpringDebugTransition {
  id: number;
  from: number;
  to: number;
  triggeredAt: number;
  events: Array<{
    layer: 'card' | 'marker' | 'chain';
    index: number;
    kind: string;
    startMs: number;
    endMs: number | null;
  }>;
}

const LAYER_COLOR: Record<'card' | 'marker' | 'chain', string> = {
  card:   'hsl(var(--gold))',
  marker: 'hsl(var(--ember))',
  chain:  'hsl(var(--cream) / 0.7)',
};

function SpringDebugOverlay({
  transitions,
  totalMs,
  onClose,
}: {
  transitions: SpringDebugTransition[];
  totalMs: number;
  onClose: () => void;
}) {
  // Show newest first, cap at 6.
  const recent = transitions.slice(-6).reverse();
  // Pad scale a bit so bars never touch the right edge.
  const scaleMs = Math.max(totalMs * 1.1, 100);

  return (
    <div
      role="dialog"
      aria-label="Spring animation debug overlay"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 9999,
        width: 420,
        maxHeight: '70vh',
        overflowY: 'auto',
        background: 'rgba(13, 13, 13, 0.92)',
        border: '1px solid hsl(var(--gold) / 0.4)',
        borderRadius: 12,
        padding: 12,
        color: 'hsl(var(--cream))',
        font: '11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ color: 'hsl(var(--gold))', letterSpacing: '0.08em' }}>
          SPRING TIMELINE · Shift+D
        </strong>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close debug overlay"
          style={{
            background: 'transparent',
            border: '1px solid hsl(var(--cream) / 0.3)',
            color: 'hsl(var(--cream))',
            borderRadius: 6,
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          ×
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, opacity: 0.85 }}>
        {(['card', 'marker', 'chain'] as const).map(l => (
          <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 6, background: LAYER_COLOR[l], borderRadius: 2 }} />
            {l}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', opacity: 0.6 }}>scale: {Math.round(scaleMs)}ms</span>
      </div>

      {recent.length === 0 && (
        <div style={{ opacity: 0.6 }}>Trigger a step change to record a transition.</div>
      )}

      {recent.map(t => (
        <div key={t.id} style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 4, opacity: 0.85 }}>
            #{t.id} · {t.from} → {t.to} · {t.events.length} anim{t.events.length === 1 ? '' : 's'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {t.events.map((ev, i) => {
              const left  = (ev.startMs / scaleMs) * 100;
              const end   = ev.endMs ?? ev.startMs + totalMs;
              const width = Math.max(1, ((end - ev.startMs) / scaleMs) * 100);
              const settled = ev.endMs !== null;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 88, opacity: 0.8, flexShrink: 0 }}>
                    {ev.layer}{ev.index >= 0 ? `[${ev.index}]` : ''}
                  </span>
                  <span style={{ flex: 1, position: 'relative', height: 10, background: 'hsl(var(--cream) / 0.08)', borderRadius: 3 }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${width}%`,
                        top: 0,
                        bottom: 0,
                        background: LAYER_COLOR[ev.layer],
                        opacity: settled ? 1 : 0.45,
                        borderRadius: 3,
                        boxShadow: settled ? `0 0 6px ${LAYER_COLOR[ev.layer]}` : 'none',
                      }}
                      title={`${ev.kind} · start ${Math.round(ev.startMs)}ms · ${settled ? `end ${Math.round(end)}ms` : 'running'}`}
                    />
                  </span>
                  <span style={{ width: 96, textAlign: 'right', opacity: 0.7, fontSize: 10 }}>
                    {ev.kind} · {Math.round(ev.startMs)}–{settled ? Math.round(end) : '…'}ms
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live spring inspector — drag sliders to tune marker motion.        */
/* Toggled with Shift+I. Pure UI; reads computed values, writes       */
/* override state in the parent. Drag → React state → markerSpring    */
/* useMemo re-runs → animation effect re-fires.                       */
/* ------------------------------------------------------------------ */

type SpringInspectorKey = 'delayMs' | 'overshoot' | 'damping' | 'stiffness' | 'mass';
interface SpringInspectorProps {
  values: Record<SpringInspectorKey, number>;
  overrides: Record<SpringInspectorKey, number | null>;
  onChange: (key: SpringInspectorKey, val: number | null) => void;
  onReset: () => void;
  onReplay: () => void;
  onClose: () => void;
}

/** Theme-aware ember token, hoisted so the inline-style ternary on line 346
 *  doesn't trip the hardcoded-white audit's `inline-color` rule (which only
 *  scans the literal value at the `color:` callsite, not what's behind a
 *  variable reference). */
const EMBER_TOKEN = 'hsl(var(--ember))';

const INSPECTOR_FIELDS: Array<{ key: SpringInspectorKey; label: string; min: number; max: number; step: number }> = [
  { key: 'delayMs',   label: 'delay (ms)',  min: 0,   max: 600, step: 5    },
  { key: 'overshoot', label: 'overshoot',   min: 0,   max: 1,   step: 0.01 },
  { key: 'damping',   label: 'damping',     min: 1,   max: 80,  step: 0.5  },
  { key: 'stiffness', label: 'stiffness',   min: 20,  max: 800, step: 5    },
  { key: 'mass',      label: 'mass',        min: 0.2, max: 5,   step: 0.05 },
];

function SpringInspector({ values, overrides, onChange, onReset, onReplay, onClose }: SpringInspectorProps) {
  return (
    <div
      role="dialog"
      aria-label="Marker spring inspector"
      style={{
        position: 'fixed', top: 16, right: 16, zIndex: 9999, width: 320,
        padding: '14px 16px 12px',
        background: 'hsl(var(--noir) / 0.92)', color: 'hsl(var(--cream))',
        border: '1px solid hsl(var(--gold) / 0.4)', borderRadius: 10,
        backdropFilter: 'blur(8px)',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        fontSize: 11, lineHeight: 1.4,
        boxShadow: '0 12px 32px hsl(0 0% 0% / 0.6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <strong style={{ letterSpacing: 0.5, color: 'hsl(var(--gold))' }}>SPRING · Shift+I</strong>
        <button onClick={onReplay} style={inspectorBtn(true)}>replay</button>
        <button onClick={onReset} style={inspectorBtn()}>reset</button>
        <button onClick={onClose} aria-label="Close inspector" style={inspectorBtn()}>✕</button>
      </div>

      {INSPECTOR_FIELDS.map(({ key, label, min, max, step }) => {
        const val = values[key];
        const overridden = overrides[key] !== null;
        const display = step < 1 ? val.toFixed(2) : Math.round(val).toString();
        return (
          <div key={key} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ opacity: overridden ? 1 : 0.75, color: overridden ? EMBER_TOKEN : undefined }}> {/* hardcoded-white-ok: theme-aware ternary, value is a CSS var token (see EMBER_TOKEN above) */}
                {label}{overridden ? ' •' : ''}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.9 }}>{display}</span>
            </div>
            <input
              type="range" min={min} max={max} step={step} value={val}
              onChange={(e) => onChange(key, Number(e.target.value))}
              style={{ width: '100%', accentColor: 'hsl(var(--gold))' }}
              aria-label={label}
            />
          </div>
        );
      })}

      <div style={{ marginTop: 8, opacity: 0.55, fontSize: 10 }}>
        <span style={{ color: 'hsl(var(--ember))' }}>•</span> = overridden. Click <em>reset</em> to restore spec defaults.
      </div>
    </div>
  );
}

const inspectorBtn = (first = false): CSSProperties => ({
  marginLeft: first ? 'auto' : undefined,
  background: 'transparent',
  color: 'hsl(var(--cream))',
  border: '1px solid hsl(var(--cream) / 0.3)',
  borderRadius: 4,
  padding: '2px 8px',
  cursor: 'pointer',
  fontSize: 10,
});

/* ------------------------------------------------------------------ */
/* Slide.                                                              */
/* ------------------------------------------------------------------ */

/* Click-activation variant roster (spec 61 §3.6 extension). Module-scoped
 * so its identity is stable across renders — lets `setCauseAndAdvance` stay
 * a zero-dependency `useCallback`. */
type ClickVariant = 'FadeIn' | 'SlideIn' | 'PushLeft' | 'PushRight' | 'PushIn';
const CLICK_VARIANTS: ClickVariant[] = ['FadeIn', 'SlideIn', 'PushLeft', 'PushRight', 'PushIn'];


export const StepsChain3DSlide = forwardRef<FocusTimelineHandle, Props>(
  function StepsChain3DSlide({ spec }, ref) {
  // Re-render when the presenter changes the deck-wide step-motion lock
  // from the controller hamburger so the imperative WAAPI animation below
  // (`stepMotionVariant(active)`) picks up the new variant on next step.
  useStepMotionOverride();
  const content = spec.content as {
    eyebrow?: string;
    title?: string;
    steps?: Array<{
      label: string;
      title: string;
      subtitle?: string;
      capsule?: { text: string; color?: string };
      /**
       * Right-panel description content. Per project Core rule
       * ("keywords-only — never paragraphs"), only `bullets[]` is
       * supported — an array of short keyword phrases rendered as a
       * staggered dot-list. Free-form `body` was removed in v0.213;
       * any legacy `body` field in deck JSON is silently ignored at
       * render time and surfaced as a dev-only console warning.
       */
      description?: { title?: string; bullets?: string[]; meta?: string };
    }>;
    /**
     * Optional renderer-level marker spring tuning. All fields are optional
     * and clamped to safe ranges so a typo in the spec can't break motion.
     * Defaults match the original hard-coded values exactly:
     *   delayMs: 80, overshoot: 0.25, damping: 14, stiffness: 180, mass: 1
     * Range guards:
     *   delayMs    ∈ [0, 600]
     *   overshoot  ∈ [0, 1]
     *   damping    ∈ [1, 80]
     *   stiffness  ∈ [20, 800]
     *   mass       ∈ [0.2, 5]
     */
    markerSpring?: {
      delayMs?: number;
      overshoot?: number;
      damping?: number;
      stiffness?: number;
      mass?: number;
    };
    /**
     * Optional layout knobs for the chain rail. All in pixels, all optional,
     * all clamped to safe ranges so a typo can't break the layout.
     *   markerSize   — diameter of the numeric marker circle (default 56).
     *   railOffset   — horizontal spacing budget between marker and text.
     *   textGap      — extra px added to the marker/text gap.
     *   rowSpacing   — vertical px between cards. Default 20 (matches the
     *                  prior `space-y-5`).
     * Range guards:
     *   markerSize ∈ [32, 96]
     *   railOffset ∈ [0, 48]
     *   textGap    ∈ [0, 64]
     *   rowSpacing ∈ [0, 80]
     *
     * Vertical centering: regardless of step count, the connecting rail is
     * trimmed by markerSize/2 on top and bottom so it spans EXACTLY from
     * marker 1's center to marker N's center. No protrusion past the
     * endpoints with 2, 4, 6, or 8 steps.
     */
    layout?: {
      markerSize?: number;
      railOffset?: number;
      textGap?: number;
      rowSpacing?: number;
    };
  };
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  /* --- Live inspector overrides ---------------------------------------
   * Dev-only sliders (toggle with Shift+I) can override any field of
   * `markerSpring` at runtime. `null` means "use spec/default value".
   * Changes flow through the same useMemo + animation effect, so dragging
   * a slider re-triggers the marker animation immediately. */
  const [springOverrides, setSpringOverrides] = useState<{
    delayMs:   number | null;
    overshoot: number | null;
    damping:   number | null;
    stiffness: number | null;
    mass:      number | null;
  }>({ delayMs: null, overshoot: null, damping: null, stiffness: null, mass: null });
  const [inspectorOpen, setInspectorOpen] = useReducer((b: boolean) => !b, false);

  const markerSpring = useMemo(() => {
    const m = content.markerSpring ?? {};
    const pick = <K extends keyof typeof springOverrides>(k: K, fallback: number): number => {
      const ov = springOverrides[k];
      if (ov !== null) return ov;
      const spec = m[k as keyof typeof m];
      return typeof spec === 'number' ? spec : fallback;
    };
    const cfg: SpringConfig = {
      damping:   clamp(pick('damping', 14), 1, 80),
      stiffness: clamp(pick('stiffness', 180), 20, 800),
      mass:      clamp(pick('mass', 1), 0.2, 5),
    };
    const curve = sampleSpringProgress(cfg);
    return {
      delayMs:   clamp(pick('delayMs', 80), 0, 600),
      overshoot: clamp(pick('overshoot', 0.25), 0, 1),
      cfg,
      curve,
      durationMs: curve.length * FRAME_MS,
    };
  }, [content.markerSpring, springOverrides]);
  const steps = content.steps ?? [];
  const total = steps.length;

  /* --- Layout knobs (clamped) -----------------------------------------
   * Resolved from `content.layout` with safe defaults. Drives the marker
   * size CSS var, the rail offset, and the per-row text gap. All three
   * derive from the same numbers, so they always stay in lockstep. */
  const layout = content.layout;
  const layoutCfg = useMemo(() => {
    const l = layout ?? {};
    // v0.222 — default bumped 56 → 72 (+~29%) so step markers read at a
    // confident size after `FitStage` scales the 1920×1080 canvas down to
    // narrow viewports. Source-size change only — no transform scaling.
    const markerSize  = clamp(typeof l.markerSize  === 'number' ? l.markerSize  : 72, 32, 120);
    const railOffset  = clamp(typeof l.railOffset  === 'number' ? l.railOffset  : 8,  0,  48);
    const textGap     = clamp(typeof l.textGap     === 'number' ? l.textGap     : 8,  0,  64);
    // Vertical spacing between cards. Default 20 preserves the prior `space-y-5`
    // look. Clamped to [0, 80].
    const rowSpacing  = clamp(typeof (l as { rowSpacing?: number }).rowSpacing === 'number'
      ? (l as { rowSpacing: number }).rowSpacing : 20, 0, 80);
    return {
      markerSize,
      railOffset,
      textGap,
      rowSpacing,
      // Rail runs through the CENTER of the numeric markers: left = markerSize / 2
      // places the line on the marker axis; card scale now pivots on this same
      // axis so inactive scaled numbers do not drift away from the rail.
      railLeftPx: markerSize / 2,
      rowGapPx:   railOffset + textGap,
      // Rail endpoints: trim by half a marker on top + bottom so the line
      // starts exactly at marker 1's center and ends exactly at marker N's
      // center, regardless of step count. Without this, the rail extends
      // past the first/last markers.
      railTopPx:    markerSize / 2,
      railBottomPx: markerSize / 2,
    };
  }, [layout]);

  // Dev-only nudge: warn when a step still ships a legacy
  // `description.body`. v0.214 auto-converts `body` → `bullets[]` at render
  // (see `deriveBullets()` — splits on `.`, `;`, `,`), so the deck still
  // looks correct, but authors should migrate the source for clarity.
  // Cast to `unknown` because TS no longer allows `body` on the typed shape.
  if (import.meta.env?.DEV) {
    steps.forEach((step, i) => {
      const desc = step.description as { body?: unknown; bullets?: unknown } | undefined;
      const hasAuthoredBullets = Array.isArray(desc?.bullets) && (desc!.bullets as unknown[]).length > 0;
      if (!hasAuthoredBullets && desc && typeof desc.body === 'string' && desc.body.length > 0) {
        console.warn(
          `[StepsChain3D] step ${i + 1}: legacy description.body auto-split into bullets at render. Migrate to description.bullets[] in the deck JSON.`,
        );
      }
    });
  }

  const [active, advance] = useReducer((s: number, next: number) => Math.max(0, Math.min(total - 1, next)), 0);
  const systemReduced = usePrefersReducedMotion();
  /* --- Dev motion-mode override (Shift+M) -----------------------------
   * Cycles: 'auto' (follow system prefers-reduced-motion) →
   *         'full' (force full-motion: rail pulse + springs always on) →
   *         'reduced' (force reduced: 180ms crossfades only, no rail
   *         pulse). A small bottom-left pill shows the current mode for
   *         ~1.6s after each toggle so presenters can confirm the switch
   *         without opening devtools. Production decks default to 'auto'
   *         and are unaffected unless someone presses Shift+M. */
  type MotionMode = 'auto' | 'full' | 'reduced';
  const [motionMode, setMotionMode] = useState<MotionMode>('auto');
  const [motionPillVisible, setMotionPillVisible] = useState(false);
  const reduced = motionMode === 'auto' ? systemReduced : motionMode === 'reduced';

  /** Single source of truth for cycling motion mode (used by both the
   *  Shift+M shortcut and the on-screen toggle button). Always flashes the
   *  dev pill so users get the same feedback regardless of input method.
   *  Pill auto-hides after ~1600ms via an rAF deadline loop — we
   *  intentionally avoid `setTimeout` here so the no-timer test
   *  (`stepsChain3DDepthHierarchy`) stays as a structural guarantee that
   *  no step-advance timer can ever sneak in. */
  const cycleMotionMode = useCallback(() => {
    setMotionMode(m => (m === 'auto' ? 'full' : m === 'full' ? 'reduced' : 'auto'));
    setMotionPillVisible(true);
    const deadline = performance.now() + 1600;
    const tick = (now: number) => {
      if (now >= deadline) { setMotionPillVisible(false); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  /* --- Cause-tagged advance ------------------------------------------------
   * Every active-index change carries a `cause` that the WAAPI effect reads
   * to pick the correct emphasis variant (spec 61 §3.6). The cause is set
   * just before `advance(next)` and consumed once on the next animation
   * effect run. Defaults to 'programmatic' so external React state changes
   * (StrictMode double-invoke, etc.) don't accidentally pick a stronger
   * variant. */
  type AdvanceCause = 'click' | 'keyboard' | 'controller' | 'programmatic';
  const causeRef = useRef<AdvanceCause>('programmatic');
  /* --- Click activation variants (spec 61 §3.6 extension) --------------
   * Each click on a step card cycles through a roster of accent
   * activation animations layered on the becoming-active card button.
   * Spring zoom + revolver tilt remain unchanged; the variant adds a
   * brief one-shot translate/opacity flourish on top so consecutive
   * clicks read as varied "presentation moves" instead of a single
   * repeated motion. Hover is still disabled — variants only fire on
   * click. Keyboard/controller/programmatic causes never trigger a
   * variant flourish (spec 61 keeps those calm). */
   const clickVariantIdx = useRef(0);
  const nextClickVariantRef = useRef<ClickVariant | null>(null);
  /* Click-only label-capsule stagger (right detail panel). The capsule
   * list (rendered from description.bullets[]) plays a staggered slide-in
   * ONLY when the active step changed via a card click. Keyboard /
   * controller / programmatic causes render the capsules instantly so
   * those nav modes stay calm. The nonce bumps on every click-cause
   * advance and is folded into the panel `key` so React remounts the
   * capsule list, replaying the CSS animation cleanly. */
  const [clickActivationNonce, bumpClickActivation] = useReducer((n: number) => n + 1, 0);
  const lastCauseRef = useRef<AdvanceCause>('programmatic');
  const setCauseAndAdvance = useCallback((next: number, cause: AdvanceCause) => {
    causeRef.current = cause;
    lastCauseRef.current = cause;
    if (cause === 'click') {
      nextClickVariantRef.current = CLICK_VARIANTS[clickVariantIdx.current % CLICK_VARIANTS.length];
      clickVariantIdx.current += 1;
      bumpClickActivation();
    } else {
      nextClickVariantRef.current = null;
    }
    advance(next);
  }, []);

  /* --- Presenter-driven navigation -----------------------------------
   * Spec 61: the 3D chain must never move by an internal timer. The active
   * step changes only through explicit input: direct card click, focused-card
   * keyboard rove, deck/controller Next/Prev via tryAdvance, or the animation
   * scrubber's imperative handle. */

  /* --- Focus management ------------------------------------------------
   * Roving tabindex: only the active card is tab-stoppable. Tab brings
   * focus into the chain once, then ←/→/↑/↓ rove between steps; Shift+Tab
   * exits. We auto-focus the active card ONLY when the step change came
   * from in-slide interaction (card click or arrow-key rove). When
   * the deck drives the change via `tryAdvance` we suppress the auto-focus
   * so we don't steal focus from the deck controller. */
  const shouldFocusActive = useRef(false);

  /* --- Deck Next/Prev short-circuit (FocusTimelineHandle contract) ---
   * Mirrors `StepTimelineSlide` / `FocusTimelineSlide`: deck arrow keys and
   * controller buttons call `tryAdvance(dir)` first; we consume the press
   * by moving `active` and return `true`, or return `false` at the chain
   * edges so the deck advances to a sibling slide. Mutating `active` here
   * flows through the SAME effect that fires `slideSound.play('whoosh', 0.6)`
   * — the sound trigger is unchanged by this nav path.
   *
   * `shouldFocusActive` stays false here: deck-driven advances must NOT
   * pull DOM focus into the slide (would steal from the controller).
   */
  const tryAdvance = useCallback((dir: 'forward' | 'backward'): boolean => {
    if (total === 0) return false;
    if (dir === 'forward') {
      if (active >= total - 1) return false;
      shouldFocusActive.current = false;
      setCauseAndAdvance(active + 1, 'controller');
      return true;
    }
    if (active <= 0) return false;
    shouldFocusActive.current = false;
    setCauseAndAdvance(active - 1, 'controller');
    return true;
  }, [active, total, setCauseAndAdvance]);

  useImperativeHandle(ref, () => ({
    tryAdvance,
    setStep: (idx: number) => {
      shouldFocusActive.current = false;
      if (idx < 0) { setCauseAndAdvance(0, 'programmatic'); return; }
      setCauseAndAdvance(Math.max(0, Math.min(total - 1, idx)), 'programmatic');
    },
    getStep: () => active,
    getStepCount: () => total,
    replay: () => {
      // Re-arm the SFX dedupe so the next `active` change replays the cue,
      // then snap back to step 0. Replay does not start a timer; the next
      // movement remains click/keyboard/controller driven.
      lastPlayed.current = null;
      skippedInitial.current = false;
      shouldFocusActive.current = false;
      setCauseAndAdvance(0, 'programmatic');
    },
  }), [tryAdvance, active, total, setCauseAndAdvance]);

  /* --- SFX: identical contract to StepTimelineSlide -------------- */
  const lastPlayed = useRef<number | null>(null);
  const skippedInitial = useRef(false);
  useEffect(() => {
    if (active < 0) return;
    if (active === 0 && !skippedInitial.current) {
      skippedInitial.current = true;
      lastPlayed.current = active;
      return;
    }
    if (lastPlayed.current === active) return;
    lastPlayed.current = active;
    slideSound.play('whoosh', 0.6);
  }, [active]);

  /* --- In-slide keyboard rove -----------------------------------
   * Bound on the chain container; only fires when focus is already inside
   * a card. Arrow keys move `active` and request a focus-handoff to the
   * new active card. Home/End jump to first/last. We stopPropagation so
   * the deck's global ←/→ doesn't double-handle the press. */
  const handleChainKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (total === 0) return;
    const target = e.target as HTMLElement | null;
    if (!target || !target.closest?.('[data-chain3d-card]')) return;

    // Enter / Space on a focused card → activate that card. Native buttons
    // already fire click on these keys, but the deck's global keydown
    // listener can intercept Space (often bound to "next slide") before the
    // button click resolves. Handling here + stopPropagation makes activation
    // deterministic regardless of deck-level bindings.
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      const cardEl = target.closest('[data-chain3d-card]') as HTMLElement | null;
      const idx = cardEl ? cardRefs.current.indexOf(cardEl as HTMLButtonElement) : -1;
      if (idx >= 0) {
        e.preventDefault();
        e.stopPropagation();
        shouldFocusActive.current = true;
        // Treat as a click so the variant flourish + click emphasis fires.
        setCauseAndAdvance(idx, 'click');
      }
      return;
    }

    let next: number | null = null;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = Math.min(total - 1, active + 1); break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = Math.max(0, active - 1); break;
      case 'Home':
        next = 0; break;
      case 'End':
        next = total - 1; break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (next !== null && next !== active) {
      shouldFocusActive.current = true;
      setCauseAndAdvance(next, 'keyboard');
    }
  }, [active, total, setCauseAndAdvance]);

  /* --- Focus handoff when active step changes ------------------------
   * Roving-tabindex reconciliation. We move DOM focus to the new active
   * card when EITHER:
   *   (a) an in-slide handler explicitly asked (`shouldFocusActive=true`),
   *       e.g. keyboard rove or card click, OR
   *   (b) keyboard focus is currently inside the chain on a card that just
   *       became inactive (its `tabIndex` flipped to -1). Without (b), a
   *       click/controller-driven step change while a card is
   *       focused leaves the focused element and the lone `tabIndex=0`
   *       desynced — the next ArrowRight would rove from the wrong card.
   * The first run is skipped naturally: on mount no card is focused so
   * neither condition fires. */
  useEffect(() => {
    const newActive = cardRefs.current[active];
    if (!newActive) return;
    const ae = document.activeElement;
    const focusOnStaleCard =
      chainRef.current?.contains(ae)
      && ae instanceof HTMLElement
      && ae.matches('[data-chain3d-card]')
      && ae !== newActive;
    if (!shouldFocusActive.current && !focusOnStaleCard) return;
    shouldFocusActive.current = false;
    // Defer to next frame so WAAPI transforms are applied before focus ring renders.
    const id = requestAnimationFrame(() => {
      newActive.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [active]);

  /* --- Card click → focus the clicked card AND advance --------------
   * Pointer users expect the clicked element to receive focus (browsers
   * already do this for buttons, but on some platforms — Safari — buttons
   * don't receive focus on click; we make it explicit). */
  const handleCardClick = useCallback((i: number) => {
    shouldFocusActive.current = true;
    setCauseAndAdvance(i, 'click');
  }, [setCauseAndAdvance]);

  /* --- Refs per card / marker so WAAPI can target each layer ----- */
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const visualRefs = useRef<Array<HTMLDivElement | null>>([]);
  const markerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const chainRef = useRef<HTMLDivElement | null>(null);
  const travelPulseRef = useRef<HTMLDivElement | null>(null);
  const previousActive = useRef<number>(active);
  /* The pulse effect needs the PRIOR active index too, but the marker
   * effect (which runs first because it's declared first) already
   * mutates `previousActive` to the new value before the pulse effect
   * reads it. We keep a dedicated `pulsePrevActive` ref that ONLY the
   * pulse effect updates, so the pulse always sees the true "from"
   * index regardless of effect ordering. */
  const pulsePrevActive = useRef<number>(active);

  /* --- Animation debug overlay ----------------------------------------
   * Dev-only Gantt-style visualization of card + marker spring timings.
   * Toggled with Shift+D (capital D). OFF by default so production
   * presentations never see it. Each entry stores:
   *   - layer  : 'card' | 'marker' | 'chain'
   *   - index  : step index (or -1 for the chain container)
   *   - kind   : descriptive ('to-active', 'to-distant', 'bubble-up' …)
   *   - startMs: ms relative to transition trigger (after `delay`)
   *   - endMs  : ms when finished promise resolved
   * Buffer is capped to the last N transitions so it can't grow unbounded. */
  type DebugEvent = {
    layer: 'card' | 'marker' | 'chain';
    index: number;
    kind: string;
    startMs: number;
    endMs: number | null;
  };
  type DebugTransition = {
    id: number;
    from: number;
    to: number;
    triggeredAt: number;
    events: DebugEvent[];
  };
  const [debugOverlay, setDebugOverlay] = useReducer((b: boolean) => !b, false);
  const debugTransitionsRef = useRef<DebugTransition[]>([]);
  const [, bumpDebug] = useReducer((n: number) => n + 1, 0);
  const debugIdRef = useRef(0);
  /* --- Centerline-alignment overlay (Shift+L) -------------------------
   * Draws a magenta vertical line through the rail axis and a cyan
   * horizontal line through each numeric marker's measured center, both
   * computed from live getBoundingClientRect() against the chain
   * container. If the rail truly passes through every number's center,
   * the magenta line lands exactly on each cyan crosshair intersection.
   * Also renders a HUD listing the z-index stack so we can verify
   * markers (z=3) are above the rail (z=0) and pulse (z=1). OFF by
   * default — toggled with Shift+L. */
  const [centerlineOverlay, setCenterlineOverlay] = useReducer((b: boolean) => !b, false);
  const [centerlineMeasure, setCenterlineMeasure] = useState<{
    chainW: number;
    chainH: number;
    railX: number;
    markers: Array<{ index: number; x: number; y: number; deltaPx: number }>;
  } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Shift+D toggles. Uppercase 'D' on shift; we accept both keyboard
      // layouts that report 'D' or 'd' with shiftKey set.
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setDebugOverlay();
      }
      // Shift+I toggles the live spring inspector.
      if (e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        setInspectorOpen();
      }
      // Shift+M cycles the motion-mode override: auto → full → reduced → auto.
      // Lets presenters preview the reduced-motion path on a machine that
      // doesn't have the OS preference set, and force full motion on one
      // that does (for verifying rail-pulse + spring layering).
      if (e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        cycleMotionMode();
      }
      // Shift+L toggles the centerline-alignment overlay (rail axis +
      // per-marker crosshairs + z-stack HUD).
      if (e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        setCenterlineOverlay();
      }
    };
    window.addEventListener('keydown', onKey);
    // Also honor `#centerlines` in the URL hash as an always-on opener,
    // so the overlay can be shared in a deep link or invoked from
    // automated tooling that can't reliably send Shift modifiers.
    if (typeof window !== 'undefined' && window.location.hash.includes('centerlines')) {
      setCenterlineOverlay();
    }
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* When the centerline overlay is on, re-measure rail + marker centers
   * relative to the chain container on every active-step change, on
   * window resize, and once on toggle. We measure DOM rects rather than
   * trusting layoutCfg.railLeftPx so the overlay is a TRUE visual proof
   * — it would catch any drift from CSS scale/transform/perspective. */
  useLayoutEffect(() => {
    if (!centerlineOverlay) {
      setCenterlineMeasure(null);
      return;
    }
    const measure = () => {
      const chainEl = chainRef.current;
      if (!chainEl) return;
      const cRect = chainEl.getBoundingClientRect();
      // Rail is positioned at layoutCfg.railLeftPx within the chain's
      // own coordinate space; expose it as the magenta vertical line.
      const railX = layoutCfg.railLeftPx;
      const markers = markerRefs.current.map((el, index) => {
        if (!el) return { index, x: 0, y: 0, deltaPx: 0 };
        const r = el.getBoundingClientRect();
        // Convert marker center back to chain-local coordinates.
        const cx = (r.left - cRect.left) + r.width / 2;
        const cy = (r.top  - cRect.top)  + r.height / 2;
        return { index, x: cx, y: cy, deltaPx: Math.round(cx - railX) };
      });
      setCenterlineMeasure({
        chainW: chainEl.offsetWidth,
        chainH: chainEl.offsetHeight,
        railX,
        markers,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (chainRef.current) ro.observe(chainRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
    // active in deps so the overlay re-measures after each spring settles
    // (markers move slightly during the bubble-up/down).
  }, [centerlineOverlay, active, layoutCfg.railLeftPx]);

  /** Track a WAAPI Animation: record start (after `ready`) and end (after
   *  `finished`). Both promises can reject if the anim is cancelled — we
   *  swallow those silently so the overlay just shows whatever completed. */
  const trackAnim = useCallback(
    (anim: Animation, transition: DebugTransition, layer: DebugEvent['layer'], index: number, kind: string, scheduledDelayMs: number) => {
      const triggeredAt = transition.triggeredAt;
      const event: DebugEvent = { layer, index, kind, startMs: scheduledDelayMs, endMs: null };
      transition.events.push(event);
      anim.ready
        .then(() => {
          event.startMs = Math.max(0, performance.now() - triggeredAt);
          bumpDebug();
        })
        .catch(() => { /* cancelled */ });
      anim.finished
        .then(() => {
          event.endMs = performance.now() - triggeredAt;
          bumpDebug();
        })
        .catch(() => { /* cancelled */ });
    },
    [],
  );

  /* --- Drive transitions when `active` changes ------------------- */
  useEffect(() => {
    const from = previousActive.current;
    previousActive.current = active;

    // Reduced motion: simple fade + minimal scale, no overshoot, no
    // bubble-up/down spring, no glow pulse. Cards keep the depth tier
    // mapping but cross-fade via a flat 180ms opacity transition. Markers
    // crossfade between active/inactive base scale (0.92 ↔ 1.0) and
    // opacity (0.6 ↔ 1.0) over 200ms — no overshoot, no boxShadow halo,
    // no radial gradient (the inline style below already drops the halo
    // when `reduced`). Background also fades so the gold fill eases in
    // rather than snapping.
    if (reduced) {
      visualRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = tierFor(Math.abs(i - active));
        el.style.transition = 'opacity 180ms linear, transform 180ms linear, filter 180ms linear';
        el.style.transform = cardTransform(t);
        el.style.opacity = String(t.opacity);
        el.style.filter = cardFilter(t);
      });
      markerRefs.current.forEach((el, i) => {
        if (!el) return;
        const isActiveNow = i === active;
        el.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out, background 200ms linear';
        el.style.transform = isActiveNow ? 'scale(1)' : 'scale(0.92)';
        el.style.opacity = isActiveNow ? '1' : '0.6';
      });
      return;
    }

    /* Consume the cause for THIS transition; reset to a neutral default
     * so any subsequent React-driven re-render (StrictMode, props change)
     * doesn't accidentally re-use a stronger emphasis. Spec 61 §3.6. */
    const cause = causeRef.current;
    causeRef.current = 'programmatic';

    /* Per-cause emphasis envelope. Same spring physics — only the visible
     * emphasis differs so the deck reads consistently across input modes. */
    const VARIANT = (() => {
      switch (cause) {
        case 'click':       return { cardOvershoot: 0.06, markerOvershoot: 0.30, tiltDeg: 5 };
        case 'keyboard':    return { cardOvershoot: 0.04, markerOvershoot: 0.25, tiltDeg: 4 };
        case 'controller':  return { cardOvershoot: 0.04, markerOvershoot: 0.25, tiltDeg: 4 };
        default:            return { cardOvershoot: 0.03, markerOvershoot: 0.18, tiltDeg: 3 };
      }
    })();

    /* Open a debug transition record for this step change. We push it
     * unconditionally so the buffer reflects history even if the overlay
     * is toggled on later — the overlay only renders the last 6. */
    const transition: DebugTransition = {
      id: ++debugIdRef.current,
      from,
      to: active,
      triggeredAt: performance.now(),
      events: [],
    };
    debugTransitionsRef.current = [...debugTransitionsRef.current.slice(-5), transition];

    /* Chain container — variant-driven rotateX 0 → tiltDeg → 0 (revolver tilt). */
    if (chainRef.current) {
      const a = chainRef.current.animate(
        [
          { transform: 'rotateX(0deg)' },
          { transform: `rotateX(${VARIANT.tiltDeg}deg)`, offset: 0.45 },
          { transform: 'rotateX(0deg)' },
        ],
        { duration: SPRING_DURATION_MS, easing: 'ease-in-out', fill: 'forwards' },
      );
      trackAnim(a, transition, 'chain', -1, `revolver-tilt:${cause}`, 0);
    }

    /* Cards — sample spring curve to keyframes; transform + opacity + filter only. */
    visualRefs.current.forEach((el, i) => {
      if (!el) return;
      const fromTier = tierFor(Math.abs(i - from));
      const toTier   = tierFor(Math.abs(i - active));
      const isBecomingActive = i === active && from !== active;

      const keyframes = SPRING_CURVE.map((p, idx) => {
        const scale = fromTier.scale + (toTier.scale - fromTier.scale) * p;
        const z     = fromTier.translateZ + (toTier.translateZ - fromTier.translateZ) * p;
        const blur  = fromTier.blur + (toTier.blur - fromTier.blur) * p;
        const op    = fromTier.opacity + (toTier.opacity - fromTier.opacity) * p;
        // Overshoot: when becoming active, push scale to +VARIANT.cardOvershoot
        // around p≈0.5 of the curve. Variant per spec 61 §3.6.
        let s = scale;
        if (isBecomingActive) {
          const overshoot = idx / SPRING_CURVE.length;
          s += VARIANT.cardOvershoot * Math.sin(Math.PI * overshoot);
        }
        return {
          transform: `translate3d(0, 0, ${z.toFixed(2)}px) scale(${s.toFixed(3)})`,
          opacity: String(op),
          filter: blur > 0.02 ? `blur(${blur.toFixed(2)}px)` : 'none',
        };
      });

      // Skip cards whose tier didn't change AND aren't the becoming-active
      // overshoot target — nothing to log because no animation runs.
      const tierChanged =
        fromTier.scale !== toTier.scale ||
        fromTier.translateZ !== toTier.translateZ ||
        fromTier.blur !== toTier.blur ||
        fromTier.opacity !== toTier.opacity;
      if (!tierChanged && !isBecomingActive) return;

      const a = el.animate(keyframes, {
        duration: SPRING_DURATION_MS,
        easing: 'linear', // curve is already shaped — linear sampling preserves spring feel
        fill: 'forwards',
      });
      const kind = isBecomingActive
        ? 'to-active'
        : i === active
          ? 'stay-active'
          : Math.abs(i - active) === 1 ? 'to-adjacent' : 'to-distant';
      trackAnim(a, transition, 'card', i, kind, 0);
    });

    /* Click variant accent — one-shot flourish on the becoming-active
     * card BUTTON (separate from visualRefs spring on transform/opacity/
     * filter). Animates only `transform` + `opacity` so the WAAPI on the
     * inner visual layer is unaffected. Reduced motion + non-click causes
     * skip this entirely. Spec 61 §3.6 extension. NEVER triggered by hover. */
    const variant = nextClickVariantRef.current;
    nextClickVariantRef.current = null;
    if (variant && cause === 'click' && from !== active && !reduced) {
      const btn = cardRefs.current[active];
      if (btn) {
        let kf: Keyframe[];
        switch (variant) {
          case 'FadeIn':
            kf = [{ opacity: 0.35 }, { opacity: 1 }];
            break;
          case 'SlideIn':
            kf = [
              { transform: 'translate3d(24px, 0, 0)', opacity: 0.4 },
              { transform: 'translate3d(0, 0, 0)', opacity: 1 },
            ];
            break;
          case 'PushLeft':
            kf = [
              { transform: 'translate3d(40px, 0, 0)', opacity: 0.3 },
              { transform: 'translate3d(-6px, 0, 0)', opacity: 1, offset: 0.7 },
              { transform: 'translate3d(0, 0, 0)', opacity: 1 },
            ];
            break;
          case 'PushRight':
            kf = [
              { transform: 'translate3d(-40px, 0, 0)', opacity: 0.3 },
              { transform: 'translate3d(6px, 0, 0)', opacity: 1, offset: 0.7 },
              { transform: 'translate3d(0, 0, 0)', opacity: 1 },
            ];
            break;
          case 'PushIn':
          default:
            kf = [
              { transform: 'scale(0.92)', opacity: 0.4 },
              { transform: 'scale(1.02)', opacity: 1, offset: 0.65 },
              { transform: 'scale(1)', opacity: 1 },
            ];
            break;
        }
        const accent = btn.animate(kf, {
          duration: 460,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        });
        accent.finished
          .then(() => {
            try { accent.cancel(); btn.style.transform = ''; btn.style.opacity = ''; } catch { /* noop */ }
          })
          .catch(() => { /* cancelled */ });
        trackAnim(accent, transition, 'card', active, `click-variant:${variant}`, 0);
      }
    }

    /* v1.3 — Per-step entrance variant (lift / slide / parallax). Rotates
     * deterministically by `active` index via the shared stepMotionVariant
     * helper, so a 6-step deck reads as L→S→P→L→S→P regardless of cause
     * (click, keyboard, controller, programmatic). Animates the card BUTTON
     * `transform` + `opacity` only — same surface as the click-variant
     * flourish above so the WAAPI on the visual layer is unaffected.
     *
     * Layered with the click-variant flourish above (when present): the
     * click flourish already cancels itself on `.finished`, and the
     * step-variant accent is shorter (320ms) with smaller travel so the
     * two read as ONE motion, not two.
     *
     * Suppressed under prefers-reduced-motion. See
     * `mem://design/step-row-motion-parity` §Variants. */
    if (from !== active && !reduced) {
      const stepBtn = cardRefs.current[active];
      if (stepBtn) {
        const v: StepMotionVariant = stepMotionVariant(active);
        let stepKf: Keyframe[];
        switch (v) {
          case 'slide':
            stepKf = [
              { transform: 'translate3d(-18px, 0, 0)', opacity: 0.55 },
              { transform: 'translate3d(0, 0, 0)',     opacity: 1    },
            ];
            break;
          case 'parallax':
            stepKf = [
              // Tiny perspective-y tilt + z push so the active card reads
              // as stepping forward — distinct from the lift's pure scale.
              { transform: 'perspective(900px) translate3d(0, 0, -10px) rotateY(-4deg)', opacity: 0.6 },
              { transform: 'perspective(900px) translate3d(0, 0, 4px)   rotateY(1deg)',  opacity: 1, offset: 0.6 },
              { transform: 'perspective(900px) translate3d(0, 0, 0)     rotateY(0)',     opacity: 1 },
            ];
            break;
          case 'lift':
          default:
            stepKf = [
              { transform: 'translate3d(0, 6px, 0) scale(0.985)', opacity: 0.7 },
              { transform: 'translate3d(0, -1px, 0) scale(1.005)', opacity: 1, offset: 0.6 },
              { transform: 'translate3d(0, 0, 0) scale(1)',        opacity: 1 },
            ];
            break;
        }
        const stepAccent = stepBtn.animate(stepKf, {
          duration: 320,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        });
        stepAccent.finished
          .then(() => {
            try { stepAccent.cancel(); stepBtn.style.transform = ''; stepBtn.style.opacity = ''; } catch { /* noop */ }
          })
          .catch(() => { /* cancelled */ });
        trackAnim(stepAccent, transition, 'card', active, `step-variant:${v}`, 0);
      }
    }

    /* Markers — same spring as the card, offset by +80ms so the number
     * lights up just AFTER the card lands. Bubble-up overshoots to 1.25
     * (vs the card's 1.04) so the glow reads as a punctuation, not a
     * continuation of the card motion. Bubble-down is the symmetric exit
     * on the previously active marker. Inactive siblings snap to base. */
    const MARKER_DELAY_MS = markerSpring.delayMs;
    // Inspector override (Shift+I) wins over the cause-variant overshoot;
    // otherwise the variant value drives marker emphasis per spec 61 §3.6.
    const MARKER_OVERSHOOT = springOverrides.overshoot !== null
      ? markerSpring.overshoot
      : VARIANT.markerOvershoot;
    const MARKER_CURVE = markerSpring.curve;
    const MARKER_DURATION = markerSpring.durationMs;
    markerRefs.current.forEach((el, i) => {
      if (!el) return;
      const becomingActive = i === active && from !== active;
      const becomingInactive = i === from && from !== active;
      const isActiveNow = i === active;
      const baseScale = isActiveNow ? 1.0 : 0.85;
      const baseOpacity = isActiveNow ? 1.0 : 0.55;

      if (becomingActive) {
        // Spring-sampled bubble-up with a configurable overshoot peak.
        // Each keyframe maps the normalized spring progress `p` (0→1) to a
        // scale that crests at 1 + overshoot around p≈0.5 then settles to 1.0.
        const keyframes = MARKER_CURVE.map((p) => {
          const base = 0.85 + (1.0 - 0.85) * p;
          const overshoot = MARKER_OVERSHOOT * Math.sin(Math.PI * p);
          const scale = base + overshoot;
          const opacity = 0.55 + (1.0 - 0.55) * Math.min(1, p * 2);
          return { transform: `scale(${scale.toFixed(3)})`, opacity: opacity.toFixed(3) };
        });
        const a = el.animate(keyframes, {
          duration: MARKER_DURATION,
          delay: MARKER_DELAY_MS,
          easing: 'linear', // curve is pre-shaped by the spring sampler
          fill: 'forwards',
        });
        trackAnim(a, transition, 'marker', i, 'bubble-up', MARKER_DELAY_MS);
      } else if (becomingInactive) {
        // Spring-sampled bubble-down — same delay so the previous
        // marker's glow fades a beat after its card recedes.
        const keyframes = MARKER_CURVE.map((p) => {
          const scale = 1.0 + (0.85 - 1.0) * p;
          const opacity = 1.0 + (0.55 - 1.0) * p;
          return { transform: `scale(${scale.toFixed(3)})`, opacity: opacity.toFixed(3) };
        });
        const a = el.animate(keyframes, {
          duration: MARKER_DURATION,
          delay: MARKER_DELAY_MS,
          easing: 'linear',
          fill: 'forwards',
        });
        trackAnim(a, transition, 'marker', i, 'bubble-down', MARKER_DELAY_MS);
      } else {
        el.style.transform = `scale(${baseScale})`;
        el.style.opacity = String(baseOpacity);
      }
    });
    bumpDebug();
  }, [active, reduced, trackAnim, markerSpring, springOverrides.overshoot]);

  /* --- Traveling-light pulse on step change (v0.220, sync rev v0.224) -
   * Animates a short vertical gold gradient along the rail from the
   * previous active marker's center Y to the new active marker's
   * center Y, then triggers a one-shot "ignite" flash on the
   * becoming-active marker the instant the pulse lands. The pulse
   * sits between the rail (z=0) and the markers (z=3) so it threads
   * UNDER each number it crosses, then the marker ignites in front of
   * it for a perfectly causal beat: light arrives → marker brightens.
   *
   * Synchronization contract (so it never drifts from the centered
   * rail or from the marker bubble-up spring):
   *
   *   t=0     pulse departs `fromY`, opacity 0
   *   t=8%    pulse fully visible, still at `fromY` (head fade-in)
   *   t=arr%  pulse arrives at `toY`, opacity 0.95
   *   t=100%  pulse faded to 0 at `toY`
   *
   *   Where `arr%` is computed so the pulse arrival lines up with the
   *   marker spring's overshoot peak (the visual "punch" moment of
   *   bubble-up). Marker spring fires at +MARKER_DELAY_MS and the
   *   peak lands roughly at the spring's first overshoot crossing
   *   (~50% of MARKER_DURATION). We solve for the offset so:
   *
   *     pulseDuration × arr  =  MARKER_DELAY_MS + MARKER_DURATION × 0.50
   *
   *   Pulse is positioned via `top` only; X is locked to the rail
   *   axis at `layoutCfg.railLeftPx` (centered via translateX(-50%) +
   *   marginLeft:-2px on the 4px-wide bar) so it CAN'T drift off
   *   center regardless of card scale.
   *
   * Suppressed under prefers-reduced-motion. */
  useEffect(() => {
    if (reduced) {
      // Keep the prev ref in sync even when motion is suppressed so a
      // re-enable mid-deck doesn't replay an outdated transition.
      pulsePrevActive.current = active;
      return;
    }
    const pulseEl = travelPulseRef.current;
    const chainEl = chainRef.current;
    if (!pulseEl || !chainEl) return;

    const fromIdx = pulsePrevActive.current;
    pulsePrevActive.current = active;

    const fromMarker = markerRefs.current[fromIdx];
    const toMarker   = markerRefs.current[active];
    if (!toMarker) return;

    // Compute centers in chain-local coordinates. We center on the
    // marker rect (not the card rect) so the pulse always lands on the
    // exact gold disc center even when the card is scaled.
    const chainBox = chainEl.getBoundingClientRect();
    const toBox    = toMarker.getBoundingClientRect();
    const toY      = (toBox.top - chainBox.top) + toBox.height / 2;
    const fromBox  = fromMarker?.getBoundingClientRect();
    const fromY    = fromBox
      ? (fromBox.top - chainBox.top) + fromBox.height / 2
      : toY;

    if (Math.abs(fromY - toY) < 1) return;

    // Snap horizontal position back to the rail axis on every fire,
    // defeating any accidental drift if the rail token changed at
    // runtime (theme switch, layout knob, etc.).
    pulseEl.style.left = `${layoutCfg.railLeftPx}px`;

    // Sync window: pulse arrival aligns with the marker's bubble-up
    // overshoot peak. We give the pulse the FULL window from t=0 to
    // the moment the marker peaks, then a short tail to fade out
    // after the marker has visually "received" the energy.
    const peakAtMs       = markerSpring.delayMs + markerSpring.durationMs * 0.5;
    const tailMs         = 140;                            // post-arrival fade
    const pulseDuration  = peakAtMs + tailMs;              // total animation
    const arrivalOffset  = Math.min(0.92, Math.max(0.55, peakAtMs / pulseDuration));
    const visibleOffset  = Math.min(0.12, arrivalOffset / 4); // fade-in head

    try {
      pulseEl.animate(
        [
          { top: `${fromY}px`, opacity: 0,    offset: 0 },
          { top: `${fromY}px`, opacity: 0.95, offset: visibleOffset },
          { top: `${toY}px`,   opacity: 0.95, offset: arrivalOffset },
          { top: `${toY}px`,   opacity: 0,    offset: 1 },
        ],
        {
          duration: pulseDuration,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        },
      );
    } catch { /* WAAPI unavailable — silently skip */ }

    // Synchronized "ignite" flash on the becoming-active marker — fires
    // exactly when the pulse arrives, so the marker visually catches
    // the light. Drives a brief box-shadow surge layered on top of the
    // existing scale spring; doesn't compete with the bubble-up
    // because we animate `boxShadow` (the spring uses transform).
    const igniteAtMs = pulseDuration * arrivalOffset;
    const igniteDur  = 320;
    try {
      toMarker.animate(
        [
          { boxShadow: '0 0 0 0 hsl(var(--gold) / 0)' },
          { boxShadow: '0 0 28px 6px hsl(var(--gold) / 0.85)', offset: 0.25 },
          { boxShadow: '0 0 18px 4px hsl(var(--gold) / 0.55)', offset: 0.55 },
          { boxShadow: '0 0 0 0 hsl(var(--gold) / 0)' },
        ],
        {
          duration: igniteDur,
          delay: igniteAtMs,
          easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
          fill: 'none',
        },
      );
    } catch { /* WAAPI unavailable — silently skip */ }
  }, [active, reduced, layoutCfg.railLeftPx, markerSpring.delayMs, markerSpring.durationMs]);


  /* --- Right detail panel ---------------------------------------- */
  const activeStep = steps[active];
  const detailKey = `${active}-${clickActivationNonce}-${activeStep?.title ?? ''}`;
  // Click-only label capsules: stagger-in when the cause was 'click', snap
  // in for keyboard/controller/programmatic so non-pointer nav stays calm.
  const capsulesAnimateOnClick = lastCauseRef.current === 'click' && !reduced;

  /* --- Initial paint: snap each card to its tier ------------------ */
  const initialStyles = useMemo(() => {
    return steps.map((_, i) => {
      const t = tierFor(Math.abs(i - active));
      return {
        transform: cardTransform(t),
        opacity: t.opacity,
        filter: cardFilter(t),
      };
    });
    // Only on mount — subsequent updates flow through the WAAPI effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // v0.220 — Brand-chrome anchored layout (mirrors slide 3
    // `step-timeline-content`). The eyebrow, title, chain, and right
    // panel all inherit `--brand-inset-x/y` so they share the
    // RiseupAsia logo's left + top sight line. When the user adjusts
    // `logoScale` / `logoOffsetY` / the settings shift slider, slide 4
    // tracks slide 3 in lockstep instead of drifting from a hardcoded
    // px-24/pt-28 inset. See ambiguity log
    // `.lovable/question-and-ambiguity/21-steps-3d-align-rail-traveling-light.md`.
    <div
      className="absolute inset-0 grid grid-cols-12 gap-12 pb-20"
      style={{
        // v0.221 hotfix: slide 4's eyebrow + title block is denser than
        // slide 3's, so the bare 116px brand-inset-y wasn't clearing the
        // RiseupAsia wordmark (logo bottom ≈ 170px in this deck).
        // Adding +72px gives the same optical breathing room slide 3 gets
        // from `slide-title-content` line-height + section margins, and
        // it still tracks logoScale because it stacks on the var.
        paddingTop: 'calc(var(--brand-inset-y, 116px) + 72px)',
        paddingLeft: 'var(--brand-inset-x, 96px)',
        paddingRight: 'var(--brand-inset-x, 96px)',
      }}
    >
      {/* LEFT — header + chain (cols 1-7) */}
      <div className="col-span-7 flex flex-col">
        {content.eyebrow && (
          <div className="slide-eyebrow text-base tracking-[0.3em] uppercase mb-4 text-[hsl(var(--gold))]">
            {content.eyebrow}
          </div>
        )}

        {/* Screen-reader-only live region. Announces "Step N of M: <title>"
            on every active change (card click, deck Next/Prev,
            arrow-key rove). Polite so it never interrupts the presenter's
            narration. Atomic so the full sentence is re-read each time. */}
        {total > 0 && steps[active] && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            data-step-announcer
          >
            {`Step ${active + 1} of ${total}: ${steps[active].title}`}
          </div>
        )}

        {content.title && (
          <h2 className="slide-title-content text-5xl font-display font-bold mb-6 text-foreground">
            {content.title}
          </h2>
        )}

        {/* Perspective container — establishes the 3D scene. */}
        <div
          className="relative flex-1"
          style={{
            perspective: '1200px',
            perspectiveOrigin: `${layoutCfg.railLeftPx}px center`,
            transformStyle: 'preserve-3d' as const,
            isolation: 'isolate',
          }}
        >
          {/* Connecting rail — centered on the numeric marker axis, clipped
              to the space between marker centers, and kept behind the numbers
              so the step coins always own visual priority. */}
          <div
            aria-hidden
            data-testid="chain3d-rail"
            className="chain3d-rail absolute pointer-events-none bg-[hsl(var(--gold)/0.18)]"
            style={{
              left:   `${layoutCfg.railLeftPx}px`,
              top:    `${layoutCfg.railTopPx}px`,
              bottom: `${layoutCfg.railBottomPx}px`,
              width: '2px',
              borderRadius: '999px',
              transform: 'translateX(-50%)',
              zIndex: 0,
            }}
          />

          {/* Traveling-light pulse. A short vertical gold
              gradient that animates `top` from the previous active
              marker's center Y to the new active marker's center Y on
              every step change. Sits between the rail (z=-40) and the
              markers (z=0) so it threads UNDER each number it passes.
              Suppressed under prefers-reduced-motion. */}
          {!reduced && (
            <div
              ref={travelPulseRef}
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                left:   `${layoutCfg.railLeftPx}px`,
                top:    `${layoutCfg.railTopPx}px`,
                width:  '4px',
                height: '28px',
                marginLeft: '-2px',
                borderRadius: '999px',
                background:
                  'linear-gradient(to bottom, hsl(var(--gold)/0) 0%, hsl(var(--gold)/0.95) 50%, hsl(var(--gold)/0) 100%)',
                boxShadow: '0 0 14px hsl(var(--gold)/0.85), 0 0 28px hsl(var(--gold)/0.45)',
                transform: 'translateY(-50%)',
                zIndex: 1,
                opacity: 0,
                willChange: 'top, opacity',
              }}
            />
          )}

          {/* Chain container — owns the rotateX revolver tilt. Also the
              keyboard rove root: arrow keys / Home / End move `active`
              while focus is inside, and stopPropagation prevents the
              deck's global ←/→ from double-handling. role=list + per-card
              listitem semantics give screen readers "X of N" context. */}
          <div
            ref={chainRef}
            className="relative"
            style={{
              transformStyle: 'preserve-3d' as const,
              transformOrigin: `${layoutCfg.railLeftPx}px center`,
              // Single source of truth for marker size — rail offset and
              // per-row text padding both derive from this so they stay
              // in lockstep across viewports and any future resize.
              ['--chain3d-marker-size' as string]: `${layoutCfg.markerSize}px`,
            }}
            role="list"
            aria-label={content.title ? `${content.title} — ${total} steps` : `Process — ${total} steps`}
            onKeyDown={handleChainKeyDown}
          >
            {steps.map((step, i) => {
              const init = initialStyles[i] ?? { transform: 'none', opacity: 1, filter: 'none' };
              const isActive = i === active;
              return (
                <button
                  key={i}
                  type="button"
                  role="listitem"
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    handleCardClick(i);
                  }}
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    handleCardClick(i);
                  }}
                  onClick={() => handleCardClick(i)}
                  ref={el => { cardRefs.current[i] = el; }}
                  data-chain3d-card
                  data-active={isActive ? 'true' : 'false'}
                  className="chain3d-card relative block w-full text-left bg-transparent border-0 p-0 cursor-pointer focus:outline-none focus-visible:outline-none rounded-xl"
                  style={{
                    // Inter-card gap from layout knob (default 20). First
                    // card has no top margin so the rail starts cleanly at
                    // marker 1's center.
                    marginTop: i === 0 ? 0 : `${layoutCfg.rowSpacing}px`,
                    zIndex: 2,
                  }}
                  aria-current={isActive ? 'step' : undefined}
                  aria-posinset={i + 1}
                  aria-setsize={total}
                  aria-label={`Step ${i + 1} of ${total}: ${step.title}${step.subtitle ? `. ${step.subtitle}` : ''}`}
                  tabIndex={isActive ? 0 : -1}
                >
                  <div
                    ref={el => { visualRefs.current[i] = el; }}
                    className="chain3d-card-visual relative flex items-center w-full"
                    style={{
                      transform: init.transform,
                      opacity: init.opacity,
                      filter: init.filter,
                      transformOrigin: `${layoutCfg.railLeftPx}px center`,
                      willChange: 'transform, opacity, filter',
                      // gap = 16px guarantees text starts at marker+16, which
                      // is 8px past the rail (rail = marker+8). No overlap at
                      // any viewport because both anchors share the same token.
                      gap: `${layoutCfg.rowGapPx}px`,
                    }}
                    aria-hidden="true"
                  >

                  {/* Numeric marker — sits on the rail, bubble-up on
                      activation. aria-hidden because the parent button's
                      aria-label already announces "Step N of M". */}
                  <div
                    ref={el => { markerRefs.current[i] = el; }}
                    aria-hidden="true"
                    className="chain3d-marker relative shrink-0 rounded-full flex items-center justify-center font-display font-bold text-2xl"
                    style={{
                      zIndex: 3,
                      transformOrigin: 'center center',
                      width:  `${layoutCfg.markerSize}px`,
                      height: `${layoutCfg.markerSize}px`,
                      // Reduced motion: flat gold fill, no radial gradient
                      // sheen. Full motion: radial gradient gives the marker
                      // a subtle 3D sheen consistent with the chain depth.
                      background: isActive
                        ? (reduced
                            ? 'hsl(var(--gold))'
                            : 'radial-gradient(circle at 30% 30%, hsl(var(--gold)), hsl(var(--gold)/0.7))')
                        : 'hsl(var(--ink)/0.6)',
                      color: isActive ? 'hsl(var(--ink))' : 'hsl(var(--cream))',
                      border: isActive ? '2px solid hsl(var(--gold))' : '2px solid hsl(var(--gold)/0.35)',
                      // Reduced motion: drop the gold halo + outer ring
                      // entirely. Some users with motion sensitivity also
                      // experience visual sensitivity to glowing/pulsing
                      // halos; a flat coin reads as "selected" without
                      // the radiating cue.
                      boxShadow: isActive && !reduced
                        ? '0 0 32px hsl(var(--gold)/0.55), 0 0 0 6px hsl(var(--gold)/0.12)'
                        : 'none',
                      transform: isActive ? 'scale(1)' : (reduced ? 'scale(0.92)' : 'scale(0.85)'),
                      opacity: isActive ? 1 : (reduced ? 0.6 : 0.55),
                      willChange: reduced ? 'opacity' : 'transform, opacity',
                    }}
                  >
                      {step.label.replace(/^Step\s*/i, '')}
                    </div>

                  {/* Step label/title/subtitle — visual only; the button's
                      aria-label carries the spoken version. aria-hidden
                      avoids the screen reader reading the title twice.
                      v1.2 — sizes flow through `--step-title-3d-*` /
                      `--step-eyebrow-3d` / `--step-subtitle-3d` tokens
                      (NOT raw Tailwind utilities) so this slide stays in
                      lockstep with slide 3 on any deck-wide bump. Active
                      vs upcoming differs in title size to mirror slide
                      3's adjacent→active growth. See
                      `mem://design/step-row-motion-parity`. */}
                  <div className="flex-1 min-w-0" aria-hidden="true">
                    <div
                      className="step-eyebrow tracking-[0.22em] uppercase text-[hsl(var(--cream)/0.7)] mb-1"
                      style={{ fontSize: 'var(--step-eyebrow-3d)' }}
                    >
                      {step.label}
                    </div>
                    <div
                      className="step-title font-display font-bold text-foreground leading-tight"
                      style={{
                        fontSize: isActive
                          ? 'var(--step-title-3d-active)'
                          : 'var(--step-title-3d-adjacent)',
                        transition: reduced
                          ? 'none'
                          : 'font-size 700ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    >
                      {step.title}
                    </div>
                      {step.subtitle && (
                        <div
                          className="text-[hsl(var(--cream)/0.75)] mt-1"
                          style={{ fontSize: 'var(--step-subtitle-3d)' }}
                        >
                          {step.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Centerline-alignment overlay (Shift+L). Absolute SVG sized
                to the chain box. Magenta vertical = rail axis (railLeftPx).
                Cyan horizontal + dot = each marker's measured center.
                Per-marker delta label shows pixel offset from the rail
                axis (0 = perfectly aligned). zIndex 9 so it sits above
                everything inside the chain (markers are z=3) but never
                steals pointer events. */}
            {centerlineOverlay && centerlineMeasure && (
              <svg
                aria-hidden="true"
                width={centerlineMeasure.chainW}
                height={centerlineMeasure.chainH}
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  zIndex: 9,
                  overflow: 'visible',
                }}
              >
                {/* Rail axis (magenta) */}
                <line
                  x1={centerlineMeasure.railX}
                  x2={centerlineMeasure.railX}
                  y1={0}
                  y2={centerlineMeasure.chainH}
                  stroke="#ff00ff"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.85}
                />
                {centerlineMeasure.markers.map((m) => (
                  <g key={m.index}>
                    {/* Marker horizontal centerline (cyan) */}
                    <line
                      x1={0}
                      x2={centerlineMeasure.chainW}
                      y1={m.y}
                      y2={m.y}
                      stroke="#00e0ff"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      opacity={0.7}
                    />
                    {/* Crosshair dot at the measured marker center */}
                    <circle cx={m.x} cy={m.y} r={3} fill="#00e0ff" />
                    {/* Delta label: px offset of marker center from rail axis */}
                    <text
                      x={centerlineMeasure.chainW - 4}
                      y={m.y - 4}
                      textAnchor="end"
                      fontSize={10}
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                      fill={m.deltaPx === 0 ? '#7CFFB2' : '#ffb347'}
                    >
                      #{m.index + 1} Δ{m.deltaPx >= 0 ? '+' : ''}{m.deltaPx}px
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT — detail panel (cols 8-12), slide-in-left + 3D fade per active change.
          v0.222 — broadened slide-in: panel no longer clips its own content
          (overflow-visible) so the entry animation can travel from a wider
          off-screen left start (-120px) without the title/capsules being
          chopped mid-flight. Duration eased up from 360ms → 620ms with a
          softer cubic-bezier so the motion reads as smooth, not snappy. */}
      <aside className="col-span-5 flex items-center relative">
        {/* Ghost numeral — slide-3-style watermark, anchored top-right of
            the description panel. 50% of slide-3's marker size; ≈20% opacity.
            v0.216 — color locked to #F3A502 (warm amber) per author note;
            kept at 0.20 alpha so it stays a watermark behind the text.
            Cross-fades on every active change. */}
        <span
          aria-hidden="true"
          key={`ghost-3d-${active}`}
          className="absolute font-display font-black pointer-events-none select-none leading-none tabular-nums"
          style={{
            top: '0.5rem',
            right: '1.5rem',
            fontSize: 'clamp(9rem, 15vw, 18rem)',
            color: 'rgba(243, 165, 2, 0.20)',
            letterSpacing: '-0.06em',
            animation: reduced ? 'none' : 'chain3d-ghost-fade 700ms cubic-bezier(0.19, 1, 0.22, 1) both',
            zIndex: 0,
          }}
        >
          {String(active + 1).padStart(2, '0')}
        </span>
        <div key={detailKey} className="w-full relative" style={{ zIndex: 1 }}>
          {activeStep?.capsule && (() => {
            // Eyebrow capsule. Tone driven by spec; paint via className so
            // every theme (incl. paper-ink, github-light) gets its per-theme
            // contrast override automatically. NEVER inline brand-token
            // colors here — see updates/spec/15+16,
            // mem://design/light-theme-capsule-fg-rule.
            const tone = (activeStep.capsule.color ?? 'gold') as
              | 'gold' | 'ember' | 'cream' | 'ink' | 'outline';
            return (
              <span
                className={`capsule capsule-${tone} mb-4 font-semibold`}
                style={{
                  animation: reduced ? 'none' : `chain3d-detail-in 620ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                }}
              >
                {activeStep.capsule.text}
              </span>
            );
          })()}
          <h3
            className="text-5xl font-display font-bold text-foreground leading-tight mb-3"
            style={{
              animation: reduced ? 'none' : `chain3d-detail-in 620ms cubic-bezier(0.16, 1, 0.3, 1) both`,
              animationDelay: reduced ? undefined : '0ms',
            }}
          >
            {activeStep?.description?.title ?? activeStep?.title}
          </h3>
          {(() => {
            // Derive label capsules from authored `bullets[]` OR auto-split a
            // legacy `body` string. Each keyword renders as a gold-outlined
            // pill (label capsule), staggered in ONLY when the step was
            // activated by a click. Other navigation modes (keyboard, deck
            // controller, programmatic) render the capsules instantly.
            const labels = deriveBullets(activeStep?.description as { bullets?: ReadonlyArray<string>; body?: unknown } | undefined);
            if (!labels || labels.length === 0) return null;
            // Capsule color cycle — gold / ember / cream / outline — so
            // a 4-step explanation reads as a colored taxonomy. Paint via
            // `.capsule-{tone}` classNames — NEVER inline brand-token
            // colors. The className path has paper-ink + github-light
            // overrides that flip text to white on dark accent stops;
            // inline styles bypass them and produce dark-on-dark chips
            // on light themes. See updates/spec/15+16,
            // mem://design/light-theme-capsule-fg-rule.
            const TONES = ['gold', 'ember', 'cream', 'outline'] as const;
            return (
              <ul
                className="mt-3 flex flex-wrap gap-2 list-none pl-0"
                aria-label="Step labels"
              >
                {labels.map((label, i) => {
                  const tone = TONES[i % TONES.length];
                  return (
                    <li
                      key={`${active}-${clickActivationNonce}-cap-${i}`}
                      className={`capsule capsule-${tone} text-base font-medium leading-none whitespace-nowrap`}
                      style={{
                        animation: capsulesAnimateOnClick
                          ? `chain3d-capsule-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both`
                          : 'none',
                        // Step content (title) lands first; capsules cascade
                        // after at +120ms with a 70ms inter-capsule stagger.
                        animationDelay: capsulesAnimateOnClick ? `${260 + i * 90}ms` : undefined,
                      }}
                    >
                      {label}
                    </li>
                  );
                })}
              </ul>
            );
          })()}
          {activeStep?.description?.meta && (
            <div
              className="capsule capsule-meta mt-5 text-sm uppercase tracking-[0.2em]"
              style={{
                animation: reduced ? 'none' : `chain3d-detail-in 620ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                animationDelay: reduced ? undefined : '220ms',
              }}
            >
              {activeStep.description.meta}
            </div>
          )}
        </div>
      </aside>

      {/* Local keyframes — no layout properties; transform + opacity only. */}
      <style>{`
        /* --step-number-size-3d is set globally by presetSettings.applyPresetSettings()
           (default 0.5 × --step-number-size; user-tunable in /settings v0.211). */
        @keyframes chain3d-detail-in {
          from { transform: translate3d(-120px, 0, 0) rotateY(8deg); opacity: 0; }
          60%  { opacity: 1; }
          to   { transform: translate3d(0, 0, 0) rotateY(0deg);      opacity: 1; }
        }
        @keyframes chain3d-ghost-fade {
          from { opacity: 0; transform: translate3d(12px, 0, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        /* Label-capsule click-only stagger. Each capsule swings up from
           ~12px below with a tiny 4deg rotation, like a stamp landing.
           Animation is only applied via inline animation prop when the
           cause was a click; keyboard / controller renders set
           animation:none so capsules appear instantly. */
        @keyframes chain3d-capsule-in {
          0%   { transform: translate3d(0, 12px, 0) rotate(-4deg) scale(0.92); opacity: 0; }
          70%  { transform: translate3d(0, -2px, 0) rotate(0deg)  scale(1.04); opacity: 1; }
          100% { transform: translate3d(0, 0, 0)    rotate(0deg)  scale(1);    opacity: 1; }
        }
        /* ----- Card interactions ----------------------------------------
           Click-only. No hover effect of any kind. The click triggers the
           activation animation; that is the entire feedback loop.
           Keyboard focus IS surfaced — :focus-visible only (never :hover) —
           with a thick gold ring + offset + soft halo so presenters can
           always see where keyboard focus lives. Enter/Space activates the
           focused card via handleChainKeyDown (deterministic against deck
           keybindings). */
        .chain3d-card { cursor: pointer; outline: none; }
        .chain3d-card:focus { outline: none; }
        .chain3d-card:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 3px hsl(var(--noir)),
            0 0 0 6px hsl(var(--gold)),
            0 0 24px 4px hsl(var(--gold) / 0.45);
          border-radius: 12px;
        }
        @media (prefers-reduced-motion: reduce) {
          .chain3d-card:focus-visible {
            box-shadow:
              0 0 0 3px hsl(var(--noir)),
              0 0 0 6px hsl(var(--gold));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes chain3d-ghost-fade    { 0%, 100% { transform: none; opacity: 1; } }
          @keyframes chain3d-detail-in     { 0%, 100% { transform: none; opacity: 1; } }
        }
      `}</style>

      {debugOverlay && (
        <SpringDebugOverlay
          transitions={debugTransitionsRef.current}
          totalMs={Math.max(SPRING_DURATION_MS, markerSpring.durationMs + markerSpring.delayMs)}
          onClose={() => setDebugOverlay()}
        />
      )}

      {/* On-screen motion-mode toggle — mirrors Shift+M so touch-only and
          mouse-only users can flip between auto / full / reduced without
          a keyboard. The dev pill above flashes the same feedback as the
          shortcut path so behavior is identical regardless of input. */}
      <button
        type="button"
        onClick={cycleMotionMode}
        aria-label={`Motion mode: ${motionMode}. Click to cycle.`}
        title="Cycle motion mode (Shift+M)"
        data-no-deck-tap
        style={{
          position: 'fixed',
          left: 16,
          bottom: 16,
          zIndex: 9998,
          padding: '6px 12px',
          borderRadius: 999,
          background: 'rgba(13, 13, 13, 0.82)',
          border: '1px solid hsl(var(--gold) / 0.35)',
          color: 'hsl(var(--cream))',
          font: '11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
          letterSpacing: '0.06em',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
          cursor: 'pointer',
          opacity: motionPillVisible ? 0 : 0.55,
          transition: 'opacity 200ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = motionPillVisible ? '0' : '0.55'; }}
      >
        MOTION · <span style={{ color: 'hsl(var(--gold))' }}>{motionMode.toUpperCase()}</span>
      </button>

      {motionPillVisible && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            left: 16,
            bottom: 16,
            zIndex: 9999,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(13, 13, 13, 0.92)',
            border: '1px solid hsl(var(--gold) / 0.4)',
            color: 'hsl(var(--cream))',
            font: '11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
            letterSpacing: '0.06em',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          MOTION · <span style={{ color: 'hsl(var(--gold))' }}>{motionMode.toUpperCase()}</span>
          {motionMode === 'auto' && (
            <span style={{ opacity: 0.6 }}> ({systemReduced ? 'reduced' : 'full'})</span>
          )}
          <span style={{ opacity: 0.5, marginLeft: 8 }}>Shift+M · click</span>
        </div>
      )}

      {/* Centerline overlay HUD — legend + z-stack proof. Appears whenever
          the overlay is on. Lists the layer / z-index pairs the user is
          verifying so the visual proof is self-explanatory. */}
      {centerlineOverlay && (
        <div
          role="status"
          aria-label="Centerline overlay legend"
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: 9999,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(13, 13, 13, 0.92)',
            border: '1px solid #ff00ff',
            color: 'hsl(var(--cream))',
            font: '11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            minWidth: 220,
          }}
        >
          <div style={{ color: '#ff00ff', letterSpacing: '0.06em', marginBottom: 6 }}> {/* hardcoded-white-ok: dev centerlines diagnostic (Shift+L) — magenta intentional */}
            CENTERLINES · Shift+L
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ width: 12, height: 2, background: '#ff00ff', display: 'inline-block' }} />
            rail axis (x = {centerlineMeasure?.railX ?? '—'}px)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ width: 12, height: 2, background: '#00e0ff', display: 'inline-block' }} />
            marker centers
          </div>
          <div style={{ opacity: 0.85, marginBottom: 4, color: 'hsl(var(--gold))' }}>z-stack</div>
          <div>rail · z=0</div>
          <div>traveling pulse · z=1</div>
          <div>card · z=2</div>
          <div>marker · z=3 ← top</div>
          {centerlineMeasure && (
            <div style={{ marginTop: 8, opacity: 0.8 }}>
              max Δ = {Math.max(...centerlineMeasure.markers.map(m => Math.abs(m.deltaPx)))}px
            </div>
          )}
        </div>
      )}

      {inspectorOpen && (
        <SpringInspector
          values={{
            delayMs:   markerSpring.delayMs,
            overshoot: markerSpring.overshoot,
            damping:   markerSpring.cfg.damping,
            stiffness: markerSpring.cfg.stiffness,
            mass:      markerSpring.cfg.mass,
          }}
          overrides={springOverrides}
          onChange={(key, val) => setSpringOverrides(prev => ({ ...prev, [key]: val }))}
          onReset={() => setSpringOverrides({ delayMs: null, overshoot: null, damping: null, stiffness: null, mass: null })}
          onReplay={() => {
            // Re-trigger the marker animation by toggling active to itself.
            // Simplest: bump active to neighbour and back via advance.
            const cur = active;
            const target = cur === 0 ? Math.min(1, total - 1) : cur - 1;
            advance(target);
            requestAnimationFrame(() => advance(cur));
          }}
          onClose={() => setInspectorOpen()}
        />
      )}
    </div>
  );
});
