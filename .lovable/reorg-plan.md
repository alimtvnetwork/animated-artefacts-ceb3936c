# Project Reorganization Plan — "Convention over Configuration"

Goal: any AI (or human) opening a folder instantly knows what lives there and why.
Strategy: keep the already-strong `spec/` + `.lovable/memory/` conventions, and
clean up the **root** and **runtime-data** layers that currently mix concerns,
build artifacts, and duplicates. Nothing that breaks the build moves without a
verified import-path update + test run.

This is a 100-step plan. Steps 1–20 define HOW (the target conventions and rules).
Steps 21–100 are the execution checklist, batched so each batch ends green
(`bun run test` + build). Execute ≤10 steps per turn, verifying after each batch.

---

## PART A — Steps 1–20: The conventions (HOW)

### Core principle
One folder = one concern, named so the name alone explains it. Numbered prefixes
stay (they are referenced from chat/commits/memory). No build artifacts, no
duplicates, no loose files at the repo root.

1. **Root is for config + entry only.** Allowed at root: `package.json`,
   `vite.config.ts`, `tsconfig*.json` (no `.bak`, no `.tsbuildinfo`), tailwind/
   postcss/eslint configs, `index.html`, `components.json`, `.gitignore`,
   `README.md`, and the top-level dirs (`src/`, `spec/`, `front-end/`, `public/`,
   `scripts/`, `.lovable/`). Everything else gets a home.

2. **Single README.** Delete the duplicate `readme.md` (byte-identical to
   `README.md`). Lowercase variant is removed; only `README.md` survives.

3. **No build artifacts in git.** Remove `tsconfig.app.tsbuildinfo`,
   `tsconfig.node.tsbuildinfo`, `tsconfig.app.json.bak` and add patterns to
   `.gitignore` so they never return.

4. **Loose images leave root.** `cam2.png`, `cam3.png`, `cam4.png` move under
   `spec/camera-2026/assets/` (they are camera reference shots), since that pack
   already owns camera reference imagery.

5. **Scripts vs install scripts.** `run.ps1`, `slides-install.ps1`,
   `slides-install.sh` move into `scripts/install/`. `scripts/` keeps the audit/
   check TS scripts. A `scripts/README.md` indexes what each script does.

6. **`metrics/` + `reports/` + `audit/` consolidate** under one
   `quality/` umbrella (`quality/metrics/`, `quality/reports/`, `quality/audit/`)
   so "generated quality evidence" has one obvious home. `spec/audit/` (specs)
   stays in spec; only the root `audit/` (output) moves.

7. **`php/` is not part of the React app.** Verify it is unused at runtime; move
   to `legacy/php/` (or delete if confirmed dead). Document the decision in the
   commit + an ambiguity log entry.

8. **`front-end/` keeps its runtime role but gets a README.** It holds the LIVE
   decks the app loads (`front-end/project/<deck>/data/`), starter templates
   (`front-end/slide-template/`), and `front-end/themes/`. Add
   `front-end/README.md` stating "runtime deck data — edited content here is what
   ships." Do NOT move it (import paths depend on it).

9. **`spec/` numbering stays canonical** — it is already convention-driven and
   referenced everywhere. Only fix gaps: ensure every numbered spec folder has a
   `README.md` one-liner at its top.

10. **`updates/spec/NN-*.md` stays** as the per-change delta log; add
    `updates/README.md` explaining the "what/why/files/verify" delta format.

11. **`src/` layout is good — document it, don't move it.** Add `src/README.md`
    mapping each subfolder: `slides/` (renderer engine), `builder/` (deck builder
    UI), `pages/` (routes), `components/` (shared UI), `hooks/`, `lib/`, `types/`,
    `assets/`, `test/`, `releases/`.

12. **Assets have exactly two homes.** `src/assets/` = imported by code (bundled);
    `public/` = served as-is at runtime. The root `assets/` dir (camera-2026,
    icons) is reconciled: code-imported icons → `src/assets/`, runtime/reference →
    `public/` or `spec/.../assets/`. No third "assets" location at root.

