# 09 — Branded QR + Hover Interaction Language

Two deck-wide standards live in this doc because they were locked in the same
authoring pass and must stay in lockstep.

## A. Branded QR (reusable component)

The deck supports two QR sources from a single component:

1. **Designer-authored PNG** (preferred for brand-approved artwork) — shipped
   in `src/assets/brand/`, registered by slug, rendered at native 1:1.
2. **Live URL → QR** generated client-side via the `qrcode` library when no
   asset is registered. Same locked visual contract: pure white tile + ink
   modules, no recoloring, native aspect ratio.

### Rules (locked)

- **Aspect ratio:** native 1:1. Do not crop or distort.
- **Palette:** pure white tile + ink (#0d0d0d) modules. Never red on black.
  White tile + soft drop shadow + 6px ink-tinted padding.
- **Source of truth (asset path):** the PNG file. Code never touches artwork.
- **Source of truth (URL path):** the resolved `meetingUrl` — generated with
  error-correction level `H` so a logo overlay would still scan.

### Component

`src/slides/components/BrandedQR.tsx`

```tsx
<BrandedQR url="https://meet.example.com/intro" />   // live-generated
<BrandedQR asset="riseup-meeting" size={260} />      // bundled PNG
<BrandedQR src={customPng} size={240} alt="…" />     // direct override
```

Resolution order: `src` > `asset` > `url` > bundled `meeting-qr.png` fallback.

### Registry

```ts
const QR_REGISTRY = { 'riseup-meeting': defaultQr };
```

To add a new branded QR: drop PNG into `src/assets/brand/<slug>.png`, register
in `BrandedQR.tsx`, reference from `deck.meeting.qrAsset` or
`slide.content.qrAsset`.

### Configuration — deck-level + per-slide override

Set the meeting destination once on the deck; override per slide when needed.

**Deck (`spec/slides/{deck}/deck.json`):**

```json
{
  "meeting": {
    "url": "https://meet.rasia.pro/intro-call",
    "label": "meet.rasia.pro/intro-call",
    "qrAsset": "riseup-meeting"
  }
}
```

**Per-slide (`slide.content`):**

```jsonc
{
  "slideType": "QrMeetingSlide",
  "content": {
    "title": "Book a Call",
    "meetingUrl":   "https://cal.com/special-promo",  // overrides deck
    "meetingLabel": "cal.com/special-promo",          // overrides deck
    "qrAsset":      "promo-launch",                   // overrides deck (asset wins over URL)
    "qrUrl":        "https://...",                    // legacy alias for meetingUrl
    "capsules": [{ "text": "30 min", "color": "gold" }]
  }
}
```

Merge happens in `resolveMeeting(slide)` (`src/slides/meeting.ts`):
per-slide values win, then deck-level, then a label is derived from the URL
host when nothing is set. `QrMeetingSlide` (compact + contact layouts) calls
the resolver — never reads `content.qrAsset` directly.

## B. Hover interaction language — `.lift-hover` / `.lift-hover-subtle`

The previous capsule hover (`whileHover: { scale: 1.04 }` via framer) was
replaced deck-wide. Scale-based hovers feel zoomy and unprofessional; a soft
drop-shadow lift reads as premium.

### Tokens (CSS, in `index.css`)

| Class                  | Where it's used                     | Effect on hover |
|------------------------|-------------------------------------|------------------|
| `.lift-hover`          | Capsules and slide-level CTAs       | `translateY(-1.5px)` + gold-tinted shadow + subtle brightness lift. 280ms easing. |
| `.lift-hover-subtle`   | Controller buttons, ShareMenu items, deck chrome | `translateY(-1px)` + neutral drop shadow. 240ms easing. No gold tint. |

Both:
- Never change scale.
- Use `var(--transition-smooth)` for consistent easing.
- Have an `:active` pull-down to give a tactile press feel.
- Are GPU-friendly (`will-change: transform, box-shadow`).

### Authoring rule

When you add a new clickable element to the deck, pick one:

- Content / CTAs / capsules → `lift-hover`.
- Chrome / controls / menus → `lift-hover-subtle`.

Do **not** introduce one-off scale or zoom hovers in component code. If a new
hover style is genuinely needed, add a third token here so it's reusable.

### Reduced motion

Both tokens collapse to no-op under `prefers-reduced-motion: reduce` (the
global rule in `index.css` sets all transition durations to ~0ms).
