# 02 — Controller Behavior

The slide controller is the only persistent UI overlay during a presentation.
It must stay out of the way until invited.

## Position

- **Top-right corner** of the viewport, fixed (new default, 2026-06-06 — see
  `.lovable/spec/commands/01-controller-top-right.md`).
- Margin: `top-6 right-6` (24px from each edge).
- All flyouts (Theme / Share / Deck manifest, and the presenter hamburger
  panel) open **downward** from the pill (`top-full` / `top: r.bottom + 8`),
  never upward.
- Tooltips use `side="bottom"` so they clear the viewport's top edge.
- One `ControllerBar` instance serves deck + fullscreen, so the anchor change
  applies in every context. `PresenterTopBar` is independent and already
  top-anchored.

## Two visual states

The controller now has **two distinct shapes**, not just opacity changes:

### Collapsed (default, idle)

A single round 48×48px button with a gold `→` chevron, at ~55% opacity.
- Click it to advance one slide.
- Hover it (or move the mouse anywhere on the slide) to expand into the full pill.
- Stays calm and unobtrusive so the slide breathes.

### Expanded (hover or recent activity)

The full pill: `◀ prev` · `N / total` (click → input → Enter to jump) · `▶ next` · divider · `grid` · `presenter` · divider · `manifest` · `share` · divider · `fullscreen`.

The pill stays open as long as the pointer is over it, the share or manifest popovers are open, or the mouse moved within the last ~2.2s.

## Transitions

- Collapsed ↔ Expanded uses Framer Motion `AnimatePresence` with `mode="wait"`.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` over 0.22s.
- Animates `opacity`, `scale`, and a small `x` offset — never the absolute position, so the pill never appears to "jump" toward the cursor.

The controller is **always mounted** (no hide-on-idle). This keeps keyboard shortcuts and the share/manifest menus always reachable; only the visual shape changes.

## Pill contents (left → right, expanded)

`◀ prev` · `N / total` · `▶ next` · `▦ grid` · `🖥 presenter` · `{} manifest` · `↗ share` · `⛶ fullscreen`

- `total` reflects only **active** slides (excludes `enabled: false` and click-reveal slides).
- `share` opens a small popover with two options: full deck URL or current-slide URL.
- `manifest` opens the Deck Menu (export / import / reset). See `06-deck-manifest.md`.
- `fullscreen` toggles the Fullscreen API on `document.documentElement`.
- `presenter` opens `/present` in a new window (sized 1280×800).

## Keyboard equivalents

| Key                          | Action                                  |
|------------------------------|-----------------------------------------|
| `→` / `Space` / `Enter`      | Next active slide                       |
| `←` / `Backspace`            | Previous active slide                   |
| `G`                          | Toggle grid overview                    |
| `Escape`                     | Exit fullscreen / close grid            |

Inputs in the slide indicator suppress all of the above while focused.

## Reduced motion

When `prefers-reduced-motion: reduce` is set, the opacity transition shortens
to ~0ms (already enforced globally in `index.css`). The pill still becomes
visible on hover/activity — only the animation duration changes.
