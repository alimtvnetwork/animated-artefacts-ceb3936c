# 00 — Overview of the Step-Based Slide Family

## The shared mental model

Every step-based slide renders an **ordered array of items**. Item `i` always
gets a 1-based, two-digit **index label** (`String(i + 1).padStart(2, '0')` →
`01`, `02`, …). The visual job of every member is the same:

1. Show a **header block** (eyebrow + title + optional kicker) for the whole list.
2. Show the **ordered items**, each with index, title, optional subtitle, and an
   optional **meta / capsule** on the trailing edge.
3. Optionally **highlight one active item** (`content.activeIndex`) and dim the
   rest, so a presenter can "park" on the current step.

The members differ only in how the items are arranged and animated:

- **SessionOutlineSlide** — items stacked vertically, full width, hairline
  separators, a glowing vertical rule in the index gutter. Static (no internal
  step advance). This is the "outline / agenda" section.
- **StepTimelineSlide / FocusTimelineSlide / AdvanceStepSlide** — items become
  an interactive sequence advanced by the presenter (click / arrow / controller).
  They add an `active` step that moves, plus richer motion (ghost numerals,
  breathing badge halos, cinematic transitions). See specs `17`, `23`, `27`,
  `32`, `33`, `42` for the motion history.
- **StepsChain3DSlide** — items are 3D-depth cards on a rail; spec `61`.

## Why a shared data model matters

Because the data model is shared, an author can change a slide's *feel* by
changing only `slideType` (and a couple of layout knobs) without rewriting
content. A blind AI must therefore **never** invent per-slide content fields
that only one member understands; new fields go through `01-data-model.md`.

## Non-negotiable house rules (the "why")

| Rule | Why it exists |
|------|---------------|
| Keywords-only, ≤ ~6 words per title | Projected slides must read in 1 second; the presenter speaks the detail. |
| `.capsule-{tone}` classes only, never inline brand-token styles | Brand tokens (`--gold`, `--cream`, `--white`, …) are *repurposed* on light themes; inline styles silently become invisible. |
| `.capsule-meta` for time/duration | It uses Radix `--muted` tokens that auto-flip per theme. |
| Semantic type classes, no inline `text-shadow` | The 45° weight-shadow bevel is applied centrally; inline shadows double up or fight it. |
| Insets from `--brand-inset-x/-y` | Keeps the index gutter, title, rail, and right-edge chip on a single shared axis with the brand logo. |
| Reduced-motion fallback | Accessibility + projector judder; never ship motion without the opacity-only path. |

## Where the pieces live in the codebase

- Slide components: `src/slides/types/<Name>Slide.tsx`
- Slide type enum: `src/slides/enums.ts`
- Content typing: `src/slides/types.ts`
- Capsule component: `src/slides/components/Capsule.tsx`
- Text-animation presets: `src/slides/textAnimations.ts`
  (`getContainerVariants`, `getItemVariants`, `resolvePreset`)
- Title color helper: `src/slides/preset.ts` (`titleClassFor`)
- Tokens: `src/index.css` (`--brand-inset-*`, `--capsule-*`, `--text-shadow-weight-*`)

A blind AI implements a new member by copying `SessionOutlineSlide.tsx`, then
changing only the items-layout JSX and the motion — never the data contract.
