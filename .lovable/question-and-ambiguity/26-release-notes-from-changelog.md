# 26 · v1.1.0 release notes auto-extracted from readme.md changelog

**Date:** 2026-04-30
**Trigger:** User: "Generate a formatted release notes section for v1.1.0 directly from the readme.md changelog and insert it into the GitHub release draft."

## What shipped

1. **`scripts/extract-changelog.ts`** — pulls the `## vX.Y.Z — …` section from `readme.md` (lowercase; the project's combined README + changelog), strips the duplicate version heading, demotes inner `###` → `##` for clean hierarchy under GitHub's Release-title h1 chrome, and emits the body to stdout (and optionally `--out`). Tolerates both heading shapes used in the repo: `## vX.Y.Z — …` (current) and bare `vX.Y.Z — …` (older entries) — same regex matches both as terminators.
2. **`package.json`** — added `release:notes` script.
3. **`.github/workflows/release.yml`** — new "Extract changelog section from readme.md" step runs `release:notes --out changelog-section.md` and prepends its contents to the release body, followed by a `---` separator and the existing build-verification + reproduce-locally blocks. Missing changelog (exit 2) is a soft warning, not a failure — the build-verification block still publishes.

## Decisions

- **Source file is `readme.md` (lowercase), not `readme.md`.** Confirmed by reading both: `readme.md` is the public quick-start and just *links to* `readme.md` for the changelog. Script prefers lowercase, falls back to uppercase only if the lowercase doesn't exist.
- **Strip the leading `## v1.1.0` heading.** The GitHub Release page already shows the tag and "Release v1.1.0" title above the body; a duplicate `## v1.1.0` reads as noise. Demoting `###` → `##` keeps the hierarchy correct after the strip.
- **Soft-fail on missing section.** A future tag bumped before the changelog is written shouldn't block the release — workflow logs `::warning::` and publishes the verification block alone.

## Verification

- `bun run release:notes` → 3.1KB clean Markdown body, lines 3-35 of `readme.md`, no duplicate heading, demoted hierarchy.
- `bun ./scripts/extract-changelog.ts 9.9.9` → exit 2 (matches workflow contract).

## Why no question

No-questions mode active (26/40). Source file ambiguity (`readme.md` vs `readme.md`) was resolved by reading the files; demote-or-keep heading depth was a judgment call (kept it simple: strip + demote = standard GitHub Release rendering).
