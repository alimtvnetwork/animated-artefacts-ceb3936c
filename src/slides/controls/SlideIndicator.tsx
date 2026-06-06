import { useEffect, useRef, useState } from 'react';
// v0.98 — added double-tap (double-click) gesture to toggle the current slide's
// reveal-hint state. Single click still opens the inline jump-to-slide input.
// We disambiguate single vs double click with a 240ms timer so the input
// doesn't briefly appear on the way to the toggle.
//
// 2026-05-02 — added a "recent jumps" history dropdown rendered above the
// inline input. The history is shared with the keyboard quick-jump buffer
// (see `src/slides/jumpHistory.ts`) so successful jumps from either entry
// point feed the same MRU list. Click a chip to re-jump in one tap.
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { pushJumpHistory, useJumpHistory, clearJumpHistory } from '../jumpHistory';
import { History, X } from 'lucide-react';

interface Props {
  current: number;
  total: number;
  onJump: (n: number) => void;
  onDoubleTap?: () => void;
  doubleTapActive?: boolean;
}

export function SlideIndicator({ current, total, onJump, onDoubleTap, doubleTapActive }: Props) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(current));
  const inputRef = useRef<HTMLInputElement>(null);
  const clickTimer = useRef<number | null>(null);
  const history = useJumpHistory();

  useEffect(() => { setVal(String(current)); }, [current]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  useEffect(() => () => { if (clickTimer.current) window.clearTimeout(clickTimer.current); }, []);

  function commit() {
    const res = resolveJumpTarget(val, total);
    if (res.kind === 'cancel') { setEditing(false); return; }
    if (res.kind === 'nan') {
      toast.error('Not a slide number', { description: `Type a number from 1 to ${total}.`, duration: 2200 });
      setEditing(false);
      return;
    }
    if (res.kind === 'tooLow') {
      toast.info('Slides start at 1', { description: `Type a slide number from 1 to ${total}.`, duration: 2200 });
      setEditing(false);
      return;
    }
    if (res.kind === 'tooHigh') {
      toast.error(`No slide ${res.slide}`, { description: `Deck has ${total} slides.`, duration: 2200 });
      setEditing(false);
      return;
    }
    onJump(res.slide);
    pushJumpHistory(res.slide);
    setEditing(false);
  }

  function jumpFromHistory(n: number) {
    if (n >= 1 && n <= total) {
      onJump(n);
      pushJumpHistory(n); // move-to-front so the most-recently reused slot stays handy
    }
    setEditing(false);
  }

  function handleClick() {
    if (!onDoubleTap) {
      setEditing(true);
      return;
    }
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onDoubleTap();
      return;
    }
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      setEditing(true);
    }, 240);
  }

  if (editing) {
    // Filter history to slides still in range (deck may have shrunk between
    // sessions) and exclude the current slide so we never show a no-op chip.
    const recent = history.filter((n) => n >= 1 && n <= total && n !== current);
    return (
      <div className="relative">
        {recent.length > 0 && (
          <div
            // Anchored to the top of the input, opens downward so it never
            // collides with the controller pill (which now lives at the top
            // of the viewport, v1.9.0). `pointer-events-auto` because the
            // parent controller chrome is non-interactive while collapsed.
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-auto"
            role="group"
            aria-label="Recent slide jumps"
          >
            <div className="flex items-center gap-1 rounded-full border border-[hsl(var(--chrome-border))] bg-[hsl(var(--chrome-bg))]/95 px-2 py-1 shadow-elegant backdrop-blur-md whitespace-nowrap">
              <History className="h-3 w-3 text-[hsl(var(--chrome-fg-muted))]" aria-hidden />
              {recent.map((n) => (
                <button
                  key={n}
                  type="button"
                  // `onMouseDown` (not `onClick`) so the chip fires *before*
                  // the input's `onBlur` commits — otherwise blur would
                  // run `commit()` first and either jump to the typed
                  // value or do nothing, and the chip click would be lost.
                  onMouseDown={(e) => { e.preventDefault(); jumpFromHistory(n); }}
                  className="h-6 min-w-[1.75rem] px-1.5 rounded-full text-[11px] font-mono tabular-nums text-[hsl(var(--chrome-fg))] hover:bg-gold/15 hover:text-gold transition lift-hover-subtle"
                  aria-label={`Jump to slide ${n}`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); clearJumpHistory(); inputRef.current?.focus(); }}
                className="h-6 w-6 flex items-center justify-center rounded-full text-[hsl(var(--chrome-fg-muted))] hover:bg-[hsl(var(--chrome-hover))] transition"
                aria-label="Clear jump history"
                title="Clear history"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-16 h-9 text-center bg-surface-2 border border-gold/40 rounded-full text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-gold/50"
        />
      </div>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          aria-pressed={doubleTapActive}
          className={`lift-hover-subtle px-3 h-9 rounded-full text-sm font-mono tracking-wider transition min-w-[64px] ${
            doubleTapActive
              ? 'bg-gold/15 text-[hsl(var(--chrome-fg))] ring-1 ring-gold/60'
              : 'text-[hsl(var(--chrome-fg-muted))] hover:bg-[hsl(var(--chrome-hover))]'
          }`}
        >
          <span className="text-gold">{current}</span>
          <span className="text-[hsl(var(--chrome-fg-subtle))] mx-1">/</span>
          <span>{total}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" sideOffset={8}>
        {onDoubleTap ? 'Click to jump · double-tap to toggle reveal hints' : 'Click to jump'}
      </TooltipContent>
    </Tooltip>
  );
}
