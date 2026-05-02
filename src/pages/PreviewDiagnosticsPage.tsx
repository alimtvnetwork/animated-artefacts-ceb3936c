import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  activeDeckSlug,
  availableDeckSlugs,
  allSlides,
  linearSlides,
  slideContractIssues,
  motionCollisionWarnings,
  validationMode,
  isImportedDeck,
  useSoftAssetFailures,
} from "@/slides/loader";
import type { CapturedError } from "@/components/RuntimeErrorOverlay";

/**
 * /preview-diagnostics (v0.191).
 *
 * Single-screen "is the preview healthy?" report. Combines:
 *   • Bundle status — Vite mode, base URL, dev/prod, build timestamp
 *     (when injected), and the active document <title>.
 *   • Loaded routes — every path declared in `App.tsx`'s <Routes>, with
 *     a quick-jump link for each.
 *   • Deck loader status — active deck slug, slide counts, validation
 *     mode, contract issues, motion warnings, soft-fail status.
 *   • Last rendering error — most recent CapturedError from the
 *     RuntimeErrorOverlay queue (correlation ID + stack + component
 *     stack), with a "Copy as report" action.
 *
 * Read-only; safe to leave linked from any developer surface.
 */

interface RouteRow {
  readonly path: string;
  readonly description: string;
}

// Mirrors the <Routes> tree in src/App.tsx. Kept hand-curated so the
// diagnostics view doesn't depend on react-router internals.
const ROUTE_TABLE: readonly RouteRow[] = [
  { path: "/", description: "Root → redirects to /1 (or ?slide=N)" },
  { path: "/1", description: "Canonical flat slide route /:slideNumber" },
  { path: "/slide/1", description: "Alias → redirects to /1" },
  { path: "/present", description: "Presenter view" },
  { path: "/builder", description: "Slide builder" },
  { path: "/style-guide", description: "Style guide & reference assets" },
  { path: "/settings", description: "Validation mode, alignment guides, etc." },
  { path: "/handout", description: "Print-friendly stacked handout" },
  { path: "/motion-demo", description: "Motion variety sanity check" },
  { path: "/click-reveal-audit", description: "Click-reveal dependency inspector" },
  { path: "/theme-preview", description: "Theme switcher preview (v0.186)" },
  { path: "/image-placement", description: "Auto image-placement inspector (v0.187)" },
  { path: "/preview-diagnostics", description: "← you are here" },
];

type ErrorKind = CapturedError["kind"];

const ALL_KINDS: readonly ErrorKind[] = [
  "blank-root",
  "window.error",
  "unhandledrejection",
  "react",
];

function getAllErrors(): readonly CapturedError[] {
  if (typeof window === "undefined") return [];
  const w = window as unknown as { __runtimeErrors__?: readonly CapturedError[] };
  return w.__runtimeErrors__ ?? [];
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

interface BootMark {
  readonly name: string;
  readonly at: number;
  readonly detail?: string;
}
interface BootStatus {
  readonly mainLoaded: boolean;
  readonly rendered: boolean;
  readonly watchdogFiredAt: number | null;
  readonly watchdogTimeoutMs: number;
  readonly elapsedMs: number;
  readonly rootEmpty: boolean;
  readonly overlayKind: "blank" | "error" | null;
  readonly marks: readonly BootMark[];
}

function getBootStatus(): BootStatus | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { __previewBoot__?: { getStatus?: () => BootStatus } };
  const fn = w.__previewBoot__?.getStatus;
  return typeof fn === "function" ? fn() : null;
}

function derivePhase(s: BootStatus | null): { label: string; tone: "ok" | "warn" | "info" | "err" } {
  if (!s) return { label: "Boot API unavailable", tone: "warn" };
  if (s.watchdogFiredAt) return { label: "Watchdog fired (blank-root)", tone: "err" };
  if (s.rendered) return { label: "React painted ✓", tone: "ok" };
  if (s.mainLoaded) return { label: "Bundle loaded · waiting for first paint", tone: "info" };
  return { label: "Booting · loading bundle", tone: "info" };
}

