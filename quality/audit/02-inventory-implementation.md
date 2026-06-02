# 02 — Inventory: Implementation

Runtime scan, 2026-05-01.

## Slide runtime — `src/slides/`
- **Enums** (`enums.ts`): `SlideType` (17 values), `SlideTransition` (5), `TextAnimation` (4), `CapsuleColor` (9), `ControllerPosition` (2).
- **Types & schema** (`types.ts`, `schema.ts`, `contracts.ts`): Zod source of truth, runtime contract assertions.
- **Loader** (`loader.ts`, `manifest.ts`): per-deck load + `slideContractIssues`, `brandStripAudit`, broken-asset reporting.
- **Stage** (`SlideStage.tsx`) + 17 type components in `src/slides/types/` (matches enum 1:1).
- **Motion**: `transitions.ts`, `transitionPresets.ts`, `transitionOverride.ts`, `textAnimations.ts`, `motionPreferences.ts`, `motionCollisions.ts`, `stepTiming.ts`.
- **Audio**: `sound.ts`.
- **Reveal**: `clickRevealAudit.ts`, `proseToBullets.ts`, `normalize3DBullets.ts`.
- **Assets**: `assetRegistry.ts`, `referenceAssetsManifest.ts`, `runtimeImageQA.ts`, `brokenAssetReport.ts`, `preload.ts`, `checkImportedAssets.ts`.
- **Export**: `export.ts`, `exportPptx.ts`, `exportSchemas.ts`.
- **Validation**: `validationMode.ts`.

## Routes — `src/App.tsx`
`/`, `/:slideNumber`, `/slide/:n`, `/present`, `/builder`, `/style-guide`, `/settings`, `/handout`, `/motion-demo`, `/click-reveal-audit`, `/theme-preview`, `/image-placement`, `/preview-diagnostics`, `/release`, `/release/:version`, `*` → NotFound.

## Pages — `src/pages/`
17 page components. ReleaseChecklistPage + ReleaseIndexPage backed by `src/releases/` registry (1 frozen release v1.1.0).

## Builder — `src/builder/`
Draft model, field schemas, 3D bullet validation, normalize action, hotspot/box editors, conversion preview.

## Tests — `src/test/`
44 test files covering: contracts, schema, capsule contrast/layout, brand chrome, broken-asset overlay, deck contrast audit, transition timing, hardcoded-white audit, image placement, motion collisions/preferences, reference assets, slide4 visual QA, step offsets, step reveal order, step-timeline contrast, steps-chain-3D depth/responsive/navigation, sync, text animation overrides, text weight shadow tokens, theme QA, theme resolution, transition timing by type, validation mode.

## Build / CI
- `.github/workflows/{ci,release}.yml`
- `scripts/`: 18 audit/build/release scripts (preflight, contrast-audit, click-reveal, asset-resolution, runtime-image-qa, release-tag-and-build, extract-changelog, etc.).

## Gaps at a glance vs. spec
- 4 slide types in addendum 29 (DB / Table-narrow / NumberCallout / Equation) — **not built**.
- `--dur-count-fast/slow` tokens — not in `index.css`.
- Mermaid + KaTeX dependencies — not in `package.json`.
- No `front-end/project/sample/` deck (specs only).
