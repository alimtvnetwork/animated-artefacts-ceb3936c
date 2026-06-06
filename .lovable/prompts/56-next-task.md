# 56 — Next Task (v5)

Snapshot of the recurring "Next N Steps" driver (N=3).

## This turn
Promote pagination threshold/neighbors to `PresetSettings` + `/settings` UI —
**found the feature already shipped in v1.60.0** (store fields, defaults,
`SlideDeckPage` consumer, and `SettingsPage` controls all present). The real
remaining defect was a coding-guideline rule 6 violation: the `5/99` and `1/5`
clamp limits were inline magic numbers in `SettingsPage.tsx`.

Root cause: dot-pagination clamp bounds were hard-coded literals in the
settings UI instead of hoisted constants.

Fix: added `DOT_PAGINATION_COLLAPSE_BOUNDS`, `DOT_PAGINATION_NEIGHBORS_BOUNDS`,
and a `clampToBounds()` helper in `src/slides/presetSettings.ts`; `SettingsPage`
now reads min/max/clamp from those constants. Bumped to v1.61.0.
