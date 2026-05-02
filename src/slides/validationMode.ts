/**
 * Configurable per-deck validation mode.
 *
 * # Why
 * `loader.ts` validates every slide against the per-type zod contract from
 * `contracts.ts`. Historically the runtime path was *always* lenient: log a
 * warning, render anyway. That is great while authoring, but production /
 * CI / strict-handoff scenarios want the loader to **refuse to boot** a
 * deck with even one contract violation, so a broken slide can never reach
 * an audience.
 *
 * # Modes
 * - `'warn'`   (default) — current behaviour. Issues are collected into
 *                          `slideContractIssues`, surfaced by the
 *                          `ContractIssuesOverlay`, and `console.warn`'d.
 *                          The deck still renders.
 * - `'strict'`            — if any slide fails its contract during boot,
 *                          throw an aggregated Error with every violation
 *                          (slide #, name, dotted path, message). The
 *                          React tree never mounts; the user sees the
 *                          static `<noscript>`-style failure overlay.
 *
 * # Persistence
 * Stored in `localStorage[VALIDATION_MODE_KEY]`. The Settings page lets
 * the user pick a mode and the change applies on next reload (the choice
 * is read once at module import inside `loader.ts` because validation
 * runs at module-init time).
 *
 * # URL override
 * `?validation=strict` or `?validation=warn` in the address bar wins over
 * the stored choice for the current page-load only — useful for one-off
 * QA runs without changing the persisted setting.
 */

export type ValidationMode = 'warn' | 'strict';

export const VALIDATION_MODE_KEY = 'riseup.validationMode.v1';
export const DEFAULT_VALIDATION_MODE: ValidationMode = 'warn';

const VALID_MODES: readonly ValidationMode[] = ['warn', 'strict'];

function isMode(value: unknown): value is ValidationMode {
  return typeof value === 'string' && (VALID_MODES as readonly string[]).includes(value);
}

/**
 * Resolve the active validation mode for *this* page-load.
 *
 * Priority: URL param (`?validation=…`) > localStorage > default.
 * Safe in non-browser environments (SSR / vitest jsdom-less): falls back
 * to the default without throwing.
 */
export function getValidationMode(): ValidationMode {
  if (typeof window === 'undefined') return DEFAULT_VALIDATION_MODE;
  // URL override — one-off QA without touching the persisted setting.
  try {
    const url = new URL(window.location.href);
    const param = url.searchParams.get('validation');
    if (isMode(param)) return param;
  } catch {
    /* malformed URL — fall through to storage */
  }
  try {
    const stored = window.localStorage.getItem(VALIDATION_MODE_KEY);
    if (isMode(stored)) return stored;
  } catch {
    /* storage blocked (private mode, quota) — fall through */
  }
  return DEFAULT_VALIDATION_MODE;
}

/** Persist the mode. Reads take effect on next reload (loader runs once at import). */
export function setValidationMode(mode: ValidationMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VALIDATION_MODE_KEY, mode);
  } catch {
    /* storage blocked — non-fatal */
  }
}

/** Clear the persisted choice → next reload uses the default. */
export function resetValidationMode(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(VALIDATION_MODE_KEY);
  } catch {
    /* storage blocked — non-fatal */
  }
}
