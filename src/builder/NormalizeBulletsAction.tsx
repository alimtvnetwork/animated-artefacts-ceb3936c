/**
 * One-click "Normalize 3D bullets" slide-level action.
 *
 * Wraps the shared `normalize3DBullets` preprocessor (also used by the
 * deck loader at boot — see `src/slides/normalize3DBullets.ts`) so a
 * single click migrates every step on the currently-selected
 * `StepsChain3DSlide`:
 *
 *   - Splits each step's `description.body` into 1–6 keyword bullets
 *     (cap honoured per step, appended to existing bullets if present).
 *   - Removes the `body` field from the JSON entirely so exports are
 *     contract-clean.
 *   - Coerces the rare string-typed `description` legacy shape into the
 *     same path.
 *
 * Dormant unless the slide is `StepsChain3DSlide` *and* at least one step
 * still carries a non-empty `body`. Idempotent: re-clicking after a
 * successful migration is a no-op (the button hides itself).
 */
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { SlideSpec, SlideContent } from '../slides/types';
import { normalize3DBullets } from '../slides/normalize3DBullets';
import { splitProseToBullets } from '../slides/proseToBullets';

interface Step3DLite {
  label?: string;
  title?: string;
  description?: unknown;
}

/**
 * Per-step dry-run row for the preview panel.
 *  - `body`    : the source prose we'll split (already trimmed).
 *  - `bullets` : fragments that will be APPENDED to the existing bullets[]
 *                (capped per the 6-bullet contract — `dropped` counts what
 *                we had to throw away because the cap was reached first).
 *  - `existing`: bullets already present on the step before migration.
 *  - `dropped` : fragments lost to the cap (so the preview can warn).
 */
interface StepPreview {
  index: number;
  label: string;
  body: string;
  existing: string[];
  bullets: string[];
  dropped: number;
}

/**
 * Build a non-mutating preview of what `normalize3DBullets` would do to
 * each step. Mirrors the preprocessor's append-and-cap rules exactly so
 * the panel and the apply path can never disagree.
 */
function buildStepPreviews(slide: SlideSpec): StepPreview[] {
  if (slide.slideType !== 'StepsChain3DSlide') return [];
  const steps = (slide.content as { steps?: Step3DLite[] } | undefined)?.steps;
  if (!Array.isArray(steps)) return [];
  const out: StepPreview[] = [];
  steps.forEach((step, index) => {
    const desc = step.description;
    let body = '';
    let existing: string[] = [];
    if (typeof desc === 'string') {
      body = desc.trim();
    } else if (desc && typeof desc === 'object') {
      const d = desc as { body?: unknown; bullets?: unknown };
      if (typeof d.body === 'string') body = d.body.trim();
      if (Array.isArray(d.bullets)) {
        existing = d.bullets.filter((b): b is string => typeof b === 'string' && b.trim().length > 0);
      }
    }
    if (!body) return;
    const remaining = Math.max(0, 6 - existing.length);
    const allFragments = splitProseToBullets(body);
    const bullets = allFragments.slice(0, remaining);
    out.push({
      index,
      label: step.label || step.title || `Step ${index + 1}`,
      body,
      existing,
      bullets,
      dropped: Math.max(0, allFragments.length - bullets.length),
    });
  });
  return out;
}


