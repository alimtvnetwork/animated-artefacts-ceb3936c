/**
 * /image-placement — authoring-time inspector for the auto-placement rules.
 *
 * Walks every slide in the active deck, runs the inferImageSlot resolver on
 * each `content.image` reference, and tabulates the result so authors can:
 *   - confirm a logo / presenter / QR landed in the slot they expected,
 *   - spot images that fell back to `bodyFigure` because no signal matched,
 *   - apply an explicit `role` override per slide via a dropdown,
 *   - export the patched slide spec JSON with `content.imageRole` populated.
 *
 * Overrides are persisted to localStorage so authors can iterate without
 * editing JSON files between previews. The "Export patched spec" button
 * downloads a JSON object keyed by slide number, ready to paste back into
 * the on-disk slide files.
 */
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, RotateCcw } from 'lucide-react';
import { allSlides, deck } from '@/slides/loader';
import {
  inferImageSlot,
  IMAGE_SLOTS,
  IMAGE_SLOT_IDS,
  type ImageSlotId,
  type ResolvedImagePlacement,
} from '@/slides/imagePlacement';
import type { SlideSpec } from '@/slides/types';

const STORAGE_KEY = 'image-placement-overrides:v1';

type OverrideMap = Record<number, ImageSlotId>;

function loadOverrides(): OverrideMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: OverrideMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      const num = Number(k);
      if (Number.isFinite(num) && IMAGE_SLOT_IDS.includes(v as ImageSlotId)) {
        out[num] = v as ImageSlotId;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveOverrides(map: OverrideMap) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / privacy errors */
  }
}

function resolveWithOverride(slide: SlideSpec, override?: ImageSlotId): ResolvedImagePlacement | null {
  if (!slide.content.image) return null;
  return inferImageSlot({
    role: override,
    slideType: slide.slideType,
    filename: slide.content.image,
    alt: slide.content.title || slide.slideName,
  });
}

export default function ImagePlacementPage() {
  const [overrides, setOverrides] = useState<OverrideMap>(() => loadOverrides());

  const setOverride = useCallback((slideNumber: number, role: ImageSlotId | '') => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (role === '') delete next[slideNumber];
      else next[slideNumber] = role;
      saveOverrides(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setOverrides({});
    saveOverrides({});
  }, []);

  const rows = useMemo(
    () =>
      allSlides
        .filter((s) => Boolean(s.content.image))
        .map((slide) => {
          const override = overrides[slide.slideNumber];
          const resolved = resolveWithOverride(slide, override)!;
          const auto = resolveWithOverride(slide, undefined)!;
          return { slide, resolved, auto, override };
        }),
    [overrides],
  );

  const overrideCount = Object.keys(overrides).length;

  const handleExport = useCallback(() => {
    // Build a patched spec keyed by slide number — authors can diff/merge it
    // back into the on-disk slide JSON files.
    const patched = rows
      .filter((r) => r.override)
      .map((r) => ({
        slideNumber: r.slide.slideNumber,
        slideName: r.slide.slideName,
        slideType: r.slide.slideType,
        content: {
          ...r.slide.content,
          imageRole: r.override,
        },
      }));

    const blob = new Blob([JSON.stringify({ deckSlug: deck.deckSlug, overrides: patched }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.deckSlug}-image-role-overrides.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [rows]);

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8 max-w-[1200px] mx-auto">
      <header className="mb-6">
        <Link to="/1" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to deck
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Image Placement Inspector</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Auto-resolved slot assignment for every image in deck{' '}
          <span className="font-mono text-gold">{deck.deckSlug}</span>. Override the
          inferred role per slide and export the patched spec.
        </p>
      </header>

      {/* Slot reference */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold mb-3">
          Slot catalog
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {IMAGE_SLOT_IDS.map((id) => {
            const s = IMAGE_SLOTS[id];
            return (
              <div key={id} className="rounded-md border border-border bg-surface-1/30 p-3">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[12.5px] font-medium font-mono text-gold">{s.id}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.zone}</span>
                </div>
                <p className="text-[11.5px] text-foreground/80 leading-snug mb-2">{s.description}</p>
                <dl className="text-[10.5px] font-mono text-muted-foreground space-y-0.5">
                  <div>max: {s.maxWidth}×{s.maxHeight}</div>
                  <div>aspect: {s.aspect ?? 'free'}</div>
                  <div>fit: {s.fit} · chrome: {s.chrome}</div>
                </dl>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resolved placements per slide */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            Resolved placements ({rows.length})
            {overrideCount > 0 && (
              <span className="ml-2 text-[11px] normal-case tracking-normal text-foreground/70">
                · {overrideCount} override{overrideCount === 1 ? '' : 's'} active
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearAll}
              disabled={overrideCount === 0}
              className="inline-flex items-center gap-1.5 text-[11.5px] px-2.5 py-1.5 rounded border border-border hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear overrides
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={overrideCount === 0}
              className="inline-flex items-center gap-1.5 text-[11.5px] px-2.5 py-1.5 rounded border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Download className="h-3.5 w-3.5" /> Export patched spec
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground italic border border-dashed border-border rounded-md p-4 text-center">
            No slides in this deck reference an image.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface-1/60 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 w-12">#</th>
                  <th className="text-left px-3 py-2">Slide</th>
                  <th className="text-left px-3 py-2">Image src</th>
                  <th className="text-left px-3 py-2 w-32">Auto slot</th>
                  <th className="text-left px-3 py-2 w-44">Role override</th>
                  <th className="text-left px-3 py-2 w-32">Effective</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ slide, resolved, auto, override }) => {
                  const isOverridden = Boolean(override);
                  return (
                    <tr key={slide.slideNumber} className="border-t border-border/60 hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-mono text-gold/80">{slide.slideNumber}</td>
                      <td className="px-3 py-2">
                        <Link to={`/${slide.slideNumber}`} className="hover:text-gold transition">
                          {slide.slideName || `Slide ${slide.slideNumber}`}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-foreground/70 truncate max-w-[280px]">
                        {slide.content.image}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                        {auto.slot.id}
                        <span className="block text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                          {auto.reason}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={override ?? ''}
                          onChange={(e) => setOverride(slide.slideNumber, e.target.value as ImageSlotId | '')}
                          className="w-full bg-surface-1/60 border border-border rounded px-2 py-1 text-[11.5px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-gold/60"
                          aria-label={`Image role override for slide ${slide.slideNumber}`}
                        >
                          <option value="">— auto —</option>
                          {IMAGE_SLOT_IDS.map((id) => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </td>
                      <td className={`px-3 py-2 font-mono text-[11.5px] ${isOverridden ? 'text-gold' : 'text-foreground/70'}`}>
                        {resolved.slot.id}
                        {isOverridden && (
                          <span className="block text-[9.5px] uppercase tracking-wider text-gold/70">
                            override
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {overrideCount > 0 && (
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Overrides are stored locally and applied to live previews via{' '}
            <code className="font-mono text-foreground/80">content.imageRole</code>.
            Export the JSON above and merge it into the slide spec files to make
            them permanent.
          </p>
        )}
      </section>
    </main>
  );
}
