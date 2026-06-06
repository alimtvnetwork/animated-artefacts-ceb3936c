import type { SlideTypeValue, SlideTransitionValue, TextAnimationValue, CapsuleColorValue } from './enums';

export interface CapsuleSpec {
  text: string;
  color: CapsuleColorValue;
  /**
   * Legacy click-to-navigate target. When set (and no `expand` payload is
   * present), clicking the capsule routes the deck to this slide number
   * (still used by older showcase decks for full-page reveals).
   */
  clickRevealSlide?: number;
  /**
   * Hover label flip (spec 22). When set, hovering the capsule plays a
   * vertical label flip — the original `text` rotates out the top and
   * `hoverText` rotates in from the bottom. Cleared on mouse-leave.
   */
  hoverText?: string;
  /**
   * Inline expanding-card reveal (spec 22). When set, clicking the capsule
   * grows it into a full panel on the SAME slide instead of navigating
   * away. Other capsules dim and the card animates from the capsule's
   * footprint outward. Click outside (or press Esc) to collapse.
   *
   * Treat this as the modern alternative to `clickRevealSlide`. If both
   * are present, `expand` wins.
   */
  expand?: CapsuleExpandSpec;
  /**
   * Optional leading icon (v0.188). Pass a lucide-react icon *name* in
   * PascalCase (e.g. `'Sparkles'`, `'Zap'`, `'Target'`). Resolved at render
   * time via the `lucide-react` `icons` map — unknown names silently skip.
   * Pair with `iconBadge: true` to render the icon inside a contrasting
   * circular plate (stronger hierarchy for "step" capsules); otherwise the
   * icon is rendered inline as a small leading glyph (lighter affordance).
   */
  icon?: string;
  /**
   * When true, render `icon` inside a contrasting circular badge plate
   * tucked into the capsule's leading edge. Use this for step / status
   * capsules where the icon should read as an emblem, not decoration.
   * Ignored when `icon` is unset or the name is unknown. v0.188.
   */
  iconBadge?: boolean;
}

/**
 * Payload for the inline expanding-card reveal (spec 22 §3). Authors write
 * keyword-first content — short title, 1-2 sentence body, optional sub-
 * capsules, optional CTA. The card layout is owned by the slide renderer.
 */
export interface CapsuleExpandSpec {
  /** Optional bigger headline shown at the top of the expanded card. Falls back to the capsule `text`. */
  title?: string;
  /** Eyebrow line above the title. Wide tracking, gold tint. */
  eyebrow?: string;
  /** 1-2 sentence body. Keyword-first per the deck-wide content rule. */
  body?: string;
  /** Optional supporting capsules rendered inside the card. */
  capsules?: CapsuleSpec[];
  /** Optional primary CTA pill rendered after the body / capsules. */
  cta?: { text: string; href?: string; onClickRevealSlide?: number };
  /**
   * Entrance animation for the modal panel itself. Defaults to `morph`
   * (the existing Framer `layoutId` spring that grows the panel out of the
   * source capsule). Choose another preset for variety:
   *   - `morph`     : capsule → panel rect interpolation (default)
   *   - `fade`      : opacity 0 → 1 only
   *   - `slideUp`   : translateY +24px → 0 + fade
   *   - `slideDown` : translateY −24px → 0 + fade
   *   - `pushLeft`  : translateX +48px → 0 + fade (panel pushes in from right)
   *   - `pushRight` : translateX −48px → 0 + fade (panel pushes in from left)
   * Reduced motion ignores this and uses a 180ms opacity fade.
   */
  animation?: 'morph' | 'fade' | 'slideUp' | 'slideDown' | 'pushLeft' | 'pushRight';
  /**
   * Entrance animation for the panel's inner labels (eyebrow + title +
   * body + supporting capsules). Defaults to `slideUp` (today's behavior:
   * y:10 → 0 fade with 180ms delay). Other presets:
   *   - `stagger` : each child slides up + fades in sequence (60ms apart)
   *   - `fade`    : single opacity-only fade, no translation
   *   - `slideUp` : current default
   * Reduced motion forces opacity-only fade with no translation.
   */
  labelAnimation?: 'stagger' | 'fade' | 'slideUp';
}

/**
 * Generic click-reveal contract (spec 26). Any element that opts in becomes a
 * clickable trigger that either:
 *   - navigates the deck to a hidden slide (`revealSlide`), OR
 *   - opens an inline expanding card on the same slide (`expand`).
 *
 * Currently mixed into `StepSpec` and `HotspotSpec`. `CapsuleSpec` already
 * carries the same shape via `clickRevealSlide`/`expand` and is treated as
 * a click-reveal trigger by the renderer for back-compat.
 *
 * Activation rule: an element is interactive ONLY when it declares at least
 * one of `revealSlide` / `expand`. Authors opt in per-element — there is no
 * implicit "every step is clickable" mode.
 *
 * Precedence when both are set: `expand` wins over `revealSlide` (matches
 * the existing `CapsuleSpec` rule).
 */
export interface ClickRevealTrigger {
  /** Target slide number to navigate to on click. */
  revealSlide?: number;
  /** Inline expanding-card payload. When set, click opens the card on this slide. */
  expand?: CapsuleExpandSpec;
  /**
   * Optional accessible label for the click action ("Open: Strategy detail").
   * Falls back to a sensible default per host element type.
   */
  revealLabel?: string;
}

