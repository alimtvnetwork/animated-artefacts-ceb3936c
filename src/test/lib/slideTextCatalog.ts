/**
 * Slide-text token catalog for the contrast audit.
 *
 * Each entry describes a class of text region that appears on one or more
 * slide types, with its foreground token, alpha multiplier, and the
 * background token it gets composited over. The audit script
 * (`scripts/contrast-audit.ts`) walks this catalog × every theme × every
 * viewport and computes WCAG ratios.
 *
 * Why catalogued vs. DOM-walked:
 *   The deck uses fixed-1920×1080 + transform: scale() (see slides-app
 *   architecture), so text colors don't change with viewport width — only
 *   render scale does. JSDOM also can't reliably resolve our CSS-variable
 *   chain. A declarative catalog is therefore both faster AND more
 *   honest about what we're actually checking. The viewport axis is
 *   preserved so future viewport-conditional rules surface here too.
 *
 * If you add a new themed text rule to a slide type, ADD IT HERE so the
 * audit can guard it. If you remove a rule, remove its entry. The
 * `present-on` field keeps the matrix tight by skipping slide types that
 * don't actually use a given primitive.
 */

import { WCAG } from './contrast';

const TYPE_NORMAL = WCAG.AA_NORMAL;
const TYPE_LARGE = WCAG.AA_LARGE;

/** Slide types that exist in the showcase deck (the "test deck"). */
export const TEST_DECK_SLIDE_TYPES = [
  'TitleSlide',
  'MiddleTitleSlide',
  'CapsuleListSlide',
  'StepTimelineSlide',
  'KeywordSlide',
  'MetricGridSlide',
  'QrMeetingSlide',
  'ClickRevealSlide',
  'SectionDividerSlide',
] as const;

export type SlideType = (typeof TEST_DECK_SLIDE_TYPES)[number];

export type FgRef =
  | { kind: 'token'; token: string }
  /** Hardcoded RGB (e.g. brand-locked button label). Use sparingly. */
  | { kind: 'rgb'; rgb: [number, number, number] };

export type BgRef =
  | { kind: 'token'; token: string }
  /** A colored surface (e.g. gold CTA button) — composited from another token. */
  | { kind: 'token-surface'; token: string };

export interface TextTokenEntry {
  /** Stable id used in audit reports. */
  id: string;
  /** Human label that surfaces on failures. */
  label: string;
  /** Slide types where this rule renders. */
  presentOn: ReadonlyArray<SlideType>;
  /** Foreground color reference. */
  fg: FgRef;
  /** Foreground alpha 0–1. */
  alpha: number;
  /** Background reference. */
  bg: BgRef;
  /** Required WCAG contrast threshold (use TYPE_NORMAL or TYPE_LARGE). */
  min: number;
  /** Source-of-truth CSS rule (helps locate the file when audit fails). */
  source: string;
}

