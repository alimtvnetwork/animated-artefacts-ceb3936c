/**
 * In-app slide builder — multi-slide deck workspace.
 *
 * # Layout
 *   ┌──────────────┬───────────────────────────┬──────────────────────────┐
 *   │  Deck meta   │  Slide editor             │  Live preview + JSON     │
 *   │  Slide list  │  (form per selected slide)│                          │
 *   └──────────────┴───────────────────────────┴──────────────────────────┘
 *
 * Left rail = deck-level state + slide list with add/duplicate/delete/reorder.
 * Middle = the same per-slide form as before, scoped to the selected slide.
 * Right = live `SlidePreview` of the selected slide + manifest JSON of the
 * full draft deck.
 *
 * # Preset inheritance (the headline behavior)
 * The deck-meta form has a `preset` picker (defaults to `premium`). Every
 * slide created via "Add slide" or "Duplicate" inherits that preset
 * automatically through `useDraftDeck().addSlide` / `duplicateSlide`. There's
 * no per-slide preset toggle — the deck owns the look, individual slides
 * only override via the explicit `titleStyle` field if they really need to.
 *
 * # Persistence
 * The whole draft deck lives in `localStorage["riseup.deck.draft.v1"]` and
 * is rehydrated on every mount. Refreshes survive. "Reset" wipes it. "Export
 * as manifest" downloads a portable JSON file (same shape as the deck-menu
 * manifest export) and offers to load it as the active deck.
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Eye, Target, Grid3x3 } from 'lucide-react';
import {
  getPresetSettings,
  setPresetSettings,
  subscribePresetSettings,
} from '../slides/presetSettings';
import { Link } from 'react-router-dom';
import { ChevronLeft, Copy, Download, Check, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { SlideSpec, SlideContent } from '../slides/types';
import type { SlideTransitionValue, TextAnimationValue } from '../slides/enums';
import { SLIDE_TYPE_SCHEMAS } from '../builder/fieldSchemas';
import { AnimationPreviewPanel } from '../builder/AnimationPreviewPanel';
import { ContentFieldEditor } from '../builder/ContentFieldEditor';
import { NormalizeBulletsAction } from '../builder/NormalizeBulletsAction';
import { HotspotCanvasEditor } from '../builder/HotspotCanvasEditor';
import { TextField, SelectField, Field } from '../builder/FormPrimitives';
import { Switch } from '@/components/ui/switch';
import { useDraftDeck, clearDraft } from '../builder/draftDeck';
import { DeckMetaForm } from '../builder/DeckMetaForm';
import { SlideListSidebar } from '../builder/SlideListSidebar';
import { MotionMatrixHint } from '../builder/MotionMatrixHint';
import { buildManifest, downloadManifest } from '../slides/manifest';
import { IMPORTED_MANIFEST_KEY } from '../slides/loader';
import {
  findStepsChain3DProseErrors,
  formatProseErrors,
} from '../builder/validate3DSteps';

const TRANSITIONS: ReadonlyArray<{ value: SlideTransitionValue; label: string }> = [
  { value: 'FadeIn',     label: 'FadeIn' },
  { value: 'SlideIn',    label: 'SlideIn' },
  { value: 'PushIn',     label: 'PushIn' },
  { value: 'PushLeft',   label: 'PushLeft' },
  { value: 'PushRight',  label: 'PushRight' },
];

const TEXT_ANIMS: ReadonlyArray<{ value: TextAnimationValue; label: string }> = [
  { value: 'FadeIn',  label: 'FadeIn' },
  { value: 'Bounce',  label: 'Bounce' },
  { value: 'SlideUp', label: 'SlideUp' },
  { value: 'Stagger', label: 'Stagger' },
];

const TITLE_STYLES: ReadonlyArray<{ value: 'cream' | 'gold' | 'gradient' | 'white' | 'auto'; label: string }> = [
  { value: 'auto',     label: 'Auto (preset picks)' },
  { value: 'cream',    label: 'Cream' },
  { value: 'gold',     label: 'Gold' },
  { value: 'gradient', label: 'Gold gradient' },
  { value: 'white',    label: 'White' },
];

export default function BuilderPage() {
  const store = useDraftDeck();
  const { draft, updateDeck, updateSlide, addSlide, duplicateSlide, removeSlide, moveSlide, reset } = store;

  const [selectedNumber, setSelectedNumber] = useState<number | null>(
    draft.slides[0]?.slideNumber ?? null,
  );
  const [copied, setCopied] = useState(false);

  // Keep selection in sync when slides are added/removed externally.
  useEffect(() => {
    if (selectedNumber === null && draft.slides.length > 0) {
      setSelectedNumber(draft.slides[0].slideNumber);
    } else if (selectedNumber !== null && !draft.slides.find(s => s.slideNumber === selectedNumber)) {
      setSelectedNumber(draft.slides[0]?.slideNumber ?? null);
    }
  }, [draft.slides, selectedNumber]);

  const selectedSlide = useMemo(
    () => draft.slides.find(s => s.slideNumber === selectedNumber) ?? null,
    [draft.slides, selectedNumber],
  );

  /**
   * Linear neighbors of the selected slide — what `MotionMatrixHint` needs
   * to flag transition × textAnimation collisions. Mirrors the same
   * filter `loader.ts` applies to compute `linearSlides`: skip
   * click-reveal slides and explicitly disabled slides, then sort by
   * slideNumber. Click-reveal slides themselves get null neighbors —
   * they live outside the linear cadence so the variety rule doesn't
   * apply to them.
   */
  const { previousLinear, nextLinear } = useMemo(() => {
    if (!selectedSlide || selectedSlide.isClickReveal) {
      return { previousLinear: null, nextLinear: null };
    }
    const linear = draft.slides
      .filter(s => !s.isClickReveal && s.enabled !== false)
      .sort((a, b) => a.slideNumber - b.slideNumber);
    const idx = linear.findIndex(s => s.slideNumber === selectedSlide.slideNumber);
    return {
      previousLinear: idx > 0 ? linear[idx - 1] : null,
      nextLinear: idx >= 0 && idx < linear.length - 1 ? linear[idx + 1] : null,
    };
  }, [draft.slides, selectedSlide]);

  const manifestJson = useMemo(
    () => JSON.stringify(buildManifest(draft.deck, draft.slides, draft.deck.theme as 'noir-gold' | 'bright-gold' | undefined), null, 2),
    [draft],
  );

  const handleAddSlide = (type: SlideListSidebarAddType) => {
    const created = addSlide(type);
    setSelectedNumber(created);
  };
  const handleDuplicate = (n: number) => {
    const created = duplicateSlide(n);
    setSelectedNumber(created);
  };

  const updateSelectedContent = (next: SlideContent) => {
    if (!selectedSlide) return;
    updateSlide(selectedSlide.slideNumber, { ...selectedSlide, content: next });
  };
  const patchSelected = (patch: Partial<SlideSpec>) => {
    if (!selectedSlide) return;
    updateSlide(selectedSlide.slideNumber, { ...selectedSlide, ...patch });
  };

  /**
   * Hard pre-save guard: blocks any export/copy/load when a 3D step still
   * holds prose (`description.body` or empty `bullets[]`). Returns `true` if
   * the deck is clean, `false` after surfacing a multi-line toast otherwise.
   * Centralised so the three save paths stay in sync.
   */
  const guard3DProse = (): boolean => {
    const errors = findStepsChain3DProseErrors(draft.slides);
    if (errors.length === 0) return true;
    toast.error('3D steps must use bullets[]', {
      description: formatProseErrors(errors),
      duration: 12_000,
    });
    return false;
  };

  const copyManifest = async () => {
    if (!guard3DProse()) return;
    try {
      await navigator.clipboard.writeText(manifestJson);
      setCopied(true);
      toast.success('Manifest copied to clipboard');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Copy failed — select the JSON manually.');
    }
  };

  const handleExport = () => {
    if (draft.slides.length === 0) {
      toast.error('Add at least one slide before exporting.');
      return;
    }
    if (!guard3DProse()) return;
    const manifest = buildManifest(draft.deck, draft.slides, draft.deck.theme as 'noir-gold' | 'bright-gold' | undefined);
    downloadManifest(manifest);
    toast.success('Deck exported', { description: `${manifest.slides.length} slides written to JSON.` });
  };

  const handleLoadAsActive = () => {
    if (draft.slides.length === 0) {
      toast.error('Add at least one slide before loading.');
      return;
    }
    if (!guard3DProse()) return;
    const manifest = buildManifest(draft.deck, draft.slides, draft.deck.theme as 'noir-gold' | 'bright-gold' | undefined);
    window.localStorage.setItem(IMPORTED_MANIFEST_KEY, JSON.stringify(manifest));
    toast.success('Loaded as active deck', { description: 'Reloading…' });
    setTimeout(() => { window.location.href = '/1'; }, 500);
  };

  const handleReset = () => {
    if (!window.confirm('Discard the entire draft deck? This cannot be undone.')) return;
    clearDraft();
    reset();
    setSelectedNumber(null);
    toast.success('Draft reset.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---- Top bar ---- */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-14 max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/1" className="lift-hover-subtle inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back to deck
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <h1 className="text-sm font-medium tracking-wide truncate">
              {draft.deck.deckName || 'Untitled Deck'}
              <span className="ml-2 text-muted-foreground/60 font-mono text-xs">
                {draft.slides.length} slide{draft.slides.length === 1 ? '' : 's'} · preset: {draft.deck.preset ?? 'premium'}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleReset} className="lift-hover-subtle text-muted-foreground hover:text-destructive">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
            </Button>
            <Button size="sm" variant="outline" onClick={copyManifest} className="lift-hover-subtle">
              {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-gold" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              Copy JSON
            </Button>
            <Button size="sm" variant="outline" onClick={handleLoadAsActive} className="lift-hover-subtle">
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Load as active
            </Button>
            <Button size="sm" onClick={handleExport} className="lift-hover-subtle">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
          </div>
        </div>
      </header>

      {/* ---- Body ---- */}
      <div className="grid lg:grid-cols-[280px_440px_1fr] gap-0 max-w-[1800px] mx-auto">
        {/* ----- Deck meta + slide list ----- */}
        <aside className="border-r border-border h-[calc(100vh-3.5rem)] overflow-y-auto p-5 space-y-6">
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Deck</h2>
            <DeckMetaForm deck={draft.deck} onChange={updateDeck} />
          </section>
          <SlideListSidebar
            slides={draft.slides}
            selectedNumber={selectedNumber}
            onSelect={setSelectedNumber}
            onAdd={handleAddSlide}
            onDuplicate={handleDuplicate}
            onRemove={removeSlide}
            onMove={moveSlide}
          />
        </aside>

        {/* ----- Slide editor ----- */}
        <section className="border-r border-border h-[calc(100vh-3.5rem)] overflow-y-auto p-6 space-y-6">
          {!selectedSlide && (
            <div className="text-center py-20 text-muted-foreground text-sm">
              Add a slide from the left to start editing.
            </div>
          )}
          {selectedSlide && (
            <>
              <section className="space-y-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                  Slide {selectedSlide.slideNumber} · {SLIDE_TYPE_SCHEMAS[selectedSlide.slideType].label}
                </h2>
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                  {SLIDE_TYPE_SCHEMAS[selectedSlide.slideType].blurb}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Meta</h3>
                <div className="grid grid-cols-[100px_1fr] gap-3">
                  <Field label="Number">
                    <input
                      type="number"
                      min={1}
                      value={selectedSlide.slideNumber}
                      onChange={e => {
                        const n = Math.max(1, Number(e.target.value) || 1);
                        // Renumber: remove old, add as new number. Skip if collision.
                        if (draft.slides.find(s => s.slideNumber === n && s.slideNumber !== selectedSlide.slideNumber)) {
                          toast.error(`Slide ${n} already exists.`);
                          return;
                        }
                        updateSlide(selectedSlide.slideNumber, { ...selectedSlide, slideNumber: n });
                        setSelectedNumber(n);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </Field>
                  <TextField label="Slug" value={selectedSlide.slideName} onChange={v => patchSelected({ slideName: v })} placeholder="kebab-case-slug" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Transition"
                    value={selectedSlide.transition}
                    options={TRANSITIONS}
                    onChange={v => patchSelected({ transition: v })}
                  />
                  <SelectField
                    label="Text animation"
                    value={selectedSlide.textAnimation}
                    options={TEXT_ANIMS}
                    onChange={v => patchSelected({ textAnimation: v })}
                  />
                </div>
                {/* Variety matrix — only renders when there's at least one
                    linear neighbor to compare against. Click a cell to
                    apply that pair atomically. */}
                <MotionMatrixHint
                  current={selectedSlide}
                  previous={previousLinear}
                  next={nextLinear}
                  onPick={({ transition, textAnimation }) =>
                    patchSelected({ transition, textAnimation })
                  }
                />
                <SelectField
                  label="Title style override"
                  value={(selectedSlide.titleStyle ?? 'auto') as 'auto' | 'cream' | 'gold' | 'gradient' | 'white'}
                  options={TITLE_STYLES}
                  onChange={v => patchSelected({ titleStyle: v === 'auto' ? undefined : v })}
                  hint={`Auto = deck preset's pick (${draft.deck.preset ?? 'premium'}).`}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Brand header">
                    <Switch checked={selectedSlide.showBrandHeader} onCheckedChange={v => patchSelected({ showBrandHeader: v })} />
                  </Field>
                  <Field label="Title shimmer">
                    <Switch checked={!!selectedSlide.titleShimmer} onCheckedChange={v => patchSelected({ titleShimmer: v })} />
                  </Field>
                </div>
              </section>

              <NormalizeBulletsAction
                slide={selectedSlide}
                onApply={(nextContent) => updateSelectedContent(nextContent)}
              />

              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Content</h3>
                {SLIDE_TYPE_SCHEMAS[selectedSlide.slideType].fields.map(field => (
                  <ContentFieldEditor
                    key={field}
                    field={field}
                    content={selectedSlide.content}
                    onChange={updateSelectedContent}
                    allSlides={draft.slides}
                    currentSlideNumber={selectedSlide.slideNumber}
                    slideType={selectedSlide.slideType}
                  />
                ))}
              </section>

              {/* ----- Clickable hotspots (v0.127) -----
                  Available on every slide type — orthogonal to the slide's
                  primary content. Renders the slide as a 720px scaled preview
                  and lets the author drag rectangles to define click-reveal
                  regions. The runtime mounts these via `HotspotLayer` in
                  `SlideStage`, so any slide can already display them — this
                  is the missing authoring surface. */}
              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Clickable hotspots
                </h3>
                <HotspotCanvasEditor
                  slide={selectedSlide}
                  allSlides={draft.slides}
                  hotspots={selectedSlide.content.hotspots ?? []}
                  onChange={(next) =>
                    updateSelectedContent({
                      ...selectedSlide.content,
                      hotspots: next.length > 0 ? next : undefined,
                    })
                  }
                />
              </section>
            </>
          )}
        </section>

        {/* ----- Preview + manifest JSON ----- */}
        <main className="h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Live preview</h2>
                <BuilderAlignmentToggles />
                <span className="text-[11px] text-muted-foreground">
                  1920 × 1080 → scaled
                  {selectedSlide && (
                    <>
                      {' · '}
                      <span className="text-foreground/70">{selectedSlide.transition}</span>
                      {' / '}
                      <span className="text-foreground/70">{selectedSlide.textAnimation}</span>
                    </>
                  )}
                </span>
              </div>
              <AnimationPreviewPanel slide={selectedSlide} width={760} />
            </div>

            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold mb-3">Deck manifest</h2>
              <pre className="text-[12px] leading-relaxed bg-surface-1/40 border border-border rounded-xl p-4 overflow-auto text-foreground/90 font-mono max-h-[420px]">
                {manifestJson}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Re-export the slide-type union the sidebar emits, so the page only depends
// on one source of truth for slide-type identifiers.
type SlideListSidebarAddType = Parameters<NonNullable<React.ComponentProps<typeof SlideListSidebar>['onAdd']>>[0];

/**
 * v0.205 — Compact dual-toggle pill that lives next to the "Live preview"
 * heading in the editor. Lets the author flash the gold/cream alignment
 * GUIDES and the red TARGET boxes on/off without leaving the slide editor
 * (the same toggles also exist in /settings, but pulling them inline lets
 * the author drag the logo + chip while watching both readouts at once).
 *
 * The actual paint happens inside `SlidePreviewAlignmentOverlay`; this
 * component only flips the two `presetSettings` flags.
 */
function BuilderAlignmentToggles() {
  const guidesOn = useSyncExternalStore(
    subscribePresetSettings,
    () => getPresetSettings().showAlignmentGuide,
    () => false,
  );
  const targetsOn = useSyncExternalStore(
    subscribePresetSettings,
    () => getPresetSettings().showAlignmentTargets,
    () => false,
  );
  const snapOn = useSyncExternalStore(
    subscribePresetSettings,
    () => getPresetSettings().pixelSnap,
    () => false,
  );

  const TONES = {
    gold:  { ring: 'hsl(var(--gold))',     bg: 'hsl(var(--gold) / 0.12)' },
    red:   { ring: 'hsl(0 80% 55%)',       bg: 'hsl(0 80% 55% / 0.12)' },
    cream: { ring: 'hsl(var(--cream))',    bg: 'hsl(var(--cream) / 0.12)' },
  } as const;

  const togglePill = (
    active: boolean,
    onClick: () => void,
    Icon: typeof Eye,
    label: string,
    tone: keyof typeof TONES,
    title?: string,
  ) => {
    const t = TONES[tone];
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition"
        style={{
          borderColor: active ? t.ring : 'hsl(var(--border))',
          background:  active ? t.bg   : 'transparent',
          color:       active ? t.ring : 'hsl(var(--muted-foreground))',
        }}
        title={title ?? `${active ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1.5">
      {togglePill(
        guidesOn,
        () => setPresetSettings({ ...getPresetSettings(), showAlignmentGuide: !guidesOn }),
        Eye,
        'Guides',
        'gold',
      )}
      {togglePill(
        targetsOn,
        () => setPresetSettings({ ...getPresetSettings(), showAlignmentTargets: !targetsOn }),
        Target,
        'Targets',
        'red',
      )}
      {togglePill(
        snapOn,
        () => setPresetSettings({ ...getPresetSettings(), pixelSnap: !snapOn }),
        Grid3x3,
        'Pixel Snap',
        'cream',
        snapOn
          ? 'Pixel Snap ON — animations frozen, logo + chip rounded to whole pixels.'
          : 'Freeze animations & snap logo/chip to integer px for measurement.',
      )}
    </div>
  );
}
