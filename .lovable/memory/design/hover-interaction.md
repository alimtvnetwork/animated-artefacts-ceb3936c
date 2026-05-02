---
name: hover-interaction
description: Deck-wide reusable hover tokens (.lift-hover / .lift-hover-subtle) replacing all scale/zoom hovers
type: design
---

## Rule

NO scale-based hovers anywhere in the deck. Use the two reusable CSS
utilities defined in `src/index.css`:

| Class                  | Use on                                       | Effect |
|------------------------|----------------------------------------------|--------|
| `.lift-hover`          | Capsules, content CTAs                       | `translateY(-1.5px)` + gold-tinted drop shadow + subtle brightness. 280ms `var(--transition-smooth)`. |
| `.lift-hover-subtle`   | Controller buttons, ShareMenu items, chrome  | `translateY(-1px)` + neutral drop shadow. 240ms. No gold tint. |

Both:
- Never change scale (no zoom-in/zoom-out).
- Have an `:active` pull-down for tactile press feel.
- GPU-friendly (`will-change`).
- Collapse to no-op under `prefers-reduced-motion`.

## Why

User explicitly rejected the framer `whileHover: { scale: 1.04 }` zoom on
capsules — felt cheap. Drop-shadow lift reads as premium and stays calm.

## Authoring

When adding a new clickable element:
- Content / CTAs / capsules → `lift-hover`.
- Chrome / controls / menus → `lift-hover-subtle`.

Do NOT introduce one-off scale/zoom hovers. If a third interaction is
genuinely needed, add a new token here and document it — keep the deck's
interaction language consistent.

## Migration done

- `Capsule.tsx` — dropped framer `whileHover`/`whileTap`, now uses `.lift-hover`.
- `ControllerBar.tsx` — every button uses `.lift-hover-subtle`. Collapsed-mode button no longer scales.
- `ShareMenu.tsx` — both menu items use `.lift-hover-subtle`.
