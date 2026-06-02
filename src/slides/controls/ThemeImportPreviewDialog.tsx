import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, AlertTriangle, GitCompare, ChevronDown, ChevronRight } from 'lucide-react';
import type { ThemeManifest } from '../themeManifest';
import { THEMES, type ThemeId } from '../themes';

/**
 * Validation preview for an imported theme manifest. Shown AFTER the
 * file has parsed cleanly but BEFORE the theme is installed into the
 * registry, so the presenter can sanity-check swatches/fonts/tokens
 * AND see exactly which values diverge from the currently active theme.
 *
 * Pure presentational — install/cancel logic lives in `ThemeMenu`.
 */

interface Props {
  open: boolean;
  manifest: ThemeManifest | null;
  /** True if `manifest.theme.id` collides with a built-in/existing theme. */
  collides: boolean;
  /** The id we will actually install under (after auto-suffixing). */
  finalId: string | null;
  /** Currently-active theme id — drives the side-by-side diff. */
  compareToThemeId?: ThemeId | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Convert a `H S% L%` triplet into a valid CSS color or null if malformed. */
function hslPreview(value: string): string | null {
  const m = value.trim().match(/^(-?\d*\.?\d+)\s+(-?\d*\.?\d+)%\s+(-?\d*\.?\d+)%$/);
  if (!m) return null;
  return `hsl(${m[1]} ${m[2]}% ${m[3]}%)`;
}

/** Tokens we surface as a quick visual check — the rest are summarised. */
const KEY_TOKENS = [
  '--background',
  '--foreground',
  '--gold',
  '--ember',
  '--cream',
  '--chrome-bg',
  '--chrome-fg',
] as const;

type DiffKind = 'changed' | 'added' | 'removed';

interface VarDiffRow {
  key: string;
  kind: DiffKind;
  /** Active theme value (null when this key is added). */
  current: string | null;
  /** Incoming value (null when this key is removed). */
  next: string | null;
}

interface FontDiffRow {
  slot: 'display' | 'body' | 'mono';
  kind: DiffKind | 'unchanged';
  current: string | null;
  next: string | null;
}

/**
 * Compute var-level diff between an incoming and current var map. Rows
 * are sorted: changed → added → removed, then alphabetically within
 * each bucket so the most relevant edits surface first.
 */
function diffVars(
  incoming: Record<string, string>,
  current: Record<string, string>,
): { rows: VarDiffRow[]; unchangedCount: number } {
  const rows: VarDiffRow[] = [];
  const allKeys = new Set([...Object.keys(incoming), ...Object.keys(current)]);
  let unchanged = 0;
  for (const key of allKeys) {
    const a = incoming[key];
    const b = current[key];
    if (a !== undefined && b !== undefined) {
      if (a.trim() === b.trim()) {
        unchanged++;
      } else {
        rows.push({ key, kind: 'changed', current: b, next: a });
      }
    } else if (a !== undefined) {
      rows.push({ key, kind: 'added', current: null, next: a });
    } else if (b !== undefined) {
      rows.push({ key, kind: 'removed', current: b, next: null });
    }
  }
  const order: Record<DiffKind, number> = { changed: 0, added: 1, removed: 2 };
  rows.sort((x, y) => order[x.kind] - order[y.kind] || x.key.localeCompare(y.key));
  return { rows, unchangedCount: unchanged };
}

function diffFonts(
  incoming: { display?: string; body?: string; mono?: string } | undefined,
  current: { display?: string; body?: string; mono?: string } | undefined,
): FontDiffRow[] {
  const slots: Array<'display' | 'body' | 'mono'> = ['display', 'body', 'mono'];
  return slots.map<FontDiffRow>((slot) => {
    const a = incoming?.[slot] ?? null;
    const b = current?.[slot] ?? null;
    if (a && b) {
      return { slot, kind: a === b ? 'unchanged' : 'changed', current: b, next: a };
    }
    if (a && !b) return { slot, kind: 'added', current: null, next: a };
    if (!a && b) return { slot, kind: 'removed', current: b, next: null };
    return { slot, kind: 'unchanged', current: null, next: null };
  });
}

function kindClasses(kind: DiffKind | 'unchanged'): string {
  switch (kind) {
    case 'added':
      return 'bg-emerald-500/10 border-emerald-500/30';
    case 'removed':
      return 'bg-rose-500/10 border-rose-500/30';
    case 'changed':
      return 'bg-amber-500/10 border-amber-500/30';
    default:
      return 'bg-muted/40 border-border';
  }
}

function kindLabel(kind: DiffKind | 'unchanged'): string {
  if (kind === 'changed') return 'Δ';
  if (kind === 'added') return '+';
  if (kind === 'removed') return '−';
  return '=';
}

/** Side-by-side cell: HSL swatch + raw value (or em-dash if missing). */
function ValueCell({ value }: { value: string | null }) {
  if (value == null) {
    return <span className="text-muted-foreground italic">—</span>;
  }
  const css = hslPreview(value);
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {css ? (
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-sm border border-border"
          style={{ backgroundColor: css }}
          aria-hidden
        />
      ) : (
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-sm border border-destructive/50"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg,#ccc 0 4px,#fff 4px 8px)', // hardcoded-white-ok: fixed transparency checkerboard swatch, not theme content
          }}
          aria-hidden
          title="Malformed HSL triplet"
        />
      )}
      <code className="font-mono text-[10.5px] truncate">{value}</code>
    </div>
  );
}

