/**
 * MotionMatrixHint — slide-editor control that visualizes the
 * transition × textAnimation collision matrix for the selected slide,
 * highlighting which combinations would collide with the *previous* and
 * (when authored) *next* linear slide.
 *
 * # Why this exists
 * `detectMotionCollisions` (`src/slides/motionCollisions.ts`) flags
 * adjacent linear slides that duplicate BOTH motion axes, per the
 * variety rule in `spec/slides/llm/13-motion-system.md` §1. Authors saw
 * the warning *after* picking — this control lets them avoid it while
 * picking, by surfacing the same rule as a small color-coded matrix.
 *
 * # What it shows
 *   - A 5 × 4 grid: rows = transitions, columns = textAnimations.
 *   - The author's CURRENT pick is ringed in primary.
 *   - Cells that match the previous slide on BOTH axes get a `prev`
 *     marker. Cells that match the next slide get `next`. A cell that
 *     would collide with both (rare, but possible at the seam between
 *     two pre-existing neighbors) gets `both`.
 *   - Click any cell to apply that pair to the selected slide.
 *
 * # What it deliberately does NOT do
 *   - Doesn't disable colliding cells. Authors sometimes want a
 *     deliberate carry-over for narrative effect; this is guidance, not
 *     a hard block. The runtime warning still fires if they go ahead.
 *   - Doesn't flag single-axis matches — same scope as the detector.
 *   - Doesn't read `validationMode`. This control is always advisory;
 *     the strict-vs-warn mode only affects the contract validator, not
 *     the (always non-fatal) motion variety check.
 */
import { Fragment, memo } from 'react';
import { SlideTransition, TextAnimation } from '../slides/enums';
import type { SlideTransitionValue, TextAnimationValue } from '../slides/enums';
import type { SlideSpec } from '../slides/types';

interface Props {
  /** The slide the author is currently editing. */
  current: Pick<SlideSpec, 'transition' | 'textAnimation'>;
  /** Linear predecessor; `null` when the current slide is first. */
  previous: Pick<SlideSpec, 'transition' | 'textAnimation' | 'slideNumber'> | null;
  /** Linear successor; `null` when the current slide is last in linear flow. */
  next: Pick<SlideSpec, 'transition' | 'textAnimation' | 'slideNumber'> | null;
  /** Apply a pair to the current slide (writes both fields at once). */
  onPick: (pair: { transition: SlideTransitionValue; textAnimation: TextAnimationValue }) => void;
}

const TRANSITIONS = Object.values(SlideTransition) as readonly SlideTransitionValue[];
const TEXT_ANIMS = Object.values(TextAnimation) as readonly TextAnimationValue[];

/** Per-cell collision status against the supplied neighbors. */
type CellStatus = 'clear' | 'prev' | 'next' | 'both';

function statusFor(
  transition: SlideTransitionValue,
  textAnimation: TextAnimationValue,
  previous: Props['previous'],
  next: Props['next'],
): CellStatus {
  const collidesPrev =
    !!previous &&
    previous.transition === transition &&
    previous.textAnimation === textAnimation;
  const collidesNext =
    !!next &&
    next.transition === transition &&
    next.textAnimation === textAnimation;
  if (collidesPrev && collidesNext) return 'both';
  if (collidesPrev) return 'prev';
  if (collidesNext) return 'next';
  return 'clear';
}

/** Visual class per status — kept in one place so the legend and cells
 *  read identically to the eye. Uses semantic tokens only. */
const STATUS_CLASS: Record<CellStatus, string> = {
  clear: 'bg-background hover:bg-muted/60 text-foreground/85 border-border',
  prev: 'bg-destructive/10 hover:bg-destructive/15 text-destructive border-destructive/40',
  next: 'bg-gold/10 hover:bg-gold/15 text-gold border-gold/40',
  both: 'bg-destructive/20 hover:bg-destructive/25 text-destructive border-destructive/60',
};

const STATUS_LABEL: Record<CellStatus, string> = {
  clear: 'OK',
  prev: 'Collides with previous slide',
  next: 'Collides with next slide',
  both: 'Collides with previous AND next slide',
};

export const MotionMatrixHint = memo(function MotionMatrixHint({
  current,
  previous,
  next,
  onPick,
}: Props) {
  // Don't render the matrix if there are no neighbors to compare against —
  // it would be 20 identical "OK" cells, pure noise. Guidance only appears
  // when guidance is actually possible.
  if (!previous && !next) return null;

  return (
    <div
      className="rounded-md border border-border bg-card/40 p-3 space-y-2"
      aria-label="Motion variety matrix"
    >
      <header className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Variety check
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {previous && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-destructive/40 border border-destructive/60" />
              prev #{previous.slideNumber}
            </span>
          )}
          {next && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-gold/40 border border-gold/60" />
              next #{next.slideNumber}
            </span>
          )}
        </div>
      </header>

      {/* Grid — column headers (text animations) above, row labels
          (transitions) on the left. Click any cell to commit that pair. */}
      <div
        role="grid"
        aria-label="Transition by text animation collision matrix"
        className="grid gap-1"
        style={{
          // 1 row-label column + N text-animation columns. Using inline
          // grid-template-columns avoids a Tailwind class-explosion when
          // we add a 5th text animation later.
          gridTemplateColumns: `minmax(72px, auto) repeat(${TEXT_ANIMS.length}, minmax(0, 1fr))`,
        }}
      >
        {/* Top-left empty cell + column headers */}
        <div />
        {TEXT_ANIMS.map((ta) => (
          <div
            key={`col-${ta}`}
            role="columnheader"
            className="text-[10px] text-center text-muted-foreground py-1 font-mono"
          >
            {ta}
          </div>
        ))}

        {TRANSITIONS.map((tr) => (
          // Fragment needs a key because we're returning siblings inside
          // a parent grid via .map. Without it, React warns and risks
          // mis-keying when transitions are reordered later.
          <Fragment key={`row-${tr}`}>
            <div
              key={`row-${tr}`}
              role="rowheader"
              className="text-[10px] text-muted-foreground self-center pr-1 font-mono text-right"
            >
              {tr}
            </div>
            {TEXT_ANIMS.map((ta) => {
              const status = statusFor(tr, ta, previous, next);
              const isCurrent =
                current.transition === tr && current.textAnimation === ta;
              return (
                <button
                  key={`cell-${tr}-${ta}`}
                  type="button"
                  role="gridcell"
                  aria-label={`${tr} + ${ta} — ${STATUS_LABEL[status]}${
                    isCurrent ? ' (current selection)' : ''
                  }`}
                  aria-pressed={isCurrent}
                  title={STATUS_LABEL[status]}
                  onClick={() => onPick({ transition: tr, textAnimation: ta })}
                  className={[
                    'h-6 rounded-sm border text-[9px] font-mono transition-colors',
                    STATUS_CLASS[status],
                    // Current selection gets a primary ring on top of the
                    // status color so authors always know where they are.
                    isCurrent ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : '',
                  ].join(' ')}
                >
                  {/* Glyph hint: dot for clear, × for collision. Keeps the
                      cell readable when colors aren't enough (color-blind
                      authors, dim projectors). */}
                  {status === 'clear' ? '·' : '×'}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground leading-snug">
        Cells marked × duplicate BOTH motion axes of an adjacent slide.
        Click any cell to apply. Guidance only — collisions never block save.
      </p>
    </div>
  );
});
