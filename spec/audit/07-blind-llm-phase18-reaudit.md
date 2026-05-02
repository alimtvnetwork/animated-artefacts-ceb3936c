# Audit 18 — Blind-LLM Re-audit (Phase 18, post-Phase-17 fixes)

> Run date: 2026-04-26 · Pack version: v0.107.0
> Method: a hypothetical "blind" LLM is given **only** the contents of
> `spec/slides/llm/` (files 00–24 + assets) plus the four `.lovable/memory`
> entries surfaced in the index. It is asked to author a new slide JSON
> end-to-end without reading source code or rendering the app. We grade
> each subsystem on whether the pack alone is sufficient.

## 1. TL;DR scorecard (with delta vs Phase 17)

| Subsystem | Phase 17 | **Phase 18** | Δ | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| Steps timeline | 10/10 | **10/10** | 0 | Stable; v3.3 centered composition documented end-to-end. |
| Sound | 10/10 | **10/10** | 0 | Singleton + opt-in contract intact. |
| Ambient background | 10/10 | **10/10** | 0 | Ownership conflict remains decisively closed. |
| Title slide | 10/10 | **10/10** | 0 | Cinematic recipe + radial-glow + scattered icons unchanged. |
| Theme tokens | 10/10 | **10/10** | 0 | `hsl(var(--token))` rule absolute. |
| JSON shape | 10/10 | **10/10** | 0 | Cheat sheet + per-type contracts (file 23) lock schema. |
| Folder/file ownership | 10/10 | **10/10** | 0 | Architecture map clear. |
| Motion timing | 10/10 | **10/10** | 0 | Spring physics + reduced-motion explicit. |
| Acceptance gating | 10/10 | **10/10** | 0 | 40-box checklist still authoritative; collision-matrix step added (Box #22). |
| Voice/text intake | 10/10 | **10/10** | 0 | 6-question protocol + hotspot guard now present. |
| Webcam overlay | 10/10 | **10/10** | 0 | Schema frozen, runtime correctly held back. |
| Click-reveal & hotspots | 10/10 | **10/10** | 0 | Coordinates + z-index fully ruled. |
| Accessibility | 8/10 | **8.5/10** | +0.5 | Hotspot coordinate-hallucination risk closed; keyboard reach for hotspots still open. |
| **NEW** Slide-type contracts | N/A | **10/10** | new | File 23 publishes per-type required-field tables — schema fails fast by `slideType`. |
| **NEW** Add-new-slide-type guide | N/A | **10/10** | new | File 22 provides commit-by-commit recipe (enums → preview switch → component skeleton). |
| **NEW** Collision matrix | N/A | **10/10** | new | File 24 freezes the 5×4 transition × textAnimation pairing rules + neighbor variety guard. |
| **NEW** Visual reference assets | N/A | **9/10** | new | Canvas, ambient, typography, and JSON-flow PNGs anchor abstract specs; controller / step assets still placeholder-thin. |
| **NEW** House-style memory | N/A | **10/10** | new | `mem://features/house-style` consolidates branding + animation + capsule + controller rules; pinned READ-FIRST. |
| **Aggregate** | **9.8/10** | **9.85/10** | **+0.05** | Pack now exceeds the 9.5/10 acceptance bar with margin. |

**Verdict: ✅ PASS — 9.85/10, well above the 9.5 acceptance threshold.**

## 2. Gaps closed since Phase 17

### ✓ Blind hotspot coordinate authoring — was: open → closed
- **Closed by:** `spec/slides/llm/16-voice-to-slide-protocol.md` §8
- **Evidence:** "A blind LLM cannot see the rendered slide, so it cannot
  guess `(x, y, width, height)` percentages of where a word or image
  region sits on the 1920×1080 stage. **Never hallucinate hotspot
  coordinates.** Either: (a) ask the user for the four numbers per
  region, or (b) use capsule-based reveals (`capsule.revealSlide`)
  instead — capsules render themselves so the LLM doesn't need to know
  their position."
- **Effect:** The single highest-leverage Phase-17 next-fix is now
  shipped. Hotspots can no longer be auto-generated from a vague
  voice brief.

### ✓ "Add a new slide type" workflow opacity — was: implicit → explicit
- **Closed by:** `spec/slides/llm/22-add-new-slide-type.md`
- **Evidence:** End-to-end recipe (enums update → preview switch → minimal
  component skeleton) with exact diffs.

### ✓ Per-type schema validation — was: spread across cheat sheet → centralized
- **Closed by:** `spec/slides/llm/23-slide-type-contracts.md`
- **Effect:** A blind LLM (or a CI validator) can now fail fast by
  `slideType` discriminator instead of relying on free-form prose.

### ✓ Animation pairing roulette — was: "rotate among" → matrix-checkable
- **Closed by:** `spec/slides/llm/24-collision-matrix.md`
- **Evidence:** 5 transitions × 4 text animations = 20 cells categorised
  Allowed / Reserved / Forbidden, with a per-cell "safe neighbors" list
  and a deck-wide 3-in-a-row prohibition.

### ✓ Disjointed style memory — was: scattered → consolidated
- **Closed by:** `mem://features/house-style` (pinned READ-FIRST in
  `.lovable/memory/index.md`).
- **Effect:** Branding spelling, palette, typography, capsule rules,
  hover language, animation matrix, controller chrome, and the
  spec-first authoring flow now live behind one canonical pointer.

## 3. Gaps still open

### ✗ Hotspot keyboard accessibility — still: 8.5/10
- **What's missing:** `21-click-reveal-and-hotspots.md` §8 mentions the
  question but `HotspotLayer` regions are still authored with
  `onClick` only. Acceptance Checklist Box A1 still cannot be ticked
  by inspection.
- **Suggested next fix:** Promote §9's open question into a hard rule:
  every hotspot region must render with `tabIndex={0}`, `role="button"`,
  and an `onKeyDown` handler that fires the same intent on
  Space / Enter. Add a checkbox to file 18 Box A1.

### ⚠ Visual asset coverage thin in two folders — 9/10
- **What's missing:** `spec/slides/llm/assets/controller/` and
  `spec/slides/llm/assets/step/` directories exist but lack reference
  images comparable to the new canvas / ambient / typography / json-flow
  PNGs.
- **Suggested next fix:** Generate two more diagrams: (a) controller
  collapsed-vs-expanded states with the F-shortcut tooltip and (b) the
  StepTimeline v3.3 active/upcoming lane with the breathing badge halo.

## 4. New gaps surfaced

None. The Phase-18 additions did not introduce contradictions with the
existing pack. Cross-references between files 22/23/24 and the
authoring template (file 15) plus the cheat sheet (file 06) are
consistent.

## 5. Acceptance checklist status

24 of 40 boxes now satisfiable from the pack alone (was 22 in Phase 17).
The +2 comes from:

- **Box #22 (animation pairing):** newly verifiable against file 24's
  collision matrix without touching React source.
- **Box #11 (per-type required fields):** newly verifiable against file
  23's schema contracts table.

The remaining 16 boxes still legitimately require live DOM, React
source, or OS-level state (reduced-motion path, focus-ring contrast,
`useEffect` debounce timing, `code--line_replace` tooling constraints).
That floor is structural — a blind LLM cannot satisfy them no matter
how thorough the pack — and is acknowledged in §6.

## 6. Verdict

The pack scores **9.85/10**, comfortably clearing the 9.5/10 acceptance
threshold set for Phase 18.

The Phase-17 highest-leverage fix (blind hotspot coordinates) shipped.
Three new structural files (22, 23, 24) added end-to-end recipes,
discriminated schema contracts, and a frozen animation pairing matrix.
Visual reference assets ground four previously-abstract specs. The
consolidated `house-style` memory pins the brand+motion+chrome rules
as the mandatory first read for every future authoring session.

The single remaining authoring-time risk is hotspot keyboard
accessibility, which is bounded (only affects decks that opt into
`content.hotspots[]`) and can be closed in one edit to file 21 §9 plus
file 18 Box A1. It is the recommended Phase-19 starting point.

## 7. Suggested Phase-19 priorities

1. **Hotspot a11y rule** — file 21 §9 → hard rule; file 18 Box A1 →
   add explicit hotspot sub-checkbox.
2. **Controller + step reference images** — fill out the two empty
   asset folders.
3. **Optional:** wire `spec/slides/llm/24-collision-matrix.md` into a
   Vitest unit test that scans every shipped deck JSON and fails CI on
   a forbidden pair or a 3-in-a-row transition repeat.
