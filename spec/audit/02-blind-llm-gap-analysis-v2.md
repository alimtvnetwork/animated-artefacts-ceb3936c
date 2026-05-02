# Audit 02 — Blind-LLM Gap Analysis (post LLM-pack)

**Date:** 2026-04-26 (Asia/Kuala_Lumpur)
**Scope:** Re-run the blind-LLM audit against the **new
`spec/slides/llm/` pack (files 00–18 + assets/INDEX.md)**, ignoring
all older `/spec/slides/NN-*.md` archeology. Same persona as Audit 01:
*dumbest-but-honest* model, no chat history, no live preview.

**Compare against:** Audit 01 baseline of **7.0 / 10** (which audited
the legacy `/spec/slides/*.md` corpus).

---

## 1. TL;DR scorecard

| Subsystem | Audit 01 | Audit 02 | Δ | Verdict |
|---|---|---|---|---|
| Steps (StepTimeline + AdvanceStep) | 7 | **9** | +2 | One canonical playbook (`02-step-system-complete.md`) supersedes 9 scattered specs. Anatomy + state table + asset refs in `12-steps-pattern.md`. |
| Sound system | 8 | **9** | +1 | `03-sound-system-complete.md` + `14-sound-system.md` give wiring recipe **and** debounce/volume pins. |
| Ambient background | 6 | **8** | +2 | `04-ambient-and-title-background.md` Part A = props + presets + cursor parallax. Still no rendered preset thumbnails (placeholder in INDEX). |
| Title slide | 6 | **8** | +2 | `04` Part B + `09-title-background.md` cover icons positioning, brand wordmark rules, presenter avatar. Logo + presenter assets present. |
| Theme tokens | 9 | **10** | +1 | `05-design-tokens-and-theme.md` + `11-color-tokens.md` + Do/Don't matrix in `17`. Zero ambiguity. |
| JSON shape (deck + slide) | 9 | **10** | +1 | `06-json-authoring-cheatsheet.md` (476 lines, copy-paste templates per type) + `15-authoring-template.md` envelope + `16-voice-to-slide-protocol.md` decision tree. |
| Folder structure | 5 | **9** | +4 | `01-architecture-and-files.md` makes the file map first-class under `/spec`. No more reliance on `mem://`. |
| Motion timing | — | **9** | new | `13-motion-system.md` pins spring + duration constants in one table. |
| Acceptance gating | — | **9** | new | `18-acceptance-checklist.md` 40-box pass/fail with scoring tiers. |
| Voice/text intake | — | **8** | new | `16-voice-to-slide-protocol.md` six-question intake + worked example. |

**Aggregate:** **8.9 / 10** (Audit 01 was 7.0). **+1.9** delta.

A blind LLM with only `spec/slides/llm/` can now:
- pick the right slide type from intent keywords (file 16 §2),
- copy the right JSON envelope (file 15) + per-type template (file 06),
- wire motion + sound with pinned constants (files 13, 14),
- self-grade with a 40-box checklist (file 18) before merging.

---

## 2. Remaining gaps (the −1.1 points)

Ordered by severity. Phase 17 will remediate these.

### G1. Empty asset folders (−0.4)

`assets/canvas/`, `assets/background/`, `assets/typography/`,
`assets/authoring/` are empty. INDEX.md lists them as "add when
authored," but a blind LLM reading file 07 (canvas) or file 10
(typography) won't see a reference render. Math is documented; visual
proof is not.

**Fix idea (Phase 17):** generate four lightweight reference images —
canvas frame at 1920×1080 with safe-area overlay, ambient drift
preview, type scale ladder, JSON-flow diagram. Even rough
illustrative renders unblock the audit.

### G2. No "from-zero new slide type" walkthrough (−0.3)

Files 01 + 15 say *where* to add a new `slideType` (enums.ts +
SlidePreview switch + types/ folder), but no end-to-end recipe walks
through one. A blind LLM adding a brand-new type will guess at the
React skeleton.

**Fix idea (Phase 17):** add §10 to file 15 — "Adding a brand-new
slide type in 5 commits", with the exact diff shape for `enums.ts`,
`SlidePreview.tsx`, and a minimal `types/MyNewSlide.tsx` skeleton.

### G3. No machine-checkable JSON contract per slide type (−0.2)

`spec/slides/slide.schema.json` exists but is generic. The cheatsheet
shows shapes, but a strict `oneOf` per `slideType` would let the
blind LLM run `ajv` and fail fast on shape errors.

**Fix idea (Phase 17):** add a `discriminator: { propertyName:
"slideType" }` block + per-type `$ref`s to `slide.schema.json`. Or,
cheaper: list the required-fields-per-type as a table in file 06
(half of it is already there — close the gap).

### G4. Variety guard is prose, not data (−0.2)

File 15 §4 + file 16 §5 describe the variety rule but don't give the
LLM a lookup table of "if neighbor is X, pick from {Y, Z}". Half the
LLMs will pick the same pair as a neighbor under token pressure.

**Fix idea (Phase 17):** add a 5×5 collision matrix to file 13 §2
listing valid `transition × textAnimation` pairs and which neighbors
they conflict with.

---

## 3. Risk scenarios that **no longer** trigger

These were Audit 01 fails that are now closed:

- ❌→✅ Picking StepTimeline v2 over v3.3: file 02 is the only step
  doc; legacy specs are explicitly archeology (file 00 §"What this
  folder is").
- ❌→✅ Shipping the procedural whoosh synth: file 03 + file 14 pin
  the asset path and singleton wiring on page 1.
- ❌→✅ Under-building the ambient background: file 04 Part A has the
  prop list and parallax math inline.
- ❌→✅ Inventing hex colors: files 05, 11, 17 §1 hammer the
  HSL-token-only rule three times.

---

## 4. Methodology notes

Same as Audit 01 (skim filename → first paragraph → look for
contract → check for target+anti-pattern image → check supersedes
chain). Per assumption invented → −0.5; per missing artifact → −1.
INDEX.md absorbed the "missing supersedes chain" penalty by being
explicit about which folders are placeholders.

---

## 5. Recommendation

Proceed to **Phase 17 — Remediate top gaps**, in order G1 → G2 → G3 →
G4. After remediation, run **Phase 18 — Re-audit** and target
**≥ 9.5 / 10** as the ship gate.

---

## 6. Changelog

- 2026-04-26 (v0.81.0): Phase 16 — blind-LLM re-audit against the
  new `spec/slides/llm/` pack. Aggregate 8.9/10 (+1.9 vs. Audit 01).
  Top gaps: empty asset folders, no new-slide-type walkthrough,
  generic JSON schema, prose-only variety guard.
