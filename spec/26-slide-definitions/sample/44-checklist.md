# 44 — ChecklistSlide (sample)

**Type:** `ChecklistSlide` · **Spec:** [`spec/21-slides-system/62-checklist-slide.md`](../../21-slides-system/62-checklist-slide.md)

## Narrow idea

> Presenter ticks items off live. Progress bar shows how far through they are.

## Why this slide

Resolves ambiguity #32 (collapsible sections + per-item expand/collapse +
confirm-as-done progress) by picking the **audience-facing slide-type
surface**. Other candidate surfaces (authoring inspector, docs TOC,
release pre-flight) were rejected.

## Authoring rules

- **2–7 items** (zod) and `densityCheck.capItems = 7` (Narrow Idea rule).
- `text` is keyword-first — no full sentences.
- `detail` is optional and limited to 120 chars; renders as a single
  expanded line under the row.
- `capsule` (optional) gets one of the 9 deck capsule colors.

## Behaviour

| Trigger              | Effect                                                |
| -------------------- | ----------------------------------------------------- |
| Click row            | Toggle done — updates progress bar.                   |
| Click chevron        | Expand/collapse `detail`.                             |
| `Space` / `Enter`    | Toggle done on focused row.                           |
| `↑↓←→`               | Roving tabindex.                                      |
| Reduced motion       | No collapse animation; instant show/hide; bar snaps.  |

State is **per-session** — no localStorage, no URL hash.
