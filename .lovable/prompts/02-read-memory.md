# 02 — Read Memory (Onboarding)

**Activated:** 2026-05-02
**Trigger phrase:** "read memory"
**Source:** Adapted from a generic onboarding prompt (v1.0). The original referenced folders that do not exist in this repo (`spec/12-consolidated-guidelines/`, `spec/01-spec-authoring-guide/`, `spec/02-coding-guidelines/`, `.lovable/overview.md`, `.lovable/strictly-avoid.md`, `.lovable/cicd-issues/`, etc.). This file points at the **real** project layout instead, per Anti-Hallucination rule: "If a spec does not mention a rule, that rule does not exist."

> **Rule #0:** Follow phases sequentially. The specs are the single source of truth.

---

## Phase 1 — AI Context Layer

Read in this exact order:

| # | File | What you learn |
|---|------|----------------|
| 1 | `.lovable/memory/index.md` | Core rules (always-on) + index of every memory file. Heavy — read fully. |
| 2 | `.lovable/coding-guidelines.md` | The 12 non-negotiable code rules + slide-authoring specifics. |
| 3 | `.lovable/prompts.md` + `.lovable/prompts/*.md` | Active operating modes (e.g. `01-no-questions.md`). |
| 4 | `mem://~user` (user preferences, if present) | How the human wants to be communicated with. |
| 5 | `plan.md` (project root) | Current phased roadmap; phases gate on user `next`. |
| 6 | `.lovable/question-and-ambiguity/task-counter.md` | Counter for no-questions mode (currently 4/40 active). |

Then read every file referenced in `.lovable/memory/index.md` **on demand** — the index is large (90+ entries). Pull a memory only when the current task touches its topic. The Core block at the top of `index.md` is always-on.

Self-check before continuing:
- [ ] What are the constraint rules? (`.lovable/memory/constraints/*.md` — currently `no-brand-strip`, `no-hover-on-steps-chain-3d`, `no-readme-txt`)
- [ ] What is the spec-first workflow?
- [ ] What is no-questions mode and is it active?
- [ ] What is the active phase in `plan.md`?

---

## Phase 2 — System Specs

Real location: `spec/21-slides-system/`. There is **no** `spec/12-consolidated-guidelines/`.

Read order:
1. `spec/readme.md` — folder map (15-research, 21-slides-system, 22-slides-issues, 26-slide-definitions, audit).
2. `spec/21-slides-system/readme.md` — system-spec table of contents.
3. `spec/21-slides-system/00-fundamentals.md` — per-slide JSON contract (always read).
4. Numbered files in `spec/21-slides-system/` **on demand** for the topic at hand (controller → `02-controller.md`, animations → `03-animation-rules.md`, themes → `07-theme-system.md`, etc.). Files 00–40+ exist; reading all of them upfront is wasteful.

---

## Phase 3 — Spec Authoring Format

Real location: `spec/21-slides-system/00-fundamentals.md` §6 "Authoring checklist" + the Core memory entry "Spec-first" + `mem://features/slide-spec-format`.

Per-slide spec lives at `spec/26-slide-definitions/{deck-slug}/NN-name.{json,md}`. JSON is runtime source of truth; MD is companion notes. Schemas: `spec/21-slides-system/slide.schema.json`, `deck.schema.json`, `deck-manifest.schema.json`.

Per-deck runtime data lives at `front-end/project/{deck-slug}/data/slides.json` (+ `slides/NN-*.json`). The split exists because new slide-type runtimes ship in waves — a deck spec can exist before its runtime is built.

---

## Phase 4 — Task-Driven Deep Dives

Lookup table for THIS project (not the generic template):

