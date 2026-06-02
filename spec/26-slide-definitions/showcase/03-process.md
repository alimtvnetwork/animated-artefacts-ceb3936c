# Showcase · Slide 03 — Engagement Process (`StepTimelineSlide`)

> Companion to `front-end/project/showcase/data/slides/03-process.json`.
> JSON is the runtime source of truth; this file explains intent.

## Purpose

The canonical **steps-based slide** in the showcase deck. Walks the audience
through the four-phase engagement process, one step at a time, with a left
rail of steps and a right detail panel. Conforms to the shared step data model
in `spec/21-slides-system/steps-based-slides/01-data-model.md`.

## Data shape (StepTimeline extends the shared model)

`StepTimelineSlide` consumes `content.steps[]` (the interactive variant of the
outline's `items[]`). Each `StepSpec`:

- `label` / `title` / `subtitle` — keywords-only header for the row.
- `description` — presenter narration for the right panel (1–2 sentences; the
  only place full sentences are allowed in the step family).
- `capsule` — trailing pill; **must** use a tone (`gold`/`ember`/`cream`/
  `outline`), never inline brand-token styles.
- `expand` — inline expanding card opened on click (`Step 1`).
- `revealSlide` — click routes to another slide (`Step 2` → slide 4).
- `revealLabel` — accessible label for the reveal action.

## Rules applied

- Keywords-only titles/subtitles; detail lives in `description` / presenter notes.
- Capsules via `.capsule-{tone}` (handled by `<Capsule>`); no inline styles.
- Insets read from `--brand-inset-x/-y`; reduced-motion crossfade respected.
- `stepAmbient` floats faint tool icons — purely decorative, `opacity ≤ 0.05`.
