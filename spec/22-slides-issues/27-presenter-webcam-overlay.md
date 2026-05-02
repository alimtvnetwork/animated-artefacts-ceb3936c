# 27 — Presenter webcam overlay (presenter-controlled, draggable)

**Reported / requested:** 2026-04-30 (presenter)
**Status:** spec-approved → implementing this loop.
**Related research:** [`spec/15-research/01-webcam-overlay.md`](../15-research/01-webcam-overlay.md)
(JSON-authored per-slide pinning — DIFFERENT scope; that one stays research-only).

---

## Verbatim ask

> "Add components that will have a button in the presenting section that
> the user can click that will actually add the webcam, and webcam will
> be visible on that box or border. It would be based on the theme that
> is running and that can be hidden as well. Hide with faded away, and
> also it would be a little bit of button that would be squiggling
> around, which if I open the camera, then I could also move it around,
> drag it. Implement this as a component."

## Scope (this loop)

- **One** new presenter-controlled component, mounted once at the deck
  root, NOT per-slide JSON.
- **One** new toggle button living in `ControllerBar` (or its sibling)
  with a subtle "squiggle" idle animation so the presenter notices it.
- The overlay is **draggable** (mouse + touch) anywhere on the stage.
- Theming via existing semantic tokens (`--gold`, `--cream`, `--ember`,
  `--background`, `--card`, `--border`) so it auto-adapts to whichever
  theme is active.
- **Show:** fade + slight scale-up. **Hide:** fade away (NOT remove
  permanently — stream stays alive ~10s for fast re-toggle, then
  releases).
- `prefers-reduced-motion: reduce` strips the squiggle and the fade
  scale; opacity-only transitions remain.

## Out of scope (deferred — covered by research doc 01)

- Per-slide JSON authoring of webcam position / zoom.
- PTZ constraints, face-tracking, auto-frame.
- Smooth translation between per-slide pinned positions on slide change.
- Audio capture (always `audio: false`).

## Component contract

### `<PresenterWebcamOverlay />`

Mounted once, at `SlideDeckPage` root (sibling of `ControllerBar`).
Reads its own state from a tiny zustand-free hook
(`usePresenterWebcam`) so the toggle button and the overlay can sit in
different React subtrees without prop drilling.

```ts
type WebcamState =
  | { phase: 'off' }
  | { phase: 'requesting' }            // permission prompt visible
  | { phase: 'denied'; reason: string } // user denied or error
  | { phase: 'on'; stream: MediaStream }
  | { phase: 'hidden'; stream: MediaStream; hiddenAt: number }; // faded-away, stream alive
```

Hidden→on transition reuses the same `MediaStream` instantly (no
re-prompt, no flash). After 10 s in `hidden`, the stream is stopped and
state transitions to `off`; next show requires a fresh `getUserMedia`
call but no permission re-prompt (browser remembers `granted`).

### `usePresenterWebcam()` hook

Singleton-ish state via React context (provider mounted in
`App.tsx` near the existing `TooltipProvider`):

```ts
const {
  state,           // WebcamState
  toggle,          // () => Promise<void>  — off→on or on/hidden→hidden/off
  show,
  hide,
  setPosition,     // (x: number, y: number) => void  — stage-coord px
  position,        // { x: number, y: number }
  size,            // { w: number, h: number }
} = usePresenterWebcam();
```

Position is persisted to `localStorage` (`riseup.webcam.pos`) so the
presenter's preferred corner survives reloads. Default position: top-right
of the 1920×1080 stage, inset 32px (`x = 1920-320-32`, `y = 32`),
matching the brand chrome inset rhythm.

### Drag math (the FitStage gotcha)

The deck uses `FitStage` which CSS-transform-scales 1920×1080 by
`min(viewportW/1920, viewportH/1080)`. Pointer deltas are in viewport
pixels, but our position is in **stage pixels**. The fix:

```ts
const scale = parseFloat(
  getComputedStyle(document.documentElement)
    .getPropertyValue('--stage-scale') || '1'
);
const dx = (e.clientX - dragStart.clientX) / scale;
const dy = (e.clientY - dragStart.clientY) / scale;
setPosition(initial.x + dx, initial.y + dy);
```

