import { motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import type { SlideSpec } from '../types';
import { titleClassFor } from '../preset';
import { useRovingTabindex } from '../hooks/useRovingTabindex';

/**
 * Lazy-load KaTeX CSS only when an EquationSlide actually mounts.
 * Caches the import promise so navigating between equation slides reuses
 * the already-resolved chunk. Removes ~80KB CSS from the initial bundle
 * for any deck that doesn't use equations.
 */
let katexCssPromise: Promise<unknown> | null = null;
function ensureKatexCss(): void {
  if (katexCssPromise) return;
  katexCssPromise = import('katex/dist/katex.min.css');
}

/**
 * EquationSlide — addendum 29 §2.4.
 *
 * Renders ONE equation. Author provides:
 *   - `tex`      — display string (TeX source; no runtime KaTeX, source is shown
 *                  pre-rendered as semantic HTML by `scripts/prerender-equations.ts`
 *                  in a future build step).
 *   - `equationHtml` — opaque pre-rendered HTML (preferred when present).
 *   - `termIds`  — ordered ids that map to spans the prerender script
 *                  injects with class="equation-term" so this slide can
 *                  trigger the staggered fade-in via CSS keyframes.
 *
 * For now (Phase 3 lite, no KaTeX dep yet) we render `tex` as plain
 * monospace fallback wrapping each whitespace-split token in a
 * `<span class="equation-term">` so the staggered reveal still plays.
 */
function tokenize(tex: string, termIds?: readonly string[]): { text: string; id: string }[] {
  if (termIds && termIds.length > 0) {
    // Author-controlled split: fall back to whitespace if mismatch.
    const tokens = tex.split(/\s+/).filter(Boolean);
    if (tokens.length === termIds.length) {
      return tokens.map((text, i) => ({ text, id: termIds[i] }));
    }
  }
  return tex.split(/\s+/).filter(Boolean).map((text, i) => ({ text, id: `t${i}` }));
}

export function EquationSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const tokens = tokenize(c.tex ?? '', c.termIds);
  const roving = useRovingTabindex(tokens.length);
  useEffect(() => { ensureKatexCss(); }, []);

  return (
    <div
      role="region"
      aria-label={`Equation: ${c.title ?? spec.slideName}`}
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
        {c.eyebrow && <span className="slide-eyebrow mb-3">{c.eyebrow}</span>}
        {c.title && <h2 className={`slide-title-content ${titleClassFor(spec)} mb-12 text-center`}>{c.title}</h2>}

        {c.equationHtml ? (
          <div className="equation-host" dangerouslySetInnerHTML={{ __html: c.equationHtml }} />
        ) : (
          <div
            className="equation-host"
            aria-label={c.tex}
            role="group"
            aria-roledescription="Equation terms — use arrow keys to navigate"
          >
            {tokens.map((tok, i) => (
              <span
                key={tok.id}
                data-term-id={tok.id}
                className="equation-term"
                style={{ animationDelay: reduced ? '0ms' : `${i * 80}ms`, marginRight: '0.4em' }}
                {...roving.getItemProps(i)}
              >
                {tok.text}
              </span>
            ))}
          </div>
        )}

        {(c.equationLabels?.left || c.equationLabels?.right) && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 flex gap-10 text-base"
          >
            {c.equationLabels?.left && (
              <span style={{ color: `hsl(var(--${c.equationLabels.left.color ?? 'cream'}))` }}>
                {c.equationLabels.left.text}
              </span>
            )}
            {c.equationLabels?.right && (
              <span style={{ color: `hsl(var(--${c.equationLabels.right.color ?? 'ember'}))` }}>
                {c.equationLabels.right.text}
              </span>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
