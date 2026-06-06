# llm-guideline — the blind-follow JSON modification pack

> **Purpose.** This folder is a *self-contained, step-by-step recipe book* an AI
> agent can follow **blindly** to modify any slide's JSON correctly. It does not
> replace the deep system docs — it points to them at each step. If you only
> read one folder before editing a slide, read this one.

## Read order

0. [`00-simplified-single-file-guide.md`](./00-simplified-single-file-guide.md)
   — **start here to AUTHOR a whole deck from scratch.** Self-contained: the
   one-file manifest contract, the canonical 28-type inventory, a copy-paste
   JSON sample per type, and the intent→type decision table. Emit ONE manifest
   JSON with images embedded (Base64/SVG). The files below are for *modifying*
   existing slides and going deeper.

1. [`01-modify-a-slide-step-by-step.md`](./01-modify-a-slide-step-by-step.md)
   — the canonical 30-step procedure: find the file, edit it, validate it.
2. [`02-layout-recipes.md`](./02-layout-recipes.md)
   — copy-paste answers to "how do I center this / make this bigger / change
   the header / add a capsule / emphasise a word".
3. [`03-field-reference.md`](./03-field-reference.md)
   — every JSON field, what it does, legal values, and what breaks if wrong.
4. [`04-validation-and-testing.md`](./04-validation-and-testing.md)
   — exact commands to validate JSON, run the suite, and triage failures.
5. [`05-common-mistakes.md`](./05-common-mistakes.md)
   — anti-patterns (inline hex, invented fields, fixed font sizes) and the fix.
6. [`06-worked-example.md`](./06-worked-example.md)
   — one complete before → after edit, blind-followable end to end.
7. [`07-extended-type-recipes.md`](./07-extended-type-recipes.md)
   — recipes for Table / CodeBlock / BoxDiagram / Layout / Tile slides.
8. [`08-click-reveal-and-hotspots.md`](./08-click-reveal-and-hotspots.md)
   — attach hidden detail slides via capsule reveals or stage hotspots.
9. [`09-decision-tree.md`](./09-decision-tree.md)
   — pick the right slideType when authoring a brand-new slide.
10. [`10-theme-creation.md`](./10-theme-creation.md)
   — author palettes/themes; single-theme manifest, multi-theme bundle, import/export.

## JSON anatomy (at a glance)

```text
{
  ── identity ──────────────────────────────
  "slideNumber": 2,          // unique; maps to URL /N
  "slideName": "capabilities",
  "slideType": "CapsuleListSlide",   // picks the renderer + content shape
  ── behavior / entrance ───────────────────
  "transition": "SlideIn",   "textAnimation": "FadeIn",
  "enabled": true,           "isClickReveal": false,
  ── chrome ────────────────────────────────
  "showBrandHeader": true,   "showPresenterChip": true,
  ── title look (NOT pixel size) ───────────
  "titleStyle": "white",     "titleShimmer": true,
  ── speaker-only ──────────────────────────
  "notes": "narration here, never shown to audience",
  ── the visible payload (shape ⟂ slideType) ─
  "content": { "eyebrow": "...", "title": "...", "capsules": [ ... ] }
}
```

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
