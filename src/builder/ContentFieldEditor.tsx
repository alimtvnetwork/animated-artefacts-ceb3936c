/**
 * Per-field form section. Renders the right input(s) for a single
 * `FieldKey` and writes back into the draft `SlideContent`.
 *
 * Kept in one file so the field <-> renderer mapping stays auditable in one
 * place. To add a new field, add it to `FieldKey` in `fieldSchemas.ts` and
 * add a case here.
 */
import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { SlideContent, CapsuleSpec, StepSpec, ContactRow, SocialLink, SlideSpec } from '../slides/types';
import { splitProseToBullets } from '../slides/proseToBullets';
import type { CapsuleColorValue, SlideTypeValue } from '../slides/enums';
import type { FieldKey } from './fieldSchemas';
import { TextField, TextAreaField, SelectField, Repeater, Field } from './FormPrimitives';
import { ClickRevealToggle, buildSlideOptions } from './ClickRevealToggle';
import {
  GuideSnapControls,
  SnapIcons,
  stepRowLeftTargets,
  stepRowRightTargets,
} from './GuideSnapControls';
import { GuideMeasurementHUD } from './GuideMeasurementHUD';
import { Input } from '@/components/ui/input';
import { BrandedQR } from '../slides/components/BrandedQR';
import { BoxDiagramCanvasEditor } from './BoxDiagramCanvasEditor';

const CAPSULE_COLORS: ReadonlyArray<{ value: CapsuleColorValue; label: string }> = [
  { value: 'gold',    label: 'Gold' },
  { value: 'ember',   label: 'Ember' },
  { value: 'cream',   label: 'Cream' },
  { value: 'ink',     label: 'Ink' },
  { value: 'outline', label: 'Outline' },
];

const ROW_ICONS: ReadonlyArray<{ value: ContactRow['icon']; label: string }> = [
  { value: 'pin',      label: 'Pin (location)' },
  { value: 'mail',     label: 'Mail' },
  { value: 'phone',    label: 'Phone' },
  { value: 'globe',    label: 'Globe' },
  { value: 'calendar', label: 'Calendar' },
];

const SOCIAL_ICONS: ReadonlyArray<{ value: SocialLink['icon']; label: string }> = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'mail',     label: 'Mail' },
  { value: 'github',   label: 'GitHub' },
  { value: 'twitter',  label: 'Twitter' },
  { value: 'globe',    label: 'Globe' },
];

/**
 * Thin per-step wrapper around the reusable `GuideSnapControls`. Encodes
 * the row-specific labels, ranges, and target builders (spec 40 — v0.76
 * left, v0.86 right). All actual snap math lives in `GuideSnapControls.tsx`
 * so other editors (CTAs, labels, future axes) can reuse the same UI.
 */
function StepSnapControls({
  side,
  value,
  onChange,
}: {
  side: 'left' | 'right';
  value: number;
  onChange: (n: number) => void;
}) {
  const isLeft = side === 'left';
  return (
    <GuideSnapControls
      value={value}
      onChange={onChange}
      buildTargets={isLeft ? stepRowLeftTargets : stepRowRightTargets}
      label={isLeft ? 'Snap left to guide' : 'Snap right to guide'}
      max={isLeft ? 80 : 160}
      icon={isLeft ? SnapIcons.left : SnapIcons.right}
      helpText={isLeft
        ? 'Adds left padding (0–80px) to this step row so the label and capsule snap to a guide.'
        : 'Adds right padding (0–160px) so the row\'s right edge snaps to a guide. Use to align label/capsule width with the description column.'}
    />
  );
}

interface Props {
  field: FieldKey;
  content: SlideContent;
  onChange: (next: SlideContent) => void;
  /**
   * Full list of deck slides — used to build click-reveal target dropdowns
   * for capsules and steps. Optional for back-compat with any caller that
   * doesn't yet wire it; when missing, the click-reveal toggle disables
   * itself with a "no targets" hint.
   */
  allSlides?: ReadonlyArray<SlideSpec>;
  /** Slide number of the currently-edited slide. Excluded from target lists. */
  currentSlideNumber?: number;
  /**
   * Slide type of the currently-edited slide. Used to gate field-level
   * validation rules — e.g. `StepsChain3DSlide` rejects free-form
   * `description` strings (keywords-only contract; see
   * `spec/26-slide-definitions/showcase/04-process-3d.md`).
   */
  slideType?: SlideTypeValue;
}

