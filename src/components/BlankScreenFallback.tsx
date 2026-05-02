import { useEffect, useState } from 'react';

/**
 * Friendly blank-screen detector (v0.190).
 *
 * If the React tree mounts but produces a visually empty page (no
 * meaningful DOM under #root after a short settle window), this overlay
 * shows the user a calm "nothing rendered" panel with:
 *   - a one-line "what broke" hint sourced from the most recent console
 *     error / runtime overlay capture, or a generic fallback,
 *   - a Retry button that re-mounts the route by triggering a soft
 *     reload (`window.location.reload()`),
 *   - a Hard reload option (cache-busting) for stale-bundle cases.
 *
 * Skips itself when:
 *   - the RuntimeErrorOverlay is already showing (it owns the surface),
 *   - the page is intentionally minimal (any element with
 *     `[data-allow-blank="true"]` exists — e.g. dedicated print views),
 *   - the user passes `?blankFallback=off`.
 *
 * Pure inline styles + DOM-safe primitives so it paints even if app
 * theme tokens haven't loaded.
 */

const SETTLE_MS = 1200;

function isMeaningfullyEmpty(): boolean {
  const root = document.getElementById('root');
  if (!root) return true;
  // Treat the page as "blank" when the rendered subtree contains no
  // visible text and no images/canvases. Cheap heuristic — good enough
  // to distinguish a true blank page from a rendered slide.
  const text = (root.textContent ?? '').replace(/\s+/g, '').trim();
  if (text.length > 0) return false;
  if (root.querySelector('img, canvas, svg, video, iframe, [data-non-empty]')) return false;
  return true;
}

function lastConsoleError(): string | null {
  // Pull the most recent error from the runtime overlay's module-scope
  // log if present. We avoid a hard import dependency so this component
  // still works if the overlay was tree-shaken away.
  type Captured = { message?: string; correlationId?: string };
  const w = window as unknown as { __runtimeErrors__?: readonly Captured[] };
  const errs = w.__runtimeErrors__;
  if (!errs || errs.length === 0) return null;
  const latest = errs[errs.length - 1];
  if (!latest?.message) return null;
  const id = latest.correlationId ? ` (${latest.correlationId})` : '';
  return `${latest.message}${id}`;
}

export function BlankScreenFallback(): JSX.Element | null {
  const [show, setShow] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('blankFallback') === 'off') return;

    const timer = window.setTimeout(() => {
      // If the runtime-error overlay is already painting (role="alert"
      // with our marker class on a fixed full-screen container), don't
      // double up — that overlay already explains the failure.
      if (document.querySelector('[data-runtime-error-overlay="true"]')) return;
      if (document.querySelector('[data-allow-blank="true"]')) return;
      if (!isMeaningfullyEmpty()) return;
      setHint(lastConsoleError());
      setShow(true);
    }, SETTLE_MS);

    return () => window.clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483645, // just under RuntimeErrorOverlay (…646) so a real error always wins
        display: 'grid',
        placeItems: 'center',
        background: 'hsl(0 0% 5%)',
        color: 'hsl(42 100% 96%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <div
          aria-hidden
          style={{
            fontSize: 48,
            lineHeight: 1,
            color: 'hsl(42 70% 55%)',
            marginBottom: 20,
            fontFamily: 'Ubuntu, system-ui, sans-serif',
          }}
        >
          ✦
        </div>
        <h1
          style={{
            margin: '0 0 12px',
            fontFamily: 'Ubuntu, system-ui, sans-serif',
            fontSize: 24,
            letterSpacing: '0.01em',
            color: 'hsl(42 100% 96%)',
          }}
        >
          Nothing rendered here
        </h1>
        <p
          style={{
            margin: '0 0 8px',
            color: 'hsl(42 25% 78%)',
            fontSize: 15,
            lineHeight: 1.55,
          }}
        >
          The page mounted but came back empty. This usually means the
          deck failed to load, a route is missing a component, or the
          bundle is stale.
        </p>
        {hint && (
          <p
            style={{
              margin: '12px auto 0',
              padding: '10px 14px',
              background: 'hsl(0 0% 8%)',
              border: '1px solid hsl(14 80% 57% / 0.4)',
              borderRadius: 6,
              color: 'hsl(42 100% 96%)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              lineHeight: 1.5,
              textAlign: 'left',
              maxHeight: 120,
              overflow: 'auto',
            }}
          >
            <span style={{ color: 'hsl(42 25% 60%)' }}>Last error:</span>{' '}
            {hint}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={primaryBtn}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => {
              // Cache-bust query param forces a fresh bundle fetch.
              const url = new URL(window.location.href);
              url.searchParams.set('_r', String(Date.now()));
              window.location.replace(url.toString());
            }}
            style={secondaryBtn}
          >
            Hard reload
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/1')}
            style={secondaryBtn}
          >
            Go to slide 1
          </button>
        </div>
        <p
          style={{
            marginTop: 20,
            color: 'hsl(42 25% 55%)',
            fontSize: 12,
          }}
        >
          Open DevTools console for the full stack — runtime errors are
          tagged with a correlation ID.
        </p>
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  background: 'hsl(42 70% 50%)',
  color: 'hsl(0 0% 8%)',
  border: 'none',
  borderRadius: 6,
  padding: '10px 22px',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  letterSpacing: '0.01em',
};

const secondaryBtn: React.CSSProperties = {
  background: 'hsl(0 0% 10%)',
  color: 'hsl(42 100% 96%)',
  border: '1px solid hsl(42 25% 35%)',
  borderRadius: 6,
  padding: '10px 18px',
  fontSize: 14,
  fontFamily: 'inherit',
  cursor: 'pointer',
};
