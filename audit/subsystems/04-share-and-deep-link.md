# Subsystem: share-and-deep-link

## Spec Statement
Controller share button copies either full-deck URL or current-slide URL.

## Implementation State
Controller pill exposes share action; flat `/N` routes mean the URL bar already is the deep link. Aliases ensure shared URLs from autofill resolve.

## Gap
None observed.

## Severity
None.

## Evidence
- spec: `mem://index.md` Core; `src/assets/controller-reference/controller-pill.png`
- impl: `src/slides/controls/`, `src/App.tsx` redirects

## Remediation
None.
