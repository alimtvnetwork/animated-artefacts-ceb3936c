# Test, Release & Maintenance Execution — Steps T21–T30

This is the next 10 after `12-test-execution-steps-T11-T20.md`. T01–T20 covered
scaffolding, automated coverage, integration, performance, and first sign-off.
T21–T30 cover regression-proofing, release, and post-release maintenance so the
camera feature stays healthy after it ships.

| # | Step | Reasoning | Time |
|---|------|-----------|------|
| T21 | Add regression tests for every defect found in T01–T20 | Each bug fixed during testing must get a locking test, or it silently returns on the next refactor. This is the cheapest insurance against repeat regressions. | 1 h |
| T22 | Cross-browser matrix run (Chromium, Firefox, Safari/WebKit) | `getUserMedia`, `FaceDetector`, and segmentation APIs differ per engine. Verifying the matrix prevents "works on my machine" failures during a live talk on unknown hardware. | 1 h |
| T23 | Wire tests into CI with required pass gate | Tests only protect the feature if they run automatically on every change. A required gate stops broken camera code from merging. | 0.5 h |
| T24 | Coverage audit + close gaps to target threshold | A coverage report surfaces untested branches (denied paths, fallbacks, unwind order) that manual reading misses, so we raise coverage where it actually matters. | 0.75 h |
| T25 | Snapshot/visual-regression baseline for the 4 surfaces | Overlay, tray, fullscreen, and stage-fill are visual; pixel/DOM baselines catch accidental layout drift that unit tests cannot see. | 1 h |
| T26 | Reduced-motion + prefers-contrast verification pass | The deck honors `prefers-reduced-motion` and contrast settings elsewhere; the camera must match so it never animates or glares against that preference. | 0.5 h |
| T27 | Memory-leak / track-cleanup soak test | Repeated acquire→stop→reacquire cycles can leak `MediaStreamTrack`s or RAF loops, degrading long presentations. A soak loop confirms clean teardown. | 1 h |
| T28 | Update spec pack + memory to reflect final shipped behavior | Specs (`00–07`) and `mem://features/webcam-halo-and-stage` must match the code that actually shipped, or the next blind agent rebuilds the wrong thing. | 0.75 h |
| T29 | Author presenter-facing quick reference (shortcuts cheat sheet) | The presenter needs a one-glance key map (`i`, `m`, `f`, `[`, `]`, `O`, `P`, `1`, `h`, `+/-`) so live control is muscle-memory, not guesswork. | 0.5 h |
| T30 | Final release sign-off, tag, and status flip to done | Reserve explicit time to confirm acceptance checklist green, tag the release, and mark the camera track complete in README/status docs. | 0.75 h |

**Subtotal (T21–T30): ~7.75 h.**

## Remaining items
1. **Implementation (files 01–05)** — build steps 1→30 in actual code. *Still not started.* (~16 h)
2. **Execute T01–T30** — automated tests, manual QA, performance, cross-browser, CI, and release hardening after implementation lands. (~25.75 h total)
3. **Acceptance sign-off** — run `07-acceptance-checklist-and-tests.md`, fix defects, flip status to done.

With T30 the documentation track is fully closed: scaffold → coverage →
hardening → release → maintenance are all specified. There are no further
"next 10" blocks to write — only writing the actual camera code (files 01–05)
and executing T01–T30 against it remain.
