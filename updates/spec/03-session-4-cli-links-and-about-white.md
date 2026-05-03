# Update — Session 4 GitHub link CTAs on capsule expand

**Date**: 2026-05-03
**Scope**:
- `front-end/project/session-4-ai-coding/data/slides/05-ship-today.json`
- `front-end/project/session-4-ai-coding/data/slides/06-references.json`
- `front-end/project/session-4-ai-coding/data/slides/07-about-riseup.json`

## Change

1. **Slide 07 (About Riseup)** — `titleStyle: "gold"` → `"white"` so the
   About headline matches the deck-wide white-anchor rule.
2. **Slide 05 (Ship Today)** and **Slide 06 (References)** — every project
   capsule's `expand` payload now carries a working `cta` object pointing
   to the matching GitHub repo.

## CTA shape

```json
"expand": {
  "title": "Movie CLI",
  "body": "...",
  "cta": {
    "text": "View on GitHub →",
    "href": "https://github.com/alimtvnetwork/movie-cli-v8"
  }
}
```

Renderer (existing capsule expand panel) treats `cta.href` as a real
`<a target="_blank" rel="noopener">` — opens in a new tab, never inline.

## Repos linked

- `movie-cli-v8`
- `gitmap-v13`
- `alarm-cli` (and any sibling project capsules in the deck)

## Acceptance

- `/session-4-ai-coding/5` and `/6` — click any project capsule, expand
  panel shows a "View on GitHub →" link, click navigates externally.
- Slide 07 title renders pure white, matches slides 02 / 04.
