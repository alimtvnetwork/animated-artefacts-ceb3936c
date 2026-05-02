# 35 — Sample deck expansion + deep gap audit (path reconciliation)

**Date:** 2026-05-01
**Status:** Spec-first. Plan written. Awaiting `next` for Phase 1.

## User request (verbatim summary)

Add 4 new sample slide types (`DatabaseDiagramSlide`, `DataTableSlide`, `NumberCalloutSlide`, `EquationSlide`) to the sample deck, extend the root spec + memory with a "Narrow Idea Per Slide" rule, and produce a deep gap-audit folder at `/audit/` comparing spec vs. implementation across every subsystem (18 subsystems, blind-AI walkthrough, weighted score, phased remediation plan). Spec + plan first; implementation only on `next`.

## Path / naming ambiguities resolved without asking

The request uses paths from a generic boilerplate that don't exist in this codebase. Final mappings (recorded in `plan.md` too):

| Verbatim path | Resolved to |
|---|---|
| `/spec/slides/projects/sample/slides/` | `spec/26-slide-definitions/sample/` |
| `/spec/slides/root-spec.md` | `spec/21-slides-system/llm/CATALOG.json` + new `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md` |
| `/projects/**` | `front-end/project/<slug>/` |
| `/prompts/06-08` | folded into `.lovable/coding-guidelines.md` (only `.lovable/prompts/01-no-questions.md` exists) |
| `/audit/` | NEW folder at project root, distinct from existing `spec/audit/` |
| `SlideTypeEnum`, `CountUpEnum`, `GapSeverityEnum` | string-literal unions per house style; `*Enum` names are conceptual |
| `.lovable/coding-guidelines.md` | will be created in Phase 0 |

## What got done in Phase 0

- Memory: Core line + dedicated entry `mem://design/slide-narrow-idea`.
- `plan.md` at project root.
- This ambiguity note + counter bump (35 → 36/40).
- Phase 1+ deferred until user replies `next`.

## Why no `ask_questions`

No-questions mode is active (4/40 window — prompt: `.lovable/prompts/01-no-questions.md`). All ambiguities logged here instead. The reconciliations above are the conservative defaults; user can override on `next`.
