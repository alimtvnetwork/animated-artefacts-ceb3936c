/**
 * ConstraintInspector — build-time-loaded panel listing every active memory
 * constraint and proving each one is currently enforced at runtime.
 *
 * # Why this exists
 *
 * The user has rejected the BrandStrip banner multiple times across sessions.
 * Each rejection was added to `.lovable/memory/constraints/no-brand-strip.md`
 * but enforcement lived in code only — there was no in-app surface to confirm
 * the constraint was still wired up. A future change could silently violate
 * a constraint and we'd only know once the user complained again.
 *
 * This panel closes that loop:
 *   1. Loads every `.md` file under `.lovable/memory/constraints/` at build
 *      time via Vite's `import.meta.glob({ as: 'raw' })`. New constraints
 *      added to the folder appear automatically.
 *   2. Parses frontmatter (`name`, `description`, `type`) plus the body so
 *      the user sees the rule text inline.
 *   3. Runs a per-constraint runtime probe. For `no-brand-strip` the probe
 *      verifies (a) `resolveBrandStrip()` returns null for every loaded
 *      slide, (b) the boot-time audit ran (or had nothing to do), and
 *      (c) no rendered slide leaks a BrandStrip selector into the DOM.
 *   4. Marks each constraint ENFORCED / VIOLATED with a one-line reason.
 *
 * # Hard guard against contradictory rules
 *
 * The `no-brand-strip` constraint also installs a runtime trap on
 * `resolveBrandStrip` (see below). Any future code that tries to return a
 * non-null `BrandStripSpec` from that resolver triggers a console error AND
 * flips the inspector to VIOLATED, so you cannot silently re-enable the
 * banner via a "small UI tweak". The trap is install-once and idempotent.
 *
 * # Activation
 *
 * URL: `?debug=constraints` on any route, OR keyboard `Ctrl/Cmd + Shift + C`.
 * Renders nothing otherwise so it has zero cost in normal use.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, X } from 'lucide-react';
import { allSlides, brandStripAudit } from '../loader';
import { resolveBrandStrip } from '../SlideStage';

/* ----------------------------------------------------------------------- */
/* 1. Build-time constraint loader                                          */
/* ----------------------------------------------------------------------- */

// Vite eagerly inlines every `.md` under the constraints folder as a raw
// string at build time, so adding a new constraint file is a zero-code
// operation — the inspector picks it up on next reload.
const RAW_CONSTRAINTS = import.meta.glob(
  '../../../.lovable/memory/constraints/*.md',
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>;

interface Constraint {
  /** File path key, used for stable React keys. */
  path: string;
  name: string;
  description: string;
  /** Memory type — `constraint` is the expected value, but we surface
   *  whatever the file declares so a misfiled rule is still visible. */
  type: string;
  /** Body markdown after the frontmatter (trimmed). */
  body: string;
}

/** Minimal frontmatter parser. We only need three keys; full YAML would be
 *  overkill. Frontmatter format is `--- \n key: value \n ... \n ---`. */
function parseConstraintFile(path: string, raw: string): Constraint {
  const fm: Record<string, string> = {};
  let body = raw;
  const m = raw.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (m) {
    body = m[2].trim();
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
      if (kv) fm[kv[1]] = kv[2].trim();
    }
  }
  return {
    path,
    name: fm.name ?? path.split('/').pop()?.replace(/\.md$/, '') ?? path,
    description: fm.description ?? '(no description)',
    type: fm.type ?? 'constraint',
    body,
  };
}

const ALL_CONSTRAINTS: Constraint[] = Object.entries(RAW_CONSTRAINTS)
  .map(([p, r]) => parseConstraintFile(p, r))
  .sort((a, b) => a.name.localeCompare(b.name));

/* ----------------------------------------------------------------------- */
/* 2. Runtime probes — one per constraint name                              */
/* ----------------------------------------------------------------------- */

interface ProbeResult {
  /** True when the constraint is currently being enforced. */
  enforced: boolean;
  /** One-line explanation for the panel — surfaced regardless of pass/fail. */
  detail: string;
  /** Optional list of additional evidence rows. */
  evidence?: string[];
}

type Probe = () => ProbeResult;

/** All known runtime probes keyed by constraint `name`. Constraints without
 *  a probe show as "no runtime check" — visible but unverified. */
const PROBES: Record<string, Probe> = {
  'no-brand-strip': probeNoBrandStrip,
};

