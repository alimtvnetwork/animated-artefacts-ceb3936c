/**
 * BrandStripAuditOverlay — on-screen confirmation that the boot-time
 * `stripRejectedBrandStrip` pass actually ran, and a row-by-row list of
 * exactly which BrandStrip fields it removed (from localStorage imports
 * AND from bundled showcase JSON).
 *
 * Why this exists
 * ---------------
 * The user-rejected BrandStrip kept resurrecting from older cached
 * manifests. We now strip it on every boot — but stripping is silent,
 * so there's no way to verify the fix from the UI. This overlay is the
 * receipt: open the deck, see "BrandStrip audit • N fields stripped"
 * in the bottom-right corner, expand to see the per-slide breakdown,
 * dismiss when satisfied.
 *
 * Behavior
 * --------
 * - Renders nothing when the audit log is empty (the fix had nothing
 *   to do — common case once the localStorage cache is clean).
 * - Auto-shows on mount when there are entries. The user can collapse
 *   to a tiny pill or fully dismiss for the session via sessionStorage.
 * - Pure presentation. Reads `brandStripAudit` once from the loader
 *   module — never mutates global state.
 */
import { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, X } from 'lucide-react';
import { brandStripAudit } from '../loader';

const DISMISS_KEY = 'riseup.brandStripAudit.dismissed.v1';

export function BrandStripAuditOverlay() {
  const initiallyDismissed =
    typeof window !== 'undefined' && window.sessionStorage.getItem(DISMISS_KEY) === '1';
  const [dismissed, setDismissed] = useState(initiallyDismissed);
  const [expanded, setExpanded] = useState(true);

  // Nothing to report → render nothing. This is the steady state once the
  // user's localStorage no longer carries any legacy `brandStrip` values.
  if (brandStripAudit.length === 0) return null;
  if (dismissed) return null;

  const importedCount = brandStripAudit.filter(e => e.source === 'imported').length;
  const bundledCount = brandStripAudit.filter(e => e.source === 'bundled').length;

  const handleDismiss = () => {
    window.sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="BrandStrip audit summary"
      className="fixed bottom-4 right-4 z-[60] max-w-[360px] rounded-xl border border-border/70 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md"
    >
      {/* Header — always visible. Click to expand/collapse the per-row list. */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} />
        <span className="flex-1 text-[13px] font-medium leading-tight">
          BrandStrip audit · {brandStripAudit.length} field
          {brandStripAudit.length === 1 ? '' : 's'} stripped
          <span className="ml-2 text-[11px] font-normal text-muted-foreground">
            {importedCount > 0 && `${importedCount} imported`}
            {importedCount > 0 && bundledCount > 0 && ' · '}
            {bundledCount > 0 && `${bundledCount} bundled`}
          </span>
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Body — per-entry list. Scrolls when long. */}
      {expanded && (
        <div className="max-h-[280px] overflow-y-auto border-t border-border/60 px-3 py-2">
          <ul className="space-y-1.5">
            {brandStripAudit.map((entry, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-2 text-[12px] leading-snug"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-foreground/90">
                    {entry.scope === 'deck'
                      ? `deck.brandStrip`
                      : `slide ${entry.slideNumber}: ${entry.label}`}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    source: {entry.source} · removed:{' '}
                    <code className="rounded bg-muted/40 px-1 py-0.5 font-mono">
                      {formatValue(entry.removedValue)}
                    </code>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer — dismiss for the rest of this session. */}
      <div className="flex items-center justify-end border-t border-border/60 px-3 py-1.5">
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3 w-3" /> Dismiss for this session
        </button>
      </div>
    </div>
  );
}

/** Render any removed value as a short, copy-friendly string. */
function formatValue(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') {
    return JSON.stringify(v);
  }
  try {
    const s = JSON.stringify(v);
    return s.length > 60 ? `${s.slice(0, 57)}…` : s;
  } catch {
    return String(v);
  }
}
