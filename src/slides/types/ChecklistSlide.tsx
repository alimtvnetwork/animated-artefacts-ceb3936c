import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { SlideSpec } from '../types';
import { titleClassFor } from '../preset';

/**
 * ChecklistSlide — resolves ambiguity #32.
 *
 * Audience-facing checklist. The presenter clicks each row to confirm "done";
 * a gold progress bar at the top tracks completion. Optional per-item
 * `detail` expands to a single-line keyword expansion. State is per-session
 * (no localStorage, no URL hash) — fresh on every navigation.
 *
 * Density cap: ≤7 items (enforced via `densityCheck.capItems` in the deck JSON).
 *
 * Spec: `spec/21-slides-system/62-checklist-slide.md`
 * Resolves: `.lovable/question-and-ambiguity/32-collapsible-sections-with-progress.md`
 */
export function ChecklistSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const items = useMemo(() => c.items ?? [], [c.items]);
  const total = items.length || 1;

  const [done, setDone] = useState<Set<number>>(() => new Set());
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [focusIdx, setFocusIdx] = useState(0);
  const rowsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const toggleDone = useCallback((i: number) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  const focusRow = useCallback((i: number) => {
    setFocusIdx(i);
    rowsRef.current[i]?.focus();
  }, []);

  const onKeyDown = useCallback(
    (i: number) => (e: React.KeyboardEvent) => {
      // Alt+Enter / Alt+Space → toggle the per-item detail panel from the
      // keyboard (chevron is a separate button but row-level shortcut keeps
      // hands on the home row during presentation).
      if ((e.key === 'Enter' || e.key === ' ') && e.altKey) {
        e.preventDefault();
        toggleExpand(i);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDone(i);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        focusRow(Math.min(items.length - 1, i + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        focusRow(Math.max(0, i - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        focusRow(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        focusRow(Math.max(0, items.length - 1));
      }
    },
    [items.length, toggleDone, toggleExpand, focusRow],
  );

  const progressColor = c.progressColor ?? 'gold';
  const progressVar = `var(--${progressColor})`;
  const pct = Math.round((done.size / total) * 100);

  return (
    <div
      role="region"
      aria-label={`Checklist: ${c.title ?? spec.slideName}`}
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="absolute inset-0 flex flex-col pt-32 pb-20 px-[var(--brand-inset-x,clamp(48px,15vw,288px))]">
        {c.eyebrow && <span className="slide-eyebrow mb-3">{c.eyebrow}</span>}
        {c.title && <h2 className={`slide-title-content ${titleClassFor(spec)}`}>{c.title}</h2>}

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={done.size}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${done.size} of ${total} confirmed`}
          className="checklist-progress mt-8"
        >
          <motion.div
            className="checklist-progress__fill"
            style={{ background: `hsl(${progressVar})` }}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={reduced ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="checklist-progress__count">
            {done.size} / {total}
          </span>
        </div>

        <ul className="checklist-rows mt-10" role="list">
          {items.map((item, i) => {
            const isDone = done.has(i);
            const isOpen = expanded.has(i);
            const hasDetail = Boolean(item.detail);
            return (
              <li key={i} className="checklist-row-li">
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.2 + i * 0.06 }}
                >
                  <div className="checklist-row" data-done={isDone || undefined}>
                    <button
                      ref={(el) => { rowsRef.current[i] = el; }}
                      type="button"
                      role="checkbox"
                      aria-checked={isDone}
                      aria-label={item.text}
                      tabIndex={i === focusIdx ? 0 : -1}
                      onFocus={() => setFocusIdx(i)}
                      onClick={() => toggleDone(i)}
                      onKeyDown={onKeyDown(i)}
                      className="checklist-row__toggle"
                    >
                      <span className="checklist-row__badge" aria-hidden="true">
                        {isDone ? <Check size={16} strokeWidth={3} /> : <span>{String(i + 1).padStart(2, '0')}</span>}
                      </span>
                      <span className="checklist-row__text">{item.text}</span>
                      {item.capsule && (
                        <span className={`capsule capsule-${item.capsule.color}`} aria-hidden="true">
                          {item.capsule.text}
                        </span>
                      )}
                    </button>
                    {hasDetail && (
                      <button
                        type="button"
                        aria-label={isOpen ? `Collapse detail for ${item.text}` : `Expand detail for ${item.text}`}
                        aria-expanded={isOpen}
                        onClick={() => toggleExpand(i)}
                        className="checklist-row__chevron"
                        data-open={isOpen || undefined}
                      >
                        <ChevronDown size={18} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence initial={false}>
                    {hasDetail && isOpen && (
                      <motion.div
                        key="detail"
                        initial={reduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduced ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="checklist-row__detail-wrap"
                      >
                        <div className="checklist-row__detail">{item.detail}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
