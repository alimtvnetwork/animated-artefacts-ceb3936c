import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

/**
 * Roving tabindex for a flat list of focusable items.
 *
 * Returns:
 *   - `activeIdx` — index that currently owns `tabIndex={0}`.
 *   - `getItemProps(i)` — spread on each item; sets ref, tabIndex,
 *     onKeyDown (Arrow/Home/End), onFocus.
 *
 * One Tab stop per group; ArrowLeft/Right (or Up/Down) move focus
 * within the group.
 */
export function useRovingTabindex(count: number) {
  const [activeIdx, setActiveIdx] = useState(0);
  const refs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (activeIdx >= count) setActiveIdx(Math.max(0, count - 1));
  }, [count, activeIdx]);

  const focusAt = (i: number) => {
    const next = (i + count) % count;
    setActiveIdx(next);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>, i: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        focusAt(i + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        focusAt(i - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusAt(0);
        break;
      case 'End':
        e.preventDefault();
        focusAt(count - 1);
        break;
    }
  };

  const getItemProps = (i: number) => ({
    ref: (el: HTMLElement | null) => { refs.current[i] = el; },
    tabIndex: i === activeIdx ? 0 : -1,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => onKeyDown(e, i),
    onFocus: () => setActiveIdx(i),
  });

  return { activeIdx, getItemProps };
}
