import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { resolveLucideIcon as resolveCapsuleIcon } from './lucideDynamic';
import type { CapsuleSpec } from '../types';
import { allSlides } from '../loader';
import { cn } from '@/lib/utils';

/**
 * Resolve a capsule's optional `icon` field (PascalCase lucide name) into an
 * actual icon component. Backed by a curated allow-list (`lucideDynamic.ts`)
 * so we don't ship the entire 1500-icon barrel to satisfy capsule labels.
 * Unknown / missing names return `null` so callers skip the badge cleanly.
 */

const colorClass: Record<string, string> = {
  gold: 'capsule-gold',
  ember: 'capsule-ember',
  cream: 'capsule-cream',
  ink: 'capsule-ink',
  outline: 'capsule-outline',
  violet: 'capsule-violet',
  teal: 'capsule-teal',
  rose: 'capsule-rose',
  sky: 'capsule-sky',
};

interface Props {
  spec: CapsuleSpec;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  /**
   * When true, capsules with a `clickRevealSlide` get a stronger affordance
   * (gold ring + slow pulse) so presenters can spot which capsules are
   * interactive at a glance. Toggled from the controller's "Reveal hints"
   * switch on slides that have any click-reveal capsules.
   */
  highlightReveal?: boolean;
  /**
   * When true, this capsule is currently in its expanded state (parent
   * slide is rendering an expanding-card overlay for it). The capsule
   * itself fades to transparent so the card appears to morph out of it.
   * spec 22 §3.
   */
  isExpanding?: boolean;
}

/**
 * Capsule — pill label/CTA used across every slide.
 *
 * v0.25 changes:
 *   - REMOVED the `ArrowUpRight` icon. The user found the arrow visually
 *     noisy and broken-looking. Clickable capsules now rely on hover lift
 *     + label flip + cursor change for affordance.
 *   - Capsule typography moved to Ubuntu (font-display) with antialiasing
 *     so labels render crisp at every size. See `.capsule` in index.css.
 *   - Width-reservation for the hover-flip is now a native flex layout
 *     (rendering both labels stacked, longer one visible-but-transparent)
 *     instead of absolute-positioning over an invisible duplicate. The
 *     old approach occasionally clipped descenders on small caps.
 *
 * # Click-reveal affordance
 *   - When `highlightReveal` is true, the capsule gets a soft gold ring +
 *     slow pulse so it stands out from non-interactive sibling capsules.
 *   - Native browser tooltip names the target ("Reveal: Strategy" / "Open: …").
 *
 * # Hover label-flip (spec 22 §2)
 * When the capsule has a `hoverText`, hovering plays a vertical flip —
 * resting label rotates out the top, hover label rotates in from below.
 * Reduced motion: instant text swap, no transform.
 *
 * # Visual lift
 * `lift-hover` utility (1.5px translateY + soft drop shadow). NO scale —
 * the deck-wide interaction language explicitly forbids zoom hovers.
 */
