# Slides Controller — 100-Step Blind-AI Implementation Guide

This is the canonical, self-contained build order for the **slide controller**.
Follow the steps in order. Each step is small, testable, and assumes **no prior
context**. Code blocks are illustrative (React + TypeScript + Tailwind with HSL
design tokens); adapt names to your codebase. The controller must work mounted in
**any position** (top, bottom, any corner/edge), reveal on hover, drive
navigation + fullscreen, theme from a single color, show a **first-run
onboarding popup**, and offer a **background-music on/off** toggle.

Legend for groups:
- **A. Foundations** (1–10)
- **B. Position & mounting anywhere** (11–22)
- **C. Hover-reveal pill UI** (23–36)
- **D. Navigation & slide jump** (37–48)
- **E. Fullscreen** (49–56)
- **F. Keyboard shortcuts** (57–68)
- **G. First-run onboarding popup ("story")** (69–78)
- **H. Theming from a single color** (79–90)
- **I. Background music on/off** (91–98)
- **J. Polish, a11y & sign-off** (99–100)

---

## A. Foundations (1–10)

1. **Define the slide model.** Each deck is an ordered array of slides; a slide
   has at least `{ id, title }`. The controller never mutates slide content — it
   only changes *which* slide and *what chrome* is shown.

2. **Pick the source of truth for the current slide.** Use the **URL**: route
   `/N` (1-based) or `?slide=N`. The URL is authoritative for which slide shows;
   React state holds everything else (hover, dialogs, music).

3. **Create a `useDeckNavigation()` hook** exposing `{ current, total, goTo(n),
   next(), prev() }`. `next`/`prev` clamp to `[1, total]`. `goTo` updates the URL
   with `history.replaceState` (editor) or `pushState` (pure presentation).

4. **Sync `document.title`** on every slide change to `` `${current}/${total} —
   ${slide.title}` `` so tabs and screen recordings are self-describing.

5. **Decide mount strategy.** The controller renders via `createPortal` into
   `document.body` so it floats above the scaled stage and is never clipped by
   the slide's `overflow: hidden` wrapper.

6. **Define the controller's public props** (one component, many contexts):
   `{ current, total, onPrev, onNext, onJump, isFullscreen, onToggleFullscreen,
   onToggleGrid, position, music }`.

7. **Create design tokens** in `index.css` as HSL custom properties:
   `--ctrl-bg`, `--ctrl-fg`, `--ctrl-border`, `--ctrl-accent`, `--ctrl-muted`.
   Never hardcode hex in the component — always `hsl(var(--ctrl-*))`.

8. **Add a z-index token** `--z-controller` (e.g. `60`) above slides but below
   modal dialogs (`--z-modal: 80`). Document the stack so future overlays slot in
   correctly.

9. **Respect `prefers-reduced-motion`.** Read it once into a `reduceMotion`
   boolean; every animation in this guide must be instant (no transition) when
   it is true.

10. **Add a feature flag / props guard.** The controller should render nothing
    harmful if `total < 1`. Guard early returns so an empty deck can't crash.

---

## B. Position & mounting anywhere (11–22)

11. **Define a `ControllerPosition` union:** `'TopLeft' | 'TopCenter' |
    'TopRight' | 'BottomLeft' | 'BottomCenter' | 'BottomRight' | 'LeftCenter' |
    'RightCenter'`. Default `'BottomCenter'`.

12. **Map each position to fixed-offset CSS.** Use a lookup object returning
    `{ top, bottom, left, right, transform }`. Example:
    ```ts
    const POS = {
      BottomCenter: { bottom: 24, left: '50%', transform: 'translateX(-50%)' },
      BottomRight:  { bottom: 24, right: 24 },
      TopCenter:    { top: 24, left: '50%', transform: 'translateX(-50%)' },
      LeftCenter:   { top: '50%', left: 24, transform: 'translateY(-50%)' },
      // …all 8
    } as const;
    ```

13. **Apply position via inline style** on the portal root, not Tailwind classes,
    so any of the 8 anchors works without a class explosion.

14. **Make safe-area aware.** Add `env(safe-area-inset-*)` to offsets so the pill
    never hides under notches or rounded screen corners.

15. **Decide expand direction from position.** A bottom pill expands upward on
    hover; a top pill expands downward; left/right edges expand inward. Derive an
    `expandAxis` from the anchor.

16. **Decide tooltip side from position.** Tooltips must open *away* from the
    screen edge (a bottom pill shows tooltips above). Compute `tooltipSide` from
    the anchor.

