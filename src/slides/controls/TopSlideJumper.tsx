/**
 * Top-mounted slide indicator + section jumper.
 *
 * Pinned to the top-center of the viewport, complementing the bottom-right
 * `SlideNumberBadge`. It serves two purposes:
 *
 *   1. **Always-visible position read-out** — large enough to read from across
 *      the room ("03 / 12"), but low-contrast so it never competes with slide
 *      content. Uses tabular-nums so the digits don't jitter as the count
 *      changes. The accent (gold) on the current number plus a hairline rule
 *      under it make it scannable in under a second.
 *
 *   2. **Double-click → section jumper** — single clicks are intentionally
 *      ignored (the bottom controller already handles its own click-to-jump
 *      number input, and we don't want stray top-area clicks to hijack focus
 *      every time the presenter moves the cursor up). A double-click opens a
 *      popover with:
 *        - a numeric input (Enter to jump, Esc to close)
 *        - a grouped list of every linear slide, partitioned by
 *          `SectionDividerSlide` markers when present, otherwise a flat list.
 *
 * # Why a popover instead of inline edit
 * The `SlideIndicator` in the controller bar already does inline-edit, and
 * that's fine for power users who know slide numbers by heart. The top jumper
 * is meant for moments mid-presentation when the presenter says "let's jump
 * back to the pricing section" — they need to *see* the section list, not
 * remember a number. Popover gives us room for titles + grouping.
 *
 * # Why double-click (not single)
 * The top edge is high-traffic — moving from any controller to a slide brings
 * the cursor through this region. Single-click would mean accidental popover
 * opens. Double-click is a deliberate gesture that matches the user's request
 * verbatim ("let me double-click the current number to jump").
 *
 * # Accessibility
 *   - The trigger has `aria-haspopup="dialog"` and `aria-expanded` reflecting
 *     popover state.
 *   - When open, focus moves to the numeric input.
 *   - Esc closes; clicking outside closes via the existing `Popover` primitive.
 *   - Each section heading is a real `<h3>` so screen readers announce
 *     hierarchy.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
// v0.48 — replaced the native `title=` browser hint with the styled Tooltip
// primitive so the chip matches the rest of the deck. Tooltip + Popover
// nest cleanly here because the popover opens on dblclick (not hover), so
// the tooltip never fights the popover for the same gesture.
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SlideSpec } from '@/slides/types';
import { SlideType } from '@/slides/enums';

interface Props {
  current: number;
  total: number;
  /** Linear slide list — used to populate the section/jump menu. */
  slides: SlideSpec[];
  /** Called when the user picks a slide. `n` is a 1-based linear index. */
  onJump: (n: number) => void;
}

interface Section {
  title: string;
  /** Linear-index range covered by this section (1-based, inclusive). */
  startIndex: number;
  items: { index: number; title: string; slideNumber: number }[];
}

/**
 * Group the linear slide list into sections delimited by SectionDivider slides.
 * If no dividers exist, returns a single "All slides" group so the jumper
 * still has something useful to show.
 */
function groupBySections(slides: SlideSpec[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  slides.forEach((s, idx) => {
    const oneBased = idx + 1;
    const title = s.content.title || s.content.eyebrow || `Slide ${oneBased}`;
    if (s.slideType === SlideType.SectionDividerSlide) {
      current = { title, startIndex: oneBased, items: [] };
      sections.push(current);
      // Section dividers themselves are still jumpable — list them as the
      // first item so "go to section X" lands on the divider, not the slide
      // after it.
      current.items.push({ index: oneBased, title, slideNumber: s.slideNumber });
      return;
    }
    if (!current) {
      current = { title: 'Intro', startIndex: oneBased, items: [] };
      sections.push(current);
    }
    current.items.push({ index: oneBased, title, slideNumber: s.slideNumber });
  });

  if (sections.length === 0) {
    sections.push({
      title: 'All slides',
      startIndex: 1,
      items: slides.map((s, idx) => ({
        index: idx + 1,
        title: s.content.title || s.content.eyebrow || `Slide ${idx + 1}`,
        slideNumber: s.slideNumber,
      })),
    });
  }
  return sections;
}

export function TopSlideJumper({ current, total, slides, onJump }: Props) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(String(current));
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the input mirrored to the active slide whenever the popover opens
  // (so it always shows the *current* number as the starting point, not the
  // previous attempt).
  useEffect(() => {
    if (open) {
      setVal(String(current));
      // Defer focus to next tick so Popover's own focus-trap doesn't fight us.
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [open, current]);

  const sections = useMemo(() => groupBySections(slides), [slides]);

  function commit() {
    const n = parseInt(val, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= total) {
      onJump(n);
      setOpen(false);
    }
  }

  function pick(n: number) {
    onJump(n);
    setOpen(false);
  }

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-30 select-none">
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <button
                type="button"
                // Single-click is a no-op (preventDefault) so the popover only
                // opens on the explicit double-click gesture the user asked for.
                onClick={(e) => e.preventDefault()}
                onDoubleClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={`Slide ${current} of ${total}. Double-click to jump.`}
                className="pointer-events-auto rounded-full border border-border/60 bg-background/55 backdrop-blur-md px-4 py-2 text-[13px] font-mono tracking-[0.18em] text-foreground/75 shadow-elegant hover:text-foreground hover:border-gold/50 transition"
              >
                <span className="text-gold tabular-nums">{String(current).padStart(2, '0')}</span>
                <span className="text-foreground/35 mx-2">/</span>
                <span className="tabular-nums">{String(total).padStart(2, '0')}</span>
              </button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="bottom">Double-click to jump to a section or slide</TooltipContent>
        </Tooltip>
        <PopoverContent
          align="center"
          sideOffset={8}
          className="pointer-events-auto w-[320px] p-0 bg-popover/95 backdrop-blur-xl border-border"
        >
          {/* Numeric jump — primary action, hence on top */}
          <div className="p-3 border-b border-border/60">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold mb-1.5">
              Jump to slide
            </label>
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commit(); }
                  if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
                }}
                inputMode="numeric"
                placeholder={`1–${total}`}
                className="h-9 font-mono text-sm"
              />
              <button
                type="button"
                onClick={commit}
                className="lift-hover-subtle h-9 px-3 rounded-md border border-input bg-background text-[12px] font-medium text-foreground/80 hover:text-gold hover:bg-gold/10 transition"
              >
                Go
              </button>
            </div>
          </div>

          {/* Section / slide list — scrollable so long decks don't blow up the popover */}
          <div className="max-h-[55vh] overflow-y-auto py-2">
            {sections.map((section) => (
              <div key={`${section.title}-${section.startIndex}`} className="px-2 pb-2">
                <h3 className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/40">
                  {section.title}
                </h3>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = item.index === current;
                    return (
                      <li key={item.slideNumber}>
                        <button
                          type="button"
                          onClick={() => pick(item.index)}
                          className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-left text-[12px] transition ${
                            isActive
                              ? 'bg-gold/15 text-gold'
                              : 'text-foreground/75 hover:bg-white/5 hover:text-foreground'
                          }`}
                        >
                          <span className={`font-mono tabular-nums w-7 text-right shrink-0 ${isActive ? 'text-gold' : 'text-foreground/40'}`}>
                            {String(item.index).padStart(2, '0')}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
