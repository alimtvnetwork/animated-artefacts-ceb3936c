/**
 * Pure windowing helper for slide-number surfaces (plan 05 / ellipsis-pagination).
 *
 * Collapses a long 1..total strip to: `1 … cur-n … cur+n … total`, where any
 * run of ≥2 skipped indices becomes a single `'gap'` token and a single
 * skipped index is rendered as its number (no `…` for a one-slide gap).
 * Spec: spec/27-slides-number/05-surface-dot-pagination.md.
 */
export type PageToken = number | 'gap';

function buildShownSet(current: number, total: number, neighbors: number): Set<number> {
  const shown = new Set<number>([1, total]);
  for (let n = current - neighbors; n <= current + neighbors; n++) {
    if (n >= 1 && n <= total) shown.add(n);
  }
  return shown;
}

function appendBridge(out: PageToken[], gapSize: number, prev: number): void {
  if (gapSize <= 0) return;
  if (gapSize === 1) out.push(prev + 1);
  else out.push('gap');
}

export function buildPageWindow(current: number, total: number, neighbors = 2): PageToken[] {
  if (total <= 0) return [];
  const sorted = [...buildShownSet(current, total, neighbors)].sort((a, b) => a - b);
  const out: PageToken[] = [];
  let prev = 0;
  for (const n of sorted) {
    appendBridge(out, n - prev - 1, prev);
    out.push(n);
    prev = n;
  }
  return out;
}
