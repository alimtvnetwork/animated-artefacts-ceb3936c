# 54 — hardcoded-white audit cleared (5 → 0)

**Date:** 2026-05-01
**Trigger:** `next hardcoded-white`

## Findings (all 5 closed)

| File | Line | Finding | Resolution |
|---|---|---|---|
| `src/slides/components/SlidePreviewAlignmentOverlay.tsx` | 295, 322 | `color: 'hsl(0 0% 100%)'` on red dev-overlay labels | Annotated `// hardcoded-white-ok: dev alignment-overlay label on red background, never user-visible` |
| `src/slides/types/QrMeetingSlide.tsx` | 156 | `background: '#ffffff'` on QR substrate | Annotated `// hardcoded-white-ok: QR code substrate MUST stay pure white for reliable scanner contrast — any theme tint breaks scanability` |
| `src/slides/types/StepsChain3DSlide.tsx` | 346 → 352 | `color: overridden ? 'hsl(var(--ember))' : undefined` flagged as `inline-color` (false positive — regex sees `color: overridden`, not the var-string) | Hoisted literal to module-level `const EMBER_TOKEN = 'hsl(var(--ember))'` (DRY + intent-revealing) and added a `{/* hardcoded-white-ok: theme-aware ternary */}` JSX-comment opt-out |
| `src/slides/types/StepsChain3DSlide.tsx` | 1988 → 1994 | `color: '#ff00ff'` in `CENTERLINES · Shift+L` dev diagnostic overlay | Annotated `{/* hardcoded-white-ok: dev centerlines diagnostic (Shift+L) — magenta intentional */}` |

## Audit-script tweak — JSX-friendly opt-out

The existing `OPT_OUT` regex required a `//` line comment, which is a syntax
error inside JSX `{...}` braces. Authors couldn't annotate JSX literals.

```ts
// Before
const OPT_OUT = /\/\/\s*hardcoded-white-ok\b\s*:?\s*(.*)$/i;

// After (accepts both `//` and `/* */` markers)
const OPT_OUT = /(?:\/\/|\/\*)\s*hardcoded-white-ok\b\s*:?\s*([^*\n]*)/i;
```

The trailing `[^*\n]` (vs. `.*$`) safely terminates the captured reason
before the closing `*/` so the reason field stays clean for the report.

`OPT_OUT` is matched against the **raw** line *before* `stripComments`
runs, so the marker survives even though the rest of the block comment
gets stripped by the comment state machine. No double-counting.

## Final state
- `src/test/hardcodedWhiteAudit.test.ts`: **14 / 14 passing** (was 13 / 14).
- TypeScript: `tsc -p tsconfig.app.json --noEmit` exits 0.
- Strict-types CI gate (#52) and pre-push hook (#53) still green.

## Why annotations vs. refactor
- The 4 literal-color annotations are all **legitimately scoped**: dev
  overlays, QR substrates with hard scanner-contrast requirements, and
  intentional debug magenta. Replacing them with theme tokens would
  break their actual purpose.
- The audit script was the right place to absorb JSX-friendly opt-outs;
  this is a one-time fix that benefits every future JSX call-site.
