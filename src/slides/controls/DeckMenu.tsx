import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Upload, RotateCcw, FileJson, X, Wand2, Check, AlertCircle, FlaskConical } from 'lucide-react';
import { deck, allSlides, isImportedDeck, IMPORTED_MANIFEST_KEY } from '../loader';
import {
  buildManifest,
  downloadManifest,
  manifestTheme,
  parseManifest,
  readThemeDebugFlag,
  writeThemeDebugFlag,
  type DeckManifest,
} from '../manifest';
import { setTheme, isTestMode } from '../themes';
import { getPresetSettings, setPresetSettings } from '../presetSettings';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
}

/**
 * Popover menu for deck-level actions: export the current deck as a single
 * JSON manifest, import a manifest from another project, or reset back to
 * the bundled spec. Imports are persisted in localStorage and applied on
 * the next page load (full reload keeps the loader logic simple).
 */
export function DeckMenu({ onClose }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  // Default ON when the debug panel is currently open — most exports of a
  // debug session want the receiver to land in the same state. Off otherwise
  // so a normal "share my deck" flow ships a clean manifest.
  const [includeThemeDebug, setIncludeThemeDebug] = useState<boolean>(readThemeDebugFlag);
  // Pending import — populated after the user picks a file but before we
  // commit the import. Lets us show a small status note describing what
  // will happen (e.g. whether the ThemeMenu debug toggle will be restored)
  // so the user can confirm or cancel before the page reloads.
  const [pending, setPending] = useState<{ manifest: DeckManifest; fileName: string } | null>(null);

  function handleExport() {
    // v0.75 — auto-hide alignment guides during export so they don't sneak
    // into screenshots/recordings the user might capture around the
    // download action. Restored to the user's prior toggle state right
    // after, so their workflow is unchanged. Opt-out via /settings.
    const prior = getPresetSettings();
    const shouldSuppress = prior.hideAlignmentGuideOnExport && prior.showAlignmentGuide;
    if (shouldSuppress) {
      setPresetSettings({ ...prior, showAlignmentGuide: false });
    }

    const manifest = buildManifest(deck, allSlides, { includeThemeDebug });
    downloadManifest(manifest);
    toast.success('Deck exported', {
      description: shouldSuppress
        ? `${manifest.slides.length} slides written to JSON. Alignment guides hidden during export.`
        : `${manifest.slides.length} slides written to JSON.`,
    });

    // Restore on next tick so the overlay unmount has flushed before
    // we re-enable. Using a short delay (rather than synchronous restore)
    // also covers the case where the user's screen-recording tool grabs
    // a frame a few hundred ms after the click.
    if (shouldSuppress) {
      window.setTimeout(() => {
        setPresetSettings({ ...getPresetSettings(), showAlignmentGuide: true });
      }, 1500);
    }

    onClose();
  }

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const text = await file.text();
      const json: unknown = JSON.parse(text);
      const manifest = parseManifest(json); // throws on invalid shape
      // Stash for the confirm step — show a status note describing what
      // will be restored before we mutate localStorage and reload.
      setPending({ manifest, fileName: file.name });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not parse manifest.';
      toast.error('Import failed', { description: msg });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function commitImport() {
    if (!pending) return;
    const { manifest } = pending;
    setTheme(manifestTheme(manifest));
    if (typeof manifest.editor?.themeDebug === 'boolean') {
      writeThemeDebugFlag(manifest.editor.themeDebug);
    }
    window.localStorage.setItem(IMPORTED_MANIFEST_KEY, JSON.stringify(manifest));
    toast.success('Deck imported', { description: `Reloading with ${manifest.slides.length} slides…` });
    setTimeout(() => window.location.reload(), 600);
  }

  function handleReset() {
    window.localStorage.removeItem(IMPORTED_MANIFEST_KEY);
    toast.success('Reset to bundled deck', { description: 'Reloading…' });
    setTimeout(() => window.location.reload(), 600);
  }

  // ── Test mode toggle ────────────────────────────────────────────────
  // Append/strip `?testMode=1` on the current URL. The boot path in
  // `themes.getInitialTheme` reads the param at startup and (a) ignores
  // localStorage in favor of the deck-declared theme, (b) suppresses
  // localStorage writes from `setTheme` so a reload never drifts.
  // Reload is required because theme resolution happens once at boot.
  const testModeOn = isTestMode();
  function toggleTestMode() {
    const url = new URL(window.location.href);
    if (testModeOn) {
      url.searchParams.delete('testMode');
      toast.success('Test mode off', { description: 'localStorage preferences re-enabled. Reloading…' });
    } else {
      url.searchParams.set('testMode', '1');
      toast.success('Test mode on', { description: 'localStorage ignored. Reloading…' });
    }
    setTimeout(() => { window.location.href = url.toString(); }, 600);
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <div
        role="menu"
        className="absolute top-full mt-3 right-0 w-72 rounded-2xl controller-pill p-2 shadow-2xl"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium">Deck manifest</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lift-hover-subtle h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/5 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="px-3 pb-2 text-xs text-foreground/55">
          {isImportedDeck
            ? 'Active deck was imported from a manifest.'
            : `Bundled deck: ${deck.deckName} · ${allSlides.length} slides.`}
        </p>

        <button
          onClick={handleExport}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition text-left"
        >
          <Download className="h-4 w-4 text-foreground/70" />
          <div className="flex-1">
            <div className="text-sm">Export deck as JSON</div>
            <div className="text-xs text-foreground/50">Download a single portable file.</div>
          </div>
        </button>

        {/* Export option — opt-in for the ThemeMenu debug toggle. Indented
            under the Export button so it visibly belongs to it. Click is
            stopped from bubbling so toggling it doesn't also fire export. */}
        <label
          className="flex items-start gap-2 mx-3 mb-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/5 transition select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={includeThemeDebug}
            onChange={(e) => setIncludeThemeDebug(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-transparent accent-gold cursor-pointer"
            aria-describedby="include-theme-debug-help"
          />
          <span className="flex-1 min-w-0">
            <span className="block text-xs text-foreground/85">Include theme debug state</span>
            <span
              id="include-theme-debug-help"
              className="block text-[11px] text-foreground/50 leading-snug"
            >
              Round-trip the panel toggle in <code className="font-mono">editor.themeDebug</code>.
            </span>
          </span>
        </label>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy || pending !== null}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition text-left disabled:opacity-50"
        >
          <Upload className="h-4 w-4 text-foreground/70" />
          <div className="flex-1">
            <div className="text-sm">{busy ? 'Reading…' : 'Import manifest…'}</div>
            <div className="text-xs text-foreground/50">Replace the active deck. Reloads the page.</div>
          </div>
        </button>

        {/* Pending-import status note — surfaces what the incoming manifest
            will restore (specifically: whether the ThemeMenu debug panel
            state will be carried over) so the user can confirm before the
            page reloads. */}
        {pending && (() => {
          const flag = pending.manifest.editor?.themeDebug;
          const willRestore = typeof flag === 'boolean';
          const version = pending.manifest.manifestVersion;
          // v1 manifests predate the editor.themeDebug field, so the absence
          // is structural (not an opt-out). Call that out so the user knows
          // the toggle defaults to their current local state by design.
          const note = willRestore
            ? flag
              ? 'Will open the ThemeMenu debug panel on reload.'
              : 'Will close the ThemeMenu debug panel on reload.'
            : version < 2
              ? `Legacy v${version} manifest — no theme debug field. Your current toggle is kept.`
              : 'No theme debug state in this manifest — your current toggle is kept.';
          return (
            <div className="mx-3 mb-2 mt-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-foreground/85">
                <FileJson className="h-3.5 w-3.5 text-gold" />
                <span className="font-medium truncate">{pending.fileName}</span>
                <span className="text-foreground/50">· v{version} · {pending.manifest.slides.length} slides</span>
              </div>
              <div className="mt-1.5 flex items-start gap-2">
                {willRestore ? (
                  <Check className="h-3.5 w-3.5 mt-0.5 text-gold shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-foreground/50 shrink-0" />
                )}
                <span className="text-[11px] leading-snug text-foreground/65">{note}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={commitImport}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-gold/90 hover:bg-gold text-ink text-xs font-medium transition"
                >
                  Confirm import
                </button>
                <button
                  onClick={() => setPending(null)}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-foreground/70 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })()}

        <Link
          to="/builder"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition text-left"
        >
          <Wand2 className="h-4 w-4 text-gold" />
          <div className="flex-1">
            <div className="text-sm">Open slide builder</div>
            <div className="text-xs text-foreground/50">Live-preview a new slide before adding it.</div>
          </div>
        </Link>

        {isImportedDeck && (
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition text-left"
          >
            <RotateCcw className="h-4 w-4 text-ember" />
            <div className="flex-1">
              <div className="text-sm">Reset to bundled deck</div>
              <div className="text-xs text-foreground/50">Discard the imported manifest.</div>
            </div>
          </button>
        )}

        {/* ── Test mode toggle ──────────────────────────────────────────
            Visually separated from the import/export block. When ON, the
            menu shows an explicit "localStorage ignored" status so the
            user can tell at a glance why their saved theme isn't sticking
            (the #1 confusion this flag causes during QA). */}
        <div className="mx-1 my-1 border-t border-white/10" />
        <button
          onClick={toggleTestMode}
          role="switch"
          aria-checked={testModeOn}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition text-left"
        >
          <FlaskConical className={`h-4 w-4 ${testModeOn ? 'text-gold' : 'text-foreground/70'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">Deterministic test mode</span>
              {testModeOn && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gold/15 text-gold text-[10px] font-semibold tracking-wide uppercase">
                  On
                </span>
              )}
            </div>
            <div className="text-xs text-foreground/50">
              {testModeOn
                ? 'localStorage is being ignored. Reload returns to deck-declared theme.'
                : 'Append ?testMode=1 — ignore localStorage, force deck theme.'}
            </div>
          </div>
          {/* iOS-style switch indicator on the right so the toggle state is
              obvious without reading the body copy. */}
          <span
            aria-hidden
            className={`relative inline-block h-4 w-7 rounded-full transition-colors ${
              testModeOn ? 'bg-gold/80' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                testModeOn ? 'left-3.5' : 'left-0.5'
              }`}
            />
          </span>
        </button>
      </div>
    </>
  );
}
