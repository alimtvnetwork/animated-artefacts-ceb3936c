# KeywordSlide — authoring guide

**Purpose**: A grid of 3–7 short keywords as the visual anchor while the presenter narrates. No paragraphs, no steps — just terms.

**Template**: [`KeywordSlide.json`](./KeywordSlide.json)

---

## When to use

- Whenever you would otherwise be tempted to write a paragraph. Strip it to keywords; let the presenter speak the connective tissue.
- Quick "what this is / what this isn't" beats.

## Required content fields

| Field      | Type       | Notes                              |
|------------|------------|------------------------------------|
| `title`    | `string`   | One-line headline above the grid.  |
| `keywords` | `string[]` | 3–7 entries. Each ≤ 3 words.       |

## Recommended content fields

| Field     | Type     | Notes |
|-----------|----------|-------|
| `eyebrow` | `string` | Wide-tracking line above the title. |

## Animation

- `transition`: `PushIn` (default) for entrance momentum. `FadeIn` for restraint.
- `textAnimation`: `Stagger` (default) — keywords pop in one by one.

## House rules

- **Keywords-only** — never sentences. If you can't fit it in 3 words, the slide isn't a KeywordSlide.
- 3–7 entries max. More than 7 reads as a bulleted list, not as keywords.
- For chip-styled multi-item slides with colour use **CapsuleListSlide** instead.

## Related specs

- [`mem://features/slide-types`](../../.lovable/memory/features/slide-types.md) — full SlideType enum behaviour.
- Keywords-only content rule: project memory core.
