---
name: pptx-export
description: One-click editable PowerPoint export via pptxgenjs — client-side, native shapes (not raster), Noir & Gold palette, all slide types covered
type: feature
---
v0.154.0.

# Editable PPTX export
ShareMenu entry "Export PPTX (editable)" → calls `exportDeckToPptx()` from `src/slides/exportPptx.ts`. Runs entirely client-side via `pptxgenjs@4.0.1` — no route, no server, no print dialog. Triggers a browser download of `<deck-slug>-handout.pptx`.

# Why "animations off, final states preserved" is automatic
PPTX is a static slide format. Every shape lands in its final position with no Framer variants or CSS keyframes. The export-mode flag wired for PDF handouts (`data-export-mode`) is irrelevant here — the medium itself enforces the contract.

# Editability over pixel parity
Each slide type maps to a CLEAN static layout using **native PPTX shapes/textboxes** — not rasterised images. User can edit text and move elements in PowerPoint/Keynote/Google Slides. This means cinematic flourishes (capsule blur, ambient icons, focus camera, advance-step dolly) are intentionally dropped. `FocusTimelineSlide` and `AdvanceStepSlide` flatten to the same vertical step list as `StepTimelineSlide` (the carousel "final state" = all steps visible).

# Palette + typography
Noir & Gold mirrored inline in the `PALETTE` constant (ink #0D0D0D, gold #C9A84C, ember #E85D3A, cream #F0D78C, foreground #EDE7D6). Headlines: Ubuntu. Body/capsules: Inter. Master slide adds deck name footer + gold slide-number badge.

# Slide-type coverage
- TitleSlide / MiddleTitleSlide → centered eyebrow + huge title + subtitle
- KeywordSlide → header + cream pill row (keywords as pseudo-capsules)
- CapsuleListSlide → header + colored pill row
- StepTimelineSlide / FocusTimelineSlide / AdvanceStepSlide → header + numbered step list (gold ring badge + title + subtitle)
- ImageSlide → header + dashed placeholder box with asset path (no async fetch — user drops image in PPT)
- QrMeetingSlide → header + 2-column (contacts/CTA + white QR placeholder tile with URL label)
- SectionDividerSlide → gold rule + giant title + subtitle
- MetricGridSlide → header + auto-grid (1×N for ≤3, 2×3 for 4–6) of dark cells with big colored value + label + caption
- Unknown types → falls through to header-only

# Capsule color → hex map
gold/ember/cream/ink/outline → matches `CapsuleColor` enum. Light fills get dark text, dark fills get cream — same contrast policy as the live deck.

# Files
- `src/slides/exportPptx.ts` (new, ~470 LOC, fully commented)
- `src/slides/controls/ShareMenu.tsx` (added busy state + Presentation-icon button)
- `package.json` (added `pptxgenjs`)
