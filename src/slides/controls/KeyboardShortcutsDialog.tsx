import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Single source of truth for every keyboard shortcut surfaced to the
 * presenter. Re-imported by the controller hamburger so we never
 * duplicate the list.
 *
 * See `mem://features/keyboard-shortcuts-dialog`.
 */
export const SHORTCUTS: ReadonlyArray<{
  group: string;
  items: ReadonlyArray<{ keys: string[]; label: string }>;
}> = [
  {
    group: 'Deck navigation',
    items: [
      { keys: ['→', 'Space', 'Enter'], label: 'Next slide' },
      { keys: ['←', 'Backspace'], label: 'Previous slide' },
      { keys: ['G'], label: 'Toggle slide overview' },
      { keys: ['F'], label: 'Toggle fullscreen' },
      { keys: ['J'], label: 'Toggle top slide jumper' },
      { keys: ['Esc'], label: 'Exit fullscreen / close overlay' },
      { keys: ['/'], label: 'Open this keyboard map' },
    ],
  },
  {
    group: 'Quick jump',
    items: [
      { keys: ['0', '–', '9'], label: 'Type slide number (e.g. 1 2)' },
      { keys: ['Enter'], label: 'Jump to typed slide number' },
      { keys: ['Backspace'], label: 'Delete last digit' },
      { keys: ['Esc'], label: 'Cancel pending jump' },
    ],
  },
  {
    group: 'Sidebar',
    items: [
      { keys: ['Ctrl', '1'], label: 'Toggle slide outline sidebar (⌘+1 on macOS)' },
      { keys: ['Esc'], label: 'Close sidebar when open' },
    ],
  },
  {
    group: 'Presenter webcam',
    items: [
      { keys: ['I'], label: 'Hard toggle webcam' },
      { keys: ['M'], label: 'Minimize / restore webcam' },
      { keys: ['F'], label: 'Auto-frame face' },
      { keys: ['+', '−'], label: 'Resize webcam' },
      { keys: ['H'], label: 'Toggle soft halo (default off)' },
      { keys: ['1'], label: 'Stage-fill (cover slide)' },
      { keys: ['O'], label: 'Cycle shape: rect → circle → circle + glow' },
      { keys: ['P'], label: 'Enter webcam fullscreen' },
      { keys: ['['], label: 'Exit fullscreen (plain)' },
      { keys: [']'], label: 'Cinematic 3-state cycle' },
      { keys: ['Esc'], label: 'Exit fullscreen / stage' },
    ],
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * `/` keyboard listener — global, guarded against form-field focus.
 * Mounted alongside the dialog so callers don't need to wire it up.
 * Single-press, no Shift required (changed from `?` 2026-05-05).
 */
function useSlashOpener(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Plain `/` only — ignore Shift+/ (which is `?`) and any modified press.
      if (e.key !== '/' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      e.preventDefault();
      onOpen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  useSlashOpener(() => onOpenChange(true));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs font-mono">?</kbd> any time to open this map.
            <kbd className="ml-2 px-1 py-0.5 rounded bg-muted text-xs font-mono">Esc</kbd> closes it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          {SHORTCUTS.map((group) => (
            <section key={group.group}>
              <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide opacity-70">
                {group.group}
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {group.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-border/40 last:border-0">
                      <td className="py-1.5 pr-4 w-1/3">
                        <span className="inline-flex flex-wrap gap-1">
                          {item.keys.map((k, i) => (
                            <kbd
                              key={i}
                              className="px-2 py-0.5 rounded bg-muted text-xs font-mono border border-border"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </td>
                      <td className="py-1.5 text-muted-foreground">{item.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
