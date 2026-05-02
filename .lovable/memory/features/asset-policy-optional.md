---
name: asset-policy-optional
description: v0.166 — `deck.assetPolicy.optional` whitelist downgrades named asset slugs from "fatal on missing" to "warn-and-continue". Per-kind lists (`audio` / `qr` / `brand`) plus a `*` cross-kind wildcard. `assertDeclaredAssetFiles` now returns a warnings array; missing required slugs still throw with a remediation hint pointing at the policy. Strict-by-default preserved — slugs not listed continue to hard-fail. Slug-validation in `initAssetRegistry` is untouched.
type: feature
---
v0.166.0.

# Why
Strict-by-default is correct for a live presenter (no missing logo or
whoosh on stage), but some declared assets — brand variations, alt marks,
debug-only QR codes, deck-fork remnants — are genuinely optional. Without
an opt-out, authors had to choose between blocking boot and deleting the
slug entirely.

# Manifest
Sibling of `deck.assets`:
```json
"assetPolicy": {
  "optional": {
    "brand": ["logo-trimmed", "presenter-alt"],
    "audio": ["fadeZoom"],
    "qr":    [],
    "*":     ["debug-only-asset"]
  }
}
```
`*` is a cross-kind wildcard. Anything NOT listed stays strict.

# Runtime
- `assertDeclaredAssetFiles(deck)` returns `Promise<MissingAssetFile[]>`
  (warnings) instead of `Promise<void>`. Throws only when *required* slugs
  are missing.
- Optional misses log a single `console.warn` block listing every missing
  optional asset + its `deck.assets.{kind}.{slug}` path.
- Fatal-error block gained a third remediation suggestion: "or mark
  '{slug}' optional via deck.assetPolicy.optional.{kind}".
- `initAssetRegistry` (slug validation) is unchanged — slugs still must
  be declared.

# Tests (4 new, 13 total in assetRegistryMessages.test.ts)
1. Per-kind optional miss → no throw, single warn, warning returned.
2. Optional + required together → throw mentions only the required miss.
3. `*` wildcard tolerates misses across multiple kinds.
4. Slugs absent from the whitelist still hard-fail.

# Files
- `src/slides/assetRegistry.ts` — `DeckAssetPolicy` type, `buildOptionalPredicate`, split return type, warning logging
- `src/test/assetRegistryMessages.test.ts` — 4 new tests
- `spec/slides/57-asset-policy-optional.md` — full spec
- `package.json` — 0.166.0
