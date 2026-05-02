/**
 * Release registry types.
 *
 * Each release version is an immutable snapshot stored under `src/releases/`.
 * Once a version ships and the corresponding git tag is pushed, the
 * snapshot's contents must not change — that's the contract that lets
 * `/release/v1.1.0` keep showing exactly what shipped, even after we move
 * on to v1.2.0+. Edit a frozen file only to fix a factual error in the
 * historical record (and note the correction inline).
 */

export interface ReleaseChecklistItem {
  id: string;
  label: string;
  detail?: string;
  status: 'done' | 'todo' | 'manual';
}

export interface ReleaseBuildStatus {
  status: 'pass' | 'fail' | 'unknown';
  durationSec?: number;
  builtAt: string;
  notes: string[];
}

export interface ReleaseSnapshot {
  /** e.g. "1.1.0" — must match the `package.json` version that shipped. */
  version: string;
  /** Tag name actually pushed to the remote (typically `v${version}`). */
  tag: string;
  /** Human title for the release page + GitHub Release. */
  title: string;
  /** One-paragraph summary, rendered under the title. */
  summary: string;
  /** ISO date the version was tagged / published. */
  releasedAt: string;
  /** `true` after the tag is pushed — page renders a "frozen" banner. */
  frozen: boolean;
  build: ReleaseBuildStatus;
  checklist: ReleaseChecklistItem[];
  /** Multi-line shell snippet for the tag command block. */
  tagCommand: string;
  /** Anchor id in `readme.md` to deep-link the release notes. */
  readmeAnchor: string;
}
