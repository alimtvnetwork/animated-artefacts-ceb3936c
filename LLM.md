# LLM.md — How any LLM creates slides for this deck

> **Single source of truth for AI agents.** Hand this one file to any LLM
> (Claude, GPT, Gemini, etc.) and it will know how to author, edit, reorder,
> and ship slides in this project — every direction, every field, every rule.
>
> Project: **Riseup Asia LLC** slide-presentation engine (React + Vite, JSON-driven).
> Presenter: **MD ALIM UL KARIM**. Theme: **Noir & Gold** (dark bg `#0D0D0D`,
> gold `#C9A84C`, ember `#E85D3A`, cream `#F0D78C`).
>
> **Canonical one-shot authoring path:** `spec/llm-guideline/00-simplified-single-file-guide.md`.
> Deeper reference packs live in `spec/21-slides-system/llm/` (29 files) and
> `spec/llm-guideline/`. This file is the fast, self-contained path. Read the
> packs only when a step below points you there.

---

## 0. Mental model (read first)

- **Decks are pure JSON.** No code changes are needed to add or edit a slide.
  The React renderer in `src/slides/` reads JSON and draws the slide.
- **Runtime data lives in `front-end/project/<deck>/data/`.** That is what the
   app actually loads. `front-end/project/<deck>/data/slides.json` is the
  **manifest object**: `{ Name, config, Slides: [...] }` (note the capital `S` —
  the loader in `src/slides/loader.ts` reads `raw.Slides`). The `Slides` array is
  the ordered deck — each entry is `{ "title": "03 · …", "path":
  "./slides/NN-name.json" }`. Array order = on-screen slide order (the `path`
  filename number does NOT have to match the position).
- **Spec-first.** Before editing runtime JSON, the intent/spec lives in
  `spec/26-slide-definitions/<deck>/`. JSON is the source of truth at runtime.
- **Keywords-only.** Slides are visual anchors; the presenter narrates. Never
  write paragraphs on a slide. Multiple items become colored capsule labels.
- **Use semantic tokens, never raw hex** in components. In JSON, use the named
  capsule tones (`gold`, `ember`, `cream`, `outline`) — never inline hex.

---

## The 30-step playbook

### A. Orient (steps 1–5)

1. **Identify the deck.** Decks live under `front-end/project/<deck>/`. The
   active session deck is `session-4-ai-coding`. Confirm which deck before any edit.
 2. **Open the manifest.** Read `front-end/project/<deck>/data/slides.json`. It is
    an object `{ Name, config, Slides: [...] }` (capital `S`). The `Slides[]` array is the
    deck order — each item is `{ "title", "path": "./slides/NN-name.json" }`.
    Array position = on-screen slide number.
3. **Read the matching spec folder** `spec/26-slide-definitions/<deck>/` to learn
   the deck's intent, then `spec/26-slide-definitions/<deck>/readme.md`.
4. **Skim the always-apply rules** in `.lovable/memory/index.md` (theme, fonts,
   keywords-only, routing, controller behavior). These are non-negotiable.
5. **Pick the slide type** you need (see step 11). When unsure, use the decision
   tree in `spec/llm-guideline/09-decision-tree.md`.

### B. Understand the schema (steps 6–14)

6. **Every slide JSON file** has this top-level envelope:
   ```json
   {
     "slideNumber": 3,
     "slideName": "build-flow",
     "slideType": "StepTimelineSlide",
     "transition": "SlideIn",
     "textAnimation": "SlideUp",
     "enabled": true,
     "showBrandHeader": true,
     "showPresenterChip": true,
     "titleStyle": "white",
     "titleShimmer": false,
     "sound": { "on": "focus", "kind": "whoosh", "volume": 0.55 },
     "narrowIdea": "One-line plain summary of the slide.",
     "content": { },
     "notes": "Presenter notes — never rendered on the slide."
   }
   ```
 7. **`slideType`** chooses the renderer. The **canonical enum is
    `src/slides/enums.ts` (`SlideType`)**; the render switch is in
    `src/slides/SlideStage.tsx`. Values that actually render:
    `TitleSlide`, `MiddleTitleSlide`, `KeywordSlide`, `CapsuleListSlide`,
    `StepTimelineSlide`, `StepsChain3DSlide`, `FocusTimelineSlide`,
    `AdvanceStepSlide`, `QrMeetingSlide`, `ImageSlide`, `SectionDividerSlide`,
    `MetricGridSlide`, `TableSlide`, `CodeBlockSlide`, `BoxDiagramSlide`,
    `ERDiagramSlide`, `LayoutSlide`, `DatabaseDiagramSlide`, `DataTableSlide`,
    `NumberCalloutSlide`, `EquationSlide`, `ChecklistSlide`, `TileSlide`,
    `BlastRadiusSlide`, `SessionOutlineSlide`, `FullBleedImageSlide`,
    `SplitMediaSlide`, `MediaGridSlide`. An unknown `slideType` falls back
    to `TitleSlide`. (`ClickRevealSlide` is declared in the enum but has **no
    dedicated render case** — it falls back to `TitleSlide`; click-reveal works
    as a behavior on `CapsuleListSlide`/`StepTimelineSlide` items.) For per-type
    `content` schemas beyond the common ones in step 11, see
    `spec/21-slides-system/llm/06-json-authoring-cheatsheet.md` and the `27a–27d`
    type files.
 8. **`transition`** (slide-level enter): `FadeIn`, `SlideIn`, `PushIn`,
    `PushLeft`, `PushRight`, `ZoomOut` (cinematic outro paired with
    `BlastRadiusSlide`). **Vary them across the deck** — never the same one twice in a row.
9. **`textAnimation`** (text reveal): `Bounce`, `FadeIn`, `SlideUp`, `Stagger`.
   Also vary these. Both respect `prefers-reduced-motion` automatically.
10. **`titleStyle`** is `white` | `gold` | `cream`. `titleShimmer` adds a sweep.
    `sound.on` is the trigger (`focus`/`reveal`), `kind` is the cue
    (`whoosh`/`chime`/etc.), `volume` is 0–1.
11. **`content` uses ONE unified `SlideContent` interface** (`src/slides/types.ts`,
    `interface SlideContent`). All fields optional; each `slideType` reads the
    subset it needs:
    - `TitleSlide` / `MiddleTitleSlide` / `SectionDividerSlide`: `{ eyebrow?, title, subtitle? }`
    - `KeywordSlide`: `{ eyebrow?, title, keywords?: string[] }` (array, not `keyword`)
    - `CapsuleListSlide`: `{ eyebrow?, title, capsules?: [{ text, color }] }`
    - `StepTimelineSlide` / `FocusTimelineSlide` / `AdvanceStepSlide` / `StepsChain3DSlide`: `{ eyebrow?, title, steps?: [...] }` (see step 12)
    - `ImageSlide`: `{ eyebrow?, title?, image, caption? }`
    - `QrMeetingSlide`: `{ eyebrow?, title, capsules? }` (meeting URL/QR come from `config.meeting`)
    - `SessionOutlineSlide`: `{ eyebrow?, title, items?: [...], activeIndex? }`
    - `FullBleedImageSlide`: `{ eyebrow?, title?, subtitle?, image, scrim? }` (edge-to-edge hero + scrim)
    - `SplitMediaSlide`: `{ eyebrow?, title, image, mediaSide?: 'left'|'right', keywords?, capsules? }`
    - `MediaGridSlide`: `{ eyebrow?, title, mediaTiles: [{ src, caption? }] }` (2–6 tiles)
    - Diagram/table/code/metric types (`TableSlide`, `CodeBlockSlide`, `MetricGridSlide`, `LayoutSlide`, etc.) have richer `content` fields — see `spec/21-slides-system/llm/06-json-authoring-cheatsheet.md` + `27a–27d`.
12. **Step object (StepTimelineSlide):**
    ```json
    {
      "label": "Step 1",
      "title": "Pick the task",
      "subtitle": "One CLI, one clear outcome",
      "description": "1–2 short sentences shown in the detail panel.",
      "image": "/assets/<deck>/step-1.gif",
      "imageRole": "inlineThumbnail",
      "capsule": { "text": "Scope", "color": "gold" }
    }
    ```
    Images live under `public/assets/<deck>/` and are referenced from `/assets/...`.
13. **Capsule tones (must match a `.capsule-{tone}` class in `src/index.css`):**
    `gold`, `ember`, `cream`, `ink`, `outline`, `violet`, `teal`, `rose`, `sky`.
    Use `meta` (`.capsule-meta`) for time/duration tags. Prefer `gold`/`ember`/
    `cream`/`outline` for brand-primary chips. **Never inline a hex color or
    `style.background`** — light themes repurpose brand tokens and inline chips
    collapse to dark-on-dark; the `.capsule-{tone}` classes auto-flip per theme.
14. **`enabled: false`** hides a slide without deleting it. `narrowIdea` is the
    plain-English anchor; `notes` are presenter-only.

### C. Author / edit (steps 15–22)

15. **To add a slide:** create `data/slides/NN-name.json` using the envelope
     above, then add a `{ "title", "path": "./slides/NN-name.json" }` entry to the
    `Slides[]` array in `data/slides.json` at the desired index.
16. **To reorder slides:** reorder the entries in the `Slides[]` array in
    `data/slides.json` only. Array position is the slide number; you do **not**
    rename files (the `path` filename number can differ from the position).
    Shifting an item forward pushes every later slide down by one automatically.
17. **To edit content:** change the `content` block of the target file. Keep text
    to keywords/short lines — split long ideas into multiple capsules or steps.
18. **Match the deck theme.** Use Noir & Gold tokens. Titles use Ubuntu Bold,
    body uses Inter — these come from the renderer; you only choose `titleStyle`.
19. **Add media** by dropping files in `public/assets/<deck>/` and referencing
    `/assets/<deck>/<file>`. GIFs are fine for step demos (`imageRole:
    "inlineThumbnail"`).
20. **Keep variety.** Across the deck, alternate `transition` and `textAnimation`
    so no two consecutive slides animate identically.
21. **Write/refresh the spec** in `spec/26-slide-definitions/<deck>/NN-name.md`
    (intent) and `.json` (mirror) so the spec and runtime stay in sync.
22. **Never add Lovable branding** (logo, favicon, og/meta) anywhere.

### D. Verify & ship (steps 23–30)

23. **Validate JSON** — no trailing commas, valid `slideType`, every
    `data/slides.json` reference resolves to a real file.
24. **Check the manifest count** matches the number of files you intend to show
    (`enabled: true`). The on-screen `N/total` comes from this array.
25. **Confirm capsule tones** are from the allowed set only (step 13).
26. **Confirm required `content` fields** exist for the chosen `slideType` (step 11).
27. **Open the preview** and load the deck. Routing is flat: `/N` opens slide N
    (e.g. `/3`). Confirm the slide renders, numbers show, and nav buttons work.
28. **Test navigation** — pagination dots, prev/next, and direct `/N` deep links.
29. **Run the project checks** if you changed code (the harness builds/typechecks
    automatically; for JSON-only edits a preview check is enough).
30. **Record the change** in `updates/spec/` (what/why/files/verify) and, for new
    rules or decisions, update `.lovable/memory/`.

---

## Quick reference card

| Need | Where |
|---|---|
| Add/reorder slides | `front-end/project/<deck>/data/slides.json` |
| Edit one slide | `front-end/project/<deck>/data/slides/NN-name.json` |
| Slide intent/spec | `spec/26-slide-definitions/<deck>/` |
| Deep field reference | `spec/21-slides-system/llm/06-json-authoring-cheatsheet.md` |
| Add a brand-new slide type | `spec/21-slides-system/llm/22-add-new-slide-type.md` |
| Acceptance checklist | `spec/21-slides-system/llm/18-acceptance-checklist.md` |
| Do / don't | `spec/21-slides-system/llm/17-do-and-dont.md` |
| Decision tree | `spec/llm-guideline/09-decision-tree.md` |
| Back up / share a full deck (ZIP) | `src/slides/zipBundle.ts` — see below |

### Full-deck ZIP bundle (backup & transfer)

The Import/Export controller menu can package an entire deck as a single
`.zip`. Use it to move a deck (with its themes) between environments.

- **Export:** `exportBundleZip()` writes `riseup-bundle-<slug>-<date>.zip`
  containing `deck.json` (manifest via `buildManifest`), `themes.json`
  (custom themes via `buildThemeBundle`), and a `bundle.json` index.
- **Import:** `importBundleFile(file)` unzips, validates **both** documents
  (`parseManifest` + `parseThemeBundle`) before any write, installs themes,
  persists the manifest to `riseup.deck.imported.v1`, then reloads. A bad
  archive throws before touching storage — never a partial import.

### Visual export formats (`src/slides/export.ts`)

The Share menu can render the deck to print/image formats — independent of
the JSON bundle above. Formats live in `EXPORT_FORMATS`:

- **PDF (RGB)** / **PDF (CMYK-safe)** — combined output, one A4-landscape
  slide per page via the `/handout?print=1` route + `window.print()`
  (CMYK adds a gamut-approximating desaturation filter). No heavy deps.
- **SVG / PNG / JPG** — per-slide output at 1920×1080.
- Single slide: `exportSlidePdf(slideNumber, { cmyk? })` opens
  `/handout?slide=N` and auto-prints; it **throws** on an invalid slide
  number so the caller surfaces the failure instead of a blank tab.

### Persistence model (localStorage keys that matter)

Edits and overrides live in `localStorage`, not files. The four keys an
author/agent must know:

- `riseup.deck.draft.v1` (`DRAFT_DECK_KEY`, `src/builder/draftDeck.ts`) — the
  Builder's working deck; `useDraftDeck()` reads it on mount.
- `riseup.deck.imported.v1` (`IMPORTED_MANIFEST_KEY`, `src/slides/loader.ts`) —
  a ZIP/JSON-imported manifest; the loader prefers it over bundled data.
- `riseup.themes.custom.v1` (`CUSTOM_THEMES_STORAGE_KEY`,
  `src/slides/themeManifest.ts`) — imported custom themes.
- `riseup.theme.byDeck.v1` (`STORAGE_KEY_BY_DECK`, `src/slides/themes.ts`) —
  per-deck theme pin (slug→id); restores a deck's last theme on reopen.

Clearing these resets to the file-based deck/theme defaults.



## Golden rules (do not break)

1. Keywords only — never paragraphs on a slide.
2. Capsules use a `.capsule-{tone}` class (`gold`/`ember`/`cream`/`ink`/`outline`/`violet`/`teal`/`rose`/`sky`, `meta` for tags) — never inline hex.
3. Reorder via `slides.json` array order, not file renames.
4. Vary `transition` and `textAnimation` across the deck.
5. Use Noir & Gold theme tokens; titles Ubuntu Bold, body Inter.
6. No Lovable branding anywhere.
7. JSON is the runtime source of truth — keep the spec mirror in sync.
8. Respect `prefers-reduced-motion` (the renderer handles it; don't force motion).

---

## One-shot export & import (the whole deck in ONE file)

You do **not** have to ship a deck as many small files. The runtime can load,
and the in-app Import/Export menu can produce, a **single self-contained JSON
document** — the **deck manifest** — that carries the deck config + every
slide inlined, in order.

**Shape** (`src/slides/manifest.ts`):

```jsonc
{
  "manifestVersion": 2,
  "exportedAt": "2026-06-06T00:00:00Z",
  "source": "showcase",
  "deck":   { /* deck meta; deck.theme = palette id */ },
  "slides": [ { /* slide 1 */ }, { /* slide 2 */ }, … ]  // ALL slides, in display order
}
```

When asked to "create the deck", prefer emitting **one manifest file** with
every slide inlined rather than dozens of `NN-name.json` files. Import it via
the controller → **Import / Export** → **Import JSON (all/deck)**; the app
validates it, stores it under `localStorage["riseup.deck.imported.v1"]`, and
reloads. Disabled slides survive, so the round-trip is lossless.

If the task is specifically to edit the repository's checked-in runtime deck
files, then switch to the repo-maintenance mode described earlier in this file:
`front-end/project/<deck>/data/slides.json` plus one `slides/NN-name.json` file
per slide. Deliverable default = one manifest; repo-edit mode = many files.

### Images in a one-file deck

Slide image slots (`content.image`, `content.images[]`, `steps[].image`)
accept four forms: an asset path, **inline `<svg>` markup**, a **Base64
`data:` URI**, or an http(s) URL. For a truly portable single file, embed
images as **Base64 data URIs or inline SVG** so nothing depends on the
destination project's `public/` tree.

- Authoring by hand → put the `data:image/...;base64,…` string (or `<svg…>`)
  directly in the `image` field. See `front-end/project/image-examples/`.
- Exporting an existing deck → use **Import / Export → Export JSON (all,
  images embedded)**. It fetches every path-referenced image and rewrites it
  as Base64 in place, producing one fully self-contained file
  (`src/slides/inlineImages.ts`).

### Other export formats (same menu)

`Export deck to PDF` · `Export current slide to PDF` · `Export deck to PPTX`
(native editable PowerPoint) · `Export ZIP (deck + themes)` for slides plus
custom palettes in one archive.

For palettes, see the companion **[theme creation guide](spec/llm-guideline/10-theme-creation.md)**.