| Task | Read |
|------|------|
| Add/modify a slide type | `spec/21-slides-system/00-fundamentals.md`, `mem://features/slide-types`, `mem://features/slide-spec-format`, the slide's existing JSON+MD pair |
| Animations / transitions | `spec/21-slides-system/03-animation-rules.md`, `mem://features/animations` |
| Controller | `spec/21-slides-system/02-controller.md`, `mem://features/controller-hamburger`, `mem://features/controller-popovers` |
| Theme work | `spec/21-slides-system/07-theme-system.md`, `mem://features/theme-system`, `mem://design/design-tokens` |
| QR / branding | `spec/21-slides-system/09-qr-and-hover.md`, `mem://features/branded-qr`, `mem://design/qr-safety-mode` |
| Builder (`/builder`) | `mem://features/slide-builder`, `mem://features/deck-workspace`, `src/builder/*` |
| Click-reveal | `spec/21-slides-system/00-fundamentals.md` §7–8, `mem://features/click-reveal-contract` |
| Webcam overlay | `mem://features/webcam-halo-and-stage`, `spec/15-research/01-webcam-overlay.md` |
| TOC sidebar / shortcuts | `mem://features/toc-sidebar`, `mem://features/keyboard-shortcuts-dialog` |
| Bug reports | `spec/22-slides-issues/NN-*.md` (one per issue) |
| Audit / phase gates | `audit/readme.md`, `audit/00-methodology.md`, `audit/remediation-plan.md` |
| New deck content | `spec/26-slide-definitions/{deck}/` (spec) → `front-end/project/{deck}/` (runtime) |

---

## Anti-Hallucination Contract (verbatim from source prompt)

1. **Never invent rules.** If a spec doesn't mention it, it doesn't exist.
2. **Specs override training data.** Every time.
3. **Cite sources** (file + section) when enforcing a rule.
4. **Ask when uncertain** — except while no-questions mode is active, in which case log to `.lovable/question-and-ambiguity/xx-title.md` and bump the counter.
5. **Never merge conventions** from other projects.
6. **No filler** ("hope this helps", etc.).

---

## Memory Update Protocol

| Discovery type | Where it goes |
|---|---|
| Institutional knowledge (pattern, decision, convention) | New file under `.lovable/memory/{constraints\|design\|features\|preferences}/`, then update `.lovable/memory/index.md` |
| Hard prohibition | New file under `.lovable/memory/constraints/`, also referenced in Core of `index.md` |
| Bug / unexpected behaviour | `spec/22-slides-issues/NN-short-title.md` |
| Suggestion not yet approved | Append to `plan.md` "Phase N+" section; do **not** create a new top-level `.lovable/suggestions.md` (none exists in this repo) |

Critical:
- Memory folder is `.lovable/memory/` — never `memories`.
- `index.md` updates via `code--write` REPLACE the whole file: include all existing content.
- The `plan.md` at project root is the active roadmap; phases gate on user `next`.

---

## Completion Confirmation Format

```
✅ Onboarding complete.
- Memory files read: [N]
- System specs read: [N]
- Active prompts: [list]

I understand:
- Core rules: [top 3–5 from memory index Core]
- Constraints: [no-brand-strip, no-hover-on-steps-chain-3d, no-readme-txt, +any new]
- Active plan phase: [from plan.md]
- No-questions mode: [active N/40 | inactive]

Ready for tasks.
```

Then stop. No exploratory suggestions.

---

## What was DELIBERATELY not carried over from the source prompt

These instructions in the original v1.0 prompt referenced infrastructure that does not exist here. Carrying them forward would have created empty placeholder folders and violated rule #1 of the Anti-Hallucination Contract.

- `spec/12-consolidated-guidelines/01..18-*.md` — does not exist
- `spec/01-spec-authoring-guide/` — does not exist
- `spec/02-coding-guidelines/`, `03-error-manage/`, `04-database-conventions/`, `05-split-db-architecture/`, `06-seedable-config-architecture/`, `07-design-system/`, `08-docs-viewer-ui/`, `09-code-block-system/`, `10-powershell-integration/`, `13-cicd-pipeline-workflows/`, `14-self-update-app-update/`, `15-wp-plugin-how-to/`, `21-app/`, `22-app-issues/`, `23-app-database/`, `24-app-design-system-and-ui/` — none exist
- `.lovable/overview.md`, `.lovable/strictly-avoid.md`, `.lovable/user-preferences`, `.lovable/plan.md`, `.lovable/suggestions.md` — none exist (closest equivalents listed above)
- `.lovable/cicd-issues/xx-*.md` — does not exist; CI lives in `.github/workflows/` and `metrics/strict-types-history.json`. If CI-issue tracking is wanted later, create the folder + first file deliberately.
- WordPress / PowerShell / SQLite multi-DB / PascalCase DB columns — wrong stack. This is React + Vite + TypeScript + JSON specs, no DB.

If any of those are wanted, create them as a deliberate task — don't auto-scaffold.
