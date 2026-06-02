# Controller Hardening, Release & Maintenance — Steps CT11–CT20

CT01–CT10 covered scaffolding and core verification. These are the next 10 — the
higher-risk integration, cross-environment, release, and maintenance steps that
make the controller production-safe and keep it healthy after it ships.

| # | Step | Reasoning | Time |
|---|------|-----------|------|
| CT11 | Add regression tests for every defect found in CT01–CT10 | Each bug fixed during verification needs a locking test or it silently returns on the next refactor. Cheapest insurance against repeat regressions. | 1 h |
| CT12 | Cross-browser matrix run (Chromium, Firefox, Safari/WebKit) | Fullscreen API, `prefers-reduced-motion`, and audio autoplay policies differ per engine. The controller must behave on unknown presentation hardware, not just the dev machine. | 1 h |
| CT13 | Responsive + compact-breakpoint pass on real viewports | Below ~640px the pill collapses to prev/indicator/next with the rest in the menu. Verify all 8 anchors stay on-screen and tap targets are usable on touch. | 0.75 h |
| CT14 | Touch / pointer interaction audit | Hover-reveal must have a tap-to-summon fallback on touch (no hover). Confirm chips, slide-jump input, and menus work with touch and stylus, not just mouse. | 0.75 h |
| CT15 | Performance-profile reveal animation + theme re-paint | The expand spring and a full theme token re-write can cause jank on weak machines. Profile to catch the "works but feels laggy" class before release. | 0.75 h |
| CT16 | Validate fallbacks when optional APIs are missing | Fullscreen unsupported → maximized CSS + toast; audio blocked → toast; localStorage disabled → in-memory prefs. The controller must degrade, never crash. | 0.75 h |
| CT17 | Accessibility deep audit (screen reader + keyboard-only) | Verify aria-labels/aria-pressed, focus order, visible focus rings, that tooltips/menus don't trap focus, and that the onboarding popup is announced and dismissible by keyboard. | 1 h |
| CT18 | Wire the suite into CI with a required pass gate | Tests only protect the controller if they run on every change. A required gate stops broken controller code from merging. | 0.5 h |
| CT19 | Update spec pack + memory to reflect shipped behavior | Sync `README` / 100-step doc and the controller memories (`mem://features/controller-hamburger`, `keyboard-shortcuts-dialog`) with what actually shipped, so the next agent rebuilds the right thing. | 0.75 h |
| CT20 | Final bug-fix sweep, release tag, and status flip to done | Reserve explicit time to fix whatever CT11–CT19 expose, confirm the acceptance walk-through is green, tag the release, and mark the controller track complete. | 0.75 h |

**Subtotal (CT11–CT20): ~8 h.**

## Remaining items
1. **Implement C01–C10** — write the controller code (`src/slides/controls/*`). *Still the gating work.* (~19.5 h)
2. **Execute CT01–CT20** — core verification, hardening, cross-browser, a11y, performance, CI. (~18 h total)
3. **Acceptance walk-through** — end-to-end presenter story, fix defects, flip the controller track to done.

With CT20 the controller documentation track is fully closed: design → build plan
→ verification → hardening → release → maintenance are all specified. There are no
further "next 10" blocks to write — only writing the code (C01–C10) and executing
the verification (CT01–CT20) remain.
