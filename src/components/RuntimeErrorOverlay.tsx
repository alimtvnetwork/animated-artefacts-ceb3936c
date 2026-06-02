import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';

/**
 * Visible runtime-error overlay (v0.189).
 *
 * Captures three failure surfaces that otherwise leave the preview blank:
 *   1. Uncaught `window.error` events (sync throws outside React).
 *   2. `unhandledrejection` events (async / Promise failures).
 *   3. React render/commit errors — caught by `<RuntimeErrorBoundary>`.
 *
 * Renders a fixed full-screen panel above EVERY route so the author sees
 * the failure reason instantly instead of a blank page. Designed to never
 * itself depend on app state, theme tokens, or providers — pure inline
 * styles + DOM-safe primitives so it paints even when the React tree
 * has crashed and unmounted.
 *
 * Does nothing when the queue is empty.
 */

// ─────────────────────────────────────────────────────────── types ───────

type ErrorKind = 'window.error' | 'unhandledrejection' | 'react' | 'blank-root';

export interface CapturedError {
  readonly id: number;
  /** Short human-friendly correlation ID (e.g. "err_7K3F2A"). Stable per
   *  capture; logged to console + shown in the UI so author and devtools
   *  share the same handle when discussing/searching a failure. */
  readonly correlationId: string;
  readonly kind: ErrorKind;
  readonly message: string;
  readonly stack?: string;
  readonly source?: string; // file:line:col when known
  readonly at: number;
  /** ISO timestamp — duplicated for easy console copy/paste. */
  readonly atIso: string;
  /** URL where the failure was captured. Helps when the user navigates
   *  before reporting the bug. */
  readonly url: string;
  /** React-only: component stack from ErrorInfo. */
  readonly componentStack?: string;
}

// Module-scoped queue so listeners installed once at module-init can
// share state with the React component that renders the overlay.
let nextId = 1;
const subscribers = new Set<(errs: readonly CapturedError[]) => void>();
let errors: CapturedError[] = [];

if (typeof window !== 'undefined') {
  const bootErrors = (window as unknown as { __runtimeErrors__?: readonly CapturedError[] }).__runtimeErrors__;
  if (bootErrors?.length) {
    errors = [...bootErrors];
    nextId = Math.max(nextId, ...bootErrors.map((e) => e.id + 1));
  }
}

function publish(): void {
  const snapshot = Object.freeze([...errors]);
  for (const s of subscribers) s(snapshot);
}

/** Crockford-ish base32 (no I/L/O/U) for short, unambiguous IDs. */
const ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function makeCorrelationId(): string {
  let out = 'err_';
  for (let i = 0; i < 6; i++) {
    out += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return out;
}

function pushError(input: Omit<CapturedError, 'id' | 'at' | 'atIso' | 'url' | 'correlationId'>): void {
  const at = Date.now();
  const captured: CapturedError = {
    ...input,
    id: nextId++,
    correlationId: makeCorrelationId(),
    at,
    atIso: new Date(at).toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  };
  errors = [...errors, captured];
  // Expose for the BlankScreenFallback (and any external probe) without
  // creating a hard import dependency. Read-only snapshot.
  if (typeof window !== 'undefined') {
    (window as unknown as { __runtimeErrors__?: readonly CapturedError[] }).__runtimeErrors__ = errors;
  }
  logToConsole(captured);
  publish();
}

/**
 * Structured console log so devtools shows the SAME correlation ID as
 * the on-screen overlay. Grouped so the stack/component-stack stay
 * collapsible. Uses `console.error` so it survives any log-level
 * filters the user has applied.
 */
function logToConsole(e: CapturedError): void {
  if (typeof console === 'undefined') return;
  const tag = `[runtime-error ${e.correlationId}]`;
  console.error(`${tag} ${KIND_LABEL[e.kind]}: ${e.message}`);
  const grouper = (console.groupCollapsed ?? console.group) as ((label: string) => void) | undefined;
  if (typeof grouper === 'function') {
    grouper.call(console, `${tag} details`);
    console.error('correlationId:', e.correlationId);
    console.error('kind         :', e.kind);
    console.error('at           :', e.atIso);
    console.error('url          :', e.url);
    if (e.source) console.error('source       :', e.source);
    if (e.stack) console.error('stack        :\n' + e.stack);
    if (e.componentStack) console.error('componentStack:\n' + e.componentStack.trim());
    console.groupEnd?.();
  }
  /* eslint-enable no-console */
}

function clearErrors(): void {
  errors = [];
  publish();
}

// ─────────────────────────────────────────────── global listeners ───────

let listenersInstalled = false;
function installGlobalListeners(): void {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;

  window.addEventListener('error', (ev: ErrorEvent) => {
    // Resource-load errors (e.g. <img>) bubble as ErrorEvent with
    // ev.message === '' — skip those; they're noisy and not blanking
    // the page. Real script errors always include a message.
    if (!ev.message && !ev.error) return;
    const err = ev.error instanceof Error ? ev.error : null;
    pushError({
      kind: 'window.error',
      message: err?.message ?? ev.message ?? 'Unknown error',
      stack: err?.stack,
      source: ev.filename
        ? `${ev.filename}:${ev.lineno ?? '?'}:${ev.colno ?? '?'}`
        : undefined,
    });
  });

  window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
    const reason: unknown = ev.reason;
    const err = reason instanceof Error ? reason : null;
    pushError({
      kind: 'unhandledrejection',
      message: err?.message ?? (typeof reason === 'string' ? reason : safeStringify(reason)),
      stack: err?.stack,
    });
  });
}

