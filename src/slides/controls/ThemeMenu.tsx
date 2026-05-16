import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Palette, Check, X, Bug, Copy, ClipboardCheck, Download, Upload, Trash2, Sun, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  THEMES,
  getStoredTheme,
  setTheme,
  type ThemeId,
  BRIGHTNESS_RANGE,
  getStoredBrightnessOffset,
  previewBrightnessOffset,
  setBrightnessOffset,
} from '../themes';
import {
  buildThemeManifest,
  downloadThemeManifest,
  parseThemeManifest,
  installThemeManifest,
  uninstallCustomTheme,
  isCustomThemeId,
  previewImportId,
  type ThemeManifest,
} from '../themeManifest';
import { ThemeImportPreviewDialog } from './ThemeImportPreviewDialog';

// Chrome tokens we surface in the debug panel. Order matters — it's the
// order they render in the popover so a presenter can scan them quickly.
const CHROME_TOKENS = [
  '--chrome-bg',
  '--chrome-fg',
  '--chrome-fg-muted',
  '--chrome-fg-subtle',
  '--chrome-border-strength',
  '--chrome-divider-strength',
] as const;

/**
 * Text tokens we measure against `--chrome-bg`. Each is paired with the
 * WCAG threshold it needs to clear: full-AA (4.5) for body copy, AA-Large
 * (3.0) for the dimmer muted/subtle variants used on secondary text.
 */
const CONTRAST_TARGETS: Array<{ token: string; threshold: number; label: string }> = [
  { token: '--chrome-fg', threshold: 4.5, label: 'AA' },
  { token: '--chrome-fg-muted', threshold: 3.0, label: 'AA-lg' },
  { token: '--chrome-fg-subtle', threshold: 3.0, label: 'AA-lg' },
];

/* ------------------------------------------------------------------ */
/* Contrast math (WCAG 2.1)                                            */
/* ------------------------------------------------------------------ */

