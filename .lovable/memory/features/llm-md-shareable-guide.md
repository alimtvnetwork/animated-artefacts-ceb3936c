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

**Relationship to existing packs:** It is the fast path. The deep packs remain at
`spec/21-slides-system/llm/` (29 files) and `spec/llm-guideline/` — LLM.md points
to them for new slide types, acceptance checklist, decision tree, etc.

**Maintenance:** When slide schema, slideTypes, capsule tones, or theme tokens
change, update LLM.md too (it duplicates those facts for portability).