export function NormalizeBulletsAction({
  slide,
  onApply,
}: {
  slide: SlideSpec;
  /** Receives the new `content` object after migration. */
  onApply: (next: SlideContent) => void;
}) {
  const previews = buildStepPreviews(slide);
  const legacyCount = previews.length;
  if (legacyCount === 0) return null;
  const totalBulletsToAdd = previews.reduce((n, p) => n + p.bullets.length, 0);
  const totalDropped = previews.reduce((n, p) => n + p.dropped, 0);

  const handleClick = () => {
    // Deep-clone the slide so the preprocessor's in-place mutation can't
    // touch the live draft state mid-render. We only ship the new
    // `content` back via `onApply` so the existing reducer pattern keeps
    // owning state transitions.
    const cloned = JSON.parse(JSON.stringify(slide)) as SlideSpec;
    const audit = normalize3DBullets([cloned], 'imported');

    const totalBullets = audit.reduce((sum, e) => sum + e.addedBullets.length, 0);
    const stepCount = audit.length;

    onApply(cloned.content);

    if (stepCount === 0) {
      // Edge case: legacyCount > 0 but every body had no usable fragments.
      // The preprocessor still stripped the empty bodies, so the JSON is
      // cleaner — surface that as info, not error.
      toast.info('Cleared empty legacy bodies', {
        description: `Removed ${legacyCount} unused description.body field${legacyCount === 1 ? '' : 's'}.`,
      });
      return;
    }

    toast.success('Normalized to bullets', {
      description: `Migrated ${stepCount} step${stepCount === 1 ? '' : 's'} (${totalBullets} bullet${totalBullets === 1 ? '' : 's'}) and removed every description.body from the JSON.`,
      duration: 6000,
    });
  };

  return (
    <section className="space-y-2 p-3 rounded-md border border-ember/40 bg-ember/10">
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-ember mt-0.5 shrink-0" aria-hidden="true" />
        <div className="space-y-1 min-w-0">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">
            Legacy prose detected
          </h3>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {legacyCount} step{legacyCount === 1 ? '' : 's'} on this slide still
            use <code className="font-mono">description.body</code>. Convert
            everything to <code className="font-mono">bullets[]</code> and strip
            the legacy field in one click.
          </p>
        </div>
      </div>

      {/*
        Dry-run preview — shows the EXACT bullets each step will receive
        before the user commits. Mirrors `normalize3DBullets` rules:
          - existing bullets[] entries are listed in muted gold so the
            author sees the migration is *append*, not replace;
          - new fragments are highlighted in cream;
          - any fragments dropped to honour the 6-cap surface as a warning.
        Scrolls when many steps are previewed so the panel doesn't push the
        rest of the editor off-screen.
       */}
      <div
        role="region"
        aria-label="Conversion preview"
        className="max-h-72 overflow-y-auto space-y-2 rounded border border-border/60 bg-surface-1/50 p-2"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Preview · {totalBulletsToAdd} new bullet{totalBulletsToAdd === 1 ? '' : 's'}
          {totalDropped > 0 && (
            <span className="text-ember"> · {totalDropped} dropped (6-cap)</span>
          )}
        </p>
        {previews.map((p) => (
          <div key={p.index} className="rounded border border-border/40 bg-surface-1/40 p-2 space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/80 truncate">
                Step {p.index + 1} · {p.label}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {p.existing.length}+{p.bullets.length}/6
              </span>
            </div>
            <pre className="text-[11px] font-mono whitespace-pre-wrap break-words max-h-16 overflow-y-auto rounded bg-ink/40 border border-border/30 p-1.5 text-muted-foreground/80">
              {p.body}
            </pre>
            <ol className="text-[11px] space-y-0.5 list-decimal list-inside">
              {p.existing.map((b, i) => (
                <li key={`e-${i}`} className="text-gold/55">
                  {b} <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">existing</span>
                </li>
              ))}
              {p.bullets.map((b, i) => (
                <li key={`n-${i}`} className="text-cream">
                  {b}
                </li>
              ))}
            </ol>
            {p.dropped > 0 && (
              <p className="text-[10.5px] text-ember leading-snug flex items-start gap-1">
                <span aria-hidden="true">⚠</span>
                <span>
                  {p.dropped} fragment{p.dropped === 1 ? '' : 's'} will be dropped to honour the
                  6-bullet cap. Trim the prose or remove existing bullets first.
                </span>
              </p>
            )}
            {p.bullets.length === 0 && p.existing.length >= 6 && (
              <p className="text-[10.5px] text-ember leading-snug">
                Bullets already at the 6-cap — body will be cleared but no fragments added.
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleClick}
        className="w-full px-3 py-2 text-xs font-semibold tracking-wide rounded border border-gold/60 text-gold hover:bg-gold/15 hover:border-gold transition-colors"
      >
        Auto-convert {legacyCount} step{legacyCount === 1 ? '' : 's'} → bullets[]
      </button>
    </section>
  );
}
