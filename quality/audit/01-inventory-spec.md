# 01 — Inventory: Spec

Authoritative spec sources, scanned 2026-05-01.

## System rules — `spec/21-slides-system/`
62 numbered docs (00-fundamentals → 61-steps-chain-3d) + `99-qa-layout-checklist.md`. Schemas: `deck.schema.json`, `slide.schema.json`, `deck-manifest.schema.json`, `deck.example.json`. LLM dossier: `llm/CATALOG.json` (machine truth) + companion docs (00-README, 06-json-authoring-cheatsheet, 23-slide-type-contracts, 28-component-and-animation-catalog).

## Catalog totals (`llm/CATALOG.json` v1.0.0, 2026-04-30)
- 17 slideTypes
- 5 slideTransitions (FadeIn / SlideIn / PushIn / PushLeft / PushRight)
- 4 textAnimations (FadeIn / Bounce / SlideUp / Stagger)
- 9 capsuleColors (gold, ember, cream, ink, outline, violet, teal, rose, sky)
- 2 controllerPositions (BottomCenter / TopRight)
- 6 capsuleExpandAnimations
- 3 capsuleLabelAnimations
- 3 step motion variants (lift / slide / parallax)
- 2 click-reveal triggers

## Addendum — `29-narrow-idea-and-new-slide-types.md`
Adds 4 *spec-only* slide types (not yet in runtime): `DatabaseDiagramSlide`, `DataTableSlide`, `NumberCalloutSlide`, `EquationSlide`. Adds `CountUp` easing union, `--dur-count-fast/slow` tokens, Mermaid CSS-token theme, density caps.

## Sample deck — `spec/26-slide-definitions/sample/`
Four JSON+MD pairs (40-43) carrying `narrowIdea` + `densityCheck`. No runtime mapping yet.

## Decks in production
- `front-end/project/showcase/`
- `front-end/project/navy-showcase/`
- `front-end/project/test-step-light/`
- `front-end/slide-template/` (per-type author templates, 12 types covered)

## Memory rules (binding)
Core lines in `mem://index.md` + 8 detail entries: text-weight-shadow, qr-safety-mode, theme-aware-brand-logo, 3d-ghost-numeral-color, slide-narrow-idea, no-questions-mode, no-brand-strip, no-hover-on-steps-chain-3d.

## Operating-mode prompts
- `.lovable/prompts/01-no-questions.md` — 40-task no-questions window.
- `.lovable/coding-guidelines.md` — 12 rules.
