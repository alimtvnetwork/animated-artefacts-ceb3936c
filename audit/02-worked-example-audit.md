# Audit 02 — `spec/2096-steps-slide/16-worked-example.md`

Audit target: the worked-example spec — the file most likely to be implemented
blind next. Step 2 of the 10-step prompt/spec audit series.

Scoring rubric: how well a **blind AI implementer** (only this file + the
codebase) could build the slide correctly with zero extra clarification.

---

## Scores (1–100)

| Factor | Score | Notes |
| --- | ---: | --- |
| Clarity (unambiguous intent) | 92 | Narrative + JSON + runtime flow read in one pass; one idea per step is explicit. |
| Success criteria (done signal) | 90 | "Done signal" section is concrete (labels render, boundary nav, reduced-motion). |
| Checklist quality | 80 | Done signal is prose, not a tickable list — harder to self-verify mechanically. |
| Self-containment (blind-run safe) | 86 | JSON is complete; relies on sibling files (`02`, `09`, `15`) for schema/CSS but cites them. |
| Example fidelity (copy-paste safe) | 94 | The JSON block is valid and tone/meta fields map to real classNames. |
| Failure-mode coverage | 78 | Shows the happy path; no example of an invalid step or boundary edge JSON. |
| Token/guardrail compliance | 95 | Capsule-tone + `.capsule-meta` rules called out; no inline hex. |
| **Composite blind-implementation score** | **88** | Strong reference; checklist + edge-case examples are the gap to 95. |

## Top weaknesses (ranked)

1. **Done signal is prose, not a checkbox list** — a blind agent can't tick it
   off mechanically. *Fix:* convert to `- [ ]` items mirroring `18`'s acceptance
   list.
2. **No negative/edge example** — only a valid 4-step deck is shown. *Fix:* add
   a short "what a rejected spec looks like" snippet (paragraph row, inline hex).
3. **Schema authority is by-reference only** — points at `02-data-model.md`
   rather than restating the required fields inline. *Fix:* add a one-line
   "required fields" recap.

## What's already excellent

- The JSON is the single source of truth and is directly runnable.
- Runtime flow (mount → `data-state` → `tryAdvance` boundary → CSS → sound)
  traces the full lifecycle in five numbered steps.

## Verdict

Composite **88/100**. Blind-implementable today; tightening the done signal into
a checklist and adding one negative example would push it to 95+.
