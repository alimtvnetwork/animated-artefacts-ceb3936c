# Subsystem: slide-types

## Spec Statement
17 production slide types enumerated in `spec/21-slides-system/llm/CATALOG.json` (`registries.slideTypes.values`). Addendum `29-narrow-idea-and-new-slide-types.md` adds 4: `DatabaseDiagramSlide`, `DataTableSlide`, `NumberCalloutSlide`, `EquationSlide`. Each must have a JSON+MD spec pair under `spec/26-slide-definitions/<deck>/` and a runtime component in `src/slides/types/`.

## Implementation State
`src/slides/enums.ts` `SlideType` exports 17 values; matched 1:1 by 17 components in `src/slides/types/` (TitleSlide, MiddleTitleSlide, KeywordSlide, CapsuleListSlide, StepTimelineSlide, StepsChain3DSlide, FocusTimelineSlide, AdvanceStepSlide, ImageSlide, QrMeetingSlide, ClickRevealSlide-via-loader, SectionDividerSlide, MetricGridSlide, TableSlide, CodeBlockSlide, BoxDiagramSlide, ERDiagramSlide, LayoutSlide). The 4 addendum types exist only as spec.

## Gap
- `DatabaseDiagramSlide`, `DataTableSlide`, `NumberCalloutSlide`, `EquationSlide` not in `SlideType` union, no Zod, no component, no fixture, no contract test.
- `densityCheck` field on Phase 1 sample specs is not asserted in `contracts.test.ts`.

## Severity
**Major** (system shipped 17 types as advertised; addendum is documented future work).

## Evidence
- spec: `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md`, `spec/26-slide-definitions/sample/{40..43}.json`
- impl: `src/slides/enums.ts:1`, `src/slides/types/*.tsx`
- test: `src/test/contracts.test.ts`, `src/test/slideFixtures.test.ts`

## Remediation
1. Extend `SlideType` enum + Zod variants in `src/slides/types.ts` / `schema.ts`.
2. Add 4 components to `src/slides/types/`.
3. Wire into `SlideStage`, `SlidePreview`, builder picker.
4. Add `densityCheck` assertions to `contracts.test.ts`.
5. Bump CATALOG.json `slideTypes.count` 17 → 21 in same patch.
