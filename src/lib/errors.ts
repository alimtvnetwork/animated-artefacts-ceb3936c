/**
 * Sanctioned helpers for working with `unknown` values caught from `try/catch`,
 * Promise rejections, and other trust-boundary surfaces.
 *
 * These helpers exist so that day-to-day error handling does NOT need to
 * disable the `@typescript-eslint/no-unsafe-*` rules at every call site.
 *
 * Policy: see `spec/architecture/typescript-unknown-policy.md`.
 *
 * Usage:
 *   try { ... }
 *   catch (e) {
 *     console.error(errorMessage(e));
 *   }
 */

/** Extract a human-readable message from any caught value. */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  try {
    return JSON.stringify(e);
  } catch {
    return "Unknown error";
  }
}

/** Narrow an unknown value to `Error` (with a synthetic Error fallback). */
export function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  return new Error(errorMessage(e));
}

/** Type guard: did this throw an Error instance? */
export function isError(e: unknown): e is Error {
  return e instanceof Error;
}