17. **Persist the chosen position** in `localStorage` (`ctrl.position.v1`) so a
    presenter's preference survives reloads.

18. **Allow runtime reposition** (optional): a small drag handle or a setting in
    the menu cycles through anchors. Clamp to the 8 presets — do not allow
    free-floating to keep layout predictable.

19. **Handle orientation/resize.** On `resize`, re-read viewport; offsets are
    fixed so nothing recomputes, but verify the pill stays fully on-screen at
    very small widths (collapse to icon-only).

20. **Provide a compact breakpoint.** Below ~640px viewport, show only
    prev / indicator / next and move the rest into the menu.

21. **Test all 8 anchors** by flipping the `position` prop; confirm reveal
    direction, tooltip side, and no clipping for each.

22. **Document the anchor contract** in a comment so future agents pass a valid
    `ControllerPosition` and know the default is `BottomCenter`.

---

## C. Hover-reveal pill UI (23–36)

23. **Two visual states:** *collapsed* (a single faint chip at ~55% opacity) and
    *expanded* (the full pill). Default is collapsed.

24. **Expansion is hover-only.** Mouse activity elsewhere on the stage must NOT
    expand it — only pointer-enter on the pill's hover zone does.

25. **Add a hover hit-area** slightly larger than the collapsed chip so it's easy
    to summon without precise aiming.

26. **Animate expand/collapse** with a spring (scale + width) unless
    `reduceMotion`, then snap instantly.

27. **Build the pill container:** rounded-full, `bg-[hsl(var(--ctrl-bg))]`,
    `border border-[hsl(var(--ctrl-border))]`, subtle shadow, `backdrop-blur`.

28. **Lay out chips in order:** prev · slide-indicator · next · overview ·
    presenter · share · theme · music · fullscreen · menu.

29. **Each chip is a `<button>`** with an icon, an accessible `aria-label`, and a
    styled Tooltip (not native `title`).

30. **Collapsed state shows one affordance** — typically the "next" arrow — at
    reduced opacity, hinting interactivity without drawing focus.

31. **Keep focus stable.** Avoid focus-trap components in the pill (a Radix
    dropdown focus trap can collapse the pill on click); prefer a hover-driven
    custom panel for the overflow menu.

32. **Auto-collapse on pointer-leave** after a short grace delay (~400ms) so the
    pill doesn't vanish while the user moves between chips.

33. **Keep the pill visible while a child menu/dialog is open**, even if the
    pointer leaves; collapse only after the menu closes.

34. **Icon set:** use a consistent icon library (e.g. lucide) — ChevronLeft/Right
    for nav, Maximize2/Minimize2 for fullscreen, Music/Music-off, Palette,
    LayoutGrid, Share2, Menu.

35. **Hover-reveal must not steal pointer events** from the slide when collapsed;
    set `pointer-events` only on the actual hit-area.

36. **Snapshot the collapsed and expanded looks** for visual regression later
    (step 99).

---

## D. Navigation & slide jump (37–48)

37. **Prev chip → `onPrev()`**, disabled (dimmed, `aria-disabled`) on slide 1
    unless the deck is set to loop.

38. **Next chip → `onNext()`**, disabled on the last slide unless looping.

39. **First/last chips (optional):** ChevronsLeft/Right jump to slide 1 / total.

40. **Slide indicator** shows `current / total` centered between the arrows.

41. **Click indicator → inline number input.** Replace the label with a small
    text input focused and selected, placeholder = current number.

42. **Enter in the input → `onJump(n)`**, clamped to `[1, total]`; invalid input
    reverts to the label without navigating.

43. **Esc in the input → cancel** and restore the label.

44. **Blur the input → cancel** (treat like Esc) so a stray click doesn't trap
    the presenter.

45. **Animate slide transitions** through the deck's transition system; the
    controller only triggers navigation, it does not own the animation.

46. **Support sub-step reveals.** If a slide has staged reveals, `next` advances
    the step first and only moves to the next slide after the last step; `prev`
    reverses. Encode step in URL (`/N/step`).

47. **Update URL + title** on every navigation (steps 2 & 4).

48. **Test edge cases:** first/last bounds, rapid prev/next, jump to out-of-range
    number, jump while a dialog is open.

---

## E. Fullscreen (49–56)

49. **Fullscreen chip → `onToggleFullscreen()`** using the Fullscreen API:
    `document.documentElement.requestFullscreen()` / `document.exitFullscreen()`.

50. **Swap the icon** Maximize2 ↔ Minimize2 based on `isFullscreen`.

51. **Listen to `fullscreenchange`** to keep `isFullscreen` state in sync when
    the user exits via the browser (Esc/F11) instead of the chip.

