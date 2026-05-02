import { useCallback, useRef } from 'react';
import type { HotspotSpec, CapsuleExpandSpec } from '../types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Props {
  hotspots: HotspotSpec[];
  /** Called when a navigate-style hotspot fires (`revealSlide` set). */
  onReveal: (slideNumber: number) => void;
  /** Called when an inline-expand hotspot fires (`expand` set). */
  onExpand?: (payload: { expand: CapsuleExpandSpec; layoutId: string; fallbackTitle?: string }) => void;
  /** Stable id used for `layoutId` morph (slide number is a good fit). */
  layoutScope?: string | number;
}

/**
 * Renders click-reveal hotspots as absolutely positioned buttons over the slide.
 * Coordinates are percentages of the slide stage so they scale with the viewport.
 *
 * Default style is `ghost` — invisible until hover — so it doesn't disturb the
 * composition. Use `outline` while authoring to see where they sit.
 *
 * Per spec 26 each hotspot must declare at least one of:
 *   - `revealSlide` → navigates to the hidden slide via `onReveal`.
 *   - `expand`      → opens the inline card via `onExpand`.
 * Hotspots with neither are rendered as no-op outlines (still useful while
 * authoring to verify rect placement) and logged once in dev.
 *
 * # Keyboard a11y
 * Each hotspot is a native `<button>` so Enter/Space already activate it. On
 * top of that, when a hotspot has focus the arrow keys move focus to the
 * geometrically nearest sibling hotspot in that direction (Up/Down/Left/Right
 * pick the candidate whose centre minimises distance along that axis, with
 * the perpendicular axis used as a tie-breaker). Home/End jump to the first/
 * last hotspot in document order. Arrow-key shortcuts are advertised via
 * `aria-keyshortcuts` so screen readers can announce them.
 */
export function HotspotLayer({ hotspots, onReveal, onExpand, layoutScope }: Props) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusByDirection = useCallback(
    (fromIdx: number, dir: 'up' | 'down' | 'left' | 'right') => {
      // Geometry-based neighbour pick: among hotspots strictly in `dir` of the
      // current centre, choose the one whose centre is closest along the
      // primary axis, breaking ties on the perpendicular axis.
      const from = hotspots[fromIdx];
      if (!from) return;
      const cx = from.x + from.width / 2;
      const cy = from.y + from.height / 2;
      let bestIdx = -1;
      let bestPrimary = Infinity;
      let bestPerp = Infinity;
      hotspots.forEach((h, i) => {
        if (i === fromIdx) return;
        const hx = h.x + h.width / 2;
        const hy = h.y + h.height / 2;
        const dx = hx - cx;
        const dy = hy - cy;
        let primary = Infinity;
        let perp = Infinity;
        if (dir === 'up'    && dy < 0) { primary = -dy; perp = Math.abs(dx); }
        if (dir === 'down'  && dy > 0) { primary =  dy; perp = Math.abs(dx); }
        if (dir === 'left'  && dx < 0) { primary = -dx; perp = Math.abs(dy); }
        if (dir === 'right' && dx > 0) { primary =  dx; perp = Math.abs(dy); }
        if (primary < bestPrimary || (primary === bestPrimary && perp < bestPerp)) {
          bestPrimary = primary;
          bestPerp = perp;
          bestIdx = i;
        }
      });
      if (bestIdx >= 0) buttonRefs.current[bestIdx]?.focus();
    },
    [hotspots],
  );

  if (!hotspots?.length) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      role="group"
      aria-label="Slide hotspots"
    >
      {hotspots.map((h, i) => {
        const isOutline = h.style === 'outline';
        const hasExpand = Boolean(h.expand);
        const hasReveal = typeof h.revealSlide === 'number';
        const handleClick = () => {
          if (hasExpand && h.expand) {
            onExpand?.({
              expand: h.expand,
              layoutId: `hotspot-${layoutScope ?? 'x'}-${i}`,
              fallbackTitle: h.label,
            });
            return;
          }
          if (hasReveal && typeof h.revealSlide === 'number') {
            onReveal(h.revealSlide);
          }
        };
        const isInteractive = hasExpand || hasReveal;
        const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
          // Arrow keys nudge focus to the nearest hotspot in that direction.
          // Home/End jump to the first/last hotspot in document order.
          // Native button semantics already cover Enter/Space activation, so
          // we only intercept the navigation keys here.
          if (e.key === 'ArrowUp')    { e.preventDefault(); focusByDirection(i, 'up');    return; }
          if (e.key === 'ArrowDown')  { e.preventDefault(); focusByDirection(i, 'down');  return; }
          if (e.key === 'ArrowLeft')  { e.preventDefault(); focusByDirection(i, 'left');  return; }
          if (e.key === 'ArrowRight') { e.preventDefault(); focusByDirection(i, 'right'); return; }
          if (e.key === 'Home')       { e.preventDefault(); buttonRefs.current[0]?.focus(); return; }
          if (e.key === 'End')        { e.preventDefault(); buttonRefs.current[hotspots.length - 1]?.focus(); return; }
        };
        return (
          <motion.button
            key={i}
            ref={(el) => { buttonRefs.current[i] = el; }}
            layoutId={hasExpand ? `hotspot-${layoutScope ?? 'x'}-${i}` : undefined}
            type="button"
            onClick={handleClick}
            onKeyDown={isInteractive ? handleKeyDown : undefined}
            disabled={!isInteractive}
            aria-label={h.label ?? (hasExpand ? 'Open details' : `Reveal slide ${h.revealSlide ?? ''}`)}
            aria-keyshortcuts={isInteractive ? 'Enter Space ArrowUp ArrowDown ArrowLeft ArrowRight Home End' : undefined}
            title={h.label}
            style={{
              position: 'absolute',
              left: `${h.x}%`,
              top: `${h.y}%`,
              width: `${h.width}%`,
              height: `${h.height}%`,
            }}
            className={cn(
              'pointer-events-auto rounded-xl transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/80 focus-visible:bg-gold/10',
              isOutline
                ? 'border border-dashed border-gold/40 bg-gold/5 hover:bg-gold/10 hover:border-gold/80'
                : 'bg-transparent hover:bg-gold/10 hover:ring-1 hover:ring-gold/50',
              isInteractive ? 'cursor-pointer' : 'cursor-default opacity-60'
            )}
          />
        );
      })}
    </div>
  );
}
