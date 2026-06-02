# Subsystem: click-reveal

## Spec Statement
Click-reveal slides exist outside the linear flow — only shown when triggered from a parent item. Authoring-time inspector at `/click-reveal-audit` surfaces dependency graph.

## Implementation State
`src/slides/clickRevealAudit.ts`, `src/pages/ClickRevealAuditPage.tsx`, `src/builder/ClickRevealToggle.tsx`. Loader excludes click-reveal slides from linear count.

## Gap
Ambiguity logged in #32 (collapsible sections w/ progress) — surface for that feature undefined; not the same subsystem but adjacent.

## Severity
Minor.

## Evidence
- spec: `mem://index.md` Core
- impl: `src/slides/clickRevealAudit.ts`, `src/pages/ClickRevealAuditPage.tsx`
- test: `src/test/snapRevealShortCircuit.test.ts`

## Remediation
Clarify #32 surface at end of no-questions window.
