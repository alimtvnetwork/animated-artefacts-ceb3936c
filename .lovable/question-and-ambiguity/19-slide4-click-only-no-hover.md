# 19 — Slide 4 click-only, no hover

## Ambiguity
User has now twice rejected hover effects on slide 4 step cards. Previous
implementation kept a CSS `:hover` glow ring + marker brightening + lift on
inactive cards. User wants click-only with the activation animation as the
sole feedback.

## Decision
- Strip ALL `:hover` rules from `.chain3d-card`, `.chain3d-card-visual`,
  `.chain3d-marker`. No glow, no brightness, no transform, no marker
  scale/opacity change on hover.
- Keep `cursor: pointer` on cards as the only hover affordance.
- Click → existing bouncy zoom / revolver activation animation IS the
  user feedback.
- No JS hover state was present (already removed prior task).
- Updated specs: `spec/21-slides-system/61-steps-chain-3d.md`,
  `front-end/project/showcase/spec/04-process-3d.md`.
- Added memory constraint `mem://constraints/no-hover-on-steps-chain-3d`
  + Core line in `mem://index.md` so this never regresses again.
