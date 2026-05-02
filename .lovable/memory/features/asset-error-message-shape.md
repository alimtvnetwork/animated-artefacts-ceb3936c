---
name: asset-error-message-shape
description: v0.165 — Both asset-loading error paths (slug validation in `initAssetRegistry` AND file-existence verification in `assertDeclaredAssetFiles`) emit a 5-line block containing the exact root-deck JSON key (`referenced at`), the expected registry key (`register at  deck.assets.{kind}.{slug}`), the missing filename (basename of the URL, or `(no filename)` placeholder), the resolved URL, and either an HTTP status or an example URL. Centralized via `buildAssetErrorMessage` + `basenameOf` helpers in `src/slides/assetRegistry.ts`. Covered by 9 tests in `src/test/assetRegistryMessages.test.ts`.
type: feature
---
v0.165.0.

# Why
Spec 25 already named the deck JSON path and the registry key. The user
asked for the **missing filename** to also be on every error block so an
author can grep their `public/` folder without parsing the URL. We added
the `filename` line and made the file-existence loader (`assertDeclaredAssetFiles`)
match the same 5-line shape as the slug validator.

# Block shape (both error paths)
```
N. [{kind}] {header}
  ↳ referenced at  {deckJsonPath}
  ↳ register at    deck.assets.{kind}.{slug}
  ↳ filename       {basename or "(no filename)"}
  ↳ resolved URL   {url}  | expected URL  e.g. "{example}"
  ↳ status         HTTP {code} | fetch rejected (only for file-existence loader)
  ↳ how to fix     ... (only for file-existence loader)
```

# Helper
`basenameOf(url)` strips query/hash, removes trailing slashes, returns the
last path segment (or the literal `(no filename)` for `/`/empty inputs).

# Files
- `src/slides/assetRegistry.ts` — `buildAssetErrorMessage` adds `filename` line; `assertDeclaredAssetFiles` block re-shaped to match
- `src/test/assetRegistryMessages.test.ts` — 3 new tests (filename hint, file-existence block shape, no-filename fallback)
- `package.json` — 0.165.0
