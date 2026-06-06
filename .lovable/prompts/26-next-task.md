# 26 — Next Task (v5)

Snapshot of the recurring "Next 2 Steps or Tasks (v5)" driver prompt, saved per the workflow rule.

## What I want
1. Give me the NEXT N STEPS — exactly N — and for each: reasoning (why now, what breaks if skipped), realistic time estimate, what it unblocks.
2. Then list every remaining item after those so I can see the full picture. At the end of the task: bump the minor version, add changelog + release notes, pin the version in the root readme, and save this prompt to `.lovable/prompts/xx-next-task.md` (incrementing number).

## Definition of done (non-negotiable)
- Read the relevant files AND project memories; name exact files/functions/lines.
- Root cause in ONE sentence before any fix.
- Minimum correct change tied to that root cause — no symptom patch.
- Verify via build output / error logs / preview; show before→after signal.
- Report what changed and why.

## Hard rules
STOP and read first. Root cause before fix. No symptom-patching. Say so if unsure. Go slow, critical, deep.

## Error logs & error management
Read actual logs first. No logs = the bug; add logging at entry points. Every fix includes error handling + observability. Confirm the log line fires.

## Additional instruction
- Coding tasks: follow `.lovable/coding-guidelines.md` + every file in `spec/coding-guidelines/` if present.
- SEO tasks: follow `.lovable/seo-guidelines.md` if present.
- Verify each file/folder exists first; skip missing ones silently; folder-level spec wins on conflict.

## This iteration (v1.31.0)
Root cause (one sentence): both `quality/audit/remediation-plan.md` and the prior turn's plan `02-slide-type-remediation-execution.md` were stale fiction — every Phase 1/2 item (B-01..B-06, A-01..A-04) plus M-02/M-03/M-05 is already implemented and tested in the codebase, so the next-task loop kept fabricating already-done work. Fix: audited the codebase (enums.ts = 26 types, the four slide components, useCountUp, densityCheck, validateAgainstCatalog, check-catalog-drift CI, sample slides 40–43), appended a status table to the backlog marking everything shipped, moved plan 02 to `completed/` with a Resolution note, leaving only M-01 (#32 ambiguity, needs user) and M-04 (TableSlide deprecation decision) genuinely open. Verified: `contracts.test.ts` 14/14.
