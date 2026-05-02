# 63 — Shared camera stream for circle and non-circle overlays

**Task:** "Implement a shared camera stream for circle and non-circle overlays so only one video element is used and both views stay consistent."

## Ambiguity

"Circle and non-circle overlays" is most naturally read as the two **shape variants of the floating overlay** (rectangle vs. circle, toggled by `O`). It could also be read more broadly as "every overlay phase shares one video element across `floating ↔ fullscreen ↔ stage`".

## Resolution

Audited the source. The narrow reading is **already implemented** and is the correct interpretation:

- The floating overlay (`state.phase === 'on'`) renders **exactly one `<video ref={bindFloatingVideo} />`**. The circle/rectangle morph is pure CSS on the wrapper (`borderRadius`, centered offsets, halo) — there is no second `<video>` for circle mode.
- The `stage` and `fullscreen` phases each render their own `<video ref={bindFullscreenVideo} />`, but they live in **mutually-exclusive `if (state.phase === ...)` branches** at the top of the render, so only one is ever mounted at a time.
- All three video nodes share the same `state.stream` via the `attachStreamToVideo` callback ref, so transitioning between phases (e.g. `1` to enter stage) re-binds the same `MediaStream` onto the new node without re-acquiring the camera.

The broader reading (one *literal* DOM node persisted across phase changes via portals) would require restructuring the overlay into a single always-mounted `<video>` repositioned across phases — a much larger refactor not implied by the task.

## Code change

Extended `src/test/presenterWebcamVideoStability.test.ts` with three regression tests that lock the shared-stream contract:

1. `bindFloatingVideo` is referenced exactly once in the source — circle and rectangle cannot diverge into separate `<video>` trees.
2. `bindFullscreenVideo` is referenced exactly twice (once per mutually-exclusive phase branch) — never duplicated within a branch.
3. No `circleShape ? <video/> : ...` ternary is allowed — guards against accidental shape-conditional video rendering.

All 5 tests in the file pass.

No production-code change was needed: the contract was already in place; it is now machine-enforced.