export interface StepSpec extends ClickRevealTrigger {
  label: string;
  title: string;
  /** One-line caption shown under the step title in `StepTimelineSlide`. */
  subtitle?: string;
  /**
   * Step narrative for the right detail panel. Two shapes are supported:
   *
   * 1. **`string`** (FocusTimelineSlide / StepTimelineSlide) — multi-sentence
   *    presenter narration. 1–2 sentences. Only the focused step shows it.
   * 2. **`{ title?, bullets[]?, meta?, body? }`** (StepsChain3DSlide) —
   *    keywords-only structured payload. The right panel renders
   *    `bullets[]`; legacy `body` is auto-split via `deriveBullets()`.
   *
   * Editor: `Description3DEditor` for the object form, plain `<Input>`
   * fallback for the string form. See `ContentFieldEditor.tsx`.
   */
  description?: string | { title?: string; bullets?: string[]; meta?: string; body?: string };
  capsule?: CapsuleSpec;
  /**
   * Optional per-step thumbnail image rendered beside the row (spec
   * `21-slides-system/images/01-image-authoring.md`). Any `<img src>` value:
   * public asset, `.svg`, Base64, or data URI. Routed through the placement
   * resolver at the `inlineThumbnail` slot by default; override with
   * `imageRole`. Keep it small — it sits inline with the step text.
   */
  image?: string;
  /** Explicit slot override for the step `image`. Defaults to `inlineThumbnail`. */
  imageRole?:
    | 'inlineThumbnail'
    | 'iconBadge'
    | 'bodyFigure';
  /**
   * Optional per-step primary CTA pill rendered in the right detail panel
   * of `StepTimelineSlide` (spec 17 §step-CTA addendum). Click plays the
   * deck-wide click sound and either follows `href` (external/anchor),
   * routes the deck to `revealSlide`, or fires the deck `onCta` handler.
   */
  cta?: StepCtaSpec;
  /**
   * Per-step horizontal nudge (in stage px, 0–80). Adds a left padding to
   * the step row so the author can snap the label/title/capsule to one of
   * the three alignment guides (Logo edge / Body grid edge / Timeline rail)
   * without editing CSS. Filled by the Step editor's "Snap to…" buttons,
   * which read the live guide x-positions from the preview.
   * See `spec/slides/40-step-snap-to-guides.md`.
   */
  leftOffsetPx?: number;
  /**
   * Per-step right-side nudge (in stage px, 0–160). Adds a right padding +
   * caps `max-width` on the step row so the author can pull the label /
   * title / capsule's RIGHT edge inward to align with one of the alignment
   * guides (Body grid right edge / Rail / a custom inner column). Mirrors
   * `leftOffsetPx`; filled by the Step editor's right-side "Snap to…"
   * buttons. Range clamped at runtime to [0, 160] so an over-aggressive
   * value can't crush the row to zero width.
   *
   * v0.86 — companion to `leftOffsetPx`. See
   * `spec/slides/40-step-snap-to-guides.md` §"Right-edge snap".
   */
  rightOffsetPx?: number;
  /**
   * Per-step VERTICAL nudge (in stage px, range −160…+160). Positive
   * shifts the row down, negative shifts it up. Applied as
   * `transform: translateY(...)` so neighbouring step rows in the column
   * keep their natural layout slot — this purely visually offsets the
   * row's content without re-flowing the column.
   *
   * Use to vertically align a step row with a guide on the right detail
   * panel, to compensate for visually-heavy capsules, or to break the
   * column's perfect rhythm where the design calls for it. Default 0 =
   * row sits at its natural baseline.
   *
   * v0.90 — companion to `leftOffsetPx`/`rightOffsetPx`. Spec:
   * `spec/slides/49-step-top-offset-and-timing.md`.
   */
  topOffsetPx?: number;
  /**
   * Per-step ENTER timing override. When set, replaces the slide-level
   * `content.stepTiming` preset for THIS step's reveal animation.
   * `durationMs` (0–4000), `delayMs` (0–4000), and `easing` (cubic-bezier
   * tuple `[x1,y1,x2,y2]` OR a named easing string) all individually
   * optional — provide any subset and the rest fall back to the preset.
   *
   * Default behaviour (no override anywhere): the row reveals with the
   * legacy 0.5s expo-out easing on initial mount. See
   * `spec/slides/49-step-top-offset-and-timing.md`.
   */
  enter?: StepAnimOverride;
  /**
   * Per-step EXIT timing override. Mirrors `enter`, applies when the step
   * leaves focus (active → inactive transition). When omitted, falls back
   * to the slide-level `content.stepTiming` preset's exit timing, then to
   * legacy defaults. Use to make e.g. step 1 dramatically slow-fade while
   * step 2 snaps out.
   */
  exit?: StepAnimOverride;
  /**
   * Per-step REVEAL MODE — the *shape* of the row's first-mount animation
   * (independent from the *tempo*, which is owned by `enter` / `stepTiming`).
   *
   *   • `'fade'`         — opacity 0 → 1 only. No movement. Calmest option.
   *   • `'slide'`        — opacity 0 → 1 + x −24px → 0 (the legacy default).
   *   • `'pushLeft'`     — opacity 0 → 1 + x +24px → 0 (mirror of `slide`,
   *                        row enters from the right pushing leftward).
   *   • `'timelineLand'` — the cinematic "lands onto the guide" reveal
   *                        previously locked behind `leftOffsetPx > 0`. Row
   *                        slides in from `-(max(leftOffsetPx, 24) + 32)px`
   *                        over 1.1s with the same expo-out easing as the
   *                        active text-slide. Adds `step-row--snap-reveal`
   *                        for the gold rail underline.
   *
   * Authored independently of `leftOffsetPx` per the v0.122 spec change —
   * the snap offset and the reveal motion are now orthogonal. When omitted,
   * legacy behaviour preserved: `leftOffsetPx > 0` ⇒ `'timelineLand'`,
   * otherwise `'slide'`. See spec/slides/53-step-reveal-mode.md.
   */
  revealMode?: 'fade' | 'slide' | 'pushLeft' | 'timelineLand';
}

/**
 * Per-step animation override block. All fields optional — a partial
 * override merges with the slide-level preset rather than replacing it.
 *
 * Easing accepts EITHER a `[x1, y1, x2, y2]` cubic-bezier tuple (the same
 * shape Framer Motion accepts inline) OR one of the named easings:
 * `'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'circIn' | 'circOut'
 *  | 'circInOut' | 'backIn' | 'backOut' | 'backInOut' | 'expoOut'
 *  | 'expoIn' | 'expoInOut'`.
 *
 * Spec: `spec/slides/49-step-top-offset-and-timing.md`.
 */
export interface StepAnimOverride {
  /** Animation length in milliseconds. Clamped to [0, 4000]. */
  durationMs?: number;
  /** Delay before the animation starts. Clamped to [0, 4000]. */
  delayMs?: number;
  /** Easing — cubic-bezier tuple OR a named easing string. */
  easing?: [number, number, number, number] | string;
  /**
   * Translate-Y distance the row travels during this side of the
   * animation, in px. Positive = starts BELOW its resting slot (enter)
   * or ends BELOW (exit); negative = above. Clamped to [-200, 200].
   *
   * - `enter.offsetPx`  ⇒ `initial.y` (and `animate.y === 0`)
   * - `exit.offsetPx`   ⇒ `exit.y`
   *
   * When omitted, the renderer falls back to the slide-default reveal
   * mode's hardcoded distance (e.g. `slide` mode = ±24px). Authoring
   * this knob makes a "soft 8px drift" vs "dramatic 80px push" exactly
   * reproducible across decks instead of relying on the preset name.
   *
   * Spec: `spec/slides/49-step-top-offset-and-timing.md` §"Per-step
   * motion distance".
   */
  offsetPx?: number;
}

/**
 * Named timing presets for step enter/exit animations. Each preset
 * defines BOTH the in and out tempo so the slide reads with a consistent
 * voice. Resolved to concrete `{ durationMs, easing }` pairs by
 * `resolveStepTimingPreset()` in `src/slides/types/StepTimelineSlide.tsx`.
 *
 * - `instant`    → 0ms in / 0ms out (no animation; useful for QA / print)
 * - `snappy`     → 220ms in / 180ms out, easeOut (UI-fast)
 * - `smooth`     → 480ms in / 320ms out, expo-out (DEFAULT, current behaviour)
 * - `cinematic`  → 900ms in / 600ms out, expo-out (presentation-slow)
 * - `dramatic`   → 1400ms in / 900ms out, expo-out (showcase / hero step)
 *
 * Spec: `spec/slides/49-step-top-offset-and-timing.md`.
 */
export type StepTimingPresetName =
  | 'instant'
  | 'snappy'
  | 'smooth'
  | 'cinematic'
  | 'dramatic';

/** Per-step CTA pill rendered in the StepTimeline detail panel. */
export interface StepCtaSpec {
  /** Visible label, e.g. "Learn more". */
  text: string;
  /** Optional external URL. Opens in a new tab when set. */
  href?: string;
  /** Optional click-reveal target slide number (deck-internal navigation). */
  revealSlide?: number;
  /** Visual style — defaults to `gold`. */
  variant?: 'gold' | 'outline';
}

/**
 * Single contact row used by `QrMeetingSlide` to render a vertical list of
 * location/email/phone/etc lines next to the QR. Each row pairs an icon
 * (lucide-react name or 'pin' | 'mail' | 'phone' | 'globe') with a label.
 */
export interface ContactRow {
  /** Icon slug. Resolved by `QrMeetingSlide` to a lucide-react icon. */
  icon: 'pin' | 'mail' | 'phone' | 'globe' | 'calendar';
  /** Visible text. Multi-line allowed via `\n`. */
  text: string;
  /** Optional href — when present the row becomes a link (mailto:, tel:, https:). */
  href?: string;
}

/** Optional CTA pill rendered below the contact rows in `QrMeetingSlide`. */
export interface ContactCta {
  text: string;
  href: string;
  /** Visual style — defaults to `gold`. */
  variant?: 'gold' | 'outline';
  /**
   * When set, render the CTA inline as a row of the contact list (replacing
   * the text with the button) using the provided icon. Mirrors the
   * contact-card spec where "Schedule a Call" lives in the list itself.
   */
  icon?: ContactRow['icon'];
}

