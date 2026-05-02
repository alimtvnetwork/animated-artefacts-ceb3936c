# Subsystem: per-project-spec-workflow

## Spec Statement
Each deck lives at `front-end/project/<slug>/{data,spec}/`. `data/slides.json` manifest + `data/slides/NN-name.json` per slide. `spec/NN-name.md` companion docs. Theme JSON overlays under `front-end/themes/<theme>/`. Slide-template defaults at `front-end/slide-template/`.

## Implementation State
Decks: `showcase`, `navy-showcase`, `test-step-light`. Theme: `noir-gold`. Templates: 12 type pairs. Loader (`src/slides/loader.ts`) consumes `slides.json` manifest. Migration scripted in `scripts/migrate-to-front-end-project.mjs` (#18).

## Gap
- Phase 1 sample deck specs live at `spec/26-slide-definitions/sample/` but no `front-end/project/sample/` runtime deck yet (intentional — Phase 3 dependency).

## Severity
Minor.

## Evidence
- spec: ambiguity #18
- impl: `front-end/project/`, `src/slides/loader.ts`, `scripts/migrate-to-front-end-project.mjs`
- test: `src/test/spec-parity.test.ts`

## Remediation
Phase 3: migrate `spec/26-slide-definitions/sample/{40..43}.json` → `front-end/project/sample/data/slides/`.
