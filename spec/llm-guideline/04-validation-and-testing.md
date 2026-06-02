# 04 — Validation & testing (exact commands)

Run these after **every** slide JSON edit. Do not claim a change is done until
the suite is green.

## 1. JSON sanity

- The file must be valid JSON: no trailing commas, balanced quotes/braces.
- Quick parse check:
  ```bash
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" front-end/project/<deck>/data/slides/NN-name.json
  ```

## 2. Schema validation

Every slide must validate against
[`../21-slides-system/slide.schema.json`](../21-slides-system/slide.schema.json)
(draft-07). The deck manifest validates against `deck.schema.json`. The test
suite enforces this — you usually don't run ajv by hand.

## 3. Run the test suite

```bash
bun run test
```

This covers schema validation, per-slideType contracts, and spec-parity. All
must stay green.

## 4. Full pre-flight (when you touched code, not just deck JSON)

```bash
bunx tsc -p tsconfig.app.json --noEmit && bun run lint && bun run test && bun run build
```

## 5. Visual verification

Open the preview at route `/N` (the slide's `slideNumber`). Confirm:

- Title does not overflow the viewport (clamp should handle it).
- Capsules wrap cleanly, ≤6 visible.
- Nothing collides with the header band (`pt-32`) or footer (`pb-20`).
- The chosen `transition` / `textAnimation` plays (or is correctly suppressed
  under `prefers-reduced-motion`).

## 6. Failure triage

| Symptom | Likely cause | Fix |
|---|---|---|
| Slide blank / load error | unknown `slideType` or bad enum | check §`03` enum list |
| Test red on schema | invented field / wrong type | remove field, match schema |
| Capsule dark-on-dark | inline hex or brand token in JSON | use `color` token name only |
| Title clipped | hard-coded font size | remove it; let clamp scale |
| Wrong slide at `/N` | duplicate `slideNumber` | make it unique |
