/**
 * BrandStripDebugOverlay — render-time diff between the live SlideStage and
 * the SlidePreview (presenter / thumbnail / grid) variants for the active
 * slide, scanning both DOM subtrees for ANY BrandStrip leakage.
 *
 * Activation:
 *   - URL: append `?debug=brandstrip` to any slide route.
 *   - Keyboard: Ctrl/Cmd + Shift + B toggles it on the current page.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { findBySlideNumber, linearSlides } from '../loader';
import { SlideStage } from '../SlideStage';
import { SlidePreview } from './SlidePreview';
import type { SlideSpec } from '../types';

interface Hit {
  path: 'stage' | 'preview';
  reason: string;
  marker: string;
  snippet: string;
}

const SELECTORS: Array<{ sel: string; reason: string }> = [
  { sel: '[aria-label="Branded strip"]', reason: 'aria-label="Branded strip" element present' },
  { sel: '[data-brand-strip]',           reason: '[data-brand-strip] element present' },
  { sel: '.brand-strip',                  reason: '.brand-strip class present' },
];

function scan(root: HTMLElement | null, path: Hit['path']): Hit[] {
  if (!root) return [];
  const hits: Hit[] = [];
  for (const { sel, reason } of SELECTORS) {
    root.querySelectorAll(sel).forEach((el) => {
      const html = (el as HTMLElement).outerHTML ?? '';
      hits.push({ path, reason, marker: sel, snippet: html.length > 140 ? `${html.slice(0, 137)}…` : html });
    });
  }
  return hits;
}

function useDebugActive(): [boolean, (v: boolean) => void] {
  const location = useLocation();
  const queryFlag = new URLSearchParams(location.search).get('debug') === 'brandstrip';
  const [manualOn, setManualOn] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setManualOn((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return [queryFlag || manualOn, setManualOn];
}

function useActiveSlide(): SlideSpec | null {
  const location = useLocation();
  const m = location.pathname.match(/^\/(\d+)/);
  const n = m ? parseInt(m[1], 10) : (linearSlides[0]?.slideNumber ?? 1);
  return findBySlideNumber(n) ?? linearSlides[0] ?? null;
}

interface DiffResult {
  stageHits: Hit[];
  previewHits: Hit[];
  onlyInStage: string[];
  onlyInPreview: string[];
  pass: boolean;
  ranAt: number;
}

export function BrandStripDebugOverlay() {
  const [active, setManualOn] = useDebugActive();
  const slide = useActiveSlide();
  const stageHostRef = useRef<HTMLDivElement | null>(null);
  const previewHostRef = useRef<HTMLDivElement | null>(null);
  const [result, setResult] = useState<DiffResult | null>(null);
  const [tick, setTick] = useState(0);

  const runScan = useCallback(() => {
    const stageHits = scan(stageHostRef.current, 'stage');
    const previewHits = scan(previewHostRef.current, 'preview');
    const stageMarkers = new Set(stageHits.map((h) => h.marker));
    const previewMarkers = new Set(previewHits.map((h) => h.marker));
    setResult({
      stageHits,
      previewHits,
      onlyInStage: [...stageMarkers].filter((m) => !previewMarkers.has(m)),
      onlyInPreview: [...previewMarkers].filter((m) => !stageMarkers.has(m)),
      pass: stageHits.length === 0 && previewHits.length === 0,
      ranAt: Date.now(),
    });
  }, []);

  useLayoutEffect(() => {
    if (!active) {
      setResult(null);
      return;
    }
    const id = window.requestAnimationFrame(() => window.requestAnimationFrame(runScan));
    return () => window.cancelAnimationFrame(id);
  }, [active, slide, tick, runScan]);

  if (!active || !slide) return null;

  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: -99999,
          top: -99999,
          width: 1920,
          height: 1080,
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div ref={stageHostRef} style={{ width: '100%', height: '100%' }}>
          <SlideStage
            slide={slide}
            direction="forward"
            onCapsuleClickReveal={() => {}}
            onBackToParent={() => {}}
          />
        </div>
        <div ref={previewHostRef} style={{ marginTop: 16 }}>
          <SlidePreview slide={slide} width={480} />
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-label="BrandStrip render diff"
        className="fixed bottom-4 left-4 z-[60] max-w-[420px] rounded-xl border border-border/70 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md"
      >
        <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
          {result?.pass ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" strokeWidth={2.25} />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium leading-tight">
              BrandStrip diff · slide {slide.slideNumber}
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                {result?.pass ? 'no leakage on either path' : `${(result?.stageHits.length ?? 0) + (result?.previewHits.length ?? 0)} hit(s)`}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              stage vs presenter/thumbnail · {result ? new Date(result.ranAt).toLocaleTimeString() : 'scanning…'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTick((t) => t + 1)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label="Re-scan"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setManualOn(false)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="max-h-[320px] overflow-y-auto px-3 py-2 text-[12px]">
          {result?.pass && (
            <p className="text-muted-foreground">
              Both render paths are clean. No element matched any BrandStrip selector
              ({SELECTORS.map((s) => s.sel).join(', ')}).
            </p>
          )}
          {result && !result.pass && (
            <div className="space-y-3">
              <Section title="Live SlideStage" hits={result.stageHits} emptyText="no hits" />
              <Section title="SlidePreview (presenter / thumbnail)" hits={result.previewHits} emptyText="no hits" />
              {(result.onlyInStage.length > 0 || result.onlyInPreview.length > 0) && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2">
                  <div className="mb-1 font-medium text-destructive">UI divergence</div>
                  {result.onlyInStage.length > 0 && (
                    <div>Only in stage: <code className="font-mono">{result.onlyInStage.join(', ')}</code></div>
                  )}
                  {result.onlyInPreview.length > 0 && (
                    <div>Only in preview: <code className="font-mono">{result.onlyInPreview.join(', ')}</code></div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="border-t border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">
          Toggle: <kbd className="rounded bg-muted/40 px-1">⌘/Ctrl</kbd>+<kbd className="rounded bg-muted/40 px-1">Shift</kbd>+<kbd className="rounded bg-muted/40 px-1">B</kbd> · or <code className="font-mono">?debug=brandstrip</code>
        </footer>
      </div>
    </>
  );
}

function Section({ title, hits, emptyText }: { title: string; hits: Hit[]; emptyText: string }) {
  return (
    <div>
      <div className="mb-1 font-medium text-foreground/90">{title}</div>
      {hits.length === 0 ? (
        <div className="text-muted-foreground">{emptyText}</div>
      ) : (
        <ul className="space-y-1">
          {hits.map((h, i) => (
            <li key={i} className="rounded bg-muted/30 p-1.5">
              <div className="text-[11px] text-muted-foreground">{h.reason}</div>
              <code className="block whitespace-pre-wrap break-all font-mono text-[11px] text-foreground/80">{h.snippet}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