export function ContentFieldEditor({ field, content, onChange, allSlides = [], currentSlideNumber = -1, slideType }: Props) {
  const set = <K extends keyof SlideContent>(key: K, value: SlideContent[K]) =>
    onChange({ ...content, [key]: value });
  const revealOptions = buildSlideOptions(allSlides, currentSlideNumber);

  switch (field) {
    case 'eyebrow':
      return <TextField label="Eyebrow" value={content.eyebrow} onChange={v => set('eyebrow', v)} placeholder="UPPERCASE LABEL" />;
    case 'title':
      return <TextField label="Title" value={content.title} onChange={v => set('title', v)} placeholder="Headline" />;
    case 'subtitle':
      return <TextAreaField label="Subtitle" value={content.subtitle} onChange={v => set('subtitle', v)} placeholder="Optional supporting line" rows={2} />;
    case 'image':
      return <TextField label="Image src" value={content.image} onChange={v => set('image', v)} placeholder="/path/to/image.jpg or https://…" />;
    case 'meetingUrl':
      return (
        <MeetingUrlField
          value={content.meetingUrl}
          qrStyle={content.qrStyle}
          onChange={v => set('meetingUrl', v)}
        />
      );
    case 'meetingLabel':
      return <TextField label="Meeting label" value={content.meetingLabel} onChange={v => set('meetingLabel', v)} placeholder="meet.rasia.pro/intro-call" />;
    case 'qrStyle':
      return (
        <SelectField
          label="QR style"
          value={content.qrStyle ?? 'clean'}
          options={[
            { value: 'clean',          label: 'Clean (white tile + ink modules)' },
            { value: 'riseup-finder',  label: 'Riseup finder (red corners + wordmark pill)' },
          ]}
          onChange={v => set('qrStyle', v)}
        />
      );
    case 'direction':
      return (
        <SelectField
          label="Direction"
          value={content.direction ?? 'horizontal'}
          options={[
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical',   label: 'Vertical' },
          ]}
          onChange={v => set('direction', v)}
        />
      );
    case 'windowSize':
      return (
        <SelectField
          label="Window size"
          value={String(content.windowSize ?? 3) as '3' | '5'}
          options={[
            { value: '3', label: '3 visible' },
            { value: '5', label: '5 visible' },
          ]}
          onChange={v => set('windowSize', Number(v) as 3 | 5)}
        />
      );

    case 'keywords':
      return (
        <Repeater<string>
          label="Keywords"
          items={content.keywords ?? []}
          onChange={next => set('keywords', next)}
          newItem={() => 'New keyword'}
          renderItem={(item, update) => (
            <Input value={item} onChange={e => update(e.target.value)} placeholder="Keyword" />
          )}
        />
      );

    case 'capsules':
      return (
        <Repeater<CapsuleSpec>
          label="Capsules"
          items={content.capsules ?? []}
          onChange={next => set('capsules', next)}
          newItem={() => ({ text: 'New capsule', color: 'gold' })}
          renderItem={(item, update) => (
            <>
              <Input value={item.text} onChange={e => update({ ...item, text: e.target.value })} placeholder="Label" />
              <SelectField
                label="Color"
                value={item.color}
                options={CAPSULE_COLORS}
                onChange={v => update({ ...item, color: v })}
              />
              {/* Per-capsule click-reveal toggle (spec 26 / spec 22). When on,
                  the capsule routes the deck to the target slide on click —
                  preview reflects via Capsule's `clickRevealSlide` handling. */}
              <ClickRevealToggle
                value={item.clickRevealSlide}
                onChange={(n) => update({ ...item, clickRevealSlide: n })}
                slideOptions={revealOptions}
                label="Click reveal"
                helpEnabled="Capsule becomes clickable. Hint pulse + ↗ glyph appear when reveal-hints are enabled in the controller."
              />
            </>
          )}
        />
      );


    case 'steps':
      return (
        <Repeater<StepSpec>
          label="Steps"
          items={content.steps ?? []}
          onChange={next => set('steps', next)}
          newItem={() => ({ label: '0X', title: 'New step', subtitle: '' })}
          renderItem={(item, update) => (
            <>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <Input value={item.label} onChange={e => update({ ...item, label: e.target.value })} placeholder="01" />
                <Input value={item.title} onChange={e => update({ ...item, title: e.target.value })} placeholder="Step title" />
              </div>
              <Input value={item.subtitle ?? ''} onChange={e => update({ ...item, subtitle: e.target.value })} placeholder="Short caption (optional)" />
              <Description3DEditor
                slideType={slideType}
                value={item.description}
                onChange={(v) => update({ ...item, description: v })}
              />

              {/* Per-step row click-reveal toggle (spec 26 — generic
                  ClickRevealTrigger). Independent of the CTA pill: this
                  makes the entire step row navigate on click in
                  StepTimelineSlide and adds the ↗ glyph by the title. */}
              <ClickRevealToggle
                value={item.revealSlide}
                onChange={(n) => update({ ...item, revealSlide: n })}
                slideOptions={revealOptions}
                label="Step click reveal"
                helpEnabled="Step row becomes clickable. Renders an ↗ glyph next to the title and an 'Open details' pill in the detail panel."
              />

              {/* Per-step CTA pill (spec 33 §3 — v0.61). Optional. */}
              <div className="space-y-2 p-2 mt-1 border border-border/60 rounded-md bg-surface-1/30">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/80">CTA pill (optional)</p>
                <Input
                  value={item.cta?.text ?? ''}
                  onChange={e => {
                    const text = e.target.value;
                    if (!text && !item.cta?.href && !item.cta?.revealSlide) {
                      update({ ...item, cta: undefined });
                    } else {
                      update({ ...item, cta: { ...(item.cta ?? { text: '' }), text } });
                    }
                  }}
                  placeholder="Button text — Learn more"
                />
                <div className="grid grid-cols-[1fr_110px] gap-2">
                  <Input
                    value={item.cta?.href ?? ''}
                    onChange={e => {
                      const href = e.target.value;
                      update({ ...item, cta: { ...(item.cta ?? { text: '' }), href: href || undefined } });
                    }}
                    placeholder="https:// (external link)"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={item.cta?.revealSlide ?? ''}
                    onChange={e => {
                      const n = e.target.value ? Number(e.target.value) : undefined;
                      update({
                        ...item,
                        cta: { ...(item.cta ?? { text: '' }), revealSlide: n },
                      });
                    }}
                    placeholder="Slide #"
                  />
                </div>
                <SelectField
                  label="Variant"
                  value={item.cta?.variant ?? 'gold'}
                  options={[
                    { value: 'gold',    label: 'Gold (solid)' },
                    { value: 'outline', label: 'Outline' },
                  ]}
                  onChange={v => update({ ...item, cta: { ...(item.cta ?? { text: '' }), variant: v as 'gold' | 'outline' } })}
                />
                <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                  Leave text empty to hide the pill. Use either an external
                  href OR a deck-internal slide number, not both.
                </p>
              </div>

              {/* Live measurement HUD — sits above the snap controls so the
                  author can see why a snap button will write a given px. */}
              <GuideMeasurementHUD />

              {/* Snap-to-guide controls (spec 40 — v0.76 left, v0.86 right) */}
              <StepSnapControls
                side="left"
                value={item.leftOffsetPx ?? 0}
                onChange={n => update({ ...item, leftOffsetPx: n || undefined })}
              />
              <StepSnapControls
                side="right"
                value={item.rightOffsetPx ?? 0}
                onChange={n => update({ ...item, rightOffsetPx: n || undefined })}
              />
            </>
          )}
        />
      );

    case 'contactRows':
      return (
        <Repeater<ContactRow>
          label="Contact rows"
          items={content.contactRows ?? []}
          onChange={next => set('contactRows', next)}
          newItem={() => ({ icon: 'mail', text: 'hello@example.com' })}
          renderItem={(item, update) => (
            <>
              <SelectField
                label="Icon"
                value={item.icon}
                options={ROW_ICONS}
                onChange={v => update({ ...item, icon: v })}
              />
              <Input value={item.text} onChange={e => update({ ...item, text: e.target.value })} placeholder="Visible text (use \n for line breaks)" />
              <Input value={item.href ?? ''} onChange={e => update({ ...item, href: e.target.value || undefined })} placeholder="Optional href (mailto:, tel:, https:)" />
            </>
          )}
        />
      );

    case 'cta':
      return (
        <Field label="CTA">
          <div className="space-y-2 p-2 border border-border rounded-md bg-surface-1/40">
            <Input
              value={content.cta?.text ?? ''}
              onChange={e => set('cta', { ...(content.cta ?? { href: '' }), text: e.target.value })}
              placeholder="Button text — Schedule a Call"
            />
            <Input
              value={content.cta?.href ?? ''}
              onChange={e => set('cta', { ...(content.cta ?? { text: '' }), href: e.target.value })}
              placeholder="https://meet.rasia.pro/intro-call"
            />
            <SelectField
              label="Inline icon (optional)"
              value={content.cta?.icon ?? ''}
              options={[
                { value: '',         label: '— Standalone CTA below list' },
                { value: 'calendar', label: 'Calendar (inline as list row)' },
                { value: 'mail',     label: 'Mail (inline as list row)' },
                { value: 'phone',    label: 'Phone (inline as list row)' },
                { value: 'pin',      label: 'Pin (inline as list row)' },
                { value: 'globe',    label: 'Globe (inline as list row)' },
              ]}
              onChange={v =>
                set('cta', {
                  ...(content.cta ?? { text: '', href: '' }),
                  icon: (v || undefined) as ContactRow['icon'] | undefined,
                })
              }
            />
          </div>
        </Field>
      );

    case 'socials':
      return (
        <Repeater<SocialLink>
          label="Social icons"
          items={content.socials ?? []}
          onChange={next => set('socials', next)}
          newItem={() => ({ icon: 'linkedin', href: 'https://linkedin.com/company/…' })}
          renderItem={(item, update) => (
            <>
              <SelectField
                label="Icon"
                value={item.icon}
                options={SOCIAL_ICONS}
                onChange={v => update({ ...item, icon: v })}
              />
              <Input value={item.href} onChange={e => update({ ...item, href: e.target.value })} placeholder="https://…" />
            </>
          )}
        />
      );

    /* ─── BoxDiagram / ER diagram editors ──────────────────────────────
     * The canvas editor owns BOTH the node and edge arrays so it can
     * keep them in sync (e.g. cascade-delete edges when a node is
     * removed). To avoid rendering it twice for ERDiagramSlide (which
     * lists `entities` AND `relationships` as fields), we render the
     * full canvas only on the node-key, and intentionally render nothing
     * for the edge-key. v0.183. */
    case 'diagramNodes':
      return (
        <Field
          label="Diagram"
          hint="Drag to position · drag right edge to resize · Connect tool to draw an edge · Del/Backspace to remove."
        >
          <BoxDiagramCanvasEditor
            nodes={content.diagramNodes ?? []}
            edges={content.diagramEdges ?? []}
            onChange={({ nodes, edges }) =>
              onChange({
                ...content,
                diagramNodes: nodes.length ? nodes : undefined,
                diagramEdges: edges.length ? edges : undefined,
              })
            }
            nodeNoun="Node"
            edgeNoun="Edge"
          />
        </Field>
      );
    case 'entities':
      return (
        <Field
          label="ER diagram"
          hint="Drag to position · drag right edge to resize · Connect tool to draw a relationship · Del/Backspace to remove."
        >
          <BoxDiagramCanvasEditor
            nodes={content.entities ?? []}
            edges={content.relationships ?? []}
            onChange={({ nodes, edges }) =>
              onChange({
                ...content,
                entities: nodes.length ? nodes : undefined,
                relationships: edges.length ? edges : undefined,
              })
            }
            nodeNoun="Entity"
            edgeNoun="Relationship"
          />
        </Field>
      );
    case 'diagramEdges':
    case 'relationships':
      // Intentionally rendered by BoxDiagramCanvasEditor above — emitting a
      // separate Repeater here would duplicate the surface and confuse
      // designers (two sources of truth for the same data). The schema
      // still lists this field so it round-trips cleanly through fixtures.
      return null;
    case 'diagramExplanation':
      return (
        <TextAreaField
          label="Explanation paragraph"
          value={content.diagramExplanation}
          onChange={v => set('diagramExplanation', v)}
          placeholder="Optional short prose rendered in a 4/8 split to the left of the diagram."
          rows={3}
        />
      );

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Meeting URL field — text input + live QR preview + Copy/Open       */
/* ------------------------------------------------------------------ */

/**
 * Meeting URL editor with an inline live QR preview.
 *
 * # Why a custom field
 * `BrandedQR` already encodes any URL into a real, scannable code. Surfacing
 * that preview directly under the input means the author sees the QR update
 * in real time as they type/paste a meeting link — no need to switch to the
 * preview pane to verify the encoding worked.
 *
 * # Actions
 *   - **Copy** — writes the URL to the clipboard.
 *   - **Open** — opens the URL in a new tab (disabled for non-http URLs).
 *
 * The preview also doubles as a smoke test for the chosen `qrStyle`
 * (`clean` vs `riseup-finder`) and re-renders whenever either value changes.
 */
function MeetingUrlField({
  value,
  qrStyle,
  onChange,
}: {
  value: string | undefined;
  qrStyle: SlideContent['qrStyle'];
  onChange: (v: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const trimmed = (value ?? '').trim();
  const looksLikeUrl = /^https?:\/\/\S+\.\S+/i.test(trimmed);
  const canCopy = trimmed.length > 0;

  const handleCopy = async () => {
    if (!trimmed) return;
    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      toast.success('Meeting link copied');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Copy failed — select the URL manually.');
    }
  };

  return (
    <Field label="Meeting URL" hint="Encoded into the QR in real time as you type.">
      <div className="space-y-3">
        {/* Input + actions */}
        <div className="flex items-stretch gap-2">
          <Input
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder="https://meet.rasia.pro/intro-call"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            className="flex-1 font-mono text-[12px]"
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!canCopy}
            title="Copy meeting link"
            aria-label="Copy meeting link"
            className="lift-hover-subtle inline-flex items-center justify-center h-10 w-10 rounded-md border border-input bg-background text-foreground/80 hover:text-gold hover:bg-gold/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {copied ? <Check className="h-4 w-4 text-gold" /> : <Copy className="h-4 w-4" />}
          </button>
          <a
            href={looksLikeUrl ? trimmed : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!looksLikeUrl}
            tabIndex={looksLikeUrl ? 0 : -1}
            title={looksLikeUrl ? 'Open meeting link' : 'Enter a valid URL to open'}
            aria-label="Open meeting link in a new tab"
            className={`lift-hover-subtle inline-flex items-center justify-center h-10 w-10 rounded-md border border-input transition ${
              looksLikeUrl
                ? 'bg-background text-foreground/80 hover:text-gold hover:bg-gold/10'
                : 'bg-background text-muted-foreground/40 cursor-not-allowed pointer-events-none'
            }`}
            onClick={e => { if (!looksLikeUrl) e.preventDefault(); }}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Live QR preview — renders as soon as there's any URL-shaped text.
            We don't gate on full URL validity because a half-typed URL still
            encodes (and the preview reassures the author the field is live). */}
        <div className="flex items-center gap-4 p-3 rounded-md border border-border bg-surface-1/40">
          <div className="shrink-0">
            {trimmed ? (
              <BrandedQR
                key={`${trimmed}-${qrStyle ?? 'clean'}`}
                url={trimmed}
                style={qrStyle ?? 'clean'}
                size={120}
                alt="Live preview of the meeting QR code"
                className="!shadow-none"
              />
            ) : (
              <div
                className="flex items-center justify-center w-[120px] h-[120px] rounded-md border border-dashed border-border bg-background/50 text-[10px] text-muted-foreground text-center px-2"
                aria-hidden="true"
              >
                Paste a URL to see the QR
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Live QR</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Updates instantly as you type. The same code appears on the
              QR / Contact slide. Style: <span className="text-foreground/80 font-mono">{qrStyle ?? 'clean'}</span>.
            </p>
            {trimmed && !looksLikeUrl && (
              <p className="text-[11px] text-ember">
                Heads-up: this doesn't look like a full URL — scanners may not open it.
              </p>
            )}
          </div>
        </div>
      </div>
    </Field>
  );
}

/**
 * Per-step description editor.
 *
 * Two modes, gated by `slideType`:
 *
 * 1. **3D mode** (`StepsChain3DSlide`) — renders an editable
 *    `description.bullets[]` UI: optional title, an add/remove/reorder
 *    bullets list (1–6 entries), and an optional meta chip. Maps directly
 *    to the structured `description` object the right panel consumes.
 *    Legacy `body` strings are auto-imported on first edit (split via the
 *    same `.`,`;`,`,` rules as the renderer's `deriveBullets()`) so old
 *    decks open with their content already split into editable rows.
 *
 * 2. **String mode** (every other slide type) — plain `<Input>` for the
 *    legacy single-string description (FocusTimelineSlide narrative).
 *
 * Centralised here so the case-statement in `ContentFieldEditor` stays
 * readable and the 3D contract has a single source of truth.
 */
type DescriptionValue = undefined | string | { title?: string; bullets?: string[]; meta?: string; body?: string };

function Description3DEditor({
  slideType,
  value,
  onChange,
}: {
  slideType?: SlideTypeValue;
  value: DescriptionValue;
  onChange: (next: DescriptionValue) => void;
}) {
  const is3D = slideType === 'StepsChain3DSlide';

  if (!is3D) {
    const str = typeof value === 'string' ? value : '';
    return (
      <Input
        value={str}
        onChange={e => onChange(e.target.value || undefined)}
        placeholder="Long description (FocusTimeline)"
      />
    );
  }

  // ---- 3D mode: structured bullets editor --------------------------------
  const obj: { title?: string; bullets?: string[]; meta?: string; body?: string } =
    typeof value === 'string' ? { body: value } : (value ?? {});

  const bullets = obj.bullets ?? [];

  // Shared with the deck-load preprocessor (see `src/slides/proseToBullets.ts`)
  // so authors can never observe a different bullet split between what the
  // editor preview shows and what the loader migrates at boot.

  /**
   * Heuristic: does this string look like prose rather than a keyword bullet?
   *
   * Triggers when ANY of:
   *   - contains a sentence terminator followed by a space + word (`. T`, `; w`)
   *   - contains a comma followed by a space + word (`, and`)
   *   - exceeds 60 chars (bullets should be tight keyword phrases)
   *   - has more than 8 whole words
   *
   * Used for live inline validation under each bullet input. Conservative
   * on purpose: a single short phrase like "Stakeholder interviews" passes
   * cleanly, while "We interview stakeholders, then audit the system." trips.
   */
  const looksLikeProse = (text: string): boolean => {
    const t = text.trim();
    if (!t) return false;
    if (/[.;](\s+\S)/.test(t)) return true;
    if (/,\s+\S/.test(t)) return true;
    if (t.length > 60) return true;
    const wordCount = t.split(/\s+/).filter(Boolean).length;
    if (wordCount > 8) return true;
    return false;
  };

  /** Reasoned description of why a string tripped `looksLikeProse`. */
  const proseReason = (text: string): string => {
    const t = text.trim();
    if (/[.;](\s+\S)/.test(t)) return 'multiple sentences (split on . or ;)';
    if (/,\s+\S/.test(t)) return 'comma-separated clauses (split on ,)';
    if (t.length > 60) return `${t.length} chars (keep ≤ 60)`;
    const wordCount = t.split(/\s+/).filter(Boolean).length;
    if (wordCount > 8) return `${wordCount} words (keep ≤ 8)`;
    return 'looks like prose';
  };

  /**
   * Inline error chip rendered under any field that contains prose-shaped
   * input. Links to the StepsChain3D contract doc so authors can read the
   * full keywords-only rule. Lives next to the field, not in a toast — the
   * toast pattern is for save-blocking, this is for in-flow guidance.
   */
  const ProseInlineError = ({ reason }: { reason: string }) => (
    <p className="text-[10.5px] leading-snug text-ember flex items-start gap-1">
      <span aria-hidden="true">⚠</span>
      <span>
        Prose detected ({reason}). Use 1–6 word keywords.{' '}
        <a
          href="/spec/21-slides-system/61-steps-chain-3d.md"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted hover:text-gold"
        >
          Read the contract ↗
        </a>
      </span>
    </p>
  );

  // One-shot legacy `body` → bullets[] import on mount per step.
  // Runs silently when the step opens with prose AND no bullets — keeps
  // legacy decks editable without forcing a click. The explicit
  // "Convert to bullets" action below handles every other case
  // (bullets already exist, user pasted fresh prose, etc.).
  const [legacyImported, setLegacyImported] = useState(false);
  if (!legacyImported && obj.body && bullets.length === 0) {
    setLegacyImported(true);
    const split = splitProseToBullets(obj.body);
    if (split.length > 0) {
      const { body: _omit, ...rest } = obj;
      onChange({ ...rest, bullets: split });
      toast.success('Legacy description imported', {
        description: `Split into ${split.length} bullet${split.length === 1 ? '' : 's'}. Edit freely below.`,
      });
    }
  }

  const patch = (next: Partial<typeof obj>) => {
    const merged = { ...obj, ...next };
    if (!merged.title) delete merged.title;
    if (!merged.meta) delete merged.meta;
    if (!merged.bullets || merged.bullets.length === 0) delete merged.bullets;
    delete merged.body; // never re-emit legacy field from the editor
    onChange(Object.keys(merged).length === 0 ? undefined : merged);
  };

  const setBullets = (next: string[]) => patch({ bullets: next });
  const addBullet = () => {
    if (bullets.length >= 6) {
      toast.error('Max 6 bullets per 3D step');
      return;
    }
    setBullets([...bullets, '']);
  };
  const removeBullet = (i: number) => setBullets(bullets.filter((_, idx) => idx !== i));
  const moveBullet = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= bullets.length) return;
    const next = bullets.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setBullets(next);
  };
  const updateBullet = (i: number, text: string) =>
    setBullets(bullets.map((b, idx) => (idx === i ? text : b)));

  /**
   * Convert the legacy `body` prose into appended bullets and drop the
   * `body` field. Available whenever prose is present, regardless of
   * whether bullets already exist:
   *   - empty bullets[] → the split fragments become the list
   *   - existing bullets[] → fragments are *appended*, capped at 6 total
   * Either way, `body` is cleared after a successful split. If the prose
   * is whitespace or yields no fragments, the action no-ops with a toast.
   */
  const convertProseToBullets = () => {
    const prose = obj.body?.trim() ?? '';
    if (!prose) {
      toast.error('No prose to convert', { description: 'description.body is empty.' });
      return;
    }
    const remaining = Math.max(0, 6 - bullets.length);
    if (remaining === 0) {
      toast.error('Bullets already at the 6-bullet cap', {
        description: 'Remove a bullet first, then convert.',
      });
      return;
    }
    const fragments = splitProseToBullets(prose).slice(0, remaining);
    if (fragments.length === 0) {
      toast.error('Could not split prose', {
        description: 'No usable fragments found after splitting on . ; , and newlines.',
      });
      return;
    }
    const nextBullets = [...bullets, ...fragments];
    // Strip body explicitly via patch (which already deletes it).
    patch({ bullets: nextBullets });
    toast.success('Converted to bullets', {
      description: `Added ${fragments.length} bullet${fragments.length === 1 ? '' : 's'} and cleared the legacy description.`,
    });
  };

  return (
    <div className="space-y-2 p-2 border border-border/60 rounded-md bg-surface-1/30">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/80">
        3D right-panel description
      </p>

      <Input
        value={obj.title ?? ''}
        onChange={e => patch({ title: e.target.value })}
        placeholder="Panel title (optional)"
      />

      {obj.body && obj.body.trim().length > 0 && (
        <div className="space-y-1.5 p-2 rounded border border-ember/40 bg-ember/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ember">
            Legacy prose detected
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            This step still has a <code className="font-mono">description.body</code> string.
            Convert it into bullets to satisfy the keywords-only contract.{' '}
            <a
              href="/spec/21-slides-system/61-steps-chain-3d.md"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted text-gold hover:text-gold/80"
            >
              Read the contract ↗
            </a>
          </p>
          <pre className="text-[11px] font-mono whitespace-pre-wrap break-words max-h-24 overflow-y-auto p-1.5 rounded bg-surface-1/60 border border-border/40 text-muted-foreground">
            {obj.body}
          </pre>
          <button
            type="button"
            onClick={convertProseToBullets}
            className="w-full px-2 py-1.5 text-xs font-medium border border-gold/60 rounded text-gold hover:bg-gold/15"
          >
            Convert to bullets ({Math.min(splitProseToBullets(obj.body).length, Math.max(0, 6 - bullets.length))} new
            {bullets.length > 0 ? ', appended' : ''})
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Bullets ({bullets.length}/6) — keywords only
        </p>
        {bullets.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic">
            No bullets yet. Click "Add bullet" to get started.
          </p>
        )}
        {bullets.map((b, i) => {
          const proseHit = looksLikeProse(b);
          return (
            <div key={i} className="space-y-1">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1.5 items-center">
                <Input
                  value={b}
                  onChange={e => updateBullet(i, e.target.value)}
                  placeholder={`Bullet ${i + 1} (e.g. "Stakeholder interviews")`}
                  aria-invalid={proseHit || undefined}
                  aria-describedby={proseHit ? `bullet-${i}-prose` : undefined}
                  className={proseHit ? 'border-ember/60 focus-visible:ring-ember/40' : undefined}
                />
                <button
                  type="button"
                  onClick={() => moveBullet(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move bullet ${i + 1} up`}
                  className="px-2 py-1 text-xs border border-border/60 rounded hover:bg-surface-2/40 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBullet(i, 1)}
                  disabled={i === bullets.length - 1}
                  aria-label={`Move bullet ${i + 1} down`}
                  className="px-2 py-1 text-xs border border-border/60 rounded hover:bg-surface-2/40 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeBullet(i)}
                  aria-label={`Remove bullet ${i + 1}`}
                  className="px-2 py-1 text-xs border border-border/60 rounded hover:bg-ember/20 hover:border-ember/60 text-ember"
                >
                  ✕
                </button>
              </div>
              {proseHit && (
                <div id={`bullet-${i}-prose`}>
                  <ProseInlineError reason={proseReason(b)} />
                </div>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={addBullet}
          disabled={bullets.length >= 6}
          className="w-full mt-1 px-2 py-1.5 text-xs border border-dashed border-gold/40 rounded text-gold/90 hover:bg-gold/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add bullet
        </button>
      </div>

      <Input
        value={obj.meta ?? ''}
        onChange={e => patch({ meta: e.target.value })}
        placeholder="Meta chip (e.g. 'Week 1', optional)"
      />

      <p className="text-[10px] leading-snug text-muted-foreground">
        Maps to <code className="font-mono">description.bullets[]</code> in the deck JSON.
        Keywords only — never paragraphs.
      </p>
    </div>
  );
}
