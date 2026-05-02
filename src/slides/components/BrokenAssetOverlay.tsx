/**
 * Floating dismissible card listing every non-fatal asset failure
 * collected during this session (v0.173).
 *
 * Mounts at the App root. Subscribes to `BrokenAssetReport` and only
 * paints when ≥1 entry exists. Designed to mirror `RuntimeImageQAOverlay`:
 *   - Fixed top-right card, gold border, ember accent.
 *   - Dismissible for the session (a NEW failure will re-open it because
 *     we key the dismissed state on the entry count — see below).
 *
 * # Why this lives separately from RuntimeImageQAOverlay
 *   - That overlay is a manual-trigger dev aid (`?qa=images`) and only
 *     covers the reference-asset gallery. This one is automatic for any
 *     soft-fail deck (imported decks + any deck with `assetPolicy.softFail`).
 *   - Two cards avoid the worst-case where one widget claims the same
 *     real estate for two unrelated reports.
 *
 * # Why the dismiss state resets when new failures arrive
 *   - If a user dismisses the card after fixing one cue, then triggers
 *     another broken cue, they'd never see the new failure unless we
 *     re-show. Tracking the count at the time of dismiss handles this
 *     without forcing a "this just changed" toast.
 */
import { useEffect, useState } from 'react';
import {
  subscribeBrokenAssetReport,
  type BrokenAssetReport,
  type BrokenAssetEntry,
  type BrokenAssetReason,
} from '../brokenAssetReport';

const REASON_LABEL: Record<BrokenAssetReason, string> = {
  'missing-slug': 'Not declared in deck.assets',
  'url-fetch-failed': 'File missing (HTTP fetch failed)',
  'audio-decode-failed': 'Audio file could not be decoded',
  'image-decode-failed': 'Image file could not be decoded',
};

const KIND_LABEL: Record<BrokenAssetEntry['kind'], string> = {
  audio: 'audio',
  qr: 'qr',
  brand: 'brand',
};

/**
 * Strip query/hash and trailing slash, return the last path segment.
 * Mirrors `basenameOf` in `assetRegistry.ts` so the overlay shows the
 * exact filename a user would search for in their `public/` folder.
 * Kept inline to avoid pulling the full assetRegistry module into the
 * overlay's render path.
 */
function basenameOf(url: string | null | undefined): string {
  if (!url) return '(no file — slug never declared)';
  const noQuery = url.split(/[?#]/, 1)[0];
  const trimmed = noQuery.replace(/\/+$/, '');
  if (!trimmed) return '(no filename)';
  const seg = trimmed.split('/').pop();
  return seg && seg.length > 0 ? seg : '(no filename)';
}

function FieldRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
      <span
        style={{
          color: 'hsl(42 25% 55%)',
          minWidth: 64,
          flexShrink: 0,
          textTransform: 'uppercase',
          fontSize: 10,
          letterSpacing: '0.04em',
          paddingTop: 1,
        }}
      >
        {label}
      </span>
      <span style={{ color: valueColor ?? 'hsl(42 100% 96%)', wordBreak: 'break-all', flex: 1 }}>
        {value}
      </span>
    </div>
  );
}

export function BrokenAssetOverlay() {
  const [report, setReport] = useState<BrokenAssetReport | null>(null);
  /** Count at the moment the user clicked dismiss; new entries reopen the card. */
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  useEffect(() => subscribeBrokenAssetReport(setReport), []);

  if (!report || report.entries.length === 0) return null;
  if (dismissedAt !== null && report.entries.length <= dismissedAt) return null;

  const total = report.entries.length;

  return (
    <div
      role="alert"
      aria-live="polite"
      // Inline styles instead of Tailwind because this is a diagnostic
      // surface mounted outside the normal layout flow — keeping it self-
      // contained means it renders identically even if Tailwind hasn't
      // initialised (e.g. failure overlays during boot).
      style={{
        position: 'fixed',
        top: 12,
        // Sit slightly LEFT of RuntimeImageQAOverlay so they can co-exist
        // when both fire on the same page (rare but possible).
        right: 12,
        zIndex: 9998,
        maxWidth: 440,
        background: 'hsl(0 0% 7%)',
        color: 'hsl(42 100% 96%)',
        border: '1px solid hsl(14 80% 57% / 0.7)',
        borderRadius: 8,
        padding: '14px 16px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        lineHeight: 1.5,
        boxShadow: '0 16px 32px hsl(0 0% 0% / 0.45)',
      }}
      data-testid="broken-asset-overlay"
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <strong
          style={{
            color: 'hsl(40 88% 50%)',
            fontFamily: 'Ubuntu, system-ui, sans-serif',
            fontSize: 13,
            letterSpacing: '0.01em',
          }}
        >
          Broken assets
        </strong>
        <span style={{ color: 'hsl(14 80% 60%)' }}>
          {total} failing
        </span>
        <span style={{ marginLeft: 'auto', color: 'hsl(42 25% 60%)', fontSize: 11 }}>
          non-fatal
        </span>
        <button
          type="button"
          onClick={() => setDismissedAt(total)}
          aria-label="Dismiss broken asset overlay for this session"
          style={{
            background: 'transparent',
            border: '1px solid hsl(42 25% 30%)',
            color: 'hsl(42 25% 75%)',
            borderRadius: 4,
            padding: '0 6px',
            cursor: 'pointer',
            fontSize: 11,
            marginLeft: 6,
          }}
        >
          ×
        </button>
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gap: 6,
          maxHeight: 360,
          overflowY: 'auto',
        }}
      >
        {report.entries.map((e) => (
          <li
            key={`${e.kind}:${e.slug}:${e.reason}`}
            style={{
              borderTop: '1px solid hsl(0 0% 12%)',
              paddingTop: 6,
              // Cached entries are dimmed slightly so live failures pop.
              opacity: e.cached ? 0.78 : 1,
            }}
            data-testid="broken-asset-entry"
            data-cached={e.cached ? 'true' : 'false'}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  color: 'hsl(14 80% 60%)',
                  fontWeight: 600,
                }}
              >
                {e.slug}
              </span>
              {e.cached && (
                <span
                  // "From previous session" badge — tells users this entry
                  // was hydrated from localStorage and hasn't yet been
                  // re-confirmed this page-load. Audio entries can stay
                  // cached forever (we can't verify without playback).
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'hsl(42 25% 65%)',
                    border: '1px solid hsl(42 25% 30%)',
                    borderRadius: 3,
                    padding: '0 4px',
                  }}
                  title="Recorded in a previous session; persists until verified or dismissed."
                  data-testid="broken-asset-cached-badge"
                >
                  cached
                </span>
              )}
            </div>
            <FieldRow label="File" value={basenameOf(e.url)} valueColor="hsl(42 100% 92%)" />
            <FieldRow label="Type" value={KIND_LABEL[e.kind]} />
            <FieldRow label="Error" value={REASON_LABEL[e.reason]} valueColor="hsl(14 80% 70%)" />
            {e.url && <FieldRow label="URL" value={e.url} valueColor="hsl(42 25% 70%)" />}
            {e.detail && <FieldRow label="Detail" value={e.detail} valueColor="hsl(42 25% 60%)" />}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 10, color: 'hsl(42 25% 50%)', fontSize: 11 }}>
        Imported deck — slides keep rendering. Fix the URL in
        <code
          style={{
            background: 'hsl(0 0% 12%)',
            padding: '0 4px',
            borderRadius: 3,
            margin: '0 4px',
          }}
        >
          deck.assets
        </code>
        and re-import.
      </div>
    </div>
  );
}
