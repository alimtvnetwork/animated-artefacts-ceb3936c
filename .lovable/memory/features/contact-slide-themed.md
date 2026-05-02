---
name: contact-slide-themed
description: QrMeetingSlide ContactLayout uses --primary/--background/--foreground/--muted-foreground tokens; theme switch repaints slide 6 instantly
type: design
---

# Contact slide is fully theme-bound (v0.153.1)

`src/slides/types/QrMeetingSlide.tsx` `ContactLayout` previously hard-coded
amber `hsl(40 100% 50%)`, dark bg `hsl(222 14% 7%)`, and gray text values
that never changed when the user switched themes — slide 6 stayed amber-on-
black under every palette.

All color literals in that component are now CSS tokens:
- Accent (wordmark second word, underline bar, contact icon tile, CTA bg,
  CTA shadow, social hover, hover row tint, QR card glow) → `hsl(var(--primary))` / `hsla(var(--primary) / N)`
- CTA text → `hsl(var(--primary-foreground))`
- Slide background radial layers → `hsla(var(--primary) / N)` over `hsl(var(--background))`
- Mid-band radial → `hsla(var(--muted) / N)`
- Headline → `hsl(var(--foreground))`
- Eyebrow + "Scan to connect" + social default + non-link rows → `hsl(var(--muted-foreground))` (or `hsl(var(--foreground) / 0.75)` for body rows)

Rule for any future contact-slide edit: NEVER reintroduce a raw HSL/hex
color in this file. Use tokens. The QR PNG itself stays a designer-locked
white/black asset (BrandedQR), unaffected.