function safeStringify(v: unknown): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}

// Install immediately at module-init so failures during initial render
// (which can happen before the overlay component itself mounts) are
// captured. The overlay component flushes the queue once it mounts.
installGlobalListeners();

// ─────────────────────────────────────────────── error boundary ───────

interface BoundaryState { error: Error | null }

export class RuntimeErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    pushError({
      kind: 'react',
      message: error.message || 'React render error',
      stack: error.stack,
      // Pull the first application frame out of either stack so the
      // overlay header shows "Component (file:line:col)" without the
      // user having to scroll into the trace.
      source: firstAppFrame(error.stack) ?? firstComponentFrame(info.componentStack),
      componentStack: info.componentStack ?? undefined,
    });
  }

  render(): ReactNode {
    // We deliberately keep rendering children even after a render error
    // is captured — React will replay the same crash on next commit if
    // the underlying issue isn't fixed. The overlay shows the reason on
    // top regardless. If children threw on initial mount, React already
    // unmounted the subtree; rendering null here is the safe fallback.
    if (this.state.error) return null;
    return this.props.children;
  }
}

// ──────────────────────────────────────────────────── overlay UI ───────

/**
 * Extract the first application stack frame, e.g. "Foo (src/pages/Foo.tsx:42:7)".
 * Walks the stack top-down and skips internals (node_modules, react-dom,
 * scheduler, native frames). Returns null when nothing matches.
 */
function firstAppFrame(stack?: string): string | undefined {
  if (!stack) return undefined;
  const lines = stack.split('\n').slice(1); // drop the message line
  const skip = /(node_modules|react-dom|react\/jsx|scheduler|<anonymous>|chrome-extension|@vite|\/vite\/dist)/i;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || skip.test(line)) continue;
    // V8: "at Foo (https://host/src/pages/Foo.tsx:42:7)"
    const v8 = line.match(/^at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (v8) return `${v8[1]} (${shortPath(v8[2])}:${v8[3]}:${v8[4]})`;
    // V8 anonymous: "at https://host/src/pages/Foo.tsx:42:7"
    const v8anon = line.match(/^at\s+(.+?):(\d+):(\d+)$/);
    if (v8anon) return `${shortPath(v8anon[1])}:${v8anon[2]}:${v8anon[3]}`;
    // Firefox: "Foo@https://host/src/pages/Foo.tsx:42:7"
    const ff = line.match(/^(.+?)@(.+?):(\d+):(\d+)$/);
    if (ff) return `${ff[1]} (${shortPath(ff[2])}:${ff[3]}:${ff[4]})`;
  }
  return undefined;
}

/** First named component from React's componentStack ("    in Foo (created by …)"). */
function firstComponentFrame(componentStack?: string | null): string | undefined {
  if (!componentStack) return undefined;
  for (const raw of componentStack.split('\n')) {
    const m = raw.match(/^\s*in\s+([A-Za-z0-9_$]+)/);
    if (m) return m[1];
  }
  return undefined;
}

/** Trim absolute URLs back to the project-relative path so the header stays readable. */
function shortPath(p: string): string {
  const idx = p.indexOf('/src/');
  if (idx >= 0) return p.slice(idx + 1);
  try {
    const u = new URL(p);
    return u.pathname.replace(/^\/+/, '');
  } catch {
    return p;
  }
}

const KIND_LABEL: Record<ErrorKind, string> = {
  'window.error': 'Uncaught error',
  'unhandledrejection': 'Unhandled promise rejection',
  'react': 'React render error',
  'blank-root': 'Blank preview root',
};

const KIND_ACCENT: Record<ErrorKind, string> = {
  'window.error': 'hsl(14 80% 57%)',     // ember
  'unhandledrejection': 'hsl(38 70% 55%)', // amber
  'react': 'hsl(0 75% 60%)',              // red
  'blank-root': 'hsl(42 70% 55%)',         // gold
};

