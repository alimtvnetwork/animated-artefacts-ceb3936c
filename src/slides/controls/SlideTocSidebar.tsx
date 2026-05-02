/**
 * Slide Table-of-Contents Sidebar (v0.184)
 *
 * A left-edge, collapsible sidebar that lists every linear slide in the active
 * deck and lets the presenter jump to any of them with a click. Includes a
 * search input that filters by title, eyebrow, slide-type label, or slide
 * number — useful in long decks where the bottom thumbnail strip and top
 * jumper popover both feel cramped.
 *
 * # Why a left sidebar (not yet another popover)
 *   - The bottom `ThumbnailStrip` is great for scrubbing visually adjacent
 *     slides but is poor for "find slide about pricing" — there's no text.
 *   - The `TopSlideJumper` popover lists titles but is modal and disappears
 *     after a pick; you can't keep it open while you scan.
 *   - A persistent sidebar is the standard pattern for searchable navigation
 *     (Notion, Linear, VS Code), and we hide it behind a hover-revealed edge
 *     so the slide stage stays clean for the audience.
 *
 * # Behavior
 *   - Default: collapsed. A thin gold strip on the left edge reveals the
 *     full sidebar on hover, and the `O` keyboard shortcut toggles it open
 *     (sticky — survives mouse-leave once opened).
 *   - State persists in `localStorage["riseup.tocSidebar"]`.
 *   - Search is case-insensitive substring match across title, eyebrow,
 *     slide-type label, and the 1-based linear index ("3", "03").
 *   - Picking a slide calls `onJump(linearIndex)` (1-based) — same contract
 *     as `TopSlideJumper`/`ThumbnailStrip`.
 *   - Hidden via `data-print-hide` so it never bleeds into PDF exports.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ListTree } from 'lucide-react';
import type { SlideSpec } from '@/slides/types';
import { SlideType } from '@/slides/enums';

interface Props {
  slides: SlideSpec[];
  /** 1-based linear index of the active slide. */
  currentLinear: number;
  /** Called with a 1-based linear index. */
  onJump: (n: number) => void;
  open: boolean;
  onToggle: () => void;
}

/** Pretty label for a slide type (drops the trailing "Slide" suffix). */
function typeLabel(t: string): string {
  const s = String(t);
  return s.endsWith('Slide') ? s.slice(0, -5) : s;
}

export function SlideTocSidebar({ slides, currentLinear, onJump, open, onToggle }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the search box when the sidebar opens.
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Scroll the active slide into view whenever the sidebar opens or the
  // active slide changes while the sidebar is open.
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 80);
    return () => clearTimeout(id);
  }, [open, currentLinear]);

  const items = useMemo(() => {
    return slides.map((s, idx) => {
      const oneBased = idx + 1;
      const title = s.content.title || s.content.eyebrow || `Slide ${oneBased}`;
      const eyebrow = s.content.eyebrow || '';
      const tLabel = typeLabel(s.slideType);
      return {
        index: oneBased,
        slideNumber: s.slideNumber,
        title,
        eyebrow,
        typeLabel: tLabel,
        haystack: `${oneBased} ${String(oneBased).padStart(2, '0')} ${title} ${eyebrow} ${tLabel}`.toLowerCase(),
        isDivider: s.slideType === SlideType.SectionDividerSlide,
      };
    });
  }, [slides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.haystack.includes(q));
  }, [items, query]);

  return (
    <>
      {/* Edge trigger — always present, hover-reveals the sidebar even when
          collapsed. Click acts as the explicit toggle. Stays narrow so it
          doesn't compete with slide content. */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? 'Close slide outline' : 'Open slide outline'}
        aria-expanded={open}
        data-print-hide
        className={[
          'group fixed left-0 top-1/2 -translate-y-1/2 z-30',
          'h-24 w-2 rounded-r-md bg-gold/30 hover:bg-gold/70 hover:w-3 transition-all',
          'flex items-center justify-center',
          open ? 'opacity-0 pointer-events-none' : 'opacity-100',
        ].join(' ')}
      >
        <ListTree className="h-3.5 w-3.5 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Sidebar panel */}
      <aside
        data-print-hide
        aria-hidden={!open}
        className={[
          'fixed top-0 left-0 h-full z-40 w-[300px] max-w-[85vw]',
          'bg-popover/95 backdrop-blur-xl border-r border-border',
          'shadow-elegant',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'flex flex-col',
        ].join(' ')}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <ListTree className="h-4 w-4 text-gold" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              Slides ({slides.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Close slide outline"
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-foreground/60 hover:text-foreground hover:bg-white/5 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-3 py-2.5 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  if (query) {
                    e.preventDefault();
                    setQuery('');
                  } else {
                    e.preventDefault();
                    onToggle();
                  }
                }
                if (e.key === 'Enter' && filtered.length > 0) {
                  e.preventDefault();
                  onJump(filtered[0].index);
                }
              }}
              placeholder="Search slides…"
              className="w-full h-9 pl-8 pr-7 rounded-md bg-background/60 border border-input text-[12px] text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded text-foreground/50 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[10px] text-foreground/40 px-0.5">
            {filtered.length === items.length
              ? `${items.length} slides · O to toggle`
              : `${filtered.length} of ${items.length} match`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {filtered.length === 0 && (
            <p className="text-center text-[11px] text-foreground/40 italic py-8">
              No slides match “{query}”.
            </p>
          )}
          <ul className="space-y-0.5">
            {filtered.map((item) => {
              const isActive = item.index === currentLinear;
              return (
                <li key={item.slideNumber}>
                  <button
                    ref={isActive ? activeRef : undefined}
                    type="button"
                    onClick={() => onJump(item.index)}
                    className={[
                      'w-full flex items-start gap-3 px-2 py-2 rounded-md text-left transition',
                      isActive
                        ? 'bg-gold/15 text-gold'
                        : 'text-foreground/80 hover:bg-white/5 hover:text-foreground',
                      item.isDivider ? 'border-l-2 border-gold/40 pl-1.5' : '',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'font-mono tabular-nums text-[11px] w-7 text-right shrink-0 mt-0.5',
                        isActive ? 'text-gold' : 'text-foreground/40',
                      ].join(' ')}
                    >
                      {String(item.index).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] leading-tight truncate">
                        {item.title}
                      </span>
                      <span className="block text-[10px] uppercase tracking-[0.14em] text-foreground/35 truncate mt-0.5">
                        {item.typeLabel}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}
