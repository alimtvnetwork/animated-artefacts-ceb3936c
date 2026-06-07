# Next task prompt (v5) — snapshot 90

N = 2. Repaired prompt-history regression after snapshot 89 was saved as a live
verbatim driver and the registries were left pointing at `88`. Version bumped
`1.94.0 → 1.95.0`.

- Root cause: `.lovable/prompts/89-next-task.md` reintroduced executable driver
  wording instead of an inert archive summary, while `.lovable/prompt.md` and
  `.lovable/prompts.md` still pointed at `88` as latest.
- Fix: rewrote snapshot `89`, created this `90` checkpoint, and advanced both
  registries so `90` is the latest saved snapshot.
- Next up: `spec/2096-steps-slide/16-worked-example.md` onward (plan steps
  26–30).