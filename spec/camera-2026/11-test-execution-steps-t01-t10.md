# Test & Acceptance Execution — Steps T01–T10

All 30 build-log steps (files 08–10) are documented. The "next 10" are the
**verification / execution** steps that turn file `07`'s acceptance checklist
into runnable Vitest specs + manual QA. Each has reasoning + time.

| # | Step | Reasoning | Time |
|---|------|-----------|------|
| T01 | Scaffold Vitest + RTL config for the camera module | Need an isolated harness before any assertion; jsdom + fake `getUserMedia` mock so the state machine can run headless. | 0.5 h |
| T02 | Mock `navigator.mediaDevices.getUserMedia` & `MediaStreamTrack` | The hook's `off → requesting → on` path depends on these; a controllable mock lets us force grant/deny and assert track `.stop()` calls. | 0.5 h |
| T03 | Unit-test the state machine transitions | Core risk area: assert every edge (off↔requesting↔on↔tray↔fullscreen↔stage↔denied) and that `i` fully stops tracks (camera light off). | 1.5 h |
| T04 | Test keyboard shortcut dispatch | Verify `i/m/f/+/-/Esc/h/1/O/P/[/]` map to the right actions and respect input-focus guards. | 1 h |
| T05 | Test auto-frame / face-tracking math | Pure functions (bounding-box → transform); assert framing stays within bounds and degrades gracefully when no face. | 1 h |
| T06 | Test overlay rendering & shape/halo toggles | Snapshot circle vs rect, halo on/off, stage-fill; assert `prefers-reduced-motion` disables transitions. | 1 h |
| T07 | Test background/blur surface compositing | Confirm canvas pipeline picks correct source and falls back cleanly when WebGL/segmentation unavailable. | 1 h |
| T08 | Wire acceptance checklist items to assertions | Map each done-criterion in `07` to a named test so coverage is traceable 1:1. | 0.5 h |
| T09 | Manual QA pass on real device | Automated mocks can't catch camera-light behavior, latency, lens framing — verify on actual hardware across the 7 phases. | 1 h |
| T10 | Fix failures + finalize coverage report | Buffer for defects surfaced by T03–T09; produce coverage summary and sign off. | 1 h |

**Subtotal (T01–T10): ~9 h.**

## Remaining items
1. **Implementation (files 01–05)** — build steps 1→30 in actual code. *Not yet started.* (~16 h, per file 10 roll-up.)
2. **T01–T10 above** — run after implementation lands. (~9 h)
3. **Sign-off** — README status flip to "done" once acceptance checklist passes.

This is the first verification block. Continue with
`12-test-execution-steps-t11-t20.md` for the next 10 execution / hardening
steps.
