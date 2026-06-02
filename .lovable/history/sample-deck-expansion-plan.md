# Plan — Sample Deck Expansion + Deep Gap Audit

**Status:** Spec-first. NO implementation will start until the user says `next`.
**Logged:** 2026-05-01
**Tracked in:** `.lovable/question-and-ambiguity/35-sample-expansion-and-gap-audit.md` (path reconciliation), `.lovable/question-and-ambiguity/task-counter.md` (35/40).

---

## Path / naming reconciliation

The verbatim request uses paths and enum names from a generic spec template. This project uses concrete, slightly different names. Mappings (final, not negotiable mid-flight):

| Verbatim says | This project resolves to |
|---|---|
| `/spec/slides/projects/sample/slides/` | `spec/26-slide-definitions/sample/` (NEW deck slug `sample`) |
| `/spec/slides/root-spec.md` | `spec/21-slides-system/llm/CATALOG.json` (machine truth) + `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md` (this addendum) |
| `/projects/**` | `front-end/project/<slug>/` |
| `.lovable/coding-guidelines.md` | does not exist; new file `.lovable/coding-guidelines.md` will be created in Phase 0 |
| `/prompts/**` | only `.lovable/prompts/01-no-questions.md` exists; rules from the request that reference 06/07/08 prompts are folded into `.lovable/coding-guidelines.md` |
| `/audit/` | NEW folder at project root. Distinct from existing historical `spec/audit/`. |
| `SlideTypeEnum`, `CountUpEnum`, `GapSeverityEnum`, etc. | TS string-literal unions (`SlideType`, `TextAnimation`, …). Treat the request's `*Enum` names as conceptual; map to existing union types. |

The `narrow idea` rule is already saved as a memory entry (Core + `mem://design/slide-narrow-idea`).

---

## Phase plan

Each phase ends with a checkpoint. User must say `next` to advance. Remaining tasks are listed at the end of every implementation phase.

### Phase 0 — Spec + plan (THIS phase, no code)

- [x] Save Narrow Idea rule to `mem://index.md` Core + `mem://design/slide-narrow-idea`.
- [x] Log path reconciliation in `.lovable/question-and-ambiguity/35-sample-expansion-and-gap-audit.md`, bump counter to 36/40.
- [x] Write this `plan.md` at project root.
- [x] Write `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md` — root-spec addendum that:
  - extends the slide-types catalog with `DatabaseDiagramSlide`, `DataTableSlide`, `NumberCalloutSlide`, `EquationSlide`
  - adds `CountUp` easing union (`linear` | `easeOutQuint` | `spring`)
  - adds Mermaid ERD theme-token map (no hex; all `--gold`, `--cream`, `--ember`, `--surface-2`)
  - records timing constants `--dur-count-fast` (900ms) and `--dur-count-slow` (1800ms)
  - reaffirms Narrow Idea rule with per-type density caps
- [x] Write `audit/readme.md` + `audit/00-methodology.md` skeleton (folder structure + template + severity enum) so the user can see what Phase 2 will produce before it runs.
- [x] Write `.lovable/coding-guidelines.md` with the 12 rules from the request (functions <8 lines, no `any`, etc.) tailored to this codebase.

### Phase 1 — Sample deck spec (no runtime code yet)

Deck slug: `sample`. Lives at `spec/26-slide-definitions/sample/` per project rule (NOT `front-end/project/sample/` until the runtime exists for the new types).

For each of the 4 new slide types, write `NN-name.json` + `NN-name.md`:

1. `40-database-erd.{json,md}` — `DatabaseDiagramSlide`. ONE schema concept ("users ↔ orders ↔ order_items"). Mermaid `erDiagram`.
2. `41-data-table.{json,md}` — `DataTableSlide`. ≤5 columns. Stagger row reveal.
3. `42-number-callout.{json,md}` — `NumberCalloutSlide`. ONE oversized number. `easeOutQuint` count-up, slow.
4. `43-equation.{json,md}` — `EquationSlide`. ONE equation, term-by-term Stagger.

Each MD companion documents: narrow idea (1 sentence), capsule colors used, transition + text animation, image refs, why it's narrow.

**Phase 1 checkpoint:** specs are complete, no code. User says `next` to start Phase 2.

### Phase 2 — Audit folder population

Produce `/audit/` per the requested structure:

```
/audit/
  readme.md                  (already in Phase 0)
  00-methodology.md          (already in Phase 0)
  01-inventory-spec.md
  02-inventory-implementation.md
  03-gap-matrix.md
  subsystems/
    01-slide-types.md
    02-animation-system.md
    03-navigation-and-url.md
    04-share-and-deep-link.md
    05-click-reveal.md
    06-controller.md
    07-branding.md
    08-typography-and-tokens.md
    09-import-export-json.md
    10-audio-and-narration.md
    11-keyboard-and-accessibility.md
    12-reduced-motion.md
    13-static-deploy-and-asset-copy.md
    14-per-project-spec-workflow.md
    15-mermaid-and-erd.md
    16-equation-rendering.md
    17-number-animation.md
    18-data-table.md
  blind-ai-walkthrough.md
  ai-blind-score.md
  remediation-plan.md
```

Subsystems 15–18 will mark **Spec: addendum 29 / Implementation: not built** so the gap is honest.

**Phase 2 checkpoint:** audit is complete, fully readable, with severities + scores. User says `next` for Phase 3.

### Phase 3 — Runtime implementation of the 4 new slide types (Blocking remediations only)

Driven by `audit/remediation-plan.md` Phase 1 (Blocking) items. Likely scope:

1. Extend `SlideType` union + Zod schema in `src/slides/types.ts` + `src/slides/schema.ts`.
2. New components under `src/slides/types/`: `DatabaseDiagramSlide.tsx`, `DataTableSlide.tsx`, `NumberCalloutSlide.tsx`, `EquationSlide.tsx`.
3. Mermaid ERD: dynamic-import `mermaid` (already a peer? — audit will confirm) and inject CSS-token theme.
4. Equation: pre-render KaTeX HTML at build time via a small node script (`scripts/prerender-equations.ts`), no runtime KaTeX dep.
5. Number callout: `useCountUp` hook with `linear` / `easeOutQuint` / `spring` modes; respects `prefers-reduced-motion` → snaps to final.
6. Data table: capsule-styled table, Stagger row reveal via existing motion tokens.
7. Wire all four into `SlideStage`, `SlidePreview`, builder picker, contracts test, fixtures, `front-end/slide-template/`.
8. Migrate `spec/26-slide-definitions/sample/40-43-*.json` into `front-end/project/sample/data/slides/` once the runtime exists.

**Phase 3 checkpoint:** sample deck renders all 4 new slides at `/N` routes. User says `next` for Phase 4 (Major remediations) if desired.

### Phase 4+ — Major / Minor remediations from audit

Driven by `audit/remediation-plan.md`. Listed at end of Phase 3.

---

## Coding guidelines (recap)

Full text in `.lovable/coding-guidelines.md`. The 12 rules are non-negotiable for any new file produced from Phase 1 onward.

## Standard continuation question

If anything in this plan is wrong or you want a different scope, say so before `next`. Otherwise reply `next` and Phase 1 begins.
