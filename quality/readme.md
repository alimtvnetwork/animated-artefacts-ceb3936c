# quality/

Generated quality evidence — **not hand-edited**. Scripts in `scripts/` write here.

## What goes here
- `audit/` — phase-gate blind-LLM audits, gap matrices, remediation plans, subsystem reports.
- `metrics/` — trend data, e.g. `strict-types-history.json` (appended by `scripts/report-strict-types.ts`).
- `reports/` — generated QA reports, e.g. `reference-qa.md` (from `scripts/reference-qa-report.ts`).

## What does NOT go here
- Specs (those live in `spec/`, including `spec/audit/`).
- Source code, runtime deck data, or hand-written docs.

Regenerate via the matching script in `scripts/` (see `scripts/readme.md`).
