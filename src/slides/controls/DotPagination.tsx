/**
 * Bottom-center numbered dot pagination indicator (v0.25.0).
 *
 * Each slot is a small circular pill containing the slide number. The
 * active slot widens into a gold pill that morphs between slots via a
 * shared `layoutId` (Framer spring). Hovering any slot reveals a tooltip
 * card above the row showing:
 *
 *   - Slide number (NN / total)
 *   - Slide eyebrow + title (when available)
 *
 * # Why numbered dots
 * The audience needs to see "where we are" + "where any other slide goes"
 * at a glance — bare circles don't communicate that. Numbers + hover
 * preview let the presenter (and screen-readers) locate any slide in one
 * read.
 *
 * # Visibility
 * Default ON. Can be turned off via /settings. Hidden in the grid
 * overview and in any print/PDF/HTML export (`data-print-hide`).
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import type { SlideSpec } from '../types';
import { buildPageWindow } from './pageWindow';

interface Props {
  /** 1-based current slide number among the linear slides. */
  current: number;
  /** Total active linear slides. */
  total: number;
  /** Linear slide list — drives the hover-tooltip metadata. */
  slides: SlideSpec[];
  /** Jump handler — receives a 1-based slide number. */
  onJump: (n: number) => void;
  /** Collapse to `1 … cur±n … N` once total exceeds this. Default 15. */
  maxBeforeCollapse?: number;
  /** Neighbors shown each side of current when collapsed. Default 2. */
  neighbors?: number;
}

const DEFAULT_THRESHOLD = 15;
const DEFAULT_NEIGHBORS = 2;

/** Midpoint slide between the numbers flanking a `'gap'` token. */
function gapMidpoint(tokens: (number | 'gap')[], index: number): number {
  const before = tokens[index - 1];
  const after = tokens[index + 1];
  const lo = typeof before === 'number' ? before : 1;
  const hi = typeof after === 'number' ? after : lo + 2;
  return Math.round((lo + hi) / 2);
}

interface GapProps {
  tokens: (number | 'gap')[];
  index: number;
  onJump: (n: number) => void;
}

/** Ellipsis token — jumps to the midpoint of the slides it hides. */
function GapToken({ tokens, index, onJump }: GapProps) {
  const target = gapMidpoint(tokens, index);
  return (
    <button
      onClick={() => onJump(target)}
      aria-label={`Jump to slide ${target}`}
      className="relative shrink-0 h-6 w-5 flex items-center justify-center rounded-full text-foreground/45 hover:text-foreground text-[10px] leading-none focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
    >
      …
    </button>
  );
}


export function DotPagination({
  current, total, slides, onJump,
  maxBeforeCollapse = DEFAULT_THRESHOLD, neighbors = DEFAULT_NEIGHBORS,
}: Props) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);

  const tokens =
    total > maxBeforeCollapse
      ? buildPageWindow(current, total, neighbors)
      : Array.from({ length: total }, (_, i) => i + 1);
  const maxWidth = Math.min(tokens.length * 24 + 32, 720);


  return (
    <div
      data-print-hide="true"
      aria-label="Slide pagination"
      role="navigation"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
      style={{ maxWidth }}
    >
      <div className="flex items-center gap-1.5 px-4 py-1 no-scrollbar overflow-visible">
        {tokens.map((token, i) => {
          if (token === 'gap') {
            return <GapToken key={`gap-${i}`} onJump={onJump} tokens={tokens} index={i} />;
          }
          const n = token;
          const isActive = n === current;
          const isHover = hovered === n;
          const slide = slides[n - 1];
          const titleText =
            slide?.content?.title ?? slide?.content?.eyebrow ?? slide?.slideName ?? '';

          return (
            <button
              key={n}
              onClick={() => onJump(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered((h) => (h === n ? null : h))}
              onFocus={() => setHovered(n)}
              onBlur={() => setHovered((h) => (h === n ? null : h))}
              aria-label={`Go to slide ${n}${titleText ? ` — ${titleText}` : ''}`}
              aria-current={isActive ? 'true' : undefined}
              className="relative shrink-0 h-6 flex items-center justify-center group rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
              style={{ width: isActive ? 32 : 20 }}
            >
              {/* Active pill — morphs between slots via shared layoutId. */}
              {isActive && (
                <motion.span
                  layoutId="dot-pagination-active"
                  className="absolute inset-0 rounded-full bg-gold"
                  style={{
                    boxShadow:
                      '0 0 12px hsl(var(--gold) / 0.55), 0 0 4px hsl(var(--gold) / 0.8)',
                  }}
                  transition={
                    reduced
                      ? { duration: 0.01 }
                      : { type: 'spring', stiffness: 420, damping: 30, mass: 0.6 }
                  }
                />
              )}
              {/* Inactive pill background — hover brightens. */}
              {!isActive && (
                <span
                  className={`absolute inset-0 rounded-full transition-colors duration-200 ${
                    isHover ? 'bg-foreground/20' : 'bg-foreground/8'
                  }`}
                  style={{ backgroundColor: isHover ? undefined : 'hsl(var(--foreground) / 0.08)' }}
                />
              )}
              {/* Number — always visible, color flips on active. */}
              <span
                className={`relative z-10 font-display font-semibold tabular-nums leading-none transition-colors duration-200 ${
                  isActive
                    ? 'text-ink text-[11px]'
                    : isHover
                      ? 'text-foreground text-[10px]'
                      : 'text-foreground/55 text-[10px]'
                }`}
              >
                {n}
              </span>

              {/* Hover-preview tooltip — compact warm pill.

                  ARROW BUG (v0.51): the arrow was nested inside the
                  pill at `left-1/2`, which put it at the PILL's
                  center, not the trigger's. For long titles the pill
                  extends far past the dot and the arrow ended up
                  pointing at the wrong dot. Fixed by moving the arrow
                  to a sibling layer anchored to the button center. */}
              {/* v0.55: tooltip is LEFT-ANCHORED to the hovered dot so the
                  gold number chip ("N.") sits directly on top of the slide
                  number rather than being center-anchored (which pushed
                  long titles half-off the dot for early slides). The pill
                  expands rightward; the down-arrow stays anchored to the
                  button center, lined up with the chip's number. */}
              <AnimatePresence>
                {isHover && (
                  <motion.div
                    key="tooltip"
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: '12px bottom' }}
                    className="absolute bottom-full left-1/2 -translate-x-[14px] mb-2.5 pointer-events-none"
                    role="tooltip"
                  >
                    <div className="dot-tooltip-pill relative whitespace-nowrap rounded-full border border-gold/25 bg-popover/95 pl-2.5 pr-3.5 py-1.5 backdrop-blur-md shadow-[0_8px_24px_-12px_hsl(var(--gold)/0.4)]">
                      <span className="font-display text-[12px] font-semibold leading-none tabular-nums">
                        <span className="text-gold">{n}.</span>{' '}
                        <span className="text-foreground">{titleText || `Slide ${n}`}</span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Arrow — sibling to pill, anchored at the BUTTON's
                  horizontal center so it always points at the
                  hovered dot regardless of pill width. */}
              {isHover && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[6px] h-2 w-2 rotate-45 border-r border-b border-gold/25 bg-popover/95 pointer-events-none"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
