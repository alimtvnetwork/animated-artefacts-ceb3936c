# 01 — No-Questions Mode (40 tasks)

**Activated:** 2026-04-28
**Scope:** next 40 tasks from activation
**Counter file:** `.lovable/question-and-ambiguity/task-counter.md`

## Rule

Do **not** ask the user any clarifying questions for the next 40 tasks.
When ambiguity arises, log it to `.lovable/question-and-ambiguity/xx-brief-title.md`
and proceed with the best inference.

**Exception — counted next-step planner:** if the active planner contract says a
missing numeric count must stop the planner, log the ambiguity and **stop that
planner flow** instead of inventing a count.

## Logging contract (per ambiguity)

Each note is markdown, ≤200 words, sequentially numbered, with:

1. **Task context** — what feature / spec the ambiguity relates to.
2. **Specific question** — the exact point of uncertainty.
3. **Inferred decision** — assumption made to proceed.
4. **Impact** — how the decision shapes the implementation.
5. **Suggested clarification** — what the user should confirm on review.
6. **Timestamp** — when logged.

## Inference guidelines

- Match existing codebase style.
- Prefer the simpler implementation.
- Default to the most common UX pattern for the context.
- Document the inference; never block progress.

## Counter

- Starts at **0**, increments by **1** per completed task.
- At **40**, normal question-asking resumes.
- Each completion appended to `task-counter.md`.

## Reference

- Activated by user prompt — see chat history for full spec.
- Review log at end of run: `.lovable/question-and-ambiguity/`.
