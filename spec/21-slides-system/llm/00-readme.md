# LLM-Slides — Implementer Instruction Pack

> **Read me first if you are an AI model touching this deck.**
> Read the files in this folder in numeric order (`00 → 06`). Ignore the
> rest of `/spec/slides/` until you've finished. Those older specs are
> archeology — useful for "why," but **this folder is the current canon.**

> **Just need to MODIFY an existing slide's JSON** (change text, center, make
> bigger, edit the header, add a capsule)? Read the shorter blind-follow pack
> first: [`spec/llm-guideline/`](../../llm-guideline/readme.md) — a 30-step
> locate→edit→validate recipe + layout recipes + field reference. Come back here
> for deep system detail (steps, sound, motion, new slide types).

---

## What this folder is

A **self-contained instruction pack** for any LLM (or human picking up
the deck cold) to:

- Understand the slide system architecture.
- Re-build any slide type from JSON.
- Add a new slide type without breaking the existing ones.
- Wire sound, ambient backgrounds, theme tokens correctly the first time.

If a fact contradicts something in `/spec/slides/NN-*.md`, **this folder
wins.** The numbered specs are append-only history; this folder is the
distilled current truth.

> 🧭 **Author from JSON in one sitting?** Jump straight to
> [`28-component-and-animation-catalog.md`](./28-component-and-animation-catalog.md)
> — every slide type (17), transition (5), text animation (4), capsule
> color (9), expand animation (6), step motion variant (3), and the
> import/export contract for moving decks between projects, with a
> machine-readable mirror at [`CATALOG.json`](./CATALOG.json).

---

## Reading order

