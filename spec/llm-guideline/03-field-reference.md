# 03 — Field reference (what each JSON key does)

Authoritative shape lives in the schema
[`../21-slides-system/slide.schema.json`](../21-slides-system/slide.schema.json)
and the full field doc
[`../21-slides-system/00-fundamentals.md`](../21-slides-system/00-fundamentals.md).
This table is the fast lookup; the schema wins on conflict.

## Top-level fields (every slide)

| Field | Type | Legal values / notes | What breaks if wrong |
|---|---|---|---|
| `slideNumber` | int | unique per deck; maps to URL `/N` | duplicate → wrong routing |
| `slideName` | string | lowercase-hyphenated; matches filename | mismatch confuses tooling |
| `slideType` | enum | **25 runtime types** (source of truth = `src/slides/contracts.ts` → `SlideContract`, v7): `TitleSlide` · `MiddleTitleSlide` · `SectionDividerSlide` · `KeywordSlide` · `CapsuleListSlide` · `StepTimelineSlide` · `FocusTimelineSlide` · `AdvanceStepSlide` · `StepsChain3DSlide` · `ImageSlide` · `QrMeetingSlide` · `MetricGridSlide` · `TableSlide` · `CodeBlockSlide` · `BoxDiagramSlide` · `ERDiagramSlide` · `LayoutSlide` · `DatabaseDiagramSlide` · `DataTableSlide` · `NumberCalloutSlide` · `EquationSlide` · `ChecklistSlide` · `TileSlide` · `BlastRadiusSlide` · `SessionOutlineSlide`. The `slide.schema.json` enum is an older 12-type subset — when they disagree, the zod contract wins. | unknown → load error |
| `transition` | enum | `FadeIn` · `SlideIn` · `PushIn` · `PushLeft` · `PushRight` | invalid → fails validation |
| `textAnimation` | enum | `FadeIn` · `Bounce` · `SlideUp` · `Stagger` | invalid → fails validation |
| `enabled` | bool | default `true`; `false` mutes the slide | — |
| `isClickReveal` | bool | default `false`; hides from linear flow | needs `parentSlide` |
| `parentSlide` | int\|null | required when `isClickReveal: true` | orphan reveal |
| `showBrandHeader` | bool | default `true` — Riseup Asia logo | two logos if also self-painted |
| `showPresenterChip` | bool | default `true` — presenter pill | — |
| `titleStyle` | enum | `cream`(default) · `white` · `gold` · `gradient`(legacy) | invalid → fails validation |
| `titleShimmer` | bool | default `false`; one-shot title sweep | — |
| `ambientBackground` | string | named ambient preset (see backgrounds docs) | unknown → no bg |
| `sound` | object | `{ on, kind, volume }` (see sound docs) | — |
| `notes` | string | speaker-only narration (Presenter view) | never shown to audience |
| `content` | object | slide-type-specific payload | shape depends on `slideType` |

## `content` — by slide type (summary)

| slideType | key content fields |
|---|---|
| `TitleSlide` | `title`, `subtitle`, `capsules[]`, `animations` |
| `MiddleTitleSlide` | `eyebrow`, `title`, `subtitle` |
| `KeywordSlide` | `keywords[]` |
| `CapsuleListSlide` | `eyebrow`, `title`, `capsules[]` |
| `StepTimelineSlide` | `eyebrow`, `title`, `steps[]` |
| `AdvanceStepSlide` | `eyebrow`, `title`, `steps[]` |
| `FocusTimelineSlide` | `eyebrow`, `title`, `direction`, `windowSize`, `steps[]` |
| `StepsChain3DSlide` | `eyebrow`, `title`, `steps[]` (3D depth-tiered chain) |
| `MetricGridSlide` | `eyebrow`, `title`, `metrics[]` (2-6 headline cells) |
| `ImageSlide` | `eyebrow`, `title`, `image`, `images[]`, `caption`, `imageRole` |
| `QrMeetingSlide` | `title`, `meetingUrl`, `qrStyle`, `contactRows[]`, `cta`, `socials[]` |
| `SectionDividerSlide` | `eyebrow`, `title` |
| `TableSlide` *(see 07)* | `title`, `tableColumns[] {key,label}`, `tableRows[] {name,cells}` |
| `DataTableSlide` *(see 07)* | `title`, `dataColumns[] {key,label,align}`, `dataRows[]` |
| `CodeBlockSlide` *(see 07)* | `title`, `code` **or** `codeTokens[]`, `codeLanguage` |
| `EquationSlide` *(see 07)* | `title?`, `tex` **or** `equationHtml` |
| `BoxDiagramSlide` *(see 07)* | `title`, `diagramNodes[] {id,title,x,y}`, `diagramEdges[] {from,to}` |
| `ERDiagramSlide` / `DatabaseDiagramSlide` *(see 07)* | entities/relationships or dbEntities/diagram |
| `LayoutSlide` *(see 07)* | `title`, `layout`, `layoutSlots[]` (1-6) |
| `TileSlide` *(see 07)* | `title`, `tiles[] {name,tag,desc,...}` (2-4), `tilesCaption?` |
| `ChecklistSlide` *(see 07)* | `title`, `items[] {text,detail?,capsule?}` (2-7) |
| `NumberCalloutSlide` *(see 07)* | `number{to,from?,unit?}`, `label?`, `capsule?` |
| `BlastRadiusSlide` / `SessionOutlineSlide` *(see 07)* | single-word title / agenda outline |

For the exact, complete `content` contract of a type, always read
[`../21-slides-system/llm/23-slide-type-contracts.md`](../21-slides-system/llm/23-slide-type-contracts.md)
and the copy-paste templates in
[`../21-slides-system/llm/06-json-authoring-cheatsheet.md`](../21-slides-system/llm/06-json-authoring-cheatsheet.md).

## Capsule object

| Field | Type | Notes |
|---|---|---|
| `text` | string | the chip label |
| `color` | enum | 9 values: `gold` · `ember` · `cream` · `ink` · `outline` · `violet` · `teal` · `rose` · `sky` |
| `hoverText` | string | optional hover label |
| `clickRevealSlide` | int | optional — opens hidden detail slide |

## Step object

| Field | Type | Notes |
|---|---|---|
| `label` | string | e.g. `"Step 1"` / `"01"` |
| `title` | string | step headline |
| `subtitle` | string | short support line |
| `description` | string | 1-2 line detail |
| `capsule` | object | `{ text, color }` |
| `cta` | object | optional `{ text, revealSlide, variant }` |
