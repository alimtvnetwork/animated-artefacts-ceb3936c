/**
 * Image Placement Rules (v0.187)
 *
 * Centralizes "where does an image go and how big should it be" so authors
 * can drop an image reference into a slide JSON without hand-tuning width,
 * height, or aspect ratio for every slot.
 *
 * # The slot model
 * A *slot* is a named position on the stage with consistent rendering
 * constraints: aspect ratio, max dimensions, object-fit policy, alignment,
 * and a CSS class used to style chrome (rounded corners, shadow, etc.).
 *
 * Each slot belongs to a *zone* — header / body / overlay / chip — that
 * dictates layout side-effects (z-index, padding reservations, etc.).
 *
 * # Auto-placement
 * `inferImageSlot(ref, hint)` looks at:
 *   1. `hint.role` (explicit author intent — always wins)
 *   2. The asset slug or filename (`brand/logo.png` → `headerLogo`,
 *      `presenter*` → `presenterAvatar`, `qr*` → `qrOverlay`, etc.)
 *   3. The hosting slide type (TitleSlide → `titleHero`, ImageSlide →
 *      `bodyFigure`, QrMeetingSlide image → `qrOverlay`)
 *
 * The output is a fully-resolved `ResolvedImagePlacement` carrying the
 * inferred slot AND its rendering constraints so callers don't have to
 * look anything up themselves.
 *
 * # Why a resolver (not just CSS classes)
 *   - JSON specs stay declarative — `{ "image": "..." }` is enough; the
 *     correct sizing falls out from the rules.
 *   - One source of truth for image ergonomics: change a slot once here
 *     and every slide updates.
 *   - The resolver is pure → trivial to unit-test against fixtures and
 *     to reuse from the builder, the runtime, and CI sanity scripts.
 */
import type { SlideSpec } from './types';
import { SlideType, type SlideTypeValue } from './enums';

/** High-level region of the stage a slot lives in. */
export type ImageZone = 'header' | 'body' | 'overlay' | 'chip';

/** Canonical placement slots — extend here, never inline ad-hoc rules. */
export type ImageSlotId =
  | 'headerLogo'        // Top-left brand wordmark in BrandHeader.
  | 'presenterAvatar'   // Right-side circular avatar in BrandHeader.
  | 'titleHero'         // Large hero image behind/beside a TitleSlide title.
  | 'bodyFigure'        // Centered body image (ImageSlide default).
  | 'inlineThumbnail'   // Small inline thumbnail next to capsules / steps.
  | 'qrOverlay'         // QR PNG on QrMeetingSlide.
  | 'iconBadge';        // Tiny pictogram chip (ambient icons, brand icons).

/** Visual policy for a slot. Consumed by `<SlotImage />` and any custom render. */
export interface ImageSlotSpec {
  id: ImageSlotId;
  zone: ImageZone;
  /** Aspect ratio as W:H. `null` means "free-form, respect intrinsic". */
  aspect: number | null;
  /** Maximum rendered dimensions in stage px (1920x1080 coordinate space). */
  maxWidth: number;
  maxHeight: number;
  /** CSS object-fit used by the renderer. */
  fit: 'contain' | 'cover';
  /** Rendering chrome — rounded corners / shadow / ring. */
  chrome: 'none' | 'soft' | 'card' | 'circle' | 'qr-tile';
  /** A11y description of the slot for fallback alt-text. */
  description: string;
}

/** Author hint accepted by the resolver. All fields optional. */
export interface PlacementHint {
  /** Explicit role override — `inferImageSlot` always honors this. */
  role?: ImageSlotId;
  /** Slide type the image is being placed on. */
  slideType?: SlideTypeValue;
  /** Asset slug (e.g. `riseup-asia`, `presenter`). */
  assetSlug?: string;
  /** Original filename or url. */
  filename?: string;
  /** Caller-supplied alt text — surfaces unchanged in the result. */
  alt?: string;
}

/** Final, ready-to-render placement output. */
export interface ResolvedImagePlacement {
  slot: ImageSlotSpec;
  /** Inferred or explicit alt text. Always non-empty. */
  alt: string;
  /** Why this slot won — useful for the builder / debug overlays. */
  reason: 'explicit-role' | 'slug-match' | 'filename-match' | 'slide-type-default' | 'fallback';
}

