# Subsystem: navigation-and-url

## Spec Statement
Flat `/N` routing (e.g. `/2` = slide 2). URL syncs on every navigation. Deep-linkable. Aliases `/slide/N` and `/?slide=N` redirect to canonical `/N`.

## Implementation State
`src/App.tsx` defines `RootSlideQueryRedirect`, `SlideAliasRedirect`, `/:slideNumber` → `SlideDeckPage`. `SlideDeckPage` owns URL sync via `useNavigate`. NotFound on wildcard.

## Gap
None.

## Severity
None.

## Evidence
- spec: `mem://index.md` Core, `spec/21-slides-system/00-fundamentals.md`
- impl: `src/App.tsx:41-59,121-154`, `src/pages/SlideDeckPage.tsx`
- test: `src/test/syncMessage.test.ts`

## Remediation
None required.
