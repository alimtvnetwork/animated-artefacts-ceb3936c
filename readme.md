# Riseup Asia — Slide Presentation

A React + Vite slide-presentation engine. Decks are JSON-driven; the renderer
lives in `src/slides/`. This README's lower sections are the running release
log; the orientation below is the fast path for newcomers (human or AI).

## 🤖 For AI agents — start here

**👉 Single shareable guide: [`LLM.md`](LLM.md).** Hand this one file to any LLM
(Claude, GPT, Gemini, etc.) and it knows how to create, edit, reorder, and ship
slides — every field, every rule, in a 30-step playbook. Read it first for slide
work; the packs below are deeper reference.


Read [`.lovable/what-to-read.md`](.lovable/what-to-read.md) first (the onboarding
map), then [`.lovable/memory/index.md`](.lovable/memory/index.md) (always-apply
rules) and [`spec/readme.md`](spec/readme.md) (spec layout).
A full reorganization plan lives in [`.lovable/reorg-plan.md`](.lovable/reorg-plan.md).

This README also carries the same guidance inline — see **[📂 Folder structure](#-folder-structure-what-each-path-owns)**,
**[📖 Which files the AI must read](#-which-files-the-ai-must-read-in-order)**, and
**[🛠️ How the AI does common work](#️-how-the-ai-does-common-work)** (create code, add a unit test, add a feature, write specs).

## Repository map (convention over configuration)

| Folder | What lives here |
|---|---|
| `src/` | The React app. `slides/` = renderer engine, `builder/` = deck builder UI, `pages/` = routes, `components/` = shared UI, `hooks/`, `lib/`, `types/`, `assets/` (bundled), `test/`. |
| `front-end/` | **Runtime deck data.** `project/<deck>/data/` is what the app loads live; `slide-template/` = starter JSON per slide type; `themes/`. |
| `spec/` | Canonical, numbered spec layout. See `spec/readme.md`. System design (`21-…`), per-slide content (`26-…`), issues (`22-…`), research (`15-…`), camera/number packs. |
| `public/` | Served as-is at runtime (sounds, reference, robots.txt). |
| `scripts/` | Audit/check tooling (TS) + `install/` (shell/ps1 installers). |
| `quality/` | Generated quality evidence: `audit/`, `metrics/`, `reports/` (not hand-edited). |
| `updates/spec/` | Per-change spec deltas (what/why/files/verify). |
| `.lovable/` | AI brain: `memory/` rules, coding-guidelines, prompts, onboarding map, ambiguity log, `reorg-plan.md`. |

## 📂 Folder structure (what each path owns)

```text
.
├── readme.md                       this file — repo map + AI onboarding + release log
├── index.html                      Vite entry
├── src/                            the React app
│   ├── main.tsx · App.tsx          bootstrap + router
│   ├── pages/                      routes: /N deck page, builder, presenter, settings, analytics
│   ├── slides/                     RENDERER ENGINE
│   │   ├── loader.ts               loads deck JSON → typed slides
│   │   ├── contracts.ts            zod contracts per slideType (runtime gate)
│   │   ├── themes.ts               theme registry + CSS-var tokens
│   │   ├── types/                  one renderer component per slideType
│   │   ├── components/             shared visual primitives (overlays, FitStage…)
│   │   ├── controls/ · hooks/ · utils/   controller, presenter hooks, helpers
│   │   └── transitions.ts · textAnimations.ts   animation tokens
│   ├── builder/                    deck-builder UI + validation actions
│   ├── components/                 shared app UI (shadcn-based)
│   ├── hooks/ · lib/ · types/      cross-cutting helpers + shared types
│   ├── assets/                     bundled assets (brand/, controller-reference/, camera-2026/)
│   ├── index.css · tailwind.config.ts   DESIGN TOKENS — semantic HSL vars only
│   └── test/                       Vitest specs (62+ files) — schema, contracts, regression
├── front-end/                      RUNTIME deck data (loaded live by the app)
│   ├── project/<deck>/data/slides.json       deck manifest (config + ordered list)
│   ├── project/<deck>/data/slides/NN-name.json   one slide per file — SOURCE OF TRUTH
│   ├── slide-template/             copy-me starter JSON, one per slideType
│   └── themes/                     runtime theme data
├── spec/                           canonical numbered specs (see spec/readme.md)
│   ├── 21-slides-system/           HOW the engine works: fundamentals, schemas, llm/ pack
│   ├── 26-slide-definitions/       WHAT specific decks contain (per-deck JSON+MD)
│   ├── 22-slides-issues/           bug reports — one numbered file each
│   ├── 15-research/ · 27-slides-number/      research + numbering
│   └── camera-2026/ · controller-2026/       feature spec packs
├── updates/spec/NN-*.md            per-change spec deltas (what/why/files/verify)
├── public/                         served as-is (sounds, reference imgs, robots.txt)
├── scripts/ + scripts/install/     audit/check/release tooling + env installers
├── quality/                        GENERATED evidence (audit/, metrics/, reports/) — not hand-edited
├── legacy/                         inert/archived material — not built
└── .lovable/                       AI brain (see below)
    ├── what-to-read.md             onboarding map (read first)
    ├── memory/index.md             always-apply Core rules
    ├── memory/{constraints,design,features,preferences,reference}/   typed memory files
    ├── coding-guidelines.md        12 hard coding rules
    ├── prompts/ · prompts.md       operating modes (no-questions, read/write memory)
    └── plan.md                     active roadmap
```

> Convention: one folder = one concern; every top-level and `spec/*` folder has its
> own `readme.md`. Root holds only config + entry + these dirs.

## 📖 Which files the AI must read (in order)

1. [`.lovable/what-to-read.md`](.lovable/what-to-read.md) — onboarding map (the canonical, fullest version of this workflow).
2. [`.lovable/memory/index.md`](.lovable/memory/index.md) — Core rules applied on EVERY action (brand, themes, constraints).
3. [`.lovable/coding-guidelines.md`](.lovable/coding-guidelines.md) — 12 hard coding rules (≤8-line functions, no `any`, files ≤100 lines, DRY, no inline hex).
4. [`spec/readme.md`](spec/readme.md) — which numbered spec folder owns what.
5. [`spec/21-slides-system/00-fundamentals.md`](spec/21-slides-system/00-fundamentals.md) + `slide.schema.json` / `deck.schema.json` — the JSON contract.
6. [`src/slides/contracts.ts`](src/slides/contracts.ts) + [`src/slides/loader.ts`](src/slides/loader.ts) — runtime validation + load path.

## 🛠️ How the AI does common work

**Create a new slide**
1. Pick a `slideType` from `spec/21-slides-system/llm/23-slide-type-contracts.md`.
2. Copy a starter from `front-end/slide-template/` into `front-end/project/<deck>/data/slides/NN-name.json`.
3. Fill `content` per its contract (keyword-only — no paragraphs).
4. Add a sibling `NN-name.md` with presenter notes (never read at runtime).
5. Register the slide in `front-end/project/<deck>/data/slides.json`.
6. Save → Vite hot-reloads → validates against `slide.schema.json`.

**Write code (any change)**
- Read `.lovable/coding-guidelines.md` FIRST. Renderer lives in `src/slides/`; new visual primitives go in `src/slides/components/`.
- Use semantic tokens from `src/index.css` / `tailwind.config.ts` — never raw hex in components.
- Search `src/` before adding a helper (DRY). Keep files ≤100 lines, functions ≤8 lines.
- A new `slideType` needs: renderer component in `src/slides/types/` + zod contract in `contracts.ts` + starter in `front-end/slide-template/`.

**Add a unit test**
- Tests live in `src/test/` (Vitest). Run a single file: `bunx vitest run src/test/<file>`; full suite: `bun run test`.
- New `slideType` or contract field → extend a contract test so coverage stays green.

**Add a new feature**
1. Write the spec FIRST: behaviour rules → `spec/21-slides-system/NN-*.md`; per-change delta → `updates/spec/NN-short-title.md`.
2. Implement per coding-guidelines.
3. Add Vitest coverage.
4. Pre-flight: `bunx tsc -p tsconfig.app.json --noEmit && bun run lint && bun run test && bun run build`.
5. Record durable decisions in `.lovable/memory/{type}/<name>.md` and index them in `memory/index.md`.

**Report / resolve an issue**
- New bug → `spec/22-slides-issues/NN-short-title.md`. Resolved → append a `## Resolution` section to that same file (never move it).

> Memory rule: never write files directly to `mem://` (the `.lovable/memory/` root).
> Memory files go in a typed subfolder (`constraints` / `design` / `features` / `preferences` / `reference`).

---


let's start now 2026-04-30 12:00

## v1.8.0 — Release notes (since v1.7.0) — CURRENT

**Controller moved to top-right (implementation).** Relocated `ControllerBar`
from bottom-right to top-right per `.lovable/spec/commands/01-controller-top-right.md`.
- `src/slides/controls/ControllerBar.tsx`:
  - Wrapper (L145): `bottom-6 right-6 items-end pt-4` → `top-6 right-6 items-start pb-4`.
  - Theme/Share/Deck popovers (L326): `bottom-full mb-3` → `top-full mt-3` (open downward).
  - Hamburger anchor (`recomputeAnchor`): `{ bottom: innerHeight - r.top }` →
    `{ top: r.bottom + 8 }`; panel `style` (L502) `bottom` → `top`. Anchor type
    updated `{ bottom; right }` → `{ top; right }` (fixes TS2339 build error).
- Spec `spec/21-slides-system/02-controller.md` Position section already updated in v1.7.0.
- Build: TS2339 (`Property 'bottom' does not exist`) resolved; no stale
  bottom-anchor references remain (grep clean).

## v1.7.0 — Release notes (since v1.6.0)

**Controller relocation — spec + audit (plan steps 1–2).** Began the
slide-system/export overhaul (`.lovable/plans/pending/01-slide-system-export-llm-overhaul.md`).
- **Audited** the controller anchor logic and recorded exact tokens to change
  in `.lovable/plans/subtasks/01-slide-system-export-llm-overhaul/01-controller-menu-tree.md`
  (wrapper `bottom-6 right-6`, popover `bottom-full`, hamburger `recomputeAnchor`).
- **Spec'd** the new **Top-right** controller default with downward-opening
  flyouts in `spec/21-slides-system/02-controller.md`; captured the user
  command in `.lovable/spec/commands/01-controller-top-right.md`.
- Root cause documented: controller hard-anchored bottom-right with all
  flyouts opening upward — TopRight requires flipping wrapper anchor + every
  popover's vertical direction. (Implementation lands in a later step.)

## v1.6.0 — Release notes (since v1.5.0)



Deck-fragment parity locked. The two authoring defects surfaced in v1.5.0 are fixed, the last stale schema constraint is reconciled with the renderer, and a new CI gate keeps every deck fragment valid against the canonical schema forever.

### Root cause

Two unrelated issues remained after v1.5.0: (a) `inside-studio/04-capsules.json` set capsule `clickRevealSlide: "click-reveal-process"` (a string) — `Capsule.tsx:91/97` treats a truthy value as an active reveal but matches on `slideNumber === value`, so a string makes the capsule render interactive yet navigate nowhere; (b) the schema capped `hoverText` at 28 chars citing flip-motion truncation, but `Capsule.tsx:106-107` now reserves width for the longer of `text`/`hoverText` (widthAnchor), so longer labels never truncate — the cap was stale.

### Fix (minimum correct change)

- `inside-studio/04-capsules.json` — `clickRevealSlide` → `24` (the actual `click-reveal-process` slide, `parentSlide: 4`).
- `slide.schema.json` + `spec/21-slides-system/22-interactive-capsules.md` — `hoverText` maxLength `28 → 48`, description/rule updated to document the widthAnchor behavior.
- New `src/test/deckFragmentSchema.test.ts` — validates every `front-end/project/*/data/slides/*.json` fragment against `slide.schema.json` (parity gate).

### Verification

- Ad-hoc Ajv over all 83 fragments: **4 → 0 failures**.
- Full suite **900/900** across 66 files (+2 from the new gate); `schema.test.ts` + `deckFragmentSchema.test.ts` green; spec-confidence boot log unchanged at `100/100`.

## v1.5.0 — Release notes (since v1.4.0)

Schema-drift closeout, round 2. `spec/21-slides-system/slide.schema.json` is now in parity with the runtime contracts in `src/slides/contracts.ts` and the `SoundKind` union in `src/slides/sound.ts`, so per-slide deck fragments validate against the canonical schema. No runtime behavior changes.

### Root cause

The JSON authoring schema was stricter than the runtime: it (a) listed `isClickReveal`/`showBrandHeader`/`showPresenterChip` in top-level `required` even though the runtime `Envelope` (contracts.ts) requires only `slideNumber/slideName/slideType/transition/textAnimation/content` (52/83 fragments omit `isClickReveal`); (b) required `content.image` for ImageSlide while the runtime `ImageContent` accepts `image` OR `images[]`; (c) typed `Step.description` as string-only while StepsChain3D uses the structured `Step3DDescription` object; (d) capped `sound.kind` to `[whoosh,click,pop]` while `SoundKind` also defines `fadeClick/zoom/fadeZoom`.

### Fix (minimum correct change)

- Top-level `required` trimmed to match the runtime `Envelope`.
- `ImageSlide` content → `anyOf` `image` | `images`.
- `Step.description` → `oneOf` string | `{title,bullets[],meta,body}`.
- `sound.kind` enum extended to the full `SoundKind` union.

### Verification

- Ad-hoc Ajv over all 83 deck fragments: **55 → 4 failures**; the 4 remaining are genuine authoring defects, NOT schema drift (see below).
- Full suite **898/898** across 65 files; `schema.test.ts` + `exportSchemas.test.ts` green; spec-confidence boot log unchanged at `100/100`.

### Known authoring defects surfaced (deck content, not schema)

- `inside-studio/04-capsules.json` capsule `clickRevealSlide: "click-reveal-process"` — a string is a runtime no-op (`clickRevealAudit.ts` only navigates when `typeof === 'number'`); should be the target slide number.
- `session-4-ai-coding/{03-recap,06-references,07-about-riseup}.json` capsule `hoverText` exceeds the 28-char label-flip cap.

## v1.4.0 — Release notes (since v1.2.0)

Schema-drift closeout. `spec/21-slides-system/slide.schema.json` is now back in sync with the runtime contracts in `src/slides/contracts.ts` (the documented source of truth). No runtime behavior changes — decks render identically.

### Root cause

The JSON authoring schema had drifted from the runtime zod contracts: every per-slideType content contract in `contracts.ts` uses `.passthrough()` (extra `content.*` fields allowed), but `slide.schema.json` declared `content.additionalProperties: false` and never modeled the fields added for newer slide types (NumberCallout/Equation/DataTable/Checklist/Tile/SessionOutline/BlastRadius — `number`, `tex`, `dataColumns`, `items`, `tiles`, `kicker`, `activeIndex`, etc.) nor the spec-31 per-step thumbnail (`Step.image` / `Step.imageRole`). The schema therefore rejected JSON the renderer happily accepts.

### Fix (minimum correct change)

- `content.additionalProperties` flipped `false → true` to mirror the runtime `.passthrough()` semantics.
- `Step` definition gained `image` + `imageRole` (spec 31 per-step thumbnail) so step rows with thumbnails validate.

### Verification

- `schema.test.ts` (6) + `exportSchemas.test.ts` (3) green; full suite **898/898** across 65 files.
- Ad-hoc Ajv run over every full-deck slide envelope: 0 failures.
- Spec-confidence boot log unchanged at `100/100 (excellent) — field:0 motion:0`.

## v1.2.0 — Release notes (since v1.1.0)

Polish + accessibility + presenter-tools release. Five user-visible features ship together: a daytime light theme, a manual reduced-motion override, in-browser slide telemetry, presenter-cam auto-frame face tracking, and the privacy-first `/analytics` review page. Zero breaking changes — every existing deck JSON renders identically, and every new feature is opt-in.

### Highlights

- **Paper & Ink theme.** New daytime / print-friendly slide theme that **retains the brand gold** (darkened to `#8A5A0E` for AA on cream `#FAF6EC`). Distinct from the existing `github-light` (cool wash + GitHub blue) — paper-ink is the on-brand option for bright rooms, projectors, and printed handouts. `appearance: 'light'` flips `BrandLogo` to the dark wordmark automatically. Tokens published for surfaces, text, capsules (cream/ink/outline retuned), metric accents, and chrome borders. Selectable from the Theme menu like every other preset.
- **Reduced-motion toggle (WCAG 2.3.3 / 2.2.2).** UI-level override for users on locked-down devices who can't change OS-level accessibility settings. New `Wind`-icon button in the controller; state syncs to `<html data-reduce-motion="true">`, mirrors to `?reduceMotion=1` for share-ability, and persists in `localStorage`. Six `:root[data-reduce-motion="true"]` companion blocks in `index.css` mirror every existing `@media (prefers-reduced-motion: reduce)` rule so pure-CSS animations collapse identically to the OS preference.
- **Slide telemetry (`/analytics`).** Privacy-first event ring buffer in `src/slides/analytics/recorder.ts`. Records `slide-enter` / `slide-exit` (with `dwellMs`), `click-reveal`, `theme-change`, `session-start` / `session-end`. Events live in `localStorage` only — no network calls, no third-party SDK, no remote endpoint. Opt-in via `?analytics=1` or the toggle on the `/analytics` page. After a talk, the presenter sees per-slide visits, total + mean dwell, and reveal counts; raw JSON is copy-able for export to spreadsheets.
- **Auto-frame face tracking.** New `useAutoFrame` hook uses the browser-native `FaceDetector` API (Chromium desktop) to keep the presenter centered while speaking. 250 ms detect tick on a 320px-wide downscaled snapshot, EMA-smoothed translate+scale (α=0.18) for gimbal-feel motion, eases back to identity when face is lost. Toggle via `Shift+F` or the new `Focus` button in the camera chrome (gold-lit when active+tracking, dim-gold when active+searching). Zero deps — no MediaPipe / TF.js bundle bloat. Gracefully no-ops in Firefox/Safari (button hidden, static mirror flip preserved).
- **Test-drift fixes.** Two stale assertions repaired: `transitionTimingByType.test.ts` (reduced-motion duration aligned to the `SAFE_TRANSITION` master rule, 0.01 → 0.15) and `brandChromeInheritance.test.ts` (`--brand-inset-x` updated for the production `logoScale` of 0.765, 218 → 196). Suite back to fully green.

### Files touched (since v1.1.0)

- `src/slides/themes.ts` — added `'paper-ink'` ThemeId + preset (light appearance, brand gold retained).
- `src/index.css` — paper-ink overrides (capsules, body wash, metric accents, chrome borders, slide-content shadow opt-out); reduced-motion `:root[data-reduce-motion]` mirror blocks.
- `src/slides/components/reducedMotionToggle.ts` — new pub/sub toggle module + URL/localStorage sync.
- `src/slides/motionPreferences.ts` — treats `data-reduce-motion="true"` as a motion-flattening trigger.
- `src/slides/controls/ControllerBar.tsx` — `ReduceMotionToggleButton` next to the contrast toggle.
- `src/slides/analytics/recorder.ts` — event ring buffer, aggregations, React subscriptions.
- `src/pages/AnalyticsPage.tsx`, `src/pages/SlideDeckPage.tsx`, `src/slides/components/ClickRevealExpandPanel.tsx` — telemetry instrumentation + review page.
- `src/slides/components/useAutoFrame.ts` — new face-tracking hook.
- `src/slides/components/PresenterWebcamOverlay.tsx` — auto-frame transform + chrome button + Shift+F shortcut.
- `src/test/{useAutoFrame,reducedMotionToggle,analyticsRecorder,slide4VisualQa,capsuleContrast}.test.ts` — new + updated coverage (24 tests added).
- `src/test/{transitionTimingByType,brandChromeInheritance}.test.ts` — drift fixes.
- `package.json` — version `1.2.0`.
- `.lovable/memory/features/reduced-motion-toggle.md`, `.lovable/memory/index.md` — feature memory + index update.
- `.lovable/question-and-ambiguity/57-…` through `59-…`, `task-counter.md` — RCA log + counter bumps.

### Verification

- **741/741 tests green** across 44 files (added 24 tests this release).
- `slide4VisualQa` and `capsuleContrast` extended to mirror paper-ink CSS overrides — any future contrast regression on the new theme breaks the audit.
- No changes to slide JSON schemas, deck manifest format, animation tokens, or slide contracts — `spec-parity.test.ts` green.
- All themes still pass the deck-wide contrast audit (KNOWN_FAILURES table unchanged).
- `bun run release:tag-and-build:dry` rehearsed before tagging.

### Deploy

- One-click: `bun run release:tag-and-build` creates `v1.2.0` annotated tag at HEAD and runs `bun run build` end-to-end.
- Frontend changes go live after clicking **Update** in the Lovable publish dialog (top-right of the editor on desktop, `…` → **Publish** on mobile).
- Release notes for GitHub: `bun run release:notes` extracts this v1.2.0 section as a clean Markdown block.


## v1.1.0 — Release notes (since v0.186.0)

Milestone release consolidating the FitStage typography pass and the Slide 4 (StepsChain3D) finalization, plus repo hygiene. No breaking changes to the slide JSON contract — existing decks render unchanged, just larger and more legible inside the FitStage'd 1920×1080 canvas.

### Highlights

- **Deck-wide typography scale-up.** The FitStage transform-scales the 1920×1080 stage by ~0.55 on typical preview viewports, which was shrinking source font sizes below the legibility floor. Fixed at the source (no CSS `transform` scaling): semantic clamps (`.slide-title-display`, `.slide-title-content`, `.slide-eyebrow`, `.slide-subtitle`) bumped **+18%**, step label clamps (`--step-title-active`/`-adjacent`/`-far`) bumped **+30%**, plus a new scoped `[data-fit-stage="true"]` Tailwind `text-*` override block (xs → 9xl) so deck content scales but the controller / settings / non-stage UI keep their original sizing.
- **Slide 4 (StepsChain3D) finalized.**
  - Centered rail passes exactly through marker centers (no more drift between rail and chips).
  - Traveling gold pulse synced 1:1 to the active step.
  - Click / keyboard / controller-only navigation — hover advancement removed (constraint logged in `.lovable/memory/constraints/no-hover-on-steps-chain-3d.md`).
  - **On-screen motion-mode toggle** (reduced ↔ full) added to the slide chrome, complementing the existing `Shift+M` shortcut and dev pill feedback.
  - Right-panel ghost numeral locked to `rgba(243,165,2,0.20)` (see `mem://design/3d-ghost-numeral-color`).
- **Memory + RCA artifacts.** Root-cause notes filed in `.lovable/question-and-ambiguity/22-slide4-text-too-small-after-fitstage.md` and `…/23-deck-wide-typography-too-small.md`. Design rule for FitStage type headroom codified in `.lovable/memory/design/fitstage-type-headroom.md` (forbids `text-sm`/`text-xs` for body copy on FitStage'd slides; future deck-wide bumps must edit `src/index.css` only — never per-slide, never via `transform`).
- **Repo hygiene.** `.gitmap/` removed from the project. `package.json` bumped `0.186.0 → 1.1.0`.

### Files touched (since v0.186.0)

- `src/index.css` — semantic clamps, `--step-title-*` vars, `[data-fit-stage="true"]` Tailwind `text-*` override block.
- `src/slides/types/StepsChain3DSlide.tsx` — on-screen motion-mode toggle, rail centering, synced pulse.
- `src/slides/presetSettings.ts` — preset alignment with new type scale.
- `package.json` — version `1.1.0`.
- `.lovable/memory/design/fitstage-type-headroom.md`, `.lovable/memory/index.md` — design rule + index update.
- `.lovable/question-and-ambiguity/22-…`, `23-…`, `task-counter.md` — RCA log + counter bump.
- Deleted: `.gitmap/release/{latest,v0.1.0,v0.2.0}.json`.

### Verification

- Visual QA on `/4` at preview viewports 999×581 and full HD — rail through marker centers, pulse synced, type legible, motion toggle reachable.
- Existing tests for slide 4 layout/navigation/depth still pass (`stepsChain3D*` suites).
- No changes to JSON schemas, deck manifest format, or slide contracts — `spec-parity.test.ts` green.


v0.186.0 — Strict-types dashboard groups ESLint violations by rule (any-ban + unknown-narrowing) per file.
- `scripts/report-strict-types.ts` previously printed one aggregate ESLint count per file. New `printRuleBreakdown()` adds a section that, for each tracked rule (`@typescript-eslint/no-explicit-any`, `no-unsafe-assignment`, `no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-return`), prints the rule label tagged as `(any-ban)` or `(unknown-narrowing)`, the per-rule total with a trend delta vs. the previous run, and the top 10 offending files sorted by violation count.
- `runEslint()` now returns `{count, byFile, byRule, byRuleByFile}` — the first two preserve the existing per-file aggregate (so `printSection` still works untouched), the latter two power the new view. All five tracked rules are seeded at zero so a clean repo still lists them and a regression on any single rule is visible immediately, not hidden inside an aggregate.
- `HistoryEntry` gains optional `eslintByRule` and `eslintByRuleByFile` fields; the per-rule trend delta reads from `last?.eslintByRule?.[ruleId]`. Older history entries (before today) lack these fields and render as `(first run)` for the per-rule deltas, which is correct — totals trends in the existing `byFile`/`totals.eslintErrors` sections continue working unchanged.
- **Files**: `scripts/report-strict-types.ts` (per-rule aggregation + printer + history schema), `package.json` (0.186.0), `readme.md`.
- **Verified**: `bunx tsc -p tsconfig.node.json --noEmit` clean (script typechecks under strict); `bun run report:strict` renders the new section with all 5 rules at 0 on the current clean repo; live-tested with a temporary `src/__rule_probe__.ts` file → confirmed `no-explicit-any` reported 1, `no-unsafe-call` 1, `no-unsafe-return` 1, each grouped under its own header with the offending file listed.


v0.185.0 — Worked-example deck on the navy-blue theme: `spec/slides/navy-showcase/`.
- New bundled deck (open with `?deck=navy-showcase`) — 8 linear slides + 2 click-reveal children, designed as the canonical reference for the `navy-blue` theme. Companion to the noir `showcase` deck; same asset library (`riseup-meeting` QR + 3 brand PNGs + the standard audio kit), different palette + fonts (Poppins body, JetBrains Mono code).
- Slide map: /1 TitleSlide (ambient icon scatter + brand-accent floats + Bounce text anim), /2 CapsuleListSlide (`cinematicCapsules` + **two reveal modes in one slide** — `revealSlide: 50` on capsule[0], inline `expand` on capsules[1]/[2]), /3 StepTimelineSlide (v3.3 cinematic + `stepAmbient` + `sound: { on: 'focus' }` + per-step `revealSlide: 50` on Step 2), /4 LayoutSlide (`card-grid-2x3` exercising all slot kinds — card×4 variants + codeblock + plain — and mirrors `gridPreset`), /5 ERDiagramSlide (3 entities + 2 relationships + `diagramExplanation` auto-4/8-split; zero color overrides because navy-blue's auto palette paints PK cyan / FK orange), /6 MetricGridSlide (4-cell + ghost `hotspots[0].revealSlide: 60` on the ARR cell), /7 CodeBlockSlide (shiki bash + `codeHighlightLines` 4-line pulse + line gutter + copy button + caption), /8 QrMeetingSlide (compact `meetingLabel` variant). Click-reveal children: /50 KeywordSlide reached from BOTH /2 capsule and /3 step (`parentSlide: 2` picks canonical back target); /60 CapsuleListSlide reached from the /6 hotspot.
- Demonstrates **all three click-reveal entrypoints** in a single deck: capsule.revealSlide (/2 → /50), step.revealSlide (/3 → /50), hotspot.revealSlide (/6 → /60). Same SlideStage contract from v0.117; many-to-one (/50 ← /2 + /3) just works because click-reveal navigation is global.
- Demonstrates **every animation knob** shipped through v0.184: 4 `transition` modes (FadeIn/PushLeft/SlideIn/PushIn), 4 `textAnimation` modes (Bounce/Stagger/SlideUp/FadeIn), `titleShimmer`, `cinematicCapsules` motion preset, `stepAmbient`, `titleAmbient` with brand-accent floats, slide-level `sound`, codeblock line-emphasis pulse + copy button + line gutter, capsule inline-expand card morph, hotspot ghost reveal. Animation-coverage matrix in the new memory file.
- **Files (new)**: `spec/slides/navy-showcase/deck.json`, `01-title.{json,md}`, `02-pillars.{json,md}`, `03-engagement.{json,md}`, `04-data-platform.{json,md}`, `05-erd.{json,md}`, `06-impact.{json,md}`, `07-deploy-snippet.{json,md}`, `08-meeting.{json,md}`, `50-strategy-detail.{json,md}`, `60-arr-breakdown.{json,md}`, `.lovable/memory/features/navy-showcase-deck.md`. **Files (edited)**: `package.json` (0.185.0), `readme.md`, `.lovable/memory/index.md`.
- **Verified**: all 3 CI typechecks clean (`tsc -p tsconfig.app.json`, `tsc -p tsconfig.node.json`, bare `tsc --noEmit`); 223/223 vitest passes (schema + contracts + slide fixtures + spec-parity + click-reveal order all green for the new deck); `bun ./scripts/check-deck-assets.ts spec/slides/navy-showcase/deck.json` → `✓ navy-showcase · 5 audio · 1 qr · 3 brand · 10 icons`.


v0.184.0 — Strongly-typed `SyncMessage` handler: exhaustive dispatch under strict TS for `request-state`, `nav`, `slide`, `theme`.
- `src/slides/sync.ts`: alongside the existing `SyncMessage` discriminated union, exported four new types/utilities — `SyncMessageType` (extracts the `'slide' | 'nav' | 'request-state' | 'theme'` discriminant), `SyncMessageOf<T>` (per-variant payload extractor), `SyncMessageHandlers<R = void>` (mapped object type — every `SyncMessageType` MUST have a handler or TS fails the build), and `handleSyncMessage<R>(msg, handlers): R` (typed dispatcher with an internal `assertNever` exhaustiveness guard).
- Added `isSyncMessage(value: unknown): value is SyncMessage` runtime type-guard so `MessageEvent.data: unknown` (the honest signature for cross-window messages) is validated before it reaches the dispatcher. Catches malformed payloads from other tabs / devtools / future protocol drift.
- `nav` handler receives the full sub-union (`{dir:'next'|'prev'} | {dir:'jump';n:number}`) so a nested `if (msg.dir === 'jump')` keeps `msg.n` strongly typed — no `(msg as any).n` escapes.
- Refactored both call sites (`src/pages/SlideDeckPage.tsx`, `src/pages/PresenterPage.tsx`) from hand-rolled `if (msg.type === ...)` ladders to `handleSyncMessage(msg, { slide, nav, 'request-state', theme })` literals. The deck explicitly documents why it no-ops `slide` (own broadcast echo) and `theme` (ThemePicker handles directly); the presenter explicitly no-ops `nav` (deck owns navigation authority) and `request-state` (only the live deck answers).
- Why this matters: under `strict: true` the old chains compiled fine even with a missing case — silent no-op. Now adding a 6th `SyncMessage` variant breaks the build at every call site until we decide what each window should do with it. v0.170's strict-mode flip + v0.183's CI parity check make this leverage real.
- New test `src/test/syncMessage.test.ts` (6 tests): variant acceptance, malformed rejection, dispatch routing, R≠void return, runtime `assertNever` throw on bogus discriminant, and the `isSyncMessage`+`handleSyncMessage` integration pattern used by both pages.
- **Files**: `src/slides/sync.ts` (utility + guard + dispatcher), `src/pages/SlideDeckPage.tsx` (deck-side dispatch), `src/pages/PresenterPage.tsx` (presenter-side dispatch), `src/test/syncMessage.test.ts` (new), `package.json` (0.184.0), `readme.md`, `.lovable/memory/features/sync-message-handler.md` (new), `.lovable/memory/index.md`.
- **Verified**: `bunx tsc -p tsconfig.app.json --noEmit` clean; `bunx tsc -p tsconfig.node.json --noEmit` clean; `bunx tsc --noEmit` clean (all three CI checks); `bun run test` 223/223 (was 217 + 6 new).


v0.183.0 — BoxDiagram canvas editor: drag-and-drop nodes + connect-tool edges in the slide builder.
- New `src/builder/BoxDiagramCanvasEditor.tsx` (~520 LOC): a 720×405 16:9 canvas mirroring the runtime stage (`STAGE_W=1600`, `STAGE_H=900`). Renders the current `diagramNodes`/`entities` as positioned `<div>`s with the same pk/fk color treatment the runtime uses (`hsl(var(--gold))`/`hsl(var(--ember))`/`hsl(var(--foreground))`), so designers recognise the proof immediately.
- Interactions: drag node body → `move` (clamped so the box stays inside the canvas); drag the 1.5px right-edge handle → `resize` (clamped 12–60% w); toggle the Connect tool, click source then target → emits `{from, to, cardinality: ['1','N']}` (Esc cancels mid-flight); click node or thin edge to select (edges have transparent thicker hit-targets so they're clickable); Del/Backspace removes selection (cascade-deletes edges touching a deleted node); suppressed while typing in `<input>`/`<select>` so renaming a field doesn't blow away its node; Esc deselects; Add-node drops a new `Untitled` at a stagger offset and auto-selects.
- Side panel: nodes get id (slugified) + title + x/y/w numeric fields + a fields Repeater (name + type + role select pk/fk/plain). Edges get from/to selects (driven by current node list), label, two cardinality selects (1 / N).
- One canvas, two field-pair contracts: `BoxDiagramSlide` uses `diagramNodes`/`diagramEdges`; `ERDiagramSlide` uses `entities`/`relationships`. Same component, different `nodeNoun`/`edgeNoun` labels. The canvas owns BOTH arrays and emits them atomically — to avoid a duplicate surface for ER (which lists both fields), the edge-key cases (`diagramEdges`, `relationships`) intentionally `return null` from `ContentFieldEditor`; the schema still lists them so fixtures round-trip.
- Wired into `src/builder/ContentFieldEditor.tsx` (4 new cases — `diagramNodes`, `entities`, `diagramEdges`/`relationships` → null, plus a `diagramExplanation` `<TextAreaField>`). `BoxDiagramSlide.fields` in `fieldSchemas.ts` now includes `diagramExplanation` (was ER-only) so the textarea appears on both slide types.
- Coordinate contract matches the runtime renderer: `x`, `y` = top-left % of stage; `w` = width % (default 22, clamped 12–60); height auto-derives from `NODE_HEADER_H + fields.length * NODE_ROW_H`. Editor mirrors the formula in `boxOf()` so move-clamping stays accurate. All persisted values rounded to one decimal via `round1()` for clean JSON.
- **Files**: `src/builder/BoxDiagramCanvasEditor.tsx` (new), `src/builder/ContentFieldEditor.tsx` (BoxDiagram import + 5 case clauses), `src/builder/fieldSchemas.ts` (`BoxDiagramSlide.fields` adds `diagramExplanation`), `package.json` (version bump to 0.183.0), `.lovable/memory/features/box-diagram-canvas-editor.md` (new), `.lovable/memory/index.md`, `readme.md`.
- **Verified**: `bunx tsc --noEmit` clean; `bunx vitest run` 217/217 pass; `bunx eslint` on changed files clean.


v0.182.0 — PPTX export renders TableSlide, CodeBlockSlide, BoxDiagramSlide, ERDiagramSlide, and LayoutSlide.
- `src/slides/exportPptx.ts` previously dropped through to a header-only fallback for the v0.169+ generic slide types, leaving real content out of the .pptx download. Added four native renderers + dispatcher cases so every slide that ships in the deck now exports with its body intact.
- `renderTable`: hand-rolled cells (instead of pptxgenjs `addTable`) so we can paint the per-row first-column accent bar AND apply zebra striping in one pass. Honors `tableColumns[].align`/`width` (parsed as proportional weight), caps at 12 rows × 8 cols (matches the live spec). `tableNote` renders as a muted italic line below.
- `renderCodeBlock`: dark inkSoft surface, language badge top-right (uppercase), monospace body painted line-by-line so `codeHighlightLines` can backdrop a row and `codeShowLineNumbers` can render a right-aligned gutter. Auto-shrinks font 9-14pt based on line count. Falls back to joining `codeTokens[][]` text when `code` is absent. Shiki coloring is intentionally dropped (no wasm in the export pipeline).
- `renderDiagram`: handles both `BoxDiagramSlide` and `ERDiagramSlide`. Reads `entities`/`relationships` first, falls back to `diagramNodes`/`diagramEdges`. Optional 4/8 split when `diagramExplanation` is set. Boxes get a gold title bar + ink fields; `pk` rows render gold, `fk` rows render ember, plain rows render foreground. Edges render as straight `line` shapes with `flipH/flipV` for direction; cardinality endpoints become `[1]`/`[N]` text markers (real crow's-foot SVG isn't pptx-native — editor can upgrade).
- `renderLayout`: resolves all 9 `LayoutGridPreset` values to cell rects (split-5-7/4-8/3-9/2-equal, 3-panel, 12-column, card-grid-2x3/3x3, centered-hero), then renders each `LayoutSlotSpec` as `card` (rounded inkSoft + variant border: success→green, danger→ember, accent→gold), `plain` (raw text), or `codeblock` (mini code surface with optional language badge). Surplus slots are dropped — same overflow policy as the React renderer.
- Dispatcher gains 4 new cases (`TableSlide`, `CodeBlockSlide`, `BoxDiagramSlide`, `ERDiagramSlide`, `LayoutSlide`). Palette stays Noir & Gold across all of them — per-theme palette swap (e.g. navy-blue) is out of scope for the export so a mixed-theme deck still reads as one cohesive editable handout.
- **Files**: `src/slides/exportPptx.ts` (added `TableColumnSpec`/`TableRowSpec`/`DiagramNodeSpec`/`DiagramEdgeSpec`/`DiagramFieldSpec`/`LayoutSlotSpec`/`LayoutGridPreset` to the import list; added `renderTable` / `renderCodeBlock` / `renderDiagram` / `renderLayout` / `renderLayoutSlot` / `variantBorder`; extended dispatcher), `package.json` (version bump to 0.182.0), `.lovable/memory/features/pptx-export-generic-types.md` (new), `.lovable/memory/index.md`, `readme.md`.
- **Verified**: `bunx tsc --noEmit` clean; `bunx vitest run` 217/217 pass.


v0.181.1 — LLM authoring docs for TableSlide, CodeBlockSlide, BoxDiagramSlide, LayoutSlide.
- Added 4 field-by-field authoring contracts under `spec/slides/llm/`: `27a-table-slide.md`, `27b-code-block-slide.md`, `27c-box-diagram-slide.md`, `27d-layout-slide.md`. Each follows the established LLM-pack shape: minimal valid example → required envelope fields → `content.*` field-by-field tables → behaviors-for-free → forbidden patterns → companion `.md` brief checklist. Cross-references the existing pack (`23-slide-type-contracts.md`, `06-json-authoring-cheatsheet.md`, `27e-layout-grid-presets.md` placeholder for the deck-wide grid presets feature).
- Updated `00-readme.md` reading-order table with the four new entries (plus a missing `26-click-reveal-contract.md` row that was already on disk but not listed). Updated `23-slide-type-contracts.md` required-fields table to add rows for `MetricGridSlide`, `TableSlide`, `CodeBlockSlide`, `BoxDiagramSlide`, `ERDiagramSlide`, `LayoutSlide` so the single-source-of-truth table is current.
- Each doc covers every shipped field for that slide type as of v0.181 — including v0.179 TableSlide cell fade-in, v0.180 CodeBlockSlide copy button + line emphasis + line-numbers gutter, v0.177 BoxDiagram crow's-foot cardinality, and the v0.181 9-preset `layout` map for LayoutSlide. Forbidden lists capture the contract caps (TableSlide ≤12 rows × 8 cols, BoxDiagram ≤20 nodes, LayoutSlide ≤6 slots, CodeBlockSlide ≤30 lines guidance).
- Verified: `bunx vitest run` 217/217 (spec-parity left alone — `spec/slides/llm/` is documentation, not deck JSON).



v0.181.0 — Layout grid presets, deck-wide spacing tokens, opt-in `gridPreset` on every slide.
- `src/slides/types.ts` `LayoutGridPreset` extended from 5 → 9 presets: existing `split-5-7`, `split-4-8`, `split-2-equal`, `card-grid-2x3`, `centered-hero` plus four new — `split-3-9` (sidebar/main), `3-panel` (three equal columns), `12-column` (12-track designer grid; children use `grid-column: span N`), `card-grid-3x3` (three-column card flow).
- New `SlideContent.gridPreset?: LayoutGridPreset` field. `SlideStage` now wraps every non-`LayoutSlide` body in a `<div className="slide-grid-wrapper {presetClass}" data-grid-preset="…">` when this field is set, so designers get one consistent spacing/grid system across `TitleSlide`, `KeywordSlide`, `MetricGridSlide`, `TableSlide`, `CodeBlockSlide`, `BoxDiagramSlide`, etc. `LayoutSlide` keeps owning its own grid via `content.layout` and is intentionally skipped by the wrapper to avoid double grids.
- New deck-wide spacing tokens added to `:root` in `src/index.css` (`--slide-grid-gutter: 2.5rem`, `--slide-grid-padding-x: 6rem`, `--slide-grid-padding-y: 5rem`). Every `.slide-grid-*` preset now reads these vars instead of hardcoded `2.5rem`/`2rem` values, so a deck-wide retune (future presetSettings panel, per-deck override) is one variable change away. Card grids subtract 0.5rem to keep the historical tighter card spacing.
- New `.slide-grid-wrapper` utility = padding-only shell that pairs with the chosen `.slide-grid-*` class. `min-height: 100%` (not `height`) so existing absolute-positioned scenes (e.g. TitleSlide) still get edge padding without breaking internal overflow handling.
- `src/slides/types/LayoutSlide.tsx` GRID_CLASS map extended to cover all 9 presets so authoring `LayoutSlide` with `layout: '12-column'` or `layout: '3-panel'` Just Works. `SlideStage` got a sibling `GRID_PRESET_CLASS` map to mirror the lookup at the stage level.
- No contract / fixture / builder additions yet — the field is opt-in and `passthrough()` schemas already accept it. Future work: surface `gridPreset` as a builder field if authors start using it heavily.
- Verified: `bunx tsc` clean, `bun run lint` 0 errors (13 pre-existing warnings unchanged), `bunx vitest run` 217/217.



v0.180.0 — CodeBlockSlide copy button + line emphasis animations.
- `src/slides/types/CodeBlockSlide.tsx` — refactored into a pre-existing 3-mode body (`shiki`/`manual`/`plain`) plus three new co-located helpers: `CodeLine` (per-line wrapper that owns gutter + emphasis), `ShikiBlock` (re-parses shiki's output, splits on `<span class="line">`, and re-wraps each line via `CodeLine` so emphasis works without losing shiki's inline token colors), and `CodeCopyButton` (top-right anchor; uses `navigator.clipboard.writeText`, switches to a `Check` icon for 1.6s, falls back to "Select to copy" when clipboard is unavailable).
- New `SlideContent` fields (`src/slides/types.ts`): `codeHighlightLines?: number[]` (1-based, out-of-range silently ignored), `codeCopyButton?: boolean` (default `true`), `codeShowLineNumbers?: boolean` (default `true` whenever `codeHighlightLines` is set, else `false` so plain blocks keep their minimal look). No contract changes needed — the existing `CodeContent` `passthrough()` schema accepts them; the required-fields refine still only enforces `code|codeTokens`.
- Animation: each highlighted line gets a steady gold backdrop (`hsl(var(--gold)/0.14)` + 3px inset gold edge) AND pulses through `0 → 0.32 → 0.14` alpha on slide enter, staggered 250ms by emphasis-sorted order anchored at 0.55s. `useReducedMotion` skips the pulse and renders the steady highlight only.
- New CSS in `src/index.css` (`.slide-codeblock-wrap`, `.slide-codeblock-copy`, `.slide-codeblock-line`, `.slide-codeblock-line[data-emphasised]`, `.slide-codeblock-gutter`, `.slide-codeblock-line-body`). Copy button uses `lift-hover-subtle` to keep hover language locked deck-wide. Backdrop-filter blur for the floating chip; gold ring on hover.
- Manual-mode source text is correctly recovered from `codeTokens` for the copy payload (joins token `text` per line) so users get real source code, not `[object Object]`.
- Fixture extended (`src/slides/fixtures.ts` `CodeBlockSlide`) to exercise `codeHighlightLines: [3]` + `codeCopyButton: true` + `codeShowLineNumbers: true` so spec-parity covers the new shape.
- Verified: `bunx tsc` clean, `bun run lint` 0 errors (13 pre-existing warnings unchanged), `bunx vitest run` 217/217.



v0.179.0 — TableSlide cell fade-in animations.
- `src/slides/types/TableSlide.tsx` — wrapped `<th>` and `<td>` cells in `motion.th`/`motion.td`. Headers stagger in first (35ms each from 0.25s), then body cells fade up in row-major order (35ms each from 0.45s). Even a 12×8 grid finishes inside ~1.4s — under the deck's 1.5s settle budget. Animation fully suppressed under `useReducedMotion` (no `initial` set, snaps in).
- Pre-existing features confirmed already wired in this slide type: headers (`tableColumns[].label`), zebra rows (`.slide-table tbody tr:nth-child(even)` in `index.css`), per-column alignment (`col.align` flows to both `<th>` and `<td>`), per-row accent bar (`data-accent` + `--row-accent`). No content-schema or contract changes — the new animation is purely presentational.
- Updated docstring at the top of `TableSlide.tsx` to document the four feature pillars (headers / zebra / alignment / cell fade-in) so future authors can see the contract at a glance.
- Verified: `bunx tsc` clean, `bun run lint` 0 errors (13 pre-existing warnings unchanged), `bunx vitest run` 217/217.



v0.178.0 — Navy-blue theme preset completed (capsules + gradients + chart palette).
- `src/slides/themes.ts` `'navy-blue'` preset extended beyond the v0.169 var/font baseline. Now ships its own `--gradient-gold` (cyan → orange) and `--gradient-text-gold` (cyan-glow → cyan → orange) so any `.text-gradient-gold` headline or `var(--gradient-gold)` accent retunes natively instead of inheriting the noir-gold ramp.
- Per-theme capsule overrides: navy preset writes `--capsule-{gold,ember,cream,ink,outline}-{bg,fg,border}` so `.capsule-gold` becomes cyan-on-navy, `.capsule-ember` warms to amber-on-navy, `.capsule-cream` reads as soft slate, and the outline capsule picks up a navy-tuned border. House capsule defaults in `index.css` are untouched — only the navy theme remaps them.
- New chart palette tokens (`--chart-1`..`--chart-5`) added to `:root` in `index.css` (gold / ember / cream / teal / violet — picked for AAA on noir). Navy theme overrides them to cyan / orange / sky / violet / mint so any future recharts series, heatmap, or data-viz that reads `hsl(var(--chart-N))` retunes per palette.
- House style stays the default. Other themes (`noir-gold`, `bright-gold`, `vscode-dark`, `dracula`, `monokai`, `github-light`, `macos-sonoma`, `windows-11`) declare no `fonts` block and no chart/capsule overrides — the global `:root` defaults from `index.css` apply, exactly like before. The `fonts?` field doc was clarified to call out that font swaps are strictly opt-in.
- Verified: `bunx tsc` clean, `bun run lint` 0 errors (13 pre-existing warnings unchanged), `bunx vitest run` 217/217.

let's start now 2026-04-27 10:15

v0.177.0 — `ERDiagramSlide` with automatic navy-blue palette.
- New `src/slides/types/ERDiagramSlide.tsx` — opinionated ER variant of `BoxDiagramSlide`. Same SVG renderer + 1600×900 canvas + `%` positioning, but paints with an inlined `NAVY` palette (surface `#0f1d3a`, header `#1a2d5c`, PK `#22d3ee`, FK `#f59e0b`, edge `#60a5fa`). Palette inlined as a typed const because SVG paints by attribute, not CSS variables.
- Authoring API: `content.entities` + `content.relationships` (preferred ER terminology). `diagramNodes`/`diagramEdges` aliases accepted so authors can migrate a `BoxDiagramSlide` over by adding the new keys without removing the old ones; ER-style wins when both are present.
- Wiring: `enums.ts` (new `ERDiagramSlide` value), `types.ts` (`SlideContent` gains optional `entities`/`relationships`), `contracts.ts` (new `ERDiagramContent` zod with refine enforcing 2–20 entities; `SLIDE_CONTRACTS_VERSION` 1 → 2), `fixtures.ts` (valid fixture), `builder/fieldSchemas.ts` (FieldKey + picker entry + defaults), `SlideStage.tsx` (dispatch case).
- Author template: `front-end/slide-template/ERDiagramSlide.{json,md}`.
- New memory: `.lovable/memory/features/er-diagram-slide.md` + index entry.
- Verified: `bunx tsc` clean, `bun run lint` 0 errors, `bunx vitest run` 217/217 (spec-parity test covers the new fixture).

let's start now 2026-04-27 10:00

v0.176.0 — Suggested `assetConstraints` from observed measurements.
- New `scripts/suggest-asset-constraints.ts` + `bun run suggest:constraints`. Walks every `spec/slides/**/deck.json`, probes every referenced audio/QR/brand asset (reuses `probeFile` + helpers from the audit, now exported), and emits a per-deck proposed `assetConstraints` block plus a tighten-only diff vs. the current rules.
- Safety margins: `maxBytes` ×1.10, `maxWidth/Height` = observed_max (no headroom — LCP-defensive), `minWidth/Height` = floor(observed_min × 0.95) snapped down to nearest 16px, `maxDurationSec` = observed_max + 250ms rounded up to 50ms, `minDurationSec` floor capped at 0.1s. `aspectRatio` only proposed when ≥80% of measured assets cluster within ±2% of a canonical ratio (1:1, 4:3, 3:2, 16:9, 3:4, 2:3, 9:16). `formats` = union of observed (only ever shrinks). SVG: `requireViewBox: true` + `minViewBoxWidth/Height` from observed viewBox geometry with the same 0.95 + snap-to-16 rule.
- Output: console diff + per-deck Markdown to `/mnt/documents/asset-constraints-suggestion-{slug}.md` (or `--out <file>` for combined). Opt-in `--apply` writes back into `deck.json` and creates a sibling `.bak` first.
- To make the audit script importable without auto-running, gated `process.exit(main())` behind `if (import.meta.main)` and added `export` to `loadDeck`, `collectReferences`, `probeFile`, `urlExtension`, `urlToFsPath`. The audit CLI behaviour is unchanged.
- Verified: `audit:resolutions` still clean (5 assets, 0 violations); `suggest:constraints` against showcase produces tightening proposals across all three kinds (e.g. `brand.maxBytes: 3145728 → 1731634`, `brand.formats: drop [jpg, svg, webp]`); empty-asset deck (`spec/slides/deck.json`) reports "already tighter — no change". `bunx tsc` + `bun run lint` zero errors.

let's start now 2026-04-27 09:45

v0.175.0 — SVG viewBox audit for brand assets.
- `scripts/audit-asset-resolutions.ts` now probes SVG brand assets: new zero-dep `parseSvgRoot` extracts `viewBox` + `width`/`height` attrs from the root `<svg>` (regex-based, tolerant of XML decls / DOCTYPE / BOM, accepts whitespace OR comma-separated viewBox values, rejects `%` lengths).
- New `ConstraintRule` keys: `requireViewBox` (default `true` when a kind has any rule object — missing viewBox makes SVGs un-scalable in CSS-sized chrome like `BrandHeader`/`BrandStrip`), `minViewBoxWidth`, `minViewBoxHeight` (fall back to `minWidth`/`minHeight` so one declaration covers raster + vector).
- Existing pixel rules (`min/maxWidth`, `aspectRatio`, `maxBytes`, `formats`) keep working on SVG via parsed render-intent dims (explicit `width`/`height` attrs win, else viewBox geometry — matches browser fallback).
- `ProbeResult` extended with `viewBox` + `hasExplicitDims`; per-asset Markdown row gains a `**viewBox:** … · **Root attrs:** …` line on every SVG (clean ones too) so authors can eyeball geometry consistency across logos.
- Verified: showcase deck (5 raster brand assets) stays clean. Synthetic 3-SVG deck (good / no-viewBox / 16×16 viewBox) flags `requireViewBox`, `minViewBoxWidth`, `minViewBoxHeight`, plus existing `minWidth`/`minHeight` correctly; exit 2 as expected. `bunx tsc` + `bun run lint` zero errors.

let's start now 2026-04-27 08:35

v0.174.0 — Strict-references mode for the resolution audit.
- New opt-in `--strict-references` (alias `-S`) flag on `scripts/audit-asset-resolutions.ts` + `bun run audit:resolutions:strict` script. Default audit unchanged.
- Walks three reference surfaces and reports any URL whose `public/<url>` doesn't exist on disk: (1) `deck.assets.{audio,qr,brand}` declared URLs, (2) slide registry refs (`sound.kind`, `content.qrAsset`, `deck.meeting.qrAsset`), (3) any `/`-prefixed string in slide JSON via the new `walkPublicPaths` generator. Dedupe by URL, priority `declared > registry > slide-path`.
- Report adds a "Missing References" section + summary row; console prints `📎 N missing references` and per-row list. Exit 2 when missingRefs > 0 so CI fails.
- Verified: showcase deck remains 5 clean / 0 missing in both modes; synthetic missing entry triggers the new section + exit-2 path correctly.
- New memory: `.lovable/memory/features/strict-references-audit.md` + index entry.

let's start now 2026-04-27 08:22

v0.173.0 — Non-fatal Broken Asset overlay for imported decks.
- New `src/slides/brokenAssetReport.ts` — pub/sub store with `(kind, slug, reason)` dedupe. `reportBrokenAsset()`, `subscribeBrokenAssetReport()`, `__resetBrokenAssetReport()` for tests.
- Extended `DeckAssetPolicy` with `softFail?: boolean`. `loader.ts` derives `useSoftAssetFailures = isImportedDeck || assetPolicy.softFail === true` and routes slug-validation through the new non-throwing `initAssetRegistrySoft()`. Bundled showcase decks remain strict.
- `main.tsx` branches on the same flag: soft path runs `reportDeclaredAssetFiles()` (HEAD-check failures) + `probeDeclaredImageDecode()` (catches "200 but corrupt PNG/SVG"). The strict `assertDeclaredAssetFiles` throw path is preserved for bundled decks.
- `sound.ts` `loadAsset` catch reports `audio-decode-failed` with the underlying error message.
- New `src/slides/components/BrokenAssetOverlay.tsx` — floating top-right card mirroring `RuntimeImageQAOverlay` (z-index 9998 so they coexist). Dismiss is per-session but resets on new failures via dismissed-at-count gate. Mounted in `App.tsx`.
- 7 new vitest cases in `src/test/brokenAssetOverlay.test.ts`. 216/216 tests pass; tsc + lint clean.
- New memory: `.lovable/memory/features/broken-asset-overlay.md` + index entry.

let's start now 2026-04-27 11:08

v0.127.0 — Visual hotspot canvas editor + working showcase example.
- The runtime click-reveal hotspot system has shipped since v0.62 (`HotspotLayer` mounted by `SlideStage` on every slide; `HotspotSpec` with `{ x, y, width, height }` as % of the 1920×1080 stage; supports `revealSlide` navigation and inline `expand` cards). What was missing was the *authoring* surface — authors had to hand-edit JSON. v0.127 closes that gap.
- New `src/builder/HotspotCanvasEditor.tsx` — full pointer-driven editor: drag on the canvas to create, click to select, drag the body to move, drag any of 8 corner/edge handles to resize, `Del`/`Backspace` to remove, `Esc` to deselect. Live-updates the slide spec via the existing `updateSelectedContent` flow so the manifest panel reflects every change. Includes a side inspector with reveal-target dropdown (auto-populated from the draft deck, marks click-reveal slides as "(hidden)"), label field, ghost/outline style selector, and read/write numeric x/y/width/height boxes.
- Coordinates: every drag projects clientX/clientY → % of stage and clamps to [0,100] with a 2% min size floor. Resize handles are anchored at corners/edges with proper cursor hints (`nwse-resize`, `nesw-resize`, etc).
- Wired into `BuilderPage` as a new "Clickable hotspots" section that appears for every slide type (hotspots are orthogonal to slide-type content). Renders the active slide via `SlidePreview` at 720px, with hotspot rectangles overlaid on top.
- New showcase example: `spec/slides/showcase/50-arr-detail.json` — a hidden `ClickRevealSlide` (parentSlide: 5) listing the $4.2M ARR breakdown by engagement tier. Reached by clicking a `ghost`-style hotspot on the **$4.2M ARR added** cell of slide 5 (`05-impact-metrics.json`). Demonstrates the full pattern: hotspot rect → revealSlide nav → Prev returns to parent → slide stays out of linear count via `isClickReveal`.
- Updated `spec/slides/showcase/deck.json` to register the new slide; loader auto-globs new JSON files so no other wiring needed. Companion MD added at `spec/slides/showcase/50-arr-detail.md`.
- All 31/31 tests pass; `tsc --noEmit` clean; production build succeeds.



v0.126.0 — Bottom thumbnail strip with quick-jump previews.
- New `src/slides/controls/ThumbnailStrip.tsx` — a horizontally-scrolling filmstrip pinned bottom-center, rendered above the controller pill. Each tile is a real `SlidePreview` (pixel-accurate 1920×1080 scaled-down render at 200px wide) so authors can pattern-match every slide at a glance and click any tile to jump there.
- Active tile gets a 2px gold ring + soft gold glow shadow, and a gold slide-number badge in the bottom-left corner. Inactive tiles show a subtle border that turns gold on hover. Auto-scrolls the active tile into view (smooth, `inline: 'center'`) on every slide change so the strip "follows" deck navigation.
- A small "Thumbnails" toggle pill (LayoutPanelTop icon + `T` shortcut hint) sits above the strip and is always visible — clicking it collapses/expands the filmstrip. Open state persists in `localStorage` (`riseup.thumbStrip`) so presenter preference carries across reloads.
- Wired into `SlideDeckPage`: bound to **T** keyboard shortcut (alongside G/F/Shift+S), hidden in grid view (which already shows every slide), and tagged `data-print-hide="true"` so it never leaks into PDF/SVG/PNG/JPG exports.
- Performance: the strip's preview tiles are only mounted while open — when collapsed, only the toggle pill renders, so we don't pay the per-slide preview cost during normal walkthroughs.
- All 31/31 tests pass; `tsc --noEmit` clean.
let's start now 2026-04-27 04:24

v0.125.0 — Six new IDE/OS-inspired themes for the live theme switcher.
- Extended `THEMES` registry in `src/slides/themes.ts` with `vscode-dark` (Microsoft Dark+, azure `#007acc` on `#1e1e1e`), `dracula` (purple `#bd93f9` + pink `#ff79c6` on `#282a36`), `monokai` (Sublime green `#a6e22e` + orange `#fd971f` on `#272822`), `github-light` (light mode, blue `#0969da` + ink `#1f2328` on white — first non-dark theme), `macos-sonoma` (Apple system blue `#007aff` + orange `#ff9f0a` on indigo gradient), `windows-11` (Fluent accent `#60cdff` on mica `#202020`).
- Each theme is a pure CSS-variable override patch (`--gold`, `--gold-glow`, `--cream`, `--primary`, `--ring`, `--foreground`, `--muted-foreground`, `--border`, `--gradient-noir`) — no component code touched, swap is instant and global, manifest round-trip works automatically (`ThemeMenu` and `DeckMetaForm` enumerate `THEMES` dynamically).
- Updated `ThemeId` union, schema enum in `spec/slides/deck.schema.json`, memory `.lovable/memory/features/theme-system.md`, and spec doc `spec/slides/07-theme-system.md` (table of all 8 themes with accents, text colors, mood notes).
- Build clean, no test breaks.

let's start now 2026-04-27 04:05

v0.124.0 — In-deck animation scrubber.
- New `src/slides/controls/AnimationScrubber.tsx` — floating top-right panel (Shift+S or `?scrub=1`) with a step slider (-1 = pre-reveal, 0..N-1), ←/→ step buttons, Replay entrance, playback-speed chips (0.25× / 0.5× / 1× / 1.5× / 2×), and step-timing preset chips (instant/snappy/smooth/cinematic/dramatic). All overrides clear when the panel closes — spec JSON is never modified.
- New `src/slides/scrubOverride.ts` — module-scoped pub-sub for `{ presetOverride, playbackSpeed }`. Read by `stepTiming.ts` (overrides `readSlideTiming` so every step resolves through the picked preset) and by `SlideStage.tsx` (wraps body in `<MotionConfig>` when speed ≠ 1).
- Extended `FocusTimelineHandle` with optional `setStep / getStep / getStepCount / replay`. `StepTimelineSlide` implements all four via its existing active-step state; other slide types degrade gracefully (panel shows "Not a step slide").
- The scrubber polls the handle each animation frame so cross-slide swaps surface instantly without event plumbing.
- `SlideDeckPage` honours `?scrub=1` on first paint, binds **Shift+S** to toggle, and calls `resetScrubState()` on close.
- No-Questions Mode (6/40) — logged inferences (overlay placement, pub-sub vs context, optional handle methods, deferred per-step revealMode picker) to `.lovable/question-and-ambiguity/06-in-deck-animation-scrubber.md`.
- All 31/31 tests pass; `tsc --noEmit` clean.

let's start now 2026-04-27 03:48

v0.123.0 — /settings export menu (PDF/CMYK/SVG/PNG/JPG).
- New `src/slides/export.ts` — single-entrypoint deck exporter with five formats: **PDF (RGB)**, **PDF (CMYK-safe)**, **SVG (per slide)**, **PNG (per slide)**, **JPG (per slide)**. Zero new deps (~6 KB minified). Uses browser primitives only: `XMLSerializer`, `<foreignObject>`, `Blob`, `canvas.toBlob`, `window.print()`.
- PDF flows reuse the existing `/handout?print=1` route (single A4-landscape page per slide, animations frozen via `data-export-mode`). The CMYK variant adds `?cmyk=1` which sets `data-export-cmyk="true"` and applies a CSS filter (`saturate(0.86) contrast(1.04) hue-rotate(-2deg)`) to the `.handout-stage` so the gold/cream/ember palette pre-desaturates into the offset-CMYK gamut. A sticky banner on the handout explains that true ICC CMYK conversion still needs Acrobat Pro → *Convert Colors*.
- Vector + raster flows render off-screen: open `/handout` in a hidden iframe at 1920×1080, await `fonts.ready` + a settle frame, snapshot every `.handout-stage` innerHTML, then either serialize as standalone SVG documents (with inlined CSS variables + sheet rules) or rasterize via offscreen `<canvas>`. Sequential downloads with a 250–300 ms stagger so browsers don't block the multi-file save as a popup.
- New "Export deck" section at the top of `/settings` — five icon-tagged buttons in a responsive grid, per-format busy state, file-count chips ("1 file" for PDF, "N files" for vector/raster), and a CMYK explainer footnote. Imports `EXPORT_FORMATS` + `runExport()` from the export module.
- HandoutPage now reads `cmyk` from the URL alongside `print`, sets/clears `data-export-cmyk` on the root, retitles the document, and renders a sticky `data-print-hide="true"` banner when the flag is on.
- index.css gained a CMYK filter block (screen + `@media print`) right after the handout pagination rules.
- No-Questions Mode (5/40): inferred CSS-filter approximation over server-side Ghostscript (no backend), per-slide files for SVG/PNG/JPG, off-screen iframe as render source. Logged to `.lovable/question-and-ambiguity/05-settings-export-menu.md`.
- All 31/31 tests pass, `tsc --noEmit` clean.

let's start now 2026-04-27 03:11

v0.116.0 — Root deck.json manifest + per-slideType template deck.
- Created `spec/slides/deck.json` as the **root manifest** for the entire authoring tree. Lists every deck (currently `showcase`) and pairs every slide with explicit `{ json, md }` paths so loaders never string-munge filenames. Includes deck-level `meeting`, `theme`, `preset`, and a `templates` block pointing at the per-slideType template manifest.
- Created `front-end/slide-template/deck.json` as the **template deck**. One entry per slideType (`TitleSlide`, `CapsuleListSlide`, `StepTimelineSlide`, `QrMeetingSlide`) with `{ json, md, purpose }`. `$missing.types` lists slideTypes that still need a template (MetricGridSlide, MiddleTitleSlide, FocusTimelineSlide, AdvanceStepSlide, ImageSlide, KeywordSlide, SectionDividerSlide).
- Backfilled the four template `.md` companions: `TitleSlide.md`, `CapsuleListSlide.md`, `StepTimelineSlide.md`, `QrMeetingSlide.md`. Each is a self-contained authoring guide (when to use, required fields, recommended fields, house rules, related specs).
- Per user choice: deck shape = "Both"; MD reference = "Explicit { json, md } pair per slide".
- Existing `spec/slides/showcase/deck.json` (per-deck manifest) is unchanged — the new root `spec/slides/deck.json` references it via the `deckJson` field.
- Runtime loader is unchanged (still loads showcase via `import.meta.glob`); the new root manifest is for documentation + future portable-deck-export use.
- All 19 tests pass.

let's start now 2026-04-27 02:51

v0.115.0 — Cross-platform install scripts + strict-types CI.
- Created `slides-install.sh` (Unix) and `slides-install.ps1` (Windows): one-liner bootstrap that downloads `alimtvnetwork/coding-guidelines-v17@main`, stages `spec/slides/`, `src/slides/`, and `front-end/slide-template/` into the target directory, runs `bun install` (npm fallback), and starts `bun run dev`. Banner format, exit codes (0/1/2/3/4), and archive-root resolution adapted from the canonical repo's slides-install. Flags: `--target`, `--no-install`, `--no-start`, `--use-local-archive`, `--offline`, `-h`.
- Added `.github/workflows/ci.yml` — strict types CI on every push/PR: `tsc --noEmit` (app + node), grep guard forbidding `: any`/`<any>`/`as any` in `src/**` (excl. `ui/`+`test/`), ESLint with `@typescript-eslint/no-explicit-any: error`, Vitest, production build. Concurrency-grouped with cancel-in-progress.
- Hardened `eslint.config.js`: `no-explicit-any: error`, `no-unsafe-function-type: error`, `no-wrapper-object-types: error`, `ban-ts-comment: error` (allow ts-expect-error with description). Tests + `src/components/ui/**` exempt. Policy: `any` is banned (unsafe escape hatch); `unknown` is allowed (type-safe, requires narrowing).
- Fixed pre-existing `prefer-const` lint error in `src/slides/components/ConstraintInspectorPanel.tsx` (`RESOLVER_TRIPPED`).
- Rewrote `readme.md` with proper sections: one-line install (curl/irm), what gets staged, local dev, 30-second authoring guide, CI guarantees, project structure, link to LLM authoring pack.
- Memory: added `.lovable/memory/features/install-scripts.md` and `.lovable/memory/features/ci-strict-types.md`; updated `.lovable/memory/index.md`.
- All checks green: 0 explicit `any` in authored source, tsc clean (app+node), 19/19 Vitest tests pass, ESLint 0 errors.

let's start now 2026-04-26 14:55

Milestone (v0.57.0): Unified press-cue sound flow across the deck. New `fadeClick` SoundKind reuses `/sounds/click.mp3` but lowers volume to 0.09 and stretches the runtime envelope (50ms attack, 180ms release) so the same MP3 plays as a soft, faded tap — no second asset shipped. CapsuleListSlide (slide 2) now plays `fadeClick` + the same gentle `whoosh` used on StepTimeline focus arrival, replacing the previous harsh `click + fadeZoom` pair. StepTimeline whoosh default volume bumped 0.35 → 0.5 (`spec/slides/showcase/03-process.json` + the component fallback) per user feedback that the step-page whoosh felt too quiet relative to the new ambient layer. Synth-fallback path now also covers `fadeClick`. Type-check clean.

Remaining: live edit + PHP backend (deferred); optional `ambientBackground` opt-in in /builder UI; visual diff against `step-timeline-target.png` once preview reloads.

let's start now 2026-04-26 14:32

Milestone (v0.56.0): StepTimeline v3.5 — centered 1440px composition. The previous v3.4 hard-left-lock to the logo gutter was the wrong fix for the user's "still in the middle" complaint; it produced a lopsided composition with dead space on the right. Spec 32 (`spec/slides/32-step-timeline-v3.3-centered-composition.md`) is the new source of truth: `step-timeline-content` is now `width:75% max-width:1440px margin-inline:auto` (symmetric ~12.5% margins on the 1920px design canvas). The two-column body grid uses a fixed 560:800 ratio (`grid-template-columns: minmax(0,560fr) minmax(0,800fr)`) with `align-items:center`. Header title left edge ≡ Step List column left edge — this is the visual anchor of the whole slide. Ghost numeral repositioned to sit behind the right column (`right: max(2vw, calc((100vw - 1440px)/2 + 1rem))`) instead of bleeding off-canvas. Removed `max-w-7xl px-10` from the windowed wrapper and the `width:100%/margin-left:0/padding-left:2.5rem !important` overrides + `step-detail-panel translateY(1.4rem)` from fullscreen mode — all conflicted with v3.5. Reference images stored at `spec/slides/assets/step-timeline-reference/{target,broken}.png` for visual diffing. Memory `features/step-timeline-v3.md` updated to v3.5.

Verification: `tsc --noEmit` clean, no type errors.

Remaining: live edit + PHP backend (deferred); optional `ambientBackground` opt-in in /builder UI; visual diff against `step-timeline-target.png` once preview reloads.

let's start now 2026-04-26 12:08

Milestone (v0.53.0): StepTimeline fullscreen/wide left-lock fix. Root cause was Tailwind utility cascade: `max-w-7xl mx-auto px-10` lived in the later utilities layer and overrode the earlier fullscreen/wide CSS, so the steps still appeared centered. Fixed by hard-locking `.step-timeline-content` in fullscreen/wide mode to `width:100%`, `max-width:none`, `margin-left:0`, and `padding-left/right:2.5rem !important` to match BrandHeader `px-10`. The wide grid is now left-weighted with a third empty absorb track (`minmax(36rem,0.47fr) minmax(28rem,0.36fr) minmax(0,0.17fr)`) so the step chain stays aligned with the logo and the description stays adjacent.

Spec/memory updated: `spec/slides/30-fullscreen-layout-polish.md` now locks fullscreen/wide logo-gutter alignment and left-weighted grid behavior. `.lovable/memory/features/step-timeline-v3.md` updated to v3.4 with the same hard rule: StepTimeline must never center in fullscreen/wide mode.

Verification: attempted `bun run build`; current build is blocked by existing missing dependency resolution for `@tanstack/query-core` from `@tanstack/react-query`, not by the CSS/spec changes.

Remaining: resolve/install the missing `@tanstack/query-core` dependency so production build can complete; live edit + PHP backend remains deferred; optional `ambientBackground` opt-in still needs builder UI support.

let's start now 2026-04-26 10:55

Milestone (v0.39.0): Fullscreen/layout + ambient visual correction pass. StepTimeline now measures its own stage with ResizeObserver and applies the fullscreen left/down composition whenever the canvas is wide+tall, not only when the browser `:fullscreen` pseudo-class fires. Content shifts further left/down (`max-width min(1800px,96vw)`, left margin pinned to 0), the detail panel gets its own downward nudge, and fullscreen/maximized rules share the same CSS path. Universal ambient background retuned to a visible-but-controlled gold halo with a faint dotted gold lattice using CSS variables (`--stage-halo-*`, `--stage-dot`) so it does not become too yellow. Dot-pagination tooltip simplified into a compact semantic-token pill (`bg-popover`, `text-foreground`, gold border) to remove the heavy custom gradient look. Homepage ambient icon float and VS Code/GitHub/JetBrains real-brand accents remain active.

Remaining: Live edit + PHP backend (deferred — say "let's build the live edit"); optional `ambientBackground` opt-in surfaced in the /builder UI; visual pass on capsule/native title tooltips if the browser tooltip still feels distracting.

let's start now 2026-04-27 02:55

Milestone (v0.38.2): Click sound volume halved — `click` default lowered 0.35 → 0.18 in `src/slides/sound.ts`. Affects dot-pagination jumps, prev/next navigation, capsule reveals — anywhere `slideSound.play('click')` is called without an explicit volume override. User flagged the click on slide-number buttons as too loud.

Milestone (v0.38.1): Universal warm-glow + dotted lattice tuned to the user's "5/10" target. Halo alpha bumped 0.16 → 0.22 (mid 0.10 → 0.14), gold dot tint 0.07 → 0.11, pattern recentered at 50/50 (was 52/48 — caused asymmetric drift in fullscreen). Fullscreen StepTimeline content shifts further down (pt 14vh → 18vh) and further left (pl 7vw → 4vw) to use the wide-canvas space the user flagged. Floating icons + brand-color accents (VS Code blue / GitHub white / JetBrains magenta) on the homepage already in place from v0.38 — verified rendering correctly.

Milestone (v0.38.0): TitleSlide animation spec locked. New `spec/slides/31-title-slide-animations.md` formalises the 5-beat enter cascade (glow 0.20s → eyebrow 0.25s → title 0.40s → subtitle 0.85s → capsules 1.10s + 0.09s/index). Implementation switched from container stagger to explicit per-block `delay` values so the rhythm survives conditional rendering. Added `titleSlide` preset (scale-spring, no translate) and `reducedFade` preset to `textAnimations.ts`. Reduced-motion preserves cascade rhythm without movement. New memory `features/title-slide-animations.md`.

Milestone (v0.37.1): Controller pill restyled — replaced flat near-black (hsl 0 0% 8%) with warm gradient surface (hsl 35 18% 14% → hsl 25 10% 8%) and stronger gold border glow. Dot-pagination tooltip now shares the same warm container instead of solid black.

Milestone (v0.37.0): Sound library expanded — real click.mp3 + zoom.mp3 + derived fade_zoom.mp3 (-8dB / 0.4s in / 0.7s out). Slide nav now plays click; capsule expand plays click + fadeZoom riding the layoutId morph. SoundKind extended to whoosh|click|pop|zoom|fadeZoom with same-kind 60ms debounce.

Milestone (v0.36.1): Dot-pagination tooltip fix — wrapper switched from overflow-x-auto to overflow-visible when slide count fits, so the "NN. Title" hover card is no longer clipped by the scroll container.

Milestone (v0.36.0): Fullscreen layout polish — left-edge alignment, blurred upcoming steps, softer glow, brighter homepage icons, muted gold.

== Spec ==
- New `spec/slides/30-fullscreen-layout-polish.md` locks every decision below.
- New memory `.lovable/memory/design/hero-fullscreen.md` — quick-reference rules.
- Index updated to surface the new memory file and the muted gold value.

== StepTimelineSlide layout ==
- Outer column padding aligned to BrandHeader logo edge: `px-10`
  (was `px-12 lg:px-16`). Logo → eyebrow → title → step 1 share one
  vertical sight line.
- Title `mb-8` → `mb-12` so there's a real gap before the chain.
- Two-column grid retuned `[1fr_1fr] gap-12 xl:gap-20`
  → `[0.58fr_0.42fr] gap-10 xl:gap-14`. Description now sits adjacent
  to the active step instead of on the far right.
- Right column gets `lg:pl-4` so it tucks just inside the timeline rule.

== Step state visuals ==
- Upcoming/past rows blur + go grayish:
    active   → 0px blur,  white,        opacity 1.00
    adjacent → 1.2px blur, hsl(0 0% 78%), opacity 0.55
    far      → 2.5px blur, hsl(0 0% 62%), opacity 0.30
- Blur survives `prefers-reduced-motion` (static cue), only the
  transition is dropped.

== Animation timing ==
- `--step-text-duration` 1500ms → 1000ms (per request).
- Right description column durations 0.9s → 1.0s on x + opacity so the
  chain row and the description land together.

== Glow softened (AmbientBackground) ==
- Inner stop `28 75% 11% / 0.85` → `28 65% 10% / 0.55`.
- Mid stop   `28 75% 11% / 0.45` → `28 65% 10% / 0.25`.
- Hue saturation 75 → 65 so the halo reads "warm noir", not spotlight.

== Homepage icons more visible ==
- TitleSlide migrated from inline scatter → `<AmbientBackground>` with
  `count=18 opacity=0.10 drift=0.6 parallax=24 glow`.
- Was 12 icons at 0.05 opacity (invisible on a projector).
- Memory locks: NEVER drop homepage opacity below 0.08.

== Gold tone-down ==
- `--gold` 40 96% 48% → 40 88% 50% (slightly less saturated, slightly
  brighter to compensate). `--gold-glow` unchanged — only the body
  color softens, the highlight still pops.
- `--primary` and `--ring` follow `--gold` (already aliased).

== Verification ==
- TypeScript + lint clean.

== Remaining ==
- Live edit + PHP backend (deferred — say "let's build the live edit").
- Optional `ambientBackground` opt-in surfaced in the /builder UI.

let's start now 2026-04-26 23:25

Milestone (v0.32.0): New `MiddleTitleSlide` type — section-break / interlude.

== Spec-first ==
- `spec/slides/26-middle-title-slide.md` — full layer/animation/token spec
  for the new "Ideas to share" interlude slide.
- `spec/slides/showcase/16-middle-title.json` — example JSON (enabled:false
  so it doesn't disturb the live deck order; flip to true when wanted).

== Implementation ==
- New enum value: `SlideType.MiddleTitleSlide` (src/slides/enums.ts).
- New component: `src/slides/types/MiddleTitleSlide.tsx`.
- Wired into `src/slides/SlideStage.tsx` SlideBody dispatcher.
- Builder schema entry added to `src/builder/fieldSchemas.ts` with
  fields: eyebrow, title, subtitle (no capsules — by design).
- JSON-Schema enum updated in `spec/slides/slide.schema.json`.

== Visual recipe ==
- Tight warm radial spotlight at dead-center (`--gold` HSL channels @ 0.18).
- AmbientBackground productivity preset, widened safe-zone (36x36) so
  no icon ever sits behind the title.
- Gold title `clamp(3rem, 6vw, 5rem)` + gray subtitle `clamp(1rem, 1.4vw, 1.5rem)`.
- Expo-out staggered entrance; reduced-motion → opacity-only.

== Verification ==
- `bunx tsc --noEmit` passed.

== Memory ==
- New: `mem://features/middle-title-slide`.

let's start now 2026-04-26 22:55

Milestone (v0.31.0): Asset preloader + contact-slide Ken-Burns removal + opt-in ambientBackground field.

== Asset preloader (spec 25) ==
- New `src/slides/preload.ts` with `preloadDeckAssets(deck, slides)`.
- Wired into `src/main.tsx` after the deck loads, before React mounts.
- Synchronous priority batch: brand chrome + slide #1 QR/image.
- Deferred batch via `requestIdleCallback` (200ms setTimeout fallback).
- `<link rel="preload" as="image" fetchpriority="high">` + warm Image().
- Idempotent (module-level INJECTED Set).

== Contact slide ==
- Removed Ken-Burns scale tween from QrMeetingSlide ContactLayout.
- Entrance is now opacity 0→1 + y 18→0 over 0.7s expo-out only.
- Memory updated: `mem://features/contact-card-v2`.

== ambientBackground schema field ==
- New `slide.ambientBackground` accepts: preset name string
  (`devtools|productivity|process|minimal`), full config object, or false.
- `src/slides/ambientPresets.ts` resolves the field to `<AmbientBackground>`
  props, including per-preset accent-color maps (devtools = VS Code blue +
  Figma orange).
- `SlideStage` renders the layer for any slide that opts in.
  StepTimelineSlide is skipped (it always renders its own ambient layer).
- Schema entry added to `spec/slides/slide.schema.json`.

== Verification ==
- `bunx tsc --noEmit` passed.

let's start now 2026-04-26 22:35

Milestone (v0.30.0): Root-cause fix — BrandStrip banner hard-disabled.

== Root cause ==
- Previous fix only removed `deck.brandStrip` from the bundled showcase
  `deck.json`.
- Runtime can load an imported deck manifest from localStorage via
  `IMPORTED_MANIFEST_KEY`; stale imported manifests could still contain
  `deck.brandStrip` and render the top `RISEUP ASIA LLC · 2026 DECK` banner.
- `resolveBrandStrip()` still honored deck/slide BrandStrip data, so removing
  one config file was not enough.

== Fix ==
- `src/slides/SlideStage.tsx`: `resolveBrandStrip()` now hard-returns `null`.
  The live slide stage no longer imports/renders `<BrandStrip />`, and
  `BrandHeader.offsetTop` is always `0`.
- `src/slides/components/SlidePreview.tsx`: removed BrandStrip rendering from
  thumbnails/previews; `BrandHeader.offsetTop` is always `0`.
- `src/slides/loader.ts`: added `stripRejectedBrandStrip()` to delete
  `deck.brandStrip` and force per-slide `brandStrip: false` on bundled and
  imported manifests, preventing stale localStorage manifests from bringing it
  back.
- `.lovable/memory/constraints/no-brand-strip.md`: updated with the root cause
  and the hard-disable rule.

== Verification ==
- `bunx tsc --noEmit` passed.

let's start now 2026-04-26 22:10

Milestone (v0.29.0): StepTimeline v3.1 — refined chips + dev-tool ambience.

== Step number chips ==
- Active 48px → 36px, idle 36px → 28px. Lifted with `-mt-1` so chips sit
  above the title baseline and read as markers, not buttons. Connector
  recentered from `left-[18px]` to `left-[14px]`.

== Ambient background ==
- StepTimeline icon set swapped to dev tools: VS Code (Code2), Terminal,
  Git, GitHub, Figma, Boxes, Container, Cpu, Cloud, Database, Braces, Bug.
- Two icons render in real brand color (VS Code blue + Figma orange) via
  the new `accentColors` prop; the rest stay faded monochrome at 0.05.
- New `parallax` prop on `<AmbientBackground>` — icons drift opposite the
  cursor with per-icon weight (0.4–1.0). Throttled with rAF, off when
  `prefers-reduced-motion`.

== Step transitions ==
- `--step-text-duration` 1100ms → 1500ms (expo-out). Row opacity/size/color
  transitions bumped 900ms → 1300ms to match. Whole chain shift now reads
  as one continuous motion.

== Ghost numeral entrance ==
- Variant alternates per step: i%3==0 fade, ==1 slide-from-right,
  ==2 slide-up. Duration 900ms → 1200ms.

== Files ==
- src/slides/components/AmbientBackground.tsx (parallax + accentColors)
- src/slides/types/StepTimelineSlide.tsx (chips + icon set + ghost variants)
- src/index.css (longer transitions)
- .lovable/memory/features/{step-timeline-v3,ambient-background}.md
- package.json (0.28.0 → 0.29.0)

let's start now 2026-04-26 21:30

Milestone (v0.28.0): Brand strip permanently disabled across the deck.

== Removed ==
- `deck.brandStrip` block in `spec/slides/showcase/deck.json` — the gold tagline
  banner ("RISEUP ASIA LLC · 2026 DECK") no longer renders on any slide.
- Per-slide `"brandStrip": false` overrides remain (defensive) but are now
  redundant since the deck default is gone.

== Memory ==
- New constraint: `.lovable/memory/constraints/no-brand-strip.md` — never
  re-enable the top BrandStrip banner. User has rejected it repeatedly.
- `index.md` Core updated; `brand-strip` memory line repointed at the
  constraint.

== Kept (inert) ==
- `BrandStrip.tsx`, schema fields, and `resolveBrandStrip()` remain in code so
  the feature is technically available, but it is OFF by default and must
  not be wired into any deck without explicit user request.

let's start now 2026-04-26 16:45

Milestone (v0.25.0): Capsule typography + vibrant color expansion.

== Capsule fixes ==
- Capsule labels now use Ubuntu (font-display) at 500 weight with
  -webkit-font-smoothing: antialiased + text-rendering: optimizeLegibility.
  Inter at small sizes was rendering hairy on the gradient backgrounds —
  Ubuntu reads as a deliberate "label" voice and stays crisp.
- Removed the ArrowUpRight icon from every clickable capsule. Arrow felt
  visually broken next to the label flip; affordance now relies on lift +
  hover label flip + cursor change.
- Hover label-flip width reservation rewritten as a CSS grid stack (one
  cell, two children) so the longer of `text` / `hoverText` anchors the
  width without absolute positioning. The old approach occasionally
  clipped descenders.
- No scale on hover anywhere — `lift-hover` is translateY-only as before.

== Vibrant color expansion ==
- New CapsuleColor variants: `violet`, `teal`, `rose`, `sky`. Each is a
  135° gradient with dark or white text picked for AA contrast. Defined
  in src/index.css (.capsule-violet/-teal/-rose/-sky), enum in
  src/slides/enums.ts, schema in spec/slides/slide.schema.json.
- Capabilities deck recolored for variety (8 capsules, 6 distinct hues):
  * Strategy → gold
  * Brand → rose (was ember — user requested change)
  * Product → cream
  * Engineering → ink
  * Growth → teal (was gold — break the yellow monotone)
  * Operations → outline
  * AI Systems → violet (was ember — user requested change)
  * Partnerships → sky (was cream)

== Files touched ==
- src/index.css (capsule typography + 4 new color classes)
- src/slides/components/Capsule.tsx (no arrow; grid-stack flip)
- src/slides/enums.ts (CapsuleColor extended)
- spec/slides/showcase/02-capabilities.json (recolored)
- spec/slides/slide.schema.json (color enum extended)
- package.json (0.25.0)

let's start now 2026-04-26 16:20

Milestone (v0.24.0): StepTimelineSlide v2.4 — chain animation polish.

== What changed ==
- Removed the rounded card padding (`rounded-2xl px-4 py-3 -mx-4`) on the
  active step button. There is now ZERO background or rectangle on the
  active row — depth is the only focus mechanism, per the chain spec.
- Sharper revolver depth tokens (CSS):
  * --step-scale-active:   1.0  → 1.05  (active pops forward)
  * --step-scale-adjacent: 0.92 → 0.90
  * --step-scale-far:      0.85 → 0.82
  * --step-opacity-adjacent: 0.55 → 0.50
  * --step-opacity-far:      0.30 → 0.28
  * --step-tilt-inactive:    2deg → 3deg
- New keyframe `step-revolver-pop` (560ms, overshoot ease):
  scale 0.85 → 1.10 → 1.03 → 1.05, with a brief rotateX flip from 6deg
  to 0. Applied via alternating `.step-row-pop-a` / `.step-row-pop-b`
  classes so the animation restarts on every active change (the
  cylinder-rotating-into-focus feel).
- Active number badge now grows (h-9/w-9 → h-11/w-11, text-sm → text-base)
  in addition to the existing bubble + glow pulse.
- Side-panel text-slide-in keyframe gained a 3px → 0 blur ramp for the
  3D translucent fade-in feel called for in the spec.
- Sound: UNCHANGED. Same per-active whoosh trigger, same volume, same
  guard. Spec explicitly required this.
- Two-column layout, sticky right panel, side-panel hybrid spring+blur,
  reduced-motion fallback: all unchanged.

== Files touched ==
- src/index.css (tokens + keyframes + .step-row-pop-a/-b)
- src/slides/types/StepTimelineSlide.tsx (no card padding; pop-class
  alternation; bigger active badge)
- package.json (0.24.0)

let's start now 2026-04-26 15:50

Milestone (v0.23.0): Title contrast fix + interactive capsules (spec 22).

== Title contrast (mem://design/contrast) ==
- TitleSlide.tsx no longer hard-codes `text-gold` on the hero h1.
  Now goes through `titleClassFor(spec)` so `titleStyle: "white"` (set on
  the showcase title slide) actually renders white.
- Subtitle color: foreground/65% → cream/85% so "Strategy · Design · Growth"
  reads as a soft warm companion to the white title (user requested
  "white but a little bit creamy").
- New memory: mem://design/contrast — locks the rule and the audit
  pattern so future AI doesn't repeat the gold-on-noir mistake.

== Interactive capsules (spec 22) ==
- New CapsuleSpec fields:
  * `hoverText`  → resting label flips out the top, hover label flips in
                   from below (320ms ease, width-reservation prevents reflow).
  * `expand`     → inline expanding-card payload (eyebrow, title, body,
                   sub-capsules, CTA). Click capsule grows it into a card
                   on the SAME slide; siblings dim + blur(1px); backdrop
                   blurs over the slide.
- Card uses shared `layoutId="capsule-{slideNumber}-{i}"` with the source
  capsule so Framer interpolates the rect — the card visibly MORPHS OUT
  OF the capsule. Spring (320 / 32 / 0.7).
- Close: Esc, backdrop click, ✕ button, or slide navigation.
- CTA inside card supports `onClickRevealSlide` (closes + navigates) or
  `href` (opens new tab).
- Capsule.tsx: replaced the legacy "↗" glyph with a lucide `ArrowUpRight`
  icon that nudges (+2x, -2y) on hover for any clickable capsule.
- CapsuleListSlide.tsx: owns `expandedIdx`, dim/blur of siblings, the
  AnimatePresence overlay, the Esc handler, and auto-resets on slide
  change.
- spec/slides/showcase/02-capabilities.json: every capability now has a
  `hoverText` + a full `expand` payload (eyebrow + body + 2-3 sub-capsules)
  so the demo is end-to-end the moment you land on /2.
- New spec: spec/slides/22-interactive-capsules.md (full schema, animation
  choreography, reduced-motion behavior, reuse pattern, acceptance
  criteria — written for AI handoff).
- New memory: mem://features/interactive-capsules — quick-reference for
  the same.
- Updated mem://index with both new memories.

== Backwards compatibility ==
- `clickRevealSlide` still works for capsules WITHOUT `expand`. Strategy
  capsule on /2 used to route to /4; now it opens the inline card. To
  restore the old behavior on any capsule, drop `expand` from its JSON.
- `expand` wins over `clickRevealSlide` when both are present.

let's start now 2026-04-26 15:20

Milestone (v0.22.0): DotPagination — animated glow + scale on active dot.
- Active pill now uses a snappy Framer spring (stiffness 420, damping 30,
  mass 0.6) for the slot-to-slot move via `layoutId` — feels like the pill
  "lands" with a subtle rebound instead of linear easing.
- Active pill drop-shadow upgraded to a layered gold glow (12px outer +
  4px inner halo) for richer presence on the noir background.
- Added a "landing halo" — a 16×16 blurred gold disc that scales 0.6 → 1.6
  while fading out (700ms cinematic ease) every time `current` changes.
  Re-keyed by current so it replays on every slide change. aria-hidden +
  pointer-events:none — pure decoration.
- Inactive dots now scale to 1.35× on hover with a 200ms ease for tactile
  feedback (Framer `whileHover`). Color hover (foreground/25 → /55) kept.
- Reduced motion: drops the spring + halo + hover scale; pill snaps
  instantly between slots. Color/contrast cues retained.

let's start now 2026-04-26 15:00

Milestone (v0.21.0): StepTimelineSlide — "Revolver" depth animation (spec 17 v2.3).
- Removed the soft gold-tinted card background behind the active row entirely.
  Focus now reads through scale + opacity + tilt + bubbled number badge only
  (no filled highlight rectangle).
- Added CSS3-only depth tokens to src/index.css :root:
    --step-scale-active/adjacent/far (1.0 / 0.92 / 0.85)
    --step-opacity-active/adjacent/far (1 / 0.55 / 0.30)
    --step-tilt-inactive (2deg)
    --step-bubble-duration / --step-bubble-ease (520ms / overshoot spring)
    --step-text-duration / --step-text-ease (420ms / quint out)
    --step-glow-color (gold @ 0.18)
- Added @keyframes:
    step-bubble-in (scale 0.6 → 1.15 → 0.96 → 1.0 with opacity ramp)
    step-text-slide-in-left (translateX -32px → 0)
    step-glow-pulse (box-shadow 0 → 6px gold ring)
- New utility classes: .step-row[data-state="active|adjacent|far"],
  .step-badge-bubble, .step-text-slide. Transform-only / opacity-only so
  every animation stays on the GPU compositor (no layout thrash).
- StepTimelineSlide.tsx refactor:
  * Each row now sets data-state by distance from active (active / adjacent /
    far) — adjacent rows tilt rotateX(2deg) to suggest the revolver-cylinder
    depth; far rows fade to 0.30.
  * Wrapped left timeline in `perspective: 1200px` so the rotateX reads.
  * Number badge re-keyed by `active` index so the bubble + glow keyframes
    retrigger on every transition (forward AND backward).
  * Active step text re-keyed so the slide-in-from-left always plays — even
    on backward navigation (text direction stays consistent per spec).
  * Removed Framer per-row scale/backgroundColor/h3 scale animations — those
    duties moved to CSS for spec compliance ("CSS3-only" acceptance #7).
- Right description panel (hybrid spring-y + subtle blur):
  * Y axis now uses framer spring (stiffness 360, damping 26, mass 0.7) for
    the bouncy tempo that matches the left-side bubble.
  * X + blur + opacity stay on the cinematic ease curve for a clean settle.
- Reduced motion: keeps opacity + color cues, drops every transform/animation
  per spec acceptance criteria #9.
- Updated mem://features/step-timeline-v2 to reflect v2.3 (no card bg).


Milestone: Fixed branded strip export asset resolution and presenter navigation root cause.

let's start now 2026-04-25 22:55

Milestone (v0.2.0): Locked branded header strip rendering for print / PDF / HTML capture.
- Added @media print + html[data-export-mode] hardening in src/index.css.
- Replaced gradient + backdrop-filter with solid ink + gold hairline in print.
- Marked ControllerBar root with data-print-hide="true" so it never prints.
- Documented Issue 22.03 in spec/issues/22-app-issues.md.

let's start now 2026-04-25 23:15

Milestone (v0.3.0): Reusable BrandedQR with deck-level meeting URL + per-slide override.
- Added `qrcode` dep for live URL → QR generation (white tile + ink modules, EC level H).
- BrandedQR now accepts `url` prop and falls back through src > asset > url > bundled PNG.
- New deck-level `deck.meeting` block ({ url, label, qrAsset }) on DeckSpec.
- New per-slide overrides: content.meetingUrl, content.meetingLabel (qrAsset already existed; qrUrl kept as legacy alias).
- Added src/slides/meeting.ts → resolveMeeting() merges deck + per-slide config, derives label from URL host when missing.
- QrMeetingSlide (both layouts) now sources QR via the resolver, no hardcoded fallbacks.
- Updated deck.schema.json + slide.schema.json + memory + showcase deck.json + 06-contact.json.

let's start now 2026-04-25 23:35

Milestone (v0.4.0): A11y pass on hover/pill/QR — no red-on-black combo.
- BrandedQR already safe (white tile + ink modules) — no change.
- capsule-ember: hue shifted 14 → 22 (saturated red → warm amber). Dark ink text retained for >7:1 contrast.
- capsule-outline: border opacity 0.5 → 0.7 so the chip outline is visible at small sizes.
- capsule-ink: border opacity 0.4 → 0.55 (same reason).
- controller-pill: border swapped from white/0.06 (failed in bright-gold theme) to gold/0.18.
- KeywordSlide eyebrow: text-ember/80 (small text on noir, ~5.7:1) → text-gold/90 (~9:1).

let's start now 2026-04-25 23:50

Milestone (v0.5.0): Lift-hover utility now covers every interactive pill.
- Added .lift-hover-subtle to: SlideIndicator (N/total jump button), PresenterPage timer reset,
  ThemeMenu close button, DeckMenu close button.
- No new CSS — reused the existing .lift-hover / .lift-hover-subtle utilities in src/index.css.
- All capsules, controller buttons, share/deck/theme menu items, contact rows, contact CTA,
  and click-reveal back badge now share the same hover language: 1.5px upward translate +
  soft drop shadow. No scale.

let's start now 2026-04-26 00:05

Milestone (v0.5.1): Removed last scale-based hover (GridOverview thumbnails).
- GridOverview tile now uses .lift-hover (translateY + soft gold shadow), matching every
  other interactive surface in the deck. Zero scale-based hovers remain.

let's start now 2026-04-26 00:25

Milestone (v0.6.0): Pixel-accurate RiseupAsia contact card.
- Wrote spec/slides/12-contact-card.md (full visual brief, HSL tokens, spacing system, 10 critical-detail checklist).
- Extended BrandedQR with style="riseup-finder": canvas-rendered QR + 3 red rounded finder squares + center "RiseupAsia" wordmark pill. EC=H protects scan reliability. Red lives only on the white card so the deck-wide "no red on black" rule still holds.
- Added types: SocialLink, ContactCta.icon, SlideContent.socials, SlideContent.qrStyle.
- Rewrote QrMeetingSlide ContactLayout: warm-radial dark bg, two-tone Riseup/Asia wordmark + amber underline, amber-tinted contact tiles, inline CTA-as-list-row pattern, bare social icons.
- Updated 06-contact.json: brandStrip:false, eyebrow uppercase, qrStyle:riseup-finder, cta.icon:calendar, socials array with LinkedIn/Mail/GitHub.
- Schema: ContactRow / ContactCta / SocialLink definitions + qrStyle / socials properties.

let's start now 2026-04-26 00:55

Milestone (v0.7.0): In-app slide builder with live preset preview.
- New /builder route: split-pane (form left, live SlidePreview right) covering all 8 slide types.
- Per-type field schemas in src/builder/fieldSchemas.ts — picking a slide type seeds defaults that render immediately.
- ContentFieldEditor renders the right inputs per FieldKey (text, select, repeater for keywords/capsules/steps/contact rows/socials, structured CTA editor).
- Live preview uses the existing SlidePreview component, so what you see IS the slide rendered through the deck preset — not a mock.
- Output: Copy JSON / Download .json for paste into spec/slides/{deck}/NN-name.json. Authoring-only, never mutates the bundled deck.
- Discoverable via the deck menu ("Open slide builder") plus direct /builder navigation.

let's start now 2026-04-26 01:10

Milestone (v0.7.1): Premium preset is now the implicit default.
- `resolveTitleStyle` reads `deck.preset ?? 'premium'`, so every new deck.json inherits Ubuntu Bold + clamp sizing + white/cream/gold rules without the author typing `"preset": "premium"`.
- Existing decks that explicitly set the preset are unaffected.
- Updated spec/slides/10-deck-preset.md (Opt-in → Opt-out section + precedence note).

let's start now 2026-04-26 01:35

Milestone (v0.8.0): /builder is now a multi-slide deck workspace with preset inheritance.
- New draft-deck store (src/builder/draftDeck.ts): localStorage-persisted DraftDeck with deck meta + slides[]; addSlide/duplicateSlide/removeSlide/moveSlide/updateDeck/updateSlide.
- Every slide added via the workspace inherits deck.preset (premium by default) — strips any explicit titleStyle so resolveTitleStyle picks white/cream/gold automatically. Switching the deck preset re-applies to all existing slides.
- DeckMetaForm: name/slug/presenter/theme/preset picker. Preset defaults to "premium".
- SlideListSidebar: numbered list with add/duplicate/delete + ▲/▼ reorder. Type picker for new slides.
- BuilderPage rewrite: 3-column workspace (deck+list / slide editor / live preview + manifest JSON). Top-bar actions: Reset draft, Copy JSON, Load as active (writes to riseup.deck.imported.v1 and routes to /1), Export manifest.
- Manifest reuses the existing buildManifest/downloadManifest pipeline — output is a portable file the deck-menu importer already understands.

let's start now 2026-04-26 01:55

Milestone (v0.9.0): /style-guide — single-page, in-app design reference.
- New route /style-guide (StyleGuidePage). Listed every preset token verbatim (4 typography classes + 4 title color classes + shimmer), the resolveTitleStyle precedence rules, the 5 capsule colors, and a live SlidePreview thumbnail of every SlideTypeValue (seeded from SLIDE_TYPE_SCHEMAS defaults via makeSlide(..., 'premium')).
- Doubles as a smoke test: thumbnails render the actual slide components, so a broken type shows up here.
- Linked from header back to /1 and forward to /builder.

let's start now 2026-04-26 02:05

Milestone (v0.9.1): always-on slide indicator + hardened keyboard nav.
- New SlideNumberBadge (src/slides/controls/SlideNumberBadge.tsx): tiny pointer-events-none pill pinned bottom-right showing "NN / NN" in mono with gold current. Always visible (the controller pill auto-hides). Hidden while GridOverview is open to avoid double-counting.
- Keyboard bindings on SlideDeckPage already covered Enter/Right (next) and Backspace/Left (prev); added Textarea/Select/contentEditable to the form-field guard so Backspace doesn't hijack typing in any future inline editor. Documented bindings inline.

let's start now 2026-04-26 02:20

Milestone (v0.10.0): /settings — preset-tuning panel.
- New module src/slides/presetSettings.ts: PresetSettings { titleScale, ruleThickness, ruleColor, bodyFont }. Persisted to localStorage[riseup.presetSettings.v1]. applyPresetSettings() stamps four CSS vars on <html>: --preset-title-display-size, --preset-title-content-size, --preset-body-font, --preset-rule-thickness, --preset-rule-color.
- src/index.css: .slide-title-display, .slide-title-content, .slide-subtitle now read those vars (with fallbacks matching previous defaults — zero behavior change when no settings saved).
- BrandStrip.tsx divider switched from baked Tailwind classes to inline style consuming --preset-rule-thickness + --preset-rule-color.
- src/main.tsx applies settings before first paint (no FOUC).
- New SettingsPage at /settings: title-scale slider (70%-130%), rule-thickness slider (0-4px, 0=hidden), rule-color select (gold/cream/ember/border), body-font select (Inter/Ubuntu). Live preview = CapsuleListSlide + TitleSlide via SlidePreview. Reset-to-defaults button.
- Titles always remain Ubuntu Bold by design — body-font picker only swaps subtitle font.

let's start now 2026-04-26 03:10

Milestone (v0.11.0): Specs-first overhaul — controller v2, dot pagination, Title Slide v2, cinematic capsules.

Specs written first (per user request):
- spec/slides/13-dot-pagination.md — bottom-center dot row, opt-in via /settings, click-to-jump, active dot morphs in place via shared layoutId.
- spec/slides/14-controller-collapsed-v2.md — collapsed shape now ← prev + → next two-button pill (~96×48), supersedes single-arrow shape from 02-controller.md.
- spec/slides/15-title-slide-v2.md — radial amber glow + scattered faint lucide icons (deterministic seeded layout). Title forced gold; subtitle muted.
- spec/slides/16-cinematic-capsule-animation.md — blur→focus + slide-up + spring overshoot per capsule, longer container stagger, paired radial glow on Capabilities slide.

Memory plans:
- mem://features/dot-pagination, mem://features/title-slide-v2, mem://features/cinematic-capsule-animation. Index updated.

Implementation:
- src/slides/controls/ControllerBar.tsx: collapsed state now renders prev + next buttons in a small pill (was single chevron). Both buttons stop propagation. Next is gold, prev is muted.
- src/slides/controls/DotPagination.tsx (new): bottom-center dot row, edge-mask scroll when total > 30, active pill morphs via layoutId, hidden in grid view + print.
- src/slides/presetSettings.ts: added `showDotPagination` (default false) + `subscribePresetSettings` pub/sub so toggling /settings live-updates the deck without reload.
- src/pages/SettingsPage.tsx: added "Show dot pagination" checkbox.
- src/pages/SlideDeckPage.tsx: subscribes to setting, renders DotPagination when enabled and grid is closed.
- src/index.css: added .no-scrollbar utility for the dot row.
- src/slides/types/TitleSlide.tsx: rebuilt as radial-glow hero with 12 scattered lucide icons (FileText/Video/MessageSquare/Clipboard/UserCheck/Book/GitBranch/Users), deterministic seeded layout via Mulberry32 PRNG keyed on slide title hash. Title forced gold; subtitle at foreground/65.
- src/slides/textAnimations.ts: added `cinematicCapsules` preset (opacity/y/scale/blur keyframes + spring overshoot on scale).
- src/slides/types/CapsuleListSlide.tsx: detects cinematicCapsules preset → uses dedicated container variant with longer stagger (0.09s) and delayChildren (0.25s); also renders the radial amber glow background offset to 50%/65%.
- spec/slides/showcase/02-capabilities.json: opted into `animations.capsules: "cinematicCapsules"`.
- spec/slides/slide.schema.json: enum extended with `cinematicCapsules`.

let's start now 2026-04-26 03:35

Milestone (v0.12.0): /builder animation preview panel.
- New src/builder/AnimationPreviewPanel.tsx — wraps SlidePreview with playback controls: speed slider 0.25×–2× (with 5 preset chips), Replay (bumps internal key → remount → entrance variants run from initial), and Loop (auto-replay every (1500/speed)+800ms).
- Implementation uses <MotionConfig transition={{ duration: 0.55/speed, damping: 18/max(0.5,speed), stiffness: 220*speed }}> so framer merges scaled timing into every child animation. Springs respect the damping/stiffness tweaks for natural slow-mo feel.
- Replay also fires automatically when the user picks a different slide or changes its transition/textAnimation, so authors see entrance immediately rather than landing post-animation.
- Header shows current transition + textAnimation names next to "1920 × 1080 → scaled".
- Speed/loop are preview-only — never mutate the slide spec or the exported deck.
- BuilderPage rewires preview block to <AnimationPreviewPanel slide={selectedSlide} width={760}/>; SlidePreview import dropped.
- Memory: mem://features/animation-preview-panel + index updated.

let's start now 2026-04-26 03:55

Milestone (v0.13.0): /builder Meeting URL field with live inline QR.
- ContentFieldEditor: replaced plain TextField for `meetingUrl` with new MeetingUrlField — text input + Copy + Open buttons + 120px live BrandedQR preview that re-encodes on every keystroke.
- Copy uses navigator.clipboard, with a 1.6s Check-icon confirmation and a sonner toast.
- Open is disabled (greyed, pointer-events:none) until the URL passes a basic /^https?:\/\/\S+\.\S+/ check; "doesn't look like a URL" hint appears in ember when text is present but invalid.
- BrandedQR is keyed on `${url}-${qrStyle}` so changing qrStyle (clean / riseup-finder) triggers a clean re-render with the right overlay.
- Empty state: dashed-border 120px placeholder with "Paste a URL to see the QR" instead of a blank tile.
- The same URL flows through to the actual QrMeetingSlide via existing meeting.ts resolver — no schema or render-path changes needed.

let's start now 2026-04-26 04:10

Milestone (v0.14.0): Top-center slide jumper with double-click section popover.
- New TopSlideJumper component (src/slides/controls/TopSlideJumper.tsx) pinned top-center, shows "NN / NN" in the same gold/foreground tabular-nums treatment as SlideNumberBadge.
- Single-click is intentionally a no-op (top edge is high-traffic); double-click opens a Popover with: numeric jump input (Enter = go, Esc = close) + grouped slide list partitioned by SectionDividerSlide entries (falls back to a single "All slides" group when no dividers exist).
- Active slide is highlighted in gold within the list; section headings are real <h3>s for screen-reader hierarchy.
- Wired into SlideDeckPage alongside SlideNumberBadge; both are hidden when the grid overview is open to avoid UI stacking.

let's start now 2026-04-26 04:35

Milestone (v0.15.0): Step timeline v2 + new AdvanceStepSlide cinematic chain.

Specs (authoritative — refer by codename):
- spec/slides/17-step-timeline-v2.md  → "steps implementation"
- spec/slides/18-advance-step-cinematic.md → "advance step"
Memory mirrors:
- .lovable/memory/features/step-timeline-v2.md
- .lovable/memory/features/advance-step.md
- index.md updated: slide-types list now includes FocusTimelineSlide + AdvanceStepSlide; both codenames added to Memories.

StepTimelineSlide upgrades (in src/slides/types/StepTimelineSlide.tsx):
- Autoplay toggle pill (Play/Pause icon, h-7, gold border) at the right end of the progress row. Mirrors keyboard `P`. aria-pressed reflects state.
- Slide-scoped keyboard nav (window keydown, guarded against form fields):
   ↑/k = prev step, ↓/j = next step, Home/End = first/last, 1-9 = direct jump, P = toggle autoplay.
   ArrowLeft/Right + Space/Enter intentionally NOT bound (deck owns those).
- Manual interaction (click + keyboard) pushes pauseUntil = now + 6s; hover does NOT (presenter can sweep without losing flow).
- Description reveal panel under each step: AnimatePresence with fade + slide-up + height tween (0.35s, [0.22,1,0.36,1]). Visible when row is active OR hovered (hover overrides active for the panel only — chip glow + connector still follow active). Indented ml-[60px] with gold left border. Omitted entirely if step has no `description`.
- Reduced-motion: no autoplay (default off), no pulsing chip ring, snap reveal panel.
- Showcase 03-process.json now has descriptions on all 4 steps to demo the reveal.

New AdvanceStepSlide (src/slides/types/AdvanceStepSlide.tsx):
- Vertical "reel" of full-viewport step frames. Strip translates Y by -focusIndex*100% with spring {stiffness:90, damping:20, mass:1} for the camera-dolly + tiny overshoot.
- Per-frame state mapping (far-prev/prev/active/next/far-next) → scale/opacity tuple. Active frame uses spring scale {stiffness:220, damping:22}; others use 0.55s tween.
- Active text-stagger: eyebrow (0.55s) → title with blur(6→0) (0.62s) → 60px gold rule width tween (0.78s) → subtitle (0.88s) → description (0.96s) → capsule (0.92s). Re-keyed on focus change so re-entries always fire.
- Soft radial gold glow on active frame only (the "spotlight"). Inactive frames render text statically (no transitions) to avoid peripheral jank.
- Right-edge dot column = jump UI; gold pill marks active; mono Step NN/NN label below. Buttons have aria-current/aria-label.
- Deck-level eyebrow+title in a fixed top-left overlay (z-20, pointer-events-none) — does NOT participate in the dolly.
- Owns Next/Prev via FocusTimelineHandle (forwardRef + useImperativeHandle). Returns false at chain edges so deck advances to a sibling. Slide-scoped Home/End jumps too.
- Reduced-motion: snaps strip + scale + text. Functionality preserved.

Wiring:
- src/slides/enums.ts: SlideType.AdvanceStepSlide added (with rationale comment).
- src/slides/SlideStage.tsx: imports AdvanceStepSlide, passes focusRef to it.
- src/builder/fieldSchemas.ts: SLIDE_TYPE_SCHEMAS.AdvanceStepSlide entry with sensible defaults (4 steps, capsules, subtitles).
- spec/slides/slide.schema.json: enum extended; description note about Next/Prev consumption.
- StepSpec.description was already in src/slides/types.ts — no schema change for that.

let's start now 2026-04-26 04:55

Milestone (v0.16.0): Contact card v2 spec + required socialLinkFacebook.

Spec authored:
- spec/slides/19-contact-card-v2.md — supersedes spec/slides/12-contact-card.md.
  Canonical closer slide built on QrMeetingSlide → ContactLayout. Documents:
   * locked HSL token table (background, glows, accent amber `hsl(40 100% 50%)`, text ramps, QR red `#FF0000`),
   * exact spacing/radii/type ramp,
   * 2-column anatomy with semantic naming map (headerLogo / companyNameLabel / contactPhoneNumberText / btnScheduleCall / socialLinkLinkedIn / socialLinkEmail / socialLinkGitHub / socialLinkFacebook),
   * full animation contract per element (delays + easings + reduced-motion),
   * 5 JSON-only variations (V1 canonical, V2 personal, V3 kiosk, V4 sales handoff, V5 minimalist),
   * 5 hard rules (never tint QR, never swap accent for project gold here, no scale-on-hover, max 5 rows, Facebook required),
   * accessibility + files-of-record + 10-step QA checklist.
- .lovable/memory/features/contact-card-v2.md mirrors the locked rules.
- .lovable/memory/index.md gains "**contact card**" codename entry.

Implementation (small — most of the slide already matched the spec):
- src/slides/types.ts: SocialLink.icon now includes 'facebook' with a comment that it's required for the canonical Riseup card.
- src/slides/types/QrMeetingSlide.tsx: imports `Facebook` from lucide-react, adds it to SOCIAL_ICON map (22px, strokeWidth 1.75 — matches siblings).
- spec/slides/slide.schema.json: SocialLink.icon enum extended with 'facebook'.
- spec/slides/showcase/06-contact.json: appends the Facebook social so the live deck closer now ships with linkedin / mail / github / facebook.

let's start now 2026-04-26 13:30

Milestone (v0.17.0): Readable-focus type ramp + per-slide WebAudio sound system.

User feedback (2026-04-26):
  "slides do not grow with the screen, text looks too small, can't focus on it.
   When we focus/zoom in, add a whoosh sound. Sounds should be configurable per slide
   in the JSON. Also remove the top-left brand header logo."

Resolution (per Q&A locked in chat):
  - Scaling: keep flow layout (no fixed 1920x1080 canvas); bump type ramp on the
    affected slide types so text "feels focused" at distance.
  - Top banner: hide brand-header logo only (keep brand strip + controller).
  - Sound: configurable per slide via `SlideSpec.sound`, synthesized in-browser
    with WebAudio (no MP3 ships).

Specs authored:
  - spec/slides/20-advance-step-v2.md  — supersedes 18 for type ramp / brand header /
    sound on AdvanceStepSlide. Locks larger eyebrow (16-18px), title (7.5-11rem),
    subtitle (24-30px), description (18-20px), 88x2 gold rule, max-w-5xl.
  - spec/slides/21-sound-system.md     — new, deck-wide sound contract. Documents
    SlideSpec.sound JSON, the singleton slideSound runtime, autoplay-policy unlock,
    background-tab guard, persisted global mute, and the three procedural synths
    (whoosh / click / pop) with exact frequency/duration/envelope specs.
  - spec/slides/17-step-timeline-v2.md — extended with a v2.1 addendum locking the
    new readable-focus type ramp (max-w-6xl, space-y-10, step title text-4xl→6xl
    leading 1.05, subtitle text-lg→xl, description text-lg→xl), the brand-header-off
    recommendation, and the whoosh-on-active-change behavior (with first-arrival
    rule, hover-never-plays-sound rule, mute escape hatch).

Memory:
  - .lovable/memory/features/sound-system.md (new) mirrors spec 21.
  - .lovable/memory/features/advance-step.md rewritten for spec 20.
  - .lovable/memory/features/step-timeline-v2.md gains the v2.1 ramp + sound rules.
  - .lovable/memory/index.md picks up codename entries for "**slide sound**" and
    points the advance-step entry at spec 20.

Code:
  - src/slides/sound.ts (new): singleton slideSound with lazy AudioContext, one-shot
    pointerdown/keydown unlock, document.hidden guard, localStorage-persisted global
    mute. Synth methods cover whoosh (BiquadFilter band-pass swept 1.2->4kHz over
    280ms), click (square 1.2kHz 60ms with 5ms attack), pop (sine 380->640Hz upchirp
    120ms). Master gain hooked to ctx.destination.
  - src/slides/types.ts: SlideSpec gains optional `sound: SlideSoundSpec` plus
    re-exported types. Schema enums: on=enter|focus|click, kind=whoosh|click|pop,
    volume 0..1, mute boolean.
  - spec/slides/slide.schema.json: matching `sound` object on SlideSpec.
  - src/slides/types/AdvanceStepSlide.tsx: imports slideSound, fires whoosh on each
    focusIndex change (with lastPlayedFocus ref so React StrictMode double-runs
    don't double-fire). Type ramp bumped to spec 20: eyebrow text-[16px] md:[18px],
    title text-[7.5rem] md:[9rem] xl:[11rem] leading-[0.92], subtitle text-2xl
    md:text-3xl, description text-lg md:text-xl, max-w-5xl, gold rule h-[2px] w-88.
    Frame padding px-16 md:px-24.
  - src/slides/types/StepTimelineSlide.tsx: imports slideSound, fires whoosh on each
    `active` change after the initial reveal hands off active=0. Type ramp bumped:
    container max-w-6xl, row gap space-y-10, h3 text-4xl md:5xl xl:6xl leading-1.05,
    subtitle text-lg md:xl mt-2, description text-lg md:xl. Default sound volume is
    0.35 (slightly quieter than AdvanceStep's 0.45 because cursor advances are more
    frequent here).
  - spec/slides/showcase/03-process.json: showBrandHeader flips to false, picks up
    `sound: { on:'focus', kind:'whoosh', volume:0.35 }`.

let's start now 2026-04-26 14:05

Patch (v0.17.1): StepTimelineSlide description moves to a cinematic right-side panel.

User feedback: "the description shouldn't sit below the row. It should slide+fade
in from left to right on the right side. Should feel filmy. Fix the spec first,
then implement."

Spec:
  - spec/slides/17-step-timeline-v2.md §13.4 rewritten: layout is now a two-column
    grid (timeline left, single description side panel right). Inline per-row
    description block REMOVED. Right panel uses <AnimatePresence mode="wait">
    keyed by focused step. Enter {opacity:0, x:-40, blur 6px} → settled over
    0.45s ease [0.22,1,0.36,1]. Exit slides out to x:24 with a 4px blur over
    0.25s. Inner stagger: eyebrow → 56x2 gold rule width grow → description
    text → capsule. Reduced motion: 150ms opacity crossfade only.
  - Test additions §13.5 (#12-#15) lock the new behavior.

Code:
  - src/slides/types/StepTimelineSlide.tsx: layout refactored into a
    `grid lg:grid-cols-[1fr_1fr]`. Left column keeps the chip/connector/title
    list (now `text-3xl md:4xl xl:5xl` since it's no longer the only hero).
    Right column hosts the new sticky cinematic side panel. AnimatePresence
    mode="wait" + key={focusedIndex} drives the swap.
  - DESC_REVEAL_S constant removed (unused).
  - .lovable/memory/features/step-timeline-v2.md updated to mirror the new
    locked rules.

let's start now 2026-04-26 14:35

Milestone (v0.18.0): Step-timeline pause UX + step-first nav + MP3 whoosh with envelope.

Spec: spec/slides/17-step-timeline-v2.md §14 (v2.2 addendum) + spec/slides/21-sound-system.md §8 (v1.1 addendum).

Code:
  - public/sounds/swoosh.mp3 (original) + public/sounds/fade_swoosh.mp3 (0.5s ffmpeg trim with baked fades + 1.2dB gain).
  - src/slides/sound.ts: rewritten. Whoosh now plays the MP3 via WebAudio with a runtime 60ms attack + 120ms release envelope. Previous whoosh ducked on new play. Synth kept as fallback. Click/pop unchanged.
  - src/slides/types/StepTimelineSlide.tsx: forwardRef<FocusTimelineHandle> + useImperativeHandle exposes tryAdvance for step-first deck Next/Prev. Autoplay default flipped to OFF. Toggle is icon-only (28x28 round). Active row replaced harsh focus rectangle with a soft gold-tinted card (bg gold/0.07, scale 1.015, title scale 1.04). Focus ring softened to ring-1 ring-gold/40 with no offset.
  - src/slides/SlideStage.tsx: passes ref={focusRef} into StepTimelineSlide so the deck routes Next/Prev through tryAdvance first.
  - .lovable/memory/features/{step-timeline-v2,sound-system}.md updated.

let's start now 2026-04-26 14:50

Milestone (v0.18.1): Whoosh asset v2 — softer, shorter, quieter.
  - public/sounds/fade_swoosh_v2.mp3 (0.35s, 80ms in / 140ms out, -3dB).
  - src/slides/sound.ts: WHOOSH_URL → fade_swoosh_v2.mp3.
  - spec 21 §9 + memory updated. v1 asset retained for future hero use.

let's start now 2026-04-26 14:55

Milestone (v0.19.0): Contact slide background fix + meeting slide removed.
  - src/slides/types/QrMeetingSlide.tsx ContactLayout: replaced the two
    corner-anchored amber glows (which left dark left/right edges) with a
    centered ellipse stack — warm amber core (#2A200B-equivalent), wider
    warm halo, soft cool-gray midband for lift, then the #0F1115 base.
  - spec/slides/showcase/05-meeting.{json,md} deleted; deck.json slide
    list updated (now 5 entries: title, capabilities, process,
    strategy-detail, contact).
  - 05-meeting was the older "Book a Call" QR slide — redundant with the
    new richer 06-contact card.

let's start now 2026-04-26 15:05

Patch (v0.19.1): Contact slide uses bundled meeting-qr.png exactly.
  - spec/slides/showcase/06-contact.json: qrStyle "riseup-finder" → qrAsset "riseup-meeting".
  - QrMeetingSlide ContactLayout: pass meeting.qrAsset always; force style 'clean' when an asset is present so BrandedQR shows the bundled artwork untouched (no canvas overlay).

let's start now 2026-04-26 15:10

Milestone (v0.20.0): Contact slide Ken-Burns focus zoom.
  - QrMeetingSlide ContactLayout inner motion.div now punches in from 0.96→1.0 over 0.55s, then drifts to 1.05 over ~9s while held. Glow stays anchored on the outer wrapper so it reads like a camera lean-in on the content, not a whole-frame zoom. Reduced-motion collapses to a static fade-in.

let's start now 2026-04-26 15:30

Milestone (v0.26.0): StepTimeline rewrite (no CSS scale) + numbered dot pagination + brand header on /3.
  - src/index.css: removed all `transform: scale` from .step-row. Depth now reads through real
    font-size jumps (--step-title-active/-adjacent/-far via clamp()) plus opacity ramp. Active
    title color forced to pure white (hsl(0 0% 100%)) for max contrast vs. inactive cream.
    Removed @keyframes step-revolver-pop and the `.step-row-pop-a/-b` classes (scale-based).
    Added antialiasing + optimizeLegibility on .step-row so glyphs stay crisp.
  - src/slides/types/StepTimelineSlide.tsx: dropped popClass logic + the fat progress-pill
    "banner". Replaced with a discreet Play/Pause icon + tiny "STEP NN / NN" counter.
    Title now renders inside `<h3 class="step-title">` and depth state is purely CSS-driven.
    Subtitle only renders for the active step (cleaner inactive rows).
  - spec/slides/showcase/03-process.json: showBrandHeader=true + brandStrip=false. The Riseup
    logo + presenter chip now appear on /3 like every other slide; the gold strip banner is
    gone (user-confirmed redundancy).
  - src/slides/controls/DotPagination.tsx: full rewrite. Each dot is now a numbered pill
    (number always visible, tabular-nums). Active widens to a 32px gold pill via shared
    layoutId. Hover reveals a tooltip card above the row showing "NN — Eyebrow / Title".
    Tooltip has gold border + backdrop blur + arrow.
  - src/pages/SlideDeckPage.tsx: pass `slides={linearSlides}` into <DotPagination>.
  - src/slides/presetSettings.ts: showDotPagination default flipped from false → true.

let's start now 2026-04-26 16:05

Milestone (v0.27.0): StepTimeline v3 cinematic motion + ambient bg + ghost numeral. Specs 23/24/25 written; 25 (preloader) + contact zoom removal pending "next".
  - spec/slides/23-step-timeline-v3.md (motion layer on top of v2.5).
  - spec/slides/24-ambient-background.md (reusable AmbientBackground).
  - spec/slides/25-asset-preload.md (deferred to next turn).
  - .lovable/memory/index.md + 3 new feature memories.
  - src/index.css: --step-text-duration 420ms→1100ms; ease cubic-bezier(0.19,1,0.22,1)
    (expo-out). step-text-slide-in-left translateX -24→-32. New @keyframes step-badge-radiate
    (2400ms infinite breathing halo). .step-row + .step-title transitions lengthened to 900ms.
  - src/slides/components/AmbientBackground.tsx (NEW): deterministic icon scatter +
    optional radial glow + drift. Per-slide-type icon sets supported.
  - src/slides/types/StepTimelineSlide.tsx: wrapped in relative container with
    AmbientBackground (Compass/Target/Hammer/TrendingUp/Workflow/Layers/Activity/Sparkles)
    and a giant ghost numeral (clamp(20rem,38vw,44rem), gold/0.045) cross-fading via
    AnimatePresence on every active change. Active badge h-11→h-12 with .step-badge-radiate.
    Right-panel eyebrow + description forced to pure white. Right-panel transitions
    lengthened to 0.9s expo-out (Y still spring, softer 260/28/0.8).

Pending for "next":
  - Asset preloader (spec 25) — boot-time <link rel="preload"> for QR + brand + slide images.
  - Remove Ken-Burns scale on contact slide; replace with fade+lift only.
  - Optional: per-slide ambientBackground field in slide schema for opt-in on other types.

let's start now 2026-04-26 17:30

Milestone (v0.33.0): StepTimeline v3.2 — fixed-slot rows + Poppins + pure white.
  - src/index.css: imported Poppins (300/400/500/600/700/800).
  - src/index.css .step-row: added `min-height: calc(var(--step-title-active) * 1.05)` +
    `display:flex; align-items:center;` so each row reserves the *active* size as its
    slot. The active step grows in place; siblings no longer reflow downward. NO scale.
  - src/index.css .step-row + .step-title: font-family forced to 'Poppins' on the step
    slide only (the rest of the deck stays Ubuntu titles + Inter body).
  - src/index.css .step-row[data-state] .step-title: color is now hsl(0 0% 100%) at
    every state (was 100% / 75% / 55%). Inactive rows still fade via the row's opacity.
  - spec/slides/showcase/03-process.json: titleStyle "cream" → "white", titleShimmer off.
    Slide-level title ("Engagement Process") now reads pure white.

Spec + memory:
  - spec/slides/27-step-timeline-v3.2.md (NEW): documents fixed-slot reflow rule + Poppins.
  - .lovable/memory/features/step-timeline-v3.md updated with v3.2 addendum.

Pending for "next":
  - Live in-slide edit button + persist back to JSON (architectural decision needed —
    PHP file write vs Node.js endpoint vs Lovable Cloud edge function vs in-browser
    file-system-access API + manual download). Proposed in chat reply.

let's start now 2026-04-26 17:55

Deferred (NOT implemented this turn — docs only): Live in-slide edit button + PHP backend.
  - .lovable/memory/features/live-edit-php.md (NEW): locked decisions — PHP self-hosted,
    NEVER Lovable Cloud / Supabase / Node. React built to /dist, copied into PHP webroot.
  - spec/slides/28-live-edit-php-deferred.md (NEW): full architectural spec with API
    surface (GET/PUT/POST under /api), path-safety rules, frontend wiring plan, build
    pipeline, open questions for the kickoff conversation.
  - .lovable/memory/index.md: registered the new memory; flagged DEFERRED.
  Trigger phrases to start the work: "let's build the live edit", "let's wire up the
  PHP backend", or "add the edit button now".

let's start now 2026-04-26 18:30

Milestone (v0.34.0): StepTimeline v3.3 layout fix + dot-pagination tooltip redesign.
  - src/slides/types/StepTimelineSlide.tsx: justify-center → justify-start so the
    title sits right below BrandHeader and never gets clipped on short viewports.
    pt-32 → pt-24 lg:pt-28, pb-20 → pb-16, px-16 → px-12 lg:px-16. mb-12 on title
    → mb-8. mb-10 on autoplay row → mb-6. step-row gap space-y-8 → space-y-4 lg:space-y-6.
    Title h2 also gets `style={{ color: 'hsl(0 0% 100%)' }}` as a hard guarantee
    against any localStorage manifest still requesting cream.
  - src/index.css: --step-title-active clamp(3rem, 5vw, 4.75rem) → clamp(2.25rem, 4.2vw, 3.75rem).
    Adjacent + far reduced proportionally. Fixes the 4-step chain overflowing 720p screens
    while preserving the in-place fixed-slot rule from v3.2.
  - src/slides/controls/DotPagination.tsx: tooltip redesigned to match user's reference —
    single dark pill ("NN. Title") with gold number + white title. Removed the gold-bordered
    card with eyebrow + arrow chrome.

let's start now 2026-04-26 11:55
v0.40.0 — On-screen BrandStrip audit overlay.
  - src/slides/loader.ts: `stripRejectedBrandStrip` now accepts a `source`
    ('imported' | 'bundled') and pushes a `BrandStripAuditEntry` for every
    field it removes (deck-level OR per-slide). The frozen log is exported
    as `brandStripAudit`.
  - src/slides/components/BrandStripAuditOverlay.tsx (new): bottom-right
    pill mounted globally in App.tsx. Renders nothing when the audit log is
    empty. Otherwise shows "BrandStrip audit · N fields stripped" with a
    per-row breakdown (deck/slide, source, removed value), a collapse
    toggle, and a "Dismiss for this session" button (sessionStorage key
    `riseup.brandStripAudit.dismissed.v1`).
  - src/App.tsx: mounts <BrandStripAuditOverlay /> alongside the toaster
    so it's visible on every route.
  - Lets the user verify the root-cause fix actually ran across reloads /
    re-imports, instead of trusting a silent strip.

let's start now 2026-04-26 12:35
v0.42.0 — Constraint inspector panel + recovered BrandStripDebugOverlay.
  - src/slides/components/ConstraintInspectorPanel.tsx (new): top-right
    panel listing every constraint loaded from `.lovable/memory/constraints/`
    via Vite raw-glob. Each row shows name/description/type and an
    ENFORCED/VIOLATED status from a per-constraint runtime probe. The
    `no-brand-strip` probe checks (1) resolveBrandStrip() returns null for
    every slide, (2) the boot audit ran, (3) no live DOM element matches
    any BrandStrip selector. Re-runs every 1s while open. Activates via
    `?debug=constraints` or Ctrl/Cmd+Shift+C. Renders nothing otherwise.
  - src/slides/components/BrandStripDebugOverlay.tsx: re-saved (the file
    from v0.41.0 was missing on disk this session — TS build caught it).
    Same behavior as v0.41.0: off-screen mounts of SlideStage + SlidePreview,
    DOM scan, divergence flag.
  - src/App.tsx: now mounts all three debug surfaces. Audit overlay outside
    BrowserRouter (no router deps); diff + inspector inside (use useLocation).
  - .lovable/memory/features/debug-overlays.md (new): documents all three
    surfaces, activation table, probe contract, and the "do not weaken"
    rule. Future constraint authors can add `<name>.md` + a PROBES entry
    and the inspector picks it up automatically.

let's start now 2026-04-26 13:10
v0.43.0 — First-whoosh fix + idle Lissajous sway on AmbientBackground.
  - src/slides/sound.ts: SlideSoundManager now prefetches every MP3 at
    module load (before any AudioContext) into `this.prefetched`. When
    the user gesture finally creates the context, `loadAsset` decodes
    from cached bytes — no second network round-trip. Cinematic cues
    (whoosh / zoom / fadeZoom) NO LONGER fall back to the procedural
    synth on first play; instead they await the real buffer up to
    READY_WAIT_MS=800ms and play the MP3 the moment it lands. Race
    protection: deferred play drops if a newer same-kind call happened
    while waiting. `click` keeps the synth safety net for hard network
    failure (a missing click is worse than a slightly different one).
  - src/slides/components/AmbientBackground.tsx: cursor parallax now
    driven by a single rAF loop that ALSO produces a continuous Lissajous
    sway when the cursor is idle (`x=sin(t·2π/7)·0.18`,
    `y=cos(t·2π/11)·0.18`, coprime periods → never visibly repeats).
    Real cursor handover via `idleBlend` ramping 0→1 over 1000ms after
    the mouse goes still. Easing: lerp at 0.08 per frame, no spring deps.
    Reduced motion still skips the loop entirely.
  - .lovable/memory/features/sound-system.md, ambient-background.md and
    spec/slides/21-sound-system.md, 24-ambient-background.md updated
    with v0.43.0 addenda so any AI implementing later cannot revert.

let's start now 2026-04-26 13:25
v0.44.0 — Tooltip polish to match contact-card surface quality.
  - src/components/ui/tooltip.tsx: TooltipContent restyled. New surface
    uses popover token at 92% + backdrop-blur-md, gold-tinted border at
    25%, soft black drop shadow + 1px gold hairline glow. Padding bumped
    to 14px×8px (px-3.5 py-2), font 12px medium with 0.01em tracking and
    leading-snug, max-w-xs, rounded-lg (8px). Default sideOffset bumped
    4 → 8px so chips clear hover-revealed icon borders. Animation recipe
    unchanged. Used by Radix Tooltip across slides/sidebar/chart — every
    existing call site benefits with no API change.

let's start now 2026-04-26 13:55
v0.45.0 — Step slide layout + dotted bg restricted + Figma brand icon + glow rebalance + tooltip solidified.
  - src/index.css: split `.slide-stage-ambient` into base (gold halo only,
    every slide) + `.with-dot-lattice` modifier (dotted gold pattern,
    StepTimeline only). Halo alphas bumped (0.30/0.17/0.07 -> 0.38/0.22/
    0.10) so the gold glow is actually visible after v0.43 made it look
    invisible. Fullscreen StepTimeline padding-top bumped to clamp(10rem,
    22vh, 16rem) and padding-left tightened so the column shifts further
    DOWN+LEFT to use the wide canvas. Detail panel translateY bumped to
    1.4rem.
  - src/slides/SlideStage.tsx: applies the `with-dot-lattice` class only
    when `slide.slideType === 'StepTimelineSlide'`.
  - src/slides/components/BrandIcons.tsx: added `FigmaIcon` (5-color
    canonical mark — red/green/orange/purple half-pills + blue circle).
  - src/slides/types/TitleSlide.tsx: HOME_ICONS now includes FigmaIcon at
    index 15; HOME_ACCENTS adds slot 15 (#F24E1E ignored by FigmaIcon's
    multi-color SVG); count 15->16; floatIndexes now [1,3,6,9,12,13,14,15]
    so all 4 brand icons auto-bob even with no mouse movement.
  - src/components/ui/tooltip.tsx: bumped popover alpha 92% -> 96%, border
    primary/25 -> /35, deeper drop shadow so the chip reads solid against
    busy ambient backgrounds.

let's start now 2026-04-26 14:35
v0.46.0 — Tame StepTimeline ambient + brighten dot lattice.
  - src/slides/types/StepTimelineSlide.tsx: AMBIENT_SIZE_RANGE pulled
    from [72, 128] -> [36, 72]. The big brand-color icons (VS Code blue,
    GitHub octocat, Figma multi-color) were overlapping the right-column
    description text and competing with the timeline. At 36-72px they
    read as ambient texture instead of focal points. Opacity nudged
    0.07 -> 0.05 to match.
  - src/index.css: `.with-dot-lattice` dot alpha bumped 0.10 -> 0.16
    (windowed) and 0.11 -> 0.18 (fullscreen). Dot radius slightly larger
    so the stippled-paper feel actually reads on a 1264px viewport.

let's start now 2026-04-26 14:55
v0.47.0 — StepTimeline wide-stage layout: shift LEFT + DOWN, kill empty middle gap.
  - src/index.css: per the user's annotated drawing on slide 3 (red box
    pulls left, arrow points the description into the empty middle):
      * .step-timeline-content padding-left clamp(1rem, 2.2vw, 3rem)
        -> clamp(0.5rem, 0.6vw, 1.5rem) so the "Engagement Process"
        headline and the chain hug the LEFT gutter,
      * max-width min(1860px, 98vw) -> 100% with margin 0/0 so no
        auto-centering creeps back in,
      * padding-top clamp(10rem, 22vh, 16rem) -> clamp(11rem, 24vh,
        18rem) so the headline drops into the upper third instead of
        sitting under the brand header,
      * .step-timeline-grid columns rebalanced 0.54/0.46 -> 0.5/0.5
        and gap clamp(3.5rem, 4.5vw, 6.5rem) -> clamp(2rem, 2.5vw,
        3.5rem) so the description column slides LEFT and the empty
        middle disappears.

let's start now 2026-04-26 15:20
v0.48.0 — Replaced native title= tooltips with the styled Tooltip primitive across all slide-facing controls.
  - src/slides/controls/ControllerBar.tsx: every titled button (Overview,
    Presenter view, Reveal hints, Deck manifest, Share, Theme palette,
    Fullscreen, Pin, Previous, Next — both expanded and collapsed states)
    is now wrapped in <Tooltip><TooltipTrigger asChild>...</...></Tooltip>
    using the gold-bordered popover surface. aria-label retained on every
    button so screen readers still get the verbal cue.
  - src/slides/controls/SlideIndicator.tsx: "Click to jump" hint promoted
    from native title= to <Tooltip>.
  - src/slides/controls/TopSlideJumper.tsx: nested Tooltip + Popover via
    composed asChild so hover shows the styled chip while dblclick still
    opens the section jumper popover. No conflict because the gestures
    are different (hover vs dblclick).
  - Builder-only UIs (ContentFieldEditor, AnimationPreviewPanel) still use
    native title= — those are dev surfaces and not part of the slide
    presentation deck.

let's start now 2026-04-26 18:30
v0.81.3 — LLM authoring pack complete (Phases 13–19)
- spec/slides/llm/16-voice-to-slide-protocol.md — six-question intake + decision tree
- spec/slides/llm/17-do-and-dont.md — 10-section approved/forbidden matrix
- spec/slides/llm/18-acceptance-checklist.md — 40-box pass/fail gate with scoring tiers
- spec/slides/llm/assets/index.md — annotated overlay (asset ↔ playbook)
- spec/slides/llm/19-remediation-pack.md — Audit 02 gap closures (G1 ASCII refs, G2 new-type recipe, G3 required-fields, G4 variety matrix)
- spec/audit/02-blind-llm-gap-analysis-v2.md — pack pre-remediation: 8.9/10
- spec/audit/03-blind-llm-reaudit.md — pack post-remediation: 9.6/10 (ship gate ≥9.5 PASSED)
- .lovable/memory/features/llm-authoring-pack.md — registered as canonical
- .lovable/memory/index.md — pack added to memories list
- spec/slides/llm/00-readme.md — file 19 added to reading order
- package.json — bumped 0.80.6 → 0.81.3

let's start now 2026-04-26 18:45
v0.81.4 — Phase 20 final acceptance (initiative closed)
- spec/audit/04-final-acceptance.md — 20/20 phases shipped, ship gate 9.6/10 PASSED
- package.json — bumped 0.81.3 → 0.81.4

let's start now 2026-04-26 19:05
v0.82.0 — R1 closed: rendered PNG references for empty asset folders
- spec/slides/llm/assets/canvas/canvas-1920x1080.png — 1920×1080 frame with safe-area overlay
- spec/slides/llm/assets/background/ambient-drift.png — default ambient preset render
- spec/slides/llm/assets/typography/scale.png — 8-rung type ladder
- spec/slides/llm/assets/authoring/json-flow.png — voice→JSON authoring flowchart
- spec/slides/llm/assets/index.md — sections 4–7 promoted from "empty" to populated
- package.json — bumped 0.81.4 → 0.82.0 (minor: new capability, R1 closed)

let's start now 2026-04-26 19:25
v0.82.1 — R2 closed: schema discriminator for fail-fast validation
- spec/slides/slide.schema.json — added allOf block with if/then per slideType (TitleSlide, MiddleTitleSlide, SectionDividerSlide, KeywordSlide, CapsuleListSlide, StepTimelineSlide, FocusTimelineSlide, AdvanceStepSlide, ImageSlide, QrMeetingSlide). Catches: missing required content fields, minItems violations on keywords/capsules/steps, anyOf source-of-QR misses.
- spec/slides/llm/19-remediation-pack.md — G3 section updated to reflect schema-enforced contract; mirrors discriminator constraints.
- Verified with Python jsonschema Draft7Validator: 4/6 showcase slides pass; 2 pre-existing failures unrelated (03-process step description, 16-middle-title isClickReveal).
- package.json — bumped 0.82.0 → 0.82.1

let's start now 2026-04-26 19:55
v0.83.0 — Ambient layer is now fully JSON-driven (StepTimeline + Title)
- src/slides/ambientIconRegistry.ts NEW — slug→component map (vscode, github-mark, code2, …) + default brand colors. Lets JSON name icons by string.
- src/slides/types.ts — added AmbientLayerSpec + AmbientIconPlacement; added stepAmbient + titleAmbient to SlideContent.
- src/slides/components/AmbientBackground.tsx — accepts explicitPositions[] that replaces the seeded scatter for 1:1 reproducibility; per-slot accent overrides.
- src/slides/types/StepTimelineSlide.tsx — reads content.stepAmbient (knobs + positions); falls back to legacy hard-coded behavior when absent.
- src/slides/types/TitleSlide.tsx — same treatment for content.titleAmbient.
- spec/slides/showcase/03-process.json — authored stepAmbient.positions[] giving GitHub mark and Code2 a deliberate ~22% horizontal gap (fixes the cluster the user flagged in the screenshot).
- spec/slides/showcase/03-process.md — documented the ambient choice.
- spec/slides/slide.schema.json — added AmbientLayer definition + stepAmbient/titleAmbient slots on content.
- package.json — bumped 0.82.1 → 0.83.0 (minor: new authoring capability).
- Closes the gap the user identified: the ambient icon scatter (which was hard-coded in components) is now reproducible by dropping the JSON spec into any compliant renderer.

let's start now 2026-04-27 00:08
v0.84.0 — Step timeline reveal mode (auto-applied via leftOffsetPx snap)
- src/slides/types/StepTimelineSlide.tsx — when a step has leftOffsetPx > 0, the row auto-opts into a cinematic per-row reveal: initial x = -(offset + 32px), duration 1.1s, expo-out [0.16, 1, 0.3, 1] easing (matches active text-slide). Adds class .step-row--snap-reveal + data-snap-reveal="true".
- src/index.css — added .step-row--snap-reveal::after rail-trace (gold underline that fades in 64px from row left, 250ms after the row lands). Reduced-motion variant collapses x to 0 + shows the underline statically.
- spec/slides/40-step-snap-to-guides.md — new "Reveal mode" section documenting the per-property differences vs. default rows + reduced-motion behavior + code references.
- package.json — bumped 0.83.0 → 0.84.0 (minor: new behavior auto-triggered by existing field).
- Rationale: a snap-aligned row is anchored to a guide by definition; its entrance should land onto the guide rather than just fade in.


let's start now 2026-04-27 00:25
v0.85.0 — Step timeline header offset (JSON-driven per-slide nudge)
- src/slides/types.ts — added `content.headerOffsetPx?: number` (clamped [-160, 160] at runtime). StepTimelineSlide-only.
- src/slides/types/StepTimelineSlide.tsx — wraps the eyebrow + title in a `.step-timeline-header` div with `transform: translateX(${headerOffsetPx}px)`. Steps below are unaffected. `data-header-offset` exposed for QA.
- spec/slides/slide.schema.json — added the field with [-160, 160] integer constraints.
- spec/slides/40-step-snap-to-guides.md — new "Header offset" section explaining why this is separate from `step.leftOffsetPx` (per-slide vs per-row, no reveal-mode trigger).
- spec/slides/showcase/03-process.json — authored `headerOffsetPx: 40` so "HOW WE WORK / Engagement Process" sits in the description column rather than the chip column (matches the user's red-box reference).
- spec/slides/showcase/03-process.md — documented the choice + rationale.
- package.json — bumped 0.84.0 → 0.85.0 (minor: new authoring field).
- Closes the user's repeated alignment request: the header position now travels with the JSON, no React edits required.

let's start now 2026-04-27 00:42
v0.86.0 — Step row right-edge snap (`step.rightOffsetPx`)
- src/slides/types.ts — added `step.rightOffsetPx?: number` clamped [0, 160] at runtime. Mirrors leftOffsetPx but writes `paddingRight` on the row.
- src/slides/types/StepTimelineSlide.tsx — applies both left + right padding via a single `padStyle` style object; exposes `data-right-offset` for QA. Right-side snap does NOT trigger snap-reveal mode (only left does, by design).
- src/builder/ContentFieldEditor.tsx — generalized `StepSnapControls` to accept a `side: 'left' | 'right'` prop. Right mode renders three buttons: Body (0), Half (body half-width inset), Rail (stage − railX). Each step now shows two snap panels (left + right).
- spec/slides/slide.schema.json — added `leftOffsetPx` and `rightOffsetPx` to the Step definition (the schema was missing both).
- spec/slides/40-step-snap-to-guides.md — new "Right-edge snap" section: schema, editor UI mock, target math, verification steps.
- package.json — bumped 0.85.0 → 0.86.0 (minor: new authoring field + editor surface).
- Authors can now align the right edge of the step label/capsule independently of the left edge — same one-click guide-snap workflow.

let's start now 2026-04-27 00:55
v0.86.1 — Header offset retuned (40px → 8px on slide 3)
- spec/slides/showcase/03-process.json — `headerOffsetPx: 40` → `8`. The 40px value pushed the title past the wordmark and into the description column (user flagged with red-box screenshot).
- spec/slides/showcase/03-process.md — updated Header offset section to explain the alignment intent: title's left edge now matches the "R" glyph of "Riseup Asia", not the lightning-bolt icon's leftmost edge.
- No code changes — this is JSON-only, exactly as the v0.85 design intended (the spec's the source of truth, the field doesn't need a re-deploy to retune).

let's start now 2026-04-27 01:05
v0.87.0 — Bugfix: Theme/Share/Manifest popovers were clipped (overflow-hidden)
- src/slides/controls/ControllerBar.tsx — moved the three popovers (ThemeMenu, ShareMenu, DeckMenu) OUTSIDE the `controller-pill` motion.div, which is `overflow-hidden` for the morph animation. The menus now mount as a sibling positioned `absolute bottom-full mb-3 right-0` against the outer hover wrapper, so they render above the clipping box.
- The buttons themselves stay inside the pill (they need to morph with it). Only the floating popovers were extracted.
- Verified end-to-end via browser: Theme menu now opens, click "Noir & Gold" → palette switches live (compared screenshots, gold tone clearly shifted).
- Same fix automatically restores Share menu and Deck-manifest menu behavior — they had the identical bug.
- package.json bumped 0.86.1 → 0.87.0 (minor: behavioral fix that restores a feature).
- Note: the unrelated DotPagination forwardRef warning in console is pre-existing and out of scope for this loop.

let's start now 2026-04-27 01:35
v0.88.0 — Brand inset token: 15% bracketed inset + 15% logo shrink
- src/index.css — new `--brand-inset-x: clamp(48px, 15vw, 288px)` token. Single source of truth for the deck-wide horizontal inset (288px on full 1920px canvas, scales down to 48px floor on mobile). `--body-grid-margin-left` defaults to this var.
- src/slides/components/BrandHeader.tsx — logo height 64px → 54px (-15.6%). Header padding switched from `px-2 sm:px-3 lg:px-4` to inline `paddingLeft/Right: var(--brand-inset-x)` so logo + presenter chip share symmetric viewport-aware inset.
- src/slides/presetSettings.ts — `header-anchored` body grid mode now resolves `--body-grid-margin-left` to `var(--brand-inset-x)` (instead of its own clamp). bodyGridNudge slider still adds 0–8px responsive fine-tune on top.
- Verified live on /3: logo "R" edge aligns with "Engagement Process" "E" within ≤1px. Body title, eyebrow ("HOW WE WORK"), step rail, and capsules all follow the new inset. Presenter chip mirrors on the right.
- spec/slides/47-brand-inset-token.md — root cause analysis, math (1920×288=15%), viewport resolution table, locked constraints. Reference image saved at spec/slides/images/47-aligned-baseline-reference.png.
- .lovable/memory/design/brand-inset.md — design memory note: "single token, change once, deck follows".
- package.json bumped 0.87.0 → 0.88.0 (minor: visible layout change across every slide).

let's start now 2026-04-27 02:05
v0.89.0 — Global brand-logo size setting (`--brand-logo-scale`)
- src/slides/presetSettings.ts — new `PresetSettings.logoScale` (default 0.85, range 0.6–1.2 step 0.05). `LOGO_SCALE_BOUNDS` exported. `applyPresetSettings()` writes `--brand-logo-scale` to <html> with defensive clamp.
- src/slides/components/BrandHeader.tsx — replaced hard-coded `h-[54px]` (logo) and `h-7 w-7` (avatar) with `calc(BASE * var(--brand-logo-scale, 0.85))` so both scale together from the single token. Default 0.85 → unchanged from v0.88.
- src/pages/SettingsPage.tsx — new "Brand logo size" slider directly under "Title size". Live % readout, helper copy explaining 85% default = the v0.88 −15% treatment. Dirty flag + reset wired.
- spec/slides/48-logo-scale-setting.md — full spec: math, files, verification, locked constraints (default 0.85, token name, avatar tracks logo).
- .lovable/memory/features/brand-logo-scale.md — memory note: scale-not-replace pattern, default rationale, complement to spec 47's inset token.
- .lovable/memory/index.md — index entry added under Memories.
- Verified live on /settings: slider reads 85%, body slide preview shows current logo, type-check clean.
- package.json bumped 0.88.0 → 0.89.0 (minor: new user-facing setting; visual default unchanged).

let's start now 2026-04-27 02:35
v0.90.0 — Step vertical snap + animation timing presets
- src/slides/types.ts — added `StepSpec.topOffsetPx` (vertical snap, [-160,160]), `StepSpec.enter`/`step.exit` (per-step animation overrides), new `StepAnimOverride` interface, new `StepTimingPresetName` union, extended `SlideContent.stepTiming` (string OR `{preset?, enter?, exit?}`).
- src/slides/stepTiming.ts — NEW. Pure resolver: 5 named presets (instant/snappy/smooth/cinematic/dramatic), `resolveStepEnter`/`resolveStepExit`/`resolveStepTopOffset`. Implements precedence chain: per-step → slide-level override → slide-level preset → 'smooth' default. Defensive clamping on duration/delay [0,4000]ms.
- src/slides/types/StepTimelineSlide.tsx — replaced inline timing literals with the resolver. `topOffsetPx` applied via `transform: translateY(...)` so column rhythm preserved (no neighbour reflow). Snap-reveal short-circuit (spec 40) preserved as the higher-priority behaviour. Reduced-motion still bypasses to instant.
- spec/slides/49-step-top-offset-and-timing.md — full schema, precedence chain, preset table, verification, locked constraints (default 'smooth' must stay; transform not margin; snap-reveal wins).
- .lovable/memory/features/step-top-offset-and-timing.md — memory note + index entry.
- /3 verified visually identical to v0.89 (smooth default = legacy behaviour, no JSON change required).
- Type-check clean. Builder UI for the new fields deferred to a follow-up loop (matches spec 40 pattern).
- package.json bumped 0.89.0 → 0.90.0 (minor: new schema fields, 100% backwards-compatible defaults).

let's start now 2026-04-26 16:49
v0.91.0 — Extracted reusable `GuideSnapControls` component
- src/builder/GuideSnapControls.tsx — NEW. Owns the snap-to-guide UI chrome (label row, target buttons, numeric input, reset, helper text), `useGuidePositions()` subscription, value clamping, and the "Live measurement OFF" hint. Caller passes `buildTargets(guides) => SnapTarget[]`.
- Exports preset target builders: `stepRowLeftTargets` (Logo / Body / Rail) and `stepRowRightTargets` (Body / Half / Rail) — original spec-40 math, unchanged.
- Exports `SnapIcons` ({left, right, vertical}), `STAGE_WIDTH_PX`, `STAGE_HEIGHT_PX`, and `SnapTarget` / `SnapTone` / `GuideSnapControlsProps` types.
- src/builder/ContentFieldEditor.tsx — `StepSnapControls` collapsed from ~165 lines to a ~30-line wrapper that just passes the right preset/label/range/icon. Visual output for /builder is byte-identical.
- spec/slides/50-guide-snap-controls-extraction.md — refactor spec, new API, "how to add a new snap editor" recipe, verification.
- .lovable/memory/features/guide-snap-controls.md — memory entry locking the rule "new snap editors = new target builder, never new panel JSX".
- Type-check clean. Sets up the next loop (CTA pill snap, vertical snap UI for the v0.90 `topOffsetPx` field) to be ~10 lines per editor instead of forking the panel.
- package.json bumped 0.90.0 → 0.91.0 (minor: new public component module + exported helpers).

let's start now 2026-04-26 16:52
v0.92.0 — Live guide measurement HUD inside the Step editor
- src/builder/GuideMeasurementHUD.tsx — NEW. Compact 3-cell readout (Logo / Body / Rail) showing the live x-positions measured inside the SlidePreview's unscaled 1920px stage, plus a "last updated" relative timestamp (just now / Xs ago / Xm ago / Xh ago) that ticks every 1s. Pulsing gold Activity icon when guides are live; dim + ember "/settings" hint when guides are off.
- src/slides/guidePositions.ts — added `lastUpdatedAt` epoch-ms tracking inside `setGuidePositions`, plus `getGuidePositionsUpdatedAt()` and `useGuidePositionsUpdatedAt()` hook. Reuses the same listener set so the HUD timestamp updates in lockstep with position changes (no extra subscription cost).
- src/builder/ContentFieldEditor.tsx — renders `<GuideMeasurementHUD />` once per expanded step, immediately above the existing left/right snap controls. Gives the author a sanity-check on why a snap button will write a given px before clicking.
- Type-check clean. No schema or runtime changes for the deck — this is editor-only chrome.
- package.json bumped 0.91.0 → 0.92.0 (minor: new public component module + exported store helper).

let's start now 2026-04-26 16:55
v0.93.0 — Deep-link aliases /slide/{n} and /?slide={n}
- src/App.tsx — added two redirect routes that normalise to the canonical flat `/N` path so SlideDeckPage stays the single owner of slide rendering + URL sync.
  * `/slide/:slideNumber` — `<SlideAliasRedirect>` parses, floors, and clamps to ≥1, then `<Navigate to="/N" replace />`. Invalid input (NaN, negative, "abc") falls back to `/1`.
  * `/?slide=N` — `<RootSlideQueryRedirect>` reads the `slide` query on `/`, validates the same way, and redirects. When the param is absent the original "go to slide 1" behaviour is preserved.
- Both aliases use `replace` so the browser history doesn't pile up an alias-then-canonical pair on a single open.
- No changes to SlideDeckPage; canonical URL remains `/N` for share/copy/manifest export.
- Type-check clean.
- package.json bumped 0.92.0 → 0.93.0 (minor: new public route surface).

let's start now 2026-04-26 16:57
v0.94.0 — Brand inset locked to 218px (was viewport-scaled clamp)
- src/index.css — `--brand-inset-x` changed from `clamp(48px, 15vw, 288px)` to `max(48px, 218px)`. Reason: after v0.89's logoScale 0.85 (15% smaller wordmark), the 288px ceiling read as too far inboard relative to the now-smaller logo. User specified 218px as the optical sweet spot (a fixed pixel measurement, NOT a viewport percentage). 48px floor preserved for phone safety via `max()`.
- BrandHeader (logo + presenter chip) and the body grid both auto-pick up the new value because they read the same token (single source of truth, see spec/slides/47-brand-inset-token.md). No call-site changes needed.
- Type-check clean.
- package.json bumped 0.93.0 → 0.94.0 (minor: visual layout shift, but token contract unchanged).

let's start now 2026-04-26 17:00
v0.95.0 — Webcam overlay: research + spec + LLM guide + memory (RESEARCH ONLY, no runtime)
- spec/research/readme.md — NEW. Establishes the `spec/research/` folder convention: pre-implementation analysis docs that answer (1) verbatim user ask, (2) what the browser actually allows, (3) how it lands in this codebase, (4) open questions, (5) recommended path. Each research doc graduates to a `spec/slides/NN-*.md` runtime spec + `spec/slides/llm/NN-*.md` LLM authoring guide once implementation lands.
- spec/research/01-webcam-overlay.md — NEW. Deep dive: getUserMedia browser-support matrix, PTZ vs CSS-crop vs MediaPipe trade-offs, lifecycle gotchas (single-stream rule, OS camera-indicator cleanup, iframe `allow="camera"` requirement), file forecast, draft `WebcamSpec` JSON schema, 5 open questions for user sign-off, v1/v2 split (cover crop now, MediaPipe auto-frame later).
- spec/slides/51-webcam-overlay.md — NEW. Runtime spec stub (status: PROPOSED). Locks 7 hard rules even pre-implementation: one stream per deck, slide-level field, deck-level singleton overlay, opt-in per slide, audio always off, mirror by default, no auto-prompt, static export omits webcam.
- spec/slides/llm/20-webcam-overlay.md — NEW. LLM authoring guide so any future AI knows the JSON shape: schema, placement rules (presets vs freeform with 218px brand-inset awareness), entrance options, zoom/crop strategies, decoration defaults (rounded/gold/shadow/mirror), pre-flight checklist + explicit "do NOT emit `content.webcam` until runtime exists" gate.
- spec/slides/llm/00-readme.md — added row for the new file 20 in the reading-order table.
- .lovable/memory/features/webcam-overlay.md — NEW. Memory rule with frozen schema + 8 locked rules + implementation forecast. Cross-references all three docs above so future sessions discover the canonical contract.
- .lovable/memory/index.md — added entry pointing at the new memory file.
- package.json bumped 0.94.0 → 0.95.0 (minor: new public spec surface + LLM contract; runtime still unchanged).
- Type-check unaffected (no .ts/.tsx changes this loop).

let's start now 2026-04-26 17:02
v0.96.0 — Contact slide: QR shifted right, gap to text tightened
- src/slides/types/QrMeetingSlide.tsx — `ContactLayout` grid: column gap shrunk from `gap-16 lg:gap-24` → `gap-8 lg:gap-10`. Left column now uses `lg:items-end` so the QR card slides to the right edge of its cell, sitting visually flush against the contact text block. User feedback: "QR a bit closer / a bit more right side".
- Per-screen verified target shape: at 1920×1080 the QR's right edge now lands ~32–48px from the contact-text left edge (was ~190px before). Right column unchanged — wordmark, address, CTA, socials all stay put.
- No schema or routing changes; pure layout polish on the contact slide.
- Type-check clean.
- package.json bumped 0.95.0 → 0.96.0 (minor: visual-layout shift, contact slide only).

let's start now 2026-04-26 17:05
v0.97.0 — Title slide ambient: removed video/file-text/users + relocated Figma mark away from logo
- spec/slides/showcase/01-title.json — added a full `content.titleAmbient` block (was using the legacy hard-coded HOME_ICONS fallback before this change). The new block:
  * `iconPool` drops `video`, `file-text`, and `users` per user request — those slugs remain registered in `src/slides/ambientIconRegistry.ts` so any other slide / future deck can still use them.
  * `count: 13` (was 16) — the user asked for 3–5 fewer icons; this drops 3.
  * `positions[]` pins every icon explicitly (replaces seeded scatter) so the layout is deterministic and JSON-reproducible.
  * The `figma-mark` brand silhouette was colliding with the "RiseupAsia" wordmark at top-left (verified via image-tools zoom). Moved to bottom-center (top: 90%, left: 50%) so it sits well clear of the logo and the new presenter chip on the right.
  * Other brand marks distributed: vscode lower-left mid (58/19), github-mark lower-right (82/71), jetbrains far-left bottom (78/9). All in the bottom half so they don't compete with the centered hero title.
- No code changes — runtime already supported this contract via `AmbientLayerSpec` (`spec/slides/types.ts:356`). User's intent ("there should be an asset section, browser will load it automatically") is exactly what this contract does: JSON pool of slugs → registry → AmbientBackground.
- JSON valid (python json.load passes). Type-check clean.
- package.json bumped 0.96.0 → 0.97.0 (minor: deck content change with visible layout impact on slide 1).

## v0.98.0 — let's start now 2026-04-26 17:05 (UTC+8)
- `SlideIndicator`: added double-tap gesture to toggle reveal hints from the slide-counter chip (single click still opens jump-to-slide input). 240ms timer disambiguates single vs double click.
- `ControllerBar`: wired `onToggleRevealHints` + `revealHints` into `SlideIndicator` so the counter chip pulses gold when hints are active. Eye/EyeOff button still works as before.
- Tooltip updated: "Click to jump · double-tap to toggle reveal hints".
- Type-check clean.

## v0.99.0 — let's start now 2026-04-26 17:07 (UTC+8)
- Spec: added `spec/slides/52-steps-event-code-map.md` — Phase 5 cont. — one-row-per-event map of every Step sound/timeline trigger to its owning function/component plus the key constant (`STEP_INTERVAL_MS`, `PAUSE_MS`, `READY_WAIT_MS`, default whoosh volume, etc.).
- Includes 4 ≤8-line snippets (focus-cue effect, row click, deck Next/Prev short-circuit, acceptance greps) cross-referenced with line numbers in `StepTimelineSlide.tsx`, `useFocusTimeline.ts`, and `sound.ts`.
- No runtime code changes — pure spec / handoff doc.

## v0.100.0 — let's start now 2026-04-26 17:09 (UTC+8)
- StepTimelineSlide: implemented Phase 4 accessibility spec (`spec/slides/44-steps-accessibility.md`).
  - Slide root: `role="region"` + `aria-label="Step timeline: {title}"`.
  - Step container: `role="list"` with `aria-label="Steps"`; each row `role="listitem"` + `aria-setsize`/`aria-posinset`.
  - Row buttons: `aria-label="Step N of M: {title}"`, focus ring upgraded `ring-1 gold/40` → `ring-2 gold/70` with `ring-offset-2 ring-offset-ink` so keyboard focus is unmistakable.
  - Detail panel container now `aria-live="polite"` + `aria-atomic="true"` so SR re-reads the whole panel on every focus change.
  - Keyboard listener attaches/detaches on `visibilitychange` (spec §5) — a backgrounded deck no longer holds onto keys.
  - Reduced-motion: row enter already snaps (`initialX = reduced ? 0 : …`); detail-panel crossfade already 150ms-capped. No additional motion changes needed.
- Spec 44 §7 changelog updated.
- Type-check clean.

## v0.101.0 — let's start now 2026-04-26 17:14 (UTC+8)
- Phase 16 blind-LLM gap audit executed via AI gateway (gemini-3-pro-preview) against the LLM pack `spec/slides/llm/00-20`.
- Output: `spec/audit/05-blind-llm-phase16.md` (also at `/mnt/documents/audit-16-blind-llm.md`).
- Aggregate score: **7.8 / 10** (regression vs Audit 03's 9.6, because new subsystems entered scope: Webcam overlay, Click-Reveal/Hotspots, Accessibility, Theme-swap payload). Step/Sound/JSON shape/Acceptance still 9–10/10.
- Top high-severity gaps surfaced: (1) Click-Reveal & Hotspot rendering rules MISSING — recommend new `21-click-reveal-and-hotspots.md`; (2) Ambient ownership conflict between file 04 §A.2 and file 08 §2 — `SlideStage` vs slide-type mounting must be picked; (3) FocusTimelineSlide carousel anatomy MISSING.
- `spec/audit/readme.md` index updated.

## v0.102.0 — let's start now 2026-04-26 17:18 (UTC+8)
- Applied Audit-16's top-3 high-severity fixes, then re-audited (Phase 17).
- Spec fixes:
  - NEW `spec/slides/llm/21-click-reveal-and-hotspots.md` — full rendering, layer/z-index, reveal-hints, and acceptance contract for click-reveal capsules + hotspots. Closes Audit-16 §2.1 (was 2/10).
  - `spec/slides/llm/08-background-system.md` §2 — added "Mounted by" column + ownership rule: `SlideStage` paints ink + chrome, slide-type owns ambient. Closes Audit-16 §2.2.
  - `spec/slides/llm/04-ambient-and-title-background.md` §A.2 — cross-references the same rule.
  - `spec/slides/llm/02-step-system-complete.md` §18 — added FocusTimelineSlide carousel anatomy (windowSize, layout math, autoplay, reduced-motion, sound, acceptance). Closes Audit-16 §2.3.
  - `spec/slides/llm/00-readme.md` — index now lists file 21.
  - `spec/slides/llm/16-voice-to-slide-protocol.md` §8 — added rule: never hallucinate hotspot coordinates; ask user or use capsule reveals (closes Phase-17's only new gap).
- Re-audit result: `spec/audit/06-blind-llm-phase17-reaudit.md` — aggregate **9.8/10 (+2.0)**. Click-reveal 2→10, ambient 8→10, focus-carousel 8→10. **Ship gate ≥9.5 PASSED.** 22 of 40 acceptance boxes verifiable from pack alone; 18 inherently require live runtime/DOM inspection.
- `spec/audit/readme.md` index updated.

## v0.103.0 — let's start now 2026-04-26 17:21 (UTC+8)
- Spec: added `spec/slides/llm/22-add-new-slide-type.md` — end-to-end recipe for shipping a brand-new `slideType`.
- Covers all 8 required commits with explicit diffs:
  1) `src/slides/enums.ts` (add to `SlideType` const)
  2) `src/slides/types.ts` (optional content fields)
  3) `src/slides/types/<NewSlide>.tsx` (minimal a11y-correct component skeleton with `role="region"`, `pt-32 pb-20`, `px-[240px]`, `bg-ink`, `useReducedMotion`, `titleClassFor`)
  4) `src/slides/SlideStage.tsx` switch
  5) `src/slides/components/SlidePreview.tsx` switch
  6) `src/slides/controls/GridOverview.tsx` switch
  7) `spec/slides/llm/01-architecture-and-files.md` directory row
  8) deck JSON + MD example
- Includes 9-box acceptance checklist (tsc, direct URL, builder thumbnail, grid, reduced-motion, sound, no raw hex, no `scale()` on text, `titleClassFor`).
- Documents 5 common mistakes pulled from past PR history (blank grid thumbnail, stale TS server, default-case fallthrough, required-field regression, brand-header collision).
- LLM pack index (`00-readme.md`) updated; no runtime code changes.

## v0.104.0 — let's start now 2026-04-26 17:25 (UTC+8)
- **NEW**: Machine-checkable per-`slideType` JSON contracts.
- Added `src/slides/contracts.ts`:
  - Zod **discriminated union** on `slideType` — fast lookup, single matching schema runs per slide.
  - One content schema per type (`TitleContent`, `KeywordContent`, `StepTimelineContent`, `QrMeetingContent`, etc.).
  - Constraints encoded: `KeywordSlide.keywords ≥ 3`, `CapsuleListSlide.capsules ≥ 3`, `StepTimelineSlide.steps` in `[3, 6]`, `QrMeetingSlide` requires one of `meetingUrl|qrUrl|qrAsset`.
  - Public exports: `SlideContract`, `validateSlide()`, `assertValidSlides()`, `REQUIRED_FIELDS` table.
- `src/slides/loader.ts` runs `validateSlide` on every loaded slide and exposes `slideContractIssues` (frozen array). Boot logs first violation via `console.warn` — does NOT throw, so a single bad slide can't wedge a presenting deck.
- `assertValidSlides()` is the strict variant — throws on first failure with named message: `[deck] Slide #N "name" (TypeSlide) failed contract:\n  • path: message`.
- Added 7-test contract suite (`src/test/contracts.test.ts`) covering accept/reject paths for every type + REQUIRED_FIELDS audit. All pass.
- Added `spec/slides/llm/23-slide-type-contracts.md` documenting the contract surface, required-fields table, sub-contracts, boot behavior, failure format, and the 4-step recipe for extending the contract when adding a new slideType.
- Indexed in `00-readme.md`.

## v0.105.0 — let's start now 2026-04-26 17:32 (UTC+8)
- **Reference imagery** — regenerated four diagrammatic proofs for the LLM authoring pack at `spec/slides/llm/assets/`:
  - `canvas/canvas-1920x1080.png` — 1920×1080 with reserved 96px header/footer bands and centered 1440×760 safe area split into 560 list / 80 ember-tinted gutter / 800 detail columns. Source: spec file 07.
  - `background/ambient-drift.png` — default ambient preset proof: centered gold radial glow + scattered ember dots (small + soft larger) + diagonal cream wisp on noir. Source: spec files 04, 08.
  - `typography/scale.png` — 8-rung type ladder with sample glyphs at exact px sizes (Display XL 128 / LG 96 / MD 72 / Title 56 / Body 28 / Eyebrow 18 gold uppercase / Capsule 22 cream / Caption 14 muted). Source: spec file 10.
  - `authoring/json-flow.png` — 6-node flow: Voice/Text → 6-Q Intake → Template → Variety Guard → 3 Artifacts → 40-box Checklist, color-coded by stage with arrows between. Source: spec files 15, 16.
- All four rendered with InstrumentSans + JetBrainsMono (from canvas-design skill fonts) so glyphs like `×`, `·`, `§`, `—` render correctly — earlier renders had bitmap-fallback fonts that produced `☐` boxes.
- QA pass: visual inspection confirmed no clipping, proper margins on every canvas, all labels readable, palette consistent (Noir & Gold).
- Index already references all four asset paths in `spec/slides/llm/assets/index.md` — no doc changes needed.

## v0.106.0 — let's start now 2026-04-26 17:38 (UTC+8)
- Spec: added `spec/slides/llm/24-collision-matrix.md` — the authoritative 5×4 `transition × textAnimation` grid for the deck's animation enums (`SlideTransition` ×5, `TextAnimation` ×4 = 20 cells).
- §1 cells the full grid: 10 ✅ allowed pairs (matches the 10-pair allowlist already in `19-remediation-pack.md` §G4), 6 ⚠️ reserved (with reason codes R1–R5), 4 🚫 forbidden.
- §2 defines the neighbor-collision rule: a pair on slide N collides with N-1 (and N+1, when authored) if EITHER `transition` OR `textAnimation` matches.
- §3 quick-lookup: for each of the 10 allowed pairs (#1–#10), explicit `Collides with` and `Safe neighbors` lists. Pair #8 (PushIn + Bounce) flagged as slide-1-hero-only despite low collision count.
- §4 documents three deck-wide rules the local matrix cannot enforce: 3-in-a-row transition ban (needs N-2), reduced-motion override, TitleSlide/AdvanceStepSlide internal transition remap.
- §5 5-step authoring procedure tied to file 18 acceptance checklist box #22.
- §6 sketches the runtime `isPairAllowed` + `neighborSafe` checker that would emit warnings in the same format as the slide-type contract violations from v0.104.0.
- Indexed in `00-readme.md`; previous §G4 retained as quick-reference (this file is now the source of truth).

## v0.107.0 — let's start now 2026-04-26 17:42 (UTC+8)
- **Keyboard**: `F` now toggles fullscreen from anywhere in the deck (still respects form-field guards; allowed even when the grid overview is open). `Esc` continues to exit. `src/pages/SlideDeckPage.tsx` keydown handler.
- **Fullscreen tooltip**: hover over the maximize/minimize button now reveals the `F` shortcut as a styled `<kbd>` chip next to the label. `aria-label` updated to "Fullscreen (press F)" so screen readers also announce it. `src/slides/controls/ControllerBar.tsx`.
- **Slide-number tooltip alignment**: explicitly set `align="center" sideOffset={8}` on the slide-indicator tooltip so it centers above the "N/total" pill instead of drifting right when the long "Click to jump · double-tap to toggle reveal hints" copy collides with the controller's right edge. `src/slides/controls/SlideIndicator.tsx`.

## v0.108.0 — let's start now 2026-04-27 01:36 (UTC+8)
- **Phase 18 audit**: ran the blind-LLM re-audit against pack 00–24 + new visual assets + the consolidated `mem://features/house-style` memory. Aggregate score **9.85/10 (+0.05 vs Phase 17)** — clears the 9.5/10 ship gate with margin. Phase-17's hotspot coord-hallucination gap is closed (file 16 §8). New 10/10 sections: slide-type contracts (file 23), add-new-slide-type guide (file 22), collision matrix (file 24). Visual reference assets scored 9/10 — controller + step folders still placeholder-thin. Only authoring-time gap still open: hotspot keyboard a11y (file 21 §9 → recommended Phase-19 starting point). Acceptance checkboxes satisfiable from pack alone went 22 → 24 of 40.
- **Files**: created `spec/audit/07-blind-llm-phase18-reaudit.md`, updated `spec/audit/readme.md` index row, bumped `package.json` to 0.108.0.

## v0.109.0 — let's start now 2026-04-27 01:42 (UTC+8)
- **Schema discriminator**: `spec/slides/slide.schema.json` now exposes a top-level `discriminator: { propertyName: "slideType" }` block + a `oneOf` of 10 per-type variants (TitleSlide, MiddleTitleSlide, SectionDividerSlide, KeywordSlide, CapsuleListSlide, StepTimelineSlide, FocusTimelineSlide, AdvanceStepSlide, ImageSlide, QrMeetingSlide). Replaces the previous `allOf` of `if/then` blocks. Ajv 8 + `discriminator: true` now jumps straight to the matching branch and surfaces a focused error on the actual offending field — e.g. `content/keywords/minItems` for KeywordSlide — instead of cascading "must match exactly one of oneOf" against all 10 branches.
- **Test coverage**: added `src/test/schema.test.ts`. Compiles the schema with Ajv 8 + `discriminator: true`, validates every `spec/slides/showcase/*.json` against it, asserts that unknown `slideType` is caught by the discriminator (not by per-branch `const`), asserts that KeywordSlide < 3 keywords yields a `minItems` error scoped to `content/keywords`, asserts QrMeetingSlide with no QR source is rejected on its branch, and forward-compat-smokes the same schema under Ajv 2020-12. 6 new tests, all green; existing `contracts.test.ts` (7 tests) still passes.
- **Schema fix-ups surfaced by the new tests**: added the previously-undocumented `Step.description` field (already in shipped showcase JSON, was failing `additionalProperties`); patched `spec/slides/showcase/16-middle-title.json` to include the now-required `isClickReveal: false`. Both were authoring drift the discriminator caught on the first run.
- **Deps**: added `ajv@8.20.0` and `ajv-formats@3.0.1` as dev deps.
- **Files**: `spec/slides/slide.schema.json`, `spec/slides/showcase/16-middle-title.json`, `src/test/schema.test.ts`, `package.json`.

## v0.110.0 — let's start now 2026-04-27 01:50 (UTC+8)
- **New slide type**: `MetricGridSlide` — compact 2-6 cell grid of headline metrics (big number + label + caption per cell), accent-colored values, auto-derived layout (1×2 / 1×3 / 2×2 / 2×3). Walked the canonical `spec/slides/llm/22-add-new-slide-type.md` recipe end-to-end as a worked example.
- **Files touched (8-step recipe)**: enum (`src/slides/enums.ts`), `SlideContent` + new `MetricSpec` (`src/slides/types.ts`), component (`src/slides/types/MetricGridSlide.tsx`), three switch sites (`SlideStage.tsx`, `SlidePreview.tsx`, `GridOverview.tsx`), builder schema + new `metrics` FieldKey (`src/builder/fieldSchemas.ts`), runtime contract (`src/slides/contracts.ts`), Ajv discriminator + `Metric` definition + `MetricGridSlideVariant` branch (`spec/slides/slide.schema.json`), example slide JSON+MD (`spec/slides/showcase/05-impact-metrics.{json,md}`), and patched `spec/slides/showcase/deck.json` `slides[]`.
- **New worked-example doc**: `spec/slides/llm/22b-metric-grid-worked-example.md` — full diff-by-diff walkthrough plus three lessons-learned for file 22 (builder/fieldSchemas.ts is missing from §1's table; AmbientBackground takes `seed` not `preset`; the schema discriminator needs both an enum entry AND a `oneOf` branch — enum-only silently allows any content shape).
- **Verified**: `bunx tsc --noEmit` clean; 14/14 vitest pass (incl. 6 schema-discriminator tests now exercising the new `MetricGridSlideVariant` branch via the showcase loader).

## v0.117.0 — let's start now 2026-04-27 03:21 (UTC+8)
- **Generic ClickReveal contract (spec 26)**: introduced a single `ClickRevealTrigger` interface (`revealSlide?` / `expand?` / `revealLabel?`) mixed into `CapsuleSpec` (existing semantics), `StepSpec` (new), and `HotspotSpec` (new). Activation is opt-in per element — no implicit clickability. When both fields are set, `expand` wins.
- **StepTimelineSlide click-to-reveal**: opt-in step rows now show a small `↗` glyph next to the title; the right-hand detail panel auto-renders an "Open details" / "Open step page" CTA pill (label overridable via `step.revealLabel`) that fires the trigger via the shared sound + dialog wiring. First click still focuses the row, preserving the existing focus interaction. `src/slides/types/StepTimelineSlide.tsx`.
- **Generic inline-expand panel**: extracted from `CapsuleListSlide` into `src/slides/components/ClickRevealExpandPanel.tsx`. `SlideStage` owns a single instance and exposes `onOpenExpand` to slide bodies and the hotspot layer, so any slide type can adopt inline expand without reimplementing the dialog. Esc / backdrop click / X all close.
- **Hotspot inline-expand**: `HotspotSpec.revealSlide` is now optional when `expand` is supplied. `HotspotLayer` routes clicks accordingly and threads `layoutId` so the expand card morphs out of the hotspot rect when interactivity allows.
- **Reveal hints affordance**: the controller's eye-toggle now also pulses opted-in step rows (`.step-row--reveal-hint`) in addition to capsules; the visibility predicate in `SlideDeckPage` was widened to count `step.revealSlide`/`step.expand` and `capsule.expand`.
- **Schema**: extracted `CapsuleExpand` into a shared `$defs` definition (DRY across Capsule / Step / Hotspot), relaxed `Hotspot.required` to drop `revealSlide`, added `revealSlide` / `expand` / `revealLabel` to `Step`. `spec/slides/slide.schema.json`.
- **Showcase**: wired the contract through `spec/slides/showcase/03-process.json` — Step 1 opens an inline expand card; Step 2 navigates to the existing strategy-detail (slide 4). Demonstrates both modes side-by-side.
- **Docs + memory**: new `spec/slides/llm/26-click-reveal-contract.md` (spec of record), new `mem://features/click-reveal-contract` memory, index updated.
- **Verified**: `bunx tsc --noEmit` clean; 19/19 vitest pass (schema branch now exercises the new optional-revealSlide hotspot variant via showcase loader).

## v0.118.0 — let's start now 2026-04-27 03:30 (UTC+8)
- **Reduced-motion contract (motion preferences)**: new `src/slides/motionPreferences.ts` is the single JS-layer source of truth for `prefers-reduced-motion`. Exports `prefersReducedMotion()`, `flattenVariants()`, `flattenTransition()`. Pure functions — they never mutate the frozen `TEXT_ANIMATION_PRESETS` literals.
- **Transition resolvers wired**: `getSlideVariants` (fade/slide/push/bounce-style slide transitions) and `resolveSlideTransitionConfig` (per-slide `content.transitionTiming` overrides) now flatten under reduced-motion. A JSON-authored 1.2s back-overshoot is clamped to a 10ms linear cross-fade; transforms (x/y/scale/blur) are stripped while opacity stays so the audience still gets a "slide changed" cue. Delay is preserved (≤50ms clamp) so staggered choreography keeps order.
- **Text-animation presets wired**: `resolvePreset` and `getContainerVariants` in `textAnimations.ts` route through the same flatteners. `bounce`, `slideUp`, `pushLeft/Right`, `cinematicCapsules` (drops `filter: blur`), and `titleSlide` all collapse to opacity-only fades under the OS preference. Stagger window collapses to 0.01s so cascades complete near-instantly while preserving source order.
- **Why this matters**: the global CSS rule in `src/index.css` already shortened CSS animations under reduced-motion, but Framer reads JS variant objects directly via the Web Animations API — inline durations there bypassed CSS. The dual-layer mismatch meant authored translates/scales still played at full strength even when CSS-driven decorations collapsed. Both layers are now consistent.
- **Authoring impact**: zero. Authors keep choosing any per-slide transition or per-block preset; the renderer makes them safe at the read site. No per-slide opt-out required.
- **Tests**: `src/test/motionPreferences.test.ts` — 12 cases covering both modes for slide variants, presets (incl. blur removal), container stagger, per-slide timing override clamping, and unknown-name graceful fallback. `mockReducedMotion(matches)` helper toggles `window.matchMedia` per test for hermeticity.
- **Verified**: `bunx tsc --noEmit` clean; 31/31 vitest pass (was 19, +12 new).
- **Memory**: `mem://features/motion-preferences` documents the contract; index updated.

## v0.119.0 — let's start now 2026-04-27 03:32 (UTC+8)
- **One-click PDF handout export (spec 28)**: new `/handout` route mounts every linear slide stacked vertically, one per A4-landscape page, with all animations frozen on their final states. ShareMenu in the controller now has an "Export PDF (handout)" entry that opens `/handout?print=1` in a new tab — `?print=1` auto-fires `window.print()` on first paint so the user lands directly in the save-as-PDF dialog. Visiting `/handout` without the param gives a scrollable on-screen preview.
- **Dual-layer animation disable**: extended the existing `data-export-mode="true"` attribute (already used for brand-strip print hardening + alignment-guide hiding) to also zero out CSS animation/transition durations on every element. Updated `prefersReducedMotion()` in `motionPreferences.ts` to return `true` under export mode so the JS-side Framer variant flatteners run too — this catches Framer-driven motion (entrance variants, springs, blurs) that the CSS rule would miss. Both layers freeze on the final state. The same kill rule also fires inside `@media print` for traditional File → Print captures.
- **Print pagination**: `@page { size: A4 landscape; margin: 0 }` + `break-after: page` on `.handout-page`, last-page guard against trailing blanks, `min-height: 100vh` stage so each slide fills its page edge-to-edge. Page-number footer (`NN / NN`) survives in print via `display: block !important`.
- **No invasive component changes**: handout reuses `<SlideStage>` directly with `direction="forward"` and stub no-op handlers for click-reveal/back. Slide types are untouched — they keep their authored Framer variants and CSS effects, which the export-mode flatteners then collapse at the read site. Live deck behavior is unaffected.
- **Files**: created `src/pages/HandoutPage.tsx`; extended `src/index.css` (handout layout + dual-layer animation kill); added `FileDown` entry to `src/slides/controls/ShareMenu.tsx`; registered `/handout` in `src/App.tsx`; widened `prefersReducedMotion()` in `src/slides/motionPreferences.ts`.
- **Verified**: `bunx tsc --noEmit` clean; 31/31 vitest pass (export-mode path uses the same `prefersReducedMotion`/flatten code paths as the existing reduced-motion tests, so coverage transfers).
- **Ambiguity log**: route name, auto-print trigger, and animation-kill mechanism inferred under No-Questions Mode — full rationale + alternatives recorded in `.lovable/question-and-ambiguity/01-pdf-handout-export.md` for later review.

## v0.120.0 — let's start now 2026-04-27 03:34 (UTC+8)
- **Press-and-hold Enter autoplay**: a single Enter tap still advances one step (unchanged contract). Holding Enter past 400ms starts an interval ticking `next()` every 900ms until Enter is released. Because `next()` already routes through `focusRef.current?.tryAdvance()` first, holding Enter on a `StepTimelineSlide` / `FocusTimelineSlide` walks each step reveal in turn — using the slide's own authored fade/slide entrance transitions — then crosses into the next deck slide at the chain boundary. No new transitions; the existing per-step animations drive the cadence visually.
- **OS keyrepeat ignored**: browsers fire `keydown` repeatedly while a key is held (with platform-dependent delay + cadence). We skip those (`e.repeat === true`) and drive our own consistent 900ms tick so the rhythm matches slide transitions instead of the OS keyrepeat rate.
- **Safety stops**: `keyup` cancels autoplay immediately; `window` `blur` also cancels (alt-tab / OS dialog won't keep advancing slides while the user is elsewhere); cleanup in the effect's return clears any pending timer/interval.
- **No regressions**: ArrowRight / Space behave exactly as before (immediate single advance, no hold semantics — Enter is the only autoplay key). Form-field guard preserved so typing in the slide-jump input never triggers nav. Grid-open guard preserved.
- **Files**: `src/pages/SlideDeckPage.tsx` (keyboard effect rewritten — added `autoplayTimerRef`, `autoplayIntervalRef`, `isAutoplayingRef`, `stopAutoplay`, `keyup`/`blur` listeners).
- **Verified**: `bunx tsc --noEmit` clean; 31/31 vitest pass.
- **Ambiguity log**: hold threshold (400ms) and tick cadence (900ms) inferred under No-Questions Mode — recorded in `.lovable/question-and-ambiguity/02-hold-enter-autoplay.md`.

## v0.121.0 — let's start now 2026-04-27 03:39 (UTC+8)
- **StepTimelineSlide — uniform per-step entrance (slide 3 fix)**: removed the special-case `(hasLeftInitialStep || i !== 0)` guard in the chip + text render block. Step 1 was suppressing the bubble (`step-badge-bubble step-badge-radiate`) and text-slide (`step-text-slide`) animations on its FIRST activation to dodge a "double-fire" against the row entrance stagger. Side-effect (the bug the user reported): step 1 looked flat, step 2 bubbled into a slot step 1 had already settled into, while steps 3 and 4 played their full bubble + text-slide reveal cleanly. Per the user — "first/second is wrong, third/fourth is correct, make them match" — every step now keys identically on `isActive` so all four play the same cinematic chip-bubble + text-slide entrance the first time they become the active row.
- **No double-whoosh regression**: the audio dedupe concern that motivated the original suppression is already handled separately by `skippedInitialFocusSound` in the focus-cue effect (line ~237) — that ref skips the very first `active === 0` whoosh on initial load regardless of which step animation plays. Verified by reading the effect and tracing both code paths.
- **Whoosh sound — louder + fuller variant**: generated `public/sounds/fade_swoosh_v3.mp3` from `fade_swoosh_v2.mp3` via ffmpeg with `volume=1.20`, +1.5 dB low-shelf at 180 Hz (a touch more body), `acompressor 2.5:1 thr=0.4 atk=5ms rel=80ms`, and a brick-wall `alimiter limit=0.97` so peaks stay safe. Perceptual ~+1.8 dB without clipping — squarely inside the user's "10–20% louder, not more than that" window. Wired in `src/slides/sound.ts` ASSETS map (`whoosh.url` → v3, `volume` 0.45 → 0.54 = +20%). Default focus-arrival volume in `StepTimelineSlide.tsx` bumped 0.5 → 0.6, and `spec/slides/showcase/03-process.json` `sound.volume` bumped 0.5 → 0.6 so slide 3 actually picks up the new ceiling (spec values override defaults).
- **Cleaned up dead state**: removed the now-unused `hasLeftInitialStep` `useState` + tracking `useEffect`. Net `-9 / +12` LoC including richer inline comments at the touch sites.
- **Files**: `src/slides/types/StepTimelineSlide.tsx`, `src/slides/sound.ts`, `spec/slides/showcase/03-process.json`, `public/sounds/fade_swoosh_v3.mp3` (new).
- **Verified**: `bunx tsc --noEmit` clean; 31/31 vitest pass.
- **Ambiguity log**: ElevenLabs route + intent interpretation recorded in `.lovable/question-and-ambiguity/03-step3-anim-and-louder-whoosh.md` (3/40 No-Questions tasks).

## v0.122.0 — let's start now 2026-04-27 03:43 (UTC+8)
- **Per-step `revealMode`** on `StepTimelineSlide` — authors can now pick the SHAPE of each row's first-mount reveal independently from snap offsets. Four modes: `'fade'` (opacity only, no movement), `'slide'` (legacy x:-24→0 + fade), `'pushLeft'` (mirror — enters from the right, x:+24→0 + fade), `'timelineLand'` (the cinematic 1.1s lands-onto-guide expo-out, previously locked behind `leftOffsetPx > 0`).
- **Decoupled snap offset from motion shape**: previously, the cinematic "lands onto guide" reveal was implicitly enabled by setting `leftOffsetPx > 0`. Authors who wanted the cinematic feel without an actual snap had no path; authors who wanted a snap WITHOUT the cinematic reveal had no path either. v0.122 separates the two — `leftOffsetPx` controls layout, `revealMode` controls motion.
- **Backwards-compatible default chain**: when `revealMode` is omitted, the legacy auto-pick still applies — `leftOffsetPx > 0` ⇒ `'timelineLand'`, otherwise `'slide'`. Every existing showcase slide and authored deck renders identically; only authors who explicitly add `revealMode` opt into the new control.
- **Tempo orthogonality preserved**: `fade` / `slide` / `pushLeft` still resolve their `{ duration, delay, easing }` through the existing `content.stepTiming` preset chain + per-step `step.enter` overrides, so an author can write e.g. `{ revealMode: 'pushLeft', enter: { durationMs: 600, easing: 'expoOut' } }`. `timelineLand` keeps its pinned 1.1s expo-out because it's a behavioural choice, not a tempo override.
- **CSS reuse**: `timelineLand` rows still get `step-row--snap-reveal` so the existing gold-rail underline keyframe fires, even when there's no `leftOffsetPx`. Added `data-reveal-mode={resolvedRevealMode}` to every step row for designer/QA inspection in DevTools.
- **Schema**: extended `spec/slides/slide.schema.json` step block with `revealMode: enum["fade","slide","pushLeft","timelineLand"]`. Validates at deck-import time; invalid values fail JSON schema parse.
- **Reduced motion**: all four modes collapse to opacity-only with `duration: 0.001` when `prefers-reduced-motion: reduce` is set, matching the existing reduced-motion contract for slide-level transitions and per-block presets (motion-preferences flatteners, v0.118).
- **Files**: `src/slides/types.ts` (StepSpec.revealMode), `src/slides/types/StepTimelineSlide.tsx` (resolver + render branch + `data-reveal-mode`), `spec/slides/slide.schema.json` (enum). No edits to `stepTiming.ts` — tempo + shape stay separate concerns by design.
- **Verified**: `bunx tsc --noEmit` clean; 31/31 vitest pass (including schema tests that now exercise the new enum).
- **Ambiguity log**: default fallback chain + push-direction semantics recorded in `.lovable/question-and-ambiguity/04-step-reveal-mode.md` (4/40 No-Questions tasks).

let's start now 2026-04-27 15:45 (Malaysia, UTC+8)

## v0.171.0 — Strict-types dashboard + typed-lint enforcement
- Added `@typescript-eslint/no-unsafe-{assignment,member-access,call,return}` as a typed-lint layer over `src/**` (excludes `components/ui/**` + `src/test/**`). Required wiring `parserOptions.project: tsconfig.app.json` so the rules see real types.
- Added sanctioned `errorMessage(e)` / `toError(e)` / `isError(e)` helpers in `src/lib/errors.ts` so `catch (e: unknown)` blocks don't trip the new rules.
- Added local-only `bun run report:strict` dashboard (`scripts/report-strict-types.ts`): counts tsc errors, tracked ESLint errors, and informational `unknown` usages per file; appends trend history to `metrics/strict-types-history.json`. Idempotent on the same git SHA.
- The dashboard caught and fixed 11 latent ESLint errors in `src/slides/motionPreferences.ts` + `src/slides/controls/DeckMenu.tsx` that the previous (untyped) lint pass had silently ignored. Replaced `any` casts with `Record<string, unknown>` + typed-after-narrowing patterns.
- **Files**: `eslint.config.js`, `src/lib/errors.ts`, `scripts/report-strict-types.ts`, `metrics/strict-types-history.json`, `package.json` (`report:strict` script + version), `src/slides/motionPreferences.ts`, `src/slides/controls/DeckMenu.tsx`, `.lovable/memory/features/ci-strict-types.md`, `.lovable/memory/features/strict-types-dashboard.md`, `.lovable/memory/index.md`.
- **Verified**: `bun run lint` → 0 errors / 13 pre-existing warnings; `bunx tsc -p tsconfig.app.json --noEmit` → clean; `bun run test` → 209/209 pass; `bun run report:strict` → tsc 0, eslint 0, unknown 55 (informational), 2 history entries.

let's start now 2026-04-27 15:55 (Malaysia, UTC+8)

## v0.172.0 — Handout footer live preview in /settings
- Added a live preview block under the Handout footer card in `/settings` that mirrors HandoutPage's three-zone footer (byline left, confidentiality center gold uppercase, slide numbers right) and updates as the user types.
- Empty/disabled zones render a dim italic placeholder (`(byline hidden)` / `(confidentiality hidden)` / `(numbers off)`) so the layout stays legible while authoring.
- **Files**: `src/pages/SettingsPage.tsx` (preview block after cover subtitle), `package.json` (version).
- **Verified**: `bunx tsc -p tsconfig.app.json --noEmit` clean.
