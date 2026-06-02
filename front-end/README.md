# front-end/

**Runtime deck data** — what the app actually loads and displays. Editing
content here changes the live decks. JSON is the source of truth at runtime.

## Subfolders
| Folder | What lives here |
|---|---|
| `project/<deck>/data/` | One folder per deck. `slides.json` = deck manifest (config + ordered slide list); `slides/NN-name.json` = one slide per file (**runtime source of truth**); sibling `NN-name.md` = presenter notes (never read at runtime). |
| `slide-template/` | Copy-me starter JSON, one per `slideType`. Start here when authoring a new slide. |
| `themes/` | Theme data consumed by the deck loader. |

## Authoring loop
1. Pick a `slideType` (see `spec/21-slides-system/llm/23-slide-type-contracts.md`).
2. Copy a starter from `slide-template/` into `project/<deck>/data/slides/NN-name.json`.
3. Fill `content` per its contract — keyword-only, no paragraphs.
4. Add sibling `NN-name.md` presenter notes.
5. Register the slide in `project/<deck>/data/slides.json`.
6. Save → Vite hot-reloads → `bun run test`.

## What does NOT go here
- Renderer/engine code → `src/slides/`. System rules → `spec/21-slides-system/`.
