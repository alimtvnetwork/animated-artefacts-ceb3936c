# 30 — Next Task (v5)

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

## This iteration (v1.35.0)
State (one sentence): the backlog is drained — both plans sit in `.lovable/plans/completed/`, the remediation table in `quality/audit/remediation-plan.md:58` shows every item ✅ except **M-01** (`#32` collapsible-sections + progress surface ambiguity, line 29/39/58), which is genuinely blocked on a user decision and gated by no-questions mode (4/40 window), so there is NO code-actionable next step this turn.
Honest call: rather than fabricate work, this iteration only performs the standard closeout (save `30` snapshot, sync registry `29`→archived/`30`→latest, bump to v1.35.0, release notes). M-01 moves the moment the user names which surface owns collapsible-section progress.
