# 08 — Meeting

**Type**: `QrMeetingSlide` (compact `meetingLabel` variant)

## Purpose
Closer slide. Compact QR-led layout (no `contactRows` / no `cta`) so the QR is
the hero. Reuses the same `riseup-meeting` QR asset as the noir showcase deck.

## Animation contract
- `transition: FadeIn` / `textAnimation: Stagger` — capsules fade in row-by-row
  while the QR stays steady.
- `titleShimmer: true` — the only deck-side shimmer on this deck besides the
  title slide; sells the "this is the moment to act" beat.

## Speaker notes
Hold for ~10 seconds while the room scans. Don't talk over the silence —
that's when bookings happen.
