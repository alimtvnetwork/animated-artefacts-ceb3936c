/**
 * `/analytics` — local-only telemetry review (Window-2 task 24).
 *
 * Renders aggregations of the in-browser ring buffer maintained by
 * `src/slides/analytics/recorder.ts`. The page never makes a network
 * call — see the recorder's header comment for why.
 *
 * Sections
 * --------
 *   1. Master toggle + clear-events button + summary chips.
 *   2. Per-slide dwell table (sortable by visits, dwell, reveals).
 *   3. Raw event log (collapsible) for power users + JSON export.
 *
 * All styling routes through semantic tokens — the page works on every
 * theme, including the in-app reduced-motion override.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  clearEvents,
  isAnalyticsEnabled,
  setAnalyticsEnabled,
  summarizeByType,
  summarizeDwell,
  summarizeReveals,
  useAnalyticsEnabled,
  useAnalyticsEvents,
  type AnalyticsEvent,
  type SlideDwellSummary,
} from '@/slides/analytics/recorder';

type SortKey = 'slide' | 'visits' | 'totalDwellMs' | 'meanDwellMs' | 'reveals';

function fmtMs(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s - m * 60);
  return `${m} m ${r} s`;
}

function downloadJson(events: ReadonlyArray<AnalyticsEvent>): void {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), events }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `riseup-analytics-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const enabled = useAnalyticsEnabled();
  const events = useAnalyticsEvents();
  const [sortKey, setSortKey] = useState<SortKey>('totalDwellMs');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [logOpen, setLogOpen] = useState(false);

  const summary = useMemo(() => summarizeDwell(events), [events]);
  const byType = useMemo(() => summarizeByType(events), [events]);
  const byReveal = useMemo(() => summarizeReveals(events), [events]);

  const sorted = useMemo<SlideDwellSummary[]>(() => {
    const copy = [...summary];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      // NaN (meanDwellMs with 0 visits) always sorts last regardless of direction.
      if (Number.isNaN(av) && Number.isNaN(bv)) return 0;
      if (Number.isNaN(av)) return 1;
      if (Number.isNaN(bv)) return -1;
      const d = (av as number) - (bv as number);
      return sortDir === 'desc' ? -d : d;
    });
    return copy;
  }, [summary, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(k);
      setSortDir('desc');
    }
  }

  const totalEvents = events.length;
  const totalSlidesVisited = summary.length;
  const totalReveals = summary.reduce((s, r) => s + r.reveals, 0);
  const grandDwellMs = summary.reduce((s, r) => s + r.totalDwellMs, 0);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        padding: '4rem 2rem',
        fontFamily: 'var(--font-body, Inter), system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <Link
          to="/1"
          style={{
            display: 'inline-block',
            marginBottom: '1.5rem',
            color: 'hsl(var(--gold))',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          ← Back to deck
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-display, Ubuntu), system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            margin: '0 0 0.25rem',
          }}
        >
          Analytics
        </h1>
        <p style={{ color: 'hsl(var(--muted-foreground))', margin: '0 0 2rem', maxWidth: 640 }}>
          Local-only rehearsal telemetry — slide views, dwell time, and click-reveal
          interactions. Nothing leaves this device. Disabled by default.
        </p>

        {/* Master controls */}
        <section
          aria-label="Controls"
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            border: '1px solid hsl(var(--border))',
            borderRadius: 12,
            background: 'hsl(var(--surface-1, var(--background)))',
            marginBottom: '2rem',
          }}
        >
          <button
            type="button"
            onClick={() => setAnalyticsEnabled(!isAnalyticsEnabled())}
            aria-pressed={enabled}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid hsl(var(--gold) / 0.6)',
              background: enabled ? 'hsl(var(--gold) / 0.2)' : 'transparent',
              color: enabled ? 'hsl(var(--gold))' : 'hsl(var(--foreground))',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {enabled ? '● Recording' : '○ Paused'}
          </button>

          <button
            type="button"
            onClick={() => downloadJson(events)}
            disabled={totalEvents === 0}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid hsl(var(--border))',
              background: 'transparent',
              color: 'hsl(var(--foreground))',
              cursor: totalEvents === 0 ? 'not-allowed' : 'pointer',
              opacity: totalEvents === 0 ? 0.5 : 1,
            }}
          >
            Export JSON
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Clear all recorded events? This cannot be undone.')) clearEvents();
            }}
            disabled={totalEvents === 0}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid hsl(var(--ember) / 0.5)',
              background: 'transparent',
              color: 'hsl(var(--ember))',
              cursor: totalEvents === 0 ? 'not-allowed' : 'pointer',
              opacity: totalEvents === 0 ? 0.5 : 1,
            }}
          >
            Clear events
          </button>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: '1.25rem',
              fontSize: '0.85rem',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <span>
              <strong style={{ color: 'hsl(var(--foreground))' }}>{totalEvents}</strong> events
            </span>
            <span>
              <strong style={{ color: 'hsl(var(--foreground))' }}>{totalSlidesVisited}</strong> slides
            </span>
            <span>
              <strong style={{ color: 'hsl(var(--foreground))' }}>{totalReveals}</strong> reveals
            </span>
            <span>
              <strong style={{ color: 'hsl(var(--foreground))' }}>{fmtMs(grandDwellMs)}</strong> dwell
            </span>
          </div>
        </section>

        {/* Per-slide dwell table */}
        <section aria-label="Per-slide dwell summary" style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display, Ubuntu), system-ui, sans-serif',
              fontSize: '1.5rem',
              margin: '0 0 0.75rem',
            }}
          >
            By slide
          </h2>
          {sorted.length === 0 ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
              {enabled
                ? 'No data yet — navigate the deck and come back here.'
                : 'Recording is off. Toggle it above and rehearse the deck to populate this table.'}
            </p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.95rem',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ background: 'hsl(var(--surface-2, var(--background)))' }}>
                  {(
                    [
                      { k: 'slide', label: 'Slide' },
                      { k: 'visits', label: 'Visits' },
                      { k: 'totalDwellMs', label: 'Total dwell' },
                      { k: 'meanDwellMs', label: 'Avg dwell' },
                      { k: 'reveals', label: 'Reveals' },
                    ] as const
                  ).map((col) => (
                    <th
                      key={col.k}
                      onClick={() => toggleSort(col.k)}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderBottom: '2px solid hsl(var(--gold) / 0.7)',
                        color: 'hsl(var(--cream, var(--foreground)))',
                        fontWeight: 600,
                      }}
                    >
                      {col.label}
                      {sortKey === col.k ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => (
                  <tr
                    key={row.slide}
                    style={{
                      background:
                        idx % 2 === 1
                          ? 'hsl(var(--surface-2, var(--background)) / 0.4)'
                          : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <Link
                        to={`/${row.slide}`}
                        style={{ color: 'hsl(var(--gold))', textDecoration: 'none' }}
                      >
                        /{row.slide}
                      </Link>
                    </td>
                    <td style={{ padding: '0.6rem 1rem' }}>{row.visits}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>{fmtMs(row.totalDwellMs)}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>{fmtMs(row.meanDwellMs)}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>{row.reveals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* By slide type */}
        <section aria-label="Slide-type usage" style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display, Ubuntu), system-ui, sans-serif',
              fontSize: '1.5rem',
              margin: '0 0 0.75rem',
            }}
          >
            By slide type
          </h2>
          {byType.length === 0 ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
              No type-tagged events yet.
            </p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.95rem',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ background: 'hsl(var(--surface-2, var(--background)))' }}>
                  {['Slide type', 'Visits', 'Total dwell', 'Avg dwell', 'Reveals'].map((label) => (
                    <th
                      key={label}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        borderBottom: '2px solid hsl(var(--gold) / 0.7)',
                        color: 'hsl(var(--cream, var(--foreground)))',
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byType.map((row, idx) => (
                  <tr
                    key={row.slideType}
                    style={{
                      background:
                        idx % 2 === 1
                          ? 'hsl(var(--surface-2, var(--background)) / 0.4)'
                          : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>{row.slideType}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>{row.visits}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>{fmtMs(row.totalDwellMs)}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>{fmtMs(row.meanDwellMs)}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>{row.reveals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* By click-reveal section */}
        <section aria-label="Click-reveal section usage" style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display, Ubuntu), system-ui, sans-serif',
              fontSize: '1.5rem',
              margin: '0 0 0.75rem',
            }}
          >
            By click-reveal section
          </h2>
          {byReveal.length === 0 ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
              No reveal interactions recorded yet.
            </p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.95rem',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ background: 'hsl(var(--surface-2, var(--background)))' }}>
                  {['Section', 'Opens', 'From slides', 'Last opened'].map((label) => (
                    <th
                      key={label}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        borderBottom: '2px solid hsl(var(--gold) / 0.7)',
                        color: 'hsl(var(--cream, var(--foreground)))',
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byReveal.map((row, idx) => (
                  <tr
                    key={row.revealSlug}
                    style={{
                      background:
                        idx % 2 === 1
                          ? 'hsl(var(--surface-2, var(--background)) / 0.4)'
                          : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>{row.revealSlug}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>{row.opens}</td>
                    <td style={{ padding: '0.6rem 1rem', color: 'hsl(var(--muted-foreground))' }}>
                      {row.parentSlides.length === 0
                        ? '—'
                        : row.parentSlides.map((n) => `/${n}`).join(', ')}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', color: 'hsl(var(--muted-foreground))' }}>
                      {row.lastOpenedAt
                        ? new Date(row.lastOpenedAt).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Raw event log */}
        <section aria-label="Raw event log">
          <button
            type="button"
            onClick={() => setLogOpen((o) => !o)}
            aria-expanded={logOpen}
            style={{
              padding: '0.5rem 0',
              background: 'transparent',
              border: 0,
              color: 'hsl(var(--gold))',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
            }}
          >
            {logOpen ? '▾' : '▸'} Raw event log ({totalEvents})
          </button>
          {logOpen && (
            <pre
              style={{
                marginTop: '0.75rem',
                padding: '1rem',
                background: 'hsl(var(--surface-2, var(--background)) / 0.5)',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                overflow: 'auto',
                maxHeight: '60vh',
                fontSize: '0.8rem',
                fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
                color: 'hsl(var(--foreground))',
              }}
            >
              {events.length === 0 ? '(empty)' : JSON.stringify(events, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </main>
  );
}
