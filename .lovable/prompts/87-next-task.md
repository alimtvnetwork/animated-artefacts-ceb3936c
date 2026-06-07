# Next task prompt (v5) — snapshot 85

N = 2. Fixed the prompt snapshot bookkeeping drift after steps 18–19: the
registries had stopped at `82` even though `83` and `84` existed, and both newer
snapshot files still carried the stale `snapshot 82` heading/content. Version
bumped `1.89.0 → 1.90.0`.

- Root cause: prompt-history metadata and saved snapshots were out of sync, so
  the repo's “latest saved snapshot” pointer was objectively wrong.
- Fix: advanced both registries to `85`, marked `82`–`84` superseded, and saved
  this corrected checkpoint.
- Next up: `spec/2096-steps-slide/10-interaction-contract.md` onward (plan
  steps 20–30).