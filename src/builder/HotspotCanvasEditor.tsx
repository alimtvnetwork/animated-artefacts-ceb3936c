/**
 * Visual hotspot editor — draws the current slide as a scaled preview and
 * lets the author drag rectangles directly on top to define click-reveal
 * regions. Each rectangle is persisted as a `HotspotSpec` ({x,y,width,height}
 * in % of the 1920x1080 stage), which the runtime `HotspotLayer` already
 * mounts on every slide via `SlideStage`.
 *
 * Interactions:
 *   - Drag on empty canvas → creates a new hotspot rectangle.
 *   - Click an existing hotspot → selects it (handles + side panel appear).
 *   - Drag the body of a selected hotspot → moves it.
 *   - Drag any of the 8 handles → resizes (with min 2% w/h floor).
 *   - Esc / click empty canvas → deselect.
 *   - Delete / Backspace while selected → removes the hotspot.
 *   - Side panel: target slide #, label, style, OR clear-then-set `expand`.
 *
 * Coordinate model: every position in spec is a % of the stage. We compute
 * the canvas DOM rect once per pointer event and project pointer x/y → %.
 * Clamping happens at the % level so the result is always in [0, 100].
 *
 * Why a separate file from `HotspotLayer`: the layer is read-only render code
 * shared by every slide at runtime; the editor is a heavy DnD-enabled author
 * surface only mounted in the builder. Keeping them split means the runtime
 * bundle pays nothing for the editor.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, MousePointer2, Square as SquareIcon, Eye, EyeOff } from 'lucide-react';
import type { HotspotSpec, SlideSpec } from '../slides/types';
import { SlidePreview } from '../slides/components/SlidePreview';
import { Field, SelectField, TextField } from './FormPrimitives';
import { ClickRevealToggle } from './ClickRevealToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  slide: SlideSpec;
  /** Linear list of all slides — used to populate the "reveal target" dropdown. */
  allSlides: SlideSpec[];
  hotspots: HotspotSpec[];
  onChange: (next: HotspotSpec[]) => void;
  /** Canvas width in CSS px. Height is auto-derived (16:9). */
  canvasWidth?: number;
}

const STAGE_W = 1920;
const STAGE_H = 1080;
const MIN_PCT = 2; // never let a hotspot shrink below 2% so it stays clickable

type DragMode =
  | { kind: 'idle' }
  | { kind: 'create'; startXPct: number; startYPct: number }
  | { kind: 'move'; index: number; offsetXPct: number; offsetYPct: number }
  | {
      kind: 'resize';
      index: number;
      handle: ResizeHandle;
      startBox: { x: number; y: number; width: number; height: number };
      anchorXPct: number; // pointer position when drag started, in %
      anchorYPct: number;
    };

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
  e:  'ew-resize',                    w:  'ew-resize',
  sw: 'nesw-resize', s: 'ns-resize', se: 'nwse-resize',
};