/** Catalog v1 — covers every text role used by the showcase deck. */
export const TEXT_TOKEN_CATALOG: ReadonlyArray<TextTokenEntry> = [
  // ── Universal title chrome ─────────────────────────────────────────────
  {
    id: 'slide-title-display',
    label: 'Slide title (display)',
    presentOn: ['TitleSlide', 'MiddleTitleSlide', 'SectionDividerSlide'],
    fg: { kind: 'token', token: '--foreground' },
    alpha: 1,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_LARGE,
    source: '.slide-title-display → color: hsl(var(--foreground))',
  },
  {
    id: 'slide-title-content',
    label: 'Slide title (content)',
    presentOn: [
      'CapsuleListSlide',
      'StepTimelineSlide',
      'KeywordSlide',
      'MetricGridSlide',
      'QrMeetingSlide',
      'ClickRevealSlide',
    ],
    fg: { kind: 'token', token: '--foreground' },
    alpha: 1,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_LARGE,
    source: '.slide-title-content → color: hsl(var(--foreground))',
  },
  {
    id: 'slide-eyebrow',
    label: 'Eyebrow ("STEP 1", "HOW WE WORK")',
    presentOn: [
      'TitleSlide',
      'MiddleTitleSlide',
      'CapsuleListSlide',
      'StepTimelineSlide',
      'KeywordSlide',
      'MetricGridSlide',
      'QrMeetingSlide',
      'ClickRevealSlide',
      'SectionDividerSlide',
    ],
    fg: { kind: 'token', token: '--gold' },
    alpha: 1,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_NORMAL,
    source: '.slide-eyebrow → color: hsl(var(--gold))',
  },
  {
    id: 'slide-subtitle',
    label: 'Subtitle / sub-copy',
    presentOn: [
      'TitleSlide',
      'MiddleTitleSlide',
      'CapsuleListSlide',
      'StepTimelineSlide',
      'KeywordSlide',
      'QrMeetingSlide',
      'ClickRevealSlide',
    ],
    fg: { kind: 'token', token: '--foreground' },
    alpha: 0.7,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_NORMAL,
    source: '.slide-subtitle → color: hsl(var(--foreground)/0.7)',
  },

  // ── StepTimelineSlide-specific ──────────────────────────────────────────
  {
    id: 'step-title-active',
    label: 'Step title — ACTIVE row ("Discovery")',
    presentOn: ['StepTimelineSlide'],
    fg: { kind: 'token', token: '--foreground' },
    alpha: 1,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_LARGE,
    source: '.step-row[data-state="active"] .step-title',
  },
  {
    id: 'step-title-adjacent',
    label: 'Step title — ADJACENT row',
    presentOn: ['StepTimelineSlide'],
    fg: { kind: 'token', token: '--foreground' },
    alpha: 0.62,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_LARGE,
    source: '.step-row[data-state="adjacent"] .step-title (alpha 0.62)',
  },
  {
    id: 'step-title-far',
    label: 'Step title — FAR row',
    presentOn: ['StepTimelineSlide'],
    fg: { kind: 'token', token: '--foreground' },
    alpha: 0.55,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_LARGE,
    source: '.step-row[data-state="far"] .step-title (alpha 0.55)',
  },
  {
    id: 'step-label',
    label: 'Step label ("STEP 1")',
    presentOn: ['StepTimelineSlide'],
    fg: { kind: 'token', token: '--gold' },
    alpha: 1,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_NORMAL,
    source: 'step-label → text-gold',
  },

  // ── CapsuleListSlide-specific ───────────────────────────────────────────
  // Capsules render with background = --gold/0.18 over --background, label = --cream.
  // Composite the gold-tinted surface against background for accurate ratio.
  {
    id: 'capsule-label',
    label: 'Capsule label text',
    presentOn: ['CapsuleListSlide', 'StepTimelineSlide', 'TitleSlide'],
    fg: { kind: 'token', token: '--cream' },
    alpha: 1,
    // capsule surface is ~ gold @ 0.18 on background — but the LABEL color is
    // pinned cream, which contrasts against the deepest interpretation of the
    // surface (gold-tint on light = near-cream-on-cream worst case). We
    // approximate by checking against --background which is what the
    // capsule sits on; non-noir themes redefine --cream to dark ink so this
    // ramp stays legible.
    bg: { kind: 'token', token: '--background' },
    min: TYPE_NORMAL,
    source: 'Capsule label → color: hsl(var(--cream))',
  },

  // ── MetricGridSlide-specific ────────────────────────────────────────────
  {
    id: 'metric-value',
    label: 'Metric value (big number)',
    presentOn: ['MetricGridSlide'],
    fg: { kind: 'token', token: '--gold' },
    alpha: 1,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_LARGE,
    source: 'MetricGridSlide value → text-gold',
  },
  {
    id: 'metric-label',
    label: 'Metric label (caption)',
    presentOn: ['MetricGridSlide'],
    fg: { kind: 'token', token: '--foreground' },
    alpha: 0.78,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_NORMAL,
    source: 'MetricGridSlide caption → text-foreground/78',
  },

  // ── QrMeetingSlide-specific ─────────────────────────────────────────────
  {
    id: 'qr-meeting-url',
    label: 'QR meeting URL',
    presentOn: ['QrMeetingSlide'],
    fg: { kind: 'token', token: '--foreground' },
    alpha: 1,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_NORMAL,
    source: 'QrMeetingSlide URL label → text-foreground',
  },

  // ── CTAs (inverse-on-gold) ──────────────────────────────────────────────
  {
    id: 'cta-button-label',
    label: 'CTA button label (on gold surface)',
    presentOn: ['StepTimelineSlide', 'ClickRevealSlide', 'QrMeetingSlide'],
    fg: { kind: 'token', token: '--primary-foreground' },
    alpha: 1,
    bg: { kind: 'token-surface', token: '--gold' },
    min: TYPE_NORMAL,
    source: 'CTA: bg=--gold, fg=--primary-foreground',
  },

  // ── Click-reveal expand panel body ──────────────────────────────────────
  {
    id: 'click-reveal-body',
    label: 'Click-reveal expand-panel body copy',
    presentOn: ['ClickRevealSlide'],
    fg: { kind: 'token', token: '--foreground' },
    alpha: 1,
    bg: { kind: 'token', token: '--background' },
    min: TYPE_NORMAL,
    source: 'ClickRevealSlide body → text-foreground',
  },
];
