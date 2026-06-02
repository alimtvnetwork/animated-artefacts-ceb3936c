# updates/

Per-change **spec deltas** — a chronological log of what changed and why,
one numbered file per change.

## Format
`updates/spec/NN-short-title.md` (next sequential number). Each delta documents:

- **What** changed (the behaviour/feature/fix).
- **Why** (the motivation or bug it resolves).
- **Files** touched.
- **Verify** — how it was validated (tests, build, manual QA).

## Relationship to other folders
- Durable *system rules* live in `spec/21-slides-system/` (the design of record).
- `updates/spec/` is the running changelog of deltas against that design.
- Bug reports live in `spec/22-slides-issues/`; generated evidence in `quality/`.
