import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import {
  TRANSITION_EASING_NAMES,
  TRANSITION_TYPE_NAMES,
  type TransitionEasingName,
  type TransitionTypeName,
  getTransitionOverrideState,
  resetTransitionOverrideState,
  setTransitionOverrideState,
  subscribeTransitionOverride,
} from '@/slides/transitionOverride';
import {
  BUILTIN_PRESETS,
  deleteTransitionPreset,
  getTransitionPreset,
  listTransitionPresets,
  saveTransitionPreset,
  subscribeTransitionPresets,
} from '@/slides/transitionPresets';

interface Props {
  onClose: () => void;
  onReplay: () => void;
  /**
   * Current slide number — used to default the "This slide" scope target
   * when the user flips the scope toggle. v0.185.
   */
  currentSlideNumber: number;
}

/**
 * v0.182 — Live slide-transition inspector. Drag duration, pick an easing,
 * hit Replay (or just navigate) to see the next slide transition reflect
 * the change instantly. Closing the panel clears every override (unless
 * Persist is on) so the deck snaps back to authored timing.
 *
 * v0.184 — Adds a named-preset dropdown so authors can save tuned settings
 * (e.g. "Slick Fade", "Expo Pop") and reload them across sessions.
 *
 * Routing: opened by `?inspect=transition` or `Shift+I` from SlideDeckPage.
 * Lives outside printable chrome (data-print-hide).
 */
