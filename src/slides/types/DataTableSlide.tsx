import { motion, useReducedMotion } from 'framer-motion';
import type { SlideSpec } from '../types';
import { titleClassFor } from '../preset';
import { useRovingTabindex } from '../hooks/useRovingTabindex';

/**
 * DataTableSlide — addendum 29 §2.2.
 *
 * Density-capped sibling of the existing TableSlide.
 * Caps: ≤5 columns, ≤8 rows. Header at 0.25s, rows Stagger 35ms.
 * Reduced-motion → instant.
 */
export function DataTableSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const cols = c.dataColumns ?? [];
  const rows = c.dataRows ?? [];
  const roving = useRovingTabindex(rows.length);

  return (
    <div
      role="region"
      aria-label={`Data table: ${c.title ?? spec.slideName}`}
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="absolute inset-0 flex flex-col pt-32 pb-20 px-[var(--brand-inset-x,clamp(48px,15vw,288px))]">
        {c.eyebrow && <span className="slide-eyebrow mb-3">{c.eyebrow}</span>}
        {c.title && <h2 className={`slide-title-content ${titleClassFor(spec)}`}>{c.title}</h2>}

        <motion.table
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="data-table-narrow mt-12 w-full max-w-[1200px]"
        >
          <thead>
            <tr>
              {cols.map((col) => (
                <th key={col.key} style={{ textAlign: col.align ?? 'left' }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={i}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.4 + i * 0.035 }}
                {...roving.getItemProps(i)}
              >
                {cols.map((col, j) => (
                  <td
                    key={col.key}
                    data-accent={j === 0 ? row.accent : undefined}
                    style={{ textAlign: col.align ?? 'left' }}
                  >
                    {row[col.key] ?? ''}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
      </div>
    </div>
  );
}
