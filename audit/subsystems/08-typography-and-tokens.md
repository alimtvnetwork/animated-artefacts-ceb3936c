# Subsystem: typography-and-tokens

## Spec Statement
Titles Ubuntu Bold; body Inter (Apple system fallback); capsules Inter Medium. Semantic tokens in `index.css` and `tailwind.config.ts`; never raw hex in components. Text weight shadow auto-applied to semantic classes (`.slide-title-display`, `.slide-eyebrow`, `.step-title`). Density caps from addendum 29: `KeywordSlide` ≤6, `CapsuleListSlide` ≤3 sections × ≤6, `DataTableSlide` ≤5 cols × ≤8 rows, `NumberCalloutSlide` = 1 number, `EquationSlide` = 1 equation, `DatabaseDiagramSlide` ≤5 entities × ≤6 rels.

## Implementation State
- `index.css` defines `--text-shadow-weight-*`, deck-wide typography clamps (#22, #23), step-title 3D tokens (#24).
- `src/test/textWeightShadowTokens.test.ts` asserts auto-application.
- Hardcoded-white audit (`hardcodedWhiteAudit.test.ts`, `scripts/audit-hardcoded-white.ts`) defends the no-raw-hex rule.

## Gap
- Density caps from addendum 29 not enforced. `KeywordSlide` ≤6 is currently a convention.
- `--dur-count-fast/slow` not yet in tokens (also flagged in #02).

## Severity
Minor.

## Evidence
- spec: `mem://index.md` Core, `29-narrow-idea-and-new-slide-types.md` §1
- impl: `src/index.css`, `tailwind.config.ts`
- test: `src/test/textWeightShadowTokens.test.ts`, `hardcodedWhiteAudit.test.ts`

## Remediation
1. Add density-cap assertions to `contracts.test.ts` keyed off `densityCheck` field on sample specs.
2. Ship count-up tokens in same patch as `useCountUp` hook.
