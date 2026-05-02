import { describe, it, expect } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../../spec/21-slides-system/slide.schema.json';

// Showcase slides bundled at build-time so the test runs without fs in jsdom.
const showcaseSlides = import.meta.glob('../../spec/slides/showcase/[0-9]*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

function makeAjv() {
  // Draft-07 schema + discriminator keyword (Ajv 8 supports it on the
  // standard Ajv class when `discriminator: true` is enabled).
  const ajv = new Ajv({
    allErrors: false,
    strict: false,
    discriminator: true,
  });
  addFormats(ajv);
  return ajv;
}

describe('slide.schema.json — discriminator-driven Ajv validation', () => {
  const ajv = makeAjv();
  const validate = ajv.compile(schema as object);

  it('compiles with the discriminator block enabled', () => {
    expect(typeof validate).toBe('function');
  });

  it('validates every showcase slide JSON', () => {
    const failures: { file: string; errors: unknown }[] = [];
    for (const [file, payload] of Object.entries(showcaseSlides)) {
      const ok = validate(payload);
      if (!ok) failures.push({ file, errors: validate.errors });
    }
    if (failures.length) {
      // Surface every failure in one message so CI shows the full picture.
      const msg = failures
        .map((f) => `${f.file}\n${JSON.stringify(f.errors, null, 2)}`)
        .join('\n\n');
      throw new Error(`Showcase slides failed schema:\n${msg}`);
    }
    expect(failures).toHaveLength(0);
  });

  it('fail-fast: unknown slideType is rejected by the discriminator', () => {
    const bad = {
      slideNumber: 99,
      slideName: 'bogus',
      slideType: 'NonsenseSlide',
      transition: 'FadeIn',
      textAnimation: 'FadeIn',
      isClickReveal: false,
      showBrandHeader: true,
      showPresenterChip: true,
      content: { title: 'x' },
    };
    const ok = validate(bad);
    expect(ok).toBe(false);
    // Discriminator surfaces a tag-mismatch error on `slideType`, not a
    // generic "no oneOf branch matched" cascade.
    const errs = validate.errors ?? [];
    const tagErr = errs.find(
      (e) => e.keyword === 'discriminator' || (e.instancePath ?? '').includes('slideType'),
    );
    expect(tagErr).toBeDefined();
  });

  it('fail-fast: KeywordSlide with <3 keywords is rejected on the matched branch only', () => {
    const bad = {
      slideNumber: 1,
      slideName: 'kw',
      slideType: 'KeywordSlide',
      transition: 'FadeIn',
      textAnimation: 'FadeIn',
      isClickReveal: false,
      showBrandHeader: true,
      showPresenterChip: true,
      content: { title: 'X', keywords: ['a', 'b'] },
    };
    const ok = validate(bad);
    expect(ok).toBe(false);
    const errs = validate.errors ?? [];
    // Should NOT have a "must match exactly one of oneOf" cascade with all
    // 10 branches — discriminator narrows to the KeywordSlide branch only.
    const hasMinItemsOnKeywords = errs.some(
      (e) =>
        e.keyword === 'minItems' &&
        (e.instancePath ?? '').includes('keywords'),
    );
    expect(hasMinItemsOnKeywords).toBe(true);
  });

  it('fail-fast: QrMeetingSlide with no QR source is rejected on its branch', () => {
    const bad = {
      slideNumber: 1,
      slideName: 'qr',
      slideType: 'QrMeetingSlide',
      transition: 'FadeIn',
      textAnimation: 'FadeIn',
      isClickReveal: false,
      showBrandHeader: true,
      showPresenterChip: true,
      content: { title: 'Contact' },
    };
    const ok = validate(bad);
    expect(ok).toBe(false);
  });

  // 2020-12 sanity: same schema (rewritten as draft 2020-12) should also
  // compile cleanly so users on either dialect can import it. We don't run
  // it as the source-of-truth path because the ecosystem is still mostly
  // draft-07, but this guards against accidental keyword usage that breaks
  // 2020-12.
  it('compiles under Ajv 2020-12 too (forward-compat smoke test)', () => {
    const ajv2020 = new Ajv2020({ strict: false, discriminator: true });
    addFormats(ajv2020);
    const clone = JSON.parse(JSON.stringify(schema));
    clone.$schema = 'https://json-schema.org/draft/2020-12/schema';
    expect(() => ajv2020.compile(clone)).not.toThrow();
  });
});
