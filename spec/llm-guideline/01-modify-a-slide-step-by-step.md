# 01 — Modify a slide, step by step

A procedure any AI can follow **blindly**. Do the steps in order. Each step says
exactly what to do and where to look. Do not skip validation steps.

---

## Phase A — Locate the slide (steps 1-6)

**Step 1.** Identify the **deck** the user is talking about. Decks live at
`front-end/project/<deck-slug>/`. If the user did not name one, list
`front-end/project/` and ask or infer from context.

**Step 2.** Open the deck manifest: `front-end/project/<deck>/data/slides.json`.
It contains deck `config` plus an ordered `slides` array of file stems
(`"01-title"`, `"02-capabilities"`, …). This is the playback order.

**Step 3.** Identify the **target slide**. The user usually refers to it by its
on-screen number — that maps to the URL route `/N` and to `slideNumber` inside
the JSON. Find the matching entry in the `slides` array.

**Step 4.** Open the slide file: `front-end/project/<deck>/data/slides/NN-name.json`.
This single file is the **runtime source of truth** for that slide.

**Step 5.** Read the whole file before editing. Note its `slideType` — the legal
shape of `content` depends entirely on it.

**Step 6.** If you do not recognise the `slideType`, open
[`spec/21-slides-system/llm/23-slide-type-contracts.md`](../21-slides-system/llm/23-slide-type-contracts.md)
and find that type's `content` contract. Do NOT guess field names.

---

## Phase B — Understand the structure (steps 7-12)

**Step 7.** Every slide has two layers:
- **Top-level flags** — identity + behavior (`slideNumber`, `slideType`,
  `transition`, `textAnimation`, `titleStyle`, `showBrandHeader`, …).
- **`content` object** — the slide-type-specific payload (the words, capsules,
  steps, image, etc.).

**Step 8.** For the meaning of any top-level flag, read
[`spec/21-slides-system/00-fundamentals.md`](../21-slides-system/00-fundamentals.md)
§1. For legal enum values, read
[`spec/21-slides-system/llm/CATALOG.json`](../21-slides-system/llm/CATALOG.json).

**Step 9.** Note the **header contract**: `showBrandHeader` renders the Riseup
Asia logo (top-left), `showPresenterChip` renders the presenter pill (top-right).
The body reserves `pt-32 pb-20` so content never collides with the header.

**Step 10.** Note the **title contract**: titles auto-scale with `clamp()`. You
choose *style* (`cream`/`white`/`gold`/`gradient`) and *shimmer*, NOT a fixed
pixel size. Never hard-code a title font size in JSON.

**Step 11.** Note the **content density budget**: a 1920×1080 slide holds far
less than a webpage. Keep ≤4-6 keywords / capsules / steps. If it overflows,
split into another slide — do not shrink everything.

**Step 12.** Note **capsule color tokens**: `gold`, `ember`, `cream`, `ink`,
`outline`, `violet`. Always use these names — never an inline hex value, because
hex breaks on light themes.

---

## Phase C — Make the edit (steps 13-22)

**Step 13.** Make the **smallest possible change** that satisfies the request.
Change text in `content`, not behavior flags, unless the user asked for behavior.

**Step 14.** **Change wording** → edit the string fields in `content`
(`title`, `subtitle`, `eyebrow`, `keywords[]`, capsule `text`, step `title` /
`description`). Use `\n` for an intentional line break in a title.

**Step 15.** **Make the title bigger / more prominent** → do NOT add a pixel
size. Instead set `"titleStyle": "white"` (max contrast) or `"gold"`, and/or
`"titleShimmer": true`. For genuinely larger type, promote to a slide type that
renders a hero title (`TitleSlide` / `MiddleTitleSlide`). See
[`02-layout-recipes.md`](./02-layout-recipes.md) §"Bigger text".

**Step 16.** **Center an item** → centering is owned by the slide-type renderer,
not by a free-form position field. Use the type that centers by default
(`TitleSlide`, `MiddleTitleSlide`, `KeywordSlide` all center their content). See
[`02-layout-recipes.md`](./02-layout-recipes.md) §"Centering". Do NOT invent
`x`/`y`/`align` fields that the schema does not define.

**Step 17.** **Change the header** → toggle `showBrandHeader` / `showPresenterChip`
(true/false). Some types (`AdvanceStepSlide`) paint their own header — for those
set `showBrandHeader: false` to avoid two stacked logos (see cheatsheet §7).

**Step 18.** **Add / edit a capsule** → append to `content.capsules[]`:
`{ "text": "Growth", "color": "ember" }`. Add `"clickRevealSlide": N` to make it
open a hidden detail slide. Keep ≤6 capsules.

**Step 19.** **Add / edit a step** → append to `content.steps[]` following the
step contract (`label`, `title`, `subtitle`, `description`, `capsule`). Read
[`spec/21-slides-system/llm/02-step-system-complete.md`](../21-slides-system/llm/02-step-system-complete.md)
before editing a step slide.

**Step 20.** **Change the entrance feel** → set `transition`
(`FadeIn`/`SlideIn`/`PushIn`/`PushLeft`/`PushRight`) and `textAnimation`
(`FadeIn`/`Bounce`/`SlideUp`/`Stagger`). Pick variety across the deck.

**Step 21.** **Reorder or add a slide** → edit the `slides` array in
`slides.json` AND keep `slideNumber` unique. To mute without deleting, set
`"enabled": false` on the slide.

**Step 22.** **Edit speaker notes** → the audience-facing slide is the `.json`;
narration goes in the `notes` string (or the sibling `.md`, which is never
rendered). Never put narration paragraphs into visible `content`.

---

## Phase D — Validate (steps 23-30)

**Step 23.** Re-read your edited JSON top to bottom. Confirm it is still valid
JSON (no trailing commas, quotes balanced).

**Step 24.** Confirm every field you used exists in the schema
[`spec/21-slides-system/slide.schema.json`](../21-slides-system/slide.schema.json).
If you invented a field, remove it.

**Step 25.** Confirm enum values are legal (cross-check
[`CATALOG.json`](../21-slides-system/llm/CATALOG.json)). A typo'd enum fails at
load.

**Step 26.** Confirm no inline hex colors slipped into JSON — use token names.

**Step 27.** Confirm `slideNumber` is still unique and the `slides.json` array
still references the file stem correctly.

**Step 28.** Run the test suite: `bun run test`. Schema + contract + spec-parity
tests must stay green.

**Step 29.** Visually verify in the preview at route `/N` (the slide number).
Check the title does not overflow, capsules wrap cleanly, and nothing collides
with the header/footer.

**Step 30.** If you changed system behavior (not just one deck's content),
record the delta in `updates/spec/NN-short-title.md` and, if durable, in
`.lovable/memory/`. For pure content edits, no spec change is needed.

---

### Quick map: "the user said X" → which step

| User says | Go to |
|---|---|
| "change this text / heading" | Step 14 |
| "make it bigger / bolder" | Step 15 |
| "center it" | Step 16 |
| "remove/add the logo or presenter chip" | Step 17 |
| "add a tag / chip / button" | Step 18 |
| "add a step / change the timeline" | Step 19 |
| "make it animate differently" | Step 20 |
| "reorder / hide / add a slide" | Step 21 |
| "add a note for the speaker" | Step 22 |