/* ------------------------------------------------------------------ */
/* Slot catalog. Tuned to the deck's 1920x1080 stage and brand chrome. */
/* ------------------------------------------------------------------ */

/**
 * The header logo height tracks `--brand-logo-scale` at runtime; we declare
 * the *base* dimensions here so the inferred constraints match what
 * BrandHeader actually renders at scale 1.0. Authors tweaking the scale
 * still get correct relative sizing.
 */
export const IMAGE_SLOTS: Record<ImageSlotId, ImageSlotSpec> = {
  headerLogo: {
    id: 'headerLogo', zone: 'header',
    aspect: null, maxWidth: 320, maxHeight: 64,
    fit: 'contain', chrome: 'none',
    description: 'Brand wordmark in the slide header',
  },
  presenterAvatar: {
    id: 'presenterAvatar', zone: 'chip',
    aspect: 1, maxWidth: 28, maxHeight: 28,
    fit: 'cover', chrome: 'circle',
    description: 'Circular presenter avatar in the header chip',
  },
  titleHero: {
    id: 'titleHero', zone: 'body',
    aspect: 16 / 9, maxWidth: 1280, maxHeight: 720,
    fit: 'cover', chrome: 'card',
    description: 'Hero image behind or beside the title',
  },
  bodyFigure: {
    id: 'bodyFigure', zone: 'body',
    aspect: null, maxWidth: 1600, maxHeight: 864,
    fit: 'contain', chrome: 'card',
    description: 'Centered figure on a body slide',
  },
  inlineThumbnail: {
    id: 'inlineThumbnail', zone: 'body',
    aspect: 1, maxWidth: 96, maxHeight: 96,
    fit: 'cover', chrome: 'soft',
    description: 'Small inline thumbnail beside text content',
  },
  qrOverlay: {
    id: 'qrOverlay', zone: 'body',
    aspect: 1, maxWidth: 480, maxHeight: 480,
    fit: 'contain', chrome: 'qr-tile',
    description: 'QR code rendered on a meeting slide',
  },
  iconBadge: {
    id: 'iconBadge', zone: 'chip',
    aspect: 1, maxWidth: 48, maxHeight: 48,
    fit: 'contain', chrome: 'soft',
    description: 'Small pictogram or brand icon badge',
  },
};

/** Public list — handy for the inspector / builder UIs. */
export const IMAGE_SLOT_IDS = Object.keys(IMAGE_SLOTS) as ImageSlotId[];

/* ------------------------------------------------------------------ */
/* Inference                                                            */
/* ------------------------------------------------------------------ */

/** Pattern table for slug-/filename-driven inference. Order matters — first hit wins. */
const PATTERN_RULES: ReadonlyArray<{ slot: ImageSlotId; test: RegExp }> = [
  { slot: 'presenterAvatar', test: /(^|[/_-])presenter(\b|[._-])|(^|[/_-])avatar(\b|[._-])|alim/i },
  { slot: 'headerLogo',      test: /(^|[/_-])logo(\b|[._-])|wordmark|brand[/_-]logo/i },
  { slot: 'qrOverlay',       test: /(^|[/_-])qr(\b|[._-])|meeting-qr/i },
  { slot: 'iconBadge',       test: /(^|[/_-])(icon|badge|mark)(\b|[._-])/i },
  { slot: 'inlineThumbnail', test: /(^|[/_-])thumb(nail)?(\b|[._-])/i },
  { slot: 'titleHero',       test: /(^|[/_-])hero(\b|[._-])/i },
];

/** Slide-type → default body slot. */
const SLIDE_TYPE_DEFAULTS: Partial<Record<SlideTypeValue, ImageSlotId>> = {
  [SlideType.TitleSlide]: 'titleHero',
  [SlideType.MiddleTitleSlide]: 'titleHero',
  [SlideType.ImageSlide]: 'bodyFigure',
  [SlideType.QrMeetingSlide]: 'qrOverlay',
};