/**
 * Optional social link icon rendered below the CTA on the contact card.
 * Bare icons, no background pill — distinct from `ContactRow` tiles.
 */
export interface SocialLink {
  /**
   * Icon slug. Resolved by `QrMeetingSlide` to a lucide-react icon.
   * `facebook` is part of the canonical Riseup contact card and is required
   * whenever the company has a public Facebook page (see spec 19).
   */
  icon: 'linkedin' | 'mail' | 'github' | 'twitter' | 'globe' | 'facebook';
  href: string;
  /** Optional accessible label override; defaults to the icon name. */
  label?: string;
}

export interface HotspotSpec {
  /**
   * Target slide number to reveal on click. Optional only when `expand` is
   * set instead — at least one of `revealSlide`/`expand` MUST be present
   * (renderer drops the hotspot otherwise).
   */
  revealSlide?: number;
  /** Inline expanding-card payload (spec 26). When set, click opens the card on this slide. */
  expand?: CapsuleExpandSpec;
  /** Position as percentages of the 1920x1080 stage. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Optional accessible label (announced to screen readers, shown as tooltip). */
  label?: string;
  /** Visual style. `outline` shows a faint dashed box; `ghost` is fully transparent until hover. Defaults to `ghost`. */
  style?: 'outline' | 'ghost';
}

/**
 * `MetricGridSlide` cell. Big number + label + optional caption per metric.
 * `value` is a free-form string so authors can include units, prefixes, or
 * suffixes ("$4.2M", "99.9%", "3M+", "<10ms") without runtime second-guessing.
 * 2-6 metrics per slide; layout auto-derives (2x1, 3x1, 2x2, 3x2).
 */
export interface MetricSpec {
  /** Headline value rendered huge. e.g. "3M", "$4.2M", "99.9%". */
  value: string;
  /** Short label rendered under the value. e.g. "Active users". */
  label: string;
  /** Optional one-line caption rendered under the label. */
  caption?: string;
  /** Accent color for the value. Defaults to `'gold'`. */
  accent?: CapsuleColorValue;
}

/**
 * `MediaGridSlide` tile — a single image/SVG cell with an optional caption.
 * `src` accepts any `<img src>` value (asset / SVG / Base64 / data URI), same
 * contract as `content.image`. See
 * `spec/26-slide-definitions/_patterns/media-grid-slide.md`.
 */
export interface MediaTileSpec {
  /** Tile image source. Required. */
  src: string;
  /** Optional one-line caption under the tile. */
  caption?: string;
}

/* ============================================================================
 * v0.169 — generic slide-type schemas (TableSlide / CodeBlockSlide /
 * BoxDiagramSlide / LayoutSlide). All four are topic-agnostic — they ship the
 * GENERIC patterns from the external presentation design system doc, mapped
 * onto our token + capsule + theme contract. Authors compose them in JSON the
 * same way they author every other slide type today.
 * ========================================================================== */

/** A single comparison-table column header. */
export interface TableColumnSpec {
  /** Column key — used to look up cells in each row. */
  key: string;
  /** Visible header label. */
  label: string;
  /** Optional explicit width (e.g. `"22%"`, `"180px"`). When omitted, the table auto-sizes. */
  width?: string;
  /** Cell text alignment. Default `'left'`. */
  align?: 'left' | 'center' | 'right';
}

/** A single comparison-table row. The first column shows the row label and an accent bar. */
export interface TableRowSpec {
  /** Row identity / display name shown in the first column. */
  name: string;
  /** Cell values keyed by `TableColumnSpec.key`. Missing keys render as an em-dash. */
  cells: Record<string, string>;
  /**
   * Per-row accent color for the left-edge bar in the first column.
   * One of the deck capsule colors (`gold`/`ember`/`cream`/`ink`/`outline`/
   * `violet`/`teal`/`rose`/`sky`) — resolved against the active theme so the
   * bar always reads on-palette.
   */
  accent?: CapsuleColorValue;
}

/**
 * A single inline token in a CodeBlockSlide line. Used in MANUAL coloring mode
 * (`syntax: 'manual'`) so authors can pin keyword/literal/comment colors
 * deterministically without depending on a tokenizer.
 */
export interface CodeTokenSpec {
  text: string;
  /** Token role. Maps to `.tok-*` classes inside `.slide-codeblock`. */
  kind?: 'plain' | 'keyword' | 'literal' | 'comment';
}

/**
 * A single field row inside a BoxDiagramSlide node (the "ER box" pattern).
 * Generic enough for ER diagrams, architecture diagrams, state diagrams.
 */
export interface DiagramFieldSpec {
  /** Field name (left-aligned). */
  name: string;
  /** Optional type / value (right-aligned, muted). */
  type?: string;
  /**
   * Field role — drives the row color.
   *   `pk`     → primary-accent color (cyan in navy-blue, gold elsewhere)
   *   `fk`     → secondary-accent color (orange in navy-blue, ember elsewhere)
   *   `plain`  → default foreground (default)
   */
  role?: 'pk' | 'fk' | 'plain';
}

/** A single node (box) inside a BoxDiagramSlide. Position is in stage units (0–100). */
export interface DiagramNodeSpec {
  /** Stable id used to anchor edges. */
  id: string;
  /** Header text (rendered in the navy bar at the top of the box). */
  title: string;
  /** Top-left x position as % of the diagram canvas (0–100). */
  x: number;
  /** Top-left y position as % of the diagram canvas (0–100). */
  y: number;
  /** Width as % of the diagram canvas (0–100). Default 22. */
  w?: number;
  /** Field rows rendered inside the box. Empty array = title-only box. */
  fields?: DiagramFieldSpec[];
}

/** A single edge between two BoxDiagramSlide nodes. */
export interface DiagramEdgeSpec {
  from: string;
  to: string;
  /** Optional verb label rendered at the midpoint (e.g. "writes", "depends on"). */
  label?: string;
  /**
   * Cardinality at each endpoint. `'1'` renders a single perpendicular tick;
   * `'N'` (a.k.a. "many") renders a crow's foot. Default `['1','N']`.
   */
  cardinality?: ['1' | 'N', '1' | 'N'];
}

/**
 * Layout grid preset. Maps 1:1 to the `.slide-grid-*` utility classes in
 * `src/index.css`. Two consumers:
 *   1. `LayoutSlide` reads `content.layout` to render `layoutSlots[]` inside
 *      the chosen grid (the original v0.169 use).
 *   2. v0.181 — *any* slide type can opt-in via `content.gridPreset`. When
 *      set, `SlideStage` wraps the slide body in a `<div data-grid-preset="…">`
 *      that applies the same `display:grid` + spacing tokens the LayoutSlide
 *      uses. Designers get one source of truth for slide-wide gutter/padding
 *      across every slide type.
 *
 * Spacing tokens (`--slide-grid-gutter`, `--slide-grid-padding-x`,
 * `--slide-grid-padding-y`) are exposed at `:root` in `index.css` so a
 * deck-wide retune is one variable away. Each preset reads them so all
 * presets stay in lockstep.
 */
export type LayoutGridPreset =
  | 'split-5-7'      // 5fr / 7fr — explanation + visual
  | 'split-4-8'      // 4fr / 8fr — short prose + big diagram
  | 'split-3-9'      // 3fr / 9fr — sidebar + main canvas
  | 'split-2-equal'  // 1fr / 1fr — pros/cons, before/after
  | '3-panel'        // three equal columns — comparison triplets
  | '12-column'      // 12-track designer grid; children use grid-column-* spans
  | 'card-grid-2x3'  // 2 cols of cards (rows flow naturally)
  | 'card-grid-3x3'  // 3 cols of cards
  | 'centered-hero'; // single centered column

