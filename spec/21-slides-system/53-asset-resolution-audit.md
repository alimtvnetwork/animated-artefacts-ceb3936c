# Spec 53 — Automated Asset Resolution Audit (v0.161)

## Why
The strict asset registry (spec 25 / `assetRegistry.ts`) guarantees that every
slug a slide references resolves to a URL declared in `deck.assets.*`, and that
the URL returns a 2xx HEAD. It does **not** check the *contents* of the file —
a 32×32 placeholder PNG sitting at the QR slug, a stretched 4K logo bloating
LCP, or a 9-second whoosh that should be 400ms will all sail through.

Spec 53 adds a build-time **resolution + format audit** that walks every slide
spec, gathers every asset reference, opens the actual bytes on disk, parses
dimensions / duration / format, and compares them to the per-kind constraints
declared on the deck root JSON.

## Manifest schema — `deck.assetConstraints`

Optional. Sibling of `deck.assets`. Per-kind rules. All numeric bounds are
inclusive. Missing keys = no rule (the audit only enforces what you declare).

```json
{
  "assetConstraints": {
    "audio": {
      "formats": ["mp3"],
      "maxBytes": 524288,
      "minDurationSec": 0.1,
      "maxDurationSec": 4
    },
    "qr": {
      "formats": ["png"],
      "minWidth": 256, "minHeight": 256,
      "maxWidth": 2048, "maxHeight": 2048,
      "aspectRatio": "1:1",
      "aspectRatioTolerance": 0.02,
      "maxBytes": 262144
    },
    "brand": {
      "formats": ["png", "jpg", "svg", "webp"],
      "minWidth": 96, "minHeight": 96,
      "maxWidth": 4096, "maxHeight": 4096,
      "maxBytes": 3145728
    }
  }
}
```

### Rule reference

| Key | Applies to | Meaning |
|---|---|---|
| `formats` | all | Allowed file extensions (lowercase, no dot). Detected from the URL suffix AND verified against the binary magic bytes when available (PNG/JPEG/MP3/WEBP). Mismatched magic bytes is a fatal violation — catches `meeting-qr.png` that is secretly a JPEG. |
| `maxBytes` | all | Hard ceiling on file size. Use to cap LCP regressions and audio bandwidth. |
| `minWidth` / `minHeight` / `maxWidth` / `maxHeight` | image kinds | Pixel bounds. Read from the PNG IHDR / JPEG SOFn marker / WEBP VP8 chunk header. |
| `aspectRatio` | image kinds | One of `"1:1"`, `"4:3"`, `"16:9"`, or `"W:H"` arbitrary. Tolerance defaults to ±0.02 of the ratio; override via `aspectRatioTolerance`. |
| `minDurationSec` / `maxDurationSec` | audio | Read from the MP3 frame headers (CBR/VBR-aware via Xing/VBRI). |

Icons are **not** resolution-checked — they are React-component remaps, not
files.

## Script — `scripts/audit-asset-resolutions.ts`

```bash
bun run audit:resolutions                                  # showcase deck
bun run audit:resolutions spec/slides/<other-deck>/deck.json
bun run audit:resolutions <deck> --out report.md
```

### What it does

1. Loads the deck + every slide JSON listed in `deck.slides`.
2. Collects every asset reference (mirrors `scripts/asset-diagnostic.ts`):
   slide `content.qrAsset`, slide `sound.kind` (skipping the procedural `pop`),
   ambient `iconPool` / `positions[].icon`, deck `meeting.qrAsset`.
3. For every audio / QR / brand entry actually referenced by ≥1 slide, reads
   the file from `public/<url>` and probes:
   - Magic-byte format check (PNG `89 50 4E 47`, JPEG `FF D8 FF`, MP3
     `ID3` or `FF FB`/`FF F3`/`FF F2`, WEBP `RIFF…WEBP`).
   - Pixel dimensions via header parser (no image-decode dependency).
   - MP3 duration via frame-header walk + Xing/VBRI tag.
   - File size via `statSync`.
4. Compares each metric to the deck's `assetConstraints[kind]` rule and emits
   one violation block per failed rule (a single asset can produce multiple
   violations, e.g. wrong format AND too large).
5. Writes a Markdown report to `/mnt/documents/asset-resolution-audit-{deckSlug}.md`.
6. Exits **0** if clean, **2** if any violation, **1** on script error
   (missing deck, unparseable JSON). Mirrors `asset-diagnostic.ts` semantics
   so CI pipelines can wire all three audits with the same status mapping.

### Why a separate script (not folded into `check:assets`)

`check:assets` is intentionally fast (existence only, no file I/O beyond
`existsSync`) so it can run on every save during dev. The resolution audit
opens and parses every file; it's CI-grade, not save-grade.

### Determinism

Walks files in alpha-sorted order. Report includes deck slug + an ISO
timestamp at the top. Violations are listed sorted by `(kind, slug, rule)` so
two runs against the same fileset produce byte-identical reports — friendly
to git-blame on the report itself if a team wants to commit it.

## CI

Added as a step in `.github/workflows/ci.yml` after `check:assets`. The
existence check fails first on missing files (cheap signal); the resolution
audit fails second on dimension/format/size violations.

## Related

- Spec 25 — Strict asset preload + boot-time slug validation.
- `scripts/check-deck-assets.ts` — file existence only.
- `scripts/asset-diagnostic.ts` — used / unused / missing slug ledger.
- This audit (spec 53) closes the loop on **content** correctness.
