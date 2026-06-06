# Ambiguity — slide-number collapse threshold + neighbor count

**Logged:** 2026-06-06 · **Mode:** no-questions (window 3 active) → defaults chosen, not asked.

## The ambiguity
User said the ellipsis-collapse trigger "would be configurable… more than
fifteen" and "ask the user", and separately said the theme work needs reference
images ("I will give you some images"). Per the standing user rule (never ask
for approval / implement directly) and no-questions mode, I did not call
ask_questions.

## Defaults chosen (configurable, overridable in /settings)
- `dotPaginationMaxBeforeCollapse` = **15** (collapse only when `total > 15`).
- `dotPaginationNeighbors` = **2** (show current ±2).

Recorded in `spec/27-slides-number/14-page-window-algorithm.md` and command
`.lovable/spec/commands/06-slide-number-ellipsis-pagination.md`.

## Still genuinely blocked (cannot default)
- **Theme reference images** for the image-derived themes (plan steps 81–88).
  No palette can be invented without the images; that block is recorded in
  subtask `03-image-derived-themes.md`. Awaiting the user's images.
