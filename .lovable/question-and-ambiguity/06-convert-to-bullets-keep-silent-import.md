# Q06 — Convert-to-bullets: keep silent legacy auto-import?

**Date:** 2026-04-28
**Task:** Implement an "Convert to bullets" action that splits prose into `description.bullets[]` for 3D slides and clears the legacy description.

## The ambiguity

The existing editor already silently auto-imported `body` → `bullets[]` on first open when bullets were empty. Two options:

1. **Replace** the silent import with the explicit "Convert to bullets" button (more deliberate, but legacy decks open with visible prose-warning instead of pre-split bullets).
2. **Keep both** — silent import for the empty-bullets common case, explicit button for everything else (bullets already exist + leftover body, or a new paste).

## Inference applied

Chose **option 2: keep both**.

### Why
- Silent import preserves zero-friction opening of legacy decks (no surprise regression for existing authors).
- Explicit button covers every case the silent path doesn't: bullets already populated but body still present, manual re-conversion, or after the user pasted prose into a body field via raw JSON.
- The button is conditional (`obj.body && obj.body.trim().length > 0`) so it never appears once prose is gone — no UI noise for clean decks.

### Behaviour
- Button **appends** fragments to existing bullets, capped at 6 total.
- Splits on `. ; , \n \r` (mirrors the renderer's `deriveBullets`).
- After successful conversion, `body` is dropped via `patch({ bullets })` (the existing `patch` always strips `body`).
- Edge cases: empty/whitespace prose, no usable fragments, bullet cap reached → toasts an explanation and no-ops.

## Reviewable later

If the user prefers a fully deliberate flow, remove the `if (!legacyImported && obj.body && bullets.length === 0)` block in `Description3DEditor` — the explicit button alone would then cover every case.
