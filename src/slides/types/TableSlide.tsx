import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec, TableColumnSpec, TableRowSpec } from '../types';
import type { CapsuleColorValue } from '../enums';
import { titleClassFor } from '../preset';

/**
 * TableSlide — generic comparison-table slide.
 *
 * Borrowed from the external presentation design system doc and remapped
 * onto our token + capsule palette. Topic-agnostic: rows can be languages,
 * frameworks, vendors, plans, anything you'd put in a "compare 4–8 options
 * across 3–5 attributes" table.
 *
 * Features
 * - **Headers** — `tableColumns[].label` + `.align` ('left' | 'center' | 'right').
 * - **Zebra rows** — alternating `--surface-2` shading via `.slide-table tbody tr:nth-child(even)`
 *   in `index.css`. Automatic; no per-row opt-in needed.
 * - **Column alignment** — `col.align` flows into both header and body cells.
 * - **First-cell accent bar** — per-row `accent` color renders a 4px inset
 *   left bar via `data-accent` + `--row-accent`.
 * - **Cell fade-in animation (v0.179)** — header cells stagger in first
 *   (35ms each from 0.25s), then body cells fade up in row-major order
 *   (35ms each from 0.45s). `useReducedMotion` skips it entirely so the
 *   table snaps in with no transform on `prefers-reduced-motion`.
 */
const ACCENT_HSL: Record<CapsuleColorValue, string> = {
  gold:    'hsl(var(--gold))',
  ember:   'hsl(var(--ember))',
  cream:   'hsl(var(--cream))',
  ink:     'hsl(var(--foreground))',
  outline: 'hsl(var(--border))',
  violet:  'hsl(265 85% 72%)',
  teal:    'hsl(175 75% 55%)',
  rose:    'hsl(345 85% 70%)',
  sky:     'hsl(210 90% 70%)',
};

export function TableSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const cols: TableColumnSpec[] = c.tableColumns ?? [];
  const rows: TableRowSpec[] = c.tableRows ?? [];

  return (
    <section
      role="region"
      aria-label={`Comparison table: ${c.title ?? spec.slideName}`}
      className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center px-24 py-20"
    >
      <motion.header
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[1600px] mb-8"
      >
        {c.eyebrow && <p className="slide-eyebrow mb-3">{c.eyebrow}</p>}
        {c.title && <h2 className={`slide-title-content ${titleClassFor(spec)}`}>{c.title}</h2>}
        {c.subtitle && <p className="slide-subtitle mt-3">{c.subtitle}</p>}
      </motion.header>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="w-full max-w-[1600px]"
      >
        <table className="slide-table">
          <thead>
            <tr>
              {cols.map((col, hIdx) => (
                <motion.th
                  key={col.key}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.25 + hIdx * 0.04, ease: 'easeOut' }}
                  style={{ width: col.width, textAlign: col.align ?? 'left' }}
                >
                  {col.label}
                </motion.th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              const accentHsl = ACCENT_HSL[row.accent ?? 'gold'];
              return (
                <tr key={`${row.name}-${rIdx}`}>
                  {cols.map((col, cIdx) => {
                    const isFirst = cIdx === 0;
                    const value = isFirst ? row.name : (row.cells[col.key] ?? '—');
                    /**
                     * Per-cell fade-in (v0.179). Row-major stagger anchored at
                     * 0.45s so cells start arriving just after the header
                     * settles. Per-cell delay is small (35ms) and capped via
                     * the natural row count, so even a 12×8 grid finishes
                     * inside ~1.4s — still under the deck's 1.5s "settle"
                     * budget. `useReducedMotion` skips the animation entirely.
                     */
                    const cellDelay = 0.45 + (rIdx * cols.length + cIdx) * 0.035;
                    return (
                      <motion.td
                        key={col.key}
                        data-accent={isFirst ? '' : undefined}
                        initial={reduced ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: cellDelay, ease: 'easeOut' }}
                        style={
                          isFirst
                            ? ({ '--row-accent': accentHsl, fontWeight: 600 } as React.CSSProperties)
                            : { textAlign: col.align ?? 'left' }
                        }
                      >
                        {value}
                      </motion.td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {c.tableNote && (
          <p className="mt-4 text-sm text-muted-foreground italic">{c.tableNote}</p>
        )}
      </motion.div>
    </section>
  );
}
