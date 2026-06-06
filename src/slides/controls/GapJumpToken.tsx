/**
 * Dot-pagination `…` gap token (spec 27/05).
 *
 * Collapsed strips hide a run of slides behind an ellipsis. Clicking the gap
 * opens an inline jump field — the same affordance the controller's
 * `SlideIndicator` offers — so the presenter can land on any hidden slide,
 * not just the midpoint. Shares validation via `resolveJumpTarget` (DRY) and
 * feeds the same MRU buffer via `pushJumpHistory`.
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { pushJumpHistory } from '../jumpHistory';
import { resolveJumpTarget } from './jumpTarget';

interface Props {
  /** Suggested slide (midpoint of the hidden run) — pre-fills the input. */
  suggested: number;
  total: number;
  onJump: (n: number) => void;
}

function notifyInvalid(kind: 'nan' | 'tooLow' | 'tooHigh', total: number) {
  if (kind === 'nan') {
    toast.error('Not a slide number', { description: `Type a number from 1 to ${total}.`, duration: 2200 });
    return;
  }
  if (kind === 'tooLow') {
    toast.info('Slides start at 1', { description: `Type a slide number from 1 to ${total}.`, duration: 2200 });
    return;
  }
  toast.error('Out of range', { description: `Deck has ${total} slides.`, duration: 2200 });
}

export function GapJumpToken({ suggested, total, onJump }: Props) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(suggested));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  function open() {
    setVal(String(suggested));
    setEditing(true);
  }

  function commit() {
    const res = resolveJumpTarget(val, total);
    setEditing(false);
    if (res.kind === 'cancel' || res.kind === 'tooHigh') {
      if (res.kind === 'tooHigh') notifyInvalid('tooHigh', total);
      return;
    }
    if (res.kind === 'ok') {
      onJump(res.slide);
      pushJumpHistory(res.slide);
      return;
    }
    notifyInvalid(res.kind, total);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        aria-label="Jump to a hidden slide"
        className="w-12 h-6 shrink-0 text-center bg-surface-2 border border-gold/40 rounded-full text-[11px] font-mono text-foreground outline-none focus:ring-2 focus:ring-gold/50"
      />
    );
  }

  return (
    <button
      onClick={open}
      aria-label={`Jump to a hidden slide (around ${suggested})`}
      className="relative shrink-0 h-6 w-5 flex items-center justify-center rounded-full text-foreground/45 hover:text-foreground text-[10px] leading-none focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
    >
      …
    </button>
  );
}
