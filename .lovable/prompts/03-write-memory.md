# 03 — Write Memory (End-of-Session Persistence)

**Activated:** 2026-05-16
**Trigger phrases:** `write memory`, `end memory`, `update memory`
**Companion:** `02-read-memory.md` (onboarding); this is its end-of-session counterpart.

> **Purpose:** Persist everything learned, done, and left undone this session so the next AI picks up with zero context loss.

> **Core principle:** The memory system is the project's brain. If you did something and didn't write it down, it didn't happen.

---

## Project layout reconciliation (real paths)

The generic "Write Memory" template references folders that do **not** exist in this repo. The Anti-Hallucination Contract (`02-read-memory.md`) forbids creating empty placeholders. Map of generic → real:

| Generic template path | This project's real location |
|---|---|
| `.lovable/memory/index.md` | ✅ same |
| `.lovable/memory/workflow/` | `plan.md` (project root) + `audit/remediation-plan.md` |
| `.lovable/plan.md` | `plan.md` (project root) |
| `.lovable/suggestions.md` | append to `plan.md` "Phase N+" section (see `02-read-memory.md` §Memory Update Protocol) |
| `.lovable/pending-issues/` | `spec/22-slides-issues/NN-*.md` |
| `.lovable/solved-issues/` | resolved entries stay in `spec/22-slides-issues/` with a `## Resolution` section appended — do NOT create a parallel folder |
| `.lovable/strictly-avoid.md` | `.lovable/memory/constraints/*.md` (one file per prohibition) + a one-liner in `index.md` Core |
| `.lovable/cicd-issues/` + `.lovable/cicd-index.md` | CI lives in `.github/workflows/` + `metrics/strict-types-history.json`. Only create `.lovable/cicd-issues/` if a real CI incident occurs — never as empty scaffolding. |
| `.lovable/overview.md`, `.lovable/user-preferences` | not used here; cross-session user prefs live in `mem://~user` |
| spec deltas | `updates/spec/NN-short-title.md` (one per change) |
| ambiguity log | `.lovable/question-and-ambiguity/xx-title.md` + bump `task-counter.md` |

If the user explicitly asks for one of the generic folders (e.g. `.lovable/cicd-issues/`), create it deliberately — don't auto-scaffold it during routine memory writes.

---

## Phase 1 — Audit current session

Answer internally before writing:
- **Done:** every task completed, every file created / modified / deleted, every decision.
- **Pending:** started-but-unfinished, discussed-but-not-started, blockers.
- **Learned:** new patterns, gotchas, user preferences (explicit or implicit).
- **Wrong:** bugs + root causes, failed approaches, things to never repeat.

## Phase 2 — Update memory files

1. Read `.lovable/memory/index.md` first.
2. Edit existing files where the topic already exists — **append, never truncate**.
3. Create new files at `.lovable/memory/{constraints|design|features|preferences}/<kebab-name>.md` only for genuinely new institutional knowledge (frontmatter: `name`, `description`, `type`).
4. Update `.lovable/memory/index.md` in the **same** operation. `code--write` REPLACES the file — include all existing content.
5. If the rule is universal (applies to every action), add a one-liner to the Core block too.

## Phase 3 — Plan + spec deltas

- Update `plan.md`: bump task status, move fully-complete items to a `## Completed` section at the bottom, never delete.
- For each meaningful behavior/code change this session, write `updates/spec/NN-title.md` (next sequential number) describing: what was wrong, what changed, storage/contract impact, files touched, how to verify.
- If a system spec is now wrong, edit `spec/21-slides-system/NN-*.md` to match.

## Phase 4 — Issues

- New unresolved bug → `spec/22-slides-issues/NN-short-title.md` with sections: Description · Root Cause · Repro · Attempted Solutions · Priority · Blocked By.
- Resolved bug → append `## Resolution` (what fixed it, attempts, learning, anti-pattern to avoid) to the existing issue file. Do not move it.
- Hard prohibition emerged → new file in `.lovable/memory/constraints/` + Core line in `index.md`.

## Phase 5 — Ambiguity log + counter

If no-questions mode is active and ambiguity surfaced this session:
- Write `.lovable/question-and-ambiguity/NN-title.md` (sections: Task context · Specific question · Inferred decision · Impact · Suggested clarification, ≤200 words).
- Append a row to `task-counter.md` (timestamp, summary, link to ambiguity file or `_none_`).
- Update the `N / 40` progress line.

## Phase 6 — Consistency validation

- Every file in `.lovable/memory/` (incl. subfolders) is referenced from `index.md`.
- Every `✅ Done` plan item has corroborating evidence (memory note, spec delta, or `spec/22-slides-issues/` resolution).
- No file is in both "pending" and "resolved" state.
- No orphan: every cross-reference (`mem://...`, `updates/spec/NN`, `spec/22-slides-issues/NN`) resolves.

## Phase 7 — Closing summary

Reply with:

```
✅ Memory update complete.

- Tasks completed: N
- Tasks pending: N
- Memory files created/edited: N
- Issues opened/resolved: N / N
- Spec deltas: updates/spec/NN, ...
- Counter: N / 40

Files touched:
- ...

Next AI can pick up from: <one-sentence current state + next logical step>
```

Then stop. No exploratory follow-ups.

---

## File naming + structural rules

- All new files: lowercase, hyphen-separated, numeric prefix where the folder uses one (`updates/spec/`, `spec/22-slides-issues/`, `.lovable/question-and-ambiguity/`).
- Memory files under `.lovable/memory/{type}/` use kebab-case **without** numeric prefix.
- Path is `.lovable/memory/` — **never** `.lovable/memories/`.
- Plans and spec deltas are sources of truth — never fragment into shadow files.
- Never delete history; mark done, move to a `## Completed` section.
- Never overwrite blindly: read before writing.
- Never leave orphans (every file indexed, every reference resolves).

## Anti-corruption checklist

1. Read every file before editing it.
2. Preserve existing content verbatim outside the section you're updating.
3. Update `index.md` in the same call that adds a memory file.
4. One issue lives in exactly one place (open in `spec/22-slides-issues/NN-*.md`, resolved by appending `## Resolution` to the same file).
5. Write as if the next AI has amnesia — because it does.
