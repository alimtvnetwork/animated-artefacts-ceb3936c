# 08 — Branded Header Strip

A thin, full-width band rendered **above** the standard `BrandHeader` on every
slide. Use it to surface deck-wide branding (Riseup Asia LLC + tagline,
co-brand/sponsor logos, year/version markers) without crowding the slide
title.

## Visual contract

- Height: **36px** (`h-9`). Never grows.
- Position: `top:0`, full width, `z-30` (above the standard header).
- The standard `BrandHeader` is automatically pushed down by 36px when the
  strip is present, so the two stack cleanly.
- Background tones: `solid` (semi-opaque ink, default), `gradient`
  (subtle gold→ink fade), `transparent`.
- Optional hairline gold divider (`hsl(var(--gold)/0.25)`) under the strip.
- Theme-aware: every color reads through CSS variables, so the strip tracks
  the Noir & Gold ↔ Bright Gold theme switcher live.

## Configuration

### Deck-level default (recommended)

Define once on `spec/slides/{deck}/deck.json`:

```json
{
  "deckSlug": "showcase",
  "deckName": "Riseup Asia LLC — Showcase",
  "theme": "noir-gold",
  "brandStrip": {
    "logoAlt": "RISEUP ASIA LLC",
    "tagline": "Riseup Asia LLC · 2026 Deck",
    "taglineTone": "cream",
    "divider": true,
    "background": "solid"
  },
  "slides": ["01-title", "02-capabilities", "..."]
}
```

Every slide in the deck inherits this strip automatically.

### Per-slide override

On any slide JSON:

```jsonc
{ "brandStrip": false }                // hide the strip on this slide
{ "brandStrip": null }                 // same as false
{ "brandStrip": { "tagline": "Confidential — Series A" } } // replace deck default
```

Omit `brandStrip` entirely on a slide to inherit the deck-level config.

## Fields

| Field         | Type                                    | Default        | Notes |
|---------------|-----------------------------------------|----------------|-------|
| `logoAsset`   | `"riseup-asia"`                         | `riseup-asia`  | Registered bundled logo slug. Preferred for exported/imported decks because the renderer resolves it to the built image URL. |
| `logo`        | string (image src)                      | —              | Direct image src. Use only for absolute/export-safe URLs; otherwise prefer `logoAsset`. |
| `logoAlt`     | string                                  | `Riseup Asia LLC` | Alt text. Also used as fallback text if no asset resolves. |
| `logoHeight`  | integer (12–32)                         | `22`           | px. Clamped at runtime so it never overflows the 36px strip. |
| `logoAlign`   | `"left" \| "center" \| "right"`         | `left`         | Horizontal position of the logo within the strip. When `right`, the tagline (if any) automatically moves to the **left** edge so the two never collide. |
| `padding`     | `"tight" \| "cozy" \| "roomy"`          | `cozy`         | Horizontal padding preset on both edges. `tight` = `px-3 sm:px-4`, `cozy` = `px-5 sm:px-6 md:px-8`, `roomy` = `px-8 sm:px-10 md:px-14`. |
| `tagline`     | string                                  | —              | Rendered as a fixed-height (22px) **pill** anchored opposite the logo — not raw text. Padding/sizing is locked across viewports so it never reflows. |
| `taglineTone` | `"gold" \| "cream" \| "muted"`          | `cream`        | Pill treatment: `gold` = ink text on gold gradient (max contrast), `cream` = ink text on cream fill (default), `muted` = cream text on translucent ink. All three keep identical padding so swapping tones never shifts layout. |
| `divider`     | boolean                                 | `true`         | Hairline gold border-bottom. |
| `background`  | `"solid" \| "gradient" \| "transparent"`| `solid`        | Visual density of the band. |

### Layout

The strip uses a 3-column grid (left / center / right). The logo occupies the
slot named by `logoAlign`; the tagline pill always takes the opposite edge.
That means `logoAlign: "right"` flips the tagline to the left automatically —
authors never have to think about collision.

## Authoring rules

- The strip is for **brand/identity**, not slide content. Never put titles,
  CTAs, or per-slide messages in it.
- Keep `tagline` short (≤ 40 chars) so it never wraps inside 36px.
- If you supply a `logo`, prefer SVG/PNG ≤ 36px tall — large rasters get
  scaled down which looks soft.
- The strip never animates per-slide; it's chrome, not content. The standard
  `BrandHeader` keeps its existing presenter chip behavior.
