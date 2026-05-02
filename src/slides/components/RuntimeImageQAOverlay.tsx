/**
 * Surfaces runtime image QA failures (spec 54, v0.162).
 *
 * Mounts at the App root. Subscribes to the runtime QA module and only
 * paints when the latest report contains ≥1 non-`ok` result. Designed to
 * be unobtrusive (top-right toast-style card) but unmissable (gold border
 * + ember accent matches the strict-loader fatal overlay's palette).
 *
 * Why a tiny bespoke overlay instead of the global toast system?
 *   - Toasts dismiss on a timer; this needs to stay until the dev fixes
 *     the bug or explicitly hides it.
 *   - The data is tabular (asset path, status, detail) — not a one-line
 *     toast story.
 *   - The overlay is dev-aimed (triggered by `?qa=images` or `/style-guide`
 *     in dev) so it sits outside the normal user-toast surface.
 *
 * Visibility states:
 *   - No report yet → renders nothing.
 *   - Report with all `ok` → renders nothing.
 *   - Report with failures → fixed top-right card with the failing rows.
 *     User can dismiss for the session via the close button.
 */
import { useEffect, useState } from 'react';
import {
  subscribeRuntimeImageQA,
  type RuntimeImageQAReport,
  type ImageQAStatus,
} from '../runtimeImageQA';

const STATUS_LABEL: Record<ImageQAStatus, string> = {
  'ok': 'OK',
  'not-found': '404',
  'decode-failed': 'Decode failed',
  'dimension-mismatch': 'Wrong size',
};

export function RuntimeImageQAOverlay() {
  const [report, setReport] = useState<RuntimeImageQAReport | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => subscribeRuntimeImageQA(setReport), []);

  if (!report || dismissed) return null;
  const failures = report.results.filter((r) => r.status !== 'ok');
  if (failures.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      // Inline styles instead of Tailwind because this is a dev-aid surface
      // mounted outside the normal layout flow — keeping it self-contained
      // means it renders identically even if Tailwind hasn't initialised
      // (e.g. failure overlays during boot).
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 9999,
        maxWidth: 420,
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
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <strong style={{ color: 'hsl(40 88% 50%)', fontFamily: 'Ubuntu, system-ui, sans-serif', fontSize: 13, letterSpacing: '0.01em' }}>
          Runtime image QA
        </strong>
        <span style={{ color: 'hsl(14 80% 60%)' }}>
          {failures.length}/{report.results.length} failing
        </span>
        <span style={{ marginLeft: 'auto', color: 'hsl(42 25% 60%)' }}>{report.totalMs}ms</span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss QA overlay for this session"
          style={{
            background: 'transparent',
            border: '1px solid hsl(42 25% 30%)',
            color: 'hsl(42 25% 75%)',
            borderRadius: 4,
            padding: '0 6px',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          ×
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
        {failures.map((f) => (
          <li key={f.asset.publicPath} style={{ borderTop: '1px solid hsl(0 0% 12%)', paddingTop: 6 }}>
            <div style={{ color: 'hsl(14 80% 60%)' }}>
              [{STATUS_LABEL[f.status]}] {f.asset.publicPath}
            </div>
            {f.detail && (
              <div style={{ color: 'hsl(42 25% 75%)', marginTop: 2 }}>{f.detail}</div>
            )}
            <div style={{ color: 'hsl(42 25% 50%)', marginTop: 2 }}>
              {f.asset.whyLocked}
            </div>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 10, color: 'hsl(42 25% 50%)', fontSize: 11 }}>
        Re-run via <code style={{ background: 'hsl(0 0% 12%)', padding: '0 4px', borderRadius: 3 }}>?qa=images</code> after fixing.
      </div>
    </div>
  );
}
