# Slide system + theme overhaul: controller, import/export, PDF, LLM guidelines

**Slug:** slide-system-export-llm-overhaul
**Steps:** 50
**Status:** completed
**Created:** 2026-06-06

## Context
The user wants: (1) the controller moved to the top-right; (2) a single authoritative LLM guideline (LLM.md + spec packs) that fully explains the slide system, slide types/positions, JSON for single & multiple slides, and the color/theme system so any LLM can author slides/themes; (3) a fully structured Import/Export menu covering single-slide, all-slide, theme, full-ZIP, and PDF export, with a consolidated single Debug menu; (4) a compact theme/color showcase with theme import/export; (5) documented storage/read/save flow for imported items. This turn writes the spec + 50-step plan ONLY — no execution.

Captured inputs:
- Command: `.lovable/spec/commands/01-controller-top-right.md`
- Command: `.lovable/spec/commands/02-import-export-and-debug-menus.md`
- Issue: `.lovable/issues/01-theme-showcase-too-large.md`

Key files in scope: `src/slides/controls/ControllerBar.tsx`, `DeckMenu.tsx`, `ThemeMenu.tsx`, `src/slides/themes.ts`, `src/slides/themeManifest.ts`, deck manifest builders, `LLM.md`, `spec/21-slides-system/**`.

## Steps
1. Audit current controller anchor/position logic in `ControllerBar.tsx` and document the exact tokens (bottom-6 right-6, popover direction) that must change for TopRight.
2. Write spec `spec/21-slides-system/02-controller.md` update describing TopRight default anchor + downward-opening popovers; flag presenter/fullscreen parity.
3. Spec the controller hamburger restructure: a single "Debug" submenu vs separate primary chips; map every existing toggle to its new home. See ./subtasks/01-slide-system-export-llm-overhaul/01-controller-menu-tree.md
4. Spec the new top-level "Import / Export" menu node and its full submenu tree (Slides / Themes / PDF / Full ZIP). See ./subtasks/01-slide-system-export-llm-overhaul/02-import-export-menu-tree.md
5. Define the single-slide export JSON contract (envelope, fields, defaults stripped) and file naming convention.
6. Define the all-slides/deck export JSON contract and how it relates to the existing deck manifest.
7. Define single-slide import flow: validation against `slide.schema.json`, dedupe, target deck, insertion index.
8. Define all-slides/deck import flow: manifest parse, theme apply, slide replacement vs merge semantics.
9. Define theme single export/import contract (reuse `themeManifest.ts`), including custom-theme persistence.
10. Define theme bulk (all themes) export/import contract and collision/suffix rules.
11. Define the full-ZIP bundle structure (deck JSON + slides + themes + settings + assets manifest) and its `manifest.json` index.
12. Define ZIP import flow: unzip in-memory, validate each part, atomic apply with rollback on failure.
13. Spec PDF export of the full deck (render pipeline, 1920x1080 page size, per-slide page break). See ./subtasks/01-slide-system-export-llm-overhaul/03-pdf-export.md
14. Spec PDF export of the current single slide.
15. Decide PDF approach (print route `?print` + window.print vs html-to-canvas/jsPDF) and record tradeoffs in subtask 03.
16. Spec where imported items are STORED at runtime (localStorage keys, in-memory registry, BroadcastChannel sync) for slides, themes, settings. See ./subtasks/01-slide-system-export-llm-overhaul/04-storage-model.md
17. Spec how stored/imported items are READ on boot (load order in `main.tsx`, merge into registries) and how they are SAVED on change.
18. Spec lifecycle/versioning of imported items (manifestVersion, migration, clearing/reset).
19. Confirm `LLM.md` exists and audit gaps against the user's required coverage list; record findings.
20. Spec the LLM master guide structure: mental model, file map, how the runtime loads JSON via `import.meta.glob`.
21. Spec LLM guide section: full single-slide JSON envelope with every field annotated.
22. Spec LLM guide section: multi-slide / deck JSON authoring (deck.json + NN-name.json pairs).
23. Spec LLM guide section: complete `slideType` catalog with one example JSON each. See ./subtasks/01-slide-system-export-llm-overhaul/05-slide-types-catalog.md
24. Spec LLM guide section: slide POSITION/layout variants (center slide, left slide, etc.) and how to express them in JSON.
25. Spec LLM guide section: transitions + textAnimation values with a variety/collision matrix.
26. Spec LLM guide section: capsule tones + the `.capsule-{tone}` rule (no inline brand-token styles).
27. Spec LLM guide section: click-reveal slides, parentSlide, clickRevealSlide numeric requirement.
28. Spec LLM guide section: image authoring contract (content.image, imageRole, images[], captions).
29. Spec the COLOR/THEME LLM guide: token list, HSL rule, semantic tokens, gradient-noir. See ./subtasks/01-slide-system-export-llm-overhaul/06-theme-authoring-guide.md
30. Spec theme guide section: anatomy of a theme JSON (id, label, swatch, appearance, vars, fonts).
31. Spec theme guide section: step-by-step "create a new theme" recipe for an LLM.
32. Spec theme guide section: how to add background color/background theme (gradient + surface tokens).
33. Spec theme guide section: how imported custom themes register and persist (`riseup.themes.custom.v1`).
34. Spec the compact theme/color showcase redesign (dense swatch grid, sizing) per issue 01. See ./subtasks/01-slide-system-export-llm-overhaul/07-compact-theme-showcase.md
35. Spec adding theme import/export buttons into the compact showcase header.
36. Spec the "Open live slide builder" explanation doc: what `/builder` does, field schemas, JSON output flow.
37. Spec how the builder output feeds back into import (paste JSON / save into deck folder).
38. Define schema updates needed (if any) to `slide.schema.json` / `deck.schema.json` for new export fields; note parity with `contracts.ts`.
39. Define the new TypeScript module boundaries: export service, import service, zip service, pdf service (file names + responsibilities).
40. Define validation + error-management approach per `.lovable/coding-guidelines.md` (every catch logs via `src/lib/errors.ts`, no silent catch).
41. Define tests: schema-parity, import round-trip, zip round-trip, single-vs-all export snapshot tests.
42. Define manual QA checklist: controller top-right across deck/presenter/fullscreen, each import/export path, PDF output visual check.
43. List all UI strings/labels for the new menus to keep wording consistent (Import JSON, Export JSON, Export PDF, Export ZIP, Import ZIP, Themes).
44. Identify and list memory updates required (controller position core line, import/export feature memory, theme showcase design memory).
45. Identify documentation cross-links: `spec/21-slides-system/readme.md`, `LLM.md` top links, `spec/llm-guideline/**`.
46. Define the implementation ordering/dependency graph for the follow-up 50-step build turn.
47. Define rollback/safety: how an import failure must not corrupt the bundled deck (authoring-only, never mutate bundled JSON).
48. Define accessibility + reduced-motion handling for the relocated controller and new menus.
49. Cross-check every user-requested item against the steps above and record any still-pending/ambiguous points for the user.
50. Write the closeout note summarizing specs produced and the handoff for the next ("implement these") 50-step turn.

