# 60 — Move php/ placeholder to legacy/

**Date:** 2026-06-02
**Context:** Root-cleanup reorg (see `.lovable/reorg-plan.md`, Batch 4).

## Decision
Moved the root `php/` folder to `legacy/php/`.

## Reasoning
- `php/` held only placeholder/stub files (`README.md`, `.gitkeep`,
  `index.php.placeholder`) — a reservation for a future PHP backend per an
  early architecture spec.
- It is **not** referenced by `src/`, `index.html`, `vite.config.ts`, or any
  build/test path (verified by repo-wide grep, excluding markdown).
- Keeping inert placeholders at the repo root violated the new convention
  ("root holds only config + entry + active top-level dirs").

## Reversibility
Fully reversible: `mv legacy/php php`. No code or config referenced the old
path, so nothing else changes.

## Ambiguity / open question
The app currently uses **Lovable Cloud / Supabase** patterns (not PHP). If the
PHP backend is truly abandoned, `legacy/php/` can be deleted outright in a later
pass. Left in `legacy/` (not deleted) to preserve the architectural intent until
the owner confirms.
