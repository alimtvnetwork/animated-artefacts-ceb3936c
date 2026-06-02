# 10 — Visibility & Settings

Which slide-number surface shows when. Owner: `src/pages/SlideDeckPage.tsx`.
States that hide surfaces: `gridOpen`, `topJumperHidden`, `isStepsChain3D`,
the `showDots` preset, and the `?jumper=1` flag.

## Per-surface visibility matrix

| Surface | Default | Hidden when |
|---------|---------|-------------|
| Presenter Top Bar | **OFF** (`topJumperHidden` defaults `true`) | always unless presenter opted in via `J`; also `gridOpen` · on `StepsChain3DSlide` |
| Slide Number Badge | **ON** | `gridOpen` |
| Dot Pagination | **ON** (`showDotPagination: true`) | `!showDots` (settings) · `gridOpen` · on `StepsChain3DSlide` |
| Controller Indicator | shown when controller pill is **expanded** | controller collapsed (hover to expand) · grid view |
| Legacy Top Jumper | **OFF** | unless `?jumper=1` (and not grid / not `topJumperHidden`) |
| Grid Overview numbers | only in grid | always except `gridOpen` |

## The `topJumperHidden` toggle

- A presenter affordance to keep the stage clean. Bound to the **`J`** key and
  available in the controller hamburger menu ("Hide top jumper").
- Persisted in `localStorage` (key family `riseup.*Hidden*`) by the page so the
  choice survives reloads. There is a one-time migration guard
  (`riseup.…Hidden.migrated.v1`).
- When `true`, both `PresenterTopBar` and the legacy `TopSlideJumper` hide.

## The `showDotPagination` preset

- Source: `src/slides/presetSettings.ts` → `getPresetSettings()`.
- `DEFAULT_PRESET_SETTINGS.showDotPagination = true`.
- Toggled in `/settings`. `SlideDeckPage` reads it into `showDots` state and
  re-reads on settings change.

## Grid / overview view

- When `gridOpen` is true, **all** live number surfaces hide so they don't
  stack on top of the overview chrome. The grid itself shows each slide's
  number on its thumbnail and calls `goTo` (silent) on click.

## StepsChain3DSlide special case

- This slide owns its full surface as the only click target, so the top bar
  and dot pagination are suppressed on it (`isStepsChain3D` /
  `slide?.slideType !== 'StepsChain3DSlide'`). The bottom badge still shows.

## Print / export

- Every interactive chrome surface carries `data-print-hide="true"` so it is
  stripped from print, PDF, and HTML exports. Only slide content prints.
