/**
 * PresenterTopBar — top-of-stage presenter HUD.
 *
 * A slim, non-interactive presenter strip pinned to the very top of the deck
 * stage that gives the presenter two pieces of information at a glance:
 *
 *   1. Current slide number / total ("Slide 04 of 12")
 *   2. The keyboard shortcuts that drive Next / Previous navigation,
 *      rendered as keycap-styled chips so they read as "press this key"
 *      rather than as decoration.
 *
 * The shortcut chips are display-only: keyboard handling lives in
 * `SlideDeckPage` (single source of truth). This bar must read as HUD text,
 * not as another deck controller.
 *
 * Visual contract (Noir & Gold):
 *   - Background: noir w/ blur, hairline gold border at low alpha.
 *   - Number block: gold, monospaced, tabular-nums, no jitter.
 *   - Keycap chips: dark pill, gold key glyph, cream legend ("Prev" / "Next").
 *
 * Hidden when grid view is open or the presenter has chosen to hide the
 * top jumper — same gating used by `TopSlideJumper` so the two never fight.
 */
interface Props {
  current: number;
  total: number;
}

/**
 * Single keycap chip — the labeled `<kbd>` glyph plus a short legend.
 * Clickable so the chip doubles as a touch target, but the source of truth
 * for navigation is the deck-level keydown handler.
 */
function ShortcutHint({
  label,
  glyphs,
}: {
  label: string;
  glyphs: string[];
}) {
  return (
    <span
      aria-label={`${label} slide shortcut: ${glyphs.join(' or ')}`}
      className="inline-flex items-center gap-1.5 text-[9px] font-medium uppercase leading-none tracking-[0.14em] text-foreground/45"
    >
      <span>{label}</span>
      <span className="flex items-center gap-1">
        {glyphs.map((g, i) => (
          <kbd
            key={`${g}-${i}`}
            className="inline-flex min-w-[16px] justify-center rounded border border-gold/25 bg-background/45 px-1 py-0.5 font-mono text-[9px] leading-none text-gold/80"
          >
            {g}
          </kbd>
        ))}
      </span>
    </span>
  );
}

export function PresenterTopBar({ current, total }: Props) {
  return (
    <div
      role="region"
      aria-label="Presenter navigation bar"
      className="pointer-events-none fixed top-2 left-1/2 z-30 flex -translate-x-1/2 items-center"
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="inline-flex h-7 items-center gap-3 rounded-full border border-gold/20 bg-background/35 px-3.5 font-mono uppercase tracking-[0.18em] text-foreground/65 backdrop-blur-md shadow-elegant"
      >
        <ShortcutHint label="Prev" glyphs={['←', '⌫']} />

        <span className="h-3 w-px bg-gold/20" aria-hidden="true" />

        <span className="inline-flex items-baseline gap-1.5 text-[11px] leading-none">
          <span className="text-foreground/40">Slide</span>
          <span className="tabular-nums text-gold">{String(current).padStart(2, '0')}</span>
          <span className="text-foreground/30">/</span>
          <span className="tabular-nums text-foreground/75">{String(total).padStart(2, '0')}</span>
        </span>

        <span className="h-3 w-px bg-gold/20" aria-hidden="true" />

        <ShortcutHint label="Next" glyphs={['→', 'Space']} />
      </div>
    </div>
  );
}
