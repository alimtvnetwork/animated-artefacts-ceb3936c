/**
 * Narrow a `StepSpec.description` (now a string OR a structured 3D
 * object) down to a plain string for renderers that only know the
 * legacy prose form (StepTimeline, FocusTimeline, AdvanceStep).
 *
 * - `string` → returned as-is.
 * - `{ body }` (legacy 3D) → returns the body (renderers can show it raw;
 *   the 3D slide itself uses `deriveBullets()` instead).
 * - `{ bullets }` → joins with `". "` so a non-3D slide that accidentally
 *   inherits a 3D-shaped description still renders something readable.
 * - `undefined` / no usable text → empty string.
 */
export function toDescriptionString(
  desc: undefined | string | { title?: string; bullets?: string[]; meta?: string; body?: string },
): string {
  if (!desc) return '';
  if (typeof desc === 'string') return desc;
  if (typeof desc.body === 'string' && desc.body.trim().length > 0) return desc.body;
  if (Array.isArray(desc.bullets) && desc.bullets.length > 0) {
    return desc.bullets.filter(b => typeof b === 'string' && b.trim().length > 0).join('. ');
  }
  return '';
}
