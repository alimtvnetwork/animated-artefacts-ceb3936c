/**
 * Preset settings — user-tunable knobs that override the defaults baked into
 * `src/index.css` for the premium preset. Persisted in localStorage so the
 * choice survives reloads and applies to every deck the user opens going
 * forward (existing deck JSONs don't pin these — the live CSS-var overrides
 * win).
 *
 * # What can be tuned
 *   - Title clamp scale  →  `--preset-title-display-*` and `--preset-title-content-*`
 *   - Body font          →  `--preset-body-font` (used by `.slide-subtitle`)
 *   - Brand-strip rule   →  `--preset-rule-thickness` + `--preset-rule-color`
 *
 * # Why CSS variables, not classes
 * The existing `.slide-title-display`, `.slide-title-content`,
 * `.slide-subtitle`, and the BrandStrip divider all read these vars. That
 * means a single setter (`applyPresetSettings`) instantly restyles every
 * slide on screen without re-rendering React. No flash of wrong style on
 * hard refresh either, because we apply on module load (see `main.tsx`).
 */
const STORAGE_KEY = 'riseup.presetSettings.v1';
const BODY_ALIGNMENT_MIGRATION_KEY = 'riseup.presetSettings.bodyAlignment.v0.68';

export type BodyFontChoice = 'inter' | 'ubuntu';
export type BodyAlignmentChoice = 'centered' | 'header-anchored';

