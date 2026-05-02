---
name: contact-card-v2
description: Canonical contact / closer slide — QrMeetingSlide ContactLayout. Two-tone wordmark, red-finder QR, amber tile rows, amber CTA, bare socials including required Facebook.
type: feature
---

When the user says "**contact card**" or "contact card v2" they mean
`QrMeetingSlide` rendered via `ContactLayout` (triggered by setting
`contactRows` and/or `cta` in the slide JSON). Spec:
`spec/slides/19-contact-card-v2.md` (supersedes `12-contact-card.md`).

Locked rules:
- Background: noir base `hsl(240 7% 4%)` + two warm amber radial glows (TR brighter, BL fainter). Never tint the background a different hue.
- Accent: warm amber `hsl(40 100% 50%)` — distinct from the project gold `hsl(45 60% 54%)` used elsewhere. Don't swap.
- QR: always white tile + red finder squares; never recolor. Use `qrStyle: "riseup-finder"` for the canonical card; `"clean"` only for kiosk / V3.
- Wordmark: `splitWordmark()` cuts `Riseup` (white) + `Asia` (amber). Falls back to single-tone `titleClassFor` for any other title.
- Underline: 80×3 amber bar, scaleX 0→1 origin-left, delay 0.42s, dur 0.55s.
- Contact rows: max 5. Amber 40×40 tile (10% bg, 18px icon). 20px row gap, 16px icon→text gap.
- CTA inline when `cta.icon` is set; standalone (mt-6) otherwise. Amber bg, ink fg, ArrowUpRight tail.
- Socials: bare 22px icons, gap-6, hover swaps to amber (color-only, no scale). Canonical set = linkedin + mail + github + facebook (Facebook is required if the company has a public page).
- Slide hides brand strip, brand header, and presenter chip — controller + dot pagination handle chrome.
- Variations (V1–V5) are JSON-only; the renderer never branches.
- Reduced-motion: snap entrance tweens, keep opacity fades.
- **Entrance: NO Ken-Burns / scale (v0.31).** Wrapper animates opacity 0→1 + y 18→0 over 0.7s expo-out only. The slow `scale: [0.96, 1, 1.05]` drift was user-rejected and removed.
