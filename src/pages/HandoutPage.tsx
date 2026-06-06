import { useEffect, useMemo, useState } from 'react';
import { linearSlides, allSlides, deck } from '@/slides/loader';
import { SlideStage } from '@/slides/SlideStage';
import { getPresetSettings, subscribePresetSettings } from '@/slides/presetSettings';

/**
 * `/handout` — printable PDF export view for the deck.
 *
 * # What this page does
 * Mounts every linear (non-click-reveal) slide stacked vertically, one per
 * A4-landscape page, with all entrance animations forced to their final
 * states so the export reads like a clean handout instead of a frozen
 * mid-animation snapshot.
 *
 * # The animation-disable strategy
 * We do NOT touch the slide components themselves — they keep their authored
 * Framer variants and CSS animations. Instead we set TWO global signals at
 * mount time and undo them on unmount:
 *
 *   1. `<html data-export-mode="true">` — already honored by the existing
 *      print hardening in `src/index.css` (drops alignment guides, swaps
 *      brand-strip backdrop for a print-safe surface). We extend that block
 *      with `* { animation: none !important; transition: none !important; }`
 *      so every CSS-driven motion (ambient float, lattice glow, hover lift,
 *      cinematic capsule blur) collapses to its final keyframe instantly.
 *
 *   2. A media-query override that forces `prefers-reduced-motion` semantics
 *      for Framer Motion via the existing `motionPreferences.ts` flatteners.
 *      Framer reads the OS preference at variant-resolve time, so we use a
 *      `<style>` injected `@media print` rule that the browser applies the
 *      moment it enters print preview, AND we set `data-export-mode` so the
 *      same flatteners run in screen mode for the live `/handout` URL.
 *
 * The result: every slide renders in its final, fully-revealed state. No
 * blank pages from staggered reveals that haven't fired yet.
 *
 * # Why a separate route (vs. printing the live deck)
 * The live deck only renders ONE slide at a time (the `<AnimatePresence>`
 * mode="wait" pattern unmounts everything else). `window.print()` from `/3`
 * would only ever capture slide 3. The handout route mounts the entire deck
 * at once so the print engine paginates the full sequence.
 *
 * # One-click trigger
 * Auto-triggers `window.print()` on first paint when `?print=1` is in the
 * URL (so the ShareMenu's "Export PDF" button can open
 * `/handout?print=1` and the user gets a single click → save dialog).
 * Without the param, the route is just a scrollable handout preview.
 */