export interface PresetSettings {
  /** Title clamp scale — both display and content title sizes are derived
   *  from this multiplier. 1 = default; 0.85 = compact, 1.15 = loud. */
  titleScale: number;
  /** Brand-strip rule thickness in px. 0 hides the rule entirely. */
  ruleThickness: number;
  /** Brand-strip rule color — any HSL token name from `index.css`
   *  (e.g. `gold`, `cream`, `ember`, `border`). */
  ruleColor: 'gold' | 'cream' | 'ember' | 'border';
  /** Body font for `.slide-subtitle`. Titles always remain Ubuntu. */
  bodyFont: BodyFontChoice;
  /** When true, render the bottom-center dot pagination indicator on every
   *  linear slide. Off by default — opt-in only.
   *  See `spec/slides/13-dot-pagination.md`. */
  showDotPagination: boolean;
  /** Dot pagination collapses to `1 … cur±n … N` once the deck has more than
   *  this many slides. Default 15. See `spec/27-slides-number/05-*.md`. */
  dotPaginationMaxBeforeCollapse: number;
  /** Neighbors shown either side of the current slide when collapsed.
   *  Default 2. */
  dotPaginationNeighbors: number;
  /**
   * Body grid horizontal alignment on wide screens.
   * - `centered` — body grid uses `margin-inline: auto` so the
   *   1440px master container sits in the middle of the viewport.
   * - `header-anchored` (default) — body grid's left edge anchors to the same x as
   *   the BrandHeader logo (independent of viewport width). The container
   *   keeps its `max-width: 1440px` cap so very wide screens don't stretch
   *   the column, but it no longer centers — it stays left-aligned with
   *   the logo for a stronger vertical sight line.
   * See `spec/slides/34-body-grid-alignment.md`.
   */
  bodyAlignment: BodyAlignmentChoice;
  /**
   * Live alignment guide overlay. When true, two vertical dashed lines are
   * drawn over the deck — one at the BrandHeader logo's left edge, one at
   * the body grid's left edge — plus a HUD readout showing both x-positions
   * and the delta between them. Pure debug; never shipped to a real
   * audience. See `spec/slides/35-alignment-guide.md`.
   */
  showAlignmentGuide: boolean;
  /**
   * v0.205 — When true, the alignment overlay also paints translucent RED
   * "target" rectangles for the desired logo + presenter-chip positions
   * discussed in the spec 3 design conversation. Lets the author drag the
   * logo/chip while seeing both the LIVE position (gold/cream guides) and
   * the TARGET position (red boxes) at the same time.
   *
   * Independent of `showAlignmentGuide`: targets can be on while the live
   * guides are off, and vice-versa. See `ALIGNMENT_TARGETS` below for the
   * pixel coordinates (stage-space, 1920×1080).
   */
  showAlignmentTargets: boolean;
  /**
   * v0.206 — "Pixel Snap" preview mode. When true:
   *   1. Sets `<html data-pixel-snap="true">` which (via `index.css`) kills
   *      every CSS animation/transition AND forces the BrandHeader logo
   *      and presenter chip to whole-pixel offsets via integer-rounded
   *      `--brand-inset-x` (no clamp/sub-pixel jitter).
   *   2. `motionPreferences.prefersReducedMotion()` returns true while
   *      this flag is on, so JS-driven Framer animations also flatten
   *      to their final keyframe — no mid-flight measurements.
   *
   * Designed for verifying step-timeline rail / eyebrow / title pixel
   * alignment against the Guides/Targets overlay without animation noise.
   * Independent of the user's OS reduced-motion preference and of the
   * /handout export-mode flag — turning it on does not affect either.
   */
  pixelSnap: boolean;
  /**
   * Extra horizontal nudge (in px) added to the body-grid left margin when
   * `bodyAlignment === 'header-anchored'`. Use this to fine-tune how far the
   * StepTimeline rail and title block sit inboard from the BrandHeader logo.
   * Range 0–8px. Default 0 = base clamp only (10–18px).
   * See `spec/slides/34-body-grid-alignment.md`.
   */
  bodyGridNudge: number;
  /**
   * When true (default), alignment guide overlays are temporarily
   * suppressed during the JSON manifest export action AND while the
   * browser is in print preview (`@media print` mirrors this).
   * Prevents the gold/cream/ember dashed guides from sneaking into
   * screenshots, recordings, or PDF exports captured around an export
   * action. The user's `showAlignmentGuide` toggle is restored to its
   * pre-export value after the download fires.
   * See `spec/slides/39-hide-guides-on-export.md`.
   */
  hideAlignmentGuideOnExport: boolean;
  /**
   * Global scale multiplier for the BrandHeader logo (and presenter chip
   * avatar). 1.0 = the original full-size logo (`h-16` / 64px tall).
   * Default 0.85 = the v0.88 "−15% smaller" treatment that shipped with
   * the bracketed inset. Range 0.6–1.2 in 0.05 steps. Drives the CSS var
   * `--brand-logo-scale` consumed by `src/slides/components/BrandHeader.tsx`.
   * See `spec/slides/48-logo-scale-setting.md`.
   */
  logoScale: number;
  /**
   * Horizontal brand inset in px — the single source of truth for where the
   * BrandHeader logo (left) AND the presenter chip (right) sit, plus the
   * body grid's left edge when `bodyAlignment === 'header-anchored'`. By
   * mirroring the inset on both sides, the chip stays symmetric with the
   * wordmark no matter how far inboard the deck is bracketed. Drives the
   * CSS var `--brand-inset-x` (defined in `src/index.css`); a 48px floor
   * is applied via `max()` so phones keep the logo on-canvas.
   * Range 48–360px in 2px steps. Default 218px (the v0.94 optical sweet
   * spot on a 1920 stage).
   */
  brandInsetX: number;
  /**
   * When true, `brandInsetX` is auto-derived from `logoScale` instead of
   * being a free slider. The math anchors on the v0.94 optical sweet spot:
   *   inset = round(218 * logoScale / 0.85)
   * That keeps the gap between the logo's right edge and "where the wordmark
   * starts" optically constant as the logo grows or shrinks. Disable to
   * tune the inset independently of the logo size.
   * See `spec/slides/53-logo-inset-coupling.md`.
   */
  autoInsetFromLogo: boolean;
  /**
   * v0.156 — handout footer customisation. Three independent knobs that
   * apply to every page of the PDF handout (`/handout` route). All are
   * additive — the user can show none, any, or all of them simultaneously.
   *
   * - `handoutShowSlideNumbers` — toggles the "01 / 24" page-number badge
   *   in the bottom-right. Default ON (matches v0.119 behaviour).
   * - `handoutPresenterName` — free-text string rendered bottom-left. Empty
   *   string = hidden. Default empty (opt-in only).
   * - `handoutConfidentialityLabel` — small chip rendered bottom-center
   *   (e.g. "Confidential", "Internal Only", "Draft"). Empty = hidden.
   *
   * All three render inside the `.handout-page-footer` strip so they sit
   * in the letterbox bar (v0.155 fit-to-page) and never overlap slide
   * content. Live-applied via the same settings store — no reload needed.
   */
  handoutShowSlideNumbers: boolean;
  handoutPresenterName: string;
  handoutConfidentialityLabel: string;
  /**
   * v0.157 — handout cover page. When true (default), `/handout` renders an
   * extra A4 page BEFORE the first slide showing the deck title, the
   * presenter byline (reuses `handoutPresenterName` if set), and today's
   * date. Pure visual chrome — does not affect the live deck or slide
   * numbering on the footer (numbers still start at 01 for the first real
   * slide). Optional override `handoutCoverSubtitle` lets the user add a
   * tagline under the title (e.g. "Q4 Investor Briefing"); empty = hidden.
   */
  handoutShowCover: boolean;
  handoutCoverSubtitle: string;
  /**
   * v0.159 — Press-and-hold Enter autoplay timing knobs. The presenter UI
   * arms an autoplay interval after the user holds Enter for `autoplayHoldMs`,
   * then advances `next()` every `autoplayTickMs` until release. Both default
   * to the original v0.120 values (400 / 900) so existing muscle memory is
   * preserved. Three discrete presets surfaced in /settings:
   *   - Snappy   — 300 / 700  (fast walkthroughs, dense decks)
   *   - Balanced — 400 / 900  (default; matches typical slide transition)
   *   - Relaxed  — 700 / 1200 (storytelling, pauses to read)
   * Stored as raw ms so future custom-slider work doesn't need a migration.
   */
  autoplayHoldMs: number;
  autoplayTickMs: number;
  /**
   * v0.167 — Deck-wide slide transition timing override. When any of these
   * fields is set (≠ null), it wins over `deck.transitionTiming` for every
   * slide — but per-slide `content.transitionTiming` still wins over this
   * (per-slide is the most specific level). Each field is independently
   * nullable so the user can pin only `easing` while letting deck JSON
   * supply `durationMs`, etc.
   *
   * Stored in PresetSettings (not deck JSON) because it's a presenter-level
   * pacing preference, the same way `autoplay*Ms` is. Resolved into a
   * `TransitionTimingSpec` by `resolveDeckTransitionOverride()` at render
   * time before being passed to `<SlideStage deckTransitionTiming />`.
   *
   * `null` means "no override at this level — fall back to deck JSON / built-in".
   */
  transitionDurationMs: number | null;
  transitionDelayMs: number | null;
  transitionEasing: TransitionEasingChoice | null;
  /**
   * v0.210 — Live fine-tune nudges for the brand chrome and step-timeline rail,
   * exposed in /settings as five independent sliders. All in stage px (1920×1080
   * coordinate space) and applied via CSS-var-driven `translate()` transforms so
   * they cost nothing at render time and animate smoothly when dragging.
   *
   *  - `logoOffsetX` / `logoOffsetY`  → translate the BrandHeader logo
   *  - `chipOffsetX` / `chipOffsetY`  → translate the presenter chip pill
   *  - `stepTimelineShiftX`           → translate the StepTimeline header block
   *
   * Range −80…+80 px in 1px steps. Default 0 = no nudge (preserves the v0.209
   * baseline). These sit ON TOP of `--brand-inset-x/y` so the inset still
   * controls the global anchor and these sliders only fine-tune.
   */
  logoOffsetX: number;
  logoOffsetY: number;
  chipOffsetX: number;
  chipOffsetY: number;
  stepTimelineShiftX: number;
  /**
   * v0.211 — Live scale knob for the StepsChain3D top numeric markers.
   * Stored as a ratio of the slide-3 base marker size (`--step-number-size`,
   * defaults to 96px), so 0.5 = the previous hard-coded value (48px) and
   * 1.0 = the same size as slide 3. Resolved into `--step-number-size-3d`
   * by `applyPresetSettings()`. Range 0.25–1.0 in 0.05 steps.
   */
  stepNumberSize3dRatio: number;
}

