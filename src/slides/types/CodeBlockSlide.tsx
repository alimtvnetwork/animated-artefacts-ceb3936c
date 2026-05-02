import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { SlideSpec, CodeTokenSpec } from '../types';
import { titleClassFor } from '../preset';

/**
 * CodeBlockSlide — title + hero code block.
 *
 * Three highlighting modes:
 *   `'shiki'`  → dynamic-import shiki on mount, render highlighted HTML
 *                with the bundled `github-dark` theme. We then mount the
 *                rendered HTML into a `.slide-codeblock` so our token CSS
 *                wins over shiki's inline colors where they overlap.
 *   `'manual'` → ignore `code`; render `codeTokens` line-by-line. Each
 *                token's `kind` maps to a `.tok-keyword` / `.tok-literal` /
 *                `.tok-comment` class — deterministic across renderers.
 *   `'plain'`  → no highlighting; render `code` as-is.
 *
 * Shiki is loaded ONLY when needed (`syntax === 'shiki'`) so decks that
 * never render code don't pay the bundle cost.
 *
 * Features (v0.180)
 * - **Configurable language** — `c.codeLanguage` (any shiki id).
 * - **Copy button** — top-right anchor; uses `navigator.clipboard.writeText`,
 *   shows a `Check` icon for 1.6s on success. Hidden when `codeCopyButton: false`.
 * - **Line emphasis animations** — `codeHighlightLines: number[]` (1-based).
 *   Each emphasised line gets a steady gold-tinted backdrop and pulses in
 *   sequence on slide enter (250ms stagger). `useReducedMotion` suppresses
 *   the pulse and keeps only the steady highlight.
 * - **Line numbers gutter** — opt-in via `codeShowLineNumbers`; auto-on when
 *   `codeHighlightLines` is set so emphasised line numbers stay readable.
 */
export function CodeBlockSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const reduced = useReducedMotion();
  const syntax = c.codeSyntax ?? 'shiki';
  const lang = c.codeLanguage ?? 'plaintext';
  const [shikiHtml, setShikiHtml] = useState<string | null>(null);

  const highlightSet = useMemo(
    () => new Set((c.codeHighlightLines ?? []).filter((n): n is number => Number.isInteger(n) && n >= 1)),
    [c.codeHighlightLines],
  );
  const showCopy = c.codeCopyButton !== false;
  const showLineNumbers = c.codeShowLineNumbers ?? highlightSet.size > 0;

  // Resolve the plain-text payload used by both the copy button and the
  // gutter/overlay row counter. `manual` mode joins token text per line so
  // copy still produces real source code (not "[object Object]").
  const sourceText = useMemo(() => {
    if (syntax === 'manual' && Array.isArray(c.codeTokens)) {
      return c.codeTokens.map((line) => line.map((t) => t.text).join('')).join('\n');
    }
    return c.code ?? '';
  }, [c.code, c.codeTokens, syntax]);

  const lineCount = useMemo(() => sourceText.split('\n').length, [sourceText]);

  useEffect(() => {
    let cancelled = false;
    if (syntax !== 'shiki' || !c.code) {
      setShikiHtml(null);
      return;
    }
    (async () => {
      try {
        const { codeToHtml } = await import('shiki');
        const html = await codeToHtml(c.code ?? '', { lang, theme: 'github-dark' });
        if (!cancelled) setShikiHtml(html);
      } catch (err) {
        // Silent fallback — render plain on shiki failure.
        // eslint-disable-next-line no-console
        console.warn('[CodeBlockSlide] shiki highlight failed, falling back to plain', err);
        if (!cancelled) setShikiHtml(null);
      }
    })();
    return () => { cancelled = true; };
  }, [c.code, lang, syntax]);

  return (
    <section
      role="region"
      aria-label={`Code: ${c.title ?? spec.slideName}`}
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
        className="w-full max-w-[1600px] relative"
      >
        <div className="slide-codeblock-wrap">
          {showCopy && <CodeCopyButton text={sourceText} language={lang} />}

          {/* Code body — picks one of three rendering paths. */}
          {syntax === 'manual' && Array.isArray(c.codeTokens) ? (
            <pre className="slide-codeblock"><code>{c.codeTokens.map((line, i) => (
              <CodeLine
                key={i}
                lineNumber={i + 1}
                emphasised={highlightSet.has(i + 1)}
                showNumber={showLineNumbers}
                reduced={!!reduced}
                emphasisOrder={emphasisIndex(i + 1, highlightSet)}
              >
                {line.map((tok: CodeTokenSpec, j) => (
                  <span key={j} className={tok.kind && tok.kind !== 'plain' ? `tok-${tok.kind}` : undefined}>
                    {tok.text}
                  </span>
                ))}
              </CodeLine>
            ))}</code></pre>
          ) : syntax === 'shiki' && shikiHtml ? (
            <ShikiBlock
              html={shikiHtml}
              highlightSet={highlightSet}
              showLineNumbers={showLineNumbers}
              reduced={!!reduced}
            />
          ) : (
            <pre className="slide-codeblock"><code>{sourceText.split('\n').map((line, i) => (
              <CodeLine
                key={i}
                lineNumber={i + 1}
                emphasised={highlightSet.has(i + 1)}
                showNumber={showLineNumbers}
                reduced={!!reduced}
                emphasisOrder={emphasisIndex(i + 1, highlightSet)}
              >
                {line || '\u00A0'}
              </CodeLine>
            ))}</code></pre>
          )}
        </div>

        {c.codeCaption && (
          <p className="mt-4 text-sm text-muted-foreground italic">
            {c.codeCaption}
            {highlightSet.size > 0 && (
              <span className="ml-2 text-muted-foreground/70">
                · {highlightSet.size} line{highlightSet.size === 1 ? '' : 's'} highlighted of {lineCount}
              </span>
            )}
          </p>
        )}
      </motion.div>
    </section>
  );
}