export default function HandoutPage() {
  // v0.123 — `?cmyk=1` opts in to a CMYK-safe colour filter so the export
  // doesn't shift hard when an offset press converts the file. This is a
  // visual approximation only — true ICC CMYK requires Acrobat Pro's
  // "Convert Colors" or a server-side Ghostscript pass. We surface a banner
  // so the user is never surprised by colour drift downstream.
  const params = new URLSearchParams(window.location.search);
  const wantPrint   = params.get('print')   === '1';
  const wantCmyk    = params.get('cmyk')    === '1';
  // v0.153 — `?reveals=1` opts the click-reveal sub-slides INTO the handout
  // so every hidden capsule expansion is captured in the PDF. Default stays
  // OFF so the standard export remains a clean linear walkthrough; opt-in
  // is surfaced as a second ShareMenu entry ("Export PDF + reveals"). The
  // reveals are interleaved right after their parent slide (sorted by the
  // existing `slideNumber` ordering, which is contiguous for parent +
  // children by authoring convention) so handout flow mirrors the live
  // click-through.
  const wantReveals = params.get('reveals') === '1';
  // v1.15.0 — `?slide=N` scopes the handout to a SINGLE slide (by slideNumber)
  // so "Export current slide to PDF" produces a one-page document instead of
  // the whole deck. Invalid/missing → render the full deck (back-compat).
  const rawSlide = params.get('slide');
  const onlySlide = rawSlide !== null && Number.isFinite(Number(rawSlide)) ? Number(rawSlide) : null;

  // v0.156 — handout footer customisation. Subscribe to preset settings so
  // tweaks in /settings live-update this preview without a refresh. The
  // three knobs (slide-number visibility, presenter byline, confidentiality
  // chip) are independent — show none, any, or all simultaneously.
  const [footerSettings, setFooterSettings] = useState(() => {
    const s = getPresetSettings();
    return {
      showSlideNumbers: s.handoutShowSlideNumbers,
      presenterName: s.handoutPresenterName,
      confidentialityLabel: s.handoutConfidentialityLabel,
      showCover: s.handoutShowCover,
      coverSubtitle: s.handoutCoverSubtitle,
    };
  });
  useEffect(() => {
    return subscribePresetSettings(() => {
      const s = getPresetSettings();
      setFooterSettings({
        showSlideNumbers: s.handoutShowSlideNumbers,
        presenterName: s.handoutPresenterName,
        confidentialityLabel: s.handoutConfidentialityLabel,
        showCover: s.handoutShowCover,
        coverSubtitle: s.handoutCoverSubtitle,
      });
    });
  }, []);

  // v0.157 — cover page metadata. Date follows the user's locale; we use
  // the long form (e.g. "27 April 2026") because handouts are read on paper
  // where context is sparse and unambiguous dates matter. Computed once at
  // mount so re-renders from preset-settings updates don't re-stamp it.
  const coverDate = useMemo(
    () => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
    [],
  );

  const slidesForHandout = useMemo(() => {
    if (!wantReveals) return linearSlides;
    // `allSlides` already preserves authoring order (parent immediately
    // followed by its reveal children). Filter only by `isActive` semantics
    // — but `linearSlides` is the only filtered list exposed; `allSlides`
    // is the unfiltered superset. We keep everything that's not hidden by
    // the active filter that produced linearSlides: every slide that is
    // either in linearSlides OR is a click-reveal child of one of them.
    const linearNumbers = new Set(linearSlides.map(s => s.slideNumber));
    return allSlides.filter(s => linearNumbers.has(s.slideNumber) || s.isClickReveal);
  }, [wantReveals]);

  useEffect(() => {
    document.documentElement.setAttribute('data-export-mode', 'true');
    if (wantCmyk) document.documentElement.setAttribute('data-export-cmyk', 'true');
    const suffix = [
      wantCmyk    ? 'CMYK-safe' : null,
      wantReveals ? 'with reveals' : null,
    ].filter(Boolean).join(', ');
    document.title = `${deck.deckName ?? 'Deck'} — Handout${suffix ? ` (${suffix})` : ''}`;
    let raf = 0;
    if (wantPrint) {
      raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => window.print());
      });
    }
    return () => {
      document.documentElement.removeAttribute('data-export-mode');
      document.documentElement.removeAttribute('data-export-cmyk');
      if (raf) cancelAnimationFrame(raf);
    };
  }, [wantPrint, wantCmyk, wantReveals]);

  return (
    <main className="handout-root bg-ink text-foreground min-h-screen">
      {wantCmyk && (
        <div
          data-print-hide="true"
          className="sticky top-0 z-30 bg-ember/15 border-b border-ember/40 text-cream text-xs px-6 py-2 text-center"
        >
          <strong className="text-ember">CMYK-safe preview</strong> — colours are desaturated to approximate the print gamut.
          For true ICC CMYK, run the saved PDF through Acrobat Pro → <em>Convert Colors</em>.
        </div>
      )}
      {wantReveals && (
        <div
          data-print-hide="true"
          className="sticky top-0 z-30 bg-gold/10 border-b border-gold/40 text-cream text-xs px-6 py-2 text-center"
        >
          <strong className="text-gold">Reveals included</strong> — click-reveal sub-slides are interleaved after their parent for full step-by-step capture.
        </div>
      )}
      {/* v0.157 — Optional cover page rendered BEFORE the first slide.
          Uses the same `.handout-page` wrapper so it gets its own A4
          landscape sheet in print and the same letterboxed 16:9 frame on
          screen. Slide numbering on the per-slide footer is unaffected
          (the cover doesn't count — slide 01 is still the first real
          slide). */}
      {footerSettings.showCover && (
        <section
          className="handout-page handout-cover"
          aria-label={`Cover page: ${deck.deckName ?? 'Deck'}`}
        >
          <div className="handout-stage handout-cover-stage">
            <div className="handout-cover-eyebrow">Presentation handout</div>
            <h1 className="handout-cover-title">{deck.deckName ?? 'Deck'}</h1>
            {footerSettings.coverSubtitle && (
              <div className="handout-cover-subtitle">{footerSettings.coverSubtitle}</div>
            )}
            <div className="handout-cover-rule" aria-hidden="true" />
            <div className="handout-cover-meta">
              {footerSettings.presenterName && (
                <div className="handout-cover-meta-row">
                  <span className="handout-cover-meta-label">Presented by</span>
                  <span className="handout-cover-meta-value">{footerSettings.presenterName}</span>
                </div>
              )}
              <div className="handout-cover-meta-row">
                <span className="handout-cover-meta-label">Date</span>
                <span className="handout-cover-meta-value">{coverDate}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Each slide is wrapped in a `.handout-page` so `@media print` can
          give every wrapper its own page with `break-after: page`. The
          aspect-ratio frame keeps the 16:9 stage proportional on screen
          and at print time both. */}
      {slidesForHandout.map((slide, i) => (
        <section
          key={`${slide.slideNumber}-${i}`}
          className="handout-page"
          data-reveal={slide.isClickReveal ? 'true' : undefined}
          aria-label={`Slide ${i + 1} of ${slidesForHandout.length}${slide.isClickReveal ? ' (reveal)' : ''}: ${slide.content.title ?? slide.slideName}`}
        >
          <div className="handout-stage">
            {/* Direction is irrelevant once animations are disabled, but
                `forward` matches the canonical first-render variant set so
                no keyframe surprises slip in for non-flattened browsers. */}
            <SlideStage
              slide={slide}
              direction="forward"
              onCapsuleClickReveal={() => { /* no-op in handout */ }}
              onBackToParent={() => { /* no-op in handout */ }}
              highlightReveal={false}
            />
            {/* deck.transitionTimingByType intentionally omitted — handout
                disables animations entirely (prefers-reduced-motion path). */}
          </div>
          {/* v0.156 — three-zone footer. Each zone renders only when its
              corresponding setting is non-empty / enabled, so a deck with
              all three off shows no footer at all. The strip lives in the
              letterbox bar (per v0.155 fit-to-page) and is forced visible
              in print via the existing `.handout-page-footer` rule. */}
          <div className="handout-page-footer-bar">
            <span className="handout-footer-zone handout-footer-left font-mono text-[10px] tracking-[0.2em] text-foreground/55">
              {footerSettings.presenterName}
            </span>
            <span className="handout-footer-zone handout-footer-center font-mono text-[10px] tracking-[0.25em] uppercase text-gold/70">
              {footerSettings.confidentialityLabel}
            </span>
            <span className="handout-footer-zone handout-footer-right font-mono text-[10px] tracking-[0.3em] text-foreground/40">
              {footerSettings.showSlideNumbers && (
                <>
                  {String(i + 1).padStart(2, '0')} / {String(slidesForHandout.length).padStart(2, '0')}
                </>
              )}
              {slide.isClickReveal && (
                <span className="ml-3 text-gold/70">↳ reveal</span>
              )}
            </span>
          </div>
        </section>
      ))}
    </main>
  );
}
