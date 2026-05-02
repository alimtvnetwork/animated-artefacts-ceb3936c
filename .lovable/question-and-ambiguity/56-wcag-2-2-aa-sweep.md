# 56 — WCAG 2.2 AA Accessibility Sweep

**Date:** 2026-05-01
**Scope:** Whole deck app — keyboard + screen-reader pass against WCAG 2.2 AA.
**Counter:** 19 / 40 (window 2)

## Findings & fixes

### 1. Universal focus-visible (2.4.7 Focus Visible, 1.4.11 Non-text Contrast) — FIXED
Most controller buttons relied on browser-default outline. The default was preserved
(no `outline:none` resets in `lift-hover*`), but custom-styled chrome (deck menu,
share, theme, presenter-cam, capsules) had inconsistent focus affordance.

→ Added a global `:focus-visible` rule in `index.css` that paints a 2px gold
outline + 2px offset on every button/link/input/[role=button]/[tabindex]. Uses
`:focus-visible` (not `:focus`) so mouse users never see a ring. Components that
already supply their own ring opt out via `[data-focus-skin]`.

### 2. Bypass blocks / skip-link (2.4.1) — FIXED
No skip-to-content. Keyboard users had to tab through the controller pill,
top jumper, and TOC sidebar before reaching slide content.

→ Added a visually-hidden `.skip-to-content` anchor in `SlideDeckPage` that
docks at top-left when focused, jumps to `#slide-content` (the `<main>`
landmark).

### 3. Modal focus management (2.4.3 Focus Order, 2.1.2 No Keyboard Trap) — FIXED
`ClickRevealExpandPanel` opened with focus left on the trigger button outside
the dialog, never trapped Tab, and never returned focus on close.

→ Added focus management: capture `previouslyFocused` on open, move focus to
the close button after enter animation, intercept Tab to cycle within the
dialog, return focus to the original trigger on close. Esc + backdrop close
behaviour preserved.

### 4. Slide-change announcements (4.1.3 Status Messages) — FIXED
Screen readers got no signal on slide navigation — `aria-label` on `<main>`
only fires on landmark entry, not on internal nav.

→ Added a `role="status" aria-live="polite" aria-atomic` `sr-only` div in
`SlideDeckPage` that re-renders with `Slide N of M: <title>` on every nav.
React `key={current-replayNonce}` forces a remount so identical text on
re-navigation still triggers the announcement.

### 5. Target size (2.5.8 Minimum, AA 24×24) — VERIFIED
Spot-checked controller buttons: collapsed `h-10 w-10` (40×40), expanded
`h-9 w-9` (36×36). Capsules `text-xs px-3 py-1` resolves ≈ 24px tall (right at
the floor); inline glyphs add padding so the hit-box exceeds 24px. **No
violations**, but capsule `size="sm"` is at the limit — flag for design
review if future shrinks happen.

### 6. Hotspot keyboard navigation — ALREADY OK
`HotspotLayer` already has roving tabindex via Arrow/Home/End and announces
shortcuts via `aria-keyshortcuts`. No change.

## Files changed
- `src/index.css` — global `:focus-visible` ring, skip-link styles
- `src/pages/SlideDeckPage.tsx` — skip-link, live region, fragment wrap
- `src/slides/components/ClickRevealExpandPanel.tsx` — focus trap + return focus

## Verification
- `tsc --noEmit` clean
- Keyboard pass: Tab from page-load reveals skip link first, then enters
  controller, then capsules. Esc closes click-reveal panel and focus
  returns to trigger.

## Ambiguities / deferred
None for this pass — straight WCAG compliance work, no design choices
needed. Next a11y horizon would be:

- Color-contrast sweep (1.4.3) — requires running ContrastDebug overlay
  across all 17 slide types and capturing failures.
- Reduced-data-motion tier (2.3.3) — currently we honor `prefers-reduced-motion`
  but don't expose a UI toggle for users who can't change OS settings.