13. **`.lovable/` is the AI brain.** `memory/` (rules), `coding-guidelines.md`,
    `prompts.md`, `what-to-read.md`, `question-and-ambiguity/`, `requirements/`.
    Add this `reorg-plan.md`. `what-to-read.md` remains the single onboarding map.

14. **Naming convention is uniform:** numbered spec/issue/update files =
    `NN-kebab-case.md`; deck folders = kebab-case; slides = `NN-name.json` +
    `NN-name.md`; React files = existing project casing (do not rename code).

15. **Every directory that a newcomer might open gets a `README.md`** (≤25 lines)
    answering: what is this, what goes here, what does NOT go here, where to look
    next. This is the heart of "convention over configuration."

16. **The onboarding contract** (`README.md` "For AI agents" section +
    `.lovable/what-to-read.md` + `.lovable/memory/reference/what-to-read.md`)
    stays in three-way sync and is updated to reflect the new layout.

17. **No moves without verification.** Any file move that could be an import
    target is followed by a repo-wide grep for the old path + a `bun run test`
    + build before the batch is considered done.

18. **Reversibility.** Risky moves (php, audit consolidation) are logged in
    `.lovable/question-and-ambiguity/` with rationale, so they can be reverted.

19. **Memory + README updated last,** after the physical layout is final, so the
    docs describe reality, not intention.

20. **Definition of done:** root contains only config+entry+top-level dirs; no
    duplicates/artifacts; every top-level and `spec/*` dir has a README; the
    three onboarding docs agree; `bun run test` and `bun run build` are green.

---

## PART B — Steps 21–100: Execution checklist

### Batch 1 — Safe deletions & root artifacts (21–30)
21. Confirm `README.md` == `readme.md` byte-for-byte (`cmp`).
22. Delete `readme.md`.
23. Delete `tsconfig.app.json.bak`.
24. Delete `tsconfig.app.tsbuildinfo` and `tsconfig.node.tsbuildinfo`.
25. Add `*.tsbuildinfo`, `*.bak` to `.gitignore`.
26. Grep repo for references to `readme.md` (lowercase) and fix.
27. Grep for references to the deleted tsbuildinfo/bak paths.
28. Run `bun run test`.
29. Run `bun run build`.
30. Batch 1 green ✔ — commit checkpoint note.

### Batch 2 — Root images & install scripts (31–40)
31. Create `scripts/install/`.
32. Move `run.ps1`, `slides-install.ps1`, `slides-install.sh` → `scripts/install/`.
33. Grep docs/README for those script paths; update references.
34. Move `cam2.png`, `cam3.png`, `cam4.png` → `spec/camera-2026/assets/`.
35. Grep for `cam2.png|cam3.png|cam4.png` references; update or confirm none.
36. Add `scripts/README.md` (index of audit/check/install scripts).
37. Move root `plan.md` → `.lovable/` history or fold into this plan; decide+log.
38. Run `bun run test`.
39. Run `bun run build`.
40. Batch 2 green ✔.

### Batch 3 — quality/ consolidation (41–52)
41. Create `quality/`.
42. Move root `audit/` → `quality/audit/`.
43. Move `metrics/` → `quality/metrics/`.
44. Move `reports/` → `quality/reports/`.
45. Grep scripts/ for `metrics/`, `reports/`, `audit/` output paths.
46. Update any script that writes to those paths.
47. Add `quality/README.md` (generated quality evidence; not hand-edited).
48. Confirm `spec/audit/` (spec, not output) untouched.
49. Run audit scripts that target moved dirs (smoke).
50. Run `bun run test`.
51. Run `bun run build`.
52. Batch 3 green ✔.

### Batch 4 — php / legacy decision (53–60)
53. Grep `src/`, `vite.config.ts`, `index.html` for any `php` reference.
54. Confirm `php/` is not imported/bundled at runtime.
55. If dead: move `php/` → `legacy/php/` (or delete after confirmation).
56. Add `legacy/README.md` explaining what legacy holds and that it is inert.
57. Log decision in `.lovable/question-and-ambiguity/NN-php-legacy.md`.
58. Run `bun run test`.
59. Run `bun run build`.
60. Batch 4 green ✔.