/**
 * v0.167 — named-easing shortlist surfaced in the Settings UI. Mirrors the
 * named-easings table in `src/slides/transitions.ts` so every option here
 * is guaranteed to resolve to a real cubic-bezier at render time. Authors
 * who need a custom 4-tuple still have it via per-slide `transitionTiming`
 * in JSON — we keep the panel UI to the curated list to avoid asking the
 * user to type bezier coordinates.
 */
export const TRANSITION_EASING_OPTIONS = [
  'expoOut', 'expoIn', 'expoInOut',
  'easeOut', 'easeIn', 'easeInOut',
  'circOut', 'circIn', 'circInOut',
  'backOut', 'backIn', 'backInOut',
  'linear',
] as const;
export type TransitionEasingChoice = typeof TRANSITION_EASING_OPTIONS[number];

export const TRANSITION_DURATION_BOUNDS = { min: 0,    max: 2000, step: 50 } as const;
export const TRANSITION_DELAY_BOUNDS    = { min: 0,    max: 1000, step: 25 } as const;

export const TITLE_SCALE_BOUNDS = { min: 0.7, max: 1.3, step: 0.05 } as const;
export const RULE_THICKNESS_BOUNDS = { min: 0, max: 4, step: 1 } as const;
export const BODY_GRID_NUDGE_BOUNDS = { min: 0, max: 8, step: 1 } as const;
export const LOGO_SCALE_BOUNDS = { min: 0.6, max: 1.2, step: 0.05 } as const;
export const BRAND_INSET_X_BOUNDS = { min: 48, max: 360, step: 2 } as const;
/** v0.210 — fine-tune nudge bounds (logo/chip/step-timeline). Symmetric so
 *  the slider centers on 0 and the user can pull either way. */