/** Parse a `H S% L%` triplet (the format we store CSS vars in). */
function parseHsl(value: string): { h: number; s: number; l: number } | null {
  const m = value.trim().match(/^(-?\d*\.?\d+)\s+(-?\d*\.?\d+)%\s+(-?\d*\.?\d+)%$/);
  if (!m) return null;
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = lN - c / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(a: string, b: string): number | null {
  const ah = parseHsl(a); const bh = parseHsl(b);
  if (!ah || !bh) return null;
  const al = relLuminance(hslToRgb(ah.h, ah.s, ah.l));
  const bl = relLuminance(hslToRgb(bh.h, bh.s, bh.l));
  const [hi, lo] = al > bl ? [al, bl] : [bl, al];
  return (hi + 0.05) / (lo + 0.05);
}

// Storage key + read/write helpers live in `../manifest` so deck
// export/import can round-trip the panel toggle alongside the theme id.
import { readThemeDebugFlag, writeThemeDebugFlag } from '../manifest';

const readDebugFlag = readThemeDebugFlag;

function readChromeTokens(): Array<{ name: string; value: string }> {
  if (typeof window === 'undefined') return [];
  const root = document.documentElement;
  const styles = window.getComputedStyle(root);
  return CHROME_TOKENS.map((name) => ({
    name,
    value: styles.getPropertyValue(name).trim() || '—',
  }));
}

interface Props {
  onClose: () => void;
  onChange?: (id: ThemeId) => void;
}

/**
 * Theme picker popover — triggered from the controller pill. Lets the
 * presenter swap between the available palettes (currently Noir & Gold and
 * Bright Gold) before exporting the deck. The active choice persists in
 * localStorage and is written into the manifest on export.
 */
export function ThemeMenu({ onClose, onChange }: Props) {
  const [active, setActive] = useState<ThemeId>(getStoredTheme());
  const [debug, setDebug] = useState<boolean>(readDebugFlag);
  const [tokens, setTokens] = useState<Array<{ name: string; value: string }>>(
    () => (readDebugFlag() ? readChromeTokens() : []),
  );
  const [copied, setCopied] = useState<'idle' | 'ok' | 'err'>('idle');
  // Bumped after import/uninstall so the picker re-renders against the
  // mutated `THEMES` registry without each consumer subscribing to events.
  const [, setThemeListVersion] = useState(0);
  const importRef = useRef<HTMLInputElement | null>(null);

  // Gold-brightness slider. `draft` is the live value the user is dragging;
  // `saved` is the persisted baseline. Apply commits draft → saved.
  const [brightnessDraft, setBrightnessDraft] = useState<number>(getStoredBrightnessOffset);
  const [brightnessSaved, setBrightnessSaved] = useState<number>(getStoredBrightnessOffset);
  const brightnessDirty = brightnessDraft !== brightnessSaved;

  function handleBrightnessInput(v: number) {
    setBrightnessDraft(v);
    previewBrightnessOffset(v); // live preview, not persisted
  }
  function handleBrightnessApply() {
    setBrightnessOffset(brightnessDraft);
    setBrightnessSaved(brightnessDraft);
    toast.success('Brightness applied', {
      description: brightnessDraft === 0
        ? 'Restored preset default.'
        : `Gold lightness ${brightnessDraft > 0 ? '+' : ''}${brightnessDraft}%.`,
    });
  }
  function handleBrightnessReset() {
    setBrightnessDraft(0);
    setBrightnessOffset(0);
    setBrightnessSaved(0);
  }

  // Live readout of the resolved `--gold` / `--gold-glow` CSS variables.
  // Re-reads on brightness drag, on apply, and on theme switch (activeId).
  const [goldHsl, setGoldHsl] = useState<{ gold: string; glow: string }>({ gold: '', glow: '' });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      setGoldHsl({
        gold: cs.getPropertyValue('--gold').trim(),
        glow: cs.getPropertyValue('--gold-glow').trim(),
      });
    };
    // rAF lets applyBrightnessOffset finish writing :root vars first.
    const id = requestAnimationFrame(read);
    return () => cancelAnimationFrame(id);
  }, [brightnessDraft, brightnessSaved, activeId]);

  // Validation-preview state. Populated after a file parses cleanly;
  // install only happens when the presenter confirms in the dialog.
  const [pendingImport, setPendingImport] = useState<{
    manifest: ThemeManifest;
    finalId: string;
    collides: boolean;
  } | null>(null);

  function handleExportTheme() {
    try {
      const manifest = buildThemeManifest(active);
      downloadThemeManifest(manifest);
      toast.success('Theme exported', {
        description: `${manifest.theme.label} written to JSON.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not export theme.';
      toast.error('Theme export failed', { description: msg });
    }
  }

  /** Step 1 of import — parse + validate, then stage for preview. */
  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const json: unknown = JSON.parse(text);
      const manifest = parseThemeManifest(json);
      const { finalId, collides } = previewImportId(manifest);
      setPendingImport({ manifest, finalId, collides });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not parse theme manifest.';
      toast.error('Theme import failed', { description: msg });
    } finally {
      // Clear the file input so re-picking the same file re-triggers onChange.
      if (importRef.current) importRef.current.value = '';
    }
  }

  /** Step 2 — user confirmed in the preview dialog. Now install + activate. */
  function confirmImport() {
    if (!pendingImport) return;
    const { manifest } = pendingImport;
    try {
      const finalId = installThemeManifest(manifest);
      setThemeListVersion((v) => v + 1);
      setTheme(finalId as ThemeId);
      setActive(finalId as ThemeId);
      onChange?.(finalId as ThemeId);
      const renamed = finalId !== manifest.theme.id;
      toast.success('Theme imported', {
        description: renamed
          ? `Saved as "${finalId}" (id "${manifest.theme.id}" was already taken).`
          : `Activated "${manifest.theme.label}".`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not install theme.';
      toast.error('Theme import failed', { description: msg });
    } finally {
      setPendingImport(null);
    }
  }

  function cancelImport() {
    setPendingImport(null);
  }

  function handleRemoveCustom(id: string, e: ReactMouseEvent) {
    e.stopPropagation();
    if (!isCustomThemeId(id)) return;
    uninstallCustomTheme(id);
    setThemeListVersion((v) => v + 1);
    if (active === id) {
      const fallback = (Object.keys(THEMES)[0] ?? 'bright-gold') as ThemeId;
      setTheme(fallback);
      setActive(fallback);
      onChange?.(fallback);
    }
    toast.success('Theme removed', { description: `"${id}" deleted.` });
  }


  // Build the snapshot payload the copy button writes to the clipboard.
  // Includes contrast ratios for the text tokens so a paste into an issue
  // tracker captures the full debug picture, not just raw values.
  function buildSnapshot() {
    const bg = tokens.find((x) => x.name === '--chrome-bg')?.value ?? '';
    const tokenMap: Record<string, string> = {};
    const contrast: Record<string, { ratio: number; threshold: number; passes: boolean }> = {};
    for (const t of tokens) {
      tokenMap[t.name] = t.value;
      const target = CONTRAST_TARGETS.find((c) => c.token === t.name);
      if (target) {
        const r = contrastRatio(t.value, bg);
        if (r !== null) {
          contrast[t.name] = {
            ratio: Number(r.toFixed(2)),
            threshold: target.threshold,
            passes: r >= target.threshold,
          };
        }
      }
    }
    return {
      palette: { id: active, label: THEMES[active].label },
      tokens: tokenMap,
      contrast,
      capturedAt: new Date().toISOString(),
    };
  }

  async function handleCopy() {
    const json = JSON.stringify(buildSnapshot(), null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(json);
      } else {
        // Fallback for non-secure contexts / older browsers.
        const ta = document.createElement('textarea');
        ta.value = json;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied('ok');
    } catch {
      setCopied('err');
    }
    window.setTimeout(() => setCopied('idle'), 1600);
  }


  // When the debug panel is open, re-read computed tokens whenever the
  // active theme changes. We also re-read on mount so the panel always
  // reflects the live values rather than a stale snapshot.
  useEffect(() => {
    if (!debug) return;
    // Defer one frame so the new `data-theme` attribute has propagated
    // through the cascade before we sample computed styles.
    const id = requestAnimationFrame(() => setTokens(readChromeTokens()));
    return () => cancelAnimationFrame(id);
  }, [debug, active]);

  function pick(id: ThemeId) {
    setActive(id);
    setTheme(id);
    onChange?.(id);
  }

  function toggleDebug() {
    setDebug((prev) => {
      const next = !prev;
      writeThemeDebugFlag(next);
      if (next) setTokens(readChromeTokens());
      return next;
    });
  }

  return (
    <>
    <div
      role="menu"
      // Use chrome-specific tokens (defined in `src/index.css` and pinned
      // across every theme). The controller chrome is always dark, so it
      // must never inherit slide-level `--foreground` — light themes like
      // GitHub Light would flip the menu text to dark ink and make it
      // invisible against the dark pill background.
      style={{ color: 'hsl(var(--chrome-fg))' }}
      className="absolute bottom-full mb-3 right-0 w-64 rounded-2xl controller-pill p-1.5 shadow-2xl"
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-gold" />
          <span className="text-[12px] font-medium">Theme</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
            }}
          />
          <button
            onClick={handleExportTheme}
            aria-label="Export current theme as JSON"
            title="Export current theme as JSON"
            style={{ ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' }}
            className="lift-hover-subtle h-7 w-7 flex items-center justify-center rounded-full transition hover:bg-[hsl(0_0%_100%/0.14)] focus-visible:bg-[hsl(0_0%_100%/0.14)] focus-visible:outline-none focus-visible:ring-2"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => importRef.current?.click()}
            aria-label="Import theme from JSON"
            title="Import theme from JSON"
            style={{ ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' }}
            className="lift-hover-subtle h-7 w-7 flex items-center justify-center rounded-full transition hover:bg-[hsl(0_0%_100%/0.14)] focus-visible:bg-[hsl(0_0%_100%/0.14)] focus-visible:outline-none focus-visible:ring-2"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={toggleDebug}
            aria-label={debug ? 'Hide theme debug info' : 'Show theme debug info'}
            aria-pressed={debug}
            title="Toggle palette + chrome token debug panel"
            style={{ ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' }}
            className={`lift-hover-subtle h-7 w-7 flex items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 ${
              debug
                ? 'bg-[hsl(var(--gold)/0.22)] text-gold'
                : 'hover:bg-[hsl(0_0%_100%/0.14)]'
            }`}
          >
            <Bug className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{ ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' }}
            className="lift-hover-subtle h-7 w-7 flex items-center justify-center rounded-full transition hover:bg-[hsl(0_0%_100%/0.14)] focus-visible:bg-[hsl(0_0%_100%/0.14)] focus-visible:outline-none focus-visible:ring-2 active:bg-[hsl(0_0%_100%/0.18)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p
        className="px-2 pb-1.5 text-[10.5px] leading-snug"
        style={{ color: 'hsl(var(--chrome-fg-muted))' }}
      >
        Switch palettes live. Saved with the deck on export.
      </p>


      {/* Gold-brightness fine-tune. Live previews on drag; Apply commits. */}
      <div
        className="mx-2 mb-2 rounded-xl px-2.5 py-2"
        style={{
          background: 'hsl(0 0% 0% / 0.24)',
          border: '1px solid hsl(var(--gold) / 0.22)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-gold" />
            <span className="text-[11px] font-medium">Gold brightness</span>
          </div>
          <span
            className="tabular-nums text-[10.5px] font-semibold"
            style={{ color: brightnessDirty ? 'hsl(var(--gold))' : 'hsl(var(--chrome-fg-muted))' }}
          >
            {brightnessDraft > 0 ? '+' : ''}{brightnessDraft}%
          </span>
        </div>
        <input
          type="range"
          min={-BRIGHTNESS_RANGE}
          max={BRIGHTNESS_RANGE}
          step={1}
          value={brightnessDraft}
          onChange={(e) => handleBrightnessInput(Number(e.target.value))}
          aria-label="Gold brightness offset, percentage points"
          className="w-full accent-[hsl(var(--gold))] cursor-pointer"
          style={{ ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' }}
        />
        <div className="flex items-center justify-between mt-1 gap-1.5">
          <span
            className="text-[9.5px] uppercase tracking-wider"
            style={{ color: 'hsl(var(--chrome-fg-subtle))' }}
          >
            −{BRIGHTNESS_RANGE} … +{BRIGHTNESS_RANGE}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleBrightnessReset}
              disabled={brightnessDraft === 0 && brightnessSaved === 0}
              aria-label="Reset gold brightness"
              title="Reset to preset default"
              style={{ ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' }}
              className="lift-hover-subtle h-6 w-6 inline-flex items-center justify-center rounded-md text-[10px] transition hover:bg-[hsl(0_0%_100%/0.14)] focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <button
              onClick={handleBrightnessApply}
              disabled={!brightnessDirty}
              aria-label="Apply gold brightness"
              style={{ ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' }}
              className={`inline-flex items-center px-2 h-6 rounded-md text-[10px] font-semibold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 ${
                brightnessDirty
                  ? 'bg-[hsl(var(--gold)/0.22)] text-gold border border-[hsl(var(--gold)/0.45)] hover:bg-[hsl(var(--gold)/0.32)]'
                  : 'opacity-40 cursor-default border border-[hsl(0_0%_100%/0.12)]'
              }`}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {debug && (
        <div
          className="mx-2 mb-2 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed"
          style={{
            background: 'hsl(0 0% 0% / 0.32)',
            border: '1px solid hsl(var(--gold) / 0.28)',
            fontFamily:
              'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace',
            color: 'hsl(var(--chrome-fg))',
          }}
          aria-live="polite"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-gold uppercase tracking-wider text-[10px]">
              Active palette
            </span>
            <span style={{ color: 'hsl(var(--chrome-fg-muted))' }}>
              {active}
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span
              className="truncate"
              style={{ color: 'hsl(var(--chrome-fg))' }}
              title={THEMES[active].label}
            >
              {THEMES[active].label}
            </span>
            <button
              onClick={handleCopy}
              aria-label="Copy palette + chrome tokens as JSON"
              title="Copy palette + chrome tokens as JSON"
              style={{ ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' }}
              className={`shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 ${
                copied === 'ok'
                  ? 'bg-[hsl(140_50%_40%/0.28)] text-[hsl(140_50%_85%)] border border-[hsl(140_50%_50%/0.5)]'
                  : copied === 'err'
                  ? 'bg-[hsl(8_80%_50%/0.28)] text-[hsl(10_95%_82%)] border border-[hsl(8_80%_55%/0.55)]'
                  : 'bg-[hsl(var(--gold)/0.18)] text-gold border border-[hsl(var(--gold)/0.45)] hover:bg-[hsl(var(--gold)/0.28)]'
              }`}
            >
              {copied === 'ok' ? (
                <>
                  <ClipboardCheck className="h-3 w-3" />
                  Copied
                </>
              ) : copied === 'err' ? (
                <>
                  <X className="h-3 w-3" />
                  Failed
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy JSON
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {tokens.map((t) => {
              const target = CONTRAST_TARGETS.find((c) => c.token === t.name);
              const bg = tokens.find((x) => x.name === '--chrome-bg')?.value ?? '';
              const ratio = target ? contrastRatio(t.value, bg) : null;
              const fails = ratio !== null && target !== undefined && ratio < target.threshold;
              return (
                <div key={t.name} className="flex items-baseline justify-between gap-2">
                  <span
                    className="shrink-0"
                    style={{ color: 'hsl(var(--chrome-fg-muted))' }}
                  >
                    {t.name}
                  </span>
                  <span className="flex items-baseline gap-2 min-w-0">
                    <span
                      className="truncate text-right"
                      style={{ color: 'hsl(var(--chrome-fg))' }}
                      title={t.value}
                    >
                      {t.value}
                    </span>
                    {ratio !== null && target && (
                      <span
                        className="shrink-0 rounded px-1 py-px text-[10px] font-semibold tabular-nums"
                        style={{
                          background: fails
                            ? 'hsl(8 80% 50% / 0.28)'
                            : 'hsl(140 50% 40% / 0.22)',
                          color: fails ? 'hsl(10 95% 78%)' : 'hsl(var(--chrome-fg))',
                          border: `1px solid ${
                            fails ? 'hsl(8 80% 55% / 0.55)' : 'hsl(140 50% 50% / 0.4)'
                          }`,
                        }}
                        title={`${ratio.toFixed(2)}:1 vs --chrome-bg (needs ≥ ${target.threshold} for ${target.label})`}
                      >
                        {ratio.toFixed(2)}{fails ? ' ✕' : ''}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {/* Read directly from THEMES so imported custom themes show up.
            THEME_IDS is the static built-in list — keep it for testing /
            other call sites, but the picker needs the live registry. */}
        {Object.keys(THEMES).map((id) => {
          const t = THEMES[id as ThemeId];
          const isActive = active === id;
          const custom = isCustomThemeId(id);
          return (
            <div key={id} className="relative flex items-stretch">
              <button
                onClick={() => pick(id as ThemeId)}
                role="menuitemradio"
                aria-checked={isActive}
                style={{ ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' }}
                className={`group flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-lg transition text-left focus-visible:outline-none focus-visible:ring-2 active:bg-[hsl(0_0%_100%/0.22)] ${
                  isActive
                    ? 'bg-[hsl(0_0%_100%/0.18)] ring-1 ring-gold/55'
                    : 'hover:bg-[hsl(0_0%_100%/0.12)] focus-visible:bg-[hsl(0_0%_100%/0.12)]'
                }`}
              >
                <div className="flex -space-x-1 shrink-0">
                  {t.swatch.map((hex, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full ring-2"
                      style={{
                        backgroundColor: hex,
                        boxShadow: '0 0 0 2px hsl(var(--chrome-bg))',
                      }}
                      aria-hidden
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] flex items-center gap-1.5 truncate">
                    <span className="truncate">{t.label}</span>
                    {isActive && <Check className="h-3 w-3 text-gold shrink-0" />}
                    {custom && (
                      <span
                        className="ml-auto inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold tracking-wide uppercase shrink-0"
                        style={{
                          background: 'hsl(var(--gold) / 0.18)',
                          color: 'hsl(var(--gold))',
                          border: '1px solid hsl(var(--gold) / 0.35)',
                        }}
                      >
                        Imported
                      </span>
                    )}
                  </div>
                  <div
                    className="text-[10.5px] leading-snug truncate transition-colors"
                    style={{
                      color: isActive
                        ? 'hsl(var(--chrome-fg))'
                        : 'hsl(var(--chrome-fg-subtle))',
                    }}
                  >
                    <span className="group-hover:text-[hsl(var(--chrome-fg))] group-focus-visible:text-[hsl(var(--chrome-fg))]">
                      {t.description}
                    </span>
                  </div>
                </div>
              </button>
              {custom && (
                <button
                  onClick={(e) => handleRemoveCustom(id, e)}
                  aria-label={`Remove imported theme ${t.label}`}
                  title="Remove imported theme"
                  style={{ ['--tw-ring-color' as string]: 'hsl(var(--gold) / 0.55)' }}
                  className="ml-1 h-7 w-7 self-center flex items-center justify-center rounded-full transition hover:bg-[hsl(8_80%_50%/0.22)] hover:text-[hsl(10_95%_82%)] focus-visible:outline-none focus-visible:ring-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
    <ThemeImportPreviewDialog
      open={pendingImport !== null}
      manifest={pendingImport?.manifest ?? null}
      finalId={pendingImport?.finalId ?? null}
      collides={pendingImport?.collides ?? false}
      compareToThemeId={active}
      onCancel={cancelImport}
      onConfirm={confirmImport}
    />
    </>
  );
}
