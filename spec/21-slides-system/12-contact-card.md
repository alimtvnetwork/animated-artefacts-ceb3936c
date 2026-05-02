# 12 — Contact Card (RiseupAsia)

The deck's hero contact slide. Dense visual brief — an AI or designer should be able to rebuild it pixel-accurate from this file alone.

## 1. Overall layout

- Full-width section, dark background, centered content.
- Two-column grid `1fr 1.2fr`, gap 80–96px.
  - Left: QR card + caption beneath.
  - Right: eyebrow → headline → underline → contact list → CTA → social icons.
- Top-aligned: heading sits at the same Y as the top of the QR card.
- Max width ~1100–1200px, side padding 64px, vertical padding 96px.

## 2. Background

- Base `#08080A` (`hsl(240 7% 4%)`) — never pure `#000`.
- Two warm radial glows (top-right strong, bottom-left faint):
  - `radial-gradient(circle at 85% 15%, hsla(40 100% 50% / 0.08), transparent 50%)`
  - `radial-gradient(circle at 15% 85%, hsla(40 100% 50% / 0.04), transparent 40%)`
- Faint diagonal noise/dot overlay at ~3% opacity.

## 3. Color tokens (HSL)

| Token                  | Value           | Usage                                        |
|------------------------|-----------------|----------------------------------------------|
| `--background`         | `240 7% 4%`     | page bg                                      |
| `--surface`            | `240 6% 8%`     | QR card bg (slightly lifted)                 |
| `--foreground`         | `0 0% 100%`     | primary text — "Riseup"                      |
| `--muted-foreground`   | `240 5% 65%`    | body text, addresses                         |
| `--subtle-foreground`  | `240 5% 45%`    | "Scan to connect", social icons, eyebrow     |
| `--primary`            | `40 100% 50%`   | "Asia", icons, CTA bg, underline (amber)     |
| `--primary-foreground` | `240 10% 8%`    | text on amber CTA (intentional near-black)   |
| `--accent-red`         | `0 85% 55%`     | QR finder pattern squares only               |

## 4. Left column — QR card

- ~340×340px, white `#FFFFFF` card, radius 16px, internal padding 20px.
- Warm-tinted shadow:
  `0 20px 60px -20px hsla(40 100% 50% / 0.15), 0 0 0 1px hsla(0 0% 100% / 0.04)`.
- QR code: black modules on white.
- **Three finder patterns (top-left, top-right, bottom-left) are red rounded squares with a white center dot.** This is the brand signature — never default black. Outer radius ~8px, inner radius ~4px.
- Center logo overlay: "RiseupAsia" wordmark on a small white pill, ~25% of QR width.
- Caption beneath the card: `Scan to connect`, color `--subtle-foreground`, 14px / weight 400, `margin-top: 20px`, centered.

## 5. Right column — content stack

Vertical stack, ~28px between groups.

### 5a. Eyebrow

`LET'S BUILD TOGETHER` — uppercase, tracking `0.2em`, 13px / weight 500, color `--subtle-foreground`.

### 5b. Headline

Two-tone, no space-break: `Riseup` + `Asia`.

- Bold sans-serif (Inter / Plus Jakarta / Manrope), weight 700.
- 64px desktop, 40px mobile, line-height 1.05.
- `Riseup`: `--foreground`. `Asia`: `--primary`.
- Underline accent directly below: 80×3px, `--primary`, radius 2px, margin-top 12px.

### 5c. Contact list

Vertical, 20px row gap. Each row = icon tile + text, gap 16px, items aligned center.

Icon tile (identical for every row):
- 40×40px, `hsla(40 100% 50% / 0.1)` (10% amber tint), radius 10px.
- Icon 18px, color `--primary`, stroke-width 2.
- Lucide icons used: `MapPin`, `Mail`, `Phone`, `Calendar`.

Text: `--muted-foreground`, 16px / weight 400. Address row preserves the line break after "Sheridan,".

### 5d. CTA row

Fourth list row replaces text with a button (icon stays):

- Label: `Schedule a Call`.
- BG `--primary`, FG `--primary-foreground`.
- Weight 600 / 15px, padding `12px 24px`, radius 10px.
- Hover: brightness +8%, `translateY(-1px)`, shadow `0 8px 20px -8px hsla(40 100% 50% / 0.5)`. Transition 200ms ease.

### 5e. Social icons

- Margin-top 32px below the CTA.
- LinkedIn / Mail / GitHub (lucide), 22px, color `--subtle-foreground`, gap 24px.
- Hover: color → `--primary`, 200ms.
- **No background pills** — bare icons (different from contact rows).

## 6. Spacing

4px base scale: `4, 8, 12, 16, 20, 24, 32, 48, 64, 96`.

- Eyebrow → headline: 16px
- Headline → underline: 12px
- Underline → contact list: 40px
- Between contact rows: 20px
- Contact list → social icons: 32px

## 7. Typography hierarchy

| Element        | Size  | Weight | Tracking | Color          |
|----------------|-------|--------|----------|----------------|
| Headline       | 64px  | 700    | -0.02em  | foreground / primary |
| Eyebrow        | 13px  | 500    | 0.2em    | subtle         |
| Body / contact | 16px  | 400    | normal   | muted          |
| Caption        | 14px  | 400    | normal   | subtle         |
| Button         | 15px  | 600    | normal   | primary-fg     |

## 8. Responsive

- ≥1024px: two columns as drawn.
- <1024px: stack vertically, QR centered on top, content below, text left-aligned.
- <640px: headline → 40px, QR → 280px, side padding → 24px.

## 9. Critical details (often missed)

1. Amber is **not yellow** — saturated orange-gold around `#FFA500` / `hsl(40 100% 50%)`.
2. **QR finder squares are red, not black** — brand mark.
3. Icon backgrounds are amber at **10% opacity**, not solid.
4. `Asia` and the underline share the **exact same amber** — visual rhyme.
5. Background has a tiny cool tint (`#08080A`) — not pure `#000`.
6. CTA text is `hsl(240 10% 8%)`, not pure black.
7. Card shadow is **warm-tinted**, not gray.
8. Eyebrow letter-spacing is aggressive (`0.2em`).
9. Underline under the wordmark is short and chunky, not full-width.
10. No borders anywhere except optional 1px white-at-4% on the QR card.

## 10. Implementation notes (deck-specific)

- Slide type stays `QrMeetingSlide`; the contact layout activates when `content.contactRows` or `content.cta` is set.
- The QR is rendered by a new `BrandedQR` variant with `style="riseup-finder"` that draws the standard QR + overlays the three red rounded finder squares + center logo pill on canvas (still white tile + ink modules so the **white-tile + ink rule** holds — the red lives only on the white card, never on the noir background).
- Contact row `icon: "calendar"` mapped to a CTA-row variant (`href` becomes the button target) — set `cta.icon: "calendar"` to render the CTA inline with the list.
- Social icons come from a new optional `content.socials: [{ icon, href }]` array.
- All amber tokens read from existing `--gold` / `--gold-glow` so theme switching still works; the spec's `#FFA500` and the bundled brand `#f3a502` are visually identical.
