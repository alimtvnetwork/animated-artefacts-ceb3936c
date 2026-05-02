---
name: suggest-asset-constraints
description: v0.176 — `bun run suggest:constraints` walks every deck under `spec/slides/`, probes every referenced asset, and proposes a tightened `assetConstraints` block per deck. Reuses the audit's parsers (now exported). Tighten-only diff vs. current; opt-in `--apply` writes back with .bak.
type: feature
---
v0.176.0.

# Why
The starter `assetConstraints` in showcase deck are intentionally loose
(audio ≤512KB / 4s, brand ≤3MB / 4096px) so the initial audit didn't fail
on day one. Tightening them is a separate human decision; the suggester
is the assistant for that decision.

# Pipeline
`scripts/suggest-asset-constraints.ts`:
1. Discover decks: `spec/slides/deck.json` + `spec/slides/<dir>/deck.json`.
2. For each deck, reuse `loadDeck` + `collectReferences` + `probeFile`
   from the audit script (now `export`-ed; audit auto-run gated behind
   `import.meta.main`).
3. Per kind (audio / qr / brand), compute min/max for bytes, width,
   height, durationSec, viewBox dims; collect format set + ratio sample.
4. Apply safety margins (see below) → proposed rule.
5. Diff against current `deck.assetConstraints[kind]`, surface only
   tightening lines (loosening is never proposed).

# Safety margins
| Rule | Margin | Why |
|---|---|---|
| `maxBytes` | ×1.10 ceil | Headroom for re-exports / minor source tweaks. |
| `maxWidth` / `maxHeight` | = observed_max | No headroom — pixel ceilings are LCP-defensive. |
| `minWidth` / `minHeight` | floor(observed_min × 0.95) → snap-down to 16 | Reads as round (96, 112, 128) and survives a small re-export shrink. |
| `aspectRatio` | only if ≥80% cluster within 2% of {1:1,4:3,3:2,16:9,3:4,2:3,9:16} | Wrong guess forces re-shaping every asset; better to omit. |
| `maxDurationSec` | observed_max + 250ms, ceil to 50ms | 250ms = smallest unit anyone hand-edits stings at. |
| `minDurationSec` | floor to 50ms, capped at 0.1s | Matches showcase starter (don't propose silly-tight floor like 0.13s). |
| `formats` | union of observed | Never adds; never removes anything still in use. |
| `requireViewBox` (SVG) | `true` whenever ≥1 SVG present | Matches v0.175 default. |
| `minViewBoxWidth/Height` (SVG) | floor(observed × 0.95) → snap-16 | Same rule as raster minWidth. |

# Output
- Console: per-deck `🔒 kind.rule: before → after` lines + counts.
- Markdown: `/mnt/documents/asset-constraints-suggestion-{slug}.md` per
  deck, or one combined file via `--out`.
- `--apply` (opt-in): writes proposed block into `deck.json` and creates
  a sibling `.bak` first. Round-trips the JSON via parse → stringify
  (deck.json has no comments, so no loss; `.bak` is the safety net).

# Files
- `scripts/suggest-asset-constraints.ts` — new.
- `scripts/audit-asset-resolutions.ts` — `export`-ed `loadDeck`,
  `collectReferences`, `probeFile`, `urlExtension`, `urlToFsPath`;
  guarded `process.exit(main())` behind `import.meta.main`.
- `package.json` — `suggest:constraints` script + 0.176.0.

# Edge cases that informed the design
- Single-asset kinds (e.g. showcase has 1 audio, 1 QR) collapse to a
  *very* tight ceiling. That's correct given the margin policy — and
  why `--apply` is opt-in: an author should sanity-check single-sample
  proposals before committing.
- Remote URLs are silently skipped (the audit already flags them).
- Probe failures are warnings in the report, never fatal — you want
  suggestions PRECISELY when the current rules are too loose.
- Loosening is unrepresentable in the diff output (`tighter()` returns
  false), so a deck that's already over-tightened reports "✅ already
  tighter than the proposal — no change recommended" instead of
  proposing weaker rules.
