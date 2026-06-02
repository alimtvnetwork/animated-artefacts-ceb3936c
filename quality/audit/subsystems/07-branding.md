# Subsystem: branding

## Spec Statement
Riseup Asia LLC (exact spelling). No Lovable branding (no logo, favicon, og, meta references). Dark Noir & Gold theme: bg #0D0D0D, gold #C9A84C, ember #E85D3A, cream #F0D78C. Brand assets in `src/assets/brand/`. Use `BrandLogo` (auto-swaps light/dark wordmark by theme appearance) — never import logo PNGs directly.

## Implementation State
- `src/assets/brand/` houses logo + `alim-presenter.png`.
- `BrandLogo` component enforces theme-aware swap.
- Constraint probes: `mem://constraints/no-brand-strip.md`, `no-readme-txt.md`. `BrandStripAuditOverlay` + `BrandStripDebugOverlay` mounted globally in `App.tsx`.
- `index.html` clean of Lovable refs.

## Gap
None observed.

## Severity
None.

## Evidence
- spec: `mem://index.md` Core, `mem://design/theme-aware-brand-logo`
- impl: `src/App.tsx:82-114`, `src/slides/components/BrandStripAuditOverlay.tsx`
- test: `src/test/brandChromeInheritance.test.ts`, `chromeContrast.test.ts`

## Remediation
None.
