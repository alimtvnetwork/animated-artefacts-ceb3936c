# Spec 57 — Optional asset policy (`deck.assetPolicy.optional`) — v0.166

## Why

Strict-mode asset loading (specs 25 + 53 + 55) treats every declared file
under `deck.assets.{audio,qr,brand}` as a hard boot blocker. That's the
right default — a missing logo or whoosh during a live presentation is a
disaster. But some assets are genuinely optional:

- **Brand variations** — `logo-trimmed`, `presenter-alt`, alternate marks
  authored for a specific deployment and absent in others.
- **Fallback / debug-only assets** — A QR code or sound that exists only on
  the staging branch and isn't worth shipping to prod.
- **Deck-fork remnants** — A slug carried over from a duplicated deck that
  the new deck doesn't actually need yet.

Without an opt-out, authors had two bad choices: keep stale URLs and break
boot, or delete the slug and lose the option to reintroduce it.

Spec 57 adds a per-deck **opt-out whitelist** that downgrades named slugs
from "fatal on missing" to "warn-and-continue".

## Manifest schema — `deck.assetPolicy.optional`

Optional. Sibling of `deck.assets`. Per-kind allow-lists plus a `*`
wildcard. Slugs **not** listed continue to fail the boot pipeline as
before — strict-by-default is preserved.

```json
{
  "assets": {
    "brand": {
      "logo": "/assets/brand/riseup-asia-logo.png",
      "logo-trimmed": "/assets/brand/riseup-asia-logo-trimmed.png",
      "presenter-alt": "/assets/brand/alim-presenter-alt.png"
    }
  },
  "assetPolicy": {
    "optional": {
      "brand": ["logo-trimmed", "presenter-alt"],
      "audio": ["fadeZoom"],
      "qr":    [],
      "*":     ["debug-only-asset"]
    }
  }
}
```

| Key | Meaning |
|---|---|
| `optional.audio` | Audio slugs allowed to be missing without blocking boot. |
| `optional.qr` | QR slugs allowed to be missing. |
| `optional.brand` | Brand slugs allowed to be missing — covers the brand-variations case directly. |
| `optional['*']` | Cross-kind wildcard. Useful for one-off debug assets that may or may not be present in a given environment. |

## Runtime behavior

`assertDeclaredAssetFiles(deck)` now returns `Promise<MissingAssetFile[]>`
(the warnings list) instead of `Promise<void>`:

| Slug status | Old behavior | New behavior |
|---|---|---|
| Required + present | OK | OK |
| Required + missing | Throw fatal error | Throw fatal error (unchanged) |
| Optional + present | OK | OK |
| Optional + missing | Throw fatal error | `console.warn` once + return in the warnings array |

The fatal error message gained a remediation hint:

> `↳ how to fix     restore the file at the path above, or update the URL in deck.assets.brand.logo, or mark "logo" optional via deck.assetPolicy.optional.brand`

## Public API

```ts
export interface DeckAssetPolicy {
  optional?: {
    audio?: string[];
    qr?: string[];
    brand?: string[];
    '*'?: string[];
  };
}

export interface DeclaredFileVerification {
  missing: MissingAssetFile[];   // fatal — required slugs that 404'd
  warnings: MissingAssetFile[];  // tolerated — optional slugs that 404'd
}

verifyDeclaredAssetFiles(deck): Promise<DeclaredFileVerification>
assertDeclaredAssetFiles(deck): Promise<MissingAssetFile[]> // resolves with warnings
```

## Tests (4 new in `assetRegistryMessages.test.ts`)

1. Per-kind optional miss → no throw, single console.warn, warning returned.
2. Optional + required miss together → throw mentions only the required one.
3. `"*"` wildcard tolerates misses across multiple kinds.
4. Slugs absent from the whitelist still hard-fail.

## Strict-mode invariants preserved

- `initAssetRegistry` (slug validation) is **unchanged** — every slug a
  slide references must still be declared in `deck.assets.*`. The policy
  only governs file-existence (HEAD probe), not slug presence.
- Icons are still skipped (component-registry remaps, not files).
- The existing `check:assets` and `audit:resolutions` build-time scripts
  are unaffected — they validate the manifest declarations themselves.

## Related

- Spec 25 — Strict asset preload + slug validation
- Spec 53 — Asset-resolution audit
- Spec 55 — Reference QA report
- This spec (57) — Per-deck opt-out for optional assets
