# 19 — Brand-hex literal audit

**Date:** 2026-05-16
**Scope:** `scripts/audit-brand-hex.ts`, `src/test/brandHexAudit.test.ts`, `src/slides/components/BrandedQR.tsx`

## Why
Hard-coded brand hexes (`#C9A84C` etc.) silently break per-theme remapping, the brightness fine-tune, and the auto-contrast layer. The Core rule "NEVER hard-code brand hex in components — always `hsl(var(--gold))`" needed an automated guard.

## Change
- New `scripts/audit-brand-hex.ts` scans `src/slides/**` for the brand hex set:
  `#C9A84C` (gold), `#E85D3A` (ember), `#F0D78C` (cream), `#0D0D0D` (ink), `#F3A502` (3D ghost numeral exception), `#FFBE2E` (bright-gold variant) — plus 3-digit and 8-digit (alpha) forms.
- Regex uses a `(?<![\w])#` boundary so hexes inside identifiers/comments are ignored.
- `tokenForHex()` maps each hex to its canonical CSS var token; report includes `file`, `line`, `column`, `match`, `source`, `why`, `fix`.
- Per-line opt-out: append `// brand-hex-ok: <reason>` to legitimate canvas-pixel fills.
- Vitest at `src/test/brandHexAudit.test.ts` (11 tests): full repo scan passes; positive/negative pattern tests; opt-out comment respected.
- `src/slides/components/BrandedQR.tsx` got 3 `// brand-hex-ok:` comments on raw canvas pixel fills (lines 162, 186, 316) — these are runtime composite operations on a pre-cleared canvas, not theme-bound.

## Acceptance
- `bunx vitest run src/test/brandHexAudit.test.ts` → 11/11 pass.
- Adding `color: '#C9A84C'` to any new slide component fails the test with a `fix` hint suggesting `hsl(var(--gold))`.

## Files
- `scripts/audit-brand-hex.ts` (new)
- `src/test/brandHexAudit.test.ts` (new)
- `src/slides/components/BrandedQR.tsx` (3 opt-out comments)