52. **On entering fullscreen:** black background behind the stage, hide the OS
    cursor after ~2s of inactivity, keep the controller hover-reveal working.

53. **Esc exits fullscreen** (browser default) — make sure your Esc handler does
    not double-handle and close something else unexpectedly.

54. **Guard vendor prefixes** / unsupported browsers: feature-detect
    `requestFullscreen`; if absent, fall back to a maximized CSS layout and a
    toast explaining true fullscreen is unavailable.

55. **Bind the `F` key** to toggle fullscreen (see shortcuts section), matching
    the chip behavior exactly.

56. **Test:** enter via chip, exit via Esc, exit via F11, re-enter — state stays
    consistent and the cursor/cursor-hide resets correctly.

---

## F. Keyboard shortcuts (57–68)

57. **Create ONE shortcuts source of truth** — a `SHORTCUTS` array grouped by
    section. Both the live key handler and the help dialog read from it so they
    never drift.

58. **Core navigation keys:** `→` / `Space` / `Enter` = next; `←` / `Backspace`
    = previous. These are the "core buttons" a first-time user must learn.

59. **`F` = toggle fullscreen.** `G` = toggle overview grid. `Esc` = exit
    fullscreen / close any open overlay.

60. **`/` opens the keyboard map dialog** (single press, no Shift). `Esc` closes.

61. **Quick-jump:** typing digits `0–9` builds a pending number; `Enter` jumps;
    `Backspace` deletes a digit; `Esc` cancels the pending jump.

62. **`M` = toggle background music** (see section I). Document it in `SHORTCUTS`.

63. **Input-focus guard.** Ignore shortcuts when the event target is an
    `<input>`, `<textarea>`, `[contenteditable]`, or when a modal owns focus —
    so typing a slide number or notes never triggers navigation.

64. **Attach one global `keydown` listener** (window-level) inside a `useEffect`;
    clean it up on unmount. Avoid per-chip listeners.

65. **Prevent default** only for keys you handle (e.g. Space scrolling) to avoid
    breaking native behavior elsewhere.

66. **Build the help dialog** from `SHORTCUTS`: a Radix `Dialog` with grouped
    rows of `<kbd>` chips + labels.

67. **Reuse `SHORTCUTS` in the overflow menu** ("Keyboard map" item) so there are
    three ways in: `/`, the menu, and the first-run popup.

68. **Test every key** with and without an input focused; confirm guards block
    navigation while typing.

---

## G. First-run onboarding popup ("story") (69–78)

69. **Goal:** the first time a user opens the deck, show a friendly popup that
    teaches the **core keys**: `←/→` to move, `Enter`/`Space` next, `F`
    fullscreen, `/` for all shortcuts, `M` for music.

70. **Gate it on a flag** `ctrl.onboarded.v1` in `localStorage`. If unset, show
    the popup once; set it when the user dismisses or completes it.

71. **Design as a centered coachmark card** (not a blocking modal if possible):
    title "How to drive this deck", a compact key legend, and a "Got it" button.

72. **Render the legend from `SHORTCUTS`** core group so it never goes stale.
    Show keys as `<kbd>` chips: `←` `→` `Enter` `Space` `F` `/` `M`.

73. **Optional multi-step "story".** Step 1: navigation (`←/→`). Step 2:
    fullscreen (`F`). Step 3: shortcuts (`/`) and music (`M`). "Next" advances;
    "Skip" dismisses. Keep it ≤3 steps so it's not annoying.

74. **Auto-advance on action (delightful):** if the user actually presses `→`
    while the popup is open, advance the story step — teaching by doing.

75. **Respect reduced motion** — no confetti/slide animations when set; just
    fade or show instantly.

76. **Dismiss paths:** "Got it" button, `Esc`, or clicking the backdrop. Any
    dismissal sets the onboarded flag.

77. **Re-open on demand.** Add a "Show intro again" item in the overflow menu
    that clears the flag and re-shows the popup, so presenters can demo it.

78. **Test:** clear `localStorage`, reload → popup appears; dismiss → never
    reappears; menu re-trigger works; keys still work while it's open.

---

## H. Theming from a single color (79–90)

79. **Principle:** a theme is a set of **HSL** tokens. You can derive a whole
    usable theme from **one brand color** plus a light/dark choice — no need to
    import full palettes.

80. **Store the brand color as HSL parts** `--brand-h`, `--brand-s`, `--brand-l`
    so you can compute derivatives by adjusting H/S/L numerically.