export function Capsule({
  spec,
  onClick,
  size = 'md',
  highlightReveal = false,
  isExpanding = false,
}: Props) {
  const reduced = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const sizeCls =
    size === 'lg'
      ? 'text-lg px-5 py-2.5'
      : size === 'sm'
        ? 'text-xs px-3 py-1'
        : '';
  const hasExpand = Boolean(spec.expand);
  const isReveal = Boolean(spec.clickRevealSlide);
  const interactive = Boolean(onClick || isReveal || hasExpand);
  const hasFlip = Boolean(spec.hoverText) && !reduced;

  // Resolve the target slide title once for the tooltip — falls back to the
  // raw slide number if the target is missing or unnamed.
  const target = isReveal ? allSlides.find((s) => s.slideNumber === spec.clickRevealSlide) : undefined;
  const targetLabel = target?.content.title ?? target?.slideName ?? `slide ${spec.clickRevealSlide}`;
  const tooltip = hasExpand ? `Open: ${spec.expand?.title ?? spec.text}` : isReveal ? `Reveal: ${targetLabel}` : undefined;

  const activeLabel = hasFlip && isHovered ? spec.hoverText! : spec.text;

  // Width reservation: render the longer of the two labels invisibly to
  // anchor the button width so the row doesn't reflow on hover. Uses
  // `visibility: hidden` (not `display: none`) so it still occupies space.
  const widthAnchor = hasFlip
    ? (spec.text.length >= (spec.hoverText?.length ?? 0) ? spec.text : spec.hoverText)
    : null;

  // Optional leading icon (v0.188). When present, render it either as a
  // small inline glyph (`iconBadge: false`) or a contrasting circular
  // badge plate (`iconBadge: true`) tucked into the capsule's leading
  // edge. Step capsules use the badge form for stronger hierarchy.
  const IconCmp = resolveCapsuleIcon(spec.icon);
  const showBadge = Boolean(IconCmp && spec.iconBadge);
  const showInlineIcon = Boolean(IconCmp && !spec.iconBadge);
  const iconSize = size === 'lg' ? 18 : size === 'sm' ? 13 : 15;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      title={tooltip}
      aria-label={
        hasExpand
          ? `${spec.text} — open details`
          : isReveal
            ? `${spec.text} — reveal ${targetLabel}`
            : undefined
      }
      data-expanding={isExpanding ? 'true' : undefined}
      data-has-badge={showBadge ? 'true' : undefined}
      data-debug-token={`capsule (${spec.color ?? 'outline'})`}
      data-debug-class={`.capsule.${colorClass[spec.color] ?? 'capsule-outline'}`}
      className={cn(
        'capsule relative',
        // When a leading badge is rendered we drop `overflow-hidden` so the
        // badge's contrast plate isn't clipped by the capsule rounding, and
        // pad the leading edge tighter so the badge anchors flush.
        !showBadge && 'overflow-hidden',
        showBadge && 'pl-1.5',
        colorClass[spec.color] ?? 'capsule-outline',
        sizeCls,
        interactive && 'lift-hover cursor-pointer',
        isReveal && highlightReveal && 'ring-2 ring-gold/70 ring-offset-2 ring-offset-background animate-pulse',
        isExpanding && 'opacity-0 pointer-events-none',
      )}
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
    >
      {/* Badge form — circular contrast plate. Uses currentColor on the
          glyph so it inherits the capsule's foreground (already AA-tuned
          per variant), with a darker plate on light capsules and a light
          plate on dark capsules driven entirely by CSS variables. */}
      {showBadge && IconCmp && (
        <span className="capsule-icon-badge" aria-hidden="true">
          <IconCmp size={iconSize} strokeWidth={2.25} />
        </span>
      )}
      {/* Inline form — lighter affordance, sits as a leading glyph at full
          opacity matching the label. */}
      {showInlineIcon && IconCmp && (
        <span className="capsule-icon-inline inline-flex shrink-0" aria-hidden="true">
          <IconCmp size={iconSize} strokeWidth={2.25} />
        </span>
      )}
      <span className="relative inline-grid items-center justify-items-center leading-none">
        {/* Width anchor — invisible but takes space. Picks the longer of
            text / hoverText so the capsule never reflows on hover. */}
        {widthAnchor && (
          <span
            aria-hidden="true"
            className="col-start-1 row-start-1 whitespace-nowrap"
            style={{ visibility: 'hidden' }}
          >
            {widthAnchor}
          </span>
        )}
        {/* Visible label — flips between text/hoverText when hasFlip. */}
        <span className={cn('col-start-1 row-start-1 inline-block', hasFlip && 'overflow-hidden')}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={activeLabel}
              initial={hasFlip ? { y: '110%', opacity: 0 } : false}
              animate={{ y: '0%', opacity: 1 }}
              exit={hasFlip ? { y: '-110%', opacity: 0 } : { opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block whitespace-nowrap"
            >
              {activeLabel}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </button>
  );
}
