# Implementation Execution — Steps I01–I10

The documentation tracks are complete: build steps 1–30 (files `08–10`) and test
steps T01–T30 (files `11–13`). The genuine remaining work is **writing the actual
camera code**. These 10 steps turn files `01–05` of the spec into running code, in
dependency order (state → render → controls → autoframe → backgrounds).

| # | Step | Reasoning | Time |
|---|------|-----------|------|
| I01 | Create `usePresenterWebcam` context + provider skeleton | Everything else depends on the phase state machine (`off · requesting · on · tray · fullscreen · stage · denied`). Build the context, storage keys, and provider wrapping first so other modules have something to consume. | 2 h |
| I02 | Implement `getUserMedia` acquire / hard-stop / reacquire actions | The core value is live video. Wire acquire (request → on), hard-stop on `i` (stop all tracks → light off), and clean reacquire. Track cleanup must be correct here or every later test fails. | 2 h |
| I03 | Implement size / position / shape persistence | Restore size, position, and circle/rectangle shape from storage so the overlay feels stable across refreshes. Depends on I01's storage keys. | 1 h |
| I04 | Build `PresenterWebcamOverlay` regular surface + video binding | Render the floating overlay, bind the `MediaStream` to the `<video>`, and apply size/shape. This is the first visible result and unblocks manual checking. | 2 h |
| I05 | Add drag + resize with stage-boundary math | Make the overlay draggable and resizable within the 1920×1080 stage, clamping to bounds. Geometry must be shared cleanly with the other surfaces. | 1.5 h |
| I06 | Implement tray, fullscreen, and stage-fill surfaces + unwind order | Add the remaining three surfaces with deterministic precedence for `Esc`, `[`, `]`, `m`, `1` so modes never stack incorrectly. Depends on I04/I05 geometry. | 2 h |
| I07 | Wire keyboard shortcuts + input-focus guards | Implement the full v4 map (`i/m/f/+/-/Esc/h/1/O/P/[/]`) with guards so keys never fire while typing. Reuses the single `SHORTCUTS` source. | 1.5 h |
| I08 | Implement `useAutoFrame` FaceDetector center-stage hook | Add face auto-framing (`f`) with graceful fallback when `FaceDetector` is absent, so the feature degrades to plain video instead of breaking. | 2 h |
| I09 | Add squircle background plates, halo, and circle shape | Compose the decorative squircle plates (assets `02–04`), the `h` halo (default OFF), and the `O` circle toggle per `05-backgrounds-and-shapes.md`. | 1.5 h |
| I10 | Mount provider + overlay + controller button into the app | Wrap the tree in `<PresenterWebcamProvider/>`, mount `<PresenterWebcamOverlay/>` in the deck page, and wire the controller chip/dropdown. Makes the feature live end-to-end. | 1 h |

**Subtotal (I01–I10): ~16.5 h.** This matches the ~16 h implementation roll-up
in `10-build-log-steps-21-30.md`.

## Remaining items
1. **Implement I01–I10** — write the actual camera code (files 01–05). *Start here.* (~16.5 h)
2. **Execute T01–T30** — run the automated suite, manual QA, performance, cross-browser, CI, and release hardening against the new code. (~25.75 h)
3. **Acceptance sign-off** — run `07-acceptance-checklist-and-tests.md`, fix defects, flip status to done.

After I10 the camera is fully built and ready for the T01–T30 verification pass.
There are no further documentation "next 10" blocks — implementation (I01–I10)
followed by verification (T01–T30) is the entire remaining path to done.
