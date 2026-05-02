import { describe, it, expect } from 'vitest';
import { buildSlideTypesArtifact } from '../slides/exportSchemas';
import { SLIDE_CONTENT_CONTRACTS, SLIDE_CONTRACTS_VERSION } from '../slides/contracts';

/**
 * Verifies the runtime-derived JSON Schema export stays in lockstep with
 * the zod registry. If a new slideType is added to `SLIDE_CONTENT_CONTRACTS`
 * but the export forgets to surface it, this test fires.
 */
describe('exportSchemas', () => {
  it('artifact contains an entry for every registered slideType', () => {
    const artifact = buildSlideTypesArtifact();
    const registered = Object.keys(SLIDE_CONTENT_CONTRACTS).sort();
    const exported = Object.keys(artifact.slideTypes).sort();
    expect(exported).toEqual(registered);
  });

  it('artifact carries the current contract version + draft-07 schema', () => {
    const a = buildSlideTypesArtifact();
    expect(a.version).toBe(SLIDE_CONTRACTS_VERSION);
    expect(a.$schema).toMatch(/json-schema\.org\/draft-07/);
    expect(a.$id).toMatch(/slide-types\.v\d+\.json$/);
  });

  it('every exported per-type schema is a non-empty JSON Schema object', () => {
    const a = buildSlideTypesArtifact();
    for (const [type, schema] of Object.entries(a.slideTypes)) {
      expect(schema, `${type} should be an object`).toBeTypeOf('object');
      expect(schema, `${type} schema should not be null`).not.toBeNull();
      // zod-to-json-schema always emits at least a `type` or `$ref` at the top.
      const keys = Object.keys(schema as Record<string, unknown>);
      expect(keys.length, `${type} schema should be non-empty`).toBeGreaterThan(0);
    }
  });
});
