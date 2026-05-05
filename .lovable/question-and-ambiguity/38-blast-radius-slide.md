# Ambiguity log — BlastRadiusSlide spec + implementation

**Task:** Spec + implement a new `BlastRadiusSlide` (cinematic single-word title moment with tumbling shards, drifting particles, chrome gradient title, and a zoom-out exit).

**No-questions mode:** active. Two ambiguities surfaced; reasonable defaults chosen below.

---

## Q1 — How should the title gradient + particles be colored across themes?

**Options considered:**
1. Theme-driven (use brand tokens; reference cyan→silver becomes gold→cream→ember on Noir & Gold; remaps automatically on Paper & Ink, GitHub Light, custom themes).
2. Locked cyan→silver matching reference exactly.
3. Per-slide configurable palette field.

**Decision: #1 — theme-driven.**

**Rationale:**
- Project Core rule: "Use semantic tokens from index.css — never raw hex in components." Locking cyan would violate this every time the slide ships.
- `mem://design/light-theme-capsule-fg-rule`: brand tokens repurpose under light themes. A hard-coded cyan would explode contrast on Paper & Ink (cyan-on-paper is illegible) and on GitHub Light. The same RCA we logged in `updates/spec/15` would re-occur for the title gradient.
- The reference frames are sourced from a third-party reel — reproducing the *exact* colors is out of scope; reproducing the *gesture* is in scope.
- A per-slide palette field is over-engineered for the v1 surface. We can add it later if a slide actually needs to break theme.

**Implementation:**
- `linear-gradient(180deg, hsl(var(--gold)), hsl(var(--cream)), hsl(var(--ember)))` clipped to text.
- Particles alternate between `hsl(var(--gold))` and `hsl(var(--cream))`.
- Shard strokes use `hsl(var(--cream) / 0.45)`.
- Vignette uses `hsl(var(--ink) / 0.85)`.
- All four tokens are defined in every shipped theme — no theme can break the slide.

---

## Q2 — Should the slide support an eyebrow + subtitle, or be title-only like the reference?

**Decision: optional eyebrow + subtitle (whisper-quiet, default off).**

**Rationale:**
- Reference is title-only, but the project already has `MiddleTitleSlide` for the calmer single-line case. If `BlastRadiusSlide` were title-only too, we'd have two near-identical types differing only in particle motion — confusing for AI authoring.
- Adding optional `eyebrow` + `subtitle` reuses existing `SlideContent` fields, costs nothing when omitted, and lets the same slide type serve "Chapter 03 / Blast Radius / what breaks when one secret leaks" without forcing authors to invent a different layout.
- Both fields are explicitly capped (`eyebrow ≤ 40 chars`, `subtitle ≤ 80 chars`) and rendered with whisper-quiet styling so they never compete with the title.
- Spec §1 rule 1 explicitly bans a *third* line beyond eyebrow + subtitle — schema enforces it by having no further text fields.

---

## Files touched

- `spec/26-slide-definitions/_patterns/blast-radius-slide.md` (new — full authoring spec)
- `spec/26-slide-definitions/_patterns/blast-radius-reference-{1,2}.png` (new — motion reference)
- `src/slides/types/BlastRadiusSlide.tsx` (new — component)
- `src/slides/enums.ts` (added `SlideType.BlastRadiusSlide` + `SlideTransition.ZoomOut`)
- `src/slides/transitions.ts` (added `ZoomOut` variants — scale 1→1.18 + fade + 4px blur on exit)
- `src/slides/contracts.ts` (added `BlastRadiusContent` zod schema + registry; bumped `SLIDE_CONTRACTS_VERSION` 5→6)
- `src/slides/SlideStage.tsx` (renderer dispatch)
- `src/slides/controls/GridOverview.tsx` (overview thumbnail dispatch)
- `src/slides/components/SlidePreview.tsx` (preview-tile dispatch)
- `src/slides/exportPptx.ts` (flatten to TitleSlide layout for static export)
- `src/slides/preset.ts` (HERO_SLIDE_TYPES contract)
- `src/slides/fixtures.ts` (valid + invalid fixtures for the validator)
- `src/builder/fieldSchemas.ts` (in-app builder schema with sane defaults + auto-pinned `transition: 'ZoomOut'`)
- `src/index.css` (six new keyframes — drift/tumble/float/glint/settle/shimmer-sweep + reduced-motion guard)