export const NUDGE_OFFSET_BOUNDS = { min: -80, max: 80, step: 1 } as const;
/** v0.211 — StepsChain3D top-marker scale, as a ratio of `--step-number-size`. */
export const STEP_NUMBER_SIZE_3D_RATIO_BOUNDS = { min: 0.25, max: 1.0, step: 0.05 } as const;
/** Dot-pagination ellipsis windowing bounds (spec 27/05). `maxBeforeCollapse`
 *  is the slide count above which the strip collapses to `1 … cur±n … N`;
 *  `neighbors` is how many dots flank the current slide when collapsed. */
export const DOT_PAGINATION_COLLAPSE_BOUNDS = { min: 5, max: 99, step: 1 } as const;
export const DOT_PAGINATION_NEIGHBORS_BOUNDS = { min: 1, max: 5, step: 1 } as const;

/** Clamp `value` into `[bounds.min, bounds.max]`, falling back to `min` on NaN. */
export function clampToBounds(value: number, bounds: { min: number; max: number }): number {
  if (Number.isNaN(value)) return bounds.min;
  return Math.max(bounds.min, Math.min(bounds.max, value));
}

/** Optical sweet-spot mapping baked in v0.94: at logoScale 0.85, the deck
 *  reads cleanest with brandInsetX = 218px. Used by `autoInsetFromLogo`. */
export const LOGO_INSET_ANCHOR = { logoScale: 0.85, brandInsetX: 218 } as const;

/** Compute the auto-coupled inset for a given logo scale, clamped to the
 *  same bounds as the manual slider so the two modes stay interchangeable. */
export function computeAutoBrandInsetX(logoScale: number): number {
  const raw = Math.round(LOGO_INSET_ANCHOR.brandInsetX * logoScale / LOGO_INSET_ANCHOR.logoScale);
  return Math.max(BRAND_INSET_X_BOUNDS.min, Math.min(BRAND_INSET_X_BOUNDS.max, raw));
}

/**
 * v0.205 — Stage-coordinate "red box" target rectangles for the desired
 * logo + presenter chip positions discussed in the spec 3 design pass
 * (move logo down/left, push chip right/down). All values are in 1920×1080
 * stage px so the overlay can paint them inside `SlidePreview` without
 * caring about CSS scale.
 *
 * `LOGO`: nudged ~80px LEFT and ~40px DOWN from the current header slot.
 *         Sized for the v0.88 small logo (≈217×54 + breathing room).
 * `CHIP`: shifted ~80px RIGHT and ~25px DOWN from the current chip slot,
 *         vertically centered with the new logo target.
 *
 * The overlay reads `--brand-inset-x` at runtime so a single source of
 * truth (the inset token) keeps the targets in sync if the user later
 * tweaks the inset slider.
 */
export const ALIGNMENT_TARGETS = {
  /** Stage width — locked. */
  stageWidth: 1920,
  /** Logo target rect (stage px). x is computed from `--brand-inset-x` − 80
   *  at render-time; w/h are intrinsic. */
  logo: { xOffsetFromInset: -80, y: 60, w: 240, h: 80 },
  /** Chip target rect (stage px). x is computed from `--brand-inset-x` + 80
   *  inset on the right; w/h sized for the pill. */
  chip: { xOffsetFromInset: 80, y: 70, w: 280, h: 70 },
} as const;

