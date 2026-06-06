# Command — Controller anchored top-right

**Command (verbatim):** "put the controller in the top right corner, up top."

**Scope:** Slide controller chrome (`ControllerBar.tsx`) across deck view, presenter view, fullscreen.

**When it applies:** Default controller position becomes **TopRight** instead of BottomCenter/BottomRight. Hover-reveal + collapsed/expanded behavior is unchanged; only the anchor + popover direction (popovers now open downward) move.

**Notes:**
- Update memory `Core` line (controller position default) once implemented.
- Keep position configurable; TopRight is the new default.
