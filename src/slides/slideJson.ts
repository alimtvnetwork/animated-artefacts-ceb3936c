/**
 * Single-slide JSON export.
 *
 * Companion to the deck-wide manifest export — lets a presenter pull one
 * slide's spec out as a standalone JSON file (the inverse of "Import JSON
 * (single)"). The shape is a thin envelope around the raw `SlideSpec` so a
 * receiving project can validate it with `validateSlide` before merging.
 */

import { findBySlideNumber, deck } from './loader';
import { downloadJson, slugifyName } from './downloadJson';

export type SlideJsonVersion = 1;

const SLIDE_JSON_VERSION: SlideJsonVersion = 1;

export interface SingleSlideManifest {
  manifestVersion: SlideJsonVersion;
  exportedAt: string;
  source: string;
  slideNumber: number;
  slide: unknown;
}

/** Build the export envelope for one slide. Throws if the number is unknown. */
export function buildSlideManifest(slideNumber: number): SingleSlideManifest {
  const slide = findBySlideNumber(slideNumber);
  if (!slide) throw new Error(`No slide found for number ${slideNumber}.`);
  return {
    manifestVersion: SLIDE_JSON_VERSION,
    exportedAt: new Date().toISOString(),
    source: deck.deckSlug,
    slideNumber,
    slide,
  };
}

/** Build + download a single slide's JSON. Returns the filename used. */
export function exportSlideJson(slideNumber: number): string {
  const manifest = buildSlideManifest(slideNumber);
  const name = (manifest.slide as { slideName?: string }).slideName ?? `slide-${slideNumber}`;
  const filename = `${deck.deckSlug}-${String(slideNumber).padStart(2, '0')}-${slugifyName(name)}.json`;
  downloadJson(manifest, filename);
  return filename;
}
