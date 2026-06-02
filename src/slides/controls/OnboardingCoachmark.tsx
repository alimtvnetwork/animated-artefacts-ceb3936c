/**
 * OnboardingCoachmark — first-run "story" popup that teaches the core
 * controller keys. Shown once (gated by `useOnboardingFlag`), re-openable from
 * the presenter menu ("Show intro again").
 *
 * Implements spec/controller-2026/11-build-substeps-C07.md:
 *  - C07.2  centered card shell (Radix Dialog → focus-trap + Esc + restore)
 *  - C07.3  core key legend pulled from the single `SHORTCUTS` source
 *  - C07.4  ≤3-step story (nav → fullscreen → shortcuts + music)
 *  - C07.5  teach-by-doing: pressing `→` while open advances the story
 *  - C07.6  respects prefers-reduced-motion
 *  - C07.7  every dismiss path persists the onboarded flag
 *  - C07.9  a11y handled by Radix Dialog (trap + initial + restore focus)
 */
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Maximize2, Keyboard, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useReduceMotion } from '../components/reducedMotionToggle';
import { SHORTCUTS } from './KeyboardShortcutsDialog';

interface Props {
  open: boolean;
  /** Called on every dismiss path so the parent can persist the flag. */
  onDismiss: () => void;
}

interface Story {
  icon: typeof ArrowRight;
  title: string;
  body: string;
  /** Keys (from the deck-nav SHORTCUTS group) to highlight on this step. */
  keys: string[];
}

/** Pull live key labels from the single SHORTCUTS source so they never drift. */
function deckKeys(label: string): string[] {
  const nav = SHORTCUTS.find((g) => g.group === 'Deck navigation');
  return nav?.items.find((i) => i.label === label)?.keys ?? [];
}

export function OnboardingCoachmark({ open, onDismiss }: Props) {
  const reduceMotion = useReduceMotion();
  const [step, setStep] = useState(0);

  const story: Story[] = useMemo(
    () => [
      {
        icon: ArrowRight,
        title: 'Move through the deck',
        body: 'Use the arrow keys (or Space / Enter) to advance and go back.',
        keys: [...deckKeys('Next slide'), ...deckKeys('Previous slide')],
      },
      {
        icon: Maximize2,
        title: 'Go fullscreen',
        body: 'Press F to fill the screen for presenting. Esc brings the chrome back.',
        keys: [...deckKeys('Toggle fullscreen'), 'Esc'],
      },
      {
        icon: Keyboard,
        title: 'Everything else',
        body: 'Press / any time to see the full keyboard map. The controller hides until you need it.',
        keys: deckKeys('Open this keyboard map'),
      },
    ],
    [],
  );

  const isLast = step === story.length - 1;

  // Reset to step 0 whenever the popup (re)opens.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // C07.5 — teach-by-doing: pressing `→` while open advances the story step
  // (without navigating the deck). On the last step it dismisses.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight') return;
      e.preventDefault();
      e.stopPropagation();
      setStep((s) => {
        if (s >= story.length - 1) {
          onDismiss();
          return s;
        }
        return s + 1;
      });
    };
    // Capture phase so we intercept before the global deck-nav handler.
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [open, story.length, onDismiss]);

  const advance = () => {
    if (isLast) onDismiss();
    else setStep((s) => s + 1);
  };

  const active = story[step];
  const Icon = active.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onDismiss(); }}>
      <DialogContent
        className="max-w-md text-center"
        // C07.6 — disable the zoom/slide entrance under reduced motion.
        style={reduceMotion ? { animation: 'none' } : undefined}
      >
        <DialogHeader className="items-center text-center sm:text-center">
          <span className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Icon className="h-6 w-6" />
          </span>
          <DialogTitle>{active.title}</DialogTitle>
          <DialogDescription>{active.body}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap justify-center gap-1.5 py-2">
          {active.keys.map((k, i) => (
            <kbd
              key={i}
              className="px-2 py-1 rounded bg-muted text-xs font-mono border border-border"
            >
              {k}
            </kbd>
          ))}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {story.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === step ? 'bg-gold' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            {isLast ? 'Got it' : 'Skip'}
          </Button>
          {!isLast && (
            <Button size="sm" onClick={advance} className="gap-1.5">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {isLast && (
            <Button size="sm" onClick={onDismiss} className="gap-1.5">
              <Check className="h-4 w-4" /> Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
