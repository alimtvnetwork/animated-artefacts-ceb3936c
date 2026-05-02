# 32 — Collapsible sections + per-item expand/collapse + confirm-as-done progress

**Date:** 2026-04-30
**Status:** ✅ **Resolved 2026-05-01** at 40-task review — user picked **"new audience-facing slide type (ChecklistSlide)"**. Implemented as `ChecklistSlide` (spec 62). See log entry #41.

## User request (verbatim)

> Add collapsible sections with per-item expand/collapse and a progress indicator that marks items done as I confirm them.

## Why this is ambiguous in this codebase

This is a slide-presentation app for Riseup Asia (keywords-only, presenter-narrated, JSON-driven). "Collapsible sections with confirm-as-done progress" maps to **at least four very different surfaces**, and the right one changes the implementation entirely:

### Possible target surfaces

1. **A new slide *type* (`ChecklistSlide` / `CollapsibleListSlide`)**
   - Audience-facing slide where each item expands on click and gets ticked off as the presenter confirms (clicker advance / click).
   - Would need: new entry in `SlideType` enum, schema, validator, contract doc, catalog entry, default JSON template, animation tokens, reduced-motion variant, controller integration, optional progress bar at top/bottom.
   - Big surface — touches `spec/21-slides-system/llm/CATALOG.json`, `23-slide-type-contracts.md`, types, registry, theme tokens.

2. **A new authoring/inspector panel** (Shift+I-style tool)
   - Editor-side checklist of "things to confirm before publishing this deck" (e.g. fonts loaded, no prose in bullets, all QR codes resolve). Collapsible per section, mark-done as the author confirms.
   - Would live in `src/slides/controls/` next to `TransitionInspector.tsx`.

3. **A docs/spec UI** — collapsible TOC in the LLM catalog we just shipped (task 31), with checkmarks as the LLM/author confirms each section is read/understood.

4. **A pre-flight QA checklist for the release workflow** (task 26/27 territory) — collapsible groups of release-readiness items, ticked off as CI confirms each.

### What "confirm" means is also undefined

- Click to toggle done?
- Voice / clicker advance during live presentation?
- Keyboard shortcut?
- Auto-confirm when CI passes?
- Persist across reloads (localStorage) or per-session?

### What "items" are is undefined

- Authored bullets in a slide's JSON?
- Steps in a `StepTimelineSlide` / `StepsChain3DSlide`?
- Slides in the deck itself (deck-level progress)?
- Arbitrary user-typed checklist?

## What I would need to proceed cleanly

A single sentence answering: **"Where does this live, and what is one item?"**

Examples that would unblock a clean implementation:

- *"New audience-facing slide type called ChecklistSlide — items are bullets, presenter clicks to confirm, gold progress bar at top, persists in URL hash."* → 1–2 hr build, follows existing slide-type contract.
- *"Authoring inspector panel — items are deck-validation checks, mark-done by clicking, persists in localStorage like other inspectors."* → ~45 min, fits next to TransitionInspector.
- *"Collapsible TOC in `28-component-and-animation-catalog.md` with `[ ]` → `[x]` checkboxes."* → 10 min markdown change.

## Decision

**Resolved 2026-05-01.** User selected option 1 (new audience-facing slide type).
Implemented as `ChecklistSlide` — `spec/21-slides-system/62-checklist-slide.md`.
- Click rows to confirm done.
- Gold progress bar at top.
- Optional per-item `detail` (collapsible).
- Per-session state (no localStorage / no URL).
- Density cap: ≤7 items.

Companion decision: **M-04 (TableSlide vs DataTableSlide)** — keep both, see
`spec/21-slides-system/63-table-vs-data-table.md`.

## Cross-refs

- Slide-type catalog: [`spec/21-slides-system/llm/28-component-and-animation-catalog.md`](../../spec/21-slides-system/llm/28-component-and-animation-catalog.md)
- Inspector pattern reference: `src/slides/controls/TransitionInspector.tsx`
- No-questions mode: [`.lovable/prompts/01-no-questions.md`](../prompts/01-no-questions.md)
