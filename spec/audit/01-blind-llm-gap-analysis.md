# Audit 01 — Blind-LLM Gap Analysis

**Date:** 2026-04-26 (Asia/Kuala_Lumpur)
**Scope:** Can a "blind" LLM model — given only `/spec/**` and no other
context, no chat history, no live preview — re-implement the **Step
system, Sound system, Ambient background, and Title slide** to the
quality level the user has in their current build (v0.77.0)?

**Audience persona:** the *dumbest-but-honest* model. Follows instructions
literally, does not infer, does not guess design intent, will copy & paste
code blocks if and only if they're in the doc.

---

## TL;DR scorecard

| Subsystem | Score | Verdict |
|-----------|-------|---------|
| Steps (StepTimeline + AdvanceStep) | **7/10** | Functional rebuild possible, but motion timing scattered across 9 specs (17, 18, 20, 23, 27, 32, 33, 36, 40). Risk: model picks the wrong "current" version. |
| Sound system | **8/10** | Spec 21 is unusually complete (asset table, code snippets, ffmpeg recipes). Only gap: no consolidated "wire it into a new slide type" recipe. |
| Ambient background | **6/10** | Spec 24 covers props but lacks a runnable example, doesn't list what icons each preset uses (only describes them), and the cursor parallax math is in the addendum without code. |
| Title slide | **6/10** | Specs 15 + 31 cover visuals + animation timeline, but the **icons list** is given as a comma-separated text blob with no per-icon position rule, and the radial-glow CSS is the only reproducible artifact. |
| Theme tokens | **9/10** | Spec 07 + token table is complete. Only gap: no rendered swatch images. |
| JSON shape (deck + slide) | **9/10** | Schemas in repo, examples in `showcase/`. Almost no gap. |
| Folder structure | **5/10** | `mem://features/folder-structure` exists but is not under `/spec`. A blind LLM with only `/spec` would not find it. |

