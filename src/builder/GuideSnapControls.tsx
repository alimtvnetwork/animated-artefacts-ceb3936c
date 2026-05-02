/**
 * GuideSnapControls — reusable "snap to guide" panel for any number-valued
 * editor field. Originally extracted from `ContentFieldEditor`'s per-step
 * `StepSnapControls` (spec 40, v0.76 left / v0.86 right).
 *
 * What it owns:
 *   - The visual chrome (label row, three target buttons, numeric input,
 *     reset button, helper text).
 *   - Reading live `useGuidePositions()` so callers don't have to.
 *   - Clamping the value to `[0, max]` on input.
 *
 * What the CALLER provides:
 *   - The current numeric value + `onChange`.
 *   - A `buildTargets(guides)` function that returns 1–3 snap targets given
 *     the current live guide positions. This is the extension point that
 *     lets other editors (CTAs, labels, future axes) reuse the panel with
 *     bespoke math without forking the UI.
 *   - Optional label / icon / help text overrides.
 *
 * The original `StepSnapControls` (left/right step row) now sits on top of
 * this component via the `stepRowSnapTargets()` preset helper exported
 * below. See spec/slides/40-step-snap-to-guides.md.
 */
import { AlignLeft, AlignRight, AlignVerticalSpaceAround, type LucideIcon } from 'lucide-react';
import { useGuidePositions, type GuidePositions } from '../slides/guidePositions';
import { Input } from '@/components/ui/input';

export const STAGE_WIDTH_PX = 1920;
export const STAGE_HEIGHT_PX = 1080;

export type SnapTone = 'gold' | 'cream' | 'ember';

export interface SnapTarget {
  /** Button label (e.g. "Logo", "Body", "Rail", "Half"). */
  key: string;
  /** Color tone for the button. */
  tone: SnapTone;
  /** The px value that will be written when this button is clicked. */
  px: number;
  /** Tooltip / live measurement readout. `null` = guides aren't live. */
  live: string | null;
}

export interface GuideSnapControlsProps {
  /** Current numeric value (clamped to [min, max] before display). */
  value: number;
  onChange: (next: number) => void;
  /** Builds the snap target list from the current live guide positions. */
  buildTargets: (guides: GuidePositions) => SnapTarget[];
  /** Header label, e.g. "Snap left to guide". */
  label: string;
  /** Optional explanatory paragraph under the controls. */
  helpText?: string;
  /** Min value for the numeric input. Defaults to 0. */
  min?: number;
  /** Max value for the numeric input + clamp. Defaults to 80. */
  max?: number;
  /** Header icon. Defaults to `AlignLeft`. */
  icon?: LucideIcon;
  /** When false, shows an "enable Alignment guide" hint. */
  guidesLive?: boolean;
}

const TONE_CLASS: Record<SnapTone, string> = {
  gold:  'border-gold/30 text-gold hover:bg-gold/10',
  cream: 'border-cream/30 text-cream hover:bg-cream/10',
  ember: 'border-ember/30 text-ember hover:bg-ember/10',
};

export function GuideSnapControls({
  value,
  onChange,
  buildTargets,
  label,
  helpText,
  min = 0,
  max = 80,
  icon: Icon = AlignLeft,
  guidesLive,
}: GuideSnapControlsProps) {
  const guides = useGuidePositions();
  const targets = buildTargets(guides);
  const liveResolved = guidesLive ?? targets.some(t => t.live !== null);

  return (
    <div className="space-y-2 p-2 mt-1 border border-border/60 rounded-md bg-surface-1/30">
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3 text-gold/80" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/80">
          {label}
        </p>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          {value}px
        </span>
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, targets.length)}, minmax(0, 1fr))` }}
      >
        {targets.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(Math.round(t.px))}
            className={`text-[11px] py-1.5 rounded-md border transition ${TONE_CLASS[t.tone]}`}
            title={t.live ?? 'Enable Alignment guide in /settings to measure live'}
          >
            {t.key}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={min}
          max={max}
          value={value || 0}
          onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
          placeholder="0"
          className="h-8 text-xs"
        />
        <button
          type="button"
          onClick={() => onChange(0)}
          className="text-[11px] px-2 py-1 rounded-md text-muted-foreground hover:text-foreground transition"
          title="Reset to 0"
        >
          Reset
        </button>
      </div>
      {helpText ? (
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
          {helpText}{' '}
          {liveResolved ? null : (
            <span className="text-ember/80">
              Live measurement OFF — snap buttons use fallback offsets. Toggle
              Alignment guide in /settings to capture exact px.
            </span>
          )}
        </p>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------------- *
 * Preset target builders — the original step-row math (spec 40) factored
 * out so callers can do `<GuideSnapControls buildTargets={stepRowLeftTargets} ...>`
 * without re-implementing it. Other editors (CTA, label, vertical) can add
 * their own builders next to these.
 * ----------------------------------------------------------------------- */

/** Step row left snap: align row's left edge to Logo / Body grid / Rail. */
export function stepRowLeftTargets(guides: GuidePositions): SnapTarget[] {
  const bodyX = guides.bodyX ?? 0;
  return [
    {
      key: 'Logo',
      tone: 'gold',
      px: guides.logoX !== null ? Math.max(0, guides.logoX - bodyX) : 0,
      live: guides.logoX !== null ? `Logo edge: ${guides.logoX}px` : null,
    },
    {
      key: 'Body',
      tone: 'cream',
      px: 0,
      live: guides.bodyX !== null ? `Body grid: ${guides.bodyX}px` : null,
    },
    {
      key: 'Rail',
      tone: 'ember',
      px: guides.railX !== null ? Math.max(0, guides.railX - bodyX) : 28,
      live: guides.railX !== null ? `Rail: ${guides.railX}px` : null,
    },
  ];
}

/** Step row right snap: pull row's right edge inward. */
export function stepRowRightTargets(guides: GuidePositions): SnapTarget[] {
  const bodyRightX = guides.bodyX !== null ? STAGE_WIDTH_PX - guides.bodyX : null;
  return [
    {
      key: 'Body',
      tone: 'cream',
      px: 0,
      live: bodyRightX !== null ? `Body grid right: ${bodyRightX}px inset` : null,
    },
    {
      key: 'Half',
      tone: 'gold',
      px: guides.bodyX !== null
        ? Math.max(0, Math.round((STAGE_WIDTH_PX - 2 * guides.bodyX) / 2))
        : 80,
      live: guides.bodyX !== null
        ? `Body half-width inset (${Math.round((STAGE_WIDTH_PX - 2 * guides.bodyX) / 2)}px)`
        : null,
    },
    {
      key: 'Rail',
      tone: 'ember',
      px: guides.railX !== null
        ? Math.max(0, STAGE_WIDTH_PX - guides.railX)
        : 120,
      live: guides.railX !== null ? `Rail: ${STAGE_WIDTH_PX - guides.railX}px inset` : null,
    },
  ];
}

/** Re-export icons so callers don't need a separate lucide import. */
export const SnapIcons = {
  left:  AlignLeft,
  right: AlignRight,
  vertical: AlignVerticalSpaceAround,
};
