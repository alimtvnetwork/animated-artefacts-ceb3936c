/**
 * /click-reveal-audit — authoring-time dependency inspector.
 *
 * Lists every click-reveal trigger in the active deck (capsules, steps,
 * step CTAs, hotspots, slide CTA) alongside every slide marked
 * `isClickReveal: true`, then surfaces wiring problems (orphans, missing
 * targets, parent mismatch, etc).
 *
 * This page is presenter-side only — no production audience ever sees it,
 * so it's allowed to break the strict noir/gold visual budget in favor of
 * dense tabular information. Still uses semantic tokens though.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { allSlides, deck } from '@/slides/loader';
import {
  auditClickRevealDependencies,
  formatClickRevealReport,
  type ClickRevealIssue,
  type IssueSeverity,
} from '@/slides/clickRevealAudit';
import { ArrowLeft, AlertTriangle, AlertCircle, Info, Copy, Download } from 'lucide-react';

const SEVERITY_STYLE: Record<IssueSeverity, { dot: string; text: string; chip: string; Icon: typeof AlertTriangle }> = {
  error:   { dot: 'bg-red-500',    text: 'text-red-400',    chip: 'bg-red-500/15 text-red-300 border-red-500/30', Icon: AlertCircle },
  warning: { dot: 'bg-amber-400',  text: 'text-amber-300',  chip: 'bg-amber-500/15 text-amber-200 border-amber-500/30', Icon: AlertTriangle },
  info:    { dot: 'bg-sky-400',    text: 'text-sky-300',    chip: 'bg-sky-500/15 text-sky-200 border-sky-500/30', Icon: Info },
};

export default function ClickRevealAuditPage() {
  const report = useMemo(() => auditClickRevealDependencies(allSlides), []);
  const [filter, setFilter] = useState<'all' | IssueSeverity>('all');
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);
  const [copied, setCopied] = useState(false);

  const visibleIssues: ClickRevealIssue[] = useMemo(() => {
    if (filter === 'all') return report.issues;
    return report.issues.filter((i) => i.severity === filter);
  }, [report.issues, filter]);

  const visibleClickRevealSlides = useMemo(() => {
    if (!showOnlyProblems) return report.clickRevealSlides;
    return report.clickRevealSlides.filter((s) => s.isOrphaned || (s.declaredParent != null && !s.actualParents.includes(s.declaredParent)));
  }, [report.clickRevealSlides, showOnlyProblems]);

  function copyReport() {
    const text = formatClickRevealReport(report);
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function downloadReport() {
    const text = formatClickRevealReport(report);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `click-reveal-audit-${deck.deckSlug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const { stats } = report;

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8 max-w-[1200px] mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/1"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to deck
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Click-Reveal Dependency Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deck <span className="font-mono text-gold">{deck.deckSlug}</span> — verifies every click-appearing slide is reachable from at least one trigger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyReport}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-[12px] hover:text-gold hover:bg-gold/10 transition"
          >
            <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy text report'}
          </button>
          <button
            type="button"
            onClick={downloadReport}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-[12px] hover:text-gold hover:bg-gold/10 transition"
          >
            <Download className="h-3.5 w-3.5" /> Download .txt
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <Stat label="Slides" value={stats.totalSlides} />
        <Stat label="Click-reveal slides" value={stats.totalClickRevealSlides} accent="gold" />
        <Stat label="Triggers (nav)" value={stats.totalNavigatingTriggers} />
        <Stat label="Triggers (inline)" value={stats.totalInlineExpandTriggers} />
        <Stat label="Orphans" value={stats.orphanedClickRevealSlides} accent={stats.orphanedClickRevealSlides > 0 ? 'red' : undefined} />
        <Stat label="Errors / Warnings" value={`${stats.errors} / ${stats.warnings}`} accent={stats.errors > 0 ? 'red' : stats.warnings > 0 ? 'amber' : undefined} />
      </section>

      {/* Issues */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Issues</h2>
          <div className="flex items-center gap-1">
            {(['all', 'error', 'warning', 'info'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  'h-7 px-2.5 rounded-md text-[11px] uppercase tracking-wider border transition',
                  filter === f
                    ? 'border-gold/60 bg-gold/10 text-gold'
                    : 'border-border text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {visibleIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground italic border border-dashed border-border rounded-md p-4 text-center">
            {report.issues.length === 0 ? 'No issues. Click-reveal wiring is clean. ✓' : 'No issues at this severity.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {visibleIssues.map((issue, idx) => {
              const style = SEVERITY_STYLE[issue.severity];
              return (
                <li key={idx} className="flex items-start gap-3 p-3 rounded-md border border-border bg-surface-1/40">
                  <style.Icon className={`h-4 w-4 shrink-0 mt-0.5 ${style.text}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${style.chip}`}>
                        {issue.severity}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">{issue.code}</span>
                      {issue.sourceSlideNumber != null && (
                        <Link
                          to={`/${issue.sourceSlideNumber}`}
                          className="text-[10px] font-mono text-gold/80 hover:text-gold underline-offset-2 hover:underline"
                        >
                          source: {issue.sourceSlideNumber}
                        </Link>
                      )}
                      {issue.targetSlideNumber != null && (
                        <Link
                          to={`/${issue.targetSlideNumber}`}
                          className="text-[10px] font-mono text-gold/80 hover:text-gold underline-offset-2 hover:underline"
                        >
                          target: {issue.targetSlideNumber}
                        </Link>
                      )}
                    </div>
                    <p className="text-[13px] text-foreground/90">{issue.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Click-reveal slides */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            Click-reveal slides ({report.clickRevealSlides.length})
          </h2>
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyProblems}
              onChange={(e) => setShowOnlyProblems(e.target.checked)}
              className="accent-gold"
            />
            Only orphans / mismatches
          </label>
        </div>
        {visibleClickRevealSlides.length === 0 ? (
          <p className="text-sm text-muted-foreground italic border border-dashed border-border rounded-md p-4 text-center">
            {report.clickRevealSlides.length === 0
              ? 'No click-reveal slides in this deck.'
              : 'No problematic click-reveal slides at this filter.'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface-1/60 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 w-16">#</th>
                  <th className="text-left px-3 py-2">Slide</th>
                  <th className="text-left px-3 py-2 w-40">Declared parent</th>
                  <th className="text-left px-3 py-2">Actual parents</th>
                  <th className="text-left px-3 py-2 w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleClickRevealSlides.map((s) => {
                  const mismatch =
                    s.declaredParent != null && !s.actualParents.includes(s.declaredParent);
                  return (
                    <tr key={s.slideNumber} className="border-t border-border/60 hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-mono text-gold/80">{s.slideNumber}</td>
                      <td className="px-3 py-2">
                        <Link to={`/${s.slideNumber}`} className="hover:text-gold transition">
                          {s.slideName}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-foreground/70">
                        {s.declaredParent ?? <span className="text-muted-foreground/60">—</span>}
                      </td>
                      <td className="px-3 py-2 font-mono text-foreground/70">
                        {s.actualParents.length === 0 ? (
                          <span className="text-red-400">none</span>
                        ) : (
                          s.actualParents.map((p, i) => (
                            <span key={p}>
                              {i > 0 && ', '}
                              <Link to={`/${p}`} className="hover:text-gold underline-offset-2 hover:underline">
                                {p}
                              </Link>
                            </span>
                          ))
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {s.isOrphaned ? (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border bg-red-500/15 text-red-300 border-red-500/30">
                            orphan
                          </span>
                        ) : mismatch ? (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-200 border-amber-500/30">
                            mismatch
                          </span>
                        ) : s.actualParents.length > 1 ? (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border bg-sky-500/15 text-sky-200 border-sky-500/30">
                            multi-parent
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-500/15 text-emerald-200 border-emerald-500/30">
                            ok
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Triggers */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold mb-3">
          All triggers ({report.triggers.length})
        </h2>
        {report.triggers.length === 0 ? (
          <p className="text-sm text-muted-foreground italic border border-dashed border-border rounded-md p-4 text-center">
            No click-reveal triggers found in this deck.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface-1/60 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 w-16">From</th>
                  <th className="text-left px-3 py-2">Source slide</th>
                  <th className="text-left px-3 py-2 w-48">Origin</th>
                  <th className="text-left px-3 py-2">Trigger</th>
                  <th className="text-left px-3 py-2 w-32">Target</th>
                </tr>
              </thead>
              <tbody>
                {[...report.triggers]
                  .sort(
                    (a, b) =>
                      a.sourceSlideNumber - b.sourceSlideNumber ||
                      a.origin.localeCompare(b.origin),
                  )
                  .map((t, idx) => (
                    <tr key={idx} className="border-t border-border/60 hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-mono text-gold/80">{t.sourceSlideNumber}</td>
                      <td className="px-3 py-2">
                        <Link to={`/${t.sourceSlideNumber}`} className="hover:text-gold transition">
                          {t.sourceSlideName}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-foreground/60">{t.origin}</td>
                      <td className="px-3 py-2 text-foreground/80">{t.triggerLabel}</td>
                      <td className="px-3 py-2 font-mono">
                        {t.isInlineExpand ? (
                          <span className="text-foreground/50">inline expand</span>
                        ) : (
                          <Link
                            to={`/${t.targetSlideNumber}`}
                            className="text-gold/85 hover:text-gold underline-offset-2 hover:underline"
                          >
                            slide {t.targetSlideNumber}
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: 'gold' | 'red' | 'amber' }) {
  const accentClass =
    accent === 'gold' ? 'text-gold' :
    accent === 'red' ? 'text-red-400' :
    accent === 'amber' ? 'text-amber-300' :
    'text-foreground';
  return (
    <div className="rounded-md border border-border bg-surface-1/30 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold mt-0.5 ${accentClass}`}>{value}</div>
    </div>
  );
}
