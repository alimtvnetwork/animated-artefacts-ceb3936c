/**
 * Release registry.
 *
 * Append a new entry here when cutting a release. Order does not matter —
 * the latest is computed by sorting on `releasedAt` desc. The route
 * `/release/:version` (e.g. `/release/v1.1.0`) reads from `RELEASES_BY_TAG`.
 * `/release` redirects to the latest.
 */
import type { ReleaseSnapshot } from './types';
import { RELEASE_V1_1_0 } from './v1_1_0';

export const RELEASES: ReleaseSnapshot[] = [RELEASE_V1_1_0];

/** Lookup by tag (`v1.1.0`) or bare version (`1.1.0`) — both accepted. */
export const RELEASES_BY_TAG: Record<string, ReleaseSnapshot> = RELEASES.reduce(
  (acc, r) => {
    acc[r.tag] = r;
    acc[r.version] = r;
    return acc;
  },
  {} as Record<string, ReleaseSnapshot>,
);

export function getLatestRelease(): ReleaseSnapshot {
  // releasedAt is ISO (YYYY-MM-DD) so lexicographic sort matches chronological
  return [...RELEASES].sort((a, b) => (a.releasedAt < b.releasedAt ? 1 : -1))[0];
}

export function findRelease(versionOrTag: string): ReleaseSnapshot | undefined {
  return (
    RELEASES_BY_TAG[versionOrTag] ??
    // also accept "v1.1.0" stripped to "1.1.0" or vice-versa, just in case
    RELEASES_BY_TAG[versionOrTag.replace(/^v/, '')] ??
    RELEASES_BY_TAG[`v${versionOrTag}`]
  );
}

export type { ReleaseSnapshot, ReleaseChecklistItem, ReleaseBuildStatus } from './types';
