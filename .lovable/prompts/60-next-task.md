# 60-next-task.md — snapshot

Saved at v1.65.0. Task: quarantine archived `xx-next-task` snapshots so they no
longer contain live driver instructions.

## Root cause (one sentence)
Noncanonical history files still repeated the live `next-task` driver body and
its distinctive phrasing verbatim, so they remained semantically retrievable
even though the registries marked them archive-only.

## Minimum fix
- Rewrote archived snapshots `05`–`41` into inert checkpoint summaries only.
- Updated `.lovable/prompts.md` and `.lovable/prompt.md` so the archive rule now
  explicitly requires archived snapshots to remain inert summaries.
- Advanced the saved snapshot pointer to `60-next-task.md`.

## Verification
- Before fix: archived history files still matched searches for the live driver's
  section headings and phrasing.
- After fix: only `.lovable/prompts/04-next-task.md` retains the live driver body;
  archived snapshots are inert summaries without verbatim driver phrases.
- Vite daemon logs still show no application runtime error beyond the existing
  Browserslist warning.