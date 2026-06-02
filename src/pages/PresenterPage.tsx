import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, RotateCcw } from 'lucide-react';
import { activeDeckSlug, allSlides, deck, deckTheme, findBySlideNumber, findLinearIndex, linearSlides } from '@/slides/loader';
import { SlidePreview } from '@/slides/components/SlidePreview';
import { getChannel, handleSyncMessage, isSyncMessage, type SyncMessage } from '@/slides/sync';
import { applyTheme, coerceThemeId, getInitialTheme } from '@/slides/themes';

/**
 * Presenter view — opened in a second window via the controller's "Presenter" button
 * (or by visiting `/present` directly). Shows the current slide, next-up preview,
 * speaker notes, and an elapsed timer. Stays in sync with the main deck via
 * BroadcastChannel; navigation here drives the deck too.
 */
export default function PresenterPage() {
  const [current, setCurrent] = useState<number>(linearSlides[0]?.slideNumber ?? 1);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [now, setNow] = useState<number>(() => Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Apply the saved theme on mount so the presenter window matches the
  // audience deck even if it was opened in a separate process / tab.
  useEffect(() => { applyTheme(getInitialTheme(deckTheme, activeDeckSlug)); }, []);

  // Open / listen on the broadcast channel.
  useEffect(() => {
    const ch = getChannel();
    channelRef.current = ch;
    if (!ch) return;
    function onMsg(e: MessageEvent<unknown>) {
      if (!isSyncMessage(e.data)) return;
      // Exhaustive dispatch — adding a new SyncMessage variant fails the
      // build here until we decide what the presenter should do with it.
      handleSyncMessage(e.data, {
        slide: ({ n }) => setCurrent(n),
        // Live theme switch from the deck window — re-apply so the presenter
        // chrome (chips, timer pill, gold accents) tracks the audience colors.
        theme: ({ id }) => applyTheme(coerceThemeId(id)),
        // Presenter doesn't drive itself with nav broadcasts (the deck owns
        // navigation authority); ignore to avoid feedback loops.
        nav: () => {},
        // Presenter never answers `request-state` — only the live deck does.
        'request-state': () => {},
      });
    }
    ch.addEventListener('message', onMsg);
    // Ask the deck for its current slide on mount without changing it.
    ch.postMessage({ type: 'request-state' } satisfies SyncMessage);
    return () => {
      ch.removeEventListener('message', onMsg);
      ch.close();
    };
  }, []);

  // 1Hz tick for the timer.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Resolve current + next.
  const currentSlide = useMemo(() => findBySlideNumber(current) ?? linearSlides[0], [current]);
  const linearIdx = findLinearIndex(current);
  const nextSlide = linearIdx >= 0 ? linearSlides[linearIdx + 1] : undefined;
  const total = linearSlides.length;

  const send = useCallback((msg: SyncMessage) => {
    channelRef.current?.postMessage(msg);
  }, []);

  const goTo = useCallback((n: number) => {
    const target = findBySlideNumber(n);
    if (!target || target.enabled === false) return;
    setCurrent(n);
    send({ type: 'nav', dir: 'jump', n });
  }, [send]);

  const next = useCallback(() => {
    const nextSlide = linearSlides[(linearIdx >= 0 ? linearIdx : 0) + 1];
    if (!nextSlide) return;
    goTo(nextSlide.slideNumber);
  }, [goTo, linearIdx]);

  const prev = useCallback(() => {
    const prevSlide = linearSlides[(linearIdx >= 0 ? linearIdx : 0) - 1];
    if (!prevSlide) return;
    goTo(prevSlide.slideNumber);
  }, [goTo, linearIdx]);

  // Keyboard navigation mirrors the deck.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); prev(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Timer formatting.
  const elapsedMs = Math.max(0, now - startedAt);
  const totalSec = Math.floor(elapsedMs / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');

  if (!currentSlide) return null;

  // Notes default — friendly empty state.
  const notes = currentSlide.notes?.trim();

  return (
    <main className="h-screen w-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-border/40">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-gold/80">Presenter</p>
          <h1 className="font-display text-xl text-title-cream">{deck.deckName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="controller-pill rounded-full px-4 py-2 flex items-center gap-2 text-sm font-mono">
            <Clock className="h-4 w-4 text-gold" />
            <span>{hh}:{mm}:{ss}</span>
            <button
              onClick={() => setStartedAt(Date.now())}
              aria-label="Reset timer"
              className="lift-hover-subtle ml-1 h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/5 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="controller-pill rounded-full px-4 py-2 text-sm font-mono">
            {Math.max(1, linearIdx + 1)} / {total}
          </div>
        </div>
      </header>

      {/* Body: current slide (left, large) + next-up + notes (right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 p-6 overflow-hidden">
        {/* Current */}
        <section className="flex flex-col gap-4 min-h-0">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs tracking-[0.3em] uppercase text-foreground/60">Current</h2>
            <span className="text-xs text-foreground/50 font-mono">
              {String(currentSlide.slideNumber).padStart(2, '0')} · {currentSlide.slideName}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="ring-2 ring-gold/60 rounded-xl overflow-hidden shadow-[0_0_40px_-8px_hsl(var(--gold)/0.4)]">
              <SlidePreview slide={currentSlide} width={Math.min(960, window.innerWidth * 0.55)} />
            </div>
          </div>
          {/* Nav */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={prev}
              className="controller-pill rounded-full h-11 w-11 flex items-center justify-center hover:bg-white/5 transition"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="controller-pill rounded-full px-6 h-11 flex items-center gap-2 hover:bg-white/5 transition"
              aria-label="Next"
            >
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* Side panel */}
        <aside className="flex flex-col gap-6 min-h-0">
          {/* Next up */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs tracking-[0.3em] uppercase text-foreground/60">Next up</h2>
            {nextSlide ? (
              <div className="rounded-xl overflow-hidden ring-1 ring-border opacity-90">
                <SlidePreview slide={nextSlide} width={360} />
                <div className="px-3 py-2 bg-surface-2 text-xs font-mono flex justify-between">
                  <span className="text-gold">{String(nextSlide.slideNumber).padStart(2, '0')}</span>
                  <span className="text-foreground/70 truncate ml-2">{nextSlide.slideName}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl ring-1 ring-border bg-surface-2 p-6 text-sm text-foreground/60">
                End of deck.
              </div>
            )}
          </div>

          {/* Speaker notes */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <h2 className="text-xs tracking-[0.3em] uppercase text-foreground/60">Speaker notes</h2>
            <div className="flex-1 rounded-xl ring-1 ring-border bg-surface-2 p-5 overflow-y-auto">
              {notes ? (
                <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {notes}
                </div>
              ) : (
                <p className="text-sm text-foreground/50 italic">
                  No notes for this slide. Add a top-level <code className="font-mono text-gold/80">"notes"</code> string to{' '}
                  <code className="font-mono text-foreground/70">spec/slides/{deck.deckSlug}/{String(currentSlide.slideNumber).padStart(2, '0')}-{currentSlide.slideName}.json</code>.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Hidden helper to ensure allSlides import is kept (used for type-side checks). */}
      <span className="sr-only">{allSlides.length} total slides authored</span>
    </main>
  );
}