/** Friendly default alt-text per slot — used when authors omit `alt`. */
function defaultAlt(slot: ImageSlotId): string {
  return IMAGE_SLOTS[slot].description;
}

/**
 * Infer the placement slot for an image reference.
 *
 * Priority:
 *   1. Explicit `hint.role` — author always wins.
 *   2. Slug pattern match (`presenter`, `logo`, `qr`, ...).
 *   3. Filename pattern match (same patterns, applied to the trailing path).
 *   4. Slide-type default.
 *   5. Fallback: `bodyFigure` (sane catch-all).
 */
export function inferImageSlot(hint: PlacementHint = {}): ResolvedImagePlacement {
  const alt = hint.alt?.trim() || defaultAlt(hint.role ?? 'bodyFigure');

  if (hint.role && IMAGE_SLOTS[hint.role]) {
    return { slot: IMAGE_SLOTS[hint.role], alt, reason: 'explicit-role' };
  }

  if (hint.assetSlug) {
    const match = PATTERN_RULES.find((r) => r.test.test(hint.assetSlug!));
    if (match) return { slot: IMAGE_SLOTS[match.slot], alt: hint.alt || defaultAlt(match.slot), reason: 'slug-match' };
  }

  if (hint.filename) {
    // Strip query strings and isolate the leaf so URL-style refs still match.
    const leaf = hint.filename.split('?')[0].split('#')[0].split('/').pop() ?? hint.filename;
    const match = PATTERN_RULES.find((r) => r.test.test(leaf) || r.test.test(hint.filename!));
    if (match) return { slot: IMAGE_SLOTS[match.slot], alt: hint.alt || defaultAlt(match.slot), reason: 'filename-match' };
  }

  if (hint.slideType && SLIDE_TYPE_DEFAULTS[hint.slideType]) {
    const slotId = SLIDE_TYPE_DEFAULTS[hint.slideType]!;
    return { slot: IMAGE_SLOTS[slotId], alt: hint.alt || defaultAlt(slotId), reason: 'slide-type-default' };
  }

  return { slot: IMAGE_SLOTS.bodyFigure, alt, reason: 'fallback' };
}

/* ------------------------------------------------------------------ */
/* Style helpers — turn a resolved placement into inline CSS / classes  */
/* ------------------------------------------------------------------ */

/**
 * Inline style block honoring the slot's max dimensions, aspect ratio, and
 * object-fit. Designed to live inside a 1920x1080 stage container — values
 * scale with `transform: scale()` like every other stage element.
 */
export function getSlotStyle(slot: ImageSlotSpec): React.CSSProperties {
  const style: React.CSSProperties = {
    maxWidth: slot.maxWidth,
    maxHeight: slot.maxHeight,
    objectFit: slot.fit,
    width: '100%',
    height: 'auto',
  };
  if (slot.aspect !== null) {
    style.aspectRatio = `${slot.aspect}`;
    // When aspect is locked, switch to filling the box so the ratio holds.
    style.width = '100%';
    style.height = '100%';
  }
  return style;
}

/** Tailwind utility classes for each chrome variant. */
export function getSlotChromeClasses(slot: ImageSlotSpec): string {
  switch (slot.chrome) {
    case 'circle':
      return 'rounded-full object-cover ring-1 ring-gold/40';
    case 'card':
      return 'rounded-2xl shadow-[var(--shadow-elegant)]';
    case 'soft':
      return 'rounded-md';
    case 'qr-tile':
      return 'rounded-lg bg-white p-3';
    case 'none':
    default:
      return '';
  }
}

/* ------------------------------------------------------------------ */
/* Slide-level convenience                                              */
/* ------------------------------------------------------------------ */

/**
 * Convenience: infer placement for the primary `content.image` of a slide.
 * Returns `null` when the slide has no image reference.
 */
export function inferPlacementForSlide(spec: SlideSpec): ResolvedImagePlacement | null {
  const c = spec.content;
  if (!c.image) return null;
  return inferImageSlot({
    role: c.imageRole as ImageSlotId | undefined,
    slideType: spec.slideType,
    filename: c.image,
    alt: c.title || spec.slideName,
  });
}
