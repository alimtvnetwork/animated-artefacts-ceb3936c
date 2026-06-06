# 04 — Next Task (Next N Steps, v5)

> Reusable operating prompt. Trigger phrases: `next task`, `next N steps`,
> `next 2 steps`, `next task with number`. Status: active.

## What I want

1. Give me the **NEXT N STEPS — exactly N** — and for each one:
   - **Reasoning** — why this step, why now, what breaks if it's skipped.
   - **Time estimate** — realistic, not optimistic.
   - **What it unblocks** — the next thing that becomes possible.
2. Then list **every remaining item** after those N so I can see the full picture.
3. At the end of the task always **bump the minor version**, add a changelog
   entry, update release notes, and (if possible) pin that version in the root
   `readme.md`.
4. Save/refresh this prompt in `.lovable/prompts/` as `04-next-task.md` and keep
   the prompts index (`.lovable/prompts.md` + `.lovable/prompt.md`) in sync.

## Definition of done (non-negotiable)

- [ ] Read the relevant files AND project memories — name the exact
      files/functions/lines involved.
- [ ] The **root cause** is written in ONE sentence, before any fix.
- [ ] The fix is the **minimum correct change** tied to that root cause — not a
      symptom patch.
- [ ] Verified: build output, error logs, and/or preview — show the before/after
      signal (failing → passing).
- [ ] Reported what changed and why.

## Hard rules

- **STOP and read first.** No skimming, no guessing from filenames.
- **Root cause before fix.** Trace the bug end-to-end. No assumptions.
- **No symptom-patching.** A try/catch, fallback value, or re-render hack used to
  hide the problem is a failure — start over.
- **If unsure, SAY SO.** Never fabricate.
- **Go slow. Go critical. Go deep.** Depth IS the job.

## Error logs & observability (always)

- Read the actual error logs FIRST — console, server/worker logs, build output,
  stack traces.
- If there are NO logs, that itself is the bug: add logging at the entry point
  and surface errors instead of swallowing them.
- Every fix must include proper error handling/observability.
- Confirm the relevant log line actually fires after the change.

## Additional instruction (follow if matches)

1. **Coding tasks** — check `.lovable/coding-guidelines.md` and
   `spec/coding-guidelines/`; follow every file present. If a coding task and
   neither exists, ask for one.
2. **SEO tasks** — check `.lovable/seo-guidelines.md`; follow if present.

Rule: verify the file/folder exists first; skip silently if missing. If multiple
guidelines apply, follow all; on conflict, prefer the folder-level spec and call
it out.
