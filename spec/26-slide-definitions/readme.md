# 26-slide-definitions/

**Per-slide content specs** — the designed definition of each deck's slides.
One subfolder per deck. JSON is the runtime source of truth; the companion MD
is for humans/AI.

## Layout
| Path | What lives here |
|---|---|
| `<deck-name>/` | One folder per deck (kebab-case). Each slide = `NN-name.json` + sibling `NN-name.md`. |
| `_patterns/` | Reusable slide-pattern specs referenced across decks (e.g. session-outline-slide). |

Current decks: `sample/`, `inside-studio/`, `session-4-ai-coding/`.

## Naming
- Deck folders: kebab-case.
- Slides: two-digit prefix, `NN-name.json` (spec) + `NN-name.md` (notes/rationale).

## Relationship to runtime
These are the **design** specs. The decks the app loads live are in
`front-end/project/<deck>/data/`. Keep the JSON shape aligned with
`spec/21-slides-system/slide.schema.json` and `src/slides/contracts.ts`.