export const DEFAULT_PRESET_SETTINGS: PresetSettings = {
  titleScale: 1,
  ruleThickness: 1,
  ruleColor: 'gold',
  bodyFont: 'inter',
  showDotPagination: true,
  dotPaginationMaxBeforeCollapse: 15,
  dotPaginationNeighbors: 2,
  bodyAlignment: 'header-anchored',
  showAlignmentGuide: false,
  showAlignmentTargets: false,
  pixelSnap: false,
  bodyGridNudge: 0,
  hideAlignmentGuideOnExport: true,
  logoScale: 0.765,
  brandInsetX: 218,
  autoInsetFromLogo: true,
  handoutShowSlideNumbers: true,
  handoutPresenterName: '',
  handoutConfidentialityLabel: '',
  handoutShowCover: true,
  handoutCoverSubtitle: '',
  autoplayHoldMs: 400,
  autoplayTickMs: 900,
  transitionDurationMs: null,
  transitionDelayMs: null,
  transitionEasing: null,
  logoOffsetX: 0,
  logoOffsetY: 18,
  chipOffsetX: 0,
  chipOffsetY: 18,
  stepTimelineShiftX: 0,
  stepNumberSize3dRatio: 0.65,
};

/**
 * v0.167 — Resolve the user's preset overrides into a `TransitionTimingSpec`
 * that can be passed to `<SlideStage deckTransitionTiming />`. Returns
 * `undefined` when the user has set no overrides at all, so the deck JSON
 * (or built-in default) wins unchanged. When at least one field is set,
 * we build an object containing ONLY the pinned fields — `transitions.ts`
 * already does field-by-field merging, so an undefined field on the
 * returned object will fall through to deck JSON correctly.
 */
import type { TransitionTimingSpec } from './types';
export function resolveDeckTransitionOverride(s: PresetSettings): TransitionTimingSpec | undefined {
  const out: TransitionTimingSpec = {};
  if (s.transitionDurationMs !== null) out.durationMs = s.transitionDurationMs;
  if (s.transitionDelayMs    !== null) out.delayMs    = s.transitionDelayMs;
  if (s.transitionEasing     !== null) out.easing     = s.transitionEasing;
  return Object.keys(out).length === 0 ? undefined : out;
}

/**
 * v0.167 — Merge a user override (from /settings) over the deck JSON's
 * `transitionTiming` block, field by field. The user override wins per
 * field; unset fields fall through to the deck JSON. Returns `undefined`
 * when both sides are empty so we don't fabricate empty objects.
 *
 * Per-slide `content.transitionTiming` STILL wins over the result — that
 * merge happens later inside `resolveSlideTransitionConfig()`. So the
 * full precedence chain remains:
 *   per-slide  >  user override (this fn)  >  deck JSON  >  built-in default
 */
export function mergeDeckTiming(
  deckJson: TransitionTimingSpec | undefined,
  userOverride: TransitionTimingSpec | undefined,
): TransitionTimingSpec | undefined {
  if (!deckJson && !userOverride) return undefined;
  return {
    durationMs: userOverride?.durationMs ?? deckJson?.durationMs,
    delayMs:    userOverride?.delayMs    ?? deckJson?.delayMs,
    easing:     userOverride?.easing     ?? deckJson?.easing,
  };
}

/**
 * v0.159 — discrete presets surfaced in the /settings UI. Pure config —
 * the keydown handler reads the raw ms values from `getPresetSettings()`,
 * so a future custom slider can write any value without touching this list.
 */
export const AUTOPLAY_PRESETS = [
  { id: 'snappy',   label: 'Snappy',   holdMs: 300, tickMs: 700,  blurb: 'Fast walkthroughs, dense decks.' },
  { id: 'balanced', label: 'Balanced', holdMs: 400, tickMs: 900,  blurb: 'Default — matches typical slide transition.' },
  { id: 'relaxed',  label: 'Relaxed',  holdMs: 700, tickMs: 1200, blurb: 'Storytelling, pauses to read.' },
] as const;
export type AutoplayPresetId = typeof AUTOPLAY_PRESETS[number]['id'];