`FitStage` already publishes `--stage-scale` on `<html>` (we added
that earlier — see `src/slides/components/FitStage.tsx`). We piggyback
on it instead of re-measuring.

### Theming

All visual surfaces use semantic tokens — never raw hex:

| Surface          | Token                                    |
|------------------|------------------------------------------|
| Box border       | `hsl(var(--gold) / 0.6)` (1.5px)         |
| Box shadow / glow| `0 0 32px hsl(var(--gold) / 0.18)`       |
| Drag handle bg   | `hsl(var(--card) / 0.85)` backdrop-blur  |
| Handle text      | `hsl(var(--cream))` on dark, `--foreground` on light themes |
| "REC dot"        | `hsl(var(--ember))` (off → muted)        |
| Off button       | `hsl(var(--destructive))`                |

Light themes inherit the same tokens; `--gold` shifts to a darker mustard
in `github-light`/`macos-sonoma` so the border still has presence on
near-white surfaces (existing token behavior — no extra work needed).

### Squiggle button

The toggle button (a 32×32 chip with `Video`/`VideoOff` icon) gets a
**very subtle** rotate+translate keyframe when the camera is **off**
so the presenter notices it without it becoming distracting. It runs
3.6 s ease-in-out, infinite, with a 6 s offset so it pauses between
wiggles. When camera is on/hidden, the wiggle stops.

```css
@keyframes presenter-cam-squiggle {
  0%, 70%, 100% { transform: translate(0, 0) rotate(0deg); }
  78%           { transform: translate(-1px, 0) rotate(-3deg); }
  86%           { transform: translate(1px, -1px) rotate(2.5deg); }
  94%           { transform: translate(-0.5px, 0) rotate(-1.5deg); }
}
```

`prefers-reduced-motion: reduce` → animation disabled.

### Permission handling

1. On first toggle, call `navigator.permissions.query({ name: 'camera' })`
   if available. Skip if API unsupported (Safari < 16).
2. If `granted`: call `getUserMedia` immediately; transition to `on`.
3. If `prompt`: show a small "Requesting camera…" toast, then call
   `getUserMedia`. If user grants, transition to `on`. If user denies,
   transition to `denied` with `reason: 'permission'` and surface a toast.
4. If `denied` (already): show a toast pointing to the browser site
   settings; do not re-call `getUserMedia` (it would silently fail).

### HTTPS / sandbox

`getUserMedia` requires a secure context. The Lovable preview origin
(`*.lovable.app`) and the published URL are HTTPS. Localhost is also
treated as secure. No iframe sandbox flags strip media access by
default in our preview.

## Acceptance

- Camera button is visible in the controller area; idle squiggle is
  perceptible but not distracting (fires roughly every 6 s).
- Click camera button → permission prompt → fade-in webcam box at the
  stored position (default top-right, 320×180 source size scaled by
  stage).
- Drag handle moves the box; release pins it; reload preserves position.
- Click button again → fade-away (NOT removed); click within 10 s →
  instant fade-back without re-prompt.
- Theme switch with the camera open keeps the border/glow visually
  consistent (gold border on noir, mustard border on github-light).
- Reduced motion: no squiggle, no scale on enter/exit; opacity only.
- No raw hex in the component (lint-clean against
  `mem://design/light-theme-bg` semantic-token rule).

## Files

- `src/slides/components/PresenterWebcamOverlay.tsx` (new) — overlay UI.
- `src/slides/components/usePresenterWebcam.tsx` (new) — provider + hook.
- `src/slides/controls/PresenterWebcamButton.tsx` (new) — squiggling
  toggle button.
- `src/slides/controls/ControllerBar.tsx` — mount the new button next to
  Share.
- `src/pages/SlideDeckPage.tsx` — mount the overlay + provider.
- `src/App.tsx` — wrap the tree with `PresenterWebcamProvider`.
- `src/index.css` — `@keyframes presenter-cam-squiggle` + reduced-motion
  guard.
- `.lovable/memory/features/presenter-webcam-overlay.md` (new) —
  architecture rule.
- `.lovable/memory/index.md` — link the new memory.
- `.lovable/question-and-ambiguity/25-presenter-webcam-overlay.md` (new)
  — RCA-style log of decisions taken without asking.
- `.lovable/question-and-ambiguity/task-counter.md` — bump 24 → 25.
