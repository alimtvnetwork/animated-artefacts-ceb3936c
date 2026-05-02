---
name: autoplay-timing-presets
description: User-tunable hold delay + tick interval for the press-and-hold Enter autoplay — three presets (Snappy 300/700, Balanced 400/900 default, Relaxed 700/1200) surfaced in /settings, live-applied to SlideDeckPage via preset-settings subscription.
type: feature
---
v0.159.0.

# What changed
The hardcoded `AUTOPLAY_HOLD_MS = 400` / `AUTOPLAY_TICK_MS = 900` constants in `SlideDeckPage` are gone. Both values now live on the `PresetSettings` interface (`autoplayHoldMs`, `autoplayTickMs`) and are read live from the preset-settings store.

# Three presets in /settings
- **Snappy** — hold 300ms · tick 700ms. Fast walkthroughs, dense decks.
- **Balanced** — hold 400ms · tick 900ms. Default; matches the typical slide transition.
- **Relaxed** — hold 700ms · tick 1200ms. Storytelling, pauses to read.

Defined in `AUTOPLAY_PRESETS` in `presetSettings.ts`. The settings panel renders them as a radio-group of buttons; the active one (matched by `matchAutoplayPreset(holdMs, tickMs)`) gets a gold ring. Custom values (set programmatically) display an "Custom timing active" hint with the actual ms.

# Live application
`SlideDeckPage` stores the values in refs (`autoplayHoldRef`, `autoplayTickRef`) and subscribes to `subscribePresetSettings` so changes from `/settings` propagate without a reload AND without re-binding the global keydown listener (closure always reads `.current`).

# Persistence + scope
Both fields persist via the existing `riseup.presetSettings.v1` localStorage blob alongside title scale, brand inset, handout footer, etc. Defaults preserve the original v0.120 timing so existing muscle memory is intact. Reset-to-defaults includes both new fields.

# Files
- `src/slides/presetSettings.ts` — `autoplayHoldMs` / `autoplayTickMs` interface fields + defaults + `AUTOPLAY_PRESETS` + `matchAutoplayPreset` helper
- `src/pages/SlideDeckPage.tsx` — refs replace constants; subscription updates them on settings change
- `src/pages/SettingsPage.tsx` — new "Hold-Enter autoplay" radio-group panel; reset-to-defaults check extended
- `package.json` — 0.159.0
