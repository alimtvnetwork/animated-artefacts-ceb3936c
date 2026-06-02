# 13 — Acceptance Checklist

A build is correct only when **every** box passes. Test on a deck with at
least 13 linear slides plus at least one click-reveal child slide and one
`SectionDividerSlide`.

## Data & sync

- [ ] All four surfaces show the **same** number at all times.
- [ ] The number shown is `currentLinear` (linear position), padded to 2
      digits on the top bar and badge, bare on dots and the controller chip.
- [ ] `total` equals the count of linear slides (click-reveal children NOT
      counted).
- [ ] Navigating updates every surface within one render (no lag/mismatch).

## Presenter Top Bar

- [ ] Pinned top-center, `z-30`, non-interactive (`pointer-events-none`).
- [ ] Shows `Slide NN / NN`, current number gold, `tabular-nums`.
- [ ] Shows Prev (`←` `⌫`) and Next (`→` `Space`) keycap hints.
- [ ] Hidden in grid view, when `topJumperHidden`, and on StepsChain3DSlide.
- [ ] `aria-live="polite"` announces the change.

## Slide Number Badge

- [ ] Bottom-right, `z-30`, read-only, never shows a jump input.
- [ ] `0N / NN` zero-padded, current number gold.
- [ ] Hidden only in grid view.

## Dot Pagination

- [ ] Bottom-center row of numbered dots `1..total`, default ON.
- [ ] Active dot is a wider gold pill that **springs** between slots; the
      number on it is dark (`text-ink`).
- [ ] Clicking a dot jumps to that slide AND plays exactly one `click` cue.
- [ ] Hovering a dot shows a tooltip `N. {title}` with an arrow pointing at the
      correct dot (even for long titles on early dots).
- [ ] `aria-current="true"` on the active dot; each dot is a labelled button.
- [ ] With `> 28` slides the row scrolls horizontally with edge fade masks.
- [ ] Reduced motion: active-pill move is instant (`duration: 0.01`).
- [ ] Hidden in grid view, on StepsChain3DSlide, and when the setting is off.

## Controller Indicator

- [ ] Resting chip shows `current / total`, current number gold; tooltip
      explains click-to-jump.
- [ ] Single click → numeric input with current value pre-selected.
- [ ] Enter commits; Escape cancels; blur commits.
- [ ] Out-of-range / non-numeric input shows the correct toast and does NOT
      navigate (empty input cancels silently).
- [ ] Valid jump plays one `click` cue, navigates, and pushes to jump history.
- [ ] Recent-jumps dropdown appears above the input, excludes the current
      slide, chips re-jump via `onMouseDown`, `X` clears history.
- [ ] Double-tap (within 240ms) toggles reveal hints instead of opening the
      input (only when `onDoubleTap` is provided); `aria-pressed` reflects it.

## Routing & history

- [ ] URL is `/{slideNumber}` and updates on every jump/step.
- [ ] Query string (e.g. `?theme=`) is preserved across jumps.
- [ ] Browser back/forward steps through visited slides.
- [ ] Invalid `/N` falls back to the first linear slide (replace, no extra
      history entry).
- [ ] Jumping to a `disabled` slide is a no-op.

## Sound

- [ ] Exactly one `click` cue per jump/step; none on hover, render, or grid
      click.
- [ ] Rapid double-click does not stack two cues (60ms dedupe).
- [ ] First cue may be silent until the first user gesture (autoplay policy) —
      acceptable.
- [ ] Global mute (`slide-sound-muted`) suppresses the cue.

## Chrome hygiene

- [ ] Every surface carries `data-print-hide="true"` (or is otherwise excluded)
      and does not appear in print / PDF / HTML export.
- [ ] No hardcoded hex colours in any surface — tokens / Tailwind utilities
      only; verify on a light theme (paper-ink) that numbers stay legible.

## Legacy

- [ ] `TopSlideJumper` stays hidden unless `?jumper=1`; when on, double-click
      opens the section/slide popover and never stacks with the top bar.
