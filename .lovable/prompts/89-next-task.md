# Next 2 Steps or Tasks (v5)

## What I want

1. Give me the **NEXT N STEPS — exactly N** — and for each one:
   1a) **Reasoning** — why this step, why now, what breaks if it's skipped.
   1b) **Time estimate** — realistic, not optimistic.
   1c) **What it unblocks** — the next thing that becomes possible.

2. Then list **every remaining item** after those 3 so I can see the full picture. At the end of the task always bump the minor version, add changes log and update release notes and if possible pin that version in the root readme file. And also save this prompt in the .lovable folder in the prompts folder for known as 'xx-next-task.md' and update it as 'next task with number'

## Definition of done (non-negotiable)

You are NOT done until all of these are true:
- [ ] You have actually read the relevant files AND the project memories — and you can name the exact files/functions/lines involved.
- [ ] The **root cause** is written in ONE sentence, before any fix.
- [ ] The fix is the **minimum correct change** tied to that root cause — not a symptom patch.
- [ ] You **verified** it: build output, error logs, and/or preview — and you show the before/after signal (failing → passing).
- [ ] You reported what changed and why.

## Hard rules

- **STOP and read first.** No skimming, no guessing from filenames.
- **Root cause before fix.** Trace the bug end-to-end.
- **No symptom-patching.**
- **If you're unsure, SAY SO.**
- **Go slow. Go critical. Go deep.**

## Additional Instruction

Before executing, check the task type and follow the relevant guidelines if they exist (skip silently if the file is missing):

1. **Coding tasks**: `.lovable/coding-guidelines.md` and `spec/coding-guidelines/`.
2. **SEO tasks**: `.lovable/seo-guidelines.md`.

Rule: verify the file/folder exists first. Prefer folder-level spec on conflict.

---

## Checkpoint state (89)

Plan `06` (spec/2096-steps-slide): files `00`–`15` complete. `14-implementation-checklist.md`
(build order: scaffold → hook → data-state → handle → tokens → reduced-motion →
a11y → sound) and `15-css-recipes.md` (connector glow, depth-without-scale,
blur ramp, capsule tones, reduced-motion override) authored this iteration.
Version `1.94.0`.

### Next 2 steps
1. `16-worked-example.md` — full annotated 4-step deck spec end-to-end.
2. `17-common-mistakes.md` — anti-patterns (inline hex, scale-reflow, silent catch).

### Remaining
Plan 06 files `16`–`18` (worked-example, common-mistakes, acceptance-and-qa) +
step 30 self-audit. Carryover plan `05-slide-options-themes-and-number-controller`.
