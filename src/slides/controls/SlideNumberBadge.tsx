/**
 * Always-visible slide-number badge.
 *
 * Sits in the bottom-right corner at low opacity so it never competes with
 * slide content but is always readable at a glance — useful when the
 * hover-revealed controller pill is hidden. Click jumps to /style-guide-style
 * input behavior is intentionally NOT included here; the full controller
 * already handles jump-to-slide. This component is read-only.
 *
 * # Why a separate component (vs. just always-showing the controller)
 * The controller pill is a busy UI surface (prev / number / next / share /
 * fullscreen / grid / hints). Pinning it on screen would dominate the slide.
 * The badge is a tiny, single-purpose anchor: it tells the audience and
 * presenter which slide is up, full stop.
 */
interface Props {
  current: number;
  total: number;
}

export function SlideNumberBadge({ current, total }: Props) {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-5 z-30 select-none"
      aria-live="polite"
      aria-label={`Slide ${current} of ${total}`}
    >
      <div className="rounded-full border border-border/60 bg-background/55 backdrop-blur-md px-3 py-1.5 text-[11px] font-mono tracking-[0.18em] text-foreground/70 shadow-elegant">
        <span className="text-gold tabular-nums">{String(current).padStart(2, '0')}</span>
        <span className="text-foreground/35 mx-1.5">/</span>
        <span className="tabular-nums">{String(total).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
