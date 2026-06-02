# 22-slides-issues/

Bug reports and behavioural issues against the **running app**. One file per
issue, numbered: `NN-short-title.md`.

## Lifecycle
1. New bug → create `NN-short-title.md` describing: symptom, repro steps,
   expected vs actual, affected slide/component, environment.
2. Resolved → append a `## Resolution` section to the **same file** (what fixed
   it, files touched, verifying test). Never move or delete the file — the
   number is the permanent reference.

## What does NOT go here
- System design / behaviour rules → `spec/21-slides-system/`.
- Per-change deltas → `updates/spec/`.
- Generated audit output → `quality/`.
