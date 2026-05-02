/**
 * /release/:version — per-version immutable release checklist.
 *
 * Each version is a frozen snapshot in `src/releases/vX_Y_Z.ts`,
 * registered in `src/releases/index.ts`. The route `/release/v1.1.0`
 * reads that snapshot and renders it; `/release` (no version) redirects
 * to the latest. Unknown versions render NotFound.
 *
 * "Frozen" means: once the tag is pushed, the snapshot file is treated
 * as historical record. The page surfaces a banner so readers know
 * they are looking at what shipped, not a live work-in-progress.
 *
 * Theming uses semantic tokens (`bg-background`, `text-foreground`,
 * `--gold`, `--ember`, `--cream`) so the page inherits the deck's
 * Noir & Gold palette without hardcoded hex.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NotFound from './NotFound';
import {
  findRelease,
  type ReleaseChecklistItem,
} from '@/releases';

function StatusBadge({ status }: { status: ReleaseChecklistItem['status'] | 'pass' | 'fail' | 'unknown' }) {
  const config: Record<string, { label: string; bg: string; fg: string }> = {
    done: { label: '✓ done', bg: 'hsl(var(--gold) / 0.18)', fg: 'hsl(var(--gold))' },
    pass: { label: '✓ pass', bg: 'hsl(var(--gold) / 0.18)', fg: 'hsl(var(--gold))' },
    todo: { label: '· todo', bg: 'hsl(var(--ember) / 0.18)', fg: 'hsl(var(--ember))' },
    fail: { label: '✗ fail', bg: 'hsl(var(--destructive) / 0.18)', fg: 'hsl(var(--destructive))' },
    manual: { label: '✋ manual', bg: 'hsl(var(--cream) / 0.12)', fg: 'hsl(var(--cream))' },
    unknown: { label: '? unknown', bg: 'hsl(var(--muted))', fg: 'hsl(var(--muted-foreground))' },
  };
  const c = config[status] ?? config.unknown;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  );
}

function CodeBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — silent */
    }
  };
  return (
    <div className="relative rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={onCopy}
        className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium border border-border bg-card hover:bg-muted transition-colors"
        aria-label="Copy commands"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="p-4 pr-20 text-sm leading-6 overflow-x-auto bg-card text-foreground font-mono">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export default function ReleaseChecklistPage() {
  const { version } = useParams<{ version: string }>();
  // `version` will be the literal URL segment, e.g. "v1.1.0".
  // `findRelease` accepts both "v1.1.0" and "1.1.0".
  const release = version ? findRelease(version) : undefined;

  if (!release) {
    return <NotFound />;
  }

  const { checklist, build, tag, title, summary, releasedAt, frozen, tagCommand } = release;
  const doneCount = checklist.filter((c) => c.status === 'done').length;
  const totalAuto = checklist.filter((c) => c.status !== 'manual').length;
  const allAutoDone = doneCount === totalAuto;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            to="/1"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to deck
          </Link>
          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            <h1
              className="text-4xl font-display font-bold"
              style={{ fontFamily: "'Ubuntu', 'Inter', sans-serif" }}
            >
              Release checklist
            </h1>
            <span
              className="text-sm font-mono px-2 py-1 rounded"
              style={{
                background: 'hsl(var(--gold) / 0.15)',
                color: 'hsl(var(--gold))',
              }}
            >
              {tag}
            </span>
            {frozen && (
              <span
                className="text-xs font-mono px-2 py-1 rounded uppercase tracking-wider"
                style={{
                  background: 'hsl(var(--cream) / 0.10)',
                  color: 'hsl(var(--cream))',
                  border: '1px solid hsl(var(--cream) / 0.25)',
                }}
                title="This snapshot is immutable — it documents what shipped under this tag."
              >
                Frozen · {releasedAt}
              </span>
            )}
          </div>
          <h2 className="mt-2 text-lg text-foreground/90">{title}</h2>
          <p className="mt-1 text-muted-foreground">{summary}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Riseup Asia Slides · ship-readiness audit. {doneCount} / {totalAuto}{' '}
            automated steps complete{allAutoDone ? ' — ready to tag.' : '.'}
          </p>
        </div>

        {/* Frozen banner */}
        {frozen && (
          <div
            className="mb-8 rounded-lg p-4 text-sm"
            style={{
              background: 'hsl(var(--cream) / 0.06)',
              border: '1px solid hsl(var(--cream) / 0.20)',
              color: 'hsl(var(--cream))',
            }}
          >
            <strong className="font-semibold">Immutable snapshot.</strong>{' '}
            This page documents what shipped under <code className="font-mono">{tag}</code> on{' '}
            <code className="font-mono">{releasedAt}</code>. The contents are
            historical record — edit{' '}
            <code className="font-mono">src/releases/v{release.version.replace(/\./g, '_')}.ts</code>{' '}
            only to correct factual errors. New work goes in a new release file.
          </div>
        )}

        {/* Build status */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Production build</h2>
            <StatusBadge status={build.status} />
          </div>
          <div
            className="rounded-lg border border-border p-4"
            style={{ background: 'hsl(var(--card))' }}
          >
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Last verified</dt>
              <dd className="font-mono">{build.builtAt}</dd>
              <dt className="text-muted-foreground">Duration</dt>
              <dd className="font-mono">
                {build.durationSec ? `${build.durationSec}s` : '—'}
              </dd>
              <dt className="text-muted-foreground">Command</dt>
              <dd className="font-mono">bun run build</dd>
            </dl>
            {build.notes.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                {build.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Checklist */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Checklist</h2>
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
                style={{ background: 'hsl(var(--card))' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                  {item.detail && (
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  )}
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        </section>

        {/* Git tag commands */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Git tag commands</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Run these locally — the Lovable sandbox cannot perform stateful git
            operations. Make sure your working tree is synced with the GitHub
            repo (Connectors → GitHub) before tagging.
          </p>
          <CodeBlock value={tagCommand} />
        </section>

        {/* GitHub release pointer */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">GitHub Release</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>After pushing the tag, open the repo's Releases page on GitHub.</li>
            <li>Click <em>Draft a new release</em> and choose tag <code className="font-mono">{tag}</code>.</li>
            <li>
              Title: <code className="font-mono">{tag} — {title}</code>.
            </li>
            <li>
              Body: paste the <code className="font-mono">{tag}</code> section from{' '}
              <code className="font-mono">readme.md</code> (or let the
              workflow auto-extract it).
            </li>
            <li>Publish.</li>
          </ol>
        </section>

        <footer className="text-xs text-muted-foreground border-t border-border pt-6">
          This page is documentation. Source of truth for the build is CI
          (<code className="font-mono">.github/workflows/ci.yml</code>) and{' '}
          <code className="font-mono">bun run build</code>. Snapshot lives at{' '}
          <code className="font-mono">
            src/releases/v{release.version.replace(/\./g, '_')}.ts
          </code>.
        </footer>
      </div>
    </main>
  );
}