/** 0-based emphasis order for a given 1-based line number; -1 if not highlighted. */
function emphasisIndex(lineNumber: number, set: Set<number>): number {
  if (!set.has(lineNumber)) return -1;
  const sorted = Array.from(set).sort((a, b) => a - b);
  return sorted.indexOf(lineNumber);
}

/**
 * Single rendered code line. Wraps in `motion.span` when emphasised so the
 * gold pulse can stagger in via Framer (250ms per emphasised line).
 */
function CodeLine({
  children, lineNumber, emphasised, showNumber, reduced, emphasisOrder,
}: {
  children: React.ReactNode;
  lineNumber: number;
  emphasised: boolean;
  showNumber: boolean;
  reduced: boolean;
  emphasisOrder: number;
}) {
  const delay = 0.55 + Math.max(0, emphasisOrder) * 0.25;
  return (
    <motion.span
      data-line={lineNumber}
      data-emphasised={emphasised ? '' : undefined}
      className="slide-codeblock-line"
      initial={false}
      animate={
        emphasised && !reduced
          ? { backgroundColor: ['hsl(var(--gold) / 0)', 'hsl(var(--gold) / 0.32)', 'hsl(var(--gold) / 0.14)'] }
          : undefined
      }
      transition={{ duration: 0.9, delay, ease: 'easeOut', times: [0, 0.4, 1] }}
    >
      {showNumber && <span className="slide-codeblock-gutter" aria-hidden>{lineNumber}</span>}
      <span className="slide-codeblock-line-body">{children}</span>
    </motion.span>
  );
}

/**
 * Shiki path — shiki returns a `<pre><code>` with one `<span class="line">`
 * per source line. We re-parse minimally with a regex split so we can wrap
 * each line in our `CodeLine` and apply emphasis. Shiki's inline colors stay
 * intact via `dangerouslySetInnerHTML` on the inner `.line` content.
 */
function ShikiBlock({
  html, highlightSet, showLineNumbers, reduced,
}: {
  html: string;
  highlightSet: Set<number>;
  showLineNumbers: boolean;
  reduced: boolean;
}) {
  // Extract the inner <code>...</code> and split into individual <span class="line">…</span>.
  const inner = html.match(/<code[^>]*>([\s\S]*?)<\/code>/)?.[1] ?? html;
  // Shiki always wraps each line in <span class="line">...</span>.
  const lineHtmls = inner
    .split(/(?=<span class="line">)/)
    .filter((chunk) => chunk.includes('class="line"'));

  if (lineHtmls.length === 0) {
    return <div className="slide-codeblock" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <pre className="slide-codeblock"><code>
      {lineHtmls.map((lineHtml, i) => {
        const ln = i + 1;
        return (
          <CodeLine
            key={i}
            lineNumber={ln}
            emphasised={highlightSet.has(ln)}
            showNumber={showLineNumbers}
            reduced={reduced}
            emphasisOrder={emphasisIndex(ln, highlightSet)}
          >
            <span dangerouslySetInnerHTML={{ __html: lineHtml }} />
          </CodeLine>
        );
      })}
    </code></pre>
  );
}

/**
 * Copy-to-clipboard button. Top-right of the code block. Switches to a
 * `Check` icon for 1.6s on success. No-ops + briefly shows "no clipboard"
 * label when `navigator.clipboard` is unavailable (older browsers, sandboxed
 * iframes without permission).
 */
function CodeCopyButton({ text, language }: { text: string; language: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'unavailable'>('idle');

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('unavailable');
    }
    setTimeout(() => setState('idle'), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${language} code to clipboard`}
      className="slide-codeblock-copy lift-hover-subtle"
    >
      {state === 'copied' ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden /> Copied
        </>
      ) : state === 'unavailable' ? (
        <>
          <Copy className="h-3.5 w-3.5 opacity-60" aria-hidden /> Select to copy
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden /> Copy
        </>
      )}
    </button>
  );
}
