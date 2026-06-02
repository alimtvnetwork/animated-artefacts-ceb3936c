# llm-guideline — the blind-follow JSON modification pack

> **Purpose.** This folder is a *self-contained, step-by-step recipe book* an AI
> agent can follow **blindly** to modify any slide's JSON correctly. It does not
> replace the deep system docs — it points to them at each step. If you only
> read one folder before editing a slide, read this one.

## Read order

1. [`01-modify-a-slide-step-by-step.md`](./01-modify-a-slide-step-by-step.md)
   — the canonical 30-step procedure: find the file, edit it, validate it.
2. [`02-layout-recipes.md`](./02-layout-recipes.md)
   — copy-paste answers to "how do I center this / make this bigger / change
   the header / add a capsule / emphasise a word".
3. [`03-field-reference.md`](./03-field-reference.md)
   — every JSON field, what it does, legal values, and what breaks if wrong.

## Where the slides actually live (runtime source of truth)

```
front-end/project/<deck-slug>/data/
  slides.json              ← deck manifest: config + ordered list of slide files
  slides/NN-name.json      ← ONE slide per file — EDIT THESE to change a slide
  slides/NN-name.md        ← companion presenter note (NEVER read at runtime)
```

- `front-end/slide-template/` — copy-me starter JSON, one per slideType.
- `front-end/themes/` — theme token files.

## The deep reference docs (read when a step tells you to)

| Need | Read |
|---|---|
| Every top-level field | [`spec/21-slides-system/00-fundamentals.md`](../21-slides-system/00-fundamentals.md) |
| The JSON schema (validate against this) | [`spec/21-slides-system/slide.schema.json`](../21-slides-system/slide.schema.json) |
| Per-slideType content shape | [`spec/21-slides-system/llm/23-slide-type-contracts.md`](../21-slides-system/llm/23-slide-type-contracts.md) |
| Copy-paste full templates | [`spec/21-slides-system/llm/06-json-authoring-cheatsheet.md`](../21-slides-system/llm/06-json-authoring-cheatsheet.md) |
| All legal enum values + counts | [`spec/21-slides-system/llm/CATALOG.json`](../21-slides-system/llm/CATALOG.json) |
| Typography sizes | [`spec/21-slides-system/llm/10-typography.md`](../21-slides-system/llm/10-typography.md) |
| Steps system | [`spec/21-slides-system/llm/02-step-system-complete.md`](../21-slides-system/llm/02-step-system-complete.md) |

## Golden rules (never violate)

1. **JSON is the runtime source of truth.** Edit the `.json`, not the `.md`.
2. **Keyword-only content** — the presenter narrates; slides are visual anchors.
3. **Use capsule classNames / `color` tokens** — never inline hex in JSON.
4. **Validate after every edit** — schema + `bun run test`.
5. Lowercase, hyphenated, numbered filenames. Keep `slideNumber` unique per deck.
