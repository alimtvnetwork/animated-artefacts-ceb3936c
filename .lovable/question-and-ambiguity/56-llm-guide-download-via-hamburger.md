---
title: LLM guide download via hamburger
status: implemented
window: 2 (2026-05-01 → ongoing)
---

# 56 — LLM guide download via hamburger

**User ask:** add an "LLM guide" item to the controller hamburger that
downloads a single Markdown file containing the active theme + every
authoring spec, so it can be pasted into any LLM to author new slides
for this deck.

**Implementation:**

- New memory `mem://features/llm-guide-download` documents the contract
  (file order: preamble → theme tokens → schema → catalog → 28-file LLM
  pack → authoring footer; download filename pattern; forbidden
  inclusions).
- New module `src/slides/llmGuideBundle.ts` exposes
  `buildLlmGuideMarkdown()`, `downloadLlmGuide()`,
  `copyLlmGuideToClipboard()`. Uses Vite `import.meta.glob` with `?raw`
  on `../../spec/21-slides-system/llm/*.md`,
  `../../spec/21-slides-system/slide.schema.json`, and
  `../../spec/21-slides-system/llm/CATALOG.json` so the bundle stays in
  lockstep with the source specs (no copy-paste).
- Active theme detected from `<html data-theme>`, looked up in
  `THEMES`, serialized as JSON + a human-readable palette summary at
  the top of the bundle.
- `ControllerHamburger` gains an "Import / Export" group between Step
  motion and Debug, with two items: Download LLM guide (.md) and Copy
  LLM guide. Sonner toast confirms success/failure.

**Ambiguities resolved silently (no-questions mode):**

- _Scope of "import/export"._ User said the guide enables import/export
  via prose. Implemented as **export of the authoring contract** (theme
  + schema + specs), not a dump of the user's actual deck JSON — the
  privacy line in the memory makes this explicit.
- _Which spec files to bundle._ Restricted to the canonical
  `spec/21-slides-system/llm/` pack + schema + catalog. Excluded
  `15-research/`, `22-slides-issues/`, `26-slide-definitions/` (project
  history, not contract). Documented as forbidden in memory.
- _Where in the menu._ Placed after Step motion, before Debug — keeps
  presenter-runtime affordances (Overview/Presenter/Reveal/Transition)
  grouped at the top, debug at the bottom.
