# 01 — Overview & Glossary

## Purpose of the slide-number system

In a live presentation the audience and presenter must always be able to
answer, in under one second: **"Which slide are we on, and how many are
left?"** The deck answers this with four simultaneous on-screen surfaces, plus
a way to **jump** to any slide by its number.

This is intentionally redundant: the hover-revealed controller pill is hidden
most of the time, so the deck also shows always-on, low-contrast indicators
(top bar + bottom badge) that never compete with slide content but are always
readable.

## Glossary

| Term | Meaning |
|------|---------|
| **Linear slides** | The ordered list of slides that make up the main flow of the deck. Click-reveal child slides live OUTSIDE this flow and are not counted. |
| **`current` / `currentLinear`** | The **1-based position** of the on-screen slide *within the linear list*. This is the number every surface displays. `currentLinear = resolvedLinearIdx + 1`. |
| **`total`** | Count of linear slides (e.g. 13). The denominator on every surface. |
| **`slideNumber`** | The slide's **authored id** from its JSON spec. This is what the URL route uses (`/N`). It is NOT always equal to `currentLinear` (a deck may renumber, or include non-linear slides). Surfaces display `currentLinear`; routing uses `slideNumber`. |
| **Jump** | Navigating directly to a chosen slide number (vs. stepping next/prev). |
| **Surface** | One on-screen component that renders the slide number. |
| **Chrome** | Non-slide UI (controllers, badges, bars). Always `data-print-hide`. |

## The relationship that trips people up

```text
URL  /7              ← uses slide.slideNumber (authored id)
        │
        ▼
SlideDeckPage resolves which linear slide that is
        │
        ▼
currentLinear = position in linear list (1..total)   ← what users SEE
```

- **Display surfaces show `currentLinear`** ("Slide 04 of 13").
- **Routing + jump handlers convert** a chosen linear position back into the
  target slide's `slideNumber` before calling `navigate('/N')`.
- See `02-data-and-state.md` and `08-jump-and-routing.md` for the exact code.

## Brand context (Noir & Gold)

All slide-number surfaces obey the deck theme:

- Background: near-black (`--background`, #0D0D0D) with `backdrop-blur-md`.
- **Current number: gold** (`--gold`, #C9A84C) — `text-gold`, `tabular-nums`.
- Total / separators: dimmed foreground (`text-foreground/30..75`).
- Hairline borders at low gold alpha (`border-gold/20..25`).
- Font: monospace / display, `tabular-nums` so digits never jitter when the
  count changes between single- and double-digit.

## Why `tabular-nums` everywhere

Slide numbers update live as the presenter moves. Proportional digits would
shift the layout when going from `9` to `10`. Every number uses
`tabular-nums` (CSS `font-variant-numeric: tabular-nums`, applied via the
Tailwind `tabular-nums` utility) so each digit occupies a fixed width.