**Aggregate:** **7.0 / 10**. A blind LLM **can** ship a working deck, but
will probably:
- pick StepTimeline v2 instead of v3.3 (because the file is alphabetically first),
- ship the procedural whoosh synth (because the asset path discovery is buried in §8 of spec 21),
- under-build the ambient background (because it looks optional and doesn't have a code example).

---

## 1. Methodology

I ran the audit by re-reading each spec **as if I had no project context**:

1. Skim only the filename + the first paragraph (what most LLMs do under token pressure).
2. Look for an "implementation contract" that names: file path, exported symbols, props/types, motion constants, asset paths.
3. Check whether the doc gives me a **target image** and a **broken/anti-pattern image** so I know what to compare against.
4. Check whether the doc tells me **which version supersedes which** (the one place v3.3 has, but v2 ↔ v2.1 ↔ v3 ↔ v3.2 ↔ v3.3 do not consistently say).
5. Try to implement from memory — note every assumption I have to invent.

Per assumption I had to invent → −0.5 points. Per missing artifact → −1.

---

## 2. Subsystem deep-dive

### 2.1 Steps  →  7/10

**What's good**
- Spec 17 §4 has a constants table (`STEP_INTERVAL_MS`, `PAUSE_MS`, easing).
- Spec 33 walks every interaction (snap transition, keyboard, CTA pill, progress pill).
- Spec 32 has a full canvas-grid table (1920×1080 → centered 1440 → 560/80/800).
- Spec 40 documents the snap-to-guide editor.
- Two reference images exist (`step-timeline-target.png`, `step-timeline-broken.png`) — but they're hidden in `/spec/slides/assets/step-timeline-reference/`, not linked from spec 17.

**Gaps the blind LLM will fall into**
1. **Version chaos.** Specs 17, 20, 23, 27, 32, 33, 36 all self-describe as "the current step spec." The model will read the lowest-numbered file (17) as the truth and ship a v2 timeline. → −1.5
2. **Two slide types confused.** `StepTimelineSlide` (spec 17/23/27/32/33/36/40) vs `AdvanceStepSlide` (spec 18/20). The names sound identical to a model. Neither file's title says "this is NOT the other one." → −0.5
3. **Code-reference snippets** for the runtime guards (the "first-load quiet" hack, the snap math `leftOffsetPx = max(0, guideX - bodyX)`) are written as prose. A model needs the actual code shape. Partially fixed in spec 36/40. → −0.25
4. **No consolidated "build a step slide from zero" recipe.** A blind model has to assemble it from 9 specs.

**Fix:** ship `spec/slides/llm/02-step-system-complete.md` as the single
"build me a step slide" instruction. Reference the per-version specs only
for archeology. (Done — see this commit.)

---

### 2.2 Sound system  →  8/10

**What's good**
- Spec 21 has an **asset table** (kind / source / default volume / used by).
- The autoplay-policy + first-gesture unlock is described in §3.
- ffmpeg recipes for `fade_swoosh.mp3` and `fade_swoosh_v2.mp3` are inline.
- `play()` / `setMuted()` / `isMuted()` API listed.
- The "first whoosh sounds wrong" story + fix is in the v0.43 addendum — exact constants (`READY_WAIT_MS = 800`, prefetch behavior).

**Gaps**
1. The `fadeClick` cue is in `src/slides/sound.ts` and in spec 33 §6, but **not in the spec 21 asset table**. A blind model would miss it. → −0.75
2. No "**wiring example for a custom slide type**" — the only wiring shown is for AdvanceStep and the title slide. A model adding a new slide that wants sound has to copy from the renderer source. → −0.5
3. No explanation of *why* the cinematic cues skip the synth fallback (it's in §0 v0.37 + §addendum v0.43, but those are 2 separate places). Consolidate.
4. No diagram of the whole flow (asset → cache → AudioContext → buffer source → gain envelope → output). Pure prose only.

**Fix:** ship `spec/slides/llm/03-sound-system-complete.md` with the
diagram + "add sound to your new slide" recipe. (Done.)

---

### 2.3 Ambient background  →  6/10

**What's good**
- Spec 24 lists props on the component.
- §3 lists icon themes per slide type.
- v0.43 idle Lissajous addendum explains the "icons should move without a mouse" fix.

**Gaps**
1. **No code example** of mounting `<AmbientBackground>` inside a slide. A blind model has to guess where it sits in the JSX tree (above content? below? what z-index?). → −1
2. The icon themes table names lucide icons but doesn't import them. Some icon names in the table (e.g. `Telescope`) **don't exist** in the project's lucide-react version — the model will hit a build error. → −1
3. The cursor-parallax max-shift of 18px is mentioned but the smoothing formula (`cursor = lerp(cursor, target, 0.08)`) is in the addendum.
4. The presets in `src/slides/ambientPresets.ts` (`devtools / productivity / process / minimal`) **are not in spec 24** — they only appear in the JSON schema. The model would ship without preset support.

**Fix:** ship `spec/slides/llm/04-ambient-and-title-background.md` with a
verified icons table (cross-checked against `lucide-react` exports), a
mount example, and the preset list. (Done.)

---

### 2.4 Title slide  →  6/10

**What's good**
- Spec 15 has the layer stack (base → glow → icons → content).
- Spec 31 has the enter timeline (`t = 0.00` → `t = 1.65`) and per-block delays.
- Both specs are short enough that a model will read them fully.

**Gaps**
1. **No reference screenshot** of the finished title slide. The user
   referenced an external image during chat, but it never made it into
   `/spec/slides/assets/`. → −1.5
2. The icon list is comma-separated text. A model can paste them but won't
   know which icons sit *behind* the title vs *in the corners* — there is
   no positioning rule beyond "deterministic seeded random."
3. The "no eyebrow by default" rule in §4 contradicts the JSON schema,
   which lists `eyebrow` as a normal field. A model may still render one.
4. The shimmer sweep (`shimmer-sweep` utility) is only documented in spec
   03 §2 — a model reading 15 in isolation won't enable it.

**Fix:** ship `spec/slides/llm/04-ambient-and-title-background.md` (same
file) with a single "title-slide build recipe" that pulls 15 + 31 + 03
together. (Done.)

---

### 2.5 Design tokens / theme  →  9/10

Almost nothing missing. Only nice-to-have: rendered HSL swatches.

### 2.6 JSON shape  →  9/10

`slide.schema.json` + `deck.schema.json` + `showcase/` examples. The
blind LLM has all it needs. Only nit: schema files aren't symlinked into
`/spec/slides/llm/`, so a model that *only* reads `/spec/slides/llm/`
will miss them. The README in the new folder fixes this with explicit
links.

### 2.7 Folder structure  →  5/10

`mem://features/folder-structure` is in `.lovable/memory/`, which a
blind LLM (only given `/spec/`) will not see. We've now mirrored the
canonical structure into `spec/slides/llm/01-architecture-and-files.md`.

---

## 3. Why a blind LLM will fail without these fixes

The **dumbest blind model** will:

1. Read filenames in alphabetical order. `17-step-timeline-v2.md` wins.
2. Implement a v2-style step slide (autoplay on, single description panel
   inline below the row, no fixed-slot rows, no Ubuntu Bold, no centered
   1440px composition).
3. Wire sound by reading spec 21 §0 and §1 only — ship procedural
   whooshes (not the MP3 path) because §8 is "another addendum."
4. Skip the ambient background entirely (looks optional in spec 24).
5. Build a title slide that animates everything at once because spec 31
   §5 is the one place that says "use explicit per-block delays, not
   container stagger."
6. Hard-code `#C9A84C` somewhere because the theme token rule is in
   spec 07 but the title slide rule (spec 15) doesn't repeat it.

The **smartest blind model** will spot the version superseding markers
("supersedes spec 17 §X") and chase them — but will still need 30
minutes of reading because there's no top-level "current canon" file.

---

## 4. What we shipped to close the gaps (this commit)

1. `spec/slides/llm/00-README.md` — single entry point. Tells any AI:
   *"Read the files in this folder in numeric order. Ignore everything
   else in /spec/slides/ until you're done."*
2. `spec/slides/llm/01-architecture-and-files.md` — file map +
   "minimum files you must create when adding a new slide type."
3. `spec/slides/llm/02-step-system-complete.md` — consolidated step
   playbook (current canon = v3.3 + interaction layer + first-load
   quiet + snap-to-guide). Inlines the reference images.
4. `spec/slides/llm/03-sound-system-complete.md` — flow diagram +
   asset table (now includes `fadeClick`) + "add sound to a new slide"
   recipe.
5. `spec/slides/llm/04-ambient-and-title-background.md` — verified icon
   imports, preset list, mount example, title-slide recipe.
6. `spec/slides/llm/05-design-tokens-and-theme.md` — token table +
   "never write hex" rule.
7. `spec/slides/llm/06-json-authoring-cheatsheet.md` — copy-paste JSON
   templates per slide type.
8. Reference images mirrored into `spec/slides/llm/assets/`.

After these, the blind-LLM score should rise to ~9/10. We'll re-audit
on the next pass.

---

## 5. Re-audit checklist (run before shipping the next major version)

Open ONLY the `/spec/slides/llm/` folder in a fresh editor window.
Without looking at the source code, can you answer these in <2 minutes?

- [ ] Which slide-type enum values exist? (10)
- [ ] Where does the runtime sound manager live? (`src/slides/sound.ts`)
- [ ] What's the canvas size for layout decisions? (1920×1080)
- [ ] What centered max-width does the StepTimeline use? (1440px)
- [ ] What's the symmetric margin? (240px each side)
- [ ] What's the active-row min-height rule? (`calc(--step-title-active * 1.05)`)
- [ ] What font are step row titles? (Ubuntu Bold)
- [ ] What MP3 powers the focus-arrival whoosh? (`/sounds/fade_swoosh_v2.mp3`)
- [ ] What's the autoplay-policy unlock event? (first `pointerdown` or `keydown`)
- [ ] What's the gap between consecutive title-slide capsules? (90ms)

If any answer requires opening a file outside `/spec/slides/llm/`, the
folder has regressed and needs another pass.