/** Match the user's current ms values back to a preset id, or null if custom. */
export function matchAutoplayPreset(holdMs: number, tickMs: number): AutoplayPresetId | null {
  const m = AUTOPLAY_PRESETS.find(p => p.holdMs === holdMs && p.tickMs === tickMs);
  return m ? m.id : null;
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

export function getPresetSettings(): PresetSettings {
  if (typeof window === 'undefined') return DEFAULT_PRESET_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRESET_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PresetSettings>;
    if (window.localStorage.getItem(BODY_ALIGNMENT_MIGRATION_KEY) !== '1') {
      parsed.bodyAlignment = 'header-anchored';
      window.localStorage.setItem(BODY_ALIGNMENT_MIGRATION_KEY, '1');
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_PRESET_SETTINGS, ...parsed }));
    }
    return { ...DEFAULT_PRESET_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PRESET_SETTINGS;
  }
}

/** Subscribers notified whenever settings change (used by React hooks
 *  that need to re-render when the user toggles, e.g., dot pagination). */
const listeners = new Set<() => void>();

export function subscribePresetSettings(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function setPresetSettings(next: PresetSettings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode — ignore */
  }
  applyPresetSettings(next);
  listeners.forEach((fn) => fn());
}

export function resetPresetSettings(): PresetSettings {
  setPresetSettings(DEFAULT_PRESET_SETTINGS);
  return DEFAULT_PRESET_SETTINGS;
}

/* ------------------------------------------------------------------ */
/* Apply to <html>                                                     */
/* ------------------------------------------------------------------ */

/**
 * Stamp the settings as CSS variables on `<html>`. The four classes in
 * `index.css` (`.slide-title-display`, `.slide-title-content`,
 * `.slide-subtitle`) and the BrandStrip divider read these vars directly.
 *
 * Title clamp values are derived from defaults:
 *   display: clamp(2.5rem, 6vw, 6rem)   * scale
 *   content: clamp(2rem,  4.2vw, 3.75rem) * scale
 */
