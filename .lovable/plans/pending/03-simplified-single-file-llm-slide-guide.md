# Simplified single-file LLM slide-authoring guide (all slide-type samples)

**Slug:** simplified-single-file-llm-slide-guide
**Steps:** 10
**Status:** pending
**Created:** 2026-06-06

## Context
The deep `spec/llm-guideline/**` pack and root `LLM.md` are correct as the
`.lovable`/memory-grade "how to work" reference, but they do not clearly
enforce single-file (one manifest JSON) authoring, and they lack a single
place with a worked JSON sample for every slide type plus why/when/how-it-
displays notes. Create a NEW simplified guide whose only job is: one-shot
single-file deck authoring + a sample for every `SlideType`, so any LLM can
read one document and emit valid JSON slides.

Files involved: new `spec/llm-guideline/00-simplified-single-file-guide.md`
(or `LLM-SIMPLE.md` at root), `LLM.md`, `spec/llm-guideline/readme.md`,
`readme.md`, `src/slides/llmGuideBundle.ts` (bundler include),
`src/slides/types.ts` + `spec/21-slides-system/llm/23-slide-type-contracts.md`
(enum source of truth), `src/slides/inlineImages.ts`,
`spec/21-slides-system/06-deck-manifest.md`.

Captured command: `.lovable/spec/commands/04-single-file-slide-authoring.md`.

## Steps
1. ✅ DONE (v1.40.0) — Inventoried the authoritative `SlideType` enum from `src/slides/enums.ts` (28 types) and reconciled it against `CATALOG.json` + `front-end/project/*/data/slides/*.json`; canonical list captured in `spec/llm-guideline/00-simplified-single-file-guide.md` §3. See ./subtasks/03-simplified-single-file-llm-slide-guide/01-slide-type-sample-coverage.md
2. ✅ DONE (v1.40.0) — Single-file manifest contract (envelope + inlined slides + Base64/SVG image embedding rule) written in `00-simplified-single-file-guide.md` §2, mirroring the real runtime envelope. See ./subtasks/03-simplified-single-file-llm-slide-guide/02-single-file-manifest-contract.md
3. Decide the new guide's location and name (`spec/llm-guideline/00-simplified-single-file-guide.md`, optionally surfaced as root `LLM-SIMPLE.md`) and add it to the `spec/llm-guideline/readme.md` index.
4. Write the guide's intro: mental model + the non-negotiable rule that the AI returns ONE manifest JSON (all slides inlined, images embedded), never a multi-file split.
5. Write the "choosing a slide type" decision section: a compact table mapping intent → slide type, so the AI picks correctly before authoring.
6. Write one section per slide type, each containing: why/when to use it, how it displays (layout, density cap, motion defaults), and a copy-pasteable schema-valid JSON sample wrapped as a `slides[]` entry.
7. Add the end-to-end worked example: a complete minimal 2-slide manifest (title + one content slide) with one embedded image, demonstrating the full single-file shape.
8. Add the capsule-tone + enum-only rule (no raw hex, `.capsule-{tone}`) and the variety rule for transitions/textAnimation, with the legal value lists pulled from `CATALOG.json`.
9. Wire the new file into `src/slides/llmGuideBundle.ts` so the downloadable/clipboard LLM bundle includes it, and cross-link it from `LLM.md` top and root `readme.md`.
10. Add a verification note + memory update: record that the simplified single-file guide is canonical for one-shot authoring (memory `mem://features/llm-md-shareable-guide` or a new feature memory), and list any leftover ambiguities for the user.

## Verification
Each step lands as a concrete doc/code edit: the new guide file exists with a
section for every enum value (grep enum vs guide headings), the manifest
skeleton imports cleanly via the existing Import/Export path, the LLM bundle
(`buildLlmGuideMarkdown`) includes the new file, and `LLM.md`/`readme.md` link
to it. Build stays green; no runtime behavior changes.

## Appended from prior pending tasks
none (`.lovable/plans/pending/` was empty; completed plans 01 and 02 are done)
