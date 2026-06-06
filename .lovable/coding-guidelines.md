# Coding Guidelines

**Scope.** Every file produced or modified from 2026-05-01 onward, especially anything authored under `spec/26-slide-definitions/sample/`, `audit/`, or new runtime code for `DatabaseDiagramSlide` / `DataTableSlide` / `NumberCalloutSlide` / `EquationSlide`.

**Read order before implementing.**
1. `.lovable/coding-guidelines.md` (this file).
2. `.lovable/prompts.md`, then only the prompt files whose status is **active**, **always-on**, or **on-demand canonical driver**. Do **not** read archived snapshot files in `.lovable/prompts/` unless the task is prompt-maintenance/history repair.
3. `.lovable/memory/index.md` (especially Core).
4. `spec/21-slides-system/**` (system rules + LLM authoring pack at `llm/`).
5. `spec/26-slide-definitions/<deck>/**` (per-deck spec) when working on a specific deck.
6. `audit/**` (once populated — informs remediation order).

## The 12 rules

1. **Functions under 8 lines.** If logic spans more, extract a helper. Comments don't count toward the line budget.
2. **No nested ifs; positive conditions only.** Early-return on negative paths; the happy path stays at indent 1.
3. **No `any` / `unknown` / `interface{}`.** Use `Generic<T>` or named string-literal unions. The single accepted exception is `catch (err: unknown)` followed by a narrowing check.
4. **Every `catch` logs.** Use the project logger (`src/lib/errors.ts` if present) — never silent `catch {}`. A silent catch must carry a one-line `// intentional: <reason>` comment.
5. **Files / classes under 80–100 lines.** When a slide-type component grows past 100 lines, split presentational sub-components into peer files.
6. **No magic strings or numbers.** Hoist to `const`, `enum`-style union, or CSS variable. Slide animation timings live in `index.css` (`--dur-*`), never inline.
7. **Definitions live in separate files.** Types in `*.ts`, components in `*.tsx`, schemas in `schema.ts`. Do not declare a type next to a component just because it's used once.
8. **Booleans prefixed with `is` / `has`.** `isReducedMotion`, `hasCaption`, `isFrozen`. Never `reducedMotion: boolean`.
9. **DRY — reusability is the highest priority.** Before writing a new helper, search `src/` and `src/slides/` for an existing one. New visual primitives go in `src/slides/components/`.
10. **Components as small as possible; plan first.** When a feature touches 5+ files, write a Mermaid diagram in the spec MD before coding.
11. **If `error-manage/` exists in any spec folder, follow it strictly.** (Currently none — note for future-proofing.)
12. **Narrow Idea Per Slide.** Every slide under `spec/26-slide-definitions/**` communicates exactly one narrow idea. Density is a defect. See `mem://design/slide-narrow-idea`.

## Slide-authoring specifics

- **Spec-first:** JSON+MD pair before any runtime code touches the new type.
- **No inline hex.** Always `hsl(var(--gold))`, `hsl(var(--cream))`, etc.
- **Transitions + text animations are explicit per slide.** Pick from `CATALOG.json`.
- **Image references:** anything under `images/` next to the spec; runtime assets resolved via the asset registry — never `/`-prefixed paths in JSON unless they exist in `public/`.
- **Density caps** (from `spec/21-slides-system/29-*.md`): KeywordSlide ≤6 capsules, DataTableSlide ≤5 cols × ≤8 rows, NumberCalloutSlide = 1 number, EquationSlide = 1 equation, DatabaseDiagramSlide ≤5 entities.

## Phasing

Big work proceeds on user-issued `next` checkpoints. At the end of every phase, list remaining tasks. See `plan.md` for the active plan.