export function TransitionInspector({ onClose, onReplay, currentSlideNumber }: Props) {
  const [state, setState] = useState(() => getTransitionOverrideState());
  const [presets, setPresets] = useState(() => listTransitionPresets());
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [savingName, setSavingName] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);
  // Which phase the duration/easing controls write to (v0.186). Exit defaults
  // to inheriting Enter; switching to "Exit" lets the user pin a separate
  // outgoing duration/easing without disturbing Enter.
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');
  const [ioMessage, setIoMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function flashIo(kind: 'ok' | 'err', text: string) {
    setIoMessage({ kind, text });
    window.setTimeout(() => setIoMessage(null), 2600);
  }

  function handleExport() {
    // Export the selected user preset if one is picked; otherwise export
    // every user-saved preset as a portable bundle. Built-ins are skipped
    // since they ship with the app and importing them would be a no-op.
    const userPresets = presets.filter((p) => !p.builtin);
    let payload: { version: 1; presets: { name: string; durationMs: number; easing: TransitionEasingName }[] };
    let filename: string;
    if (selectedPreset && !selectedIsBuiltin) {
      const p = getTransitionPreset(selectedPreset);
      if (!p) { flashIo('err', 'Preset not found'); return; }
      payload = { version: 1, presets: [{ name: p.name, durationMs: p.durationMs, easing: p.easing }] };
      filename = `transition-preset-${slugify(p.name)}.json`;
    } else {
      if (userPresets.length === 0) {
        // Fall back to exporting current live values as an unnamed preset
        payload = { version: 1, presets: [{ name: savingName.trim() || 'Custom', durationMs: duration, easing }] };
        filename = `transition-preset-${slugify(payload.presets[0].name)}.json`;
      } else {
        payload = {
          version: 1,
          presets: userPresets.map((p) => ({ name: p.name, durationMs: p.durationMs, easing: p.easing })),
        };
        filename = `transition-presets-${userPresets.length}.json`;
      }
    }
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      flashIo('ok', `Exported ${payload.presets.length} preset${payload.presets.length === 1 ? '' : 's'}`);
    } catch {
      flashIo('err', 'Export failed');
    }
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const presetsField = (parsed && typeof parsed === 'object')
        ? (parsed as Record<string, unknown>).presets
        : undefined;
      const items: unknown[] = Array.isArray(presetsField)
        ? presetsField
        : Array.isArray(parsed) ? parsed : [parsed];
      let imported = 0; let skipped = 0;
      let lastName = '';
      for (const raw of items) {
        const p = raw as Partial<TransitionPresetShape>;
        if (
          !p || typeof p.name !== 'string' || !p.name.trim()
          || typeof p.durationMs !== 'number' || p.durationMs < 0 || p.durationMs > 4000
          || typeof p.easing !== 'string'
          || !TRANSITION_EASING_NAMES.includes(p.easing as TransitionEasingName)
        ) { skipped++; continue; }
        const ok = saveTransitionPreset(p.name.trim(), p.durationMs, p.easing as TransitionEasingName);
        if (ok) { imported++; lastName = p.name.trim(); } else { skipped++; }
      }
      if (imported === 0) {
        flashIo('err', skipped ? 'No valid presets (built-in names skipped)' : 'No presets in file');
      } else {
        if (imported === 1 && lastName) {
          setSelectedPreset(lastName);
          const p = getTransitionPreset(lastName);
          if (p) setTransitionOverrideState({ durationMs: p.durationMs, easing: p.easing });
        }
        flashIo('ok', `Imported ${imported}${skipped ? ` (skipped ${skipped})` : ''}`);
      }
    } catch {
      flashIo('err', 'Invalid JSON file');
    }
  }

  useEffect(() => subscribeTransitionOverride(() => {
    setState(getTransitionOverrideState());
  }), []);

  useEffect(() => subscribeTransitionPresets(() => {
    setPresets(listTransitionPresets());
  }), []);

  const duration = state.durationMs ?? 550;
  const easing = state.easing ?? 'expoOut';

  const selectedMeta = useMemo(
    () => (selectedPreset ? getTransitionPreset(selectedPreset) : undefined),
    [selectedPreset, presets], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const selectedIsBuiltin = !!selectedMeta?.builtin
    || BUILTIN_PRESETS.some((p) => p.name === selectedPreset);

  function applyPreset(name: string) {
    setSelectedPreset(name);
    if (!name) return;
    const p = getTransitionPreset(name);
    if (!p) return;
    setTransitionOverrideState({ durationMs: p.durationMs, easing: p.easing });
  }

  function handleSave() {
    const name = savingName.trim();
    if (!name) { setSaveError('Name required'); return; }
    const ok = saveTransitionPreset(name, duration, easing);
    if (!ok) { setSaveError('Built-in name — choose another'); return; }
    setSaveError(null);
    setSavingName('');
    setSelectedPreset(name);
  }

  function handleDelete() {
    if (!selectedPreset || selectedIsBuiltin) return;
    deleteTransitionPreset(selectedPreset);
    setSelectedPreset('');
  }

  return (
    <div
      data-print-hide="true"
      className="fixed top-20 right-4 z-50 w-72 rounded-2xl border border-border/60 bg-background/85 p-4 text-foreground shadow-2xl backdrop-blur-md"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      role="dialog"
      aria-label="Slide transition inspector"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Transition
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
          aria-label="Close inspector"
        >
          ✕
        </button>
      </div>

      {/* Preset picker — built-ins + user-saved, grouped */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <label className="text-muted-foreground" htmlFor="ti-preset">Preset</label>
          {selectedPreset && !selectedIsBuiltin && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-[10px] text-muted-foreground hover:text-[hsl(var(--ember,16_77%_57%))]"
              aria-label={`Delete preset ${selectedPreset}`}
            >
              Delete
            </button>
          )}
        </div>
        <select
          id="ti-preset"
          value={selectedPreset}
          onChange={(e) => applyPreset(e.target.value)}
          className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">— Choose preset —</option>
          <optgroup label="Built-in">
            {BUILTIN_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </optgroup>
          {presets.some((p) => !p.builtin) && (
            <optgroup label="Saved">
              {presets.filter((p) => !p.builtin).map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Scope — Deck-wide vs single slide. "This slide" pins the active
          slide number; the override only fires when that slide is on stage. v0.185. */}
      <div className="mb-4">
        <div className="mb-1 text-xs text-muted-foreground">Scope</div>
        <div className="flex gap-1 rounded-md border border-border/60 bg-background/40 p-0.5">
          <button
            type="button"
            onClick={() => setTransitionOverrideState({ scope: 'deck', scopeSlideNumber: null })}
            aria-pressed={state.scope === 'deck'}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              state.scope === 'deck'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Whole deck
          </button>
          <button
            type="button"
            onClick={() => setTransitionOverrideState({
              scope: 'slide',
              scopeSlideNumber: state.scopeSlideNumber ?? currentSlideNumber,
            })}
            aria-pressed={state.scope === 'slide'}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              state.scope === 'slide'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            This slide
          </button>
        </div>
        {state.scope === 'slide' && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <label htmlFor="ti-scope-slide">Slide #</label>
            <input
              id="ti-scope-slide"
              type="number"
              min={1}
              value={state.scopeSlideNumber ?? currentSlideNumber}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setTransitionOverrideState({ scopeSlideNumber: Number.isFinite(n) && n > 0 ? n : null });
              }}
              className="w-16 rounded border border-border/60 bg-background/60 px-2 py-0.5 text-xs tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setTransitionOverrideState({ scopeSlideNumber: currentSlideNumber })}
              className="rounded border border-border/60 px-2 py-0.5 text-[10px] hover:bg-foreground/5"
              aria-label="Pin to currently visible slide"
            >
              Use current ({currentSlideNumber})
            </button>
          </div>
        )}
        {state.scope === 'slide'
          && state.scopeSlideNumber !== null
          && state.scopeSlideNumber !== currentSlideNumber && (
          <p className="mt-1 text-[10px] text-[hsl(var(--ember,16_77%_57%))]">
            Override is dormant — navigate to slide {state.scopeSlideNumber} to preview.
          </p>
        )}
      </div>

      {/* Transition type — pick which variant (Fade / Slide / Push / PushLeft /
          PushRight) plays for the slide(s) currently in scope. "Authored"
          (null) honours `slide.transition` from the deck JSON. v0.187. */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="ti-transition-type" className="text-xs text-muted-foreground">
            Transition type
          </label>
          {state.transitionType !== null && (
            <button
              type="button"
              onClick={() => setTransitionOverrideState({ transitionType: null })}
              className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              aria-label="Clear transition type override"
            >
              Clear
            </button>
          )}
        </div>
        <select
          id="ti-transition-type"
          value={state.transitionType ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setTransitionOverrideState({
              transitionType: v === '' ? null : (v as TransitionTypeName),
            });
          }}
          className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Authored (use slide JSON)</option>
          {TRANSITION_TYPE_NAMES.map((t) => (
            <option key={t} value={t}>
              {TRANSITION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {state.scope === 'deck'
            ? 'Applies to every slide.'
            : `Applies only to slide ${state.scopeSlideNumber ?? currentSlideNumber}.`}
        </p>
      </div>

      {/* Phase tabs — Enter / Exit. The duration & easing controls below
          write to whichever phase is active. Exit values fall back to Enter
          when null, so single-sided tuning still works. v0.186. */}
      <div className="mb-3">
        <div className="flex gap-1 rounded-md border border-border/60 bg-background/40 p-0.5">
          <button
            type="button"
            onClick={() => setPhase('enter')}
            aria-pressed={phase === 'enter'}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              phase === 'enter'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Enter
            {state.durationMs !== null || state.easing !== null ? (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--ember,16_77%_57%))]" aria-hidden />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setPhase('exit')}
            aria-pressed={phase === 'exit'}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              phase === 'exit'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Exit
            {state.exitDurationMs !== null || state.exitEasing !== null ? (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--ember,16_77%_57%))]" aria-hidden />
            ) : null}
          </button>
        </div>
      </div>

      {(() => {
        const isExit = phase === 'exit';
        const rawDur = isExit ? state.exitDurationMs : state.durationMs;
        const rawEase = isExit ? state.exitEasing : state.easing;
        // Display falls back so the slider always shows the *effective* value:
        // Exit unset → mirrors Enter; Enter unset → 550ms default.
        const displayDur = rawDur ?? (isExit ? state.durationMs ?? 550 : 550);
        const displayEase = rawEase ?? (isExit ? state.easing ?? 'expoOut' : 'expoOut');
        const inheriting = isExit && rawDur === null && rawEase === null;
        return (
          <>
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <label className="text-muted-foreground" htmlFor="ti-duration">
                  {isExit ? 'Exit duration' : 'Duration'}
                  {rawDur !== null && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--ember,16_77%_57%))]" aria-hidden />
                  )}
                </label>
                <span className="tabular-nums text-foreground">{displayDur} ms</span>
              </div>
              <Slider
                id="ti-duration"
                min={50}
                max={2000}
                step={10}
                value={[displayDur]}
                onValueChange={([v]) =>
                  setTransitionOverrideState(isExit ? { exitDurationMs: v } : { durationMs: v })
                }
              />
            </div>

            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <label className="text-muted-foreground" htmlFor="ti-ease">
                  {isExit ? 'Exit easing' : 'Easing'}
                  {rawEase !== null && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--ember,16_77%_57%))]" aria-hidden />
                  )}
                </label>
              </div>
              <select
                id="ti-ease"
                value={displayEase}
                onChange={(e) =>
                  setTransitionOverrideState(
                    isExit
                      ? { exitEasing: e.target.value as TransitionEasingName }
                      : { easing: e.target.value as TransitionEasingName },
                  )
                }
                className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TRANSITION_EASING_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {isExit && (
              <div className="mb-3 flex items-center justify-between gap-2 text-[10px]">
                <span className="text-muted-foreground">
                  {inheriting ? 'Exit inherits Enter values.' : 'Exit pinned independently.'}
                </span>
                {!inheriting && (
                  <button
                    type="button"
                    onClick={() => setTransitionOverrideState({ exitDurationMs: null, exitEasing: null })}
                    className="rounded border border-border/60 px-2 py-0.5 text-[10px] hover:bg-foreground/5"
                  >
                    Inherit Enter
                  </button>
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* Live preview — animates a sample heading + step row using the
          currently selected phase's effective duration & easing so authors
          can feel motion variety without leaving the slide. v0.187. */}
      <PreviewArea
        durationMs={
          (phase === 'exit' ? state.exitDurationMs : state.durationMs)
            ?? state.durationMs
            ?? 550
        }
        easing={
          (phase === 'exit' ? state.exitEasing : state.easing)
            ?? state.easing
            ?? 'expoOut'
        }
        phase={phase}
      />

      {/* Save current values as a named preset */}
      <div className="mb-3">
        <div className="mb-1 text-xs text-muted-foreground">Save as preset</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={savingName}
            onChange={(e) => { setSavingName(e.target.value); if (saveError) setSaveError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
            placeholder="e.g. Slick Fade"
            className="min-w-0 flex-1 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="New preset name"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/5"
          >
            Save
          </button>
        </div>
        {saveError && (
          <p className="mt-1 text-[10px] text-[hsl(var(--ember,16_77%_57%))]">{saveError}</p>
        )}
      </div>

      <label className="mb-3 flex cursor-pointer items-center justify-between gap-2 rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5">
        <span className="text-xs text-foreground">Persist across reloads</span>
        <input
          type="checkbox"
          checked={state.persist}
          onChange={(e) => setTransitionOverrideState({ persist: e.target.checked })}
          className="h-3.5 w-3.5 cursor-pointer accent-[hsl(var(--ember,16_77%_57%))]"
          aria-label="Persist transition overrides in local storage"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReplay}
          className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          Replay
        </button>
        <button
          type="button"
          onClick={() => { resetTransitionOverrideState(); setSelectedPreset(''); }}
          className="flex-1 rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/5"
        >
          Reset
        </button>
      </div>

      {/* Export / Import — share preset configurations across devices.
          Export sends the selected user preset (or all user presets) as JSON.
          Import accepts a JSON file and merges presets into local storage. v0.188. */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="flex-1 rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/5"
          aria-label="Export transition preset as JSON file"
        >
          Export
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/5"
          aria-label="Import transition preset from JSON file"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImportFile(f);
            e.target.value = '';
          }}
        />
      </div>
      {ioMessage && (
        <p
          className={`mt-1 text-[10px] ${
            ioMessage.kind === 'ok'
              ? 'text-muted-foreground'
              : 'text-[hsl(var(--ember,16_77%_57%))]'
          }`}
        >
          {ioMessage.text}
        </p>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        {state.persist
          ? 'Saved to this browser. Reset clears storage and restores authored timing.'
          : 'Overrides clear when you close this panel. Toggle Persist to keep them across reloads.'}
      </p>
    </div>
  );
}

/** Shape used while validating an imported preset payload. v0.188. */
interface TransitionPresetShape {
  name: string;
  durationMs: number;
  easing: string;
}

/** Filename-safe slug for exported preset bundles. v0.188. */
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'preset';
}

/** Same named-easing → cubic-bezier table as `transitions.ts`. Duplicated
 *  here so the inspector preview never falls out of sync with what the
 *  resolver will actually apply on the next slide change. v0.187. */
/**
 * Display labels for each transition variant in the type dropdown. Mirrors
 * the keys in `TRANSITION_TYPE_NAMES` from `transitionOverride.ts`. v0.187.
 */
const TRANSITION_TYPE_LABELS: Record<TransitionTypeName, string> = {
  FadeIn: 'Fade',
  SlideIn: 'Slide in (vertical)',
  PushIn: 'Push in (zoom)',
  PushLeft: 'Push left',
  PushRight: 'Push right',
};

const PREVIEW_EASINGS: Record<TransitionEasingName, [number, number, number, number] | string> = {
  linear:    'linear',
  easeIn:    'easeIn',
  easeOut:   'easeOut',
  easeInOut: 'easeInOut',
  expoOut:   [0.16, 1, 0.3, 1],
  expoInOut: [0.87, 0, 0.13, 1],
  circOut:   [0, 0.55, 0.45, 1],
  backOut:   [0.34, 1.56, 0.64, 1],
};

interface PreviewProps {
  durationMs: number;
  easing: TransitionEasingName;
  /** Which phase the preview reflects — affects the on-card label only. */
  phase: 'enter' | 'exit';
}

/**
 * Self-contained looping preview. A sample heading + step row mounts and
 * unmounts on a fixed cadence (animation duration + a 350ms hold) so the
 * user sees the chosen easing/duration apply repeatedly as they tune.
 *
 * Reset key: changing duration/easing remounts the inner card immediately
 * so the new values apply on the next loop without waiting for the current
 * one to finish.
 */
function PreviewArea({ durationMs, easing, phase }: PreviewProps) {
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Loop: render → wait (duration + hold) → bump tick → AnimatePresence
  // exits the old card and Framer mounts the next one.
  useEffect(() => {
    function schedule() {
      const holdMs = 450;
      timerRef.current = setTimeout(() => {
        setTick((t) => t + 1);
        schedule();
      }, durationMs + holdMs);
    }
    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [durationMs, easing]);

  const ease = PREVIEW_EASINGS[easing];
  const transition = { duration: durationMs / 1000, ease } as const;

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Preview ({phase})</span>
        <span className="tabular-nums text-[10px] text-muted-foreground">
          {durationMs}ms · {easing}
        </span>
      </div>
      <div
        className="relative h-20 overflow-hidden rounded-md border border-border/60 bg-background/40"
        aria-hidden="true"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tick}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            // Same transition is reused for enter + exit so the loop reflects
            // the active phase consistently. Authors viewing the Exit tab see
            // outgoing motion; Enter tab sees incoming motion.
            transition={transition as unknown as React.ComponentProps<typeof motion.div>['transition']}
            className="absolute inset-0 flex flex-col justify-center gap-1.5 px-3"
          >
            <div className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Ubuntu, Inter, sans-serif' }}>
              Sample heading
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--ember,16_77%_57%))]" />
              <span className="text-[11px] text-muted-foreground">Step capsule preview</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
