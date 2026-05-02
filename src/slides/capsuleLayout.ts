/**
 * Resolver for `content.capsuleLayout` — turns the optional, partial JSON
 * spec into a fully-populated, clamped `ResolvedCapsuleLayout` that
 * `CapsuleListSlide` can render directly.
 *
 * Defaults preserve legacy auto-flow rendering (flex-wrap, 16px gap,
 * start/center alignment, opacity 1) so existing decks render unchanged.
 *
 * Spec: spec/slides/slide.schema.json `capsuleLayout`.
 */
import type { CapsuleLayoutSpec } from './types';

export interface ResolvedCapsuleLayout {
  /** When defined, render as CSS grid with this many equal columns. */
  columns: number | undefined;
  /** Column gap in px, clamped to [0, 96]. */
  gapPx: number;
  /** Row gap in px, clamped to [0, 96]. Defaults to `gapPx` when unset. */
  rowGapPx: number;
  /** Horizontal alignment within the row. */
  align: 'start' | 'center' | 'end' | 'between';
  /** Vertical (cross-axis) alignment of capsules within the row. */
  verticalAlign: 'start' | 'center' | 'end' | 'stretch';
  /** Resting opacity per capsule, clamped to [0, 1]. Default 1. */
  capsuleOpacity: number;
}

const DEFAULTS: Omit<ResolvedCapsuleLayout, 'columns'> = {
  gapPx: 16,
  rowGapPx: 16,
  align: 'start',
  verticalAlign: 'center',
  capsuleOpacity: 1,
};

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampInt(v: unknown, min: number, max: number, fallback: number | undefined): number | undefined {
  if (v === undefined || v === null) return fallback;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

const ALIGN_VALUES = new Set(['start', 'center', 'end', 'between']);
const V_ALIGN_VALUES = new Set(['start', 'center', 'end', 'stretch']);

export function resolveCapsuleLayout(layout: CapsuleLayoutSpec | undefined): ResolvedCapsuleLayout {
  const gapPx = clampNum(layout?.gapPx, 0, 96, DEFAULTS.gapPx);
  const rowGapPx = layout?.rowGapPx === undefined
    ? gapPx
    : clampNum(layout.rowGapPx, 0, 96, gapPx);
  const align = layout?.align && ALIGN_VALUES.has(layout.align) ? layout.align : DEFAULTS.align;
  const verticalAlign = layout?.verticalAlign && V_ALIGN_VALUES.has(layout.verticalAlign)
    ? layout.verticalAlign
    : DEFAULTS.verticalAlign;
  const capsuleOpacity = clampNum(layout?.capsuleOpacity, 0, 1, DEFAULTS.capsuleOpacity);
  const columns = clampInt(layout?.columns, 1, 6, undefined);

  return { columns, gapPx, rowGapPx, align, verticalAlign, capsuleOpacity };
}
