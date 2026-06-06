# Simplified single-file LLM slide-authoring guide (all slide-type samples)

**Slug:** simplified-single-file-llm-slide-guide
**Steps:** 10
**Status:** completed
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
3. ✅ DONE (v1.41.0) — Guide located at `spec/llm-guideline/00-simplified-single-file-guide.md`; indexed as item 0 ("start here to author") in `spec/llm-guideline/readme.md`.
4. ✅ DONE (v1.40.0) — Intro/mental model + non-negotiable one-manifest rule in §1–2.
5. ✅ DONE (v1.41.0) — "Choosing a slide type" intent→type table in §5.
6. ✅ DONE (v1.41.0) — Per-type sections in §4: why/when + how-it-displays + copy-paste JSON sample for the 18 core types; 8 specialist types pointer-linked to `23-slide-type-contracts.md`.
7. ✅ DONE (v1.42.0) — Added an end-to-end 2-slide worked manifest in `spec/llm-guideline/00-simplified-single-file-guide.md` §6, including one embedded inline SVG image so the one-file deck shape is copy-pasteable.
8. ✅ DONE (v1.42.0) — Added legal enum lists + adjacent-slide variety rules in `00-simplified-single-file-guide.md` §7 for `transition`, `textAnimation`, and capsule tones; raw hex remains forbidden.
9. ✅ DONE (v1.42.0) — Updated `src/slides/llmGuideBundle.ts` so the exported bundle now defaults to one manifest JSON, and cross-linked the simplified guide from `LLM.md` and `readme.md`.
10. ✅ DONE (v1.42.0) — Updated `.lovable/memory/features/llm-md-shareable-guide.md` + `.lovable/memory/index.md` so the simplified guide is canonical for one-shot authoring, and verified the contradictory bundle wording is gone.

## Verification
Each step lands as a concrete doc/code edit: the new guide file exists with a
section for every enum value (grep enum vs guide headings), the manifest
skeleton imports cleanly via the existing Import/Export path, the LLM bundle
(`buildLlmGuideMarkdown`) includes the new file, and `LLM.md`/`readme.md` link
to it. Build stays green; no runtime behavior changes.

## Resolution

Completed in v1.42.0. Root cause was doc/bundle drift: the simplified guide and
manifest import contract were already single-file-first, but the exported LLM
bundle still instructed models to emit one JSON file per slide.

## Appended from prior pending tasks
none (`.lovable/plans/pending/` was empty; completed plans 01 and 02 are done)
