---
name: Broken asset overlay (soft-fail asset policy)
description: When imported decks (or any deck with assetPolicy.softFail) hit missing-slug, URL-fetch, audio-decode, or image-decode failures, route them to the BrokenAssetReport store + BrokenAssetOverlay floating card instead of throwing the fatal asset loader.
type: feature
---

# Broken asset overlay (v0.173)

## When the soft path runs
- `useSoftAssetFailures` in `src/slides/loader.ts` = `isImportedDeck || deck.assetPolicy.softFail === true`.
- Bundled decks stay strict (a regression there is a build-time bug).
- Imported decks are soft by default — a typo in a custom localStorage manifest can never lock the user out of the workspace.

## Failure sources funnelled into the store
| Reason | Source | File |
|---|---|---|
| `missing-slug` | `initAssetRegistrySoft` (skips `icon` + rogue-block) | `src/slides/assetRegistry.ts` |
| `url-fetch-failed` | `reportDeclaredAssetFiles` HEAD-check | `src/slides/assetRegistry.ts` |
| `audio-decode-failed` | `SlideSoundManager.loadAsset` catch block | `src/slides/sound.ts` |
| `image-decode-failed` | `probeDeclaredImageDecode` (auto-runs on soft path) | `src/slides/assetRegistry.ts` |

## Store contract — `src/slides/brokenAssetReport.ts`
- Dedupe key: `(kind, slug, reason)` — first push wins.
- Sorted by `kind` then `slug` for stable overlay output + tests.
- `subscribeBrokenAssetReport` fires the current snapshot via microtask after subscribe (matches `runtimeImageQA` shape).
- `__resetBrokenAssetReport` is the test-only escape hatch; production code never clears the session.

## Overlay UX — `src/slides/components/BrokenAssetOverlay.tsx`
- Floating top-right card mirroring `RuntimeImageQAOverlay` (gold border, ember accent, inline styles so it renders even before Tailwind is up).
- z-index `9998` (one below `RuntimeImageQAOverlay`'s `9999`) so they coexist when both fire.
- Dismiss is per-session **but resets when a new failure arrives** — the dismissed-at-count gate handles this. Don't change without preserving that property.

## Adding a new detection point
1. Decide the `BrokenAssetReason` (extend the union in `brokenAssetReport.ts` with a label in `BrokenAssetOverlay`'s `REASON_LABEL`).
2. Call `reportBrokenAsset({ kind, slug, reason, url, detail })` at the failure site.
3. Never throw on the soft path — the whole point is keeping the app alive.

## Don't
- Re-add fatal throws on the imported-deck boot path.
- Fan out to toasts (timer dismiss; this needs to persist until fix).
- Surface icon-remap or rogue-`assets`-block errors here — they're authoring bugs, not file failures the user can fix.
