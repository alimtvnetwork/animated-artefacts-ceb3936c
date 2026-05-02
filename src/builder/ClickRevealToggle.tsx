/**
 * ClickRevealToggle — per-element editor block for the generic click-reveal
 * contract (`ClickRevealTrigger` + the legacy `CapsuleSpec.clickRevealSlide`).
 *
 * The deck supports per-element opt-in click-reveals (capsules, steps,
 * hotspots) but the builder previously had no clean way to enable or disable
 * them per item. This component is the missing toggle:
 *
 *   ┌─ Click reveal ─────────── [○ off ] ┐
 *   │ Reveal target  [ #4 — Strategy ▾ ] │
 *   │ Hint: shows ↗ on the element …     │
 *   └────────────────────────────────────┘
 *
 * # Behavior
 *   - Switch OFF  → writes `undefined` to the host's reveal field.
 *   - Switch ON   → seeds the field with the first available slide number,
 *                   then surfaces a target-slide dropdown (excludes the
 *                   current slide; lists hidden ClickRevealSlides distinctly).
 *
 * Live preview kicks in immediately because the host's `onChange` writes
 * straight back into the draft deck — the same `SlidePreview` that the
 * builder shows on the right re-renders on the next tick.
 *
 * # Props
 *   - `field`        — which key on the host element holds the slide #.
 *                      `'clickRevealSlide'` for `CapsuleSpec` (legacy field
 *                      name kept for back-compat), `'revealSlide'` for
 *                      `StepSpec` / `HotspotSpec` (modern `ClickRevealTrigger`).
 *   - `value`        — current slide number (or undefined when disabled).
 *   - `onChange`     — called with the new value (or undefined to disable).
 *   - `slideOptions` — already-built `<select>` options from the parent.
 *   - `helpEnabled`  — small note explaining the affordance once the toggle
 *                      is on (e.g. "Capsule shows a gold ring + ↗ glyph").
 */
import { Switch } from '@/components/ui/switch';
import { Field, SelectField } from './FormPrimitives';

export interface ClickRevealToggleProps {
  /** Current target slide number, or undefined when reveal is disabled. */
  value: number | undefined;
  /** Apply the new state. `undefined` means "turn click-reveal off". */
  onChange: (next: number | undefined) => void;
  /**
   * Pre-built target-slide options. The host owns this so it can filter out
   * the current slide and decide how to render hidden / linear / disabled
   * targets.
   */
  slideOptions: ReadonlyArray<{ value: string; label: string }>;
  /** Optional override for the section label. */
  label?: string;
  /** Help text shown once the toggle is enabled. */
  helpEnabled?: string;
  /** Help text shown when the toggle is off. */
  helpDisabled?: string;
}

export function ClickRevealToggle({
  value,
  onChange,
  slideOptions,
  label = 'Click reveal',
  helpEnabled = 'Clicking this element navigates the deck to the target slide.',
  helpDisabled = 'Off — element renders as plain content with no click action.',
}: ClickRevealToggleProps) {
  const enabled = typeof value === 'number';
  const firstOption = slideOptions[0]?.value;

  const handleToggle = (next: boolean) => {
    if (!next) {
      onChange(undefined);
      return;
    }
    // Seed with the first available slide so the user gets an immediate
    // working preview, then they can refine via the dropdown below.
    if (typeof value === 'number') return;
    if (firstOption) onChange(Number(firstOption));
    else onChange(undefined);
  };

  return (
    <div className="space-y-2 p-2 mt-1 border border-border/60 rounded-md bg-surface-1/30">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/80">
          {label}
        </p>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          aria-label={`Toggle ${label}`}
          // Disable the switch when there are no candidate slides to target;
          // an enabled switch with no targets would be a confusing no-op.
          disabled={!enabled && slideOptions.length === 0}
        />
      </div>

      {enabled ? (
        <>
          <SelectField
            label="Reveal target"
            value={String(value)}
            options={slideOptions.length > 0 ? slideOptions : [{ value: '', label: '— No targets —' }]}
            onChange={(v) => onChange(v ? Number(v) : undefined)}
          />
          <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
            {helpEnabled}
          </p>
        </>
      ) : (
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
          {slideOptions.length === 0
            ? 'Add another slide first to use as a reveal target.'
            : helpDisabled}
        </p>
      )}
    </div>
  );
}

/** Build the standard target-slide options list for a click-reveal picker. */
export function buildSlideOptions(
  allSlides: ReadonlyArray<{ slideNumber: number; slideName?: string; slideType?: string; isClickReveal?: boolean; content?: { title?: string } }>,
  currentSlideNumber: number,
): Array<{ value: string; label: string }> {
  return allSlides
    .filter((s) => s.slideNumber !== currentSlideNumber)
    .map((s) => ({
      value: String(s.slideNumber),
      label: `#${s.slideNumber} — ${s.content?.title ?? s.slideName ?? s.slideType ?? 'Untitled'}${
        s.isClickReveal ? ' (hidden)' : ''
      }`,
    }));
}