## Verification
This is a spec/plan turn: success = the plan file plus 7 subtask spec files exist on disk, all 50 steps are concrete and verifiable, and captured commands/issues are linked. No code runs. The follow-up build turn verifies via build, tests (schema-parity/round-trip), preview (controller top-right + menus), and PDF visual QA.

## Appended from prior pending tasks
none (`.lovable/plans/pending` and `completed` were empty; existing carryover backlog lives in `.lovable/plan.md` and is out of scope for this request)

## Resolution (2026-06-06, v1.34.0)
This was a SPEC-ONLY plan (verification = "plan file + 7 subtask spec files exist on disk"). All deliverables are present, and the downstream implementation already ships:
- 7 subtask specs: `.lovable/plans/subtasks/01-slide-system-export-llm-overhaul/{01..07}-*.md` ✅
- Controller TopRight: `spec/21-slides-system/02-controller.md` §Position documents top-6 right-6 + downward popovers; matches `src/slides/controls/ControllerBar.tsx:147` (`fixed top-6 right-6`).
- Export/import services: `src/slides/{export,exportPptx,exportSchemas,slideJsonImport,zipBundle,checkImportedAssets}.ts`.
- Menus/UI: `src/slides/controls/{ImportExportSubmenu,ThemeImportPreviewDialog,ThemeSwatchGrid}.tsx`; builder at `src/pages/BuilderPage.tsx`.
- LLM guide: `spec/llm-guideline/01..09 + readme`.
Remaining (not part of this spec turn): M-01 (#32 collapsible-sections ambiguity) — needs user decision.
