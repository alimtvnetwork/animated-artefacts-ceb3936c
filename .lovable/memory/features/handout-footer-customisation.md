---
name: handout-footer-customisation
description: Three-zone customisable handout footer — slide numbers toggle, presenter byline text, confidentiality label text — persisted in preset settings, live-updates on /handout
type: feature
---
v0.156.0.

# Three independent footer zones
The PDF handout footer (`/handout` route) is now a three-zone bar (left / center / right) instead of a single bottom-right slide-number badge. All three are independently controlled from `/settings`:

- **Left zone — Presenter byline** (`handoutPresenterName: string`). Free-text, max 80 chars. Empty = hidden.
- **Center zone — Confidentiality label** (`handoutConfidentialityLabel: string`). Free-text, max 40 chars, rendered uppercase gold chip. Empty = hidden.
- **Right zone — Slide numbers** (`handoutShowSlideNumbers: boolean`). "01 / 24" badge. Default ON.

If all three are off/empty, no footer renders at all (`.handout-footer-zone:empty { display: none }`).

# Live updates
`HandoutPage` subscribes via `subscribePresetSettings` so tweaks in `/settings` propagate without a refresh. State is local React `useState` updated from the listener — no remount.

# Footer position
Lives inside `.handout-page-footer-bar` (absolute, full width, flex space-between). Sits in the letterbox bar from v0.155 fit-to-page so it never overlaps slide content. Forced visible in print via `@media print { .handout-page-footer-bar { display: flex !important } }`.

# Persistence + scope
Stored in the existing `riseup.presetSettings.v1` localStorage blob alongside title scale, brand inset, etc. Three new fields on `PresetSettings` interface; defaults: `{ handoutShowSlideNumbers: true, handoutPresenterName: '', handoutConfidentialityLabel: '' }` — no behavioural change for users who don't touch the new panel.

# Files
- `src/slides/presetSettings.ts` — three new interface fields + defaults
- `src/pages/HandoutPage.tsx` — subscription + three-zone JSX
- `src/index.css` — `.handout-page-footer-bar` + zone classes; print rule updated
- `src/pages/SettingsPage.tsx` — new "Handout footer" panel under the alignment-guide section
- `package.json` — 0.156.0