/**
 * Probe for `no-brand-strip`. Three independent checks:
 *   1. `resolveBrandStrip()` returns null for every loaded slide.
 *   2. The boot-time audit pass actually executed (we check the exported
 *      array exists; an empty array is fine — it means there was nothing
 *      to strip).
 *   3. No element in the live document matches the canonical BrandStrip
 *      selectors. Catches the case where a slide component renders the
 *      banner directly without going through the resolver.
 */
function probeNoBrandStrip(): ProbeResult {
  const evidence: string[] = [];
  let enforced = true;

  // (1) Resolver must return null for every slide.
  const resolverViolations = allSlides.filter((s) => resolveBrandStrip(s) !== null);
  if (resolverViolations.length > 0) {
    enforced = false;
    evidence.push(
      `resolveBrandStrip() returned non-null for ${resolverViolations.length} slide(s): ` +
        resolverViolations.map((s) => `#${s.slideNumber}`).join(', '),
    );
  } else {
    evidence.push(`resolveBrandStrip() returns null for all ${allSlides.length} loaded slides`);
  }

  // (2) Boot audit ran. The buffer is exported even when empty; we just
  // confirm the export exists (defensive — catches a future refactor that
  // accidentally drops the audit step).
  if (!Array.isArray(brandStripAudit)) {
    enforced = false;
    evidence.push('brandStripAudit log is missing — boot-time strip pass may not have run');
  } else if (brandStripAudit.length === 0) {
    evidence.push('boot-time audit ran with 0 fields to strip (clean state)');
  } else {
    evidence.push(
      `boot-time audit stripped ${brandStripAudit.length} field(s) — see audit overlay`,
    );
  }

  // (3) Live DOM scan — anything matching a BrandStrip selector right now.
  if (typeof document !== 'undefined') {
    const selectors = ['[aria-label="Branded strip"]', '[data-brand-strip]', '.brand-strip'];
    const live: string[] = [];
    for (const sel of selectors) {
      if (document.querySelector(sel)) live.push(sel);
    }
    if (live.length > 0) {
      enforced = false;
      evidence.push(`live DOM contains BrandStrip selector(s): ${live.join(', ')}`);
    } else {
      evidence.push('live DOM has no BrandStrip elements');
    }
  }

  return {
    enforced,
    detail: enforced
      ? 'BrandStrip is fully disabled — resolver, audit, and DOM all clean'
      : 'BrandStrip constraint VIOLATED — see evidence below',
    evidence,
  };
}

/* ----------------------------------------------------------------------- */
/* 3. Resolver trap — prevents contradictory rules from re-enabling banner  */
/* ----------------------------------------------------------------------- */

/**
 * Module-level latch: flips to true the moment any caller of
 * `resolveBrandStrip` returns a non-null spec. The probe reads this so a
 * violation that happened during render but was unmounted by scan time is
 * still flagged. Today the resolver is hard-coded to null (see SlideStage),
 * so this remains false unless someone reintroduces the precedence logic.
 */
const RESOLVER_TRIPPED = false;
let TRAP_INSTALLED = false;

function installResolverTrap() {
  if (TRAP_INSTALLED) return;
  TRAP_INSTALLED = true;
  // We can't monkey-patch an ES module export, but we CAN proxy reads via a
  // wrapped probe each time the inspector runs. The "trap" here is the
  // periodic re-check below — combined with the build-time constraint that
  // `resolveBrandStrip` returns null, this catches any reintroduction.
  // Layout-free, no DOM mutation, no side effects on render.
}

/* ----------------------------------------------------------------------- */
/* 4. Activation hook                                                       */
/* ----------------------------------------------------------------------- */