export interface SlideContent {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  keywords?: string[];
  capsules?: CapsuleSpec[];
  steps?: StepSpec[];
  /**
   * v0.181 — opt-in grid container applied to ANY slide type by `SlideStage`.
   * When set, `SlideStage` wraps the slide body in a `<div data-grid-preset="…">`
   * that applies the chosen `.slide-grid-*` class plus shared spacing tokens
   * (`--slide-grid-gutter`, `--slide-grid-padding-x`, `--slide-grid-padding-y`).
   *
   * For `LayoutSlide` use `content.layout` (the original v0.169 field) — the
   * stage-level wrapper is intentionally skipped on that type to avoid double
   * grids. For every other slide type (`TitleSlide`, `KeywordSlide`,
   * `CapsuleListSlide`, `MetricGridSlide`, `TableSlide`, `CodeBlockSlide`,
   * `BoxDiagramSlide`, …) the wrapper just enforces deck-wide consistent
   * spacing without overriding the slide's own internal layout.
   */
  gridPreset?: LayoutGridPreset;
  /** `FocusTimelineSlide` only. Layout axis for the chain. Default `horizontal`. */
  direction?: 'horizontal' | 'vertical';
  /** `FocusTimelineSlide` only. How many steps are visible at once. Default 3. */
  windowSize?: 3 | 5;
  image?: string;
  /**
   * Explicit override for the resolved image placement slot. When set, the
   * image-placement resolver skips slug/filename inference and routes the
   * image straight to the named slot. Mirrors the dropdown in
   * `/image-placement` — exported overrides land here.
   */
  imageRole?:
    | 'headerLogo'
    | 'presenterAvatar'
    | 'titleHero'
    | 'bodyFigure'
    | 'inlineThumbnail'
    | 'qrOverlay'
    | 'iconBadge';
  /**
   * `ImageSlide` gallery — 2–3 figures rendered in one row. Each entry is any
   * `<img src>` value (asset / svg / Base64 / data URI). When set, `image` is
   * ignored. Keep to ≤3 to respect the density budget. See
   * `spec/21-slides-system/images/01-image-authoring.md`.
   */
  images?: string[];
  /** `ImageSlide` — short caption rendered under the figure(s). One line. */
  caption?: string;
  /**
   * `FullBleedImageSlide` — darkening gradient over the edge-to-edge media so
   * overlaid title/eyebrow text stays legible. `none` = no scrim,
   * `bottom` = gradient rising from the lower third (default),
   * `full` = even dim across the whole frame. Magic values live in the union.
   */
  scrim?: 'none' | 'bottom' | 'full';
  /**
   * `FullBleedImageSlide` — when the media is an animated GIF, hold a static
   * first frame instead of looping under `prefers-reduced-motion`. The runtime
   * cannot pause a GIF, so this flag swaps the entrance to an instant fade and
   * documents intent; pair with a still poster in `content.image` when needed.
   */
  freezeOnReducedMotion?: boolean;
  /**
   * `SplitMediaSlide` — which half carries the media. `left` puts the image on
   * the left and the text column (eyebrow/title/keywords/capsules) on the
   * right; `right` mirrors it. Default `left`.
   */
  mediaSide?: 'left' | 'right';
  /**
   * `MediaGridSlide` — 2–6 image/SVG tiles with optional captions. Layout
   * auto-derives from the count (2→1×2, 3→1×3, 4→2×2, 5/6→2×3). Density cap
   * `capTiles` (≤6) enforced via `densityCheck`.
   */
  mediaTiles?: MediaTileSpec[];
  /**
   * `GifLoopSlide` — static still frame shown instead of the looping GIF
   * (`content.image`) when `prefers-reduced-motion` is set or
   * `freezeOnReducedMotion` is true. The browser cannot pause a GIF, so this
   * poster is the only way to honor reduced-motion for animated media.
   */
  poster?: string;
  /**
   * Live meeting URL encoded into the QR. Per-slide override of `deck.meeting.url`.
   * When set (and no `qrAsset`/explicit src is provided), `BrandedQR` generates
   * the QR client-side from this URL.
   */
  meetingUrl?: string;
  /** Deprecated alias for `meetingUrl`. Kept for back-compat with older slide JSON. */
  qrUrl?: string;
  /** Registered branded-QR slug — see `BrandedQR` component registry. When set, the bundled PNG wins over `meetingUrl` (treat the asset as authored brand artwork). */
  qrAsset?: string;
  /** Human-readable URL/label shown next to the QR. Per-slide override of `deck.meeting.label`. */
  meetingLabel?: string;
  /** `QrMeetingSlide` extension — vertical contact rows rendered next to the QR. */
  contactRows?: ContactRow[];
  /** `QrMeetingSlide` extension — primary CTA pill rendered after the contact rows. */
  cta?: ContactCta;
  /** `QrMeetingSlide` extension — bare social icons rendered below the CTA. */
  socials?: SocialLink[];
  /**
   * `QrMeetingSlide` extension — visual treatment for the QR.
   * - `clean` (default): white tile + ink modules, no overlays. Maximum scan reliability.
   * - `riseup-finder`: same white tile + ink modules + 3 red rounded finder squares + center
   *   "RiseupAsia" wordmark pill. The brand contact-card variant. Red lives **only** on
   *   the white card, never on the noir background, so the deck-wide "no red on black" rule holds.
   */
  qrStyle?: 'clean' | 'riseup-finder';
  /** Free-floating clickable regions overlaid on the slide. Independent of capsules. */
  hotspots?: HotspotSpec[];
  /**
   * `MetricGridSlide` only — 2-6 headline metric cells. Layout auto-derives
   * from the count: 2→1×2, 3→1×3, 4→2×2, 5→2×3 (one empty), 6→2×3.
   */
  metrics?: MetricSpec[];
  /**
   * Per-text-block animation overrides. Keys are content blocks. Values are
   * either a preset name string (`fadeIn`, `slideUp`, `slideInLeft`,
   * `slideInRight`, `pushLeft`, `pushRight`, `bounce`, `stagger`,
   * `cinematicCapsules`, `none`) OR an object form pinning the timing knobs:
   *
   *   { "preset": "bounce", "delayMs": 200, "durationMs": 600, "easing": "easeOut" }
   *
   * The object form makes a fade-in or bounce reproducible across decks —
   * two slides using the same preset will land identically when timing is
   * pinned. See `TextAnimationOverride` in `textAnimations.ts` for the full
   * contract (and how spring presets handle `durationMs`).
   *
   * When omitted, the slide-level `textAnimation` is used.
   */
  animations?: Partial<Record<
    'eyebrow' | 'title' | 'subtitle' | 'keywords' | 'capsules' | 'steps',
    string | {
      preset: string;
      delayMs?: number;
      durationMs?: number;
      easing?: string | [number, number, number, number];
    }
  >>;
  /**
   * `StepTimelineSlide` only — JSON-driven ambient icon scatter behind the
   * step chain. When omitted, the slide falls back to its built-in defaults
   * (12-icon dev-tool pool, 6 visible per step, brand accents on
   * VS Code / GitHub / Figma). Authoring this block lets a deck pin the
   * exact icon set, density, sizing, and (optionally) explicit per-icon
   * positions so the visual reproduces 1:1 in any compliant renderer.
   */
  stepAmbient?: AmbientLayerSpec;
  /**
   * `TitleSlide` only — JSON-driven ambient icon scatter for the hero
   * background. When omitted, the slide falls back to its homepage default
   * (16 icons, 4 brand accents at indexes 12–15).
   */
  titleAmbient?: AmbientLayerSpec;
  /**
   * `StepTimelineSlide` only — per-slide horizontal nudge applied ONLY to the
   * eyebrow + title block (not to the step rows below). Positive = right,
   * negative = left. Useful when the slide's title needs to sit further into
   * the body grid than the steps below it (the user-flagged case on slide 3
   * "Engagement Process": title shifted right ~40px so it aligns with the
   * description column rather than the chip column).
   *
   * Range clamped at runtime to [-160, 160]px. Default 0 = legacy behavior.
   * Spec: `spec/slides/40-step-snap-to-guides.md` §"Header offset".
   */
  headerOffsetPx?: number;
  /**
   * `StepTimelineSlide` only — per-slide VERTICAL nudge applied ONLY to the
   * eyebrow + title block (not to the step rows below). Positive = down,
   * negative = up. Vertical companion to `headerOffsetPx`. Use to vertically
   * align the slide title with a guide on the right detail panel without
   * touching the step rail's natural baseline.
   *
   * Range clamped at runtime to [-160, 160]px. Default 0 = legacy behavior.
   * Step rows have their own per-step `step.topOffsetPx` for fine alignment.
   * Spec: `spec/slides/49-step-top-offset-and-timing.md` §"Slide-level
   * vertical nudge".
   */
  topOffsetPx?: number;
  /**
   * `StepTimelineSlide` only — slide-level default animation timing for
   * every step row's enter + exit. Either:
   *   - A `StepTimingPresetName` string (e.g. `'cinematic'`) — quick path,
   *     resolves to both the in and out tempo from the named preset.
   *   - An object `{ preset?, enter?, exit? }` — start from a preset and
   *     fine-tune individual fields. `enter`/`exit` are
   *     `StepAnimOverride` blocks (durationMs / delayMs / easing).
   *
   * Per-step `step.enter` / `step.exit` overrides STILL win on top of
   * whatever this resolves to. So the precedence chain is:
   *   1. `step.enter`/`step.exit` (per-step JSON)
   *   2. `content.stepTiming.enter`/`.exit` (slide-level overrides)
   *   3. `content.stepTiming.preset` (slide-level preset)
   *   4. Legacy default ('smooth')
   *
   * Default (omitted): `'smooth'` = 480ms in / 320ms out, expo-out —
   * matches the reveal feel that shipped before v0.90.
   * Spec: `spec/slides/49-step-top-offset-and-timing.md`.
   */
  stepTiming?: StepTimingPresetName | {
    preset?: StepTimingPresetName;
    enter?: StepAnimOverride;
    exit?: StepAnimOverride;
    /**
     * Order-timing controls for the step REVEAL cadence (the diagonal
     * cascade where each row enters slightly later than the previous).
     * Both values are in milliseconds, clamped at runtime to safe ranges.
     *
     *   - `baseDelayMs` — delay before the FIRST row's reveal starts.
     *     Default 300ms (legacy `REVEAL_BASE_DELAY`). Range [0, 4000].
     *   - `staggerMs`   — additional delay between consecutive rows.
     *     Default 180ms (legacy `REVEAL_STAGGER`). Range [0, 2000].
     *
     * These layer on top of the per-step enter `delayMs` and the named
     * preset's tempo — they purely control row ORDERING, not the
     * individual row's animation duration. Setting `staggerMs: 0` makes
     * all rows enter together; setting it to 400 produces a slow,
     * deliberate cascade. Required for blind-AI reproducibility of the
     * reveal cadence.
     */
    baseDelayMs?: number;
    staggerMs?: number;
  };
  /**
   * Slide-level entrance/exit timing override applied to the `transition`
   * enum. The enum (FadeIn / SlideIn / PushIn / PushLeft / PushRight) sets
   * the *shape* of the motion; this block sets the *timing*. Any subset of
   * fields is fine — omitted ones fall back to the deck-wide default
   * (550ms, expo-out cubic `[0.22, 1, 0.36, 1]`). Required for blind-AI
   * reproducibility — without this, two renderers can play the same
   * transition at different speeds.
   */
  transitionTiming?: TransitionTimingSpec;
  /**
   * Per-transition-type timing override for THIS slide. Keyed by the slide
   * transition name (`FadeIn`, `SlideIn`, `PushIn`, `PushLeft`, `PushRight`).
   * Only the entry whose key matches `slide.transition` is consulted at
   * render time — other keys are ignored.
   *
   * Use when one slide needs a different cadence depending on which
   * transition the deck JSON happens to assign (e.g. "if this slide ever
   * runs as a PushIn, slow it to 1.1s; if it runs as a FadeIn, snap to
   * 280ms"). Most authors won't need this — `transitionTiming` above
   * already covers the common case.
   *
   * Precedence (per field, see also `DeckSpec.transitionTimingByType`):
   *   1. `slide.content.transitionTiming.{field}`               (per-slide, all transitions)
   *   2. `slide.content.transitionTimingByType[T].{field}`      (per-slide, this transition)
   *   3. `deck.transitionTimingByType[T].{field}`               (deck, this transition)
   *   4. `deck.transitionTiming.{field}`                        (deck-wide)
   *   5. Built-in `SLIDE_TRANSITION_CONFIG` (550ms, expoOut, no delay)
   *
   * v0.168.
   */
  transitionTimingByType?: Partial<Record<SlideTransitionValue, TransitionTimingSpec>>;
  /**
   * `CapsuleListSlide` only — explicit layout knobs for the capsule row.
   * When omitted, the slide falls back to the legacy `flex-wrap gap-4`
   * auto-flow (visually correct but renderer-dependent).
   */
  capsuleLayout?: CapsuleLayoutSpec;
  /**
   * `MetricGridSlide` only — explicit grid overrides. When omitted, the
   * slide auto-derives the grid from `metrics.length` (2→1×2, 3→1×3,
   * 4→2×2, 5/6→2×3) and uses default gaps and value sizes.
   */
  metricLayout?: MetricGridLayoutSpec;

