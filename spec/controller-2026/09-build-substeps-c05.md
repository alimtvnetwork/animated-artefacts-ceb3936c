# Controller Build — C05 Broken Into 10 Code-Ready Sub-Steps (C05.1–C05.10)

Expands **C05 — "Fullscreen toggle + state sync"** into 10 concrete, ordered
sub-steps. Builds on C01–C04. Live equivalent: the fullscreen chip + handlers in
`ControllerBar.tsx` / `SlideDeckPage.tsx`.

| # | Sub-step | File | Reasoning | Time |
|---|----------|------|-----------|------|
| C05.1 | Create `useFullscreen()` → `{ isFullscreen, toggle, enter, exit }` | `src/slides/hooks/useFullscreen.ts` | One hook owns all Fullscreen API calls so the chip and the `F` key share identical behavior with no duplicate logic. | 30 m |
| C05.2 | Implement `enter()` via `document.documentElement.requestFullscreen()` | `useFullscreen.ts` | Requesting on the root element (not the scaled stage) keeps the whole deck chrome visible in fullscreen. | 15 m |
| C05.3 | Implement `exit()` via `document.exitFullscreen()` with guards | `useFullscreen.ts` | Guarding `fullscreenElement` before exiting avoids exceptions when already windowed. | 10 m |
| C05.4 | Subscribe to `fullscreenchange` → keep `isFullscreen` in sync | `useFullscreen.ts` | The user can exit via Esc/F11 outside the chip; listening keeps state and icon correct in every path. | 20 m |
| C05.5 | Wire the fullscreen chip; swap Maximize2 ↔ Minimize2 by state | `ControllerBar.tsx` | Visual feedback must always match actual fullscreen state, including external exits from C05.4. | 15 m |
| C05.6 | On enter: black backdrop behind the scaled stage | `SlideDeckPage.tsx` + `index.css` | A pure-black frame removes browser chrome glare and centers attention on the slide. | 20 m |
| C05.7 | Hide OS cursor after ~2s idle in fullscreen; restore on move | `SlideDeckPage.tsx` | A vanishing cursor keeps the projected stage clean; a `mousemove` timer restores it instantly. | 25 m |
| C05.8 | Bind `F` key → `toggle()` (matches chip exactly) | shortcut handler (C06) | Keyboard parity is a core presenter expectation; routing through the same `toggle` prevents drift. | 10 m |
| C05.9 | Feature-detect + vendor fallback → maximized CSS layout + toast | `useFullscreen.ts` | On unsupported browsers degrade to a maximized layout and explain via toast instead of silently failing. | 25 m |
| C05.10 | Tests: enter/exit, external Esc/F11 sync, icon swap, fallback path | `src/test/useFullscreen.test.ts` | Mock the Fullscreen API to lock all entry/exit paths (CT06 preview) against regressions. | 30 m |

**Subtotal (C05.1–C05.10): ~3.3 h** (within C05's ~1.5 h core + buffer for cursor-hide, fallback, and tests).

## Remaining items
1. **Build order:** C01–C04 (spec'd) → **C05** via C05.1–C05.10 → C06–C10 (~6.5 h remaining of the ~19.5 h build).
2. **Execute CT01–CT20** — verification + hardening after the code lands. (~18 h)
3. **Acceptance walk-through** — end-to-end presenter story, fix defects, flip the controller track to done.

Per-step breakdowns continue C-by-C on request (C06 next); beyond them only
writing the actual controller code and running the CT suite remain.
