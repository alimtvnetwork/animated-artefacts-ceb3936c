---
name: branded-qr
description: Reusable BrandedQR with deck-level meeting URL, per-slide overrides, and live URL→QR generation
type: feature
---

## What

`BrandedQR` (`src/slides/components/BrandedQR.tsx`) is the single QR surface for the deck. Three input modes:

- `url`   — live URL encoded client-side via the `qrcode` library (white tile + ink modules, error correction `H`).
- `asset` — registered bundled PNG slug (preferred for authored brand artwork).
- `src`   — explicit image src override.

Resolution order: `src` > `asset` > `url` > bundled `meeting-qr.png` fallback. Static paths render synchronously so the tile never flashes.

## Locked visual contract

- **Aspect ratio:** native 1:1. Do NOT crop or distort.
- **Palette:** pure white tile + ink (#0d0d0d) modules. Never recolored.
- **Padding/shadow:** 6px ink-tinted padding + soft drop shadow.
- Live-generated QRs use `errorCorrectionLevel: 'H'` so a small logo overlay would still scan.

## Configuration

### Deck-level default — `deck.meeting`

```json
{
  "meeting": {
    "url": "https://meet.rasia.pro/intro-call",
    "label": "meet.rasia.pro/intro-call",
    "qrAsset": "riseup-meeting"
  }
}
```

Every meeting/contact slide picks this up automatically.

### Per-slide override — `slide.content`

- `meetingUrl`   — overrides `deck.meeting.url`.
- `meetingLabel` — overrides `deck.meeting.label`.
- `qrAsset`     — overrides `deck.meeting.qrAsset`. When set, the bundled PNG wins over any URL.
- `qrUrl`       — legacy alias for `meetingUrl`, kept for back-compat.

## Resolver

`resolveMeeting(slide)` in `src/slides/meeting.ts` merges deck + per-slide config and returns `{ url, label, qrAsset }`. Both `QrMeetingSlide` layouts call it. Any future surface that wants a meeting QR should call it too. If no label is set, the resolver derives one from the URL host + path.

## Registry

`QR_REGISTRY` in `BrandedQR.tsx` maps slugs → bundled PNG. To add a new branded QR:
1. Drop PNG into `src/assets/brand/`.
2. Add a kebab-case slug entry.
3. Reference from `deck.meeting.qrAsset` or `slide.content.qrAsset`.