81. **Derive accent + states:** accent = brand; hover = `l - 6%`; active =
    `l - 12%`; subtle = `s * 0.4, l 92%` (light) or `l 18%` (dark).

82. **Derive neutrals from the brand hue** (low saturation) so grays feel
    cohesive: `--ctrl-bg`, `--ctrl-fg`, `--ctrl-border`, `--ctrl-muted` all share
    `--brand-h` at low `s`.

83. **Pick foreground by contrast.** Compute relative luminance of the brand
    color; choose near-black or near-white text token to keep WCAG AA contrast.

84. **Define two base modes** (light/dark) as token sets; the brand color overlays
    both. Example:
    ```css
    :root { --ctrl-bg: 0 0% 100%; --ctrl-fg: 0 0% 10%; }
    .dark { --ctrl-bg: 0 0% 8%;  --ctrl-fg: 0 0% 96%; }
    [data-theme] { --ctrl-accent: var(--brand-h) var(--brand-s) var(--brand-l); }
    ```

85. **Write a `createThemeFromColor(hex, mode)` helper** that converts hex→HSL,
    sets the brand parts, and returns a token object to apply on a wrapper via
    inline `style` or a `data-theme` attribute.

86. **Apply themes by writing CSS vars** on the deck root, not by swapping
    classes per component. One write re-themes everything.

87. **Persist theme** globally (`theme.v1`) AND per-deck (`theme.byDeck.v1`, a
    slug→themeId map) so re-opening a deck restores its last theme.

88. **Resolve initial theme by priority:** URL `?theme=` → per-deck pin → global
    slot → default. Document this order.

89. **Theme menu chip** opens a small panel: a few presets + a color picker that
    calls `createThemeFromColor`. Show a live preview of the pill in each theme.

90. **Give 2–3 example themes** so the idea is clear (do NOT ship a huge library):
    ```ts
    createThemeFromColor('#C9A84C', 'dark')   // Noir & Gold
    createThemeFromColor('#3B82F6', 'light')  // Cloud Blue
    createThemeFromColor('#10B981', 'dark')   // Emerald
    ```

---

## I. Background music on/off (91–98)

91. **Goal:** an optional ambient/background track the presenter can turn **on or
    off** from the controller and with the `M` key.

92. **Create a `useDeckMusic()` hook** owning a single `HTMLAudioElement`
    (`loop = true`), exposing `{ isPlaying, toggle(), setVolume(v), track }`.

93. **Default to OFF.** Browsers block autoplay with sound; never auto-play —
    require an explicit user gesture (the chip or `M`).

94. **Music chip** shows `Music` icon when off and `Music-off` (or a muted state)
    when on; `aria-pressed` reflects state. Tooltip: "Background music (M)".

95. **Toggle behavior:** on → `audio.play()` (handle the returned promise; if it
    rejects due to autoplay policy, show a toast "Tap again to start audio");
    off → `audio.pause()`.

96. **Persist preference** (`ctrl.music.v1`) and remember last volume; restore on
    next load but still keep playback OFF until a gesture.

97. **Provide volume + track examples** (small popover): a volume slider and 2–3
    sample tracks so the feature is demonstrable:
    ```ts
    const TRACKS = [
      { id: 'calm',   label: 'Calm Pads',   src: '/audio/calm.mp3' },
      { id: 'lofi',   label: 'Lo-fi',       src: '/audio/lofi.mp3' },
      { id: 'silent', label: 'None (off)',  src: null },
    ];
    ```

98. **Fade in/out** over ~400ms when toggling (skip the fade when
    `reduceMotion`); pause cleanly on unmount/route-away to avoid orphan audio.

---

## J. Polish, a11y & sign-off (99–100)

99. **Accessibility & visual-regression pass.** Every chip has an `aria-label`
    and visible focus ring; the pill is keyboard-reachable; tooltips don't trap
    focus; color contrast passes AA in every example theme; capture
    snapshots of collapsed/expanded in light + dark for regression. Verify the
    controller in all 8 positions and at the compact breakpoint.

100. **Final sign-off.** Walk the full presenter story end-to-end: first-run
     popup → navigate with `←/→` → jump by number → `F` fullscreen → `/` help →
     switch theme from a color → `M` music on/off → reload (URL keeps slide,
     theme + position + music prefs restored, popup does not reappear). Mark the
     controller track complete.

---

## Remaining items
1. **Implement steps 1–100** in actual code (`src/slides/controls/*`), grouped
   A→J in order; each group is independently testable.
2. **Wire example themes & tracks** (steps 90, 97) as small demos, not full
   libraries.
3. **Acceptance walk-through** (step 100), then flip the controller track to done.
