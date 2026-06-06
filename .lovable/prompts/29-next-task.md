# 29 — Next Task (v5)

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

## This iteration (v1.34.0)
Root cause (one sentence): the last pending plan `01-slide-system-export-llm-overhaul` was stale — a spec-only plan whose 7 subtask deliverables AND the implementation they describe (export/import/zip/pdf services, ImportExportSubmenu, LLM guide, TopRight controller spec matching `ControllerBar.tsx:147`) all already exist, so it was never moved out of `pending/`. Fix: appended a Resolution note with evidence and moved it to `.lovable/plans/completed/`. `.lovable/plans/pending/` is now EMPTY. Only genuinely-open item left: M-01 (#32 collapsible-sections ambiguity), which needs a user decision and is gated by no-questions mode. Closeout: saved this `29` snapshot, synced registry, bumped to v1.34.0.
