## Goal

Re-establish the **steps-based slide spec** as the authority for showcase **slide 3**, then add a set of **image / SVG / Base64** example slides — each with JSON authoring examples that explain *how and where* images are placed. 30 steps now; you'll then call "next 10".

## What I found (so the plan is grounded)

- The steps spec still lives at `spec/21-slides-system/steps-based-slides/` (00-overview → 06-acceptance). It defines a **shared step data model** (`title`, `items[]`, `activeIndex`, capsule rules) across `SessionOutlineSlide / StepTimelineSlide / FocusTimelineSlide / AdvanceStepSlide / StepsChain3DSlide`.
- Default deck at `/` is **`showcase`**; **slide 3** = `front-end/project/showcase/data/slides/03-process.json` (`StepTimelineSlide`).
- Images go through `SlotImage` → `inferImageSlot` (`imagePlacement.ts`). `content.image` is just an `<img src>`, so it already accepts a URL, an imported asset, a `data:image/png;base64,…`, or a `data:image/svg+xml,…` — but there's **no authoring doc / examples** and no explicit `imageRole` field wired.

## Phase A — Recover & re-implement steps spec on slide 3 (steps 1–8)

1. Read all 7 files in `steps-based-slides/` end-to-end and diff the normative rules against the live `StepTimelineSlide.tsx`; record divergences.
2. Reconcile the spec's `items[]`/`activeIndex` contract with slide 3's current `steps[]` shape (slide 3 uses `steps` + `expand`/`revealSlide`); decide on one canonical key and document it.
3. Update `01-data-model.md` so the shared model explicitly covers the StepTimeline extras (`description`, `capsule`, `expand`, `revealSlide`, `revealLabel`).
4. Rewrite showcase `03-process.json` to conform to the reconciled steps spec exactly (keywords-only, `.capsule-{tone}`, `activeIndex`, insets).
5. Write the companion `spec/26-slide-definitions/showcase/03-process.md` explaining intent (Core spec-first rule).
6. Add/extend a validation test asserting slide 3 matches the step data-model contract.
7. Update `spec/21-slides-system/steps-based-slides/README.md` reading-order if any file moved/changed.
8. Visually QA slide 3 in preview at 1920×1080 (header, rail, capsules, reduced-motion path).

## Phase B — Image / SVG / Base64 support + JSON authoring contract (steps 9–18)

9. Audit `ImageSlide.tsx`, `SlotImage.tsx`, `imagePlacement.ts` for what `content.image` accepts today.
10. Add an explicit `content.imageRole` field (maps to `ImageSlotId`) so authors can target `bodyFigure / titleHero / inlineThumbnail / iconBadge`; default-infer when omitted.
11. Confirm `data:image/png;base64,…` and `data:image/svg+xml,…` render through `SlotImage` (add handling/guard if needed).
12. Add SVG-as-React-import support note + a small inline-SVG render path for `iconBadge`-style usage.
13. Extend the asset registry doc to cover **four** image sources: CDN/`.asset.json`, imported file, Base64 PNG, inline SVG data URI.
14. Write a new authoring doc `spec/21-slides-system/images/01-image-authoring.md`: how to place images, which slot to pick, size constraints per slot, and one JSON example per source type.
15. Add a JSON schema/typing note in `src/slides/types.ts` for `image` + `imageRole`.
16. Create reusable example assets: one small PNG, one SVG file, one Base64 PNG string, one inline-SVG data URI (kept tiny, in `src/assets/examples/`).
17. Add a CI/sanity test that every example image src resolves to a valid slot.
18. Cross-link the new image doc from the steps README and the LLM catalog.

## Phase C — New example slides (steps 19–27)

19. **Slide: image from URL/asset** — `ImageSlide` using an imported PNG via `bodyFigure`. JSON + MD pair.
20. **Slide: SVG figure** — `ImageSlide` rendering an `.svg` asset. JSON + MD.
21. **Slide: Base64 PNG** — `ImageSlide` with inline `data:image/png;base64,…`. JSON + MD.
22. **Slide: inline SVG data URI** — `data:image/svg+xml,…`. JSON + MD.
23. **Slide: image + steps combo** — a step slide with `inlineThumbnail` images next to step rows. JSON + MD.
24. **Slide: title hero image** — `TitleSlide` using `titleHero` slot. JSON + MD.
25. **Slide: icon-badge grid** — multiple `iconBadge` SVGs as a pictogram row. JSON + MD.
26. Register all new slides in the relevant deck `slides.json` manifest (new `image-examples` deck or appended to showcase — default: a dedicated `image-examples` deck to avoid bloating showcase).
27. Wire deck theme + transitions so the new slides match Noir & Gold.

## Phase D — Docs, tests, QA (steps 28–30)

28. Add a `motionCollisions`/validation pass so new slides pass boot validation (assets registered, slots resolve).
29. Run the focused test suite + a typecheck; fix any failures.
30. Visual QA every new slide (screenshot each, check layout/overflow/contrast/Base64 + SVG actually paint), then summarize what was verified.

## Technical notes

- Keep all capsules on `.capsule-{tone}` / `.capsule-meta` classNames (memory rule); never inline brand-token styles.
- `content.image` stays a plain string src; `imageRole` is the only new author-facing field, defaulting to slot inference so existing slides are unaffected.
- Example assets stay tiny to avoid repo bloat; large binaries would go through `lovable-assets` instead.
- JSON remains the runtime source of truth; every new slide ships a JSON+MD pair per the spec-first Core rule.

After you approve, I'll implement steps 1–30, then pause for your "next 10".