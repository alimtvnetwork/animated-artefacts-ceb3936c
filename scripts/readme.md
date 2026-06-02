# scripts/

Project tooling. Run with `bun <script>` (TS) or the package.json aliases.
Nothing here ships in the app bundle — these are build/audit/release helpers.

## What goes here
- One-off and CI audit/check scripts (`audit-*.ts`, `check-*.ts`, `*-audit.ts`).
- Release + maintenance tooling (`release-tag-and-build.ts`, `preflight.ts`,
  `new-deck.ts`, `update-version-badge.ts`, `migrate-*`).
- `install/` — environment installers (`slides-install.sh/.ps1`, `run.ps1`).
- `git-hooks/` + `install-git-hooks.sh` — local git hook setup.

## Index
| Script | Purpose |
|---|---|
| `audit-asset-resolutions.ts` / `asset-diagnostic.ts` / `check-deck-assets.ts` / `suggest-asset-constraints.ts` | Asset path + resolution audits. |
| `audit-brand-hex.ts` / `audit-hardcoded-white.ts` / `contrast-audit.ts` | Color/theme-token compliance audits. |
| `audit-capsule-wiring.mjs` / `audit-click-reveal.ts` | Slide-feature wiring audits. |
| `check-catalog-drift.ts` | Detects drift between LLM CATALOG.json and contracts. |
| `motion-variety-audit.ts` / `step-timeline-contrast-report.ts` | Animation + step-timeline QA reports. |
| `prerender-equations.ts` | Pre-renders math equations. |
| `reference-qa-report.ts` | Generates reference QA report (→ `quality/reports/`). |
| `report-strict-types.ts` | Strict-types metric (→ `quality/metrics/`). |
| `new-deck.ts` | Scaffolds a new deck. |
| `preflight.ts` | Pre-commit/CI gate (tsc + lint + test + build). |
| `release-tag-and-build.ts` / `extract-changelog.ts` / `update-version-badge.ts` | Release flow. |
| `migrate-to-front-end-project.mjs` | Historical migration helper. |
| `install/` | Environment installers + run helper. |
| `install-git-hooks.sh` + `git-hooks/` | Git hook setup. |