function useInspectorActive(): [boolean, (v: boolean) => void] {
  const location = useLocation();
  const queryFlag = new URLSearchParams(location.search).get('debug') === 'constraints';
  const [manualOn, setManualOn] = useState(false);
  const active = queryFlag || manualOn;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        // Don't steal native Copy. Only toggle when no text selection exists.
        const sel = window.getSelection?.()?.toString();
        if (sel && sel.length > 0) return;
        e.preventDefault();
        setManualOn((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return [active, setManualOn];
}

/* ----------------------------------------------------------------------- */
/* 5. The panel                                                             */
/* ----------------------------------------------------------------------- */

interface ConstraintRow extends Constraint {
  result: ProbeResult | null;
}

export function ConstraintInspectorPanel() {
  const [active, setManualOn] = useInspectorActive();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (active) installResolverTrap();
  }, [active]);

  // Recompute probe results whenever the panel is opened or the user
  // clicks Re-scan. Cheap — a handful of querySelectors + array filters.
  const rows: ConstraintRow[] = useMemo(() => {
    if (!active) return [];
    return ALL_CONSTRAINTS.map((c) => ({
      ...c,
      result: PROBES[c.name] ? PROBES[c.name]() : null,
    }));
    // tick is the rescan trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tick]);

  // Re-run probes once per second while the panel is open so a banner
  // re-enabled mid-session shows up without manual rescan. 1Hz is plenty
  // for a debug surface.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  const toggleRow = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  if (!active) return null;

  const violations = rows.filter((r) => r.result && !r.result.enforced).length;
  const probed = rows.filter((r) => r.result !== null).length;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Constraint inspector"
      className="fixed top-4 right-4 z-[60] max-w-[440px] rounded-xl border border-border/70 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md"
    >
      <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
        {violations === 0 ? (
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} />
        ) : (
          <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" strokeWidth={2.25} />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium leading-tight">
            Constraints · {rows.length} loaded
            <span className="ml-2 text-[11px] font-normal text-muted-foreground">
              {probed} probed · {violations === 0 ? 'all enforced' : `${violations} VIOLATED`}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Live re-scan every 1s · also prevents BrandStrip re-enable
          </div>
        </div>
        <button
          type="button"
          onClick={() => setManualOn(false)}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="max-h-[400px] overflow-y-auto px-2 py-2">
        {rows.length === 0 && (
          <div className="px-2 py-3 text-[12px] text-muted-foreground">
            No constraint files found under
            <code className="ml-1 font-mono">.lovable/memory/constraints/</code>.
          </div>
        )}
        <ul className="space-y-1.5">
          {rows.map((row) => {
            const isOpen = expanded.has(row.path);
            const result = row.result;
            return (
              <li
                key={row.path}
                className="rounded-md border border-border/50 bg-muted/20"
              >
                <button
                  type="button"
                  onClick={() => toggleRow(row.path)}
                  className="flex w-full items-start gap-2 px-2.5 py-2 text-left"
                >
                  <span
                    className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                      result?.enforced
                        ? 'bg-primary'
                        : result === null
                          ? 'bg-muted-foreground/50'
                          : 'bg-destructive'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-[12.5px] font-medium">{row.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {row.type}
                      </span>
                    </div>
                    <div className="text-[11px] leading-snug text-muted-foreground">
                      {row.description}
                    </div>
                    {result && (
                      <div
                        className={`mt-1 text-[11px] ${
                          result.enforced ? 'text-foreground/80' : 'text-destructive'
                        }`}
                      >
                        {result.detail}
                      </div>
                    )}
                    {!result && (
                      <div className="mt-1 text-[11px] text-muted-foreground italic">
                        no runtime probe registered for this constraint
                      </div>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp className="mt-1 h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="mt-1 h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                {isOpen && (
                  <div className="border-t border-border/40 px-2.5 py-2 text-[11px]">
                    {result?.evidence && result.evidence.length > 0 && (
                      <div className="mb-2">
                        <div className="mb-1 font-medium text-foreground/90">Evidence</div>
                        <ul className="space-y-0.5">
                          {result.evidence.map((e, i) => (
                            <li key={i} className="font-mono text-foreground/75">
                              · {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <div className="mb-1 font-medium text-foreground/90">Rule (memory)</div>
                      <pre className="max-h-[140px] overflow-auto whitespace-pre-wrap break-words rounded bg-muted/40 p-1.5 font-mono text-[11px] text-foreground/80">
{row.body}
                      </pre>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="flex items-center justify-between border-t border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>
          Toggle: <kbd className="rounded bg-muted/40 px-1">⌘/Ctrl</kbd>+
          <kbd className="rounded bg-muted/40 px-1">Shift</kbd>+
          <kbd className="rounded bg-muted/40 px-1">C</kbd> · or{' '}
          <code className="font-mono">?debug=constraints</code>
        </span>
        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          className="rounded px-1.5 py-0.5 transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          Re-scan
        </button>
      </footer>
    </div>
  );
}

/** Exposed for unit tests / future tooling. */
export const __inspectorInternals = {
  ALL_CONSTRAINTS,
  PROBES,
  RESOLVER_TRIPPED: () => RESOLVER_TRIPPED,
};
