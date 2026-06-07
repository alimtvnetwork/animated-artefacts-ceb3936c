# Audit 01 — `.lovable/prompts/04-next-task.md` (canonical next-task driver)

Audit target: the last prompt authored/maintained — the on-demand canonical
next-step planner at `.lovable/prompts/04-next-task.md` (75 lines).

Purpose of this audit: score how well a **blind AI implementer** (no prior
context, only this prompt) could execute it correctly and safely. Step 1 of a
10-step audit series.

---

## Scores (1–100)

| Factor | Score | Notes |
| --- | ---: | --- |
| Clarity (unambiguous intent) | 88 | Output shape (N steps + remaining) is crisp; "N" must be inferred from the user turn, not the prompt. |
| Success criteria (definition of done) | 90 | Completion gate is explicit and checkable. |
| Checklist quality | 92 | Gate + guardrails are concrete, binary, and verifiable. |
| Self-containment (blind-run safe) | 78 | Relies on external files (`coding-guidelines`, registries) — correct, but a blind agent must discover them. |
| Guardrails / failure-mode coverage | 95 | Activation guard + debug override strongly prevent the recurring "pasted bug report → mutate history" misfire. |
| Observability mandate | 90 | "Logs first" + "confirm the log line fires" is explicit. |
| Side-effect determinism (version/snapshot rules) | 85 | Bump/save only "when truly activated"; good, but "when practical" leaves the readme pin optional. |
| **Composite blind-implementation score** | **88** | Strong, production-grade driver; minor self-containment gaps. |

## Top weaknesses (ranked)

1. **`N` is undefined inside the prompt** — depends entirely on the trigger turn.
   A blind run with no explicit N has no default. *Fix:* state "default N = 2 if
   unspecified."
2. **Self-containment** — references `.lovable/coding-guidelines.md`,
   registries, and `readme.md` without paths-at-a-glance. *Fix:* add a "files
   this prompt touches" manifest block.
3. **"when practical" / "when truly activated"** — soft language on the readme
   pin and snapshot save invites drift. *Fix:* make both unconditional on a
   real planning activation.

## What's already excellent

- The activation guard + debug override directly encode the lesson from the
  recurring prompt-history regressions — a blind agent will not mutate history
  on a debugging turn.
- The completion gate is binary and testable.

## Verdict

Composite **88/100**. Safe for blind implementation on a genuine planning turn;
the three weaknesses above are the only blockers to a 95+.
