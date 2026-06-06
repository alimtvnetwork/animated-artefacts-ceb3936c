---
name: LLM.md single shareable guide
description: Root LLM.md is the one self-contained 30-step guide for any LLM to author/edit/reorder/ship slides; hand it out standalone
type: reference
---

# LLM.md — single shareable authoring guide

**Location:** `/LLM.md` (repo root). Linked from the top of `readme.md`.

**Purpose:** One self-contained file the user can hand to any LLM (Claude, GPT,
Gemini) so it can create/edit/reorder/ship slides without reading anything else.
Contains: mental model, full slide JSON envelope, all `slideType`/`transition`/
`textAnimation` values, capsule-tone rules, a 30-step playbook (orient → schema →
author → verify/ship), quick-reference table, and 8 golden rules.

**Relationship to existing packs:** `LLM.md` is still the shareable root fast
path, but **`spec/llm-guideline/00-simplified-single-file-guide.md` is the
canonical one-shot authoring contract** when the task is to create/export/import
an entire deck as a single JSON manifest with inline slides and embedded images.
The deep packs remain at `spec/21-slides-system/llm/` and `spec/llm-guideline/`
for slide editing, acceptance checklists, and deeper per-type reference.

**Maintenance:** When slide schema, slideTypes, capsule tones, theme tokens, or
manifest/import rules change, update both `LLM.md` and
`00-simplified-single-file-guide.md` so the exported bundle, root docs, and
shareable guide never drift on "one manifest vs many files" guidance.
