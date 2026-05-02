# Question & Ambiguity Log

While **no-questions mode** is active (see
[`../prompts/01-no-questions.md`](../prompts/01-no-questions.md)), every
clarifying question that would normally be asked is recorded here instead.

## File naming

`xx-brief-title.md` — sequential, two-digit prefix, kebab-case title.
Example: `01-3d-bullet-cap.md`.

## Required sections (per file)

```markdown
# xx — Brief title

**Timestamp:** YYYY-MM-DD HH:MM
**Task counter:** N/40

## Task context
What feature or spec the ambiguity relates to.

## Specific question
The exact point of uncertainty.

## Inferred decision
What assumption was made to proceed.

## Impact
How the decision shapes the implementation.

## Suggested clarification
What the user should confirm when reviewing.
```

Keep each note **under 200 words** for fast end-of-run review.

## Counter

`task-counter.md` tracks `N / 40` and logs every completed task — link the
ambiguity file in the row when one was created.