| File | Phase | Purpose |
|------|-------|---------|
| `00-readme.md`                       | —  | This file. Orientation. |
| `01-architecture-and-files.md`       | —  | Project file map; what to add for a new slide. |
| `02-step-system-complete.md`         | —  | Canonical playbook for `StepTimelineSlide`. |
| `03-sound-system-complete.md`        | —  | Asset table + flow + wiring recipe. |
| `04-ambient-and-title-background.md` | —  | Ambient layer + title slide build recipe. |
| `05-design-tokens-and-theme.md`      | —  | Color tokens, typography, no-hex rule. |
| `06-json-authoring-cheatsheet.md`    | —  | Copy-paste JSON templates per slide type. |
| `07-canvas-and-scaling.md`           | 7  | 1920×1080, scale math, font scaling. |
| `08-background-system.md`            | 8  | Sandwich rule, gradient patterns. |
| `09-title-background.md`             | 8  | Title + section header background. |
| `10-typography.md`                   | 9  | Font pairs, scale, weights. |
| `11-color-tokens.md`                 | 9  | Semantic token table with HSL. |
| `12-steps-pattern.md`                | 10 | Embedded reference + visual anatomy. |
| `13-motion-system.md`                | 11 | Mirrors steps motion numbers for any slide. |
| `14-sound-system.md`                 | 11 | Pointer to global sound system. |
| `15-authoring-template.md`           | 12 | `SlideLayout` skeleton. |
| `16-voice-to-slide-protocol.md`      | 13 | Voice/text → JSON contract. |
| `17-do-and-dont.md`                  | 13 | Approved patterns vs forbidden ones. |
| `18-acceptance-checklist.md`         | 14 | Pass/fail across visual / motion / sound / a11y. |
| `19-remediation-pack.md`             | 17 | Closes Audit 02 gaps: ASCII references, new-type recipe, required-fields table, variety matrix. |
| `20-webcam-overlay.md`               | —  | **PROPOSED.** Webcam-on-slide JSON contract. Runtime not yet implemented — do NOT emit `content.webcam` in deck JSON until the user signs off. See `spec/research/01-webcam-overlay.md`. |
| `21-click-reveal-and-hotspots.md`    | 21 | Click-reveal + hotspot rendering rules, layer/z-index, and reveal-hints toggle. Closes Audit-16 §2.1. |
| `22-add-new-slide-type.md`           | 22 | End-to-end recipe for adding a new `slideType`: enum, types.ts, three switch sites, skeleton component, JSON example, acceptance checklist. |
| `23-slide-type-contracts.md`         | 23 | Machine-checkable per-slideType zod contracts (`src/slides/contracts.ts`) + required-fields table; loader fails fast by slideType with named errors. |
| `24-collision-matrix.md`             | 24 | Full 5×4 `transition × textAnimation` grid (allowed/reserved/forbidden) + neighbor-collision rule + per-pair safe-neighbor lookup. Authoritative source; supersedes `19-remediation-pack.md` §G4. |
| `25-json-vs-md-contract.md`          | 25 | JSON (machine source of truth) vs MD (blind-AI brief) split + contributor checklist. Enforced by `src/test/spec-parity.test.ts`. |
| `26-click-reveal-contract.md`        | 26 | Click-reveal & expand contract — `revealSlide` / `expand` on capsule, step, hotspot. Owned by `SlideStage` via `<ClickRevealExpandPanel>`. |
| `27a-table-slide.md`                 | 27 | **Field-by-field** authoring contract for `TableSlide` (headers, zebra rows, column alignment, accent bars, cell fade-in). v0.181. |
| `27b-code-block-slide.md`            | 27 | **Field-by-field** authoring contract for `CodeBlockSlide` (shiki/manual/plain modes, copy button, line emphasis, gutter). v0.181. |
| `27c-box-diagram-slide.md`           | 27 | **Field-by-field** authoring contract for `BoxDiagramSlide` (% positioning, fields, edges with crow's-foot cardinality). v0.181. |
| `27d-layout-slide.md`                | 27 | **Field-by-field** authoring contract for `LayoutSlide` (9 grid presets, slot kinds card/plain/codeblock, variants). v0.181. |
| `28-component-and-animation-catalog.md` | 28 | **🧭 Single-stop catalog** — counts + JSON exemplars for every slide type, transition, text animation, capsule color, expand animation, step motion variant + cross-project import/export contract. Companion: [`CATALOG.json`](./CATALOG.json). v0.189. |

Files 07–18 are **stubs** during the scaffold phase (Phase 6) — each will
be filled in by its owning phase number listed above.

---

## The 10 commandments (ignore at your own risk)

1. **Brand:** the company is **Riseup Asia LLC** (no space, no hyphen).
   Presenter is **MD ALIM UL KARIM**.
2. **Theme:** dark Noir & Gold — bg `#0D0D0D`, gold `#C9A84C`, ember
   `#E85D3A`, cream `#F0D78C`. Never write hex in components — always
   `hsl(var(--gold))` etc.
3. **Typography:** titles in **Ubuntu Bold** (`.font-display`), body in
   **Inter**. Step row titles use Ubuntu Bold (spec 36 supersedes the
   earlier Poppins rule).
4. **Content:** keywords-only. Never write paragraphs. Presenter
   narrates; slides are visual anchors.
5. **Spec-first:** any new deck or slide ships JSON+MD spec under
   `/spec/slides/{deck}/NN-name.{json,md}`. JSON is the **runtime source
   of truth** — the loader uses `import.meta.glob`.
6. **Routing:** flat — `/N` is slide N (1-based). URL syncs both ways.
7. **Controller:** hidden by default, hover-reveals. Match
   `spec/slides/llm/assets/controller/controller-pill.png`. Position:
   bottom-center default.
8. **Animations:** must vary across consecutive slides. Respect
   `prefers-reduced-motion`. Motion is **transform + opacity only** —
   no blur, no scale, except where a spec explicitly authorizes it.
9. **No Lovable branding.** No logo, favicon, OG tags, meta references
   to "Lovable" anywhere.
10. **Code changes bump the version.** At minimum, bump the patch.
    Update `.lovable/memory/index.md` if you change a core rule.

---

## File map of the broader project (you don't need to memorize this — it's in 01)

```
src/slides/
  enums.ts              SlideType / SlideTransition / TextAnimation / CapsuleColor
  types.ts              SlideSpec, StepSpec, CapsuleSpec, ContactRow, …
  loader.ts             import.meta.glob('/spec/slides/{deck}/*.json')
  themes.ts             applyTheme(), getStoredTheme()
  preset.ts             titleClassFor(), deck-wide preset rules
  sound.ts              slideSound singleton (see file 03 in this folder)
  SlideStage.tsx        wraps each slide; owns AnimatePresence + ambient layer
  components/
    AmbientBackground.tsx
    BrandHeader.tsx, BrandStrip.tsx, BrandedQR.tsx
    Capsule.tsx, ClickRevealBadge.tsx
    AlignmentGuideOverlay.tsx, SlidePreviewAlignmentOverlay.tsx
  controls/
    ControllerBar.tsx, DeckMenu.tsx, DotPagination.tsx, ThemeMenu.tsx
  types/                ONE FILE PER SlideType
    TitleSlide.tsx, MiddleTitleSlide.tsx, KeywordSlide.tsx,
    CapsuleListSlide.tsx, StepTimelineSlide.tsx, FocusTimelineSlide.tsx,
    AdvanceStepSlide.tsx, ImageSlide.tsx, QrMeetingSlide.tsx,
    SectionDividerSlide.tsx
spec/slides/
  slide.schema.json     ← JSON schema for one slide
  deck.schema.json      ← JSON schema for deck.json
  {deck}/               ← e.g. showcase/
    deck.json
    NN-name.json + NN-name.md
spec/slides/llm/        ← THIS FOLDER. Read first.
spec/slides/assets/     ← reference screenshots
```

---

## When the user gives you a screenshot or a voice note

1. Identify which slide type matches the brief best (file 06 has the
   decision tree).
2. Open the JSON template for that slide type from file 06.
3. Fill in `eyebrow / title / subtitle / steps / capsules` — keep
   content keyword-only. If they wrote a paragraph, distill it to ≤6
   words per chunk.
4. Pick `transition` and `textAnimation` so the new slide doesn't
   repeat the previous slide's pair (variety rule, file 02 §enter).
5. If it's a step slide, decide between `StepTimelineSlide` (chain +
   side description) or `AdvanceStepSlide` (camera dolly, one frame
   at a time) — see file 02 §2.
6. Drop the JSON in `spec/slides/{deck}/NN-name.json`. Add it to the
   `slides` array in `deck.json`. Write the companion `.md` with a
   one-paragraph design intent note.
7. Bump `package.json` patch version. Add a memory note if you
   introduced a new design pattern.
