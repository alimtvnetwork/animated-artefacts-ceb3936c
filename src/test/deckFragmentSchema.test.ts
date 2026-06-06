import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../../spec/21-slides-system/slide.schema.json';

/**
 * Fragment-parity gate.
 *
 * Every per-slide JSON fragment under `front-end/project/<deck>/data/slides/`
 * MUST validate against the canonical authoring schema. This catches the
 * class of drift fixed in v1.4.0 / v1.5.0 — where the schema grew stricter
 * than the runtime zod contracts (`src/slides/contracts.ts`) and silently
 * rejected valid authored decks.
 *
 * Fragments are bundled eagerly so the test runs in jsdom without fs.
 */
const fragments = import.meta.glob(
  '../../front-end/project/*/data/slides/*.json',
  { eager: true, import: 'default' },
) as Record<string, unknown>;

function makeAjv(): Ajv {
  const ajv = new Ajv({ allErrors: false, strict: false });
  addFormats(ajv);
  return ajv;
}

function isSlideFragment(payload: unknown): payload is { slideType: string } {
  if (typeof payload !== 'object' || payload === null) return false;
  return 'slideType' in payload;
}

describe('deck fragments validate against slide.schema.json', () => {
  const validate = makeAjv().compile(schema as object);

  it('discovers the bundled fragments', () => {
    expect(Object.keys(fragments).length).toBeGreaterThan(0);
  });

  it('every fragment passes the canonical schema', () => {
    const failures: { file: string; errors: unknown }[] = [];
    for (const [file, payload] of Object.entries(fragments)) {
      if (!isSlideFragment(payload)) continue;
      if (validate(payload)) continue;
      failures.push({ file, errors: validate.errors });
    }
    if (failures.length) {
      const msg = failures
        .map((f) => `${f.file}\n${JSON.stringify(f.errors, null, 2)}`)
        .join('\n\n');
      throw new Error(`Deck fragments failed schema:\n${msg}`);
    }
    expect(failures).toHaveLength(0);
  });
});
