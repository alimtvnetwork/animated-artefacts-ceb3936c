# 31 — LLM Catalog Doc + Machine-Readable CATALOG.json

**Date:** 2026-04-30
**Mode:** No-questions (31/40)

## Request

> Also in your LLM documentation, mention it clearly how many types of
> animation components, slides are available that the LLM could design
> based on the JSON. So it should be very, uh, very, uh, let's say,
> describing manner so that a LLM can understand and create those
> components using JSON, and we can import, export from another project
> to this project.

## Ambiguities resolved without asking

1. **Where this doc belongs.** Existing per-type contracts live in
   `spec/21-slides-system/llm/`. **Decision:** add a new top-level catalog
   doc `28-component-and-animation-catalog.md` in the same folder so any
   LLM reading the pack hits it before drilling into per-type contracts,
   plus a sibling machine-readable `CATALOG.json` for cross-project
   imports.

2. **What "animation components" covers.** The user said "animation
   components, slides" — that maps to (a) slide types, (b) slide-to-slide
   transitions, (c) text animations, (d) capsule expand-card animations,
   (e) per-step motion variants. **Decision:** catalog all five
   independently with counts, motion descriptions, and exemplar JSON.

3. **What counts to publish.** Re-derived from `src/slides/enums.ts` +
   `src/slides/types.ts` + `Capsule.tsx` + `stepMotionVariant`:
   - 17 slide types (`SlideType`)
   - 5 slide transitions (`SlideTransition`)
   - 4 text animations (`TextAnimation`)
   - 9 capsule colors (`CapsuleColor`)
   - 2 controller positions (`ControllerPosition`)
   - 6 capsule expand animations (`CapsuleExpandSpec.animation`)
   - 3 capsule label animations (`CapsuleExpandSpec.labelAnimation`)
   - 3 step motion variants (`stepMotionVariant`)
   - 2 click-reveal triggers (`clickRevealSlide` / `expand`)
   These values are now duplicated into both the MD doc (human-readable
   tables + JSON exemplars) and `CATALOG.json` (machine-readable; safe to
   import into another project to confirm enum recognition).

4. **What "import/export between projects" means.** No automated tool was
   asked for. **Decision:** publish the **portability contract** — the
   schema files that gate validation, the directory shape that travels
   with a deck (`spec/26-slide-definitions/<deck-slug>/`), the asset
   re-homing rule (loader does not auto-rewrite image paths), and a
   minimal `cp -R` workflow. Anything richer (cross-project asset CLI,
   manifest auto-merge) is out of scope until requested.

5. **Cross-linking.** A new doc that nobody links to is dead weight.
   **Decision:** wire it from `00-readme.md` (top-of-file pointer + table
   row), `06-json-authoring-cheatsheet.md`, and
   `23-slide-type-contracts.md` so every reasonable entry point into the
   pack surfaces the catalog.

## Implementation

- Created `spec/21-slides-system/llm/28-component-and-animation-catalog.md`
  with §0 single-glance counts table, §1 every slide type + minimal JSON
  exemplar, §2 every transition (motion + reduced-motion behaviour +
  resolver chain), §3 text animations, §4 capsules (colors, icon badges,
  expand spec sub-tables for `animation` and `labelAnimation`), §5 step
  motion variants, §6 click-reveal triggers, §7 controller positions, §8
  cross-project import/export contract + workflow + validation note, §9
  authoring checklist for an LLM.
- Created `spec/21-slides-system/llm/CATALOG.json` — same data in a flat
  JSON registry shape (`registries.<name>.{count, source, values}`),
  plus `schemas` + `portability` sections so an importing project can
  programmatically check whether every value in a deck JSON matches a
  recognised enum entry.
- Cross-linked from `00-readme.md` (added 🧭 callout after the "What this
  folder is" block + new row in the reading-order table),
  `06-json-authoring-cheatsheet.md` (top-of-file pointer), and
  `23-slide-type-contracts.md` (top-of-file pointer).

## Files touched

- `spec/21-slides-system/llm/28-component-and-animation-catalog.md` (new)
- `spec/21-slides-system/llm/CATALOG.json` (new)
- `spec/21-slides-system/llm/00-readme.md`
- `spec/21-slides-system/llm/06-json-authoring-cheatsheet.md`
- `spec/21-slides-system/llm/23-slide-type-contracts.md`
- `.lovable/question-and-ambiguity/31-llm-catalog-and-import-export.md`
- `.lovable/question-and-ambiguity/task-counter.md`
