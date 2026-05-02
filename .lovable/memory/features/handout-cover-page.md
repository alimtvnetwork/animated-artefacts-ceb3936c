---
name: handout-cover-page
description: Optional first page in /handout export with deck title, presenter byline (reuses handoutPresenterName), today's date, and an optional subtitle — togglable from /settings.
type: feature
---
v0.157.0.

# Cover page on /handout
First A4 landscape page rendered BEFORE slide 01. Visual language matches a TitleSlide: Ubuntu display title, gold accent rule, Inter meta rows, gradient noir background with thin gold inset border. Reads as part of the deck rather than a generic cover sheet.

# Content shown
- **Eyebrow**: "Presentation handout" (small uppercase gold).
- **Title**: `deck.deckName` from the active deck spec.
- **Subtitle** (optional): `handoutCoverSubtitle` from preset settings — empty string hides the line.
- **Rule**: 2px gold accent, ~clamped width.
- **Presented by**: `handoutPresenterName` from preset settings (the same field used in the per-page footer). Row hides when empty.
- **Date**: `new Date().toLocaleDateString(undefined, { year, month: 'long', day })` computed once at mount. Always shown.

# Settings (preset, persisted)
Two new fields on `PresetSettings`:
- `handoutShowCover: boolean` — default `true`. Master toggle.
- `handoutCoverSubtitle: string` — default `''`. Free-text, max 80 chars, disabled when cover is off.

Both live alongside the existing handout footer fields in the "Handout footer" panel of `/settings`. Reset-to-defaults checks include both new fields.

# Slide numbering
Cover does NOT count toward `i + 1` of the per-slide footer — slide 01 remains the first real linear slide. The cover has no `.handout-page-footer-bar`, so confidentiality / presenter / numbers chips don't render on it.

# Print behaviour
Uses the existing `.handout-page` + `.handout-stage` flex-letterbox structure (v0.155 fit-to-page) so the cover prints as one full A4 landscape sheet with the same `break-after: page` flow.

# Files
- `src/slides/presetSettings.ts` — `handoutShowCover`, `handoutCoverSubtitle` interface fields + defaults
- `src/pages/HandoutPage.tsx` — subscribes to both new fields, renders `<section.handout-page.handout-cover>` conditionally before the slides map
- `src/index.css` — `.handout-cover`, `.handout-cover-eyebrow/title/subtitle/rule/meta*` rules
- `src/pages/SettingsPage.tsx` — toggle + subtitle input added to "Handout footer" panel; reset-to-defaults check extended
- `package.json` — 0.157.0