  /* ── v0.169 — generic slide-type content fields ───────────────────── */

  /** `TableSlide` only — column headers in display order. */
  tableColumns?: TableColumnSpec[];
  /** `TableSlide` only — row data, one entry per body row. */
  tableRows?: TableRowSpec[];
  /** `TableSlide` only — optional muted note rendered under the table. */
  tableNote?: string;

  /** `CodeBlockSlide` only — the code body. Newlines preserved as-is. */
  code?: string;
  /**
   * `CodeBlockSlide` only — language hint for the syntax highlighter.
   * Defaults to `'plaintext'`. Pick anything shiki supports
   * (e.g. `'sql' | 'json' | 'ts' | 'tsx' | 'bash' | 'python'`).
   */
  codeLanguage?: string;
  /**
   * `CodeBlockSlide` only — coloring strategy.
   *   `'shiki'`  → run shiki on `code` using the deck's mono theme. (default)
   *   `'manual'` → ignore `code`; render `codeTokens` line-by-line. Each
   *                token's `kind` maps to `.tok-keyword`/`.tok-literal`/
   *                `.tok-comment` so the deck's tokens win deterministically.
   *   `'plain'`  → no highlighting; render `code` as-is.
   */
  codeSyntax?: 'shiki' | 'manual' | 'plain';
  /** `CodeBlockSlide` only — used when `codeSyntax === 'manual'`. Each inner array is one line. */
  codeTokens?: CodeTokenSpec[][];
  /** `CodeBlockSlide` only — optional caption rendered under the block. */
  codeCaption?: string;
  /**
   * `CodeBlockSlide` only — 1-based line numbers to emphasise.
   * Emphasised lines pulse a warm gold backdrop in sequence (250ms stagger,
   * 1.4s total settle) on slide enter, then settle into a steady muted
   * highlight. `useReducedMotion` suppresses the pulse and renders the
   * steady highlight only. Out-of-range line numbers are silently ignored.
   */
  codeHighlightLines?: number[];
  /**
   * `CodeBlockSlide` only — render a small "Copy" button anchored top-right
   * of the code block. Defaults to `true`. Falls back to a select-all hint
   * when `navigator.clipboard.writeText` is unavailable.
   */
  codeCopyButton?: boolean;
  /**
   * `CodeBlockSlide` only — show a subtle 1-based gutter with line numbers.
   * Defaults to `true` whenever `codeHighlightLines` is set, `false` otherwise
   * so plain code blocks keep their current minimal look.
   */
  codeShowLineNumbers?: boolean;

