# 60-next-task.md — snapshot

Saved at v1.65.0. Task: quarantine archived `xx-next-task` snapshots so they no
longer contain live driver instructions.

## Root cause (one sentence)
Archived prompt snapshots `.lovable/prompts/05-next-task.md` through
`.lovable/prompts/41-next-task.md` still contained the full executable
`next-task` instruction body (`## What I want`, `## Definition of done`, `## Hard
rules`), so they remained semantically retrievable even though the registries
marked them archive-only.

## Minimum fix
- Rewrote archived snapshots `05`–`41` into inert checkpoint summaries only.
- Updated `.lovable/prompts.md` and `.lovable/prompt.md` so the archive rule now
  explicitly requires archived snapshots to remain inert summaries.
- Advanced the saved snapshot pointer to `60-next-task.md`.

## Verification
- Before fix: `rg -n "## What I want|## Definition of done|## Hard rules" .lovable/prompts`
  returned 37 archived files (`05`–`41`) plus the canonical driver.
- After fix: those headings remain only in `.lovable/prompts/04-next-task.md`.
- Vite daemon logs still show no application runtime error beyond the existing
  Browserslist warning.