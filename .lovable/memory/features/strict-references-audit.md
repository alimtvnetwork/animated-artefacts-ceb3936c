---
name: Strict-references audit mode
description: v0.174 opt-in `--strict-references` flag on `audit:resolutions` flags any referenced-but-missing public asset file across three reference surfaces (declared, registry, slide-path).
type: feature
---

# Strict-references audit mode (v0.174)

## Trigger
- `bun run audit:resolutions:strict` — wraps `--strict-references` against the showcase deck.
- `bun ./scripts/audit-asset-resolutions.ts <deck> --strict-references` (alias `-S`).
- Default `audit:resolutions` is unchanged — the flag is opt-in so local runs with intentional missing fixtures keep working.

## Three reference surfaces (priority order)
1. **declared** — every URL in `deck.assets.{audio,qr,brand}`.
2. **registry** — slide slugs resolved through the registry: `sound.kind`, `content.qrAsset`, `deck.meeting.qrAsset`.
3. **slide-path** — any `/`-prefixed string in any slide JSON (catches `content.imageAsset`, future `content.videoAsset`, raw refs the registry doesn't formally know about). Excludes `//` (protocol-relative) and remote URLs.

Dedupe by URL; the most specific category (`declared > registry > slide-path`) wins so the report's "Referenced at" pointer is the most actionable origin.

## Output
- New "Missing References" section in the Markdown report with a `Category | Kind/Slug | URL | Referenced at` table.
- Console adds `📎 N missing references` to the summary line and a per-row list.
- Exit code 2 when `missingRefs.length > 0` (alongside existing probeError + violations triggers) so CI fails the PR.

## Don't
- Don't make the strict pass default-on — it changes existing audit semantics.
- Don't fold the slide-path scan into `collectReferences` — that scan is intentionally narrow and shared with `asset-diagnostic.ts`.
- Don't strip the `/`-prefix filter from `walkPublicPaths` — relative paths and remote URLs aren't in scope and broaden the noise.
