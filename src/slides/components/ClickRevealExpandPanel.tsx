import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { CapsuleExpandSpec } from '../types';
import { Capsule } from './Capsule';
import { recordEvent } from '../analytics/recorder';
import { findBySlideNumber } from '../loader';

export interface ExpandPanelPayload {
  /** The expand block to render. */
  expand: CapsuleExpandSpec;
  /**
   * `layoutId` to thread through Framer's shared-layout system so the card
   * morphs OUT OF the source element. Pass the same id you used on the
   * trigger's `motion.div` for the morph effect; omit for a plain fade-in.
   */
  layoutId?: string;
  /** Fallback title when `expand.title` is empty. */
  fallbackTitle?: string;
}

interface Props {
  /** When non-null, the panel is open and displays this payload. */
  payload: ExpandPanelPayload | null;
  /** Called when the user closes the panel (backdrop click, X, Esc). */
  onClose: () => void;
  /**
   * Optional handler for the inline CTA's `onClickRevealSlide` field. If
   * omitted, CTAs that only carry a slide target become no-ops.
   */
  onCtaReveal?: (slideNumber: number) => void;
}

/**
 * Generic inline-expand card used by ANY click-reveal trigger (capsule,
 * step row, hotspot, …) that authors `expand` on its trigger. Spec 26.
 *
 * The card morphs out of the source element via `layoutId` when set,
 * otherwise it fades in centered. Esc and backdrop click close it.
 *
 * Lives at z-40 so it sits above the slide body but below the controller
 * (z-50) and the click-reveal back-badge (z-30, which never overlaps).
 */
export function ClickRevealExpandPanel({ payload, onClose, onCtaReveal }: Props) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // WCAG 2.4.3 + 2.1.2 — focus management for the modal.
  //  • Capture the trigger element so we can return focus on close.
  //  • Move focus into the dialog on open (Close button — first tabbable).
  //  • Trap Tab cycle within the dialog while it's open.
  //  • Esc still closes (kept from previous version).
  useEffect(() => {
    if (!payload) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
    // Defer focus until after Framer's enter animation begins so the
    // closeBtnRef is mounted.
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      // Return focus to the original trigger — vital for SR/keyboard users
      // who'd otherwise land on <body> after the dialog unmounts.
      previouslyFocused.current?.focus?.();
    };
  }, [payload, onClose]);

  // Analytics — fire once when the panel opens. Active slide isn't directly
  // available here (the panel is mounted at the deck level for re-use across
  // every slide that has reveals), so we read it off the URL — `/<n>` is the
  // single source of truth for current slide. Best-effort; recorder no-ops
  // when analytics is disabled.
  useEffect(() => {
    if (!payload) return;
    const m = window.location.pathname.match(/\/(\d+)/);
    const slide = m ? parseInt(m[1], 10) : 0;
    const slideType = findBySlideNumber(slide)?.slideType;
    recordEvent('click-reveal', slide, {
      revealSlug: payload.expand.title || payload.fallbackTitle || 'unknown',
      ...(slideType ? { slideType } : {}),
    });
  }, [payload]);

  return (
    <AnimatePresence>
      {payload && (
        <motion.div
          key="expand-backdrop"
          className="absolute inset-0 z-40 flex items-center justify-center px-8"
          initial={{ backdropFilter: 'blur(0px)', backgroundColor: 'hsl(0 0% 5% / 0)' }}
          animate={{ backdropFilter: 'blur(6px)', backgroundColor: 'hsl(0 0% 5% / 0.55)' }}
          exit={{ backdropFilter: 'blur(0px)', backgroundColor: 'hsl(0 0% 5% / 0)' }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={payload.expand.title ?? payload.fallbackTitle ?? 'Details'}
        >
          <motion.div
            ref={dialogRef}
            layoutId={payload.layoutId}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl bg-card/95 border border-gold/30 shadow-[0_30px_80px_-20px_hsl(0_0%_0%_/_0.7),0_0_0_1px_hsl(var(--gold)/0.15)] p-10 md:p-12"
            transition={
              reduced
                ? { duration: 0.01 }
                : { type: 'spring', stiffness: 320, damping: 32, mass: 0.7 }
            }
          >
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="absolute top-4 right-4 h-9 w-9 rounded-full inline-flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/10 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {payload.expand.eyebrow && (
                <div className="text-[12px] font-semibold uppercase tracking-[0.32em] text-gold mb-3">
                  {payload.expand.eyebrow}
                </div>
              )}
              <h3 className="font-display text-3xl md:text-4xl text-title-cream leading-[1.05] mb-2">
                {payload.expand.title ?? payload.fallbackTitle ?? 'Details'}
              </h3>
              <div className="h-[2px] w-14 bg-gold my-5" />
              {payload.expand.body && (
                <p className="text-foreground/85 text-lg md:text-xl leading-relaxed max-w-prose">
                  {payload.expand.body}
                </p>
              )}
              {payload.expand.capsules && payload.expand.capsules.length > 0 && (
                <div className="mt-7 flex flex-wrap gap-2">
                  {payload.expand.capsules.map((sub, i) => (
                    <Capsule key={i} spec={sub} size="sm" />
                  ))}
                </div>
              )}
              {payload.expand.cta && (
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      const cta = payload.expand.cta;
                      if (!cta) return;
                      if (typeof cta.onClickRevealSlide === 'number') {
                        onCtaReveal?.(cta.onClickRevealSlide);
                        onClose();
                      } else if (cta.href) {
                        window.open(cta.href, '_blank', 'noopener');
                      }
                    }}
                    className="capsule capsule-gold text-base px-5 py-2.5 lift-hover cursor-pointer"
                  >
                    {payload.expand.cta.text}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
