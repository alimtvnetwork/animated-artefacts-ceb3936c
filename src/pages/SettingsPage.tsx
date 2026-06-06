/**
 * /settings — small in-app settings panel for the deck-wide preset knobs.
 *
 * # Scope
 * Tunes three things globally for every deck the user opens (existing decks
 * AND new ones — the JSON files don't pin these, the live CSS-var overrides
 * win at render time):
 *   - Title clamp scale (multiplier on the .slide-title-* font-size clamps)
 *   - Brand-strip rule thickness + color
 *   - Body font for `.slide-subtitle` (Inter or Ubuntu)
 *
 * Titles always remain Ubuntu Bold — that's the brand spine and not user-
 * tunable on purpose. If a future request adds heading-font swap, extend
 * `presetSettings.ts` rather than this page.
 *
 * # Live preview
 * The right column is a `SlidePreview` of a CapsuleListSlide (the closest
 * thing to a generic "body" slide). Every change re-applies the CSS vars
 * via `setPresetSettings`, which restyles the preview instantly without
 * remounting the slide component.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Download, FileText, FileImage, FileCode2, Layers, AlertTriangle, ShieldCheck, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DEFAULT_PRESET_SETTINGS,
  RULE_THICKNESS_BOUNDS,
  TITLE_SCALE_BOUNDS,
  BODY_GRID_NUDGE_BOUNDS,
  LOGO_SCALE_BOUNDS,
  BRAND_INSET_X_BOUNDS,
  NUDGE_OFFSET_BOUNDS,
  STEP_NUMBER_SIZE_3D_RATIO_BOUNDS,
  DOT_PAGINATION_COLLAPSE_BOUNDS,
  DOT_PAGINATION_NEIGHBORS_BOUNDS,
  clampToBounds,
  TRANSITION_DURATION_BOUNDS,
  TRANSITION_DELAY_BOUNDS,
  TRANSITION_EASING_OPTIONS,
  computeAutoBrandInsetX,
  getPresetSettings,
  resetPresetSettings,
  setPresetSettings,
  AUTOPLAY_PRESETS,
  matchAutoplayPreset,
  type PresetSettings,
  type TransitionEasingChoice,
} from '../slides/presetSettings';
import { SlidePreview } from '../slides/components/SlidePreview';
import { makeSlide } from '../builder/draftDeck';
import { Field, SelectField } from '../builder/FormPrimitives';
import { EXPORT_FORMATS, runExport, type ExportFormat } from '../slides/export';
import { downloadSlideTypesArtifact } from '../slides/exportSchemas';
import { SLIDE_CONTRACTS_VERSION } from '../slides/contracts';
import {
  DEFAULT_VALIDATION_MODE,
  getValidationMode,
  setValidationMode,
  type ValidationMode,
} from '../slides/validationMode';
import { linearSlides, deck, validationMode as activeValidationMode, slideContractIssues } from '../slides/loader';

// Visual icon per format — keeps the menu scannable.
const FORMAT_ICON: Record<ExportFormat, typeof FileText> = {
  'pdf-rgb':  FileText,
  'pdf-cmyk': Layers,
  'svg':      FileCode2,
  'png':      FileImage,
  'jpg':      FileImage,
};

const RULE_COLOR_OPTIONS = [
  { value: 'gold' as const,   label: 'Gold (default)' },
  { value: 'cream' as const,  label: 'Cream' },
  { value: 'ember' as const,  label: 'Ember' },
  { value: 'border' as const, label: 'Neutral border' },
];

const BODY_FONT_OPTIONS = [
  { value: 'inter' as const,  label: 'Inter (default)' },
  { value: 'ubuntu' as const, label: 'Ubuntu' },
];

const BODY_ALIGNMENT_OPTIONS = [
  { value: 'centered' as const,        label: 'Centered (default) — body grid sits in the middle of the viewport' },
  { value: 'header-anchored' as const, label: 'Header-anchored — body grid left edge aligns with the logo' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<PresetSettings>(() => getPresetSettings());
  // v0.123 — per-format busy flag so users can't double-click while a
  // multi-slide raster export is iterating downloads.
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  // v0.133 — chosen validation mode. Persists immediately, but takes
  // effect on the next reload because `loader.ts` runs validation once at
  // module-init. We display both the *pending* (just-clicked) value and
  // the *active* value (`activeValidationMode` from loader) so the user
  // can tell when a reload is required to apply the change.
  const [pendingValidationMode, setPendingValidationMode] = useState<ValidationMode>(() => getValidationMode());
  const validationModeDirty = pendingValidationMode !== activeValidationMode;

  const handleExport = async (format: ExportFormat) => {
    if (exportingFormat) return;
    setExportingFormat(format);
    try {
      await runExport(format);
    } finally {
      setExportingFormat(null);
    }
  };

  // A representative body slide for the preview. Memoised because makeSlide
  // does a deep clone of schema defaults; we don't need that on every render.
  const previewSlide = useMemo(() => makeSlide('CapsuleListSlide', 1, 'premium'), []);
  const previewTitleSlide = useMemo(() => makeSlide('TitleSlide', 1, 'premium'), []);

  // Single update path: patch state + persist + re-stamp CSS vars.
  const update = (patch: Partial<PresetSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      setPresetSettings(next);
      return next;
    });
  };

  const handleReset = () => {
    resetPresetSettings();
    setSettings(DEFAULT_PRESET_SETTINGS);
    toast.success('Reset to defaults');
  };

  const isDirty =
    settings.titleScale    !== DEFAULT_PRESET_SETTINGS.titleScale    ||
    settings.ruleThickness !== DEFAULT_PRESET_SETTINGS.ruleThickness ||
    settings.ruleColor     !== DEFAULT_PRESET_SETTINGS.ruleColor     ||
    settings.bodyFont      !== DEFAULT_PRESET_SETTINGS.bodyFont      ||
    settings.bodyAlignment !== DEFAULT_PRESET_SETTINGS.bodyAlignment ||
    settings.bodyGridNudge !== DEFAULT_PRESET_SETTINGS.bodyGridNudge ||
    settings.showDotPagination  !== DEFAULT_PRESET_SETTINGS.showDotPagination ||
    settings.dotPaginationMaxBeforeCollapse !== DEFAULT_PRESET_SETTINGS.dotPaginationMaxBeforeCollapse ||
    settings.dotPaginationNeighbors !== DEFAULT_PRESET_SETTINGS.dotPaginationNeighbors ||
    settings.showAlignmentGuide !== DEFAULT_PRESET_SETTINGS.showAlignmentGuide ||
    settings.showAlignmentTargets !== DEFAULT_PRESET_SETTINGS.showAlignmentTargets ||
    settings.pixelSnap !== DEFAULT_PRESET_SETTINGS.pixelSnap ||
    settings.hideAlignmentGuideOnExport !== DEFAULT_PRESET_SETTINGS.hideAlignmentGuideOnExport ||
    settings.logoScale     !== DEFAULT_PRESET_SETTINGS.logoScale     ||
    settings.brandInsetX   !== DEFAULT_PRESET_SETTINGS.brandInsetX   ||
    settings.autoInsetFromLogo !== DEFAULT_PRESET_SETTINGS.autoInsetFromLogo ||
    settings.handoutShowSlideNumbers     !== DEFAULT_PRESET_SETTINGS.handoutShowSlideNumbers ||
    settings.handoutPresenterName        !== DEFAULT_PRESET_SETTINGS.handoutPresenterName ||
    settings.handoutConfidentialityLabel !== DEFAULT_PRESET_SETTINGS.handoutConfidentialityLabel ||
    settings.handoutShowCover            !== DEFAULT_PRESET_SETTINGS.handoutShowCover ||
    settings.handoutCoverSubtitle        !== DEFAULT_PRESET_SETTINGS.handoutCoverSubtitle ||
    settings.autoplayHoldMs              !== DEFAULT_PRESET_SETTINGS.autoplayHoldMs ||
    settings.autoplayTickMs              !== DEFAULT_PRESET_SETTINGS.autoplayTickMs ||
    settings.transitionDurationMs        !== DEFAULT_PRESET_SETTINGS.transitionDurationMs ||
    settings.transitionDelayMs           !== DEFAULT_PRESET_SETTINGS.transitionDelayMs ||
    settings.transitionEasing            !== DEFAULT_PRESET_SETTINGS.transitionEasing ||
    settings.logoOffsetX                 !== DEFAULT_PRESET_SETTINGS.logoOffsetX ||
    settings.logoOffsetY                 !== DEFAULT_PRESET_SETTINGS.logoOffsetY ||
    settings.chipOffsetX                 !== DEFAULT_PRESET_SETTINGS.chipOffsetX ||
    settings.chipOffsetY                 !== DEFAULT_PRESET_SETTINGS.chipOffsetY ||
    settings.stepTimelineShiftX          !== DEFAULT_PRESET_SETTINGS.stepTimelineShiftX ||
    settings.stepNumberSize3dRatio       !== DEFAULT_PRESET_SETTINGS.stepNumberSize3dRatio;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---- Top bar ---- */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-14 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/1" className="lift-hover-subtle inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back to deck
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <h1 className="text-sm font-medium tracking-wide">Preset settings</h1>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={!isDirty}
                onClick={handleReset}
                className="lift-hover-subtle text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset to defaults
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset every setting on this page back to its built-in default.</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-10 space-y-12">
        {/* ====== Export deck (v0.123) ======
            Five formats, ordered by likely use: PDF (RGB) for sharing,
            PDF (CMYK-safe) for print shops, then vector SVG, PNG, JPG. The
            grid is keyboard-navigable and announces the active export via
            toast. PDF flows open the existing /handout route in a new tab;
            vector + raster flows render via an off-screen iframe. */}
        <section aria-labelledby="export-heading" className="space-y-5">
          <div className="space-y-2 max-w-2xl">
            <p className="slide-eyebrow !text-[0.7rem]">EXPORT DECK</p>
            <h2 id="export-heading" className="font-display font-bold text-3xl text-title-cream tracking-tight leading-tight">
              One-click export, five formats.
            </h2>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Export <span className="text-gold">{deck.deckName}</span> ({linearSlides.length} slides) as a print-ready
              PDF, or as one file per slide in vector or raster formats. Animations are frozen
              on their final state for every export so handouts stay clean.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXPORT_FORMATS.map((fmt) => {
              const Icon = FORMAT_ICON[fmt.id];
              const busy = exportingFormat === fmt.id;
              const otherBusy = exportingFormat !== null && !busy;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => handleExport(fmt.id)}
                  disabled={busy || otherBusy}
                  aria-label={`${fmt.label} — ${fmt.description ?? 'export the deck in this format'}`}
                  className="group relative flex flex-col items-start gap-2 text-left rounded-xl border border-border bg-surface-1/40 hover:bg-surface-1/70 hover:border-gold/40 transition p-4 disabled:opacity-50 disabled:cursor-not-allowed lift-hover-subtle"
                >
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gold/15 transition">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{fmt.label}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {fmt.combinedOutput ? '1 file' : `${linearSlides.length} files`}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/60 leading-relaxed">
                    {fmt.description}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-gold/90">
                    <Download className="h-3 w-3" />
                    {busy ? 'Exporting…' : 'Export'}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-3xl">
            <strong className="text-foreground/80">Note on CMYK.</strong> Browsers cannot emit a true ICC CMYK PDF — the
            "CMYK-safe" option pre-desaturates the deck so colours don't shift hard when an offset press converts the file.
            For a print-shop-ready CMYK PDF, run the saved file through Acrobat Pro → <em>Convert Colors</em>, or send the
            RGB PDF to your printer with explicit colour-profile instructions.
          </p>

          {/* ----- Schema artifact (v0.132) -----
              Machine-derived JSON Schema of every per-slideType `content`
              contract, exported from the same zod source the runtime uses
              for boot-time validation. One file, versioned, drop-in for
              external editors and CI lints. */}
          <div className="rounded-xl border border-gold/30 bg-surface-1/40 p-4 flex items-start gap-4 max-w-3xl">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold shrink-0">
              <FileCode2 className="h-4 w-4" />
            </span>
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                Slide-types JSON Schema · <code className="font-mono text-gold">slide-types.v{SLIDE_CONTRACTS_VERSION}.json</code>
              </p>
              <p className="text-[11px] text-foreground/65 leading-relaxed">
                Per-slideType <code className="font-mono">content</code> contracts (TitleSlide, StepTimelineSlide,
                MetricGridSlide, …) machine-derived from the runtime zod schemas. Use it in your deck editor for
                autocomplete, or in CI with <code className="font-mono">ajv validate</code>. The version bumps
                whenever any contract changes shape, so caches can detect upgrades automatically.
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const filename = downloadSlideTypesArtifact();
                    toast.success(`Saved ${filename}`);
                  }}
                  className="shrink-0"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Download a JSON Schema describing every slide type's content contract.</TooltipContent>
            </Tooltip>
          </div>
        </section>

        {/* ====== Validation mode (v0.133) ======
            Picks how the loader reacts to per-slide contract violations.
            "Warn" (default) renders the deck and surfaces issues via the
            ContractIssuesOverlay; "Strict" throws at boot so a broken deck
            never reaches an audience. Persisted in localStorage; takes
            effect on next reload because validation runs at module-init.
            URL override `?validation=strict|warn` wins per page-load. */}
        <section aria-labelledby="validation-heading" className="space-y-5">
          <div className="space-y-2 max-w-2xl">
            <p className="slide-eyebrow !text-[0.7rem]">VALIDATION MODE</p>
            <h2 id="validation-heading" className="font-display font-bold text-3xl text-title-cream tracking-tight leading-tight">
              Strict or forgiving?
            </h2>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Choose how the loader reacts when a slide fails its per-type contract.
              Active this load: <span className="font-mono text-gold">{activeValidationMode}</span>
              {slideContractIssues.length > 0 && (
                <> · {slideContractIssues.length} issue{slideContractIssues.length === 1 ? '' : 's'} detected</>
              )}.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl">
            {(['warn', 'strict'] as const).map((mode) => {
              const selected = pendingValidationMode === mode;
              const isStrict = mode === 'strict';
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setPendingValidationMode(mode);
                    setValidationMode(mode);
                  }}
                  aria-pressed={selected}
                  className={`text-left rounded-xl border p-4 transition lift-hover-subtle ${
                    selected
                      ? 'border-gold bg-gold/10'
                      : 'border-border bg-surface-1/40 hover:bg-surface-1/70 hover:border-gold/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                        isStrict ? 'bg-destructive/15 text-destructive' : 'bg-gold/10 text-gold'
                      }`}
                    >
                      {isStrict ? <AlertTriangle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {isStrict ? 'Strict — fail fast' : 'Warn — render anyway'}
                    </span>
                    {selected && (
                      <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-gold">Selected</span>
                    )}
                  </div>
                  <p className="text-[11px] text-foreground/65 leading-relaxed">
                    {isStrict
                      ? 'Loader throws an aggregated error at boot if any slide violates its contract. The React tree never mounts. Use this for production / handoff so a broken slide can never reach an audience.'
                      : 'Issues are collected, console-warned, and shown in the on-screen Contract Issues overlay — but the deck still renders. Best for authoring.'}
                  </p>
                </button>
              );
            })}
          </div>

          {validationModeDirty && (
            <div className="flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/5 px-3 py-2 max-w-3xl">
              <AlertTriangle className="h-4 w-4 text-gold shrink-0" />
              <p className="text-[12px] text-foreground/80 leading-relaxed flex-1">
                Saved. The new mode (<span className="font-mono text-gold">{pendingValidationMode}</span>) takes effect
                on the next reload — validation runs once at module-init.
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="shrink-0">
                    Reload now
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Reload the page so the new validation mode takes effect immediately.</TooltipContent>
              </Tooltip>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-3xl">
            <strong className="text-foreground/80">URL override.</strong> Append
            <code className="font-mono text-gold"> ?validation=strict</code> or
            <code className="font-mono text-gold"> ?validation=warn</code> to any deck URL to force a mode for one
            page-load without changing the persisted setting. Default mode is
            <span className="font-mono text-gold"> {DEFAULT_VALIDATION_MODE}</span>.
          </p>
        </section>

        {/* ====== Deck transition timing (v0.167) ======
            Sets the deck-wide entrance/exit timing for every slide in one
            place. Each field is independently nullable: leaving any of the
            three sliders/select on "Use deck default" lets the deck JSON
            (or the built-in 550ms expo-out) win for that field. Per-slide
            `content.transitionTiming` still wins over these — this panel
            is the second-most-specific level. Live-applied: the next
            navigation already uses the new timing. */}
        <section aria-labelledby="transition-heading" className="space-y-5">
          <div className="space-y-2 max-w-2xl">
            <p className="slide-eyebrow !text-[0.7rem]">DECK TRANSITION TIMING</p>
            <h2 id="transition-heading" className="font-display font-bold text-3xl text-title-cream tracking-tight leading-tight">
              One cadence, every slide.
            </h2>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Pin the duration, delay, and easing curve used by every slide's entrance and exit animation.
              Per-slide overrides in the deck JSON still win for any field that needs a bespoke beat.
              Built-in default is <span className="font-mono text-gold">550ms · 0ms · expoOut</span>.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl rounded-xl border border-border bg-surface-1/30 p-5">
            {/* Duration */}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-baseline justify-between">
                <label htmlFor="transition-duration" className="text-xs font-semibold uppercase tracking-[0.18em] text-gold flex items-center gap-1.5">
                  <Gauge className="h-3 w-3" /> Transition duration
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {settings.transitionDurationMs === null
                    ? 'Use deck default'
                    : `${settings.transitionDurationMs}ms`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="transition-duration"
                  type="range"
                  min={TRANSITION_DURATION_BOUNDS.min}
                  max={TRANSITION_DURATION_BOUNDS.max}
                  step={TRANSITION_DURATION_BOUNDS.step}
                  value={settings.transitionDurationMs ?? 550}
                  onChange={e => update({ transitionDurationMs: Number(e.target.value) })}
                  className="flex-1 accent-gold cursor-pointer"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => update({ transitionDurationMs: null })}
                      disabled={settings.transitionDurationMs === null}
                      className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground shrink-0"
                    >
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Clear this override so the deck JSON (or built-in 550ms default) wins again.</TooltipContent>
                </Tooltip>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Total length of every slide's enter + exit animation. Range {TRANSITION_DURATION_BOUNDS.min}–{TRANSITION_DURATION_BOUNDS.max}ms.
                Snappy decks: 250–400ms. Cinematic decks: 800–1200ms.
              </p>
            </div>

            {/* Delay */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label htmlFor="transition-delay" className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Delay
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {settings.transitionDelayMs === null ? 'default' : `${settings.transitionDelayMs}ms`}
                </span>
              </div>
              <input
                id="transition-delay"
                type="range"
                min={TRANSITION_DELAY_BOUNDS.min}
                max={TRANSITION_DELAY_BOUNDS.max}
                step={TRANSITION_DELAY_BOUNDS.step}
                value={settings.transitionDelayMs ?? 0}
                onChange={e => update({ transitionDelayMs: Number(e.target.value) })}
                className="w-full accent-gold cursor-pointer"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => update({ transitionDelayMs: null })}
                    disabled={settings.transitionDelayMs === null}
                    className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Reset to deck default
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Clear this override so the deck JSON (or built-in 0ms default) wins again.</TooltipContent>
              </Tooltip>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Pre-animation hold. Useful when a deck needs a beat of darkness between slides.
              </p>
            </div>

            {/* Easing */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label htmlFor="transition-easing" className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Easing
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {settings.transitionEasing ?? 'default'}
                </span>
              </div>
              <select
                id="transition-easing"
                value={settings.transitionEasing ?? ''}
                onChange={e => update({ transitionEasing: e.target.value === '' ? null : e.target.value as TransitionEasingChoice })}
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm font-mono text-foreground focus:outline-none focus:border-gold/60"
              >
                <option value="">Use deck default</option>
                {TRANSITION_EASING_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Curve shape. <span className="text-gold">expoOut</span> is the built-in default — fast acceleration,
                soft landing. <span className="text-gold">backOut</span> overshoots slightly for a punchy finish.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-3xl">
            <strong className="text-foreground/80">Precedence.</strong> Per-slide
            <code className="font-mono text-gold"> content.transitionTiming </code>
            in the deck JSON wins over this panel for any field it pins. Use the panel as the
            global default and override only the slides that need a bespoke beat.
          </p>
        </section>

        <section className="space-y-2 max-w-2xl mb-10">
          <p className="slide-eyebrow !text-[0.7rem]">PREMIUM PRESET — TUNING</p>
          <h2 className="font-display font-bold text-3xl text-title-cream tracking-tight leading-tight">
            Tune the look for every deck.
          </h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            These settings override the defaults baked into the preset. They apply globally
            to every deck you open (existing and new). Saved automatically — no apply button.
          </p>
        </section>

        <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-10">
          {/* ----- Form ----- */}
          <div className="space-y-7">
            {/* Title scale */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Title size
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {(settings.titleScale * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={TITLE_SCALE_BOUNDS.min}
                max={TITLE_SCALE_BOUNDS.max}
                step={TITLE_SCALE_BOUNDS.step}
                value={settings.titleScale}
                onChange={e => update({ titleScale: Number(e.target.value) })}
                className="w-full accent-gold cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Multiplies the clamp() ranges on .slide-title-display and .slide-title-content.
                Default 100% = clamp(2.5rem, 6vw, 6rem) for hero titles.
              </p>
            </div>

            {/* Brand logo size — v0.89. Scales the BrandHeader wordmark and
                presenter chip avatar. Default 0.85 (= the "−15% smaller"
                v0.88 treatment). Drives `--brand-logo-scale` on <html>. */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Brand logo size
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {(settings.logoScale * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={LOGO_SCALE_BOUNDS.min}
                max={LOGO_SCALE_BOUNDS.max}
                step={LOGO_SCALE_BOUNDS.step}
                value={settings.logoScale}
                onChange={e => update({ logoScale: Number(e.target.value) })}
                className="w-full accent-gold cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Scales the Riseup Asia wordmark and presenter chip avatar across every slide.
                Default 85% = the −15% smaller treatment that ships with v0.88's bracketed inset.
                100% = original full-size logo (64px tall). Applies live on every slide and in builder previews.
              </p>
            </div>

            {/* Brand inset (logo + presenter chip) — v0.128 / v0.129.
                One slider drives both the left padding of the wordmark AND
                the right padding of the presenter chip via the shared
                `--brand-inset-x` token (see spec 47). When the auto-coupling
                toggle below is ON (default), the inset re-derives from
                `logoScale` so resizing the logo automatically restores the
                optical alignment instead of leaving the inset stale. */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Brand inset (logo ↔ chip)
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {settings.autoInsetFromLogo
                    ? `${computeAutoBrandInsetX(settings.logoScale)}px (auto)`
                    : `${settings.brandInsetX}px`}
                </span>
              </div>
              <input
                type="range"
                min={BRAND_INSET_X_BOUNDS.min}
                max={BRAND_INSET_X_BOUNDS.max}
                step={BRAND_INSET_X_BOUNDS.step}
                value={settings.autoInsetFromLogo ? computeAutoBrandInsetX(settings.logoScale) : settings.brandInsetX}
                onChange={e => update({ brandInsetX: Number(e.target.value), autoInsetFromLogo: false })}
                className="w-full accent-gold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={settings.autoInsetFromLogo}
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Shared <code className="font-mono text-gold">--brand-inset-x</code> token.
                Drives the logo's left padding AND mirrors it as the presenter chip's right
                padding, so the two stay symmetric across the header. When body alignment is
                <span className="text-gold"> Header-anchored</span>, the body grid's left
                edge tracks this same value. 48px floor enforced via <code className="font-mono">max()</code>
                so the logo stays on-canvas on phones. Dragging this slider auto-disables
                the coupling below.
              </p>

              {/* Auto-coupling toggle — when ON, the inset above is computed
                  from `logoScale` via the v0.94 anchor (218px @ 0.85), so
                  shrinking or enlarging the logo automatically re-applies
                  the correct alignment. When OFF, the slider is freed up. */}
              <label className="flex items-start gap-3 cursor-pointer group pt-2">
                <input
                  type="checkbox"
                  checked={settings.autoInsetFromLogo}
                  onChange={e => update({ autoInsetFromLogo: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-gold cursor-pointer"
                />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold group-hover:text-gold/80">
                    Auto-adjust inset to logo size
                  </span>
                  <span className="block text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Couples the brand inset to the logo size via
                    <code className="font-mono text-gold"> inset = round(218 × logoScale ÷ 0.85)</code>.
                    At 100% logo → 256px inset; at 60% → 154px. Keeps the optical
                    rhythm constant as you scale. Turn off to drive the inset manually.
                  </span>
                </span>
              </label>
            </div>

            {/* ===== v0.210 — Fine-tune nudges =====
                Five live sliders for pixel-perfect alignment without touching
                code. Each writes a CSS var consumed by BrandHeader (logo+chip
                transforms) or StepTimelineSlide (header transform). Range
                ±80px, 1px steps. Resets via "Reset to defaults" up top. */}
            {([
              { key: 'logoOffsetX',        label: 'Logo X offset',           hint: 'Translate the BrandHeader logo horizontally. Negative = left.' },
              { key: 'logoOffsetY',        label: 'Logo Y offset',           hint: 'Translate the BrandHeader logo vertically. Negative = up.' },
              { key: 'chipOffsetX',        label: 'Presenter chip X offset', hint: 'Translate the right-side presenter pill horizontally. Negative = left.' },
              { key: 'chipOffsetY',        label: 'Presenter chip Y offset', hint: 'Translate the right-side presenter pill vertically. Negative = up.' },
              { key: 'stepTimelineShiftX', label: 'Step-timeline shift X',   hint: 'Translate the StepTimeline header (eyebrow + title + steps). Negative = left.' },
            ] as const).map(({ key, label, hint }) => {
              const val = settings[key] as number;
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{label}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {val > 0 ? `+${val}` : val}px
                      </span>
                      {val !== 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => update({ [key]: 0 } as Partial<PresetSettings>)}
                              className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-gold transition"
                            >
                              Reset
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{`Reset ${label} back to 0px (no nudge).`}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={NUDGE_OFFSET_BOUNDS.min}
                    max={NUDGE_OFFSET_BOUNDS.max}
                    step={NUDGE_OFFSET_BOUNDS.step}
                    value={val}
                    onChange={e => update({ [key]: Number(e.target.value) } as Partial<PresetSettings>)}
                    className="w-full accent-gold cursor-pointer"
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>
                </div>
              );
            })}

            {/* ===== v0.211 — StepsChain3D top-marker scale =====
                Live ratio of the slide-3 base marker size. 0.5 = the v0.210
                hard-coded default (≈48px). 1.0 = same as slide 3. */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Steps 3D — number size
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {Math.round(settings.stepNumberSize3dRatio * 100)}%
                  </span>
                  {settings.stepNumberSize3dRatio !== DEFAULT_PRESET_SETTINGS.stepNumberSize3dRatio && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => update({ stepNumberSize3dRatio: DEFAULT_PRESET_SETTINGS.stepNumberSize3dRatio })}
                          className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-gold transition"
                        >
                          Reset
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Reset Steps 3D number size to 50% (default).</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={STEP_NUMBER_SIZE_3D_RATIO_BOUNDS.min}
                max={STEP_NUMBER_SIZE_3D_RATIO_BOUNDS.max}
                step={STEP_NUMBER_SIZE_3D_RATIO_BOUNDS.step}
                value={settings.stepNumberSize3dRatio}
                onChange={e => update({ stepNumberSize3dRatio: Number(e.target.value) })}
                className="w-full accent-gold cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Scales the top numeric markers on the StepsChain3D slide
                (slide 4) as a ratio of slide 3's marker size. 50% = default;
                100% = same size as slide 3.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Rule thickness
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {settings.ruleThickness}px {settings.ruleThickness === 0 && '(hidden)'}
                </span>
              </div>
              <input
                type="range"
                min={RULE_THICKNESS_BOUNDS.min}
                max={RULE_THICKNESS_BOUNDS.max}
                step={RULE_THICKNESS_BOUNDS.step}
                value={settings.ruleThickness}
                onChange={e => update({ ruleThickness: Number(e.target.value) })}
                className="w-full accent-gold cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Thickness of the brand-strip bottom rule. 0 hides it entirely.
              </p>
            </div>

            {/* Rule color */}
            <SelectField
              label="Rule color"
              value={settings.ruleColor}
              options={RULE_COLOR_OPTIONS}
              onChange={v => update({ ruleColor: v })}
              hint="Token name from the active theme palette."
            />

            {/* Body font */}
            <SelectField
              label="Body font"
              value={settings.bodyFont}
              options={BODY_FONT_OPTIONS}
              onChange={v => update({ bodyFont: v })}
              hint="Affects subtitles. Titles always stay Ubuntu Bold."
            />

            {/* Body grid alignment (spec 34) */}
            <SelectField
              label="Body grid alignment"
              value={settings.bodyAlignment}
              options={BODY_ALIGNMENT_OPTIONS}
              onChange={v => update({ bodyAlignment: v })}
              hint="Header-anchored keeps the body's left edge in line with the RiseupAsia logo on wide screens. The 1440px max-width still caps the column so it never stretches absurdly wide."
            />

            {/* Body grid nudge (spec 34 — fine-tuning) */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Body grid nudge
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  +{settings.bodyGridNudge}px
                </span>
              </div>
              <input
                type="range"
                min={BODY_GRID_NUDGE_BOUNDS.min}
                max={BODY_GRID_NUDGE_BOUNDS.max}
                step={BODY_GRID_NUDGE_BOUNDS.step}
                value={settings.bodyGridNudge}
                onChange={e => update({ bodyGridNudge: Number(e.target.value) })}
                disabled={settings.bodyAlignment !== 'header-anchored'}
                className="w-full accent-gold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Extra px added to the body-grid left margin (timeline rail + title block).
                Use 1–5px to dial in the exact offset from the logo. Only active when
                alignment is set to <span className="text-gold">Header-anchored</span>.
                <br />
                <span className="text-foreground/50">
                  Responsive: scales to ~30% on mobile (≤640px), ~60% on tablet, 100% on
                  desktop (≥1280px) so the offset never reads as "off by a pixel" on
                  small screens.
                </span>
              </p>
            </div>

            {/* Dot pagination toggle */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.showDotPagination}
                  onChange={e => update({ showDotPagination: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-gold cursor-pointer"
                />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold group-hover:text-gold/80">
                    Show dot pagination
                  </span>
                  <span className="block text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Bottom-center row of dots, one per slide. Active dot is an elongated gold
                    pill. Click any dot to jump there. Off by default.
                  </span>
                </span>
              </label>
            </div>

            {/* Dot pagination ellipsis windowing (spec 27/05) */}
            {settings.showDotPagination && (
              <div className="grid grid-cols-2 gap-4 pl-7">
                <label className="space-y-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gold/90">
                    Collapse above
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={99}
                    value={settings.dotPaginationMaxBeforeCollapse}
                    onChange={e => update({ dotPaginationMaxBeforeCollapse: Math.max(5, Math.min(99, Number(e.target.value) || 5)) })}
                    className="w-full rounded-md bg-muted/40 border border-border px-2 py-1 text-sm text-foreground"
                  />
                  <span className="block text-[10px] text-muted-foreground">Slides before `1 … cur±n … N`.</span>
                </label>
                <label className="space-y-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gold/90">
                    Neighbors
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={settings.dotPaginationNeighbors}
                    onChange={e => update({ dotPaginationNeighbors: Math.max(1, Math.min(5, Number(e.target.value) || 1)) })}
                    className="w-full rounded-md bg-muted/40 border border-border px-2 py-1 text-sm text-foreground"
                  />
                  <span className="block text-[10px] text-muted-foreground">Dots shown each side of current.</span>
                </label>
              </div>
            )}



            {/* Alignment guide overlay (spec 35) */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.showAlignmentGuide}
                  onChange={e => update({ showAlignmentGuide: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-gold cursor-pointer"
                />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold group-hover:text-gold/80">
                    Alignment guide (debug)
                  </span>
                  <span className="block text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Draws two vertical dashed lines — gold at the BrandHeader logo's left edge,
                    cream at the body grid's left edge — plus a HUD with both x-positions and
                    the delta. Use this to pixel-check "header-anchored" body alignment. Pure
                    debug; turn off before presenting.
                  </span>
                </span>
              </label>
            </div>

            {/* Alignment TARGETS — red-box overlay (v0.205) */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.showAlignmentTargets}
                  onChange={e => update({ showAlignmentTargets: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-gold cursor-pointer"
                />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] group-hover:opacity-80" style={{ color: 'hsl(0 80% 55%)' }}>
                    Alignment targets (red boxes)
                  </span>
                  <span className="block text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Paints translucent RED boxes for the desired logo + presenter chip
                    positions (the spec 3 "move logo down/left, push chip right/down" pass).
                    Independent of the live guides — turn both on while dragging to see the
                    current AND target positions side-by-side. Also exposed inline on the
                    /builder editor's Live Preview header.
                  </span>
                </span>
              </label>
            </div>

            {/* Pixel Snap preview mode (v0.206) */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.pixelSnap}
                  onChange={e => update({ pixelSnap: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-cream cursor-pointer"
                />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-cream group-hover:text-cream/80">
                    Pixel Snap (measurement mode)
                  </span>
                  <span className="block text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Freezes every CSS + Framer animation on its final keyframe and snaps the
                    BrandHeader logo + presenter chip to whole-pixel offsets. Use with the
                    Guides + Targets overlays to verify exact step-timeline rail, eyebrow,
                    and title alignment without sub-pixel jitter or in-flight motion. Adds
                    a thin gold rule under the header so the mode is visible at a glance.
                  </span>
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.hideAlignmentGuideOnExport}
                  onChange={e => update({ hideAlignmentGuideOnExport: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-gold cursor-pointer"
                />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold group-hover:text-gold/80">
                    Hide guides on export
                  </span>
                  <span className="block text-[11px] text-muted-foreground leading-relaxed mt-1">
                    When you export the deck as JSON, alignment guides are temporarily
                    suppressed so they don't sneak into screenshots or screen recordings
                    captured around the export action. Restored automatically ~1.5s later.
                    Print/PDF capture also drops the guides via <code className="font-mono text-gold">@media print</code>.
                  </span>
                </span>
              </label>
            </div>

            {/* v0.156 — Handout footer customisation. Three independent
                fields rendered together as one logical group; each one's
                empty/off state hides its zone in the exported PDF. Lives
                in this column because it's a global preset (applies to
                every deck the user opens), not a per-slide knob. */}
            <div className="rounded-lg border border-border bg-surface-1/30 p-4 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Handout footer</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  Three optional zones rendered at the bottom of every page in <code className="font-mono text-gold">/handout</code> exports. All independent — leave any one empty to hide it.
                </p>
              </div>

              {/* Slide numbers — toggle */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.handoutShowSlideNumbers}
                  onChange={e => update({ handoutShowSlideNumbers: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-gold cursor-pointer"
                />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground group-hover:text-gold/90">
                    Show slide numbers
                  </span>
                  <span className="block text-[11px] text-muted-foreground leading-relaxed mt-1">
                    "01 / 24" badge bottom-right of every page.
                  </span>
                </span>
              </label>

              {/* Presenter name — text input */}
              <div className="space-y-1.5">
                <label htmlFor="handout-presenter-name" className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  Presenter byline
                </label>
                <input
                  id="handout-presenter-name"
                  type="text"
                  value={settings.handoutPresenterName}
                  onChange={e => update({ handoutPresenterName: e.target.value })}
                  placeholder="e.g. MD ALIM UL KARIM · Riseup Asia"
                  maxLength={80}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/60"
                />
                <p className="text-[10px] text-muted-foreground">Bottom-left of every page. Leave empty to hide.</p>
              </div>

              {/* Confidentiality label — text input */}
              <div className="space-y-1.5">
                <label htmlFor="handout-confidentiality" className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  Confidentiality label
                </label>
                <input
                  id="handout-confidentiality"
                  type="text"
                  value={settings.handoutConfidentialityLabel}
                  onChange={e => update({ handoutConfidentialityLabel: e.target.value })}
                  placeholder="e.g. Confidential · Internal Only · Draft"
                  maxLength={40}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/60"
                />
                <p className="text-[10px] text-muted-foreground">Bottom-center, gold uppercase chip. Leave empty to hide.</p>
              </div>

              {/* v0.157 — Cover page toggle + optional subtitle */}
              <label className="flex items-start gap-3 cursor-pointer group pt-2 border-t border-border/40">
                <input
                  type="checkbox"
                  checked={settings.handoutShowCover}
                  onChange={e => update({ handoutShowCover: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-gold cursor-pointer"
                />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground group-hover:text-gold/90">
                    Show cover page
                  </span>
                  <span className="block text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Adds a title page before slide 01 with the deck name, presenter byline (above), and today's date.
                  </span>
                </span>
              </label>

              <div className="space-y-1.5">
                <label htmlFor="handout-cover-subtitle" className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  Cover subtitle
                </label>
                <input
                  id="handout-cover-subtitle"
                  type="text"
                  value={settings.handoutCoverSubtitle}
                  onChange={e => update({ handoutCoverSubtitle: e.target.value })}
                  placeholder="e.g. Q4 Investor Briefing"
                  maxLength={80}
                  disabled={!settings.handoutShowCover}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/60 disabled:opacity-40"
                />
                <p className="text-[10px] text-muted-foreground">Optional tagline under the deck title. Leave empty to hide.</p>
              </div>

              {/* v0.172 — Live preview of the rendered footer bar. Mirrors
                  the three-zone layout + typography used in HandoutPage so
                  authors can see byline / confidentiality / slide-number
                  formatting update as they type, without exporting. Empty
                  zones show a dim "(hidden)" placeholder so the layout
                  intent stays visible even when a field is blank. */}
              <div className="space-y-2 pt-3 border-t border-border/40">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Live preview
                </p>
                <div className="rounded-md border border-border/60 bg-background/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/55 truncate">
                      {settings.handoutPresenterName || (
                        <span className="text-muted-foreground/40 italic normal-case tracking-normal">(byline hidden)</span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-gold/70 text-center truncate">
                      {settings.handoutConfidentialityLabel || (
                        <span className="text-muted-foreground/40 italic normal-case tracking-normal">(confidentiality hidden)</span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.3em] text-foreground/40 whitespace-nowrap">
                      {settings.handoutShowSlideNumbers ? '01 / 24' : (
                        <span className="text-muted-foreground/40 italic normal-case tracking-normal">(numbers off)</span>
                      )}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Mirrors the footer rendered on every page in <code className="font-mono text-gold">/handout</code>.
                </p>
              </div>
            </div>

            {/* v0.159 — Press-and-hold Enter autoplay timing. Three discrete
                presets cover common pacing needs without overwhelming the
                user with raw sliders. The keydown handler in SlideDeckPage
                live-reads these via subscribePresetSettings. */}
            <div className="rounded-lg border border-border bg-surface-1/30 p-4 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Hold-Enter autoplay</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  When you press and hold <kbd className="font-mono text-gold">Enter</kbd>, the deck waits a moment then auto-advances every tick. Pick the rhythm that matches your pacing.
                </p>
              </div>
              <div role="radiogroup" aria-label="Autoplay timing preset" className="grid grid-cols-1 gap-2">
                {AUTOPLAY_PRESETS.map(p => {
                  const active = matchAutoplayPreset(settings.autoplayHoldMs, settings.autoplayTickMs) === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => update({ autoplayHoldMs: p.holdMs, autoplayTickMs: p.tickMs })}
                      className={[
                        'text-left rounded-md border px-3 py-2.5 transition-colors',
                        active
                          ? 'border-gold/70 bg-gold/10 text-foreground'
                          : 'border-border bg-background hover:border-gold/40 hover:bg-surface-2/40 text-foreground/85',
                      ].join(' ')}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{p.label}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          hold {p.holdMs}ms · tick {p.tickMs}ms
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{p.blurb}</p>
                    </button>
                  );
                })}
              </div>
              {matchAutoplayPreset(settings.autoplayHoldMs, settings.autoplayTickMs) === null && (
                <p className="text-[10px] text-ember">
                  Custom timing active — hold {settings.autoplayHoldMs}ms · tick {settings.autoplayTickMs}ms. Pick a preset above to snap back.
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="rounded-lg border border-border bg-surface-1/30 p-4 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Scope</p>
              <p className="text-[12px] text-foreground/70 leading-relaxed">
                Settings live in localStorage (<code className="font-mono text-gold">riseup.presetSettings.v1</code>) and
                apply as CSS vars on <code className="font-mono">&lt;html&gt;</code>. No deck JSON is modified.
              </p>
            </div>
          </div>

          {/* ----- Live preview ----- */}
          <div className="space-y-5">
            <Field label="Body slide preview">
              <div className="bg-surface-1/30 border border-border rounded-xl p-4 flex items-center justify-center">
                <SlidePreview slide={previewSlide} width={760} className="rounded-lg shadow-elegant" />
              </div>
            </Field>
            <Field label="Hero slide preview">
              <div className="bg-surface-1/30 border border-border rounded-xl p-4 flex items-center justify-center">
                <SlidePreview slide={previewTitleSlide} width={760} className="rounded-lg shadow-elegant" />
              </div>
            </Field>
          </div>
        </div>
      </main>
    </div>
  );
}
