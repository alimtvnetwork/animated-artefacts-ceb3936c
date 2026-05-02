# 01 — StepsChain3D validation error scope

**Timestamp:** 2026-04-28
**Task counter:** 1/40

## Task context

User asked for a "clearer validation error that tells me exactly which fields
to use instead of `description.body` and provides a bullet[] example payload
for StepsChain3D." Currently `body` is **allowed** (legacy, auto-converted
via `deriveBullets()` v0.214) — so it never triggers a validation error
on its own.

## Specific question

Should the upgraded error message:
(a) only fire on truly unknown keys (e.g. `description: { text: "..." }`)
    and on missing-required scenarios — i.e. preserve auto-conversion?
(b) re-promote `body` to a hard error, breaking the v0.214 backward-compat
    decision? OR
(c) emit a non-blocking dev console warning whenever `body` is used
    AND upgrade the strict error message to include the example payload?

## Inferred decision

**Hybrid (a)+(c).** Keep `body` legal at the schema level (auto-conversion
intact). Upgrade the `.strict()` unknown-key message to name the four
allowed keys + ship a bullets[] example. Renderer already warns on
`body` use (StepsChain3DSlide.tsx). Best balance: clearer error when an
author types the WRONG field, no regression for legacy decks.

## Impact

Authors typing `description: { text, summary, content, body_text… }` get a
helpful error pointing at `bullets[]` with a copy-pasteable example.
Legacy `body` decks keep loading silently.

## Suggested clarification

Confirm option (a)+(c) is correct, or override to (b) if you want `body`
to fail hard at load time.
