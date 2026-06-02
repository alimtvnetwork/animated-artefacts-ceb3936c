# Controller Test & Verification Execution — Steps CT01–CT10

Design (100 steps) and implementation plan (C01–C10) are written. These are the
next 10 — the **test / verification** steps that prove the controller works once
C01–C10 are coded. Ordered to mirror the implementation groups A→J.

| # | Step | Verifies | Reasoning | Time |
|---|------|----------|-----------|------|
| CT01 | Scaffold Vitest + RTL with jsdom + portal/audio mocks | C01–C03 | The controller mounts via `createPortal` and owns audio; tests need a jsdom env, a portal root, and stubbed `HTMLMediaElement.play/pause` or every later test throws. Build the harness first. | 1 h |
| CT02 | Unit-test deck navigation + URL/title sync | C01 | `next/prev` clamping, `goTo` URL writes (replace vs push), and `document.title` formatting are the foundation; a bug here corrupts every downstream state. | 1 h |
| CT03 | Test the 8 position anchors + expand/tooltip derivation | C02 | Each anchor must produce correct offsets, expand axis, and tooltip side with no off-screen clipping. Position math is easy to regress and hard to spot by eye. | 1 h |
| CT04 | Test hover-reveal state machine + grace-delay collapse | C03 | Collapsed↔expanded must trigger only on pill hover (not stage activity) and stay open while a child menu is open. Verify the grace timer and focus stability. | 1 h |
| CT05 | Test navigation chips + inline slide-jump input | C04 | Prev/next bounds, click-to-input, Enter jump, Esc/blur cancel, and invalid-input revert. This is the controller's primary job and must be airtight. | 1 h |
| CT06 | Test fullscreen toggle + `fullscreenchange` sync | C05 | Mock the Fullscreen API; confirm icon swap and state stay correct whether toggled by chip, `F`, or external Esc/F11, plus the unsupported-browser fallback. | 0.75 h |
| CT07 | Test shortcut dispatch + input-focus guards | C06 | Every key in `SHORTCUTS` fires the right action, `/` opens help, and NO shortcut fires while an input/textarea/contenteditable owns focus. Guards are the highest-risk area. | 1 h |
| CT08 | Test first-run onboarding gating + re-trigger | C07 | Popup shows once (localStorage flag), dismiss paths all set the flag, teach-by-doing auto-advance works, and the menu re-trigger clears the flag. | 0.75 h |
| CT09 | Test theme-from-color engine + persistence priority | C08 | `createThemeFromColor` produces AA-contrast tokens; init priority (URL → per-deck → global → default) and dual-write persistence behave exactly as specified. | 1 h |
| CT10 | Test music hook + a11y/visual-regression + sign-off | C09–C10 | Music defaults OFF, `M` toggles, autoplay-rejection is handled, prefs persist; then run the a11y audit, snapshot all 8 positions in light/dark, and the full end-to-end presenter walk-through to flip the track to done. | 1.5 h |

**Subtotal (CT01–CT10): ~10 h.**

## Remaining items
1. **Implement C01–C10** — write the controller code (`src/slides/controls/*`). *Still the gating work.* (~19.5 h)
2. **Execute CT01–CT10** — run the suite, a11y audit, and visual-regression after the code lands. (~10 h)
3. **Acceptance walk-through** — end-to-end presenter story (CT10 / 100-step #100), fix defects, flip the controller track to done.

After CT10 the controller is fully built and verified. There are no further "next
10" documentation blocks for this track — only writing the code (C01–C10) and
running the verification (CT01–CT10) remain.
