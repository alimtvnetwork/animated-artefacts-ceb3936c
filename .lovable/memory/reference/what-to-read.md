---
name: what-to-read
description: Reading order for an amnesiac AI — folder structure, slide JSON structure/schema, and how to author a new slide. Mirrors the root README "For AI agents" section.
type: reference
---

# What to read (AI onboarding map)

If you are an AI agent resuming this repo with **zero context**, read these
files **in order**. Mirror of the root [`README.md`](../../../README.md)
"🤖 For AI agents — what to read & how JSON works" section. Keep both in sync.

## 1. Orient — folder structure

- `spec/README.md` — canonical spec layout; which numbered folder owns what.
- `spec/21-slides-system/README.md` — slide-engine system docs (how slides behave).
- `spec/21-slides-system/llm/00-README.md` — entry point to the AI authoring pack.
- `.lovable/memory/index.md` — project-wide rules to apply EVERY loop.

Folders that matter:

```
spec/21-slides-system/          HOW the engine works (system design + schemas + LLM pack)
  00-fundamentals.md            per-slide JSON fields + layout contract — start here
  slide.schema.json             JSON Schema (draft-07) for ONE slide
  deck.schema.json              JSON Schema for a deck manifest
  llm/                          the AI authoring pack
spec/26-slide-definitions/      WHAT specific decks contain (per-deck JSON + MD)
front-end/project/<deck>/data/  the LIVE decks the app loads at runtime
  slides.json                   deck manifest (config + ordered slide list)
  slides/NN-name.json           one slide per file — RUNTIME SOURCE OF TRUTH
front-end/slide-template/       copy-me starter JSON, one per slideType
src/slides/                     React renderer (loader.ts, contracts.ts, themes.ts)
```

## 2. Learn the JSON — structure, fields, contracts

- `spec/21-slides-system/00-fundamentals.md` — every top-level slide field
  (`slideNumber`, `slideType`, `transition`, `enabled`, `titleStyle`, …).
- `spec/21-slides-system/slide.schema.json` — shape of a single slide.
- `spec/21-slides-system/deck.schema.json` — shape of a deck manifest.
- `spec/21-slides-system/llm/06-json-authoring-cheatsheet.md` — every field + preset.
- `spec/21-slides-system/llm/23-slide-type-contracts.md` — required/optional
  `content` fields per slideType.
- `spec/21-slides-system/llm/25-json-vs-md-contract.md` — JSON (runtime) vs MD (humans/AI).
- `spec/21-slides-system/llm/CATALOG.json` — machine-readable catalog.
- Code: `src/slides/contracts.ts` (zod) + `src/slides/loader.ts` (loads JSON).

## 3. Create a new slide — the loop

- `spec/21-slides-system/llm/15-authoring-template.md`
- `spec/21-slides-system/llm/16-voice-to-slide-protocol.md`
- `spec/21-slides-system/llm/22-add-new-slide-type.md`
- `spec/21-slides-system/llm/17-do-and-dont.md`
- `spec/21-slides-system/llm/18-acceptance-checklist.md`

Six steps:

1. Pick a slideType from the contracts doc.
2. Copy the starter from `front-end/slide-template/` into
   `front-end/project/<deck>/data/slides/NN-name.json`.
3. Fill `content` per its contract — keyword-only.
4. Add sibling `NN-name.md` with presenter notes (never read at runtime).
5. Register in `front-end/project/<deck>/data/slides.json`.
6. Save → Vite hot-reloads → validate against `slide.schema.json` + `bun run test`.