export function ThemeImportPreviewDialog({
  open,
  manifest,
  collides,
  finalId,
  compareToThemeId,
  onCancel,
  onConfirm,
}: Props) {
  const t = manifest?.theme;

  const [diffOpen, setDiffOpen] = useState(true);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const totalVars = t ? Object.keys(t.vars).length : 0;
  const malformedVars = t
    ? Object.entries(t.vars).filter(([, v]) => hslPreview(v) === null).length
    : 0;

  const visibleTokens = t
    ? KEY_TOKENS.filter((k) => typeof t.vars[k] === 'string')
    : [];

  const replacing =
    t && THEMES[t.id as keyof typeof THEMES] ? t.id : null;

  // Resolve the comparison theme. Falls back to the same id (so all rows
  // are unchanged) when no explicit compareTo is given.
  const compare = useMemo(() => {
    if (!compareToThemeId) return null;
    return THEMES[compareToThemeId] ?? null;
  }, [compareToThemeId]);

  const varDiff = useMemo(() => {
    if (!t || !compare) return { rows: [], unchangedCount: 0 };
    return diffVars(t.vars, compare.vars);
  }, [t, compare]);

  const fontDiff = useMemo(() => {
    if (!t || !compare) return [] as FontDiffRow[];
    return diffFonts(t.fonts, compare.fonts);
  }, [t, compare]);

  const fontChanges = fontDiff.filter((r) => r.kind !== 'unchanged');
  const visibleFontRows = showUnchanged ? fontDiff : fontChanges;

  const totalChanges =
    varDiff.rows.length + fontChanges.length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Preview imported theme
          </DialogTitle>
          <DialogDescription>
            Confirm swatches, fonts and tokens before installing.
          </DialogDescription>
        </DialogHeader>

        {!t ? (
          <div className="text-sm text-muted-foreground">No theme to preview.</div>
        ) : (
          <div className="space-y-4 text-sm">
            {/* Identity */}
            <section className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-medium text-base">{t.label || '(no label)'}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {t.appearance ?? 'auto'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                id: <code className="font-mono">{t.id}</code>
                {finalId && finalId !== t.id ? (
                  <>
                    {' '}→ saving as <code className="font-mono">{finalId}</code>
                  </>
                ) : null}
              </div>
              {t.description ? (
                <div className="text-xs text-muted-foreground italic">
                  {t.description}
                </div>
              ) : null}
            </section>

            {/* Swatch */}
            <section className="space-y-1.5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Swatch
              </div>
              <div className="flex gap-2">
                {(t.swatch ?? []).map((c, i) => (
                  <div
                    key={i}
                    className="h-9 w-9 rounded-md border border-border shadow-sm"
                    style={{ backgroundColor: c }}
                    title={c}
                    aria-label={`Swatch color ${c}`}
                  />
                ))}
                {(!t.swatch || t.swatch.length === 0) ? (
                  <span className="text-xs text-muted-foreground">No swatch</span>
                ) : null}
              </div>
            </section>

            {/* Key tokens — quick at-a-glance preview */}
            <section className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Key tokens
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {totalVars} total
                  {malformedVars > 0 ? (
                    <span className="ml-1 text-destructive">
                      · {malformedVars} malformed
                    </span>
                  ) : null}
                </div>
              </div>
              {visibleTokens.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  None of the standard chrome tokens are defined — preview may differ.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {visibleTokens.map((k) => {
                    const raw = t.vars[k];
                    const css = hslPreview(raw);
                    return (
                      <div key={k} className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-4 w-4 shrink-0 rounded border border-border"
                          style={{
                            backgroundColor: css ?? 'transparent',
                            backgroundImage: css
                              ? undefined
                              : 'repeating-linear-gradient(45deg,#ccc 0 4px,#fff 4px 8px)', // hardcoded-white-ok: fixed transparency checkerboard swatch, not theme content
                          }}
                          aria-hidden
                        />
                        <code className="font-mono text-[11px] truncate">{k}</code>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Diff vs active theme */}
            {compare ? (
              <section className="space-y-2 rounded-md border border-border p-2.5">
                <button
                  type="button"
                  onClick={() => setDiffOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 text-left"
                  aria-expanded={diffOpen}
                >
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                    {diffOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <GitCompare className="h-3.5 w-3.5" />
                    Diff vs <span className="text-foreground normal-case font-medium">{compare.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {totalChanges === 0 ? (
                      <span>identical</span>
                    ) : (
                      <span>
                        {totalChanges} change{totalChanges === 1 ? '' : 's'}
                        {varDiff.unchangedCount > 0 ? (
                          <span className="ml-1">· {varDiff.unchangedCount} same</span>
                        ) : null}
                      </span>
                    )}
                  </div>
                </button>

                {diffOpen ? (
                  <div className="space-y-3">
                    {/* Two-column header */}
                    <div className="grid grid-cols-[1.25rem_1fr_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground pb-1 border-b border-border">
                      <span />
                      <span>Token</span>
                      <span>Current ({compare.label})</span>
                      <span>Incoming</span>
                    </div>

                    {/* Font diff */}
                    {visibleFontRows.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Fonts
                        </div>
                        {visibleFontRows.map((row) => (
                          <div
                            key={row.slot}
                            className={`grid grid-cols-[1.25rem_1fr_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 px-1.5 py-1 rounded border ${kindClasses(
                              row.kind,
                            )}`}
                          >
                            <span className="font-mono text-[11px] text-center">{kindLabel(row.kind)}</span>
                            <code className="font-mono text-[11px] truncate">{row.slot}</code>
                            <span
                              className="text-[11px] truncate"
                              style={row.current ? { fontFamily: row.current } : undefined}
                              title={row.current ?? ''}
                            >
                              {row.current ?? <span className="text-muted-foreground italic">—</span>}
                            </span>
                            <span
                              className="text-[11px] truncate"
                              style={row.next ? { fontFamily: row.next } : undefined}
                              title={row.next ?? ''}
                            >
                              {row.next ?? <span className="text-muted-foreground italic">—</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Var diff */}
                    {varDiff.rows.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Variables
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                          {varDiff.rows.map((row) => (
                            <div
                              key={row.key}
                              className={`grid grid-cols-[1.25rem_1fr_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 px-1.5 py-1 rounded border ${kindClasses(
                                row.kind,
                              )}`}
                            >
                              <span className="font-mono text-[11px] text-center">
                                {kindLabel(row.kind)}
                              </span>
                              <code className="font-mono text-[10.5px] truncate" title={row.key}>
                                {row.key}
                              </code>
                              <ValueCell value={row.current} />
                              <ValueCell value={row.next} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {totalChanges === 0 ? (
                      <div className="text-xs text-muted-foreground italic px-1">
                        Vars and fonts are byte-identical to the active theme.
                      </div>
                    ) : null}

                    {/* Toggle: show unchanged font rows. (Var rows omit
                        unchanged entries entirely — the count is shown in
                        the header so the diff stays focused.) */}
                    {fontDiff.length > fontChanges.length ? (
                      <button
                        type="button"
                        onClick={() => setShowUnchanged((v) => !v)}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition"
                      >
                        {showUnchanged ? 'Hide unchanged fonts' : 'Show unchanged fonts'}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Fonts (incoming-only summary, kept for non-diff context) */}
            {!compare ? (
              <section className="space-y-1.5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fonts
                </div>
                {t.fonts && (t.fonts.display || t.fonts.body || t.fonts.mono) ? (
                  <ul className="space-y-1">
                    {t.fonts.display ? (
                      <li>
                        <span className="text-muted-foreground">display:</span>{' '}
                        <span style={{ fontFamily: t.fonts.display }}>{t.fonts.display}</span>
                      </li>
                    ) : null}
                    {t.fonts.body ? (
                      <li>
                        <span className="text-muted-foreground">body:</span>{' '}
                        <span style={{ fontFamily: t.fonts.body }}>{t.fonts.body}</span>
                      </li>
                    ) : null}
                    {t.fonts.mono ? (
                      <li>
                        <span className="text-muted-foreground">mono:</span>{' '}
                        <span style={{ fontFamily: t.fonts.mono }}>{t.fonts.mono}</span>
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Inherits deck fonts (none specified).
                  </div>
                )}
              </section>
            ) : null}

            {/* Warnings */}
            {(collides || malformedVars > 0 || replacing) ? (
              <section className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Heads up
                </div>
                {collides ? (
                  <div>
                    Id <code className="font-mono">{t.id}</code> already exists — will
                    install as <code className="font-mono">{finalId}</code>.
                  </div>
                ) : null}
                {malformedVars > 0 ? (
                  <div>
                    {malformedVars} variable{malformedVars === 1 ? '' : 's'} aren't
                    valid <code className="font-mono">H S% L%</code> triplets and may
                    fall back to defaults.
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm hover:bg-muted transition"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!t}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Install &amp; activate
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
