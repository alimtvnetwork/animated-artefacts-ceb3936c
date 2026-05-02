/**
 * ThumbnailStrip — a horizontal scrollable filmstrip of every linear slide,
 * pinned to the bottom-left of the deck above the controller pill. Each tile
 * is a real `SlidePreview` (pixel-accurate scaled-down render) so the author
 * can pattern-match the deck at a glance and jump straight to any slide.
 *
 * UX:
 *   - Hover any tile → it lifts + ring highlights.
 *   - Click → jumps to that slide via the parent's `onJump`.
 *   - The active tile is marked with a gold ring + small "current" caret.
 *   - The strip auto-scrolls so the active tile stays in view as the deck
 *     advances (smooth scroll, no jank).
 *   - A small toggle button (visible alongside the strip) lets the user
 *     collapse/expand it; collapsed state persists in localStorage.
 *   - Keyboard: `T` toggles open/closed (handled in SlideDeckPage).
 *
 * Print/export: hidden via `data-print-hide` so it never appears in PDF/JPG/PNG
 * exports, mirroring the rest of the runtime chrome.
 */
import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, LayoutPanelTop } from 'lucide-react';
import type { SlideSpec } from '../types';
import { SlidePreview } from '../components/SlidePreview';

interface Props {
  /** All linear slides in display order (excludes click-reveal children). */
  slides: SlideSpec[];
  /** 1-based linear index of the currently active slide. */
  currentLinear: number;
  /** Callback when the user clicks a thumbnail; receives 1-based linear index. */
  onJump: (linearIndex: number) => void;
  /** Whether the strip is expanded. Controlled by parent so `T` shortcut works. */
  open: boolean;
  /** Toggle handler — flips `open`. */
  onToggle: () => void;
}

const TILE_WIDTH = 200; // px — readable preview without crowding the strip
const TILE_GAP = 12;

export function ThumbnailStrip({ slides, currentLinear, onJump, open, onToggle }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeTileRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the active tile into view whenever the current slide changes.
  // We use `nearest` + `center` to minimise unnecessary jumps when the active
  // tile is already visible.
  useEffect(() => {
    if (!open) return;
    const el = activeTileRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [currentLinear, open]);

  return (
    <>
      {/* Toggle — left-edge, icon-only by default. Hover reveals the
          label/chevron/T-hint at 20% opacity without moving the icon.
          See spec/slides/60-thumbnail-strip-toggle-left.md. */}
      <div
        data-print-hide="true"
        className="fixed left-3 bottom-24 z-40 pointer-events-none"
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? 'Hide thumbnail strip (T)' : 'Show thumbnail strip (T)'}
          className="group pointer-events-auto controller-pill relative flex items-center h-9 rounded-full transition-all duration-200 lift-hover-subtle overflow-visible"
          style={{ paddingLeft: 10, paddingRight: 10 }}
        >
          <LayoutPanelTop className="h-4 w-4 text-gold flex-shrink-0" />
          {/* Reveal-on-hover label. Absolutely positioned so the icon
              never shifts. 20% opacity per spec — whisper-quiet. */}
          <span
            aria-hidden="true"
            className="absolute left-full top-1/2 -translate-y-1/2 ml-1 flex items-center gap-1.5 text-xs whitespace-nowrap pl-1 pr-3 opacity-0 group-hover:opacity-20 group-focus-visible:opacity-20 transition-opacity duration-200"
            style={{ color: 'hsl(var(--chrome-fg))' }}
          >
            <span>Thumbnails</span>
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            <span className="ml-1">T</span>
          </span>
        </button>
      </div>

      {/* The strip itself — bottom-center as before, only mounted when open. */}
      <div
        data-print-hide="true"
        className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        style={{ bottom: 24 }}
        aria-label="Slide thumbnail strip"
      >
        <div className="flex flex-col items-center gap-2">
          {/* placeholder kept so layout structure stays explicit */}
        {/* The strip itself — only mounted when open so we don't pay the
            preview-render cost for every slide while collapsed. */}
        {open && (
          <div
            ref={scrollerRef}
            className="pointer-events-auto controller-pill rounded-2xl px-3 py-3 max-w-[92vw] overflow-x-auto overflow-y-hidden"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="flex items-stretch" style={{ gap: TILE_GAP }}>
              {slides.map((slide, i) => {
                const linearIndex = i + 1;
                const isActive = linearIndex === currentLinear;
                return (
                  <button
                    key={slide.slideNumber}
                    ref={isActive ? activeTileRef : undefined}
                    type="button"
                    onClick={() => onJump(linearIndex)}
                    aria-label={`Jump to slide ${linearIndex}: ${slide.content?.title ?? slide.slideType}`}
                    aria-current={isActive ? 'true' : undefined}
                    className={`group relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 lift-hover-subtle ring-1 ${
                      isActive
                        ? 'ring-2 ring-gold shadow-[0_0_20px_-4px_hsl(var(--gold)/0.6)]'
                        : 'ring-border/40 hover:ring-gold/60'
                    }`}
                    style={{ width: TILE_WIDTH }}
                  >
                    <SlidePreview slide={slide} width={TILE_WIDTH} />
                    {/* Slide number badge — sits in the bottom-left of every tile. */}
                    <span
                      className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                        isActive
                          ? 'bg-gold text-background'
                          : 'bg-background/80 text-foreground/70 group-hover:text-foreground'
                      }`}
                    >
                      {linearIndex}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
