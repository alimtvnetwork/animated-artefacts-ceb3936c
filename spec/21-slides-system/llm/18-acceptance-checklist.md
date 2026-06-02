# 18 — Acceptance Checklist

> **Phase 14/20** · The pass/fail gate every slide must clear before
> it ships. Run this checklist against any slide JSON (yours or
> another LLM's) before merging into `deck.json`. If any box is ❌,
> fix it before claiming done.

---

## 1. Visual (8 checks)

- [ ] **V1.** Background uses `hsl(var(--bg))` or an approved ambient
      preset from `08-background-system.md`. No raw hex.
- [ ] **V2.** All text uses semantic tokens (`text-foreground`,
      `text-muted-foreground`, `text-gold`). No `text-white`,
      `text-black`, no `text-[#…]`.
- [ ] **V3.** Titles render in `.font-display` (Ubuntu Bold). Body in
      Inter. No Poppins, no Helvetica, no system override.
- [ ] **V4.** Type scale matches `10-typography.md` — no arbitrary
      `text-[42px]` values.
- [ ] **V5.** No accent line / underline / border under titles
      (audit-pinned, file 17 §8).
- [ ] **V6.** `showBrandHeader` is `false` on `TitleSlide` and
      `MiddleTitleSlide`; `true` on every content slide.
- [ ] **V7.** `brandStrip` only on slides explicitly authorized by
      spec 08. Default `false`.
- [ ] **V8.** For `StepTimelineSlide`: gold connector at `left: 18px`,
      list column 560px, gutter 80px, detail panel 800px (file 12 §1).

## 2. Motion (6 checks)

- [ ] **M1.** `transition` ∈ enum from `13-motion-system.md` §2.
- [ ] **M2.** `textAnimation` ∈ enum from `13-motion-system.md` §3.
- [ ] **M3.** Variety guard: pair differs from slide N-1 **and** N+1
      (file 16 §5).
- [ ] **M4.** No animated `filter`, `width`, `height`, or `scale` on
      text rows. Transform + opacity only.
- [ ] **M5.** Spring profiles use the pinned values
      (`stiffness: 260–380`, `damping: 26–28` for snap; see file 13).
- [ ] **M6.** `prefers-reduced-motion` falls back to 150ms opacity
      cross-fade. No per-component override.

## 3. Sound (5 checks)

- [ ] **S1.** Default `sound.on` is `false` unless brief explicitly
      requests audio.
- [ ] **S2.** Sound plays via `slideSound` singleton — never
      `new Audio()` inline.
- [ ] **S3.** `whoosh` volume ≤ 0.50; `fadeClick` ≤ 0.09 (file 14).
- [ ] **S4.** Focus-change debounce ≥ 60ms.
- [ ] **S5.** Reduced-motion users: sound is muted alongside motion.

## 4. Content (6 checks)

- [ ] **C1.** Brand spelled **Riseup Asia LLC** exactly. Presenter
      **MD ALIM UL KARIM** exactly.
- [ ] **C2.** No "Lovable" anywhere — logo, favicon, OG, meta, copy.
- [ ] **C3.** Every chunk (`title`, `eyebrow`, `subtitle`, capsule
      label) ≤ 6 words.
- [ ] **C4.** `description` (StepTimeline) ≤ 120 characters.
- [ ] **C5.** Verbs in present tense; no trailing punctuation in
      labels/eyebrows.
- [ ] **C6.** No paragraphs anywhere on the slide. Keyword-only.

## 5. Wiring (5 checks)

- [ ] **W1.** File path is `spec/slides/{deck}/NN-name.json`
      (zero-padded, 1-based).
- [ ] **W2.** Companion `NN-name.md` exists with one paragraph of
      design intent.
- [ ] **W3.** Filename appended to `slides` array in
      `spec/slides/{deck}/deck.json` at the intended index.
- [ ] **W4.** `slideType` is a registered enum in
      `src/slides/enums.ts` and handled in `SlidePreview.tsx`.
- [ ] **W5.** JSON validates against `spec/slides/slide.schema.json`.

## 6. Accessibility (5 checks)

- [ ] **A1.** All interactive controls keyboard-focusable; visible
      focus ring uses `--gold`.
- [ ] **A2.** Color contrast: gold-on-bg ≥ 4.5:1 for body, ≥ 3:1 for
      large text. Cream-on-bg ≥ 4.5:1.
- [ ] **A3.** Images have `alt` text (or `alt=""` if decorative).
- [ ] **A4.** Reduced-motion path tested (toggle OS setting; opacity
      fallback runs).
- [ ] **A5.** Single `<h1>` per slide; semantic `<section>` /
      `<header>` for brand.

## 7. Code quality (5 checks)

- [ ] **Q1.** `package.json` patch version bumped.
- [ ] **Q2.** No new files outside the documented locations
      (`spec/slides/`, `src/slides/`, `.lovable/memory/`).
- [ ] **Q3.** Memory updated if a Core rule changed (file 00 §10).
- [ ] **Q4.** Edits use `code--line_replace` where possible; no
      gratuitous file rewrites.
- [ ] **Q5.** Any new persistent state lives in Lovable Cloud, not
      `localStorage`.

---

## 8. Scoring

- **40 / 40** = ship it.
- **35–39** = ship after fixing the failed boxes inline.
- **30–34** = stop. Re-read the referenced file for each ❌ before
  re-submitting.
- **< 30** = the slide does not understand the system. Restart from
  `00-readme.md` → `06-json-authoring-cheatsheet.md`.

---

## 9. How to run this checklist

1. Open the slide JSON + the rendered preview side by side.
2. Walk sections 1 → 7 in order. Mark each box ✅ or ❌.
3. For every ❌, open the referenced spec file, fix, re-render.
4. Re-run only the section you changed (motion fix → re-run §2).
5. When all 40 boxes are ✅, commit + bump version.

---

## 10. Acceptance + changelog

- Checklist covers visual, motion, sound, content, wiring, a11y,
  code quality — every dimension a slide can fail.
- 2026-04-26 (v0.80.8): Phase 14 — 40-box pass/fail acceptance
  checklist with scoring tiers.
