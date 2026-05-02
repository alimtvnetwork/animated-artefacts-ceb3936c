/**
 * /release — index page listing every registered release snapshot.
 *
 * Lists each version with tag, frozen status, release date, build status,
 * and a quick link to its `/release/:version` checklist. The latest is
 * highlighted. Unknown / future versions surface here automatically the
 * moment a new file is registered in `src/releases/index.ts`.
 *
 * Theming uses semantic tokens only (Noir & Gold via `--gold`, `--ember`,
 * `--cream`, `--card`, `--border`, `--muted-foreground`).
 */
import { Link } from 'react-router-dom';
import { RELEASES, getLatestRelease } from '@/releases';

function FrozenChip({ frozen }: { frozen: boolean }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase"
      style={{
        background: frozen ? 'hsl(var(--gold) / 0.18)' : 'hsl(var(--ember) / 0.18)',
        color: frozen ? 'hsl(var(--gold))' : 'hsl(var(--ember))',
      }}
    >
      {frozen ? '✓ frozen' : '· draft'}
    </span>
  );
}

function BuildChip({ status }: { status: 'pass' | 'fail' | 'unknown' }) {
  const map = {
    pass: { label: '✓ build pass', bg: 'hsl(var(--gold) / 0.18)', fg: 'hsl(var(--gold))' },
    fail: { label: '✗ build fail', bg: 'hsl(var(--destructive) / 0.18)', fg: 'hsl(var(--destructive))' },
    unknown: { label: '? build', bg: 'hsl(var(--muted))', fg: 'hsl(var(--muted-foreground))' },
  } as const;
  const c = map[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  );
}

export default function ReleaseIndexPage() {
  const latest = getLatestRelease();
  // Newest-first by releasedAt (ISO sorts lexicographically)
  const sorted = [...RELEASES].sort((a, b) => (a.releasedAt < b.releasedAt ? 1 : -1));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-10">
          <p
            className="text-xs font-medium tracking-[0.2em] uppercase mb-2"
            style={{ color: 'hsl(var(--gold))' }}
          >
            Releases
          </p>
          <h1 className="text-4xl font-bold tracking-tight mb-3">All versions</h1>
          <p className="text-muted-foreground">
            Each release is an immutable snapshot of what shipped — checklist, build status, and the
            git tag command used. Click a version to view its frozen checklist.
          </p>
        </header>

        <ul className="space-y-3">
          {sorted.map((r) => {
            const isLatest = r.tag === latest.tag;
            return (
              <li key={r.tag}>
                <Link
                  to={`/release/${r.tag}`}
                  className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-[hsl(var(--gold)/0.6)]"
                >
                  <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-mono text-lg font-semibold"
                        style={{ color: 'hsl(var(--cream))' }}
                      >
                        {r.tag}
                      </span>
                      {isLatest && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase"
                          style={{
                            background: 'hsl(var(--gold) / 0.22)',
                            color: 'hsl(var(--gold))',
                          }}
                        >
                          ★ latest
                        </span>
                      )}
                      <FrozenChip frozen={r.frozen} />
                      <BuildChip status={r.build.status} />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {r.releasedAt}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold mb-1 group-hover:text-[hsl(var(--gold))] transition-colors">
                    {r.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.summary}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {r.checklist.filter((c) => c.status === 'done').length}/{r.checklist.length}{' '}
                      checklist items done
                    </span>
                    <span aria-hidden>·</span>
                    <span className="group-hover:text-[hsl(var(--gold))] transition-colors">
                      View checklist →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {sorted.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No releases registered yet. Add one in <code>src/releases/</code>.
          </div>
        )}
      </div>
    </div>
  );
}
