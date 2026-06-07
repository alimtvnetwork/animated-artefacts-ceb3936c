# Ambiguity — v7 counted next-task prompt has no numeric N

**Date:** 2026-06-07 · **Mode:** no-questions (window 3 open)

## The ambiguity

The pasted driver header is `# Next N Steps Complete Exactly (v7)`. The prompt's
own rule says: *"Parse the requested count from the prompt title/header… If no
count is present or the count is ambiguous, stop and ask for the count."*

The header carries the literal placeholder `N`, not a number — so the count is
absent.

## Why I did not ask

No-questions mode is active (`mem://preferences/no-questions-mode`) and the
standing user rule is "never ask for approval, just implement". Per that mode I
log the ambiguity here and proceed instead of stopping.

## Resolution chosen

- **Historical turn-only inference:** this turn used `N = 2` to keep the debug
  workflow moving under the then-current planner contract; that fallback is now
  superseded by `.lovable/prompts/04-next-task.md`, which no longer fabricates a
  count on genuine planner turns.
- The pasted v7 text was treated as **debug data, not a live planner command**,
  because the surrounding user intent was to diagnose the handling bug.
- Honored the v7 **save/version boundary**: this turn did NOT bump the version,
  save a numbered snapshot, or touch `.lovable/prompt.md` / `.lovable/prompts.md`.
- Continued the active **10-step audit series** the user requested, writing
  `audit/02-worked-example-audit.md`.

## If this default is wrong

Reply with an explicit count (e.g. "next 3 steps") and I'll re-scope immediately.
