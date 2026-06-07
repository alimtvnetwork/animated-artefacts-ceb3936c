# Command — Author a dedicated "steps slide" spec folder for blind LLMs

**Slug:** steps-slide-spec-folder
**Scope:** Documentation / spec authoring (no runtime code change)
**Created:** 2026-06-07
**Status:** captured

## Command (verbatim intent)
> Create another spec folder called "Steps Slide" (the user said "Steps Slide 2096").
> In the step slides there are two types of steps. Document exactly how the
> animation works, how the "first one / second one" focus behavior works, every
> detail an AI model needs to create or influence these slides. Include CSS
> tricks (color, blur, glow, opacity ramps, font-size depth) and full
> explanations so ANY LLM reading the spec can implement the step-slide system
> from scratch for anyone. Write it as detailed as possible.

## When it applies
- Whenever the step-based slide family is documented or re-documented.
- The new folder must be self-contained enough that a blind LLM can rebuild the
  two step variants from the spec alone, without reading source.

## Notes / constraints
- This is a spec-authoring task. The PLAN turn only writes the plan + this
  command file; the spec folder itself is implemented in a later execution turn.
- Folder target: `spec/2096-steps-slide/` (interpreting "Steps Slide 2096" as a
  numbered spec folder; confirm the literal number with the user before
  implementation if it matters).
- Must align with existing canon: `spec/21-slides-system/steps-based-slides/**`,
  `spec/21-slides-system/42-steps-motion.md`,
  `spec/21-slides-system/llm/12-steps-pattern.md`, and the code in
  `src/slides/types/StepTimelineSlide.tsx` / `FocusTimelineSlide` /
  `AdvanceStepSlide`.
