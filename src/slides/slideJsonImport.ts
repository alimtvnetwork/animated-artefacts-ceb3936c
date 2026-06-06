import { validateSlide } from './contracts';
import { buildManifest, type DeckManifest } from './manifest';
import { shiftSlideForInsert } from './slideLinkShift';
import type { SingleSlideManifest } from './slideJson';
import type { DeckSpec, SlideSpec } from './types';

const SINGLE_SLIDE_VERSION = 1;

export interface SingleSlideImportPlan {
  insertedNumber: number;
  manifest: DeckManifest;
  slide: SlideSpec;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseEnvelope(raw: unknown): SingleSlideManifest {
  if (!isRecord(raw)) throw new Error('Single-slide import must be a JSON object.');
  if (raw.manifestVersion !== SINGLE_SLIDE_VERSION) throw new Error(`Unsupported single-slide manifest version: ${String(raw.manifestVersion)}.`);
  if (!('slide' in raw)) throw new Error('Single-slide import is missing `slide`.');
  return raw as unknown as SingleSlideManifest;
}

function parseSlide(raw: unknown): SlideSpec {
  const result = validateSlide(raw);
  if (result.ok) return raw as SlideSpec;
  throw new Error(result.issues.map((issue) => `${issue.path}: ${issue.message}`).join(' | '));
}

function insertedSlideNumber(afterSlideNumber: number) {
  if (!Number.isFinite(afterSlideNumber) || afterSlideNumber < 0) throw new Error(`Invalid insert target: ${afterSlideNumber}`);
  return afterSlideNumber + 1;
}

function mergeSlides(slides: SlideSpec[], imported: SlideSpec, afterSlideNumber: number): SlideSpec[] {
  const inserted = { ...imported, slideNumber: insertedSlideNumber(afterSlideNumber) };
  const shifted = slides.map((slide) => shiftSlideForInsert(slide, afterSlideNumber));
  return [...shifted, inserted].sort((a, b) => a.slideNumber - b.slideNumber);
}

export function planSingleSlideImport(deck: DeckSpec, slides: SlideSpec[], raw: unknown, afterSlideNumber: number): SingleSlideImportPlan {
  const envelope = parseEnvelope(raw);
  const slide = parseSlide(envelope.slide);
  const insertedNumber = insertedSlideNumber(afterSlideNumber);
  const manifest = buildManifest(deck, mergeSlides(slides, slide, afterSlideNumber));
  console.info(`[slideJsonImport] Prepared "${slide.slideName}" as #${insertedNumber}; shifted ${slides.filter((item) => item.slideNumber > afterSlideNumber).length} later slide(s).`);
  return { insertedNumber, manifest, slide: { ...slide, slideNumber: insertedNumber } };
}