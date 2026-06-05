# LLM.md — How any LLM creates slides for this deck

> **Single source of truth for AI agents.** Hand this one file to any LLM
> (Claude, GPT, Gemini, etc.) and it will know how to author, edit, reorder,
> and ship slides in this project — every direction, every field, every rule.
>
> Project: **Riseup Asia LLC** slide-presentation engine (React + Vite, JSON-driven).
> Presenter: **MD ALIM UL KARIM**. Theme: **Noir & Gold** (dark bg `#0D0D0D`,
> gold `#C9A84C`, ember `#E85D3A`, cream `#F0D78C`).
>
> Deeper reference packs live in `spec/21-slides-system/llm/` (29 files) and
> `spec/llm-guideline/`. This file is the fast, self-contained path. Read the
> packs only when a step below points you there.

---

## 0. Mental model (read first)

- **Decks are pure JSON.** No code changes are needed to add or edit a slide.
  The React renderer in `src/slides/` reads JSON and draws the slide.
- **Runtime data lives in `front-end/project/<deck>/data/`.** That is what the
  app actually loads. `front-end/project/<deck>/data/slides.json` is the
  ordered manifest; each entry points to one file in `data/slides/NN-name.json`.
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
   an ordered array; index position = on-screen slide order. Each item references
   a file in `data/slides/`.
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
 7. **`slideType`** chooses the renderer. The **authoritative list is the switch
    in `src/slides/SlideStage.tsx`** (source of truth). Registered values:
    `TitleSlide`, `MiddleTitleSlide`, `KeywordSlide`, `CapsuleListSlide`,
    `StepTimelineSlide`, `StepsChain3DSlide`, `FocusTimelineSlide`,
    `AdvanceStepSlide`, `QrMeetingSlide`, `ImageSlide`, `SectionDividerSlide`,
    `MetricGridSlide`, `TableSlide`, `CodeBlockSlide`, `BoxDiagramSlide`,
    `ERDiagramSlide`, `LayoutSlide`, `DatabaseDiagramSlide`, `DataTableSlide`,
    `NumberCalloutSlide`, `EquationSlide`, `ChecklistSlide`, `TileSlide`,
    `BlastRadiusSlide`, `SessionOutlineSlide`. An unknown `slideType` falls back
    to `TitleSlide`. (Click-reveal is **not** a slideType — it's a behavior on
    `CapsuleListSlide`/`StepTimelineSlide` items; see the pack.) For per-type
    `content` schemas beyond the common ones in step 11, see
    `spec/21-slides-system/llm/06-json-authoring-cheatsheet.md` and the `27a–27d`
    type files.
8. **`transition`** (slide-level enter): `FadeIn`, `SlideIn`, `PushIn`,
   `PushLeft`, `PushRight`. **Vary them across the deck** — never the same one twice in a row.
9. **`textAnimation`** (text reveal): `Bounce`, `FadeIn`, `SlideUp`, `Stagger`.
   Also vary these. Both respect `prefers-reduced-motion` automatically.
10. **`titleStyle`** is `white` | `gold` | `cream`. `titleShimmer` adds a sweep.
    `sound.on` is the trigger (`focus`/`reveal`), `kind` is the cue
    (`whoosh`/`chime`/etc.), `volume` is 0–1.
11. **`content` shape depends on `slideType`:**
    - `TitleSlide`: `{ eyebrow, title, subtitle }`
    - `KeywordSlide`: `{ eyebrow, title, keyword }`
    - `CapsuleListSlide`: `{ eyebrow, title, capsules: [{ text, color }] }`
    - `StepTimelineSlide`: `{ eyebrow, title, steps: [...] }` (see step 12)
    - `ImageSlide`: `{ eyebrow, title, image, caption }`
    - `QrMeetingSlide`: `{ eyebrow, title, url, capsules? }`
    - `SectionDividerSlide`: `{ eyebrow, title }`
    - `SessionOutlineSlide`: `{ eyebrow, title, items: [...] }`
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
    above, then add a reference to it in `data/slides.json` at the desired index.
16. **To reorder slides:** reorder the entries in `data/slides.json` only. The
    array position is the slide number; you do **not** rename files. Shifting an
    item forward pushes every later slide down by one automatically.
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

## Golden rules (do not break)

1. Keywords only — never paragraphs on a slide.
2. Capsules use a `.capsule-{tone}` class (`gold`/`ember`/`cream`/`ink`/`outline`/`violet`/`teal`/`rose`/`sky`, `meta` for tags) — never inline hex.
3. Reorder via `slides.json` array order, not file renames.
4. Vary `transition` and `textAnimation` across the deck.
5. Use Noir & Gold theme tokens; titles Ubuntu Bold, body Inter.
6. No Lovable branding anywhere.
7. JSON is the runtime source of truth — keep the spec mirror in sync.
8. Respect `prefers-reduced-motion` (the renderer handles it; don't force motion).
