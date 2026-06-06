# 61-next-task.md — snapshot

Saved at v1.66.0. Task: remove the last verbatim live-driver phrases from
noncanonical prompt history.

## Root cause (one sentence)
Noncanonical history files still echoed the live `next-task` driver wording too
closely, so retrieval could still pull history instead of relying only on the
canonical guarded driver.

## Minimum fix
- Sanitized archived snapshots `05`–`41` to generic inert wording only.
- Sanitized `.lovable/prompts/60-next-task.md` so it no longer quotes the live
  driver body.
- Tightened archive-rule wording in `.lovable/prompts.md` and
  `.lovable/prompt.md` to ban verbatim echoes.

## Verification
- Noncanonical prompt-history files no longer contain the live driver phrases
  verbatim.
- Vite daemon logs remain free of application errors beyond the existing
  Browserslist warning.