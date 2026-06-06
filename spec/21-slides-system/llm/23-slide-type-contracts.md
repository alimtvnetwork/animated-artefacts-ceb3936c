# 23 — Per-Slide-Type JSON Contracts (Machine-Checkable)

> **Phase 23/23** · Every slideType is locked behind a discriminated zod
> contract that runs at deck load. Bad slides fail fast at boot with the
> exact slide number, name, type, and JSON path of the violation —
> instead of silently rendering as a TitleSlide or going blank in the
> grid.

> 🧭 **Need the catalog of legal enum values** (slide types, transitions,
> text animations, capsule colors, expand animations, step motion
> variants) **with counts and JSON exemplars?** See
> [`28-component-and-animation-catalog.md`](./28-component-and-animation-catalog.md)
> + [`CATALOG.json`](./CATALOG.json).

## Where the contract lives

| Surface | File | Purpose |
|---|---|---|
| Authoring (IDE/CI) | `spec/slides/slide.schema.json` | JSON Schema draft-07. Powers IDE autocomplete and any external linter. |
| Runtime (browser) | `src/slides/contracts.ts` | Zod discriminated union on `slideType`. Validates every slide at boot. |
| Boot wiring | `src/slides/loader.ts` | Calls `validateSlide` for every slide and exposes `slideContractIssues`. |
| Strict gate | `assertValidSlides()` | Throws on first failure. Use in tests and pre-deploy scripts. |
| Tests | `src/test/contracts.test.ts` | Per-type accept/reject coverage + REQUIRED_FIELDS audit. |

## Required-fields table (single source of truth)

These are the fields each `slideType` MUST have under `content`. The
table is mirrored in `REQUIRED_FIELDS` (contracts.ts) and in the zod
schemas. Keep all three in sync.

| `slideType` | Required `content` fields | Extra constraints |
|---|---|---|
| `TitleSlide` | `title` | — |
| `MiddleTitleSlide` | `title` | — |
| `SectionDividerSlide` | `title` | — |
| `KeywordSlide` | `title`, `keywords` | `keywords.length ≥ 3` |
| `CapsuleListSlide` | `title`, `capsules` | `capsules.length ≥ 3` |
| `StepTimelineSlide` | `title`, `steps` | `3 ≤ steps.length ≤ 6` |
| `FocusTimelineSlide` | `title`, `steps` | `steps.length ≥ 1` |
| `AdvanceStepSlide` | `title`, `steps` | `steps.length ≥ 1` |
| `ImageSlide` | `image` | — |
| `QrMeetingSlide` | one of: `meetingUrl`, `qrUrl`, `qrAsset` | — |
| `MetricGridSlide` | `title`, `metrics` | `2 ≤ metrics.length ≤ 6` |
| `TableSlide` | `title`, `tableColumns`, `tableRows` | `2 ≤ cols.length ≤ 8`, `1 ≤ rows.length ≤ 12`. Field-by-field doc: `27a`. |
| `CodeBlockSlide` | `title`, one of: `code`, `codeTokens` | Field-by-field doc: `27b`. |
| `BoxDiagramSlide` | `title`, `diagramNodes` | `2 ≤ nodes.length ≤ 20`. Field-by-field doc: `27c`. |
| `ERDiagramSlide` | `title`, one of: `entities`, `diagramNodes` | `2 ≤ entities.length ≤ 20`. Same shape as BoxDiagramSlide; auto navy palette. |
| `LayoutSlide` | `title`, `layoutSlots` | `1 ≤ slots.length ≤ 6`. Field-by-field doc: `27d`. |
| `StepsChain3DSlide` | `title`, `steps` | `3 ≤ steps.length ≤ 6` (`capSteps`). Cinematic 3D chain. |
| `DatabaseDiagramSlide` | `title`, one of: `dbEntities`, `diagram` | `≤5 entities` (`capEntities`), `≤6 relationships` (`capRelationships`). |
| `DataTableSlide` | `title`, `dataColumns`, `dataRows` | `≤5 cols` (`capColumns`) × `≤8 rows` (`capRows`). |
| `NumberCalloutSlide` | `number` | Exactly ONE number (`capNumbers`); array → flagged. |
| `EquationSlide` | one of: `tex`, `equationHtml` | Exactly ONE equation; term-by-term Stagger (`capTerms`). |
| `ChecklistSlide` | `title`, `items` | `≤7 items` (`capItems`). |
| `TileSlide` | `title`, `tiles` | `2 ≤ tiles.length ≤ 4`. |
| `BlastRadiusSlide` | `title` | Single-word title moment; pairs with `ZoomOut` exit. |
| `SessionOutlineSlide` | `title`, `items` | `2 ≤ items.length ≤ 8`; optional `activeIndex`. |

> `ClickRevealSlide` is not a content type — it is an envelope flag
> (`isClickReveal: true` + `parentSlide`) on any slide; see `26-click-reveal-contract.md`.
> All 26 `SlideType` enum values are now represented across this table + that note.

Every envelope (any slideType) requires:
`slideNumber:int>0`, `slideName:string`, `slideType:enum`,
`transition:string`, `textAnimation:string`.

## Sub-contracts

- **Capsule** — `{ text:string, color: gold|ember|cream|ink|outline|violet|teal|rose|sky }`
- **Step** — `{ label:string, title:string, subtitle:string }`

Both are `passthrough()` — extra optional fields (`hoverText`, `expand`,
`leftOffsetPx`, etc.) are allowed and validated by the JSON Schema, not
re-validated at runtime.

## Boot behavior

`loader.ts` calls `validateSlide()` for every loaded slide. The result
buffer is exported as `slideContractIssues` and a single `console.warn`
is emitted with the first issue. We **do not throw at boot** — a single
malformed slide should never wedge the entire deck for an audience. Use
`assertValidSlides()` from a test or pre-deploy script when you need a
hard gate.

## Failure message format

```
[deck] Slide #4 "process" (StepTimelineSlide) failed contract:
  • content.steps: Array must contain at most 6 element(s)
  • content.steps.6.label: Required
```

The first line names slide number + slide name + slideType. Following
lines are dotted paths into the slide JSON, one per zod issue.

## Adding a new slideType

When following `22-add-new-slide-type.md`, also:

1. Add a row to `REQUIRED_FIELDS` in `src/slides/contracts.ts`.
2. Add a zod content schema and include it in the `SlideContract`
   discriminated union via `make('NewType', NewContent)`.
3. Add a row to the table above and the JSON Schema `slideType.enum` +
   `allOf` clause in `spec/slides/slide.schema.json`.
4. Add a passing test in `src/test/contracts.test.ts`.

The "REQUIRED_FIELDS table covers every slideType" test will fail
loudly if you forget step 1.
