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
| `slideType` | enum | `TitleSlide` · `MiddleTitleSlide` · `KeywordSlide` · `CapsuleListSlide` · `StepTimelineSlide` · `AdvanceStepSlide` · `FocusTimelineSlide` · `ImageSlide` · `QrMeetingSlide` · `SectionDividerSlide` | unknown → load error |
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
| `ImageSlide` | `eyebrow`, `title`, `image` |
| `QrMeetingSlide` | `title`, `meetingUrl`, `qrStyle`, `contactRows[]`, `cta`, `socials[]` |
| `SectionDividerSlide` | `eyebrow`, `title` |

For the exact, complete `content` contract of a type, always read
[`../21-slides-system/llm/23-slide-type-contracts.md`](../21-slides-system/llm/23-slide-type-contracts.md)
and the copy-paste templates in
[`../21-slides-system/llm/06-json-authoring-cheatsheet.md`](../21-slides-system/llm/06-json-authoring-cheatsheet.md).

## Capsule object

| Field | Type | Notes |
|---|---|---|
| `text` | string | the chip label |
| `color` | enum | `gold` · `ember` · `cream` · `ink` · `outline` · `violet` |
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
