# Update — ThemeMenu compaction

**Date**: 2026-05-03
**Scope**: `src/slides/controls/ThemeMenu.tsx`

## Change

Theme picker dropdown was overflowing its rounded container — labels and
descriptions clipped on narrow viewports. Menu rebuilt at a tighter scale.

| Token | Before | After |
|---|---|---|
| width | `w-72` | `w-64` |
| padding | `p-2` | `p-1.5` |
| label font | default (`~14px`) | `text-[12px]` + `truncate` |
| description font | `text-xs` | `text-[10.5px] leading-snug truncate` |
| icon size | `h-4 w-4` | `h-3.5 w-3.5` |
| swatch | `h-5 w-5` | `h-4 w-4` |

Visual rhythm preserved (rounded `controller-pill` shell, hover tint,
active check) — just denser.

## Acceptance

- Open theme menu at 1053×622 viewport → no horizontal clipping on any
  theme label.
- Hover/active states still legible — contrast not reduced.
