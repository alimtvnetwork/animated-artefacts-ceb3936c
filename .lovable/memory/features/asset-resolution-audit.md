---
name: asset-resolution-audit
description: v0.161 — `scripts/audit-asset-resolutions.ts` walks slide specs, opens every referenced audio/QR/brand file, parses dimensions / duration / format / size with zero-dep header parsers, and compares to `deck.assetConstraints[kind]`. Wired into CI; complements check:assets (existence) and asset-diagnostic (used/unused/missing).
type: feature
---
v0.161.0.

# Why
Strict slug + file-existence checks (specs 25, 158) don't see *content*. A
32×32 placeholder PNG at the QR slug, a 4K logo bloating LCP, or a 9-second
whoosh that should be 400ms all sail through both existing audits. Spec 53
adds a content audit.

# Manifest
Optional `deck.assetConstraints` block (sibling of `deck.assets`). Per-kind
rules; missing keys = no rule. Only `audio` / `qr` / `brand` (icons are
component remaps, not files).

```json
"assetConstraints": {
  "audio": { "formats": ["mp3"], "maxBytes": 524288, "maxDurationSec": 4 },
  "qr":    { "formats": ["png"], "minWidth": 256, "maxWidth": 2048, "aspectRatio": "1:1" },
  "brand": { "formats": ["png","jpg","svg","webp"], "maxBytes": 3145728, "maxWidth": 4096 }
}
```

Supported rules: `formats`, `maxBytes`, `min/maxWidth`, `min/maxHeight`,
`aspectRatio` (W:H string + `aspectRatioTolerance` default 0.02),
`min/maxDurationSec`.

# Script
`scripts/audit-asset-resolutions.ts` — zero-dep header parsers for PNG (IHDR),
JPEG (SOFn marker walk), WEBP (VP8/VP8L/VP8X), MP3 (ID3v2 skip → frame sync
→ Xing/VBRI for VBR-precise duration, CBR fallback). Reads only the first
~64KB of each file (16KB for MP3 frame walk).

Outputs Markdown to `/mnt/documents/asset-resolution-audit-{deckSlug}.md`.
Console summary lists every violation with `expected vs got`. Exit codes
mirror `asset-diagnostic.ts`: 0 clean, 1 script error, 2 violations.

# Reference collection
Mirrors `scripts/asset-diagnostic.ts`:
- `deck.meeting.qrAsset`
- `slide.content.qrAsset`
- `slide.sound.kind` (skip `pop` — procedural)
- All declared `deck.assets.brand.*` (chrome is implicitly used everywhere)

Icons skipped — component-registry remaps, not files.

# CI
New step in `.github/workflows/ci.yml` after `check:assets`. Existence pass
fails first on missing files (cheap signal); resolution audit fails second
on dimension/format/size violations.

# Showcase deck rules (current)
Conservative starter set — every existing asset passes. Tighten over time.
- Audio: mp3 only, ≤512KB, 0.1–4s
- QR: png only, 256–2048px, 1:1 ±2%, ≤256KB
- Brand: png/jpg/svg/webp, 96–4096px, ≤3MB

# Files
- `scripts/audit-asset-resolutions.ts` — new
- `spec/slides/53-asset-resolution-audit.md` — full spec
- `spec/slides/showcase/deck.json` — `assetConstraints` block added
- `package.json` — `audit:resolutions` script + 0.161.0
- `.github/workflows/ci.yml` — new step