### Batch 5 — assets reconciliation (61–72)
61. Inventory root `assets/` (camera-2026, icons) consumers via grep.
62. Classify each: code-imported vs runtime-served vs reference-only.
63. Move code-imported assets → `src/assets/` (update import paths).
64. Move runtime-served assets → `public/`.
65. Move reference-only camera assets → `spec/camera-2026/assets/`.
66. Remove the now-empty root `assets/` dir.
67. Grep for old `assets/` import paths; fix all.
68. Verify images render in preview (spot check key slides).
69. Run `bun run test`.
70. Run `bun run build`.
71. Visual QA in preview (no broken images).
72. Batch 5 green ✔.

### Batch 6 — per-directory READMEs (73–84)
73. `src/README.md` — subfolder map.
74. `front-end/README.md` — runtime deck data warning.
75. `public/README.md` — served-as-is assets.
76. `scripts/README.md` — finalize (started in batch 2).
77. `updates/README.md` — delta format.
78. Ensure each `spec/NN-*/` has a top README (fill gaps).
79. `quality/README.md` — finalize.
80. `legacy/README.md` — finalize.
81. Verify all README links resolve (no dead relative links).
82. Run `bun run test`.
83. Run `bun run build`.
84. Batch 6 green ✔.

### Batch 7 — onboarding docs sync (85–94)
85. Update `.lovable/what-to-read.md` to reflect new root layout (quality/,
    legacy/, scripts/install/, single README).
86. Update `.lovable/memory/reference/what-to-read.md` mirror.
87. Update README "🤖 For AI agents" section to match.
88. Update `spec/README.md` folder map if any spec dir changed.
89. Update `.lovable/memory/index.md` Core rule about folder structure.
90. Cross-check three onboarding docs agree (diff the folder maps).
91. Add a top-of-README "Repository map" table (one row per top-level dir).
92. Run `bun run test`.
93. Run `bun run build`.
94. Batch 7 green ✔.

### Batch 8 — final verification (95–100)
95. Full grep for any stale path referencing moved files.
96. `bun run lint`.
97. `bunx tsc -p tsconfig.app.json --noEmit`.
98. `bun run test` (full suite green).
99. `bun run build` (clean).
100. Preview smoke test: load `/1`..`/N`, camera, controller, themes — all OK.

---

## Execution log
- (append batch completion notes here as we go)

### Progress
- **Batch 1 (21–30) ✔** removed `readme.md` dup, `tsconfig.app.json.bak`, both `*.tsbuildinfo`; gitignored `*.tsbuildinfo`/`*.bak`. No refs broken.
- **Batch 2 (31–40) ✔** `run.ps1`/`slides-install.{sh,ps1}` → `scripts/install/`; `cam2/3/4.png` → `spec/camera-2026/assets/`; root `plan.md` → `.lovable/history/sample-deck-expansion-plan.md`; added `scripts/README.md`. Zero references found, no new test failures (4 pre-existing webcam/TOC drift failures remain, unrelated).
- **Batch 3 (41–52) ✔** root `audit/`+`metrics/`+`reports/` → `quality/{audit,metrics,reports}`. Updated `scripts/report-strict-types.ts` (→ quality/metrics) + `scripts/reference-qa-report.ts` (→ quality/reports); both smoke-tested, write to new paths. Added `quality/README.md`. `spec/audit/` untouched. No new test failures.
- **Batch 4 (53–60) ✔** root `php/` (placeholder only, not built/imported/served — grep-verified) → `legacy/php/`. Added `legacy/README.md`, logged decision in `.lovable/question-and-ambiguity/60-php-to-legacy.md`, bumped task-counter (#41). Reversible (`mv legacy/php php`). No new test failures.
- **Batch 5 (61–72) ✔** root `assets/` had ZERO code references. `camera-2026/*.png` were exact dupes of `spec/camera-2026/assets/` → deleted dupes, kept its README. `assets/icons/` (brand-source logos + Palette/Tokens) → `spec/21-slides-system/assets/brand-source/` + new README clarifying runtime brand assets live in `src/assets/brand/`. Removed empty root `assets/`. No stale refs, no new test failures. (No visual QA needed — assets were unreferenced reference material, not app-loaded.)
