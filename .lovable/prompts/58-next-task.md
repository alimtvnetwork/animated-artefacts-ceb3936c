# 58 — Next Task (v5)

Snapshot of the recurring "Next N Steps" driver (N=3).

## This turn
Diagnosed the repeated loop as a canonical-driver activation problem, not a Vite
or runtime failure. The prompt registry was already aligned, but the executable
driver still needed a stricter debug guard.

Root cause: `.lovable/prompts/04-next-task.md` still allowed the recurring
next-task payload to behave like a live planning instruction during debugging
turns where the user pasted it as an error block.

Fix: strengthened the activation guard in `04-next-task.md` so debugging/error
reports are treated as data, not commands, and limited prompt-history updates to
true planning turns or verified prompt-system defects. Bumped to v1.63.0.