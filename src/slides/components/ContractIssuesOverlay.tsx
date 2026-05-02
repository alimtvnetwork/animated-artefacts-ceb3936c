/**
 * ContractIssuesOverlay — on-screen list of every per-slide contract
 * violation captured at boot, so the author can fix a broken deck without
 * digging through console logs.
 *
 * # What it shows
 * Reads the frozen `slideContractIssues` array exported by `loader.ts`.
 * Each entry already carries `slideNumber`, `slideName`, `slideType`, the
 * dotted `path` inside the slide where validation failed (e.g.
 * `content.steps.0.title`), and the human-readable `message` from zod.
 *
 * # Why it exists
 * `assertValidSlides` (the strict variant) is reserved for tests + CI so
 * the deck never wedges on a single bad slide at runtime. The lenient
 * `validateSlide` path used in `loader.ts` only console.warns the
 * aggregated count — which is invisible to anyone not looking at devtools.
 * This overlay is the visible surface of those warnings, grouped by slide
 * and copy-friendly.
 *
 * # Behavior
 * - Renders nothing when there are zero issues (steady state).
 * - Bottom-LEFT to avoid colliding with `BrandStripAuditOverlay`
 *   (bottom-right) and the controller (bottom-center).
 * - Click header to expand / collapse the per-issue list.
 * - One-click "Copy report" puts a Markdown-friendly version on the
 *   clipboard so the user can paste it into a bug ticket / chat with me.
 * - "Dismiss" hides for the session via sessionStorage.
 * - Hidden during print / export via `data-print-hide="true"` so the
 *   overlay never sneaks into a PDF or screenshot capture.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Clipboard, X } from 'lucide-react';
import { slideContractIssues, validationMode, motionCollisionWarnings } from '../loader';
import type { SlideValidationIssue } from '../contracts';
import type { MotionCollisionWarning } from '../motionCollisions';

const DISMISS_KEY = 'riseup.contractIssues.dismissed.v1';

/**
 * Adapter — coerce a `MotionCollisionWarning` into the same row shape
 * we use for `SlideValidationIssue` so the existing grouped renderer
 * doesn't need a second branch. Kept inline (not in motionCollisions.ts)
 * because the shape is overlay-specific UI glue, not a domain concern.
 */
function motionWarningAsIssue(w: MotionCollisionWarning): SlideValidationIssue {
  return {
    slideNumber: w.slideNumber,
    slideName: w.slideName,
    slideType: w.slideType,
    path: w.path,
    message: w.message,
  };
}

export function ContractIssuesOverlay() {
  const initiallyDismissed =
    typeof window !== 'undefined' && window.sessionStorage.getItem(DISMISS_KEY) === '1';
  const [dismissed, setDismissed] = useState(initiallyDismissed);
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  /** Motion warnings are merged into the same list so the overlay reads
   *  as one "things to fix" surface. They sit after contract issues so
   *  the more severe (schema) failures appear first within each slide. */
  const allIssues = useMemo<SlideValidationIssue[]>(
    () => [...slideContractIssues, ...motionCollisionWarnings.map(motionWarningAsIssue)],
    [],
  );

  /** Group issues by slide so the panel reads "Slide #3 — 2 issues" with
   *  the per-path failures nested underneath, instead of a flat 14-row list
   *  that obscures which slide each row belongs to. */
  const grouped = useMemo(() => {
    const map = new Map<string, { header: string; items: SlideValidationIssue[] }>();
    for (const issue of allIssues) {
      const key = `${issue.slideNumber ?? '?'}::${issue.slideName ?? '?'}::${issue.slideType ?? '?'}`;
      const header = `Slide #${issue.slideNumber ?? '?'} — ${issue.slideName ?? 'unnamed'} (${
        issue.slideType ?? 'unknown type'
      })`;
      if (!map.has(key)) map.set(key, { header, items: [] });
      map.get(key)!.items.push(issue);
    }
    return Array.from(map.values());
  }, [allIssues]);

  if (allIssues.length === 0) return null;
  if (dismissed) return null;

  const handleDismiss = () => {
    window.sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleCopy = async () => {
    // Markdown so the user can paste into the same chat thread that helped
    // them author the deck and get fixes inline.
    const md = [
      `### Contract issues (${allIssues.length})`,
      '',
      ...grouped.flatMap((g) => [
        `**${g.header}**`,
        ...g.items.map((i) => `- \`${i.path}\` — ${i.message}`),
        '',
      ]),
    ].join('\n');
    try {
      await navigator.clipboard?.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked (insecure context / permission) — silently ignore */
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label="Slide contract issues"
      data-print-hide="true"
      className="fixed bottom-4 left-4 z-[60] max-w-[420px] rounded-xl border border-destructive/60 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md"
    >
      {/* Header — click anywhere to expand / collapse */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" strokeWidth={2.25} />
        <span className="flex-1 text-[13px] font-medium leading-tight">
          Contract issues · {allIssues.length}
          <span className="ml-2 text-[11px] font-normal text-muted-foreground">
            across {grouped.length} slide{grouped.length === 1 ? '' : 's'}
          </span>
          {/* Active validation mode badge — makes it obvious whether the
              deck would have been rejected on `'strict'` boot. In strict
              mode the loader throws before this overlay can mount, so a
              `'strict'` badge here is impossible — but we render the mode
              anyway so authors can confirm the setting they're in. */}
          <span
            className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
              validationMode === 'strict'
                ? 'bg-destructive/20 text-destructive'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {validationMode}
          </span>
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Body — per-slide grouped issue list. Scrolls when long. */}
      {expanded && (
        <div className="border-t border-border/50 px-3 py-2.5 space-y-3 max-h-[42vh] overflow-y-auto">
          {grouped.map((g) => (
            <div key={g.header} className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/85">
                {g.header}
              </p>
              <ul className="space-y-1">
                {g.items.map((i, idx) => (
                  <li
                    key={`${g.header}-${idx}`}
                    className="text-[11px] leading-snug text-muted-foreground"
                  >
                    {/* Dotted path = exact JSON pointer the author needs to
                        edit. Render it monospace + colored so it's instantly
                        scannable against the surrounding prose. */}
                    <code className="font-mono text-destructive">{i.path}</code>{' '}
                    <span className="text-foreground/80">— {i.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition"
            >
              <Clipboard className="h-3 w-3" />
              {copied ? 'Copied!' : 'Copy report'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
            >
              <X className="h-3 w-3" /> Dismiss for session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
