# Test & Hardening Execution — Steps T11–T20

This is the next 10 after `11-test-execution-steps-t01-t10.md`. These steps
cover the higher-risk integration, performance, fallback, and final sign-off
work that should happen after the initial automated test scaffold exists.

| # | Step | Reasoning | Time |
|---|------|-----------|------|
| T11 | Test persistence / restore behavior | The webcam is presenter-local runtime UI, but its local preferences (size, position, shape, phase where applicable) must restore predictably after refresh; otherwise users feel the feature is unstable even if video itself works. | 0.75 h |
| T12 | Test drag / resize boundary math on the 1920×1080 stage | The overlay must never drift off-stage or resize into unusable dimensions. Boundary bugs are common because fullscreen, stage-fill, tray, and regular overlay all use different geometry constraints. | 1 h |
| T13 | Test permission-denied, stop, and reacquire recovery paths | Real users often deny once, unplug a camera, or hard-stop with `i` and expect a clean re-request. This flow is easy to regress because the code crosses async browser APIs, local state, and track cleanup. | 1 h |
| T14 | Test exclusivity and unwind order for tray / fullscreen / stage modes | These modes must not stack incorrectly. `Esc`, `[`, `]`, `m`, and `1` need deterministic precedence so the presenter can recover instantly during a live talk. | 0.75 h |
| T15 | Test controller-button and page-level integration | The overlay is not isolated; it is mounted through the deck page and controlled from the presenter controller. Verify button wiring, visibility rules, and that navigation / share controls remain unaffected. | 1 h |
| T16 | Manual QA pass for visual states on real hardware | Automated tests do not reveal whether the camera feels visually balanced: circle vs rectangle, halo, stage-fill, fullscreen, and the v3 PNG-plate gold squircle rim (plate behind video + transparent mask crop, transparent interior) all need human inspection on an actual lens feed. Confirm the rim matches reference image 3 (thin rim, no opaque ring/fill). | 1 h |
| T17 | Performance-profile auto-frame and background effects | Face tracking, blur, masks, and compositing can quietly cause frame drops. Profiling catches the “works but feels laggy” class of bugs before release. | 1 h |
| T18 | Validate fallback behavior when optional APIs are missing | `FaceDetector`, segmentation helpers, or richer GPU paths may be absent. The feature must degrade to plain video instead of blanking, crashing, or trapping the user in a broken mode. | 0.75 h |
| T19 | Accessibility / interaction audit for shortcuts and focus guards | Shortcuts must not fire while typing, controls need labels/tooltips, and focus behavior must stay predictable. This prevents presenter controls from interfering with the rest of the deck UI. | 0.75 h |
| T20 | Final bug-fix sweep, checklist sign-off, and status update | Reserve explicit time to fix whatever T11–T19 expose, then mark the acceptance checklist complete and update README / status docs so the spec pack reflects reality. | 1 h |

**Subtotal (T11–T20): ~9 h.**

## Remaining items
1. **Implementation (files 01–05)** — build steps 1→30 in actual code. *Still not started.* (~16 h)
2. **Execute T01–T20** — automated tests, manual QA, performance pass, and fallback verification after implementation lands. (~18 h total)
3. **Acceptance sign-off** — run `07-acceptance-checklist-and-tests.md`, fix defects, and flip status to done.

After T20, there are no further “next 10” documentation blocks left in this
camera spec track — only code implementation and verification execution remain.