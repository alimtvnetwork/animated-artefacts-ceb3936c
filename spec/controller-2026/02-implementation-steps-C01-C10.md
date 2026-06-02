# Controller Implementation Execution — Steps C01–C10

The 100-step design (`01-controller-100-steps.md`, groups A→J) is complete. These
are the next 10 — the **implementation** steps that turn that design into running
code, in dependency order. Each maps to a group of the 100-step guide.

| # | Step | Covers | Reasoning | Time |
|---|------|--------|-----------|------|
| C01 | Build deck nav foundation + URL/title sync | A (1–10) | Everything else drives off `useDeckNavigation` and the URL-as-source-of-truth. Getting `goTo/next/prev`, clamping, and `document.title` right first unblocks every other group. | 2 h |
| C02 | Portal mount + 8-position anchor system | B (11–22) | The controller must float above the scaled stage and work in any of the 8 anchors. Lock the portal, the position lookup, expand-direction, and tooltip-side derivation before building visuals. | 2 h |
| C03 | Hover-reveal pill shell + chip layout | C (23–36) | The collapsed↔expanded spring, hit-area, grace-delay collapse, and chip ordering are the core UX. Build the shell now so later chips just slot in. | 2.5 h |
| C04 | Wire navigation chips + inline slide jump | D (37–48) | Prev/next bounds, indicator, click-to-input jump, Enter/Esc/blur handling, and sub-step reveals. This is the controller's primary job. | 2 h |
| C05 | Fullscreen toggle + state sync | E (49–56) | Fullscreen API, icon swap, `fullscreenchange` listener, cursor-hide, and vendor fallback. Must stay in sync whether toggled by chip, `F`, or Esc/F11. | 1.5 h |
| C06 | Global shortcut handler + help dialog | F (57–68) | One `SHORTCUTS` source feeds both the window keydown handler (with input-focus guards) and the `/` Radix help dialog. Prevents drift and accidental nav while typing. | 2 h |
| C07 | First-run onboarding "story" popup | G (69–78) | Gated coachmark teaching the core keys (`←/→`, `Enter/Space`, `F`, `/`, `M`), with localStorage flag, ≤3 steps, teach-by-doing auto-advance, and menu re-trigger. | 2 h |
| C08 | Theme-from-color engine + persistence | H (79–90) | `createThemeFromColor(hex, mode)` writing HSL tokens on the deck root, contrast-picked fg, global + per-deck persistence, init priority order, and 2–3 example themes. | 2.5 h |
| C09 | Background music hook + chip | I (91–98) | `useDeckMusic` single looping audio, default OFF, `M` toggle, autoplay-rejection toast, volume/track examples, fade in/out, clean teardown, persisted prefs. | 1.5 h |
| C10 | a11y + visual-regression pass + sign-off | J (99–100) | Labels, focus rings, AA contrast in every example theme, snapshots of all 8 positions + light/dark, then the full end-to-end presenter walk-through to flip the track to done. | 1.5 h |

**Subtotal (C01–C10): ~19.5 h.**

## Remaining items
1. **Implement C01–C10** — write the controller code (`src/slides/controls/*`) following groups A→J. *Start at C01.* (~19.5 h)
2. **Wire example themes & tracks** (C08 step 90, C09 step 97) as small demos, not full libraries.
3. **Acceptance walk-through** (C10 / 100-step #100), then flip the controller track to done.

After C10 the controller is fully built and verified. There are no further "next
10" documentation blocks for this track — only writing the code (C01–C10) and the
acceptance walk-through remain.