  /** `BoxDiagramSlide` only — node boxes plotted on the diagram canvas. */
  diagramNodes?: DiagramNodeSpec[];
  /** `BoxDiagramSlide` only — directed edges between nodes (renders crow's-foot connectors). */
  diagramEdges?: DiagramEdgeSpec[];
  /** `BoxDiagramSlide` AND `ERDiagramSlide` — optional explanation paragraph rendered to the LEFT of the diagram in a 4/8 split. */
  diagramExplanation?: string;

  /**
   * `ERDiagramSlide` only — entity boxes. Same shape as `diagramNodes` but
   * the field name reflects ER terminology. v0.177. When both `entities`
   * and `diagramNodes` are present, `entities` wins (lets authors migrate
   * a `BoxDiagramSlide` over without removing the legacy keys first).
   */
  entities?: DiagramNodeSpec[];
  /**
   * `ERDiagramSlide` only — relationships between entities. Same shape as
   * `diagramEdges`. Default cardinality is `['1','N']`. v0.177.
   */
  relationships?: DiagramEdgeSpec[];

  /**
   * `LayoutSlide` only — which `.slide-grid-*` preset to use.
   * Default `'split-2-equal'`.
   */
  layout?: LayoutGridPreset;
  /**
   * `LayoutSlide` only — vertical placement of the header + grid block.
   * Use `'center'` when the slide should sit in the visual middle instead of
   * hanging from the top chrome. Default `'start'`.
   */
  layoutVerticalAlign?: 'start' | 'center';
  /**
   * `LayoutSlide` only — child slot content. Each entry becomes one cell of
   * the chosen grid (in document order). Markdown-style emphasis is NOT
   * supported — keep entries to short, single-paragraph keywords-first
   * content per house style. Use `kind: 'card'` for a default card surface,
   * `'plain'` for raw text, or `'codeblock'` to render a `.slide-codeblock`
   * with the same code/codeLanguage/codeSyntax fields above.
   */
  layoutSlots?: LayoutSlotSpec[];

  /* ── Addendum 29 — narrow-idea slide types ────────────────────────── */

  /** `NumberCalloutSlide` only — single animated number spec. */
  number?: NumberCalloutSpec;
  /** `NumberCalloutSlide` only — supporting label under the number. */
  label?: string;
  /** `NumberCalloutSlide` only — single trailing capsule (provenance/cohort tag). */
  capsule?: { color: 'gold' | 'ember' | 'cream'; text: string };

  /** `DataTableSlide` only — column definitions (≤5). */
  dataColumns?: DataTableColumnSpec[];
  /** `DataTableSlide` only — row records (≤8). */
  dataRows?: DataTableRowSpec[];

  /** `EquationSlide` only — TeX source for the equation. */
  tex?: string;
  /** `EquationSlide` only — opaque pre-rendered HTML (preferred over `tex`). */
  equationHtml?: string;
  /** `EquationSlide` only — ordered term ids matching whitespace tokens of `tex`. */
  termIds?: string[];
  /** `EquationSlide` only — flanking variable labels. */
  equationLabels?: { left?: { color?: string; text: string }; right?: { color?: string; text: string } };

  /** `DatabaseDiagramSlide` only — entities (≤5). Optional when `diagram` is provided. */
  dbEntities?: DatabaseEntitySpec[];
  /** `DatabaseDiagramSlide` only — relationships (≤6). */
  dbRelationships?: DatabaseRelationshipSpec[];
  /** `DatabaseDiagramSlide` only — Mermaid `erDiagram` source. Preferred when present. */
  diagram?: string;

  /** `ChecklistSlide` only — items list (2–7). Spec 62. */
  items?: ChecklistItemSpec[];
  /** `ChecklistSlide` only — color of the progress bar fill. */
  progressColor?: 'gold' | 'ember' | 'cream';

  /** `TileSlide` only — clickable tile cards (2–4). */
  tiles?: TileSpec[];
  /** `TileSlide` only — small italic caption under the grid. */
  tilesCaption?: string;
}

/** A single tile in `TileSlide`. */
export interface TileSpec {
  name: string;
  tag?: string;
  desc?: string;
  url?: string;
  glyph?: string;
  cta?: string;
}

/** A single row in `ChecklistSlide`. Keywords-first; `detail` is one line ≤80 chars. */
export interface ChecklistItemSpec {
  text: string;
  detail?: string;
  capsule?: { color: import('./enums').CapsuleColorValue; text: string };
}

/** Single animated number for `NumberCalloutSlide`. */
export interface NumberCalloutSpec {
  from?: number;
  to: number;
  unit?: string;
  easing?: 'linear' | 'easeOutQuint' | 'spring';
  duration?: 'fast' | 'slow';
  decimals?: number;
}

/** Column definition for `DataTableSlide`. */
export interface DataTableColumnSpec {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}

/** Row record for `DataTableSlide`. Indexed by column `key`. */
export interface DataTableRowSpec {
  [key: string]: string | undefined;
  /** Leading-cell accent bar color. */
  accent?: 'gold' | 'ember' | 'cream';
}

/** Entity for `DatabaseDiagramSlide`. */
export interface DatabaseEntitySpec {
  id: string;
  name: string;
  /** 0–100 viewBox coords; auto-laid out on a circle when omitted. */
  x?: number;
  y?: number;
  fields?: string[];
}

/** Relationship for `DatabaseDiagramSlide`. */
export interface DatabaseRelationshipSpec {
  from: string;
  to: string;
  label?: string;
}

/** A single slot inside a `LayoutSlide` grid. */
export interface LayoutSlotSpec {
  /** Slot kind — picks the rendered surface. Default `'card'`. */
  kind?: 'card' | 'plain' | 'codeblock';
  /** Optional eyebrow rendered above the title. */
  eyebrow?: string;
  /** Optional bold heading rendered at the top of the slot. */
  title?: string;
  /** Body text (1-2 sentences max, keywords-first). */
  body?: string;
  /** Optional bullet list rendered after the body. */
  bullets?: string[];
  /** When `kind === 'codeblock'` — the inline code body. */
  code?: string;
  /** When `kind === 'codeblock'` — language hint for shiki. */
  codeLanguage?: string;
  /** Visual modifier on `.slide-card` — adds a colored border. */
  variant?: 'default' | 'success' | 'danger' | 'accent';
  /** Optional CSS grid spans applied to the slot wrapper. */
  colSpan?: number;
  rowSpan?: number;
  /** Render with reduced padding/typography (slim card). Default false. */
  compact?: boolean;
}

/**
 * Slide-level entrance/exit timing. Used by `SlideStage` to override the
 * deck-wide `SLIDE_TRANSITION_CONFIG`. Spec: `spec/slides/03-animation-rules.md`.
 *
 * Example — slow, dramatic push-in for a hero slide:
 *   "transition": "PushIn",
 *   "content": { "transitionTiming": { "durationMs": 1100, "easing": "expoOut" } }
 */
export interface TransitionTimingSpec {
  /** Animation length in ms. Clamped to [0, 4000]. Default 550. */
  durationMs?: number;
  /** Pre-animation hold in ms. Clamped to [0, 4000]. Default 0. */
  delayMs?: number;
  /**
   * Easing — either a 4-tuple cubic-bezier `[x1,y1,x2,y2]` (the same shape
   * Framer Motion accepts inline) or one of the named easings:
   * `'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'expoIn' | 'expoOut'
   *  | 'expoInOut' | 'circIn' | 'circOut' | 'circInOut' | 'backIn'
   *  | 'backOut' | 'backInOut'`. Default `[0.22, 1, 0.36, 1]` (expo-out).
   */
  easing?: [number, number, number, number] | string;
}

/**
 * `CapsuleListSlide` layout knobs. All fields optional — provide any subset
 * and the rest fall back to legacy auto-flow defaults. Required for blind-AI
 * reproducibility of label-capsule rows: explicit columns/gaps/opacity pin
 * the rendering 1:1 across renderers instead of relying on flex-wrap quirks.
 */
