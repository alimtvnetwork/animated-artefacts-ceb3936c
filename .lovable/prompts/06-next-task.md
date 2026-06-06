# Prompt 05 — Next N Task (v5)

> Saved per the "save this prompt" instruction. This is the running "next task"
> driver: execute exactly N next steps, report root cause before fix, verify
> with build/logs/preview, then bump minor version + changelog + release notes
> + pin version in root readme.

## What I want

1. Give me the **NEXT N STEPS — exactly N** — and for each one:
   1a) **Reasoning** — why this step, why now, what breaks if it's skipped.
   1b) **Time estimate** — realistic, not optimistic.
   1c) **What it unblocks** — the next thing that becomes possible.
2. Then list **every remaining item** after those so I can see the full picture.
   At the end of the task always bump the minor version, add changes log and
   update release notes, and pin that version in the root readme. Also save this
   prompt in `.lovable/prompts/` as `xx-next-task.md` and update it as "next
   task with number".

## Definition of done (non-negotiable)
- Read relevant files AND project memories — name exact files/functions/lines.
- Root cause in ONE sentence, before any fix.
- Fix = minimum correct change tied to that root cause (no symptom patch).
- Verified: build output, error logs, and/or preview — show before/after signal.
- Reported what changed and why.

## Hard rules
- STOP and read first. Root cause before fix. No symptom-patching.
- If unsure, say so. Go slow, go critical, go deep.

## Error logs & error management
- Read actual error logs FIRST. No logs = add logging at entry point, surface
  errors, never swallow. Confirm the log line fires after the change.

## Additional guideline check
- Coding tasks: `.lovable/coding-guidelines.md` + `spec/coding-guidelines/`.
- SEO tasks: `.lovable/seo-guidelines.md`.
- Verify existence first; skip silently if missing; folder-level wins on conflict.