export function HotspotCanvasEditor({
  slide,
  allSlides,
  hotspots,
  onChange,
  canvasWidth = 720,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragMode>({ kind: 'idle' });
  const [selected, setSelected] = useState<number | null>(null);
  const [showOutlines, setShowOutlines] = useState(true);

  const canvasHeight = canvasWidth * (STAGE_H / STAGE_W);

  /** Project a clientX/clientY pair to the [0, 100] % space of the canvas. */
  const toPct = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
  }, []);

  // ─── Drag-to-create on empty canvas ──────────────────────────────────────
  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ignore right-click + clicks that bubbled up from a hotspot/handle.
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('[data-hotspot-id]') ||
          (e.target as HTMLElement).closest('[data-hotspot-handle]')) {
        return;
      }
      const { x, y } = toPct(e.clientX, e.clientY);
      const newSpot: HotspotSpec = { x, y, width: 0, height: 0, style: 'outline' };
      onChange([...hotspots, newSpot]);
      setSelected(hotspots.length);
      setDrag({ kind: 'create', startXPct: x, startYPct: y });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      e.preventDefault();
    },
    [hotspots, onChange, toPct],
  );

  const onCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (drag.kind === 'idle') return;
      const { x, y } = toPct(e.clientX, e.clientY);

      if (drag.kind === 'create') {
        const idx = hotspots.length - 1;
        const next = [...hotspots];
        const left = Math.min(drag.startXPct, x);
        const top = Math.min(drag.startYPct, y);
        const w = Math.abs(x - drag.startXPct);
        const h = Math.abs(y - drag.startYPct);
        next[idx] = { ...next[idx], x: left, y: top, width: w, height: h };
        onChange(next);
        return;
      }

      if (drag.kind === 'move') {
        const next = [...hotspots];
        const cur = next[drag.index];
        if (!cur) return;
        const newX = clamp(x - drag.offsetXPct, 0, 100 - cur.width);
        const newY = clamp(y - drag.offsetYPct, 0, 100 - cur.height);
        next[drag.index] = { ...cur, x: newX, y: newY };
        onChange(next);
        return;
      }

      if (drag.kind === 'resize') {
        const next = [...hotspots];
        const cur = next[drag.index];
        if (!cur) return;
        const dx = x - drag.anchorXPct;
        const dy = y - drag.anchorYPct;
        let { x: nx, y: ny, width: nw, height: nh } = drag.startBox;
        if (drag.handle.includes('e')) nw = clamp(drag.startBox.width + dx, MIN_PCT, 100 - drag.startBox.x);
        if (drag.handle.includes('s')) nh = clamp(drag.startBox.height + dy, MIN_PCT, 100 - drag.startBox.y);
        if (drag.handle.includes('w')) {
          const right = drag.startBox.x + drag.startBox.width;
          nx = clamp(drag.startBox.x + dx, 0, right - MIN_PCT);
          nw = right - nx;
        }
        if (drag.handle.includes('n')) {
          const bottom = drag.startBox.y + drag.startBox.height;
          ny = clamp(drag.startBox.y + dy, 0, bottom - MIN_PCT);
          nh = bottom - ny;
        }
        next[drag.index] = { ...cur, x: nx, y: ny, width: nw, height: nh };
        onChange(next);
      }
    },
    [drag, hotspots, onChange, toPct],
  );

  const onCanvasPointerUp = useCallback(() => {
    if (drag.kind === 'create') {
      // Drop hotspots that are too small to interact with.
      const idx = hotspots.length - 1;
      const cur = hotspots[idx];
      if (cur && (cur.width < MIN_PCT || cur.height < MIN_PCT)) {
        onChange(hotspots.slice(0, idx));
        setSelected(null);
      }
    }
    setDrag({ kind: 'idle' });
  }, [drag, hotspots, onChange]);

  // ─── Keyboard: Delete / Esc on selected hotspot ──────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;
      if (selected === null) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onChange(hotspots.filter((_, i) => i !== selected));
        setSelected(null);
      } else if (e.key === 'Escape') {
        setSelected(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, hotspots, onChange]);

  // ─── Side-panel update helpers for the selected hotspot ──────────────────
  const updateSelected = useCallback(
    (patch: Partial<HotspotSpec>) => {
      if (selected === null) return;
      const next = [...hotspots];
      next[selected] = { ...next[selected], ...patch };
      onChange(next);
    },
    [selected, hotspots, onChange],
  );

  const slideOptions = useMemo(
    () =>
      allSlides
        .filter((s) => s.slideNumber !== slide.slideNumber)
        .map((s) => ({
          value: String(s.slideNumber),
          label: `#${s.slideNumber} — ${s.content?.title ?? s.slideName ?? s.slideType}${
            s.isClickReveal ? ' (hidden)' : ''
          }`,
        })),
    [allSlides, slide.slideNumber],
  );

  const sel = selected !== null ? hotspots[selected] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Drag on the canvas to create. Click a hotspot to select; drag handles to resize. <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Del</kbd> removes the selected one.
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowOutlines((v) => !v)}
            className="h-7 px-2 text-xs"
            title="Toggle outline visibility"
          >
            {showOutlines ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
            Outlines
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const next: HotspotSpec = { x: 40, y: 40, width: 20, height: 15, style: 'outline' };
              onChange([...hotspots, next]);
              setSelected(hotspots.length);
            }}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* The canvas itself: SlidePreview at the back, transparent overlay for
          DnD on top so pointer events stay inside our handlers. */}
      <div
        ref={canvasRef}
        className="relative rounded-lg overflow-hidden border-2 border-border bg-surface-1 select-none touch-none"
        style={{ width: canvasWidth, height: canvasHeight, cursor: drag.kind === 'idle' ? 'crosshair' : 'grabbing' }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerCancel={onCanvasPointerUp}
      >
        <div className="absolute inset-0 pointer-events-none">
          <SlidePreview slide={slide} width={canvasWidth} />
        </div>

        {/* Hotspot overlays */}
        {hotspots.map((h, i) => {
          const isSelected = i === selected;
          const isOutline = h.style === 'outline' || isSelected || showOutlines;
          return (
            <div
              key={i}
              data-hotspot-id={i}
              role="button"
              aria-label={h.label ?? `Hotspot ${i + 1}`}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                const { x, y } = toPct(e.clientX, e.clientY);
                setSelected(i);
                setDrag({
                  kind: 'move',
                  index: i,
                  offsetXPct: x - h.x,
                  offsetYPct: y - h.y,
                });
                e.stopPropagation();
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              }}
              className={`absolute rounded-md transition-shadow ${
                isSelected
                  ? 'ring-2 ring-gold shadow-[0_0_24px_-6px_hsl(var(--gold)/0.7)] bg-gold/10'
                  : isOutline
                    ? 'border-2 border-dashed border-gold/60 bg-gold/5 hover:bg-gold/15'
                    : 'border border-foreground/10 bg-foreground/5 hover:bg-gold/10'
              }`}
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: `${h.width}%`,
                height: `${h.height}%`,
                cursor: isSelected ? 'move' : 'pointer',
              }}
            >
              {/* Label badge — only when there's a label or a target so the
                  author can spot the hotspot at a glance. */}
              {(h.label || h.revealSlide || h.expand) && (
                <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono bg-gold text-background whitespace-nowrap">
                  {h.label ?? (h.revealSlide ? `→ #${h.revealSlide}` : 'expand')}
                </span>
              )}

              {/* Resize handles — only on the selected hotspot. */}
              {isSelected &&
                HANDLES.map((handle) => (
                  <div
                    key={handle}
                    data-hotspot-handle={handle}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      const { x, y } = toPct(e.clientX, e.clientY);
                      setDrag({
                        kind: 'resize',
                        index: i,
                        handle,
                        startBox: { x: h.x, y: h.y, width: h.width, height: h.height },
                        anchorXPct: x,
                        anchorYPct: y,
                      });
                      e.stopPropagation();
                      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                    }}
                    className="absolute h-3 w-3 bg-gold border-2 border-background rounded-sm"
                    style={{
                      ...handlePosStyle(handle),
                      cursor: HANDLE_CURSORS[handle],
                    }}
                  />
                ))}
            </div>
          );
        })}

        {hotspots.length === 0 && drag.kind === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-background/80 text-xs text-muted-foreground flex items-center gap-2">
              <MousePointer2 className="h-3.5 w-3.5 text-gold" />
              Drag anywhere on the slide to create a hotspot
            </div>
          </div>
        )}
      </div>

      {/* Selection inspector — target slide / label / style for the selected
          hotspot. Only mounts when there's a selection. */}
      {sel && selected !== null ? (
        <div className="rounded-lg border border-gold/40 bg-surface-1/60 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              <SquareIcon className="h-3.5 w-3.5" /> Hotspot {selected + 1}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(hotspots.filter((_, i) => i !== selected));
                setSelected(null);
              }}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
            </Button>
          </div>

          {/* Per-hotspot click-reveal enable/disable. A hotspot with no
              reveal target is dropped at runtime by `HotspotLayer`, so we
              expose this as an explicit on/off switch instead of relying on
              the dropdown's "— None —" option (which authors kept missing).
              Toggling on seeds the first available slide so the preview is
              instantly clickable; toggling off clears the target. */}
          <ClickRevealToggle
            value={sel.revealSlide}
            onChange={(n) => updateSelected({ revealSlide: n })}
            slideOptions={slideOptions}
            label="Click reveal"
            helpEnabled="Hotspot routes the deck to this slide on click. Use a hidden ClickRevealSlide for detail content."
            helpDisabled="Hotspot is inert — won't render at runtime until you enable a reveal target."
          />

          <TextField
            label="Label (a11y + tooltip)"
            value={sel.label ?? ''}
            onChange={(v) => updateSelected({ label: v || undefined })}
            placeholder="What this hotspot reveals"
          />

          <SelectField
            label="Style"
            value={sel.style ?? 'ghost'}
            options={[
              { value: 'ghost',   label: 'Ghost (invisible until hover)' },
              { value: 'outline', label: 'Outline (faint dashed box)' },
            ]}
            onChange={(v) => updateSelected({ style: v as 'ghost' | 'outline' })}
            hint="Ghost is recommended for production. Outline helps during authoring."
          />

          {/* Live numeric box (read-only, but useful for double-checking the
              precise spec values after a drag). */}
          <Field label="Box (% of stage)">
            <div className="grid grid-cols-4 gap-2">
              {(['x', 'y', 'width', 'height'] as const).map((k) => (
                <div key={k}>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-0.5">{k}</p>
                  <Input
                    type="number"
                    value={Number(sel[k].toFixed(1))}
                    min={0}
                    max={100}
                    step={0.5}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (!Number.isFinite(n)) return;
                      updateSelected({ [k]: clamp(n, 0, 100) } as Partial<HotspotSpec>);
                    }}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          </Field>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic px-1">
          {hotspots.length === 0
            ? 'No hotspots yet. Drag on the canvas above to create one.'
            : `${hotspots.length} hotspot${hotspots.length === 1 ? '' : 's'} — click any to edit.`}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function handlePosStyle(handle: ResizeHandle): React.CSSProperties {
  // Each handle is 12x12; we offset by -6 to center on the corner/edge.
  const pos: React.CSSProperties = {};
  if (handle.includes('n')) pos.top = -6;
  if (handle.includes('s')) pos.bottom = -6;
  if (handle.includes('w')) pos.left = -6;
  if (handle.includes('e')) pos.right = -6;
  if (handle === 'n' || handle === 's') { pos.left = '50%'; pos.marginLeft = -6; }
  if (handle === 'e' || handle === 'w') { pos.top = '50%'; pos.marginTop = -6; }
  return pos;
}
