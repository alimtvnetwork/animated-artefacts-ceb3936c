/**
 * Legacy `description.body` → `bullets[]` auto-converter.
 *
 * Older decks (pre v0.213) stored the right-panel narrative as a single
 * `description.body` prose string. The keywords-only contract now requires
 * `description.bullets[]`. To avoid breaking any deck that hasn't been
 * hand-migrated, the StepsChain3D renderer calls `deriveBullets()` which:
 *
 *   1. Returns `bullets` verbatim when present and non-empty (authored wins).
 *   2. Otherwise splits a legacy `body` string on `.`, `;`, or `,` —
 *      trims each fragment, drops empties, dedupes (case-insensitive),
 *      and caps at 6 fragments to fit the right panel.
 *   3. Returns `undefined` when neither field carries content.
 *
 * Order of precedence is intentional: an author who has migrated to
 * `bullets[]` should never see their content silently overwritten by a
 * lingering `body` field.
 */
export function deriveBullets(
  description: { bullets?: ReadonlyArray<string>; body?: unknown } | undefined,
): string[] | undefined {
  if (!description) return undefined;

  // 1. Authored bullets win.
  if (Array.isArray(description.bullets) && description.bullets.length > 0) {
    return description.bullets.filter((b): b is string => typeof b === 'string' && b.trim().length > 0);
  }

  // 2. Auto-convert legacy body string.
  if (typeof description.body !== 'string') return undefined;
  const body = description.body.trim();
  if (!body) return undefined;

  // Split on sentence/clause boundaries: `.`, `;`, `,`. Keep the negative
  // lookahead off — we want all three treated equally as keyword separators.
  const fragments = body
    .split(/[.;,]+/)
    .map(f => f.trim())
    .filter(f => f.length > 0);

  // Dedupe case-insensitively, preserve first-occurrence casing.
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const f of fragments) {
    const k = f.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(f);
  }

  if (unique.length === 0) return undefined;
  return unique.slice(0, 6);
}
