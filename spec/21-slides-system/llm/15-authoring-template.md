# 15 — Slide Authoring Template

> **Phase 12/20** · The minimal scaffold any LLM uses to add a new
> slide. Copy → fill → drop into `spec/slides/{deck}/`. JSON is the
> runtime source of truth; the React component reads from it.

## 1. Required JSON envelope

Every slide JSON file under `spec/slides/{deck}/` MUST contain:

```json
{
  "slideType": "StepTimelineSlide",
  "title": "Our process",
  "transition": "SlideIn",
  "textAnimation": "SlideUp",
  "showBrandHeader": true,
  "brandStrip": false
}
```

| Field | Type | Required | Default |
|---|---|---|---|
| `slideType` | enum (see `01-architecture-and-files.md`) | yes | — |
| `title` | string | yes for content slides | — |
| `eyebrow` | string | no | none |
| `subtitle` | string | no | none |
| `transition` | enum (`13-motion-system.md` §2) | no | deck default |
| `textAnimation` | enum (`13-motion-system.md` §3) | no | deck default |
| `showBrandHeader` | boolean | no | `true` |
| `brandStrip` | boolean | no | `false` |
| `background` | `{ ambient: AmbientVariant }` | no | `drift` |
| `sound` | `{ on, kind, volume }` | no | none |

Then ADD per-slide-type fields. Decision tree:

| User says… | `slideType` | Extra fields |
|---|---|---|
| "title slide / opener" | `TitleSlide` | `wordmark`, `presenter`, `subtitle` |
| "section break" | `SectionDividerSlide` | `index`, `title` |
| "list of capabilities / labels" | `KeywordSlide` or `CapsuleListSlide` | `keywords` / `capsules[]` |
| "process / steps" | `StepTimelineSlide` | `steps[]` (eyebrow, title, description, capsule) |
| "single big focus item" | `FocusTimelineSlide` | `focuses[]` |
| "frame-by-frame reveal" | `AdvanceStepSlide` | `frames[]` |
| "QR for meeting / contact" | `QrMeetingSlide` | `meeting`, `contact` |
| "image-heavy slide" | `ImageSlide` | `image`, `caption?` |
| "middle title (chapter)" | `MiddleTitleSlide` | `title`, `subtitle` |

## 2. Where content goes for `StepTimelineSlide`

```json
"steps": [
  {
    "eyebrow": "Step 1",
    "title": "Discovery",
    "description": "Listen, audit, align.",
    "capsule": { "kind": "outline", "label": "Week 1" },
    "cta": { "text": "See deliverables", "revealSlide": 12 }
  }
]
```

`description` is the only field shown in the right-side detail panel.
Keep it ≤ 120 characters; the panel is for emphasis, not paragraphs.
`capsule.kind` ∈ `gold | ember | cream | ink | outline`.

## 3. Filename + manifest wiring

1. File: `spec/slides/{deck}/NN-name.json` (NN = 1-based, zero-padded).
2. Companion: `spec/slides/{deck}/NN-name.md` — one paragraph of
   design intent. No code.
3. Add the filename to the `slides` array in
   `spec/slides/{deck}/deck.json`. The loader reads via
   `import.meta.glob('/spec/slides/{deck}/*.json')`.

## 4. Variety guard (must be done by author)

Before saving, look at slide N-1 and N+1 in `deck.json`. Pick a
`transition + textAnimation` pair that **does not match** either
neighbor. The deck reads as one cinematic flow only if the pairs
rotate.

## 5. React skeleton (only when adding a new slide type)

The runtime imports the JSON spec — no React work needed for new
**instances**. To add a new `slideType`, copy an existing file under
`src/slides/types/`, register it in `SlidePreview.tsx`'s switch, and
add the enum value to `src/slides/enums.ts`. Full file map:
`01-architecture-and-files.md`.

## 6. Acceptance & changelog

- `deck.json` lists the new file; companion `.md` exists.
- `transition + textAnimation` pair differs from both neighbors.
- Content is keyword-only (≤ 6 words per chunk).
- 2026-04-26 (v0.80.6): Phase 12 — JSON envelope + decision tree +
  per-type field map + variety guard.
