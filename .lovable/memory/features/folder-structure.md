---
name: folder-structure
description: Canonical repo layout — root holds only config+entry+dirs; every top-level and spec/* folder has a README. quality/ legacy/ scripts/install/ added in 2026-06-02 reorg.
type: feature
---

# Repository folder structure (convention over configuration)

Rule: **one folder = one concern**, named so the name alone explains it.
Root holds ONLY config + entry files + the dirs below — no build artifacts,
duplicates, or loose files. Every top-level and `spec/*` folder has a `readme.md`.

| Folder | Concern |
|---|---|
| `src/` | The React app. `slides/` engine, `builder/`, `pages/`, `components/`, `hooks/`, `lib/`, `types/`, `assets/` (bundled, incl. `brand/`), `test/`, `releases/`. |
| `front-end/` | **Runtime deck data.** `project/<deck>/data/` = live decks; `slide-template/`; `themes/`. |
| `spec/` | Numbered canonical specs (see `spec/readme.md`): `15-research`, `21-slides-system` (system design + schemas + `llm/` pack + `assets/brand-source/`), `22-slides-issues`, `26-slide-definitions`, `27-slides-number`, `audit`, `camera-2026`, `controller-2026`. |
| `public/` | Served as-is at runtime (sounds, reference, robots.txt). |
| `scripts/` | Audit/check/release tooling (TS) + `install/` (shell/ps1 installers). |
| `quality/` | **Generated** quality evidence: `audit/`, `metrics/`, `reports/` — not hand-edited. |
| `updates/spec/` | Per-change spec deltas (what/why/files/verify). |
| `legacy/` | Inert/archived material (e.g. `php/` placeholder — deferred PHP backend). Not built/imported/served. |
| `.lovable/` | AI brain: `memory/`, `coding-guidelines.md`, `prompts/`, `what-to-read.md`, `question-and-ambiguity/`, `requirements/`, `reorg-plan.md`, `history/`. |

## History
- 2026-06-02 root-cleanup reorg (`.lovable/reorg-plan.md`): removed duplicate
  `readme.md` + build artifacts; root `audit/`+`metrics/`+`reports/` → `quality/`;
  `php/` → `legacy/php/`; root `assets/icons` → `spec/21-slides-system/assets/brand-source/`;
  camera dupes dropped; install scripts → `scripts/install/`; added per-dir READMEs.
- Supersedes the old "PHP+frontend+spec layout / `/spec/architecture/architecture.md`"
  description (that path no longer exists).
