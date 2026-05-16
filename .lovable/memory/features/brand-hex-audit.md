---
name: brand-hex-audit
description: Vitest-enforced guard banning hard-coded brand hex literals (#C9A84C/#E85D3A/#F0D78C/#0D0D0D/#F3A502/#FFBE2E + 3/8-digit variants) anywhere under src/slides/**. Use hsl(var(--gold|--ember|--cream|--ink)) instead. Per-line opt-out: `// brand-hex-ok: <reason>` (only for raw canvas pixel fills, e.g. BrandedQR composites).
type: constraint
---

## Rule
Slide components MUST reference brand colors via CSS custom properties — `hsl(var(--gold))`, `hsl(var(--ember))`, `hsl(var(--cream))`, `hsl(var(--ink))`. Raw hex literals break per-theme remapping, the brightness fine-tune slider, and the auto-contrast layer.

## Enforcement
- Script: `scripts/audit-brand-hex.ts` — exports `auditBrandHex()` and `auditSource(src, file)`.
- Test: `src/test/brandHexAudit.test.ts` — 11 tests, runs in CI via `bun test` / `bunx vitest run`.
- Detects 6-digit, 3-digit, and 8-digit (alpha) forms of the banned set.
- Boundary regex `(?<![\w])#` ignores hexes inside identifiers/comments.

## Opt-out
Append `// brand-hex-ok: <short reason>` to the same line. Only acceptable for runtime canvas pixel fills (see `BrandedQR.tsx` lines 162/186/316).

## See also
- `updates/spec/19-brand-hex-audit.md`
- Core rule in `mem://index.md`: "NEVER hard-code brand hex in components"
