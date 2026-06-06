# Slide-only downloadable LLM guide + write-to-filesystem default

**Slug:** slide-only-download-guide-and-fs-write
**Steps:** 8
**Status:** completed
**Created:** 2026-06-06

## Context
The downloadable LLM guide currently mixes broad "how to work" process content
with slide-authoring content. The user wants the DOWNLOAD to be slide-only
(JSON shape, slide types, single-vs-multi output, image/SVG/base64 embedding),
the broader process content moved into a project memory file, and an explicit
default instruction telling the AI to write its JSON output to the filesystem
(`.lovable/` when no other direction exists).
Files: `src/slides/llmGuideBundle.ts`, `spec/llm-guideline/00-simplified-single-file-guide.md`,
`LLM.md`, `.lovable/memory/features/llm-md-shareable-guide.md`, `.lovable/memory/index.md`.
Captured command: `.lovable/spec/commands/05-downloaded-guide-slide-only-and-write-to-fs.md`.

## Steps
1. Audit `buildLlmGuideMarkdown` in `src/slides/llmGuideBundle.ts` and list every section it emits; mark each as slide-authoring (keep) vs process/workflow (remove from download).
2. Rewrite the bundle so the DOWNLOAD includes only slide-authoring sections: theme tokens, slide JSON schema, catalog enums, the simplified single-file guide, image embedding rules — drop the root `LLM.md` fast-path and the process-oriented `spec/llm-guideline/` packs from the download.
3. Add a prominent "write to filesystem first" instruction near the top of the downloaded guide: AI must save output JSON to disk, defaulting to `.lovable/` when no other memory/output location is specified.
4. Ensure `spec/llm-guideline/00-simplified-single-file-guide.md` fully and clearly covers: JSON envelope, all slide types, single-slide vs multi-slide-in-one-JSON output, and image/SVG/base64 embedding — tighten any thin sections.
5. Move the broader "how to work / process" content (currently fast-path/process prose) into a project memory file under `.lovable/memory/features/` and remove it from the download path.
6. Update `.lovable/memory/features/llm-md-shareable-guide.md` and `.lovable/memory/index.md` so they reflect: download = slide-only, process = memory.
7. Reconcile `LLM.md` and `readme.md` cross-links so they point to the correct split (slide-only download vs process memory) with no contradictory "everything bundled" wording.
8. Verify: build green, `buildLlmGuideMarkdown` output contains no process/workflow sections (grep), contains the filesystem-write instruction, and covers all slide types; bump version + changelog and save next prompt snapshot.

## Verification
Grep the generated bundle string for removed process headings (absent) and the
filesystem-write instruction (present); confirm every `slideType` enum value
appears in the simplified guide; `bunx vitest` green; preview download produces
slide-only markdown.

## Appended from prior pending tasks
none (`.lovable/plans/pending/` was empty before this plan)