export interface CapsuleLayoutSpec {
  /**
   * Number of equal-width columns the capsule row breaks into. When set,
   * the row uses `display:grid` with this column count instead of the
   * legacy flex-wrap. Range 1–6. Default = legacy flex-wrap.
   */
  columns?: number;
  /**
   * Gap between capsules in px (column gap when grid, both axes when flex
   * unless `rowGapPx` is also set). Range 0–96. Default 16.
   */
  gapPx?: number;
  /**
   * Vertical gap between WRAPPED rows in px. Optional — when omitted, falls
   * back to `gapPx` so a single value controls both axes. Range 0–96.
   * Most useful with the legacy flex-wrap path or multi-row grids.
   */
  rowGapPx?: number;
  /**
   * Horizontal alignment within each row.
   * - `start`  — capsules pinned to the leading edge (default).
   * - `center` — row centered.
   * - `end`    — capsules pinned to the trailing edge.
   * - `between`— space-between distribution (only meaningful with flex/wrap).
   */
  align?: 'start' | 'center' | 'end' | 'between';
  /**
   * Vertical alignment of capsules within the row's cross-axis. Useful
   * when capsules render at different heights (e.g. multi-line labels).
   * - `start`  — top-aligned.
   * - `center` — vertically centered (default).
   * - `end`    — bottom-aligned.
   * - `stretch`— stretch to row height.
   */
  verticalAlign?: 'start' | 'center' | 'end' | 'stretch';
  /**
   * Resting opacity applied to every capsule in the row. Range 0–1.
   * Default 1. Lets a deck render the capsule row as a softer secondary
   * element. Click-reveal dimming (when one capsule is expanded) still
   * multiplies on top of this baseline so contrast is preserved.
   */
  capsuleOpacity?: number;
}

/**
 * `MetricGridSlide` layout overrides. All fields optional — when omitted
 * the slide auto-derives a grid from `metrics.length` (2→1×2, 3→1×3,
 * 4→2×2, 5/6→2×3) and uses the legacy default gaps + value sizes.
 */
export interface MetricGridLayoutSpec {
  /** Explicit column count (1–6). Overrides the auto-derived grid. */
  columns?: number;
  /** Explicit row count (1–6). Overrides the auto-derived grid. */
  rows?: number;
  /** Horizontal gap between cells in px. Range 0–160. Default 48. */
  gapXPx?: number;
  /** Vertical gap between cells in px. Range 0–160. Default 56. */
  gapYPx?: number;
  /**
   * Headline value font size override. Either a CSS clamp() string (e.g.
   * `"clamp(4rem, 9vw, 9rem)"`) or a single rem/px value (e.g. `"7rem"`).
   * Default `"clamp(4rem, 9vw, 9rem)"`.
   */
  valueSize?: string;
}

/**
 * JSON-safe ambient icon layer. Used by `content.stepAmbient` (StepTimeline)
 * and `content.titleAmbient` (Title). Two complementary modes:
 *
 *   1. **Knobs only** — pick icons by slug, set density/opacity/drift, and
 *      let the deterministic seeded RNG place them. Easy to author, mostly
 *      reproducible (positions derive from the seed string).
 *   2. **Explicit positions** — provide a `positions[]` array where each
 *      entry pins one icon to an exact `top`/`left` (% of stage) with
 *      optional `size` and `accent`. Use this when a slide needs pixel
 *      control (e.g., separating the GitHub mark from a neighbor).
 *
 * When `positions[]` is set, it WINS over the knobs — the seeded scatter is
 * skipped entirely. This is the contract that lets a JSON spec reproduce
 * 1:1 across systems.
 */
export interface AmbientLayerSpec {
  /** Icon slugs from `ambientIconRegistry`. e.g. `["code2","github","figma"]`. */
  iconPool?: string[];
  /** How many icons to render per render pass. Default 6 (Step) / 16 (Title). */
  count?: number;
  /** Peak per-icon opacity (0..1). Default 0.05. */
  opacity?: number;
  /** Drift radius (0 = static). Default 0.4. */
  drift?: number;
  /** Cursor parallax max-shift in px (0 = off). Default 18. */
  parallax?: number;
  /** Min/max icon size in px. Default `[36, 72]` (Step) / `[26, 50]` (Title). */
  sizeRange?: [number, number];
  /**
   * Map of pool-index → hex color, e.g. `{ "0": "#007ACC" }`. When omitted,
   * a slug listed in `AMBIENT_DEFAULT_BRAND_COLORS` (vscode, github, …) gets
   * its default brand color automatically.
   */
  accents?: Record<string, string>;
  /** Indexes that get the gentle CSS auto-bob loop. */
  floatIndexes?: number[];
  /** Render the soft radial amber glow above the icons. */
  glow?: boolean;
  /**
   * Explicit per-icon placements. When set, replaces the seeded scatter
   * entirely so the slide reproduces 1:1 in any renderer. Each entry pins
   * one icon to `top`/`left` (% of stage). `size` and `accent` are optional;
   * `accent` overrides any pool-level accent for this slot.
   */
  positions?: AmbientIconPlacement[];
}

/** Explicit ambient-icon placement. % values are 0–100 across the 1920×1080 stage. */
export interface AmbientIconPlacement {
  /** Icon slug from `ambientIconRegistry`. */
  icon: string;
  /** Top edge as % of stage height (0 = top, 100 = bottom). */
  top: number;
  /** Left edge as % of stage width (0 = left, 100 = right). */
  left: number;
  /** Icon size in px. Defaults to the layer `sizeRange` midpoint. */
  size?: number;
  /** Hex color override. When set, this icon renders as an accent in this color. */
  accent?: string;
  /** Whether this icon participates in the auto-bob loop. */
  float?: boolean;
}

/**
 * Optional branded strip rendered as a thin band above the standard
 * BrandHeader. Configure once on the deck for a global look; override per
 * slide (set `brandStrip: false` to hide on a single slide, or pass an object
 * to replace the deck default for that slide only).
 */
export interface BrandStripSpec {
  /** Registered bundled logo slug (preferred for exports/imports). */
  logoAsset?: 'riseup-asia';
  /** Direct image src for the primary logo. Use only for absolute/export-safe URLs. */
  logo?: string;
  /** Alt text for the logo (a11y). */
  logoAlt?: string;
  /** Logo height in px (default 22, allowed 12–32 — strip is 36px tall). */
  logoHeight?: number;
  /**
   * Horizontal alignment of the logo / wordmark within the strip.
   * - `left` (default) — logo hugs the left edge, tagline pinned right
   * - `center` — logo centered, tagline still pinned right
   * - `right` — logo pinned right; if a tagline is also set, tagline moves to the left edge
   */
  logoAlign?: 'left' | 'center' | 'right';
  /**
   * Horizontal padding preset (applies to both edges).
   * - `tight` → `px-3 sm:px-4`
   * - `cozy`  → `px-5 sm:px-6 md:px-8` (default)
   * - `roomy` → `px-8 sm:px-10 md:px-14`
   */
  padding?: 'tight' | 'cozy' | 'roomy';
  /** Right-aligned tagline text, e.g. "Riseup Asia LLC · 2026 Deck". */
  tagline?: string;
  /** Tagline color tint: `gold` (brand), `cream` (soft), `muted` (low-key). Default `cream`. */
  taglineTone?: 'gold' | 'cream' | 'muted';
  /** Show a hairline gold divider under the strip. Default true. */
  divider?: boolean;
  /** Strip background tone: `solid` (semi-opaque ink), `gradient` (subtle gold→ink fade), `transparent`. Default `solid`. */
  background?: 'solid' | 'gradient' | 'transparent';
}

