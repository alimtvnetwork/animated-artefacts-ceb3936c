---
name: interactive-capsules
description: CapsuleSpec gets `hoverText` (vertical label flip on hover) + `expand` (inline expanding-card reveal on click). Card morphs from capsule via shared layoutId; siblings dim. Esc + backdrop close. Spec 22.
type: feature
---

When the user says "**interactive capsules**", "label flip on capsules", or
"expanding card on capability click" they mean spec 22.

## Schema (JSON-driven)

`CapsuleSpec` (in `src/slides/types.ts`) has two new optional fields:

- `hoverText?: string` — resting label flips out, hover label flips in.
- `expand?: CapsuleExpandSpec` — inline expanding card payload.
  - `eyebrow?`, `title?` (falls back to `text`), `body?`, `capsules?`,
    `cta?: { text, href?, onClickRevealSlide? }`.

`expand` wins over the legacy `clickRevealSlide` when both are present.

## Behavior

- **Hover flip** (label-flip): resting `translateY 0 → -120%` + opacity
  fade-out, hover `translateY 120% → 0` + fade-in. 320ms ease
  `[0.22,1,0.36,1]`. Width reserved by invisible duplicate of longer of
  `text`/`hoverText`. Reduced motion: suppressed.
- **Arrow icon**: `ArrowUpRight` (lucide) replaces the old `↗` glyph on
  every clickable capsule. Hover nudges `x:+2, y:-2`.
- **Expanding card** (`CapsuleListSlide.tsx`): clicking a capsule with
  `expand` sets `expandedIdx`. Source capsule fades to 0 opacity. Siblings
  go to `opacity: 0.25, blur(1px)`. Backdrop fades in
  (`hsl(0 0% 5% / 0.55)` + `backdrop-filter: blur(6px)`).
- **Card morph**: shared `layoutId="capsule-{slideNumber}-{i}"` between
  source capsule and the card → Framer interpolates the rect. Spring
  `stiffness: 320, damping: 32, mass: 0.7`. Inner content fades in with
  180ms delay so the morph reads first.
- **Close**: Esc, backdrop click, ✕ button, or slide navigation. CTA with
  `onClickRevealSlide` closes + navigates; CTA with `href` opens new tab.
- Reduced motion: card snaps (`duration: 0.01`), no blur, no flip.

## Files

- `spec/slides/22-interactive-capsules.md` — spec of record.
- `src/slides/types.ts` — `CapsuleSpec` + `CapsuleExpandSpec` types.
- `src/slides/components/Capsule.tsx` — hover flip + arrow + `isExpanding` prop.
- `src/slides/types/CapsuleListSlide.tsx` — `expandedIdx` state + overlay.
- `spec/slides/showcase/02-capabilities.json` — reference deck using both
  `hoverText` and `expand` on every capsule.

## Reuse

Until a second slide type needs the expanding card, keep `expandedIdx` +
the `<AnimatePresence>` block inline in `CapsuleListSlide`. When a second
type needs it, extract `useCapsuleExpand(slideNumber, capsules)` into a
hook (`src/slides/hooks/`).
