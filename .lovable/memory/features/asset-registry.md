---
name: asset-registry
description: Boot-time validator + deck.assets override registry for audio cues, QR PNGs, brand chrome, and ambient icons. Missing references throw an aggregated Error at deck load.
type: feature
---

## File
`src/slides/assetRegistry.ts`. Built-ins live in this module; deck overrides come from `deck.assets`.

## Categories
- `audio`  — SoundKind → URL. Built-ins: whoosh, click, fadeClick, zoom, fadeZoom (mapped to `/sounds/*.mp3`).
- `qr`     — slug → image URL. Built-in: `riseup-meeting`.
- `brand`  — slug → image URL. Built-ins: `logo`, `logo-trimmed`, `presenter`.
- `icons`  — slug → built-in icon-slug (alias map). Default: identity map of `AMBIENT_ICON_REGISTRY`.

## Deck override shape
```json
{
  "assets": {
    "audio":  { "whoosh": "/sounds/custom-whoosh.mp3" },
    "qr":     { "partner-portal": "/assets/brand/partner-qr.png" },
    "brand":  { "logo": "/assets/brand/custom-logo.png" },
    "icons":  { "ide": "vscode" }
  }
}
```
Built-ins are always present; deck entries merge on top.

## Boot validator
`initAssetRegistry(deck, slides)` is called from `src/slides/loader.ts` AFTER deck load. It walks:
- `deck.meeting.qrAsset`
- every `slide.content.qrAsset`
- every `slide.sound.kind` (excluding `pop`, which is procedural)
- every `iconPool[]` and `positions[].icon` slug in `titleAmbient` / `stepAmbient`

Any unresolved slug becomes one line in an aggregated `Error`. Boot HALTS — the user sees the error in the dev overlay / console immediately, not at runtime.

## Runtime consumers
- `src/slides/sound.ts` reads `getAudioUrl(kind)` (falls back to `ASSETS[kind].url` when no override).
- `src/slides/components/BrandedQR.tsx` reads `getQrUrl(slug)` (falls back to bundled `BUILTIN_QR_REGISTRY`).
- Icon registry (`AMBIENT_ICON_REGISTRY`) is unchanged at runtime — the validator only enforces that referenced slugs exist.

## Why
Spec contract for blind-AI authoring: deck JSON must be self-describing. Missing files used to surface as silent fallbacks (procedural synth, default QR, dropped icons). Now a typo or missing file fails fast with the slide number + slug + category in the error.

## Schema
`spec/slides/deck.schema.json` defines `assets` with per-category `additionalProperties: { type: string }`. No required properties — the block is optional.