export function applyPresetSettings(s: PresetSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Title scale — multiply each of the three clamp args.
  const dispMin  = (2.5  * s.titleScale).toFixed(3);
  const dispVw   = (6    * s.titleScale).toFixed(3);
  const dispMax  = (6    * s.titleScale).toFixed(3);
  const contMin  = (2    * s.titleScale).toFixed(3);
  const contVw   = (4.2  * s.titleScale).toFixed(3);
  const contMax  = (3.75 * s.titleScale).toFixed(3);

  root.style.setProperty('--preset-title-display-size', `clamp(${dispMin}rem, ${dispVw}vw, ${dispMax}rem)`);
  root.style.setProperty('--preset-title-content-size', `clamp(${contMin}rem, ${contVw}vw, ${contMax}rem)`);

  // Body font — only affects subtitles + body text. Titles stay Ubuntu.
  const bodyStack =
    s.bodyFont === 'ubuntu'
      ? `'Ubuntu', 'Inter', sans-serif`
      : `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  root.style.setProperty('--preset-body-font', bodyStack);

  // Rule thickness + color
  root.style.setProperty('--preset-rule-thickness', `${s.ruleThickness}px`);
  root.style.setProperty('--preset-rule-color', `hsl(var(--${s.ruleColor}))`);

  // v0.89 — global brand logo scale. 1.0 = original full size; 0.85 = the
  // v0.88 "−15% smaller" default. Consumed by BrandHeader for both the
  // wordmark image and the presenter chip avatar so they shrink together.
  const safeLogoScale = Math.max(0.6, Math.min(1.2, s.logoScale ?? 0.85));
  root.style.setProperty('--brand-logo-scale', `${safeLogoScale}`);

  // v0.128 — single brand-inset-x knob. Mirrors the inset on BOTH sides of
  // BrandHeader (logo paddingLeft + presenter chip paddingRight) and feeds
  // the body grid in `header-anchored` mode below. Floor at 48px via max()
  // so very small viewports never push the logo off-canvas.
  // v0.129 — when `autoInsetFromLogo` is on, the inset tracks `logoScale`
  // via the optical sweet-spot anchor (218px @ 0.85). That keeps the
  // logo-to-content rhythm constant when the user shrinks/grows the logo.
  const effectiveInset = s.autoInsetFromLogo
    ? computeAutoBrandInsetX(safeLogoScale)
    : (s.brandInsetX ?? 218);
  const safeInset = Math.max(48, Math.min(360, effectiveInset));
  // v0.206 — Pixel Snap mode rounds the inset to a whole pixel and drops
  // the `max(48px, ...)` wrapper so getBoundingClientRect() returns
  // integer-aligned values. Outside snap mode we keep the responsive
  // floor for tiny viewports.
  // v0.207 — `--brand-inset-y` is the vertical companion. Its baseline
  // matches the historical body-grid `pt-24..pt-28` reserve, but it now
  // scales with the logo so a bigger logo automatically pushes the body
  // title down (and a smaller one pulls it up) — keeping the gap between
  // the logo's bottom and the eyebrow's top optically constant.
  //
  //   base 116px @ logoScale 0.85  ⇒  ratio 116 / 0.85 ≈ 136.5
  //
  // We round to a whole pixel always (vertical sub-pixel padding causes
  // measurable text reflow on Chromium); pixel-snap mode adds the same
  // integer treatment to `--brand-inset-x`.
  const insetY = Math.round(136.5 * safeLogoScale);
  if (s.pixelSnap) {
    root.style.setProperty('--brand-inset-x', `${Math.round(safeInset)}px`);
    root.style.setProperty('--brand-inset-y', `${insetY}px`);
    root.setAttribute('data-pixel-snap', 'true');
  } else {
    root.style.setProperty('--brand-inset-x', `max(48px, ${safeInset}px)`);
    root.style.setProperty('--brand-inset-y', `${insetY}px`);
    root.removeAttribute('data-pixel-snap');
  }

  // Body grid alignment — switches the master container between centered
  // (margin-inline: auto) and header-anchored (margin-left ≡ header px,
  // margin-right: auto). Both vars are read by `.step-timeline-content`
  // and any future body grid that opts in. See spec 34.
  if (s.bodyAlignment === 'header-anchored') {
    // v0.88 — body grid now anchors to the same `--brand-inset-x` token used
    // by BrandHeader (defined in index.css). 15% of viewport, clamped at
    // 48px..288px so the body title's left edge tracks the logo's left edge
    // exactly across all viewport widths. The `bodyGridNudge` slider still
    // adds a 0–8px fine-tune ON TOP of the brand inset, scaled responsively
    // (30% on mobile → 100% on desktop) so a 1px nudge on a laptop doesn't
    // become 4px of visual drift on a 4K display.
    const nudge = Math.max(0, Math.min(8, s.bodyGridNudge ?? 0));
    const base = 'var(--brand-inset-x)';
    if (nudge === 0) {
      root.style.setProperty('--body-grid-margin-left', base);
    } else {
      const min = (nudge * 0.3).toFixed(2);
      const max = nudge.toFixed(2);
      const responsiveNudge = `clamp(${min}px, ${(nudge / 12.8).toFixed(3)}vw, ${max}px)`;
      root.style.setProperty(
        '--body-grid-margin-left',
        `calc(${base} + ${responsiveNudge})`,
      );
    }
    root.style.setProperty('--body-grid-margin-right', 'auto');
  } else {
    root.style.setProperty('--body-grid-margin-left', 'auto');
    root.style.setProperty('--body-grid-margin-right', 'auto');
  }

  // v0.210 — fine-tune nudges. All five live as CSS vars so the consumers
  // (BrandHeader logo+chip, StepTimeline header) can inhale them via
  // `translate()` without re-rendering. Clamped to NUDGE_OFFSET_BOUNDS.
  const clampN = (n: number | undefined) =>
    Math.max(NUDGE_OFFSET_BOUNDS.min, Math.min(NUDGE_OFFSET_BOUNDS.max, n ?? 0));
  root.style.setProperty('--brand-logo-offset-x', `${clampN(s.logoOffsetX)}px`);
  root.style.setProperty('--brand-logo-offset-y', `${clampN(s.logoOffsetY)}px`);
  root.style.setProperty('--brand-chip-offset-x', `${clampN(s.chipOffsetX)}px`);
  root.style.setProperty('--brand-chip-offset-y', `${clampN(s.chipOffsetY)}px`);
  root.style.setProperty('--step-timeline-shift-x', `${clampN(s.stepTimelineShiftX)}px`);

  // v0.211 — StepsChain3D top numeric marker size, as a ratio of the
  // slide-3 base marker size. Default 0.5 = the previous hard-coded 48px.
  const ratio = Math.max(
    STEP_NUMBER_SIZE_3D_RATIO_BOUNDS.min,
    Math.min(STEP_NUMBER_SIZE_3D_RATIO_BOUNDS.max, s.stepNumberSize3dRatio ?? 0.5),
  );
  root.style.setProperty('--step-number-size-3d', `calc(var(--step-number-size, 96px) * ${ratio.toFixed(3)})`);
}
