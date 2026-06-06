import type { SlideSpec } from './types';

type JsonPrimitive = null | string | number | boolean;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

const LINK_KEYS = new Set(['parentSlide', 'clickRevealSlide', 'revealSlide']);

function shiftLink(value: number, afterSlideNumber: number) {
  return value > afterSlideNumber ? value + 1 : value;
}

function shiftEntry(key: string, value: JsonValue, afterSlideNumber: number): JsonValue {
  if (typeof value === 'number' && LINK_KEYS.has(key)) return shiftLink(value, afterSlideNumber);
  return shiftJson(value, afterSlideNumber);
}

function shiftObject(value: { [key: string]: JsonValue }, afterSlideNumber: number) {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, shiftEntry(key, entry, afterSlideNumber)]));
}

function shiftJson(value: JsonValue, afterSlideNumber: number): JsonValue {
  if (Array.isArray(value)) return value.map((entry) => shiftJson(entry, afterSlideNumber));
  if (!value || typeof value !== 'object') return value;
  return shiftObject(value, afterSlideNumber);
}

export function shiftSlideForInsert(slide: SlideSpec, afterSlideNumber: number): SlideSpec {
  const nextNumber = slide.slideNumber > afterSlideNumber ? slide.slideNumber + 1 : slide.slideNumber;
  const shifted = shiftJson(slide as unknown as JsonValue, afterSlideNumber) as unknown as SlideSpec;
  return { ...shifted, slideNumber: nextNumber };
}