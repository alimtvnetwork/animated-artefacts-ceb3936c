---
name: validation-mode
description: Configurable per-deck validation mode (warn vs strict) controls how loader.ts reacts to slide contract violations
type: feature
---
# Validation mode

`src/slides/validationMode.ts` exposes a user-configurable mode that gates `loader.ts`'s contract-violation handling:

- **`'warn'` (default)** — issues are collected into `slideContractIssues`, console.warn'd, and surfaced in the `ContractIssuesOverlay`. Deck still renders.
- **`'strict'`** — `loader.ts` throws an aggregated multi-line Error at module-init if any slide fails its contract. React tree never mounts; Vite overlay shows the failure.

## Persistence
- localStorage key: `riseup.validationMode.v1`
- URL override per page-load: `?validation=strict|warn` (wins over storage)
- Default exported as `DEFAULT_VALIDATION_MODE` = `'warn'`

## Surfaces
- `loader.ts` exports `validationMode` (the resolved active mode for this load)
- `ContractIssuesOverlay` renders a colored badge with the active mode
- `/settings` → "Validation mode" section: two-card picker, dirty banner with "Reload now" button, URL-override hint

## Tests
`src/test/validationMode.test.ts` — covers persistence, reset, invalid-value rejection, URL override priority. Note: tests use `window.location.origin` to avoid jsdom replaceState cross-origin SecurityError.
