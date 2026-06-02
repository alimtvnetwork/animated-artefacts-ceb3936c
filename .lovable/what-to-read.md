# What to read (AI onboarding map)

If you are an AI agent picking up this repo with **zero context**, read these
files **in order**. This is the top-level pointer; a memory-scoped mirror lives
at [`.lovable/memory/reference/what-to-read.md`](memory/reference/what-to-read.md)
and the long-form version is the root [`readme.md`](../readme.md) — see its
"🤖 For AI agents", "📂 Folder structure", "📖 Which files the AI must read", and
"🛠️ How the AI does common work" sections. Keep all three in sync.

> Rule: never create files directly in `mem://` (the `.lovable/memory/` root).
> Memory files go in a typed subfolder (`memory/{constraints|design|features|preferences|reference}/`).

---

## 0. Always-apply rules (read every loop)

- [`.lovable/memory/index.md`](memory/index.md) — project-wide Core rules
  (brand, themes, constraints). Apply on EVERY action.
- [`.lovable/coding-guidelines.md`](coding-guidelines.md) — the 12 hard coding
  rules (≤8-line functions, no `any`, files ≤100 lines, DRY, no inline hex…).
- [`.lovable/prompts.md`](prompts.md) — operating modes (no-questions, read/write memory).

## 1. Orient — folder structure

| Read this | To understand |
|---|---|
| [`spec/readme.md`](../spec/readme.md) | Canonical spec layout — which numbered folder owns what. |
| [`spec/21-slides-system/readme.md`](../spec/21-slides-system/readme.md) | How the slide engine behaves. |
| [`spec/21-slides-system/llm/00-readme.md`](../spec/21-slides-system/llm/00-readme.md) | Entry point to the AI authoring pack. |

```
spec/21-slides-system/          HOW the engine works (system design + schemas + LLM pack)
  00-fundamentals.md            per-slide JSON fields + layout contract — start here
  slide.schema.json             JSON Schema (draft-07) for ONE slide
  deck.schema.json              JSON Schema for a deck manifest
  llm/                          the AI authoring pack
spec/26-slide-definitions/      WHAT specific decks contain (per-deck JSON + MD)
spec/22-slides-issues/          bug reports, one numbered file each
front-end/project/<deck>/data/  the LIVE decks the app loads at runtime
  slides.json                   deck manifest (config + ordered slide list)
  slides/NN-name.json           one slide per file — RUNTIME SOURCE OF TRUTH
front-end/slide-template/       copy-me starter JSON, one per slideType
src/slides/                     React renderer (loader.ts, contracts.ts, themes.ts)
src/pages/                      /N route, builder, presenter, settings pages
src/builder/                    deck builder UI
updates/spec/NN-*.md            per-change spec deltas (what/why/files/verify)
quality/                        GENERATED quality evidence (audit/, metrics/, reports/) — not hand-edited
scripts/ + scripts/install/     audit/check/release tooling + env installers
legacy/                         inert/archived material (e.g. php/ placeholder) — not built
```

> Root holds only config + entry + the dirs above. Every top-level and `spec/*`
> folder has a `readme.md` explaining what belongs there (convention over
> configuration). See the root `readme.md` "Repository map" for the one-row table.

## 2. Learn the JSON — structure, fields, contracts

- [`spec/21-slides-system/00-fundamentals.md`](../spec/21-slides-system/00-fundamentals.md) — every top-level slide field.
- [`spec/21-slides-system/slide.schema.json`](../spec/21-slides-system/slide.schema.json) — shape of one slide.
- [`spec/21-slides-system/deck.schema.json`](../spec/21-slides-system/deck.schema.json) — shape of a deck manifest.
- [`spec/21-slides-system/llm/06-json-authoring-cheatsheet.md`](../spec/21-slides-system/llm/06-json-authoring-cheatsheet.md) — every field + preset.
- [`spec/21-slides-system/llm/23-slide-type-contracts.md`](../spec/21-slides-system/llm/23-slide-type-contracts.md) — required/optional `content` per slideType.
- [`spec/21-slides-system/llm/25-json-vs-md-contract.md`](../spec/21-slides-system/llm/25-json-vs-md-contract.md) — JSON (runtime) vs MD (humans/AI).
- [`spec/21-slides-system/llm/CATALOG.json`](../spec/21-slides-system/llm/CATALOG.json) — machine-readable catalog.
- Code: [`src/slides/contracts.ts`](../src/slides/contracts.ts) (zod) + [`src/slides/loader.ts`](../src/slides/loader.ts).

## 3. Create a new slide — the loop

1. Pick a slideType from the contracts doc.
2. Copy the starter from `front-end/slide-template/` into
   `front-end/project/<deck>/data/slides/NN-name.json`.
3. Fill `content` per its contract — keyword-only.
4. Add sibling `NN-name.md` with presenter notes (never read at runtime).
5. Register in `front-end/project/<deck>/data/slides.json`.
6. Save → Vite hot-reloads → validate against `slide.schema.json` + `bun run test`.

## 4. Write code (any change)

- Read [`.lovable/coding-guidelines.md`](coding-guidelines.md) FIRST — the 12 rules are enforced.
- Renderer lives in `src/slides/`; new visual primitives go in `src/slides/components/`.
- Use semantic tokens from `src/index.css` / `tailwind.config.ts` — never raw hex in components.
- Search `src/` before writing a new helper (DRY). Keep files ≤100 lines, functions ≤8 lines.
- A new slideType needs: renderer component + zod contract in `contracts.ts` + starter in `front-end/slide-template/`.

## 5. Add a unit test

- Tests live under `src/test/` and alongside features; runner is **Vitest**.
- Run: `bun run test`. Tests cover schema validation, slide contracts, and spec-parity.
- New slideType or contract field → add/extend a contract test so CI stays green.

## 6. Add a new feature

1. Write the spec FIRST: behaviour rules → `spec/21-slides-system/NN-*.md`;
   per-change delta → `updates/spec/NN-short-title.md` (next sequential number).
2. Implement following coding-guidelines.
3. Add Vitest coverage.
4. Pre-flight: `bunx tsc -p tsconfig.app.json --noEmit && bun run lint && bun run test && bun run build`.
5. Record durable decisions in memory (`.lovable/memory/{type}/<name>.md`) and index them in `memory/index.md`.

## 7. Report / resolve issues

- New bug → `spec/22-slides-issues/NN-short-title.md`.
- Resolved → append a `## Resolution` section to that same file (never move it).
