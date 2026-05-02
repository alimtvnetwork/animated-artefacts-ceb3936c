/**
 * ShortcutHint — tiny dark pill that briefly surfaces a keyboard binding to
 * the presenter at the moment it becomes relevant.
 *
 * Rendered top-right of the deck (just under the slide-number badge), styled
 * to match the controller pill so it reads as part of the chrome rather than
 * a teaching modal. Two hints currently flow through this component:
 *
 *   • `'toc'`   — `Ctrl+1` / `⌘+1` toggles the slide outline sidebar.
 *                 Surfaced once per browser on first load (deck > 4 slides).
 *   • `'shape'` — `O` toggles webcam circle / rectangle shape.
 *                 Surfaced once per browser on first camera turn-on.
 *
 * Each hint is dismissible:
 *   - Auto-fades after `AUTO_HIDE_MS` (2400ms).
 *   - Click ✕ → dismissed permanently (localStorage).
 *   - Pressing the bound key elsewhere ALSO dismisses (parent calls
 *     `markShortcutHintSeen(kind)`).
 *
 * Once dismissed, the hint never reappears for that browser. No-op for users
 * who've already pressed the key — the parent skips the trigger entirely.
 *
 * Respects `prefers-reduced-motion`: the slide-in / fade-out keyframes
 * collapse to instant via the existing `data-reduce-motion` cascade.
 */
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export type ShortcutHintKind = 'toc' | 'shape';

const STORAGE_KEY = 'riseup.shortcutHints.dismissed';
const AUTO_HIDE_MS = 2400;

/** Read the dismissed-set from localStorage. Tolerant of corrupt JSON. */
function readDismissed(): Set<ShortcutHintKind> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is ShortcutHintKind => x === 'toc' || x === 'shape'));
  } catch {
    return new Set();
  }
}

function writeDismissed(set: Set<ShortcutHintKind>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* quota / privacy mode — in-memory state still wins */
  }
}

/** Public helper — call when the user presses the bound key, even if the
 *  hint isn't on screen. Idempotent. */
export function markShortcutHintSeen(kind: ShortcutHintKind): void {
  const set = readDismissed();
  if (set.has(kind)) return;
  set.add(kind);
  writeDismissed(set);
}

/** Public helper — has the user already dismissed/seen this hint? */
export function isShortcutHintDismissed(kind: ShortcutHintKind): boolean {
  return readDismissed().has(kind);
}

/** ⌘ on macOS, Ctrl elsewhere. SSR-safe. */
function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  // navigator.platform is deprecated but still the most reliable signal.
  // userAgentData.platform is preferred when available.
  const uaPlat = (navigator as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData?.platform;
  const plat = uaPlat ?? navigator.platform ?? '';
  return /mac/i.test(plat);
}

interface Kbd {
  /** Glyph rendered inside the <kbd>. */
  label: string;
  /** Optional aria-label override (e.g. "Command" for ⌘). */
  aria?: string;
}

interface HintCopy {
  keys: Kbd[];
  /** Plain-text label ("Toggle slide outline"). */
  label: string;
}

function copyFor(kind: ShortcutHintKind, mac: boolean): HintCopy {
  if (kind === 'toc') {
    return {
      keys: mac
        ? [{ label: '⌘', aria: 'Command' }, { label: '1' }]
        : [{ label: 'Ctrl' }, { label: '1' }],
      label: 'Toggle slide outline',
    };
  }
  return {
    keys: [{ label: 'O' }],
    label: 'Toggle webcam shape',
  };
}

interface Props {
  kind: ShortcutHintKind;
  /** Externally-controlled visibility. Parent flips this to true to show;
   *  the component flips it to false on auto-fade or ✕ click. */
  open: boolean;
  onClose: () => void;
}

export function ShortcutHint({ kind, open, onClose }: Props) {
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);
  // Track the nested fade-out timer in a ref. We can't stash it on the
  // outer setTimeout id because browser timer ids are primitive numbers
  // and assigning a property to a number throws under strict mode
  // ("Cannot create property '_t2' on number 'NNN'").
  const fadeTimerRef = useRef<number | null>(null);

  // Mount when opened, schedule auto-hide.
  useEffect(() => {
    if (!open) {
      setMounted(false);
      setExiting(false);
      return;
    }
    setMounted(true);
    setExiting(false);
    const t = window.setTimeout(() => {
      setExiting(true);
      // Allow the fade-out keyframe to play before unmounting.
      fadeTimerRef.current = window.setTimeout(() => {
        // Mark as dismissed so the parent doesn't immediately re-trigger
        // on the next mount/state change.
        markShortcutHintSeen(kind);
        fadeTimerRef.current = null;
        onClose();
      }, 220);
    }, AUTO_HIDE_MS);
    return () => {
      window.clearTimeout(t);
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, [open, kind, onClose]);

  const handleDismiss = () => {
    markShortcutHintSeen(kind);
    setExiting(true);
    window.setTimeout(onClose, 220);
  };

  if (!mounted) return null;

  const mac = isMacPlatform();
  const { keys, label } = copyFor(kind, mac);

  return (
    <div
      data-print-hide="true"
      role="status"
      aria-live="polite"
      className={[
        'pointer-events-auto fixed z-[55] right-4 top-20',
        'rounded-full border border-gold/40 bg-[hsl(var(--chrome-bg))]/95',
        'shadow-2xl backdrop-blur-md',
        'flex items-center gap-2 pl-3 pr-1.5 py-1.5',
        exiting ? 'animate-fade-out' : 'animate-slide-in-right',
      ].join(' ')}
    >
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[hsl(var(--chrome-fg-muted))] text-xs">+</span>}
            <kbd
              aria-label={k.aria}
              className="inline-flex items-center justify-center min-w-[22px] h-6 px-1.5 rounded-md border border-border/60 bg-[hsl(var(--chrome-bg))] text-gold font-mono text-xs"
            >
              {k.label}
            </kbd>
          </span>
        ))}
      </span>
      <span className="text-xs text-[hsl(var(--chrome-fg))] whitespace-nowrap">
        {label}
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss shortcut hint"
        className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full text-[hsl(var(--chrome-fg-muted))] hover:text-[hsl(var(--chrome-fg))] hover:bg-foreground/10 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
