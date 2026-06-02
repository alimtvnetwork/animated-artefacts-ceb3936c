# Subsystem: static-deploy-and-asset-copy

## Spec Statement
`dist/` packaged as `riseup-asia-slides-<tag>.{zip,tar.gz}` + `SHA256SUMS`. Attached to GitHub Release via `action-gh-release`. Release body lists artifact sizes + SHA-256. `fail_on_unmatched_files: true`. Changelog section extracted from `readme.md` and prepended to body.

## Implementation State
- `.github/workflows/release.yml`
- `scripts/release-tag-and-build.ts`, `extract-changelog.ts`
- Versioned release registry at `src/releases/` with frozen v1.1.0 snapshot, surfaced at `/release` (index) and `/release/:version`.

## Gap
None observed.

## Severity
None.

## Evidence
- spec: ambiguity notes #26, #27
- impl: `.github/workflows/release.yml`, `scripts/release-tag-and-build.ts`, `src/releases/v1_1_0.ts`

## Remediation
None.
