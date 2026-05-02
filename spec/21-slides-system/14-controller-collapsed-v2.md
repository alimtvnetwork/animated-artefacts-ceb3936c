# 14 — Controller (Collapsed shape v2)

Supersedes the "single arrow" collapsed shape from `02-controller.md`.

## What changed

The collapsed controller now shows **two buttons** side by side instead of
one: `← prev` and `→ next`. This matches the ergonomics of every video
player and makes one-handed navigation possible without expanding the pill.

## Visual spec — collapsed

| Property | Value |
|----------|-------|
| Shape | Pill, `~96px × 48px`, `border-radius: 9999px` |
| Background | `var(--surface-2)` with `backdrop-blur(12px)`, `border: 1px solid hsl(var(--gold)/0.18)` |
| Opacity | `0.65` idle → `1` on hover |
| Padding | `4px 6px` |
| Layout | flex row, `gap: 2px`, both children `h-10 w-10 rounded-full` |
| Prev button | `<` chevron, `text-foreground/70`, hover `bg-gold/15 text-gold` |
| Next button | `>` chevron, `text-gold` (always — it's the primary action), hover `bg-gold/20` |
| Divider | none in collapsed state — the buttons sit flush |

## Visual spec — expanded

Unchanged from current implementation. See `02-controller.md`.

## Morph behavior

- Same `LayoutGroup id="controller"` + `motion.div layout` approach already
  in place. Width morphs from `~96px` collapsed → full pill width.
- The collapsed `prev` and `next` keep their `layoutId`s
  (`controller-prev`, `controller-next`) so they slide into place inside the
  expanded pill rather than fading out + back in.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`, `0.32s` (unchanged).

## Hover region

The invisible hover-bridge wrapper (already in place — `pl-4 pt-4`) stays.
The collapsed pill is wider than before (~96px vs 48px), so the wrapper's
horizontal padding can shrink to `pl-3` if the gap to the screen edge feels
cramped. Don't make it wider than necessary — the wrapper catches all
mouse-leave events.

## Keyboard

No change. All keyboard bindings remain as documented in `02-controller.md`.

## Migration note

Anywhere the docs say "single round 48×48px button with a gold → chevron",
treat that as **superseded** by this spec.
