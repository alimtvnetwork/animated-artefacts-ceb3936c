# 18 — Acceptance & QA

The exit gate for the focus-timeline spec series and any runtime built from it.
A slide is shippable only when every box below passes. This is the last file in
plan 06.

Source anchors:

- Component: `src/slides/types/FocusTimelineSlide.tsx`
- State owner: `src/slides/hooks/useFocusTimeline.ts`
- Tokens: `src/index.css`
- Contracts: files `10`–`17` in this folder

---

## Acceptance checklist

- [ ] Deck Next walks every step in order, then leaves the slide at the last step.
- [ ] Deck Prev walks back, then leaves the slide at the first step.
- [ ] `tryAdvance(dir)` returns `false` at each boundary (no swallowed navigation).
- [ ] Each row stamps `data-state` = `active | adjacent | far` matching `activeIndex`.
- [ ] Depth reads via opacity + color + blur only — no transform scale.
- [ ] All colors/timings come from tokens; zero inline hex, zero inline `--dur-*`.
- [ ] Capsules use `.capsule-{tone}` / `.capsule-meta` — no inline `style.background`.
- [ ] One keyword per step; no paragraph rows.

## QA matrix

Run each cell; all must render correctly with no console errors.

| Axis | Values to test |
| --- | --- |
| Theme | dark (default), paper-ink, github-light |
| Motion | normal, `[data-reduce-motion="true"]`, `prefers-reduced-motion` |
| Sound | unmuted (click cue fires), muted (silent, no throw) |
| Navigation | mid-step, first-step Prev boundary, last-step Next boundary |

## Contrast guard

- Active 1.0 / adjacent 0.62 / far 0.55 alpha ramp must clear WCAG-AA on every
  theme — covered by `stepTimelineGithubLightContrast.test.ts`.

## Reduced-motion guard

- Under both triggers: transforms/variants/pulse dropped, opacity+blur kept,
  cues silent. Verify no animation jank and no console errors.

## Done signal

- Every acceptance box checked, every QA cell green, both guards pass.
- Vite logs and browser console show no errors across the full matrix.