export default function PreviewDiagnosticsPage(): JSX.Element {
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [bootStatus, setBootStatus] = useState<BootStatus | null>(() => getBootStatus());
  const location = useLocation();

  useEffect(() => {
    document.title = "Preview diagnostics · Riseup Asia";
    const id = window.setInterval(() => {
      setNow(new Date());
      setBootStatus(getBootStatus());
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const [selectedKinds, setSelectedKinds] = useState<ReadonlySet<ErrorKind>>(
    () => new Set(ALL_KINDS),
  );

  const allErrors = useMemo(() => getAllErrors(), [tick]);
  const kindCounts = useMemo(() => {
    const counts: Record<ErrorKind, number> = {
      "blank-root": 0,
      "window.error": 0,
      unhandledrejection: 0,
      react: 0,
    };
    for (const e of allErrors) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    return counts;
  }, [allErrors]);
  const filteredErrors = useMemo(
    () => allErrors.filter((e) => selectedKinds.has(e.kind)),
    [allErrors, selectedKinds],
  );
  const lastError = filteredErrors.length > 0
    ? filteredErrors[filteredErrors.length - 1]
    : null;

  const toggleKind = (k: ErrorKind) => {
    setSelectedKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };
  const setOnlyKind = (k: ErrorKind) => setSelectedKinds(new Set([k]));
  const setAllKinds = () => setSelectedKinds(new Set(ALL_KINDS));
  const setNoKinds = () => setSelectedKinds(new Set());

  const bundle = useMemo(() => {
    const env = import.meta.env;
    const perf = typeof performance !== "undefined" ? performance : null;
    const nav =
      perf?.getEntriesByType?.("navigation")?.[0] as
        | PerformanceNavigationTiming
        | undefined;
    const memory = (performance as unknown as {
      memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
    }).memory;
    return {
      mode: env.MODE,
      dev: env.DEV,
      prod: env.PROD,
      base: env.BASE_URL,
      ssr: env.SSR ?? false,
      docTitle: document.title,
      url: window.location.href,
      userAgent: navigator.userAgent,
      domContentLoadedMs: nav
        ? Math.round(nav.domContentLoadedEventEnd - nav.startTime)
        : null,
      loadEventMs: nav && nav.loadEventEnd > 0
        ? Math.round(nav.loadEventEnd - nav.startTime)
        : null,
      heapUsed: memory ? formatBytes(memory.usedJSHeapSize) : "n/a",
      heapLimit: memory ? formatBytes(memory.jsHeapSizeLimit) : "n/a",
    };
  }, []);

  const deckStatus = useMemo(() => ({
    activeDeckSlug,
    availableDeckSlugs: [...availableDeckSlugs],
    totalSlides: allSlides.length,
    linearSlides: linearSlides.length,
    clickRevealSlides: allSlides.length - linearSlides.length,
    contractIssues: slideContractIssues.length,
    motionWarnings: motionCollisionWarnings.length,
    validationMode,
    isImportedDeck,
    softFail: useSoftAssetFailures,
  }), []);

  const handleCopyReport = () => {
    const lines: string[] = [
      "# Preview diagnostics report",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Bundle",
      ...Object.entries(bundle).map(([k, v]) => `  ${k}: ${String(v)}`),
      "",
      "## Deck",
      ...Object.entries(deckStatus).map(
        ([k, v]) => `  ${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`,
      ),
      "",
      "## Routes",
      ...ROUTE_TABLE.map((r) => `  ${r.path}  — ${r.description}`),
      "",
      `## Errors (filter: ${[...selectedKinds].join(", ") || "none"} · ${filteredErrors.length}/${allErrors.length})`,
      filteredErrors.length === 0
        ? "  (no errors match the current filter)"
        : filteredErrors
            .map(
              (e) =>
                `  ${e.correlationId} [${e.kind}] ${e.message}\n` +
                (e.source ? `  source: ${e.source}\n` : "") +
                (e.stack ? `\n${e.stack}\n` : "") +
                (e.componentStack ? `\nComponent stack:${e.componentStack}\n` : ""),
            )
            .join("\n---\n"),
    ];
    void navigator.clipboard?.writeText(lines.join("\n"));
  };

  const handleCopyFilteredErrors = () => {
    const body = filteredErrors.length === 0
      ? "(no errors match the current filter)"
      : filteredErrors
          .map(
            (e) =>
              `${e.correlationId} [${e.kind}] ${e.atIso ?? new Date(e.at).toISOString()}\n` +
              `${e.message}\n` +
              (e.source ? `source: ${e.source}\n` : "") +
              (e.url ? `url: ${e.url}\n` : "") +
              (e.stack ? `\n${e.stack}\n` : "") +
              (e.componentStack ? `\nComponent stack:${e.componentStack}\n` : ""),
          )
          .join("\n---\n");
    void navigator.clipboard?.writeText(body);
  };

  return (
    <main
      data-non-empty
      style={{
        minHeight: "100vh",
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
        padding: "48px 32px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="slide-title-display" style={{ margin: 0, fontSize: 32, letterSpacing: "0.01em" }}>
              Preview diagnostics
            </h1>
            <p style={{ margin: "6px 0 0", color: "hsl(var(--muted-foreground))", fontSize: 14 }}>
              Live snapshot of bundle, routes, deck loader, and last rendering error.
              Refreshed view: {now.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setTick((t) => t + 1)} style={btn}>
              Refresh
            </button>
            <button type="button" onClick={handleCopyReport} style={btn}>
              Copy report
            </button>
          </div>
        </header>

        <Section title="Live boot status">
          <BootStatusPanel status={bootStatus} route={location.pathname + location.search} />
        </Section>

        <Section title="Bundle status">
          <KeyValueGrid entries={Object.entries(bundle)} />
        </Section>

        <Section title="Deck loader">
          <KeyValueGrid entries={Object.entries(deckStatus).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") || "—" : v])} />
          {deckStatus.contractIssues > 0 && (
            <Callout tone="warn">
              {deckStatus.contractIssues} contract violation(s) — see ContractIssuesOverlay or run <code>bun run report:strict</code>.
            </Callout>
          )}
          {deckStatus.motionWarnings > 0 && (
            <Callout tone="info">
              {deckStatus.motionWarnings} motion-collision warning(s). Non-fatal but worth reviewing.
            </Callout>
          )}
        </Section>

        <Section title={`Routes (${ROUTE_TABLE.length})`}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Path</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Open</th>
              </tr>
            </thead>
            <tbody>
              {ROUTE_TABLE.map((r) => (
                <tr key={r.path}>
                  <td style={tdMonoStyle}>{r.path}</td>
                  <td style={tdStyle}>{r.description}</td>
                  <td style={tdStyle}>
                    <Link to={r.path} style={linkStyle}>↗</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title={`Errors (${filteredErrors.length}/${allErrors.length})`}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>
              Filter:
            </span>
            {ALL_KINDS.map((k) => {
              const active = selectedKinds.has(k);
              const count = kindCounts[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleKind(k)}
                  onDoubleClick={() => setOnlyKind(k)}
                  title={`Click to toggle. Double-click to show only "${k}".`}
                  style={{
                    ...chipBtn,
                    opacity: active ? 1 : 0.45,
                    borderColor: active ? "hsl(42 70% 55%)" : "hsl(var(--border))",
                    color: active ? "hsl(42 100% 96%)" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {k} <span style={{ opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
            <button type="button" onClick={setAllKinds} style={chipBtn}>All</button>
            <button type="button" onClick={setNoKinds} style={chipBtn}>None</button>
            <button type="button" onClick={handleCopyFilteredErrors} style={{ ...chipBtn, marginLeft: "auto" }}>
              Copy filtered ({filteredErrors.length})
            </button>
          </div>

          {filteredErrors.length === 0 ? (
            <Callout tone="ok">
              {allErrors.length === 0
                ? "No rendering errors captured in this session. ✓"
                : `No errors match the current filter (${allErrors.length} total captured).`}
            </Callout>
          ) : (
            <>
              <SubLabel>Most recent matching error</SubLabel>
              {lastError && (
                <div
                  style={{
                    background: "hsl(0 0% 7%)",
                    border: "1px solid hsl(14 80% 57% / 0.5)",
                    borderRadius: 8,
                    padding: 18,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <span style={correlationPill}>{lastError.correlationId}</span>
                    <span style={{ fontSize: 12, color: "hsl(42 25% 65%)" }}>
                      {lastError.kind} · {new Date(lastError.at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
                    {lastError.message}
                  </div>
                  {lastError.source && (
                    <div style={{ color: "hsl(42 25% 65%)", fontSize: 12, marginBottom: 12, fontFamily: "ui-monospace, Menlo, monospace" }}>
                      at {lastError.source}
                    </div>
                  )}
                  {lastError.stack && (
                    <>
                      <SubLabel>Stack trace</SubLabel>
                      <pre style={preStyle}>{lastError.stack}</pre>
                    </>
                  )}
                  {lastError.componentStack && (
                    <>
                      <SubLabel>Component stack</SubLabel>
                      <pre style={preStyle}>{lastError.componentStack.trim()}</pre>
                    </>
                  )}
                </div>
              )}
              {filteredErrors.length > 1 && (
                <>
                  <SubLabel>Earlier matching errors ({filteredErrors.length - 1})</SubLabel>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {filteredErrors.slice(0, -1).reverse().map((e) => (
                      <li
                        key={e.id}
                        style={{
                          background: "hsl(0 0% 5%)",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 6,
                          padding: "8px 12px",
                          fontSize: 12,
                          fontFamily: "ui-monospace, Menlo, monospace",
                          display: "flex",
                          gap: 10,
                          alignItems: "baseline",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={correlationPill}>{e.correlationId}</span>
                        <span style={{ color: "hsl(42 25% 65%)" }}>{e.kind}</span>
                        <span style={{ color: "hsl(var(--foreground))", flex: 1, wordBreak: "break-word" }}>{e.message}</span>
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>{new Date(e.at).toLocaleTimeString()}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </Section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────── small primitives ───────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        className="slide-eyebrow"
        style={{
          margin: "0 0 12px",
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: 10,
          padding: 18,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function KeyValueGrid({ entries }: { entries: ReadonlyArray<[string, unknown]> }) {
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(160px, 220px) 1fr",
        gap: "8px 24px",
        margin: 0,
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt style={{ color: "hsl(var(--muted-foreground))", fontFamily: "ui-monospace, Menlo, monospace" }}>{k}</dt>
          <dd style={{ margin: 0, fontFamily: "ui-monospace, Menlo, monospace", wordBreak: "break-all" }}>
            {v === null || v === undefined || v === "" ? (
              <span style={{ color: "hsl(var(--muted-foreground))" }}>—</span>
            ) : (
              String(v)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Callout({ tone, children }: { tone: "ok" | "warn" | "info"; children: React.ReactNode }) {
  const accent =
    tone === "ok" ? "hsl(140 50% 50%)" : tone === "warn" ? "hsl(38 70% 55%)" : "hsl(200 70% 60%)";
  return (
    <div
      style={{
        marginTop: 14,
        padding: "10px 14px",
        background: "hsl(0 0% 6% / 0.4)",
        border: `1px solid ${accent}`,
        borderRadius: 6,
        fontSize: 13,
        color: "hsl(var(--foreground))",
      }}
    >
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: "12px 0 6px",
        color: "hsl(42 25% 60%)",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  padding: "8px 14px",
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
};

const chipBtn: React.CSSProperties = {
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 11,
  fontFamily: "ui-monospace, Menlo, monospace",
  cursor: "pointer",
  letterSpacing: "0.04em",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};
const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "1px solid hsl(var(--border))",
  color: "hsl(var(--muted-foreground))",
  fontWeight: 500,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid hsl(var(--border) / 0.5)",
};
const tdMonoStyle: React.CSSProperties = {
  ...tdStyle,
  fontFamily: "ui-monospace, Menlo, monospace",
};
const linkStyle: React.CSSProperties = {
  color: "hsl(42 70% 55%)",
  textDecoration: "none",
  fontSize: 16,
};
const preStyle: React.CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  background: "hsl(0 0% 4%)",
  color: "hsl(42 25% 80%)",
  padding: 12,
  borderRadius: 4,
  fontSize: 12,
  lineHeight: 1.5,
  maxHeight: 320,
  overflow: "auto",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
const correlationPill: React.CSSProperties = {
  background: "hsl(0 0% 4%)",
  color: "hsl(42 100% 96%)",
  border: "1px solid hsl(42 25% 35%)",
  borderRadius: 4,
  padding: "2px 8px",
  fontFamily: "ui-monospace, Menlo, monospace",
  fontSize: 11,
  letterSpacing: "0.06em",
};

function BootStatusPanel({ status, route }: { status: BootStatus | null; route: string }) {
  const phase = derivePhase(status);
  const toneColor =
    phase.tone === "ok" ? "hsl(140 60% 55%)"
    : phase.tone === "err" ? "hsl(14 80% 60%)"
    : phase.tone === "warn" ? "hsl(42 70% 55%)"
    : "hsl(200 70% 65%)";
  const elapsed = status ? `${status.elapsedMs} ms` : "—";
  const watchdog = status
    ? status.watchdogFiredAt
      ? `fired @ ${new Date(status.watchdogFiredAt).toLocaleTimeString()}`
      : status.rendered
        ? "stood down (React painted)"
        : `armed · ${Math.max(0, status.watchdogTimeoutMs - status.elapsedMs)} ms remaining`
    : "—";

  const entries: Array<[string, unknown]> = [
    ["phase", phase.label],
    ["mountedRoute", route],
    ["elapsedSinceBoot", elapsed],
    ["mainLoaded", status?.mainLoaded ?? "—"],
    ["reactPainted", status?.rendered ?? "—"],
    ["rootEmpty", status?.rootEmpty ?? "—"],
    ["overlayKind", status?.overlayKind ?? "none"],
    ["watchdog", watchdog],
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          padding: "8px 12px",
          borderRadius: 6,
          border: `1px solid ${toneColor}`,
          background: "hsl(0 0% 5%)",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: toneColor,
            boxShadow: `0 0 8px ${toneColor}`,
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{phase.label}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "hsl(var(--muted-foreground))", fontFamily: "ui-monospace, Menlo, monospace" }}>
          updates every 500 ms
        </span>
      </div>
      <KeyValueGrid entries={entries} />
      {status && status.marks.length > 0 && (
        <>
          <div style={{ height: 12 }} />
          <SubLabel>Boot timeline ({status.marks.length} marks)</SubLabel>
          <pre style={preStyle}>
            {status.marks
              .map((m) => `${String(m.at).padStart(5, " ")} ms  ${m.name}${m.detail ? ` — ${m.detail}` : ""}`)
              .join("\n")}
          </pre>
        </>
      )}
    </div>
  );
}
