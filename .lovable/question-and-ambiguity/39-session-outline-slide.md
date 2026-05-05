# 39 — SessionOutlineSlide

**Ambiguity**: User asked to "add the steps slide" + "create a sessions, session outline, another session outline, another page" without specifying which prior slide they meant.

**Decision**: Built a brand-new `SessionOutlineSlide` slide type (vertical numbered agenda — index · title · subtitle · meta capsule, optional `activeIndex` "you are here" highlight) and added 3 sample pages to the `session-4-ai-coding` deck:
- 11 · plain outline (no active row)
- 12 · same outline with `activeIndex: 2` (mid-deck recap variant)
- 13 · multi-session outline (S1–S4 arc, today highlighted)

**Why distinct from existing types**: Closest neighbors (`StepTimelineSlide`, `StepsChain3DSlide`, `FocusTimelineSlide`, `AdvanceStepSlide`) are all motion-driven step carousels. SessionOutline is intentionally calm — single screen, all rows visible, presenter narrates. Different intent, different layout (vertical list vs horizontal chain), different visual weight (tight rail vs cinematic camera).

**Open questions to ask later if user disagrees**:
- Did they mean a different existing pattern (e.g. extend `StepsChain3DSlide`)?
- Want more/fewer outline pages, or pages in a different deck?
- Want a 2-column "left list / right detail" variant?

Files:
- `src/slides/types/SessionOutlineSlide.tsx` (new)
- `spec/26-slide-definitions/_patterns/session-outline-slide.md` (new)
- `src/slides/{enums,contracts,SlideStage,fixtures,exportPptx}.ts` (wired)
- `src/slides/{components/SlidePreview,controls/GridOverview}.tsx` (wired)
- `src/builder/fieldSchemas.ts` (picker entry)
- `front-end/project/session-4-ai-coding/data/slides.json` + 3 new JSONs
