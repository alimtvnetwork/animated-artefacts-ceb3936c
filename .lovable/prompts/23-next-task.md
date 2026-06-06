# 23 — Next Task (v5)

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

## This iteration (v1.28.0)
No application error: the payload is the recurring driver prompt. Continued roadmap step 1 (LLM master guide / schema parity): after ZIP (v1.26.0) and visual export (v1.27.0), `LLM.md` still never explained the localStorage persistence model, so an LLM had no idea edits/themes live in storage keys rather than files. Added a "Persistence model" section documenting the four author-relevant keys with their constants + source files: `riseup.deck.draft.v1` (DRAFT_DECK_KEY), `riseup.deck.imported.v1` (IMPORTED_MANIFEST_KEY), `riseup.themes.custom.v1` (CUSTOM_THEMES_STORAGE_KEY), `riseup.theme.byDeck.v1` (STORAGE_KEY_BY_DECK). Followed `.lovable/coding-guidelines.md`; `spec/coding-guidelines/` + `.lovable/seo-guidelines.md` absent, skipped silently.
