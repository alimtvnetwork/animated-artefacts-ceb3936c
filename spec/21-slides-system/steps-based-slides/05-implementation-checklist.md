# 05 — Implementation Checklist (literal build order for a blind AI)

Follow these steps in order. Each step is small and verifiable. Do not skip
verification. This rebuilds `SessionOutlineSlide` (the outline section); the
other members reuse steps 1–6 and swap step 7's layout/motion.

## A. Wire-up (data + registration)

1. **Confirm the enum.** In `src/slides/enums.ts` ensure
   `SessionOutlineSlide: 'SessionOutlineSlide'` exists in the `SlideType` map.
   (Already present — do not duplicate.)
2. **Confirm the content type.** In `src/slides/types.ts` make sure the fields
   from `01-data-model.md` (`items[]`, `activeIndex`, `animations`) are
   representable on `content`. Add only missing optional fields; never remove.
3. **Register the renderer.** Find the slide-type → component switch/registry
   (where other `*Slide` components are mapped) and ensure `SessionOutlineSlide`
   maps to the component. If missing, add it.

## B. Component skeleton

4. **Create / open** `src/slides/types/SessionOutlineSlide.tsx`. Add the imports
   from `02-session-outline-slide.md` → "Required imports".
5. **Type the content** by reading `spec.content` into the local shape from
   `01-data-model.md`. Compute:
   ```ts
   const items  = Array.isArray(c.items) ? c.items : [];
   const active = typeof c.activeIndex === 'number' ? c.activeIndex : -1;
   ```
6. **Build the animation variants** exactly as in `04-animation-and-reveal.md`
   ("Wiring pattern").

## C. Layout

7. **Container** — `motion.div` with `flex h-full flex-col` and the four
   `--brand-inset-*` paddings (see `02`).
8. **Header block** — `<div className="mb-12">` with optional eyebrow, title,
   kicker, each a `motion.*` node with its region variants. Use the theme-safe
   `text-[hsl(var(--white)/0.55)]` for the kicker.
9. **List shell** — `<div className="relative flex-1 flex flex-col justify-center">`
   containing the vertical hairline (`left: 40px`, gold gradient) and a
   `motion.ol` (`variants={itemsV}`, `flex flex-col gap-6`).
10. **Row** — map `items` to `motion.li` with the 3-column grid
    (`'88px 1fr auto'`), separators, and the active-dimming opacity rule.
11. **Index numeral** — column 1, `tabular-nums font-display`, active vs
    inactive gold + glow/weight-shadow per `02`.
12. **Title + subtitle** — column 2; `.step-title` for the title,
    `text-[hsl(var(--white)/0.60)]` for the subtitle.
13. **Meta / capsule** — column 3; `<Capsule>` when `capsule` present, else
    `.capsule-meta`. **Never** inline brand-token pill styles.

## D. Verify (do all of these)

14. **Lint & types:** `bun run lint` (0 new errors) and the project tsc check
    pass.
15. **Unit fixture:** add/confirm a fixture in `src/slides/fixtures.ts` for
    `SessionOutlineSlide` (valid spec) so `slideFixtures.test.ts` covers it.
16. **Hardcoded-white audit:** `bun run test src/test/hardcodedWhiteAudit.test.ts`
    — must pass (proves no `text-white` literals crept in).
17. **Render check:** open the slide in the preview; confirm header alignment,
    gutter, hairline glow, capsule colors.
18. **Theme flip:** switch to a light theme (`paper-ink` / `github-light`) and
    confirm titles, subtitles, and capsules stay legible (this is the whole
    point of the token rules).
19. **Active state:** set `activeIndex` and confirm one row glows while the rest
    dim to 0.55.
20. **Reduced motion:** enable `prefers-reduced-motion` and confirm entrances
    collapse to an opacity crossfade.

## E. Author a real instance

21. Under `spec/26-slide-definitions/{deck-name}/` write the `NN-name.json`
    (runtime source of truth, matching `01-data-model.md`) and `NN-name.md`
    (intent companion). Core rule: spec-first.

## F. Generalizing to the other members (when asked)

22. **StepTimelineSlide / FocusTimelineSlide / AdvanceStepSlide:** copy steps
    1–6, then replace step 7+ with the rail/detail or carousel layout and add an
    internal `active` state machine advanced by input. Reuse the same data model
    and token rules. Cross-reference specs `17`, `23`, `27`, `32`, `33`, `42`.
23. **StepsChain3DSlide:** see spec `61` for the 3D depth treatment; data model
    unchanged.
