---
name: slide-builder
description: /builder route — split-pane in-app slide builder with live SlidePreview, covering all 8 slide types. Outputs JSON for paste into deck folders.
type: feature
---

## What

`/builder` route. Split pane: form on the left, live `SlidePreview` tile on
the right (1920×1080 scaled), JSON output below. Authoring-only — never
mutates the bundled deck. Output is JSON the author pastes into
`spec/slides/{deck}/NN-name.json`.

Discoverable via the controller's deck menu (FileJson icon → "Open slide
builder") and direct navigation to `/builder`.

## Files

- `src/pages/BuilderPage.tsx` — top-level page (split layout, header,
  type picker, JSON pane, Copy/Download).
- `src/builder/fieldSchemas.ts` — per-`SlideTypeValue` field list + defaults.
  Single source of truth for "which fields does this slide type expose".
- `src/builder/FormPrimitives.tsx` — `Field`, `TextField`, `TextAreaField`,
  `SelectField`, `Repeater` (generic add/remove array editor).
- `src/builder/ContentFieldEditor.tsx` — `FieldKey` → input renderer.
  Add a new field by extending the `FieldKey` union and adding a `case` here.

## Adding a new slide type to the builder

1. Add the type to `SlideType` enum in `src/slides/enums.ts` (already required
   for runtime).
2. Add an entry in `SLIDE_TYPE_SCHEMAS` (`fieldSchemas.ts`) with `label`,
   `blurb`, `fields`, `defaults`, optional `slideDefaults`.
3. Append the key to `SLIDE_TYPE_KEYS` to surface it in the picker.

If the type needs a brand-new content field:
1. Add the field to `SlideContent` in `src/slides/types.ts`.
2. Add it to `FieldKey` in `fieldSchemas.ts`.
3. Add the renderer `case` in `ContentFieldEditor.tsx`.

## Live-preview contract

Preview renders via the existing `SlidePreview` component, so the builder
inherits any future preset/theme changes for free. Do NOT fork a separate
preview pipeline — that defeats the purpose.

## JSON export hygiene

`stripDefaults()` in `BuilderPage.tsx` drops empty/falsy content keys before
`JSON.stringify`, so exported JSON matches the hand-authored style of files
in `spec/slides/showcase/`.
