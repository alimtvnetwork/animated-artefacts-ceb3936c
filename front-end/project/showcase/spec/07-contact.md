# 06 — Contact (RiseupAsia)

- **Type:** QrMeetingSlide (contact layout — auto-activated by `contactRows`)
- **Transition:** FadeIn
- **Text animation:** FadeIn
- **Visual:** Branded QR (380px) on the left. Right column: gold "Let's Build Together" eyebrow → large "RiseupAsia" wordmark with animated gold underline → vertical contact rows (location pin + address, mail + email, phone + number) → gold "Schedule a Call" CTA pill with arrow.
- **Inspiration:** Modeled after the closing slide of `present-v1.riseup-asia.com` slide 37.
- **Layout switch:** `QrMeetingSlide` auto-detects `contactRows` and renders the contact layout instead of the compact card. The compact layout is preserved for slide 5 (`05-meeting`).
- **No presenter chip:** The closing slide is brand-forward, not presenter-forward.
