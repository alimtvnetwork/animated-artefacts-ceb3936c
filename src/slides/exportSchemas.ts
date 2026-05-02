/**
 * Schema export — converts the live runtime zod contracts in
 * `src/slides/contracts.ts` into a single versioned JSON-Schema artifact
 * (`slide-types.v{N}.json`) suitable for:
 *
 *   - External deck editors (autocomplete + inline validation against the
 *     same rules the runtime enforces).
 *   - CI lint pipelines (`ajv validate -s slide-types.v1.json -d slide.json`).
 *   - Cross-team contracts (one file describes every slideType's `content`
 *     shape, replacing the hand-maintained `spec/slides/slide.schema.json`
 *     for downstream consumers that want the *runtime* truth).
 *
 * # Why generate from the runtime contracts?
 * The hand-maintained `spec/slides/slide.schema.json` is the authoring
 * reference that ships with the repo. The exported artifact here is
 * machine-derived from the SAME zod schemas that gate the loader at boot,
 * so it is impossible for the artifact and the runtime to drift — the
 * common failure mode of dual-source schema setups.
 *
 * # Filename / version
 * `SLIDE_CONTRACTS_VERSION` (declared in `contracts.ts`) is baked into the
 * artifact filename AND its top-level `version` field, so downstream caches
 * can detect a bump and re-pull. Bump the constant whenever any per-type
 * contract gains a field, tightens a bound, or a new slideType ships.
 */
import { zodToJsonSchema } from 'zod-to-json-schema';
// Plain anchor-download — no file-saver dep needed.
import {
  SLIDE_CONTENT_CONTRACTS,
  SLIDE_CONTRACTS_VERSION,
} from './contracts';

/**
 * Build the export artifact (in-memory) — pure function so it can be unit
 * tested AND reused by future CLI/CI scripts that may want to dump the same
 * file outside the browser. Never touches the DOM or filesystem.
 */
export function buildSlideTypesArtifact(): {
  $schema: string;
  $id: string;
  version: number;
  generatedAt: string;
  description: string;
  slideTypes: Record<string, unknown>;
} {
  // Convert each per-slideType zod contract independently so each schema
  // gets its own `definitions` block — easier for downstream consumers to
  // reference one type without dragging the whole union along.
  const slideTypes: Record<string, unknown> = {};
  for (const [slideType, schema] of Object.entries(SLIDE_CONTENT_CONTRACTS)) {
    slideTypes[slideType] = zodToJsonSchema(schema, {
      name: `${slideType}Content`,
      // draft-07 matches the hand-maintained `spec/slides/slide.schema.json`
      // so existing tooling (Ajv default mode, VSCode JSON IntelliSense)
      // can consume this artifact without configuration.
      target: 'jsonSchema7',
    });
  }

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://riseupasia.com/spec/slides/slide-types.v${SLIDE_CONTRACTS_VERSION}.json`,
    version: SLIDE_CONTRACTS_VERSION,
    generatedAt: new Date().toISOString(),
    description:
      'Per-slideType content contracts, machine-derived from the runtime zod schemas in ' +
      'src/slides/contracts.ts. Use the per-type definitions under `slideTypes[<SlideType>]` ' +
      'to validate the `content` field of a slide of that type. Bump `version` whenever any ' +
      'contract changes shape (corresponding to a new artifact filename slide-types.v{N}.json).',
    slideTypes,
  };
}

/**
 * Trigger a browser download of the current artifact. Pretty-printed
 * (2-space indent) so a human can diff two versions in any editor — the
 * file is small (≈10–20KB) so prettiness costs nothing.
 */
export function downloadSlideTypesArtifact(): string {
  const artifact = buildSlideTypesArtifact();
  const filename = `slide-types.v${SLIDE_CONTRACTS_VERSION}.json`;
  const blob = new Blob([JSON.stringify(artifact, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}
