/**
 * SlotImage — single React entry point for image-with-rules rendering.
 *
 * Pass an image src + an author hint, and the component:
 *   1. Resolves the placement slot via `inferImageSlot` (filename / slug /
 *      slide-type / explicit role).
 *   2. Applies the slot's max dimensions, aspect ratio, object-fit, and
 *      chrome utility classes consistently.
 *   3. Falls back to a sensible alt text from the slot description when
 *      the author didn't provide one.
 *
 * Use this anywhere a slide needs to render an image without re-deriving
 * the sizing rules. For animated entries, wrap the returned element in
 * `motion.*` from the call site — keeping motion concerns out of the
 * placement layer keeps both responsibilities testable in isolation.
 */
import { type ImgHTMLAttributes, type ReactElement } from 'react';
import {
  inferImageSlot,
  getSlotStyle,
  getSlotChromeClasses,
  type PlacementHint,
  type ResolvedImagePlacement,
} from '../imagePlacement';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> {
  /** Image URL. Required. */
  src: string;
  /** Optional override — wins over inferred alt. */
  alt?: string;
  /** Placement hint forwarded to the resolver. */
  hint?: PlacementHint;
  /** Extra classes appended after the chrome utilities. */
  className?: string;
  /** Receives the resolved placement (handy for debug overlays). */
  onResolved?: (placement: ResolvedImagePlacement) => void;
}

export function SlotImage({ src, alt, hint, className, onResolved, style, ...rest }: Props): ReactElement {
  // Always pull the filename out of the src so authors get sensible
  // inference even when they don't provide an `assetSlug` or `role`.
  const placement = inferImageSlot({
    filename: src,
    ...hint,
    alt: alt ?? hint?.alt,
  });
  onResolved?.(placement);

  const classes = [getSlotChromeClasses(placement.slot), className].filter(Boolean).join(' ');
  const merged: React.CSSProperties = { ...getSlotStyle(placement.slot), ...style };

  return (
    <img
      src={src}
      alt={placement.alt}
      data-image-slot={placement.slot.id}
      data-image-slot-reason={placement.reason}
      className={classes}
      style={merged}
      draggable={false}
      {...rest}
    />
  );
}
