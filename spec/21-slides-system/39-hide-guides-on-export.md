# spec/slides/39 — Auto-hide alignment guides on export

**Status**: shipped in v0.75.0
**Companion to**: spec 35 (live alignment guide), spec 38 (preview guide)

## Summary

Adds a `hideAlignmentGuideOnExport` setting (default ON). When the user
clicks "Export deck as JSON" in the DeckMenu, alignment-guide overlays
are temporarily suppressed so they don't sneak into screenshots or
screen recordings the user might capture around the export action.

Also adds `@media print` and `html[data-export-mode="true"]` rules that
unconditionally hide the guides during print/PDF capture or headless
export, regardless of the toggle state — guides are debug chrome and
should never reach a final exported artifact.

## Behavior

1. User has `showAlignmentGuide = true` and `hideAlignmentGuideOnExport
   = true` (defaults).
2. User opens DeckMenu → "Export deck as JSON".
3. `handleExport` flips `showAlignmentGuide → false`, triggering both
   `AlignmentGuideOverlay` and every `SlidePreviewAlignmentOverlay` to
   unmount within one frame.
4. `downloadManifest()` fires; the toast shows "Alignment guides hidden
   during export" so the user knows it happened.
5. After 1500ms, the toggle is restored to `true`. The 1.5s window
   covers the typical lag between click and a screen-recording grab.
6. If `hideAlignmentGuideOnExport = false`, the original behavior is
   preserved — guides stay on through export.

## Print / capture hardening

```css
@media print {
  [data-alignment-guide="true"],
  [data-preview-alignment-guide="true"] { display: none !important; }
}

html[data-export-mode="true"] [data-alignment-guide="true"],
html[data-export-mode="true"] [data-preview-alignment-guide="true"] {
  display: none !important;
}
```

This is the safety net: even if a future export tool uses the
`data-export-mode` attribute (or the user prints to PDF), guides are
forcibly hidden via CSS regardless of the React toggle state.

## Settings UI

`/settings` adds a new checkbox under "Alignment guide (debug)":

> ☑ Hide guides on export
>
> When you export the deck as JSON, alignment guides are temporarily
> suppressed so they don't sneak into screenshots or screen recordings
> captured around the export action. Restored automatically ~1.5s later.
> Print/PDF capture also drops the guides via @media print.

## Verification

1. Enable both `showAlignmentGuide` and `hideAlignmentGuideOnExport`.
2. Open the deck → DeckMenu → Export. Watch the guides disappear, the
   JSON download fire, the toast confirm "Alignment guides hidden", and
   the guides return after ~1.5s.
3. Disable `hideAlignmentGuideOnExport`. Re-export. Guides stay visible
   through the export.
4. With guides on, hit Cmd/Ctrl+P → Print to PDF. Guides MUST NOT appear
   in the print preview, regardless of the toggle state.
