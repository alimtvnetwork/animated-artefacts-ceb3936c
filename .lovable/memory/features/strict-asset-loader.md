---
name: strict-asset-loader
description: Two-layer fail-fast asset loader — sync slug validator in loader.ts plus async file-existence HEAD verifier awaited in main.tsx; rogue per-slide assets blocks rejected; missing files render fatal overlay before any slide paints.
type: feature
---
v0.158.0.

# Two-layer contract
The deck root JSON owns the entire asset surface (`deck.assets.{audio,qr,brand,icons}`). Strictness is enforced in two layers, both of which must pass before the app paints:

1. **Slug validator (sync, `initAssetRegistry`)** — runs at module-init in `loader.ts`. Walks every slide reference (`slide.sound.kind`, `slide.content.qrAsset`, ambient `iconPool`/`positions`, deck-level `meeting.qrAsset`) and throws an aggregated `Error` if any slug isn't declared in `deck.assets.*`. Also rejects any rogue `assets` block on individual slides — assets MUST live on the root deck JSON only.
2. **File-existence verifier (async, `assertDeclaredAssetFiles`)** — awaited in `main.tsx` BEFORE `createRoot(...).render(<App />)`. HEAD-checks every URL declared in `deck.assets.{audio,qr,brand}` (icons skipped — they're component-registry remaps, not files). Concurrency-bounded at 8. Throws an aggregated `Error` listing every missing file.

# Failure surface
On layer 2 failure, `main.tsx` does NOT mount React. Instead it injects a DOM-direct fatal overlay onto `#root`: noir-themed `<pre>` block listing every missing file with its `deck.assets.*` JSON pointer, resolved URL, HTTP status, and a "how to fix" line. We bypass React because downstream components (BrandHeader logo, BrandedQR, sound layer) would themselves crash on the missing URL — the overlay must paint even when the tree is unsafe to mount.

# Why HEAD + no-store
- HEAD: status only, no payload — keeps the cache clean for assets the user might not play this session.
- `cache: 'no-store'`: a stale 200 in the SW / disk cache after a server-side delete would be a worse failure mode than the 404.

# Bypass paths
- Remote URLs (`http://` / `https://`) skipped — CORS would cause spurious failures and the contract assumes deck-owned local `/public` paths.
- Procedural `pop` synth audio is exempt from slug validation by design (no asset).
- Empty/non-string URL entries are skipped (defensive — schema should forbid them earlier).

# Files
- `src/slides/assetRegistry.ts` — added `verifyDeclaredAssetFiles`, `assertDeclaredAssetFiles`, `MissingAssetFile`; extended sync validator with rogue-slide-assets guard
- `src/main.tsx` — awaits `assertDeclaredAssetFiles(deck)`; on rejection renders DOM-direct fatal overlay instead of mounting `<App />`
- `package.json` — 0.158.0

# Relationship to checkImportedAssets.ts
The older `checkImportedDeckAssets` is now superseded for boot-time enforcement. It survives as a non-fatal diagnostic helper (intended for future BrokenAssetOverlay tooling on imported decks); the new `verifyDeclaredAssetFiles` is the strict gate.