export interface SlideSpec {
  slideNumber: number;
  slideName: string;
  slideType: SlideTypeValue;
  transition: SlideTransitionValue;
  textAnimation: TextAnimationValue;
  /** Per-slide kill switch. Defaults to true. Set false to skip in linear flow. */
  enabled?: boolean;
  isClickReveal: boolean;
  parentSlide?: number | null;
  showBrandHeader: boolean;
  showPresenterChip: boolean;
  /**
   * Per-slide brand-strip override. Falsy values (`false` / `null`) hide the
   * strip even if the deck declares one. An object replaces the deck default
   * for this slide. Omit to inherit the deck-level config.
   */
  brandStrip?: BrandStripSpec | false | null;
  /** Title color treatment. */
  titleStyle?: 'cream' | 'gold' | 'gradient' | 'white';
  /** When true, plays a one-shot shimmer sweep across the title on entrance. */
  titleShimmer?: boolean;
  /** Speaker-only narration shown in the Presenter view. Markdown-light (newlines = paragraphs). */
  notes?: string;
  /**
   * Per-slide audio cue. Spec: `spec/slides/21-sound-system.md`. All fields
   * optional. Defaults: `on='enter'`, `kind='whoosh'`, `volume=0.45`. Some
   * slide types (e.g. AdvanceStepSlide) provide their own per-type defaults.
   */
  sound?: SlideSoundSpec;
  /**
   * Opt-in ambient background layer (spec 24). When set, `SlideStage`
   * renders an `<AmbientBackground>` behind this slide's content using the
   * preset named here. StepTimelineSlide ignores this field — it always
   * renders its own theme-specific ambient layer.
   */
  ambientBackground?: AmbientPresetName | AmbientBackgroundSpec | false;
  content: SlideContent;
}

/**
 * Named ambient presets — keep the slide JSON tiny while still letting any
 * slide opt into a coherent set. Resolved in `src/slides/ambientPresets.ts`.
 */
export type AmbientPresetName =
  | 'devtools'    // Code2 / Terminal / GitBranch / Github / Figma / Boxes / Cpu / Cloud — dev work
  | 'productivity'// FileText / Video / MessageSquare / Clipboard / UserCheck / Book / GitBranch / Users — knowledge work
  | 'process'     // Compass / Target / Hammer / TrendingUp / Workflow / Layers / Activity / Sparkles — strategy / ops
  | 'minimal';    // Sparkles only, very faint — adds atmosphere with almost no visual weight

/**
 * Full custom ambient layer config for slides that need fine control.
 * Defaults match the AmbientBackground component defaults.
 */
export interface AmbientBackgroundSpec {
  /** Named preset to start from. Other fields override the preset's values. */
  preset?: AmbientPresetName;
  /** Number of icons to scatter. Default 14. */
  count?: number;
  /** Peak per-icon opacity (0..1). Default 0.05. */
  opacity?: number;
  /** Drift radius. 0 = static. Default 0.4. */
  drift?: number;
  /** Render the soft radial amber glow above the icons. Default false. */
  glow?: boolean;
  /** Cursor parallax max-shift in px. 0 = off. Default 18. */
  parallax?: number;
}

/** Per-slide audio cue declaration. See spec 21. */
export interface SlideSoundSpec {
  /** When the cue fires. AdvanceStep defaults to 'focus'; others default to 'enter'. */
  on?: 'enter' | 'focus' | 'click';
  /** Procedural synth kind. */
  kind?: 'whoosh' | 'click' | 'pop';
  /** 0..1 master gain for this cue. Defaults to 0.45. */
  volume?: number;
  /** Hard mute for this slide regardless of `on`/`kind`. */
  mute?: boolean;
}

export type DeckPreset = 'premium';

/**
 * Deck-wide meeting/QR defaults. Surfaces the URL, label, and (optionally)
 * a registered branded-QR slug so every meeting/contact slide in the deck
 * picks up the same destination without repeating it. Per-slide
 * `content.meetingUrl` / `content.meetingLabel` / `content.qrAsset` win
 * when provided.
 */
export interface MeetingSpec {
  /** Live URL the QR encodes (e.g. "https://cal.com/riseup-asia/intro"). */
  url?: string;
  /** Human-readable label shown next to the QR (e.g. "cal.com/riseup-asia/intro"). */
  label?: string;
  /** Registered branded QR asset slug. When set, the bundled PNG wins over `url`. */
  qrAsset?: string;
}

/**
 * Deck-level asset registry. Lets a deck override or extend the built-in
 * audio/QR/brand/icon registries. Every asset slug referenced by the deck
 * or any slide MUST resolve at boot — see `assetRegistry.ts`.
 */
export interface DeckAssetsSpec {
  /** Audio cue slug → URL. Defaults: whoosh/click/fadeClick/zoom/fadeZoom. */
  audio?: Record<string, string>;
  /** QR slug → image URL. Default: `riseup-meeting`. */
  qr?: Record<string, string>;
  /** Brand chrome slug → image URL. Defaults: `logo`, `logo-trimmed`, `presenter`. */
  brand?: Record<string, string>;
  /** Ambient icon slug remap → built-in icon slug. */
  icons?: Record<string, string>;
}

export interface DeckSpec {
  deckSlug: string;
  deckName: string;
  presenter: string;
  theme: string;
  slides: string[];
  /** Deck-wide branded strip rendered above the standard BrandHeader. Per-slide overrides win. */
  brandStrip?: BrandStripSpec;
  /** Deck-wide meeting/QR defaults. Per-slide `content.meetingUrl` / `meetingLabel` / `qrAsset` win. */
  meeting?: MeetingSpec;
  /** Asset registry overrides — see `DeckAssetsSpec`. */
  assets?: DeckAssetsSpec;
  /**
   * Optional reusable preset that locks Ubuntu Bold titles, clamp-based sizing,
   * and auto-picked title colors (white for hero slides, gold for shimmer
   * slides, cream otherwise) for every slide that doesn't override.
   * See `src/slides/preset.ts`.
   */
  preset?: DeckPreset;
  /**
   * Deck-wide default transition timing. Applied to every slide whose
   * `content.transitionTiming` doesn't pin the field. Lets a deck enforce
   * a single, consistent cadence (e.g. "all slides cross-fade over 700ms
   * with expoOut") without repeating the override on every slide.
   *
   * Precedence (per field):
   *   1. `slide.content.transitionTiming.{durationMs|delayMs|easing}` (per-slide)
   *   2. `deck.transitionTiming.{durationMs|delayMs|easing}` (deck-wide)
   *   3. Built-in `SLIDE_TRANSITION_CONFIG` (550ms, expoOut, no delay)
   *
   * Required for blind-AI reproducibility — without this, a deck author
   * has to set timing on every slide to get a consistent feel across
   * renderers. v0.147.
   */
  transitionTiming?: TransitionTimingSpec;
  /**
   * Per-transition-type timing override at the deck level. Keyed by slide
   * transition name (`FadeIn`, `SlideIn`, `PushIn`, `PushLeft`, `PushRight`).
   * For each rendered slide, the entry whose key matches `slide.transition`
   * is layered between `deck.transitionTiming` (less specific) and the
   * per-slide overrides (more specific) — see precedence chain below.
   *
   * Useful when a deck wants different rhythms per transition family —
   * e.g. "all FadeIns are tight 250ms cross-fades, but every PushIn slows
   * to a 1.1s cinematic landing". Without this, the same effect would
   * require pinning timing on every slide individually.
   *
   * Precedence (per field):
   *   1. `slide.content.transitionTiming.{field}`           (per-slide, all transitions)
   *   2. `slide.content.transitionTimingByType[T].{field}`  (per-slide, this transition)
   *   3. `deck.transitionTimingByType[T].{field}`           (deck, this transition) — THIS field
   *   4. `deck.transitionTiming.{field}`                    (deck-wide)
   *   5. Built-in `SLIDE_TRANSITION_CONFIG` (550ms, expoOut, no delay)
   *
   * v0.168.
   */
  transitionTimingByType?: Partial<Record<SlideTransitionValue, TransitionTimingSpec>>;
}