export function RuntimeErrorOverlay(): JSX.Element | null {
  const [list, setList] = useState<readonly CapturedError[]>(errors);

  useEffect(() => {
    const sub = (errs: readonly CapturedError[]) => setList(errs);
    subscribers.add(sub);
    // Flush any errors that arrived before mount.
    sub(errors);
    return () => { subscribers.delete(sub); };
  }, []);

  if (list.length === 0) return null;

  // Allow opt-out via `?errorOverlay=off` for screenshot/QA flows.
  if (typeof window !== 'undefined') {
    const off = new URLSearchParams(window.location.search).get('errorOverlay');
    if (off === 'off') return null;
  }

  const latest = list[list.length - 1];

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-runtime-error-overlay="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483646, // just under the absolute max so devtools-style overlays can still win
        background: 'rgba(8, 6, 4, 0.94)',
        color: 'hsl(42 100% 96%)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: 13,
        lineHeight: 1.55,
        padding: 32,
        overflow: 'auto',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'Ubuntu, system-ui, sans-serif',
              fontSize: 22,
              letterSpacing: '0.01em',
              color: KIND_ACCENT[latest.kind],
            }}
          >
            ⚠ {list.length === 1 ? 'Runtime error' : `${list.length} runtime errors`}
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                const text = list
                  .map((e) => formatErrorPlain(e))
                  .join('\n\n────────────────────────────────────────\n\n');
                void navigator.clipboard?.writeText(text);
              }}
              style={btnStyle}
            >
              Copy all
            </button>
            <button type="button" onClick={() => clearErrors()} style={btnStyle}>
              Dismiss
            </button>
          </div>
        </div>

        <p style={{ color: 'hsl(42 25% 75%)', margin: '0 0 24px' }}>
          The preview caught {list.length === 1 ? 'an error' : 'these errors'} that would
          otherwise blank the page. Fix the underlying issue and reload, or click <em>Dismiss</em> to retry.
        </p>

        {list.map((e) => (
          <ErrorCard key={e.id} err={e} />
        ))}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'hsl(0 0% 12%)',
  color: 'hsl(42 100% 96%)',
  border: '1px solid hsl(42 25% 35%)',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: 12,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

function ErrorCard({ err }: { err: CapturedError }): JSX.Element {
  return (
    <section
      style={{
        background: 'hsl(0 0% 7%)',
        border: `1px solid ${KIND_ACCENT[err.kind]}`,
        borderRadius: 8,
        padding: 18,
        marginBottom: 16,
      }}
    >
      <header style={{ marginBottom: 10, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span
          style={{
            display: 'inline-block',
            background: KIND_ACCENT[err.kind],
            color: 'hsl(0 0% 8%)',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {KIND_LABEL[err.kind]}
        </span>
        <button
          type="button"
          title="Click to copy correlation ID"
          onClick={() => { void navigator.clipboard?.writeText(err.correlationId); }}
          style={{
            background: 'hsl(0 0% 4%)',
            color: 'hsl(42 100% 96%)',
            border: '1px solid hsl(42 25% 35%)',
            borderRadius: 4,
            padding: '2px 8px',
            fontFamily: 'inherit',
            fontSize: 11,
            letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >
          {err.correlationId}
        </button>
        <span style={{ color: 'hsl(42 25% 55%)', fontSize: 11 }}>
          {new Date(err.at).toLocaleTimeString()}
        </span>
        {err.source && (
          <span style={{ color: 'hsl(42 25% 65%)', fontSize: 12 }}>
            {err.source}
          </span>
        )}
      </header>
      <div style={{ color: 'hsl(42 100% 96%)', fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
        {err.message}
      </div>
      {err.stack && (
        <pre style={preStyle}>{trimStack(err.stack)}</pre>
      )}
      {err.componentStack && (
        <>
          <div style={{ marginTop: 12, marginBottom: 4, color: 'hsl(42 25% 65%)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Component stack
          </div>
          <pre style={preStyle}>{err.componentStack.trim()}</pre>
        </>
      )}
    </section>
  );
}

const preStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
  background: 'hsl(0 0% 4%)',
  color: 'hsl(42 25% 80%)',
  padding: 12,
  borderRadius: 4,
  fontSize: 12,
  lineHeight: 1.5,
  maxHeight: 280,
  overflow: 'auto',
};

function trimStack(stack: string): string {
  // Keep first ~20 frames; long stacks make the overlay scroll forever.
  const lines = stack.split('\n');
  if (lines.length <= 22) return stack;
  return [...lines.slice(0, 22), `  … (${lines.length - 22} more frames)`].join('\n');
}

function formatErrorPlain(e: CapturedError): string {
  const parts = [
    `[${KIND_LABEL[e.kind]}] ${e.correlationId} — ${e.message}`,
    `at ${e.atIso}`,
    `url ${e.url}`,
    e.source ? `source ${e.source}` : null,
    e.stack ? `\n${e.stack}` : null,
    e.componentStack ? `\nComponent stack:${e.componentStack}` : null,
  ];
  return parts.filter(Boolean).join('\n');
}
