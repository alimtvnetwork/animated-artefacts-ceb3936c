# 04 — Per-Step `revealMode` Option

- Task: "Add a `revealMode` option per step so I can choose between fade-in, slide-in, push-left, or timeline step-comes-in regardless of `leftOffsetPx`."
- Spec refs: new field in `src/slides/types.ts` `StepSpec`; render branch in `src/slides/types/StepTimelineSlide.tsx` (~L702); schema entry `spec/slides/slide.schema.json` step block; companion to existing `leftOffsetPx` semantics in `spec/slides/40-step-snap-to-guides.md` §"Reveal mode".

## Point A — Naming the four modes

User wrote: "fade-in, slide-in, push-left, or timeline step-comes-in."

Options:

1. **`'fade' | 'slide' | 'pushLeft' | 'timelineLand'`** (chosen). Pros: matches the user's enumeration verbatim, modulo dropping the "-in" suffix (every reveal is by definition an entrance — "slide-in" is just "slide"). `timelineLand` is more descriptive than "timelineStepComesIn" and matches the existing internal language ("lands onto the guide" — see spec 40 §Reveal mode and the v0.84 changelog comment that lived in the render block). Pros: short JSON values, easy to type, no abbreviations. Cons: `timelineLand` introduces a new term — but it's already in the codebase comments.
2. `'fadeIn' | 'slideIn' | 'pushLeft' | 'timelineStepIn'`. Pros: literal echo of user phrasing. Cons: redundant `In` suffix for every value; "timelineStepIn" reads awkwardly compared to "timelineLand".
3. `'fade' | 'slideLeft' | 'slideRight' | 'land'`. Pros: pure-direction naming. Cons: loses the "this is the cinematic timeline-specific reveal" intent of `timelineLand`; user explicitly said "timeline step comes in" so naming it after timeline is more discoverable.

**Recommendation: option 1**.

## Point B — What does `pushLeft` mean directionally?

User said "push-left" but didn't specify which side the row enters from.

Options:

1. **Row enters from the right edge, pushes leftward toward final position** (chosen — `initialX = +24`). Pros: matches CSS animation conventions (`pushLeft` = motion vector points left, so the source is on the right); mirrors the existing `slide` mode (which enters from the left); gives authors a true mirror. Cons: ambiguous if "push-left" reads as "the row is being pushed to the left by something else from the right". (Same outcome though.)
2. Row enters from the left edge, but with a "push" feel (initial blur, slight scale). Pros: still "from the left". Cons: just a fancier version of `slide`; doesn't add a new direction; defeats the user's "or push-left" enumeration which implies a different motion.
3. Mirror of `timelineLand` (cinematic 1.1s from the right). Pros: dramatic. Cons: timelineLand is its own option — pushLeft should be its lighter sibling.

**Recommendation: option 1**. If user wanted left-edge entry, they'd reach for `slide`.

## Point C — Backwards-compatible default chain

When `revealMode` is omitted, what should happen?

Options:

1. **Preserve legacy auto: `leftOffsetPx > 0` ⇒ `'timelineLand'`, otherwise `'slide'`** (chosen). Pros: zero regression risk for every existing deck and showcase slide; only authors who explicitly add `revealMode` opt into the new control. Cons: keeps a small "magic" default chain in the resolver.
2. Always default to `'slide'`. Pros: cleaner mental model. Cons: every existing snap-aligned step would suddenly lose its cinematic 1.1s reveal — visible regression in production decks.
3. Always default to `'fade'`. Pros: calmest possible default. Cons: even bigger regression than option 2.

**Recommendation: option 1** — explicit opt-in, no breakage.

## Point D — Does `timelineLand` still respect `leftOffsetPx`?

When an author writes `revealMode: 'timelineLand'` AND `leftOffsetPx: 60`, should the row slide from `-(60+32)=-92px` (current snap-revel math) or from a fixed `-(24+32)=-56px`?

Options:

1. **Use `Math.max(leftOffsetPx, 24)`** (chosen). Pros: snap-aligned rows still get the dramatic deeper start (their final position is +60px to the right, so a deeper -92px entry feels appropriately cinematic); rows without offset still get the legacy -56px entry; no jarring reduction for existing snap-aligned authoring. Cons: small inline ternary.
2. Always use `-56px` (fixed). Pros: predictable. Cons: snap-aligned rows would feel underwhelming.
3. Always use `-(leftOffsetPx + 32)`. Pros: matches the original v0.84 formula. Cons: with `leftOffsetPx = 0` the entry distance collapses to -32px, which is barely a movement.

**Recommendation: option 1** — matches existing snap-reveal feel, gives non-offset rows a useful default.

## Action taken

- `src/slides/types.ts` — added `revealMode?: 'fade' | 'slide' | 'pushLeft' | 'timelineLand'` to `StepSpec` with a richly-commented JSDoc block describing the four modes and the default chain.
- `src/slides/types/StepTimelineSlide.tsx` — replaced the `isSnapReveal` boolean with a `resolvedRevealMode` resolver (inline IIFE for `initialX` per mode); branched the `enterTiming` to keep `timelineLand` on its pinned 1.1s expo-out and route the other three modes through the existing `resolveStepEnter` chain. Added `data-reveal-mode={resolvedRevealMode}` to the row's DOM for QA inspection.
- `spec/slides/slide.schema.json` — added the `revealMode` enum to the step block.

## Reversible?

Yes. Removing the `revealMode` field from `StepSpec` + the resolver IIFE + the schema enum returns to v0.121 behavior. No persisted state, no DB migration. Existing decks that haven't authored `revealMode` are byte-identical at runtime.

## Follow-ups the user may want to weigh in on

- Should there be a fifth `'pushRight'` mode (mirror of `pushLeft` — enter from the left, push rightward)? Trivial addition; held until requested.
- Should `revealMode` cascade to a slide-level default (`content.stepRevealMode`) so an author can set the whole slide to e.g. `'fade'` without per-step boilerplate? Easy follow-up; not implemented to keep the surface area minimal.
- Should the `step-row--snap-reveal` CSS class (which renders the gold-rail underline) decouple from `timelineLand` so authors using `slide`/`pushLeft`/`fade` can still opt into the rail? Currently the rail only fires for `timelineLand`.
