---
name: reference-qa-report
description: v0.163 — `scripts/reference-qa-report.ts` runs the full reference QA suite (asset existence + dimensions, required glyphs × · §, Ubuntu/Inter font-stack presence) and writes a compact Markdown table to `reports/reference-qa.md`. CI uploads it as the `reference-qa-report` artifact (30d retention) on every push/PR. Exit 0/1/2 mirrors the other audits.
type: feature
---
v0.163.0.

# Why
Spec 25 + the existing vitest guard already verify the manifest, but failures
land inside the test log and aren't easy to scan or share. Spec 55 adds a
single-pass Markdown report that's friendly to PR review and to
`actions/upload-artifact`.

# Script
`scripts/reference-qa-report.ts` — runs three families of checks and writes
one row per check:
1. **assets** — for each `REFERENCE_ASSETS` entry: existence, non-zero size,
   PNG signature, decoded width × height matches manifest.
2. **glyphs** — for each `REQUIRED_GLYPHS` entry: codepoint matches the pinned
   Unicode value (× U+00D7, · U+00B7, § U+00A7).
3. **font stacks** — for `display` (Ubuntu) and `body` (Inter): primary face
   string-present in `tailwind.config.ts`.

Output path defaults to `reports/reference-qa.md`; override with
`REFERENCE_QA_OUT`. Console prints the pass/total summary plus a failure
list. Exit codes: 0 clean, 1 script error, 2 violations — same shape as
`audit-asset-resolutions.ts` so CI can wire it identically.

# CI
New step in `.github/workflows/ci.yml` after `audit:resolutions`. Followed by
an `actions/upload-artifact@v4` step with `if: always()` so failed runs still
publish the report.

# Files
- `scripts/reference-qa-report.ts` — new
- `spec/slides/55-reference-qa-report.md` — full spec
- `package.json` — `qa:reference` script + 0.163.0
- `.github/workflows/ci.yml` — new run + upload steps
