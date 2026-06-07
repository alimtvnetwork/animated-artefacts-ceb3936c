# QuoteOverImageSlide

**Type:** `QuoteOverImageSlide`
**Purpose:** A pull-quote layered over a dimmed background photo. Use for
testimonial / quote beats where the words carry the slide and the image sets the
mood. One quote per slide; keep it to one or two sentences.

## Required content
- `quote` — the pull-quote text (string).
- `image` — background photo (`<img src>`: asset / `.svg` / Base64 / data URI).

## Optional content
- `eyebrow` — small label above the quote (e.g. `TESTIMONIAL`).
- `attribution` — speaker name, rendered under the quote.
- `attributionRole` — speaker role/company, rendered quieter under the name.
- `scrim` — legibility dim over the photo: `none` | `bottom` | `full` (default `full`).

## Behavior
- The quote is centered over the photo with a darkening scrim for legibility.
- Reduced-motion (`prefers-reduced-motion`) → instant fade entrance instead of
  the slide-up reveal.

## Example
```jsonc
{
  "slideNumber": 13,
  "slideName": "testimonial",
  "slideType": "QuoteOverImageSlide",
  "transition": "FadeIn",
  "textAnimation": "SlideUp",
  "content": {
    "eyebrow": "TESTIMONIAL",
    "quote": "It changed how our whole team ships.",
    "image": "images/customer.jpg",
    "attribution": "Jane Doe",
    "attributionRole": "Head of Product, Acme",
    "scrim": "full"
  }
}
```
