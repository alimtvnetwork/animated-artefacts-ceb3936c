/**
 * Draft-deck store for the multi-slide builder workspace at `/builder`.
 *
 * # Why a dedicated store?
 * The builder needs to hold a *full deck* (deck meta + N slides) in memory
 * and persist it to localStorage so refreshes don't wipe an author's work.
 * The active runtime deck (`src/slides/loader.ts`) is read-only at module
 * load — separate concern, separate state.
 *
 * # Lifecycle
 *   1. `useDraftDeck()` reads `riseup.deck.draft.v1` from localStorage on mount.
 *   2. Any mutation (deck-meta change, slide add/update/remove/reorder) writes
 *      back synchronously so the next reload picks up exactly what's on screen.
 *   3. `clearDraft()` wipes the storage entry — used when the author exports
 *      the manifest and wants a clean slate.
 *
 * # Preset inheritance — the whole point of this file
 * Every slide added via `addSlide()` (or `duplicateSlide()`) inherits the
 * deck's `preset` field via `applyPresetToSlide()`. The preset doesn't write
 * a `titleStyle` onto the slide JSON — it stays implicit so the per-slide
 * spec remains author-clean and `resolveTitleStyle` keeps deciding at render
 * time. What "inherit" means here is:
 *   - The slide JSON does NOT pin a `titleStyle` (so the deck preset wins).
 *   - The slide gets the type-schema's `slideDefaults` (e.g. `brandStrip:false`
 *     for hero / divider slides, which the premium look depends on).
 *   - The slide ships with `enabled: true` and a fresh slideNumber.
 *
 * Everything else (form-driven content, transitions, etc.) is unaffected.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DeckSpec, SlideSpec, DeckPreset } from '../slides/types';
import type { SlideTypeValue } from '../slides/enums';
import { SLIDE_TYPE_SCHEMAS } from './fieldSchemas';

/** localStorage key for the in-progress draft deck. */
export const DRAFT_DECK_KEY = 'riseup.deck.draft.v1';

/** A draft deck = deck meta + slides. Identical shape to the runtime deck. */
export interface DraftDeck {
  /** Bumped if we ever change the on-disk shape. */
  draftVersion: 1;
  deck: DeckSpec;
  slides: SlideSpec[];
}

const CURRENT_VERSION = 1 as const;

/** Build an empty deck shell. Used the first time the workspace mounts. */
export function makeEmptyDraftDeck(): DraftDeck {
  return {
    draftVersion: CURRENT_VERSION,
    deck: {
      deckSlug: 'new-deck',
      deckName: 'Untitled Deck',
      presenter: '',
      // `noir-gold` is the bundled default; user can switch via the deck form.
      theme: 'noir-gold',
      slides: [],
      // Premium is the implicit default at render time too (`preset.ts`),
      // but writing it explicitly here makes new decks self-documenting.
      preset: 'premium',
    },
    slides: [],
  };
}

/**
 * Apply the deck's preset to a freshly-minted slide.
 *
 * Right now the preset only governs title color and CSS scale — both already
 * happen at render time via `resolveTitleStyle`. That means the only thing we
 * need to do here is *not* pin a `titleStyle`, so the resolver picks the
 * preset's auto rule. This function is the single seam future presets can
 * extend without rewriting `addSlide()`.
 */
function applyPresetToSlide(slide: SlideSpec, preset: DeckPreset | undefined): SlideSpec {
  if (!preset) return slide;
  // Strip any explicit titleStyle so the preset's auto-pick wins. Authors
  // can still re-add it through the slide form for one-off overrides.
  const { titleStyle: _omit, ...rest } = slide;
  return rest as SlideSpec;
}

/**
 * Build a fresh `SlideSpec` for a given type, seeded from the schema's
 * defaults and tagged with the deck's preset rules.
 */
export function makeSlide(slideType: SlideTypeValue, slideNumber: number, preset?: DeckPreset): SlideSpec {
  const schema = SLIDE_TYPE_SCHEMAS[slideType];
  const slideDefaults = schema.slideDefaults ?? {};
  const fresh: SlideSpec = {
    slideNumber,
    slideName: `${slideType.toLowerCase()}-${slideNumber}`,
    slideType,
    transition: 'FadeIn',
    textAnimation: 'FadeIn',
    enabled: true,
    isClickReveal: slideDefaults.isClickReveal ?? false,
    showBrandHeader: slideDefaults.showBrandHeader ?? true,
    showPresenterChip: slideDefaults.showPresenterChip ?? false,
    brandStrip: slideDefaults.brandStrip,
    titleStyle: slideDefaults.titleStyle,
    titleShimmer: slideDefaults.titleShimmer ?? false,
    notes: '',
    content: { ...schema.defaults },
  };
  return applyPresetToSlide(fresh, preset);
}

/* --------------------------------------------------------------------- */
/* Hook                                                                  */
/* --------------------------------------------------------------------- */

interface DraftStore {
  draft: DraftDeck;
  /** Update deck-level metadata (name, slug, theme, preset, presenter). */
  updateDeck: (patch: Partial<DeckSpec>) => void;
  /** Replace a single slide by slideNumber. */
  updateSlide: (slideNumber: number, next: SlideSpec) => void;
  /** Append a new slide of the given type, inheriting the deck preset. */
  addSlide: (type: SlideTypeValue) => number;
  /** Duplicate a slide and append the copy. Returns the new slideNumber. */
  duplicateSlide: (slideNumber: number) => number;
  /** Remove a slide by slideNumber. */
  removeSlide: (slideNumber: number) => void;
  /** Move a slide to a new position in the ordering (0-based index). */
  moveSlide: (slideNumber: number, toIndex: number) => void;
  /** Wipe the draft and start over with an empty deck. */
  reset: () => void;
}

function loadDraft(): DraftDeck {
  if (typeof window === 'undefined') return makeEmptyDraftDeck();
  try {
    const raw = window.localStorage.getItem(DRAFT_DECK_KEY);
    if (!raw) return makeEmptyDraftDeck();
    const parsed = JSON.parse(raw) as Partial<DraftDeck>;
    if (parsed.draftVersion !== CURRENT_VERSION) return makeEmptyDraftDeck();
    if (!parsed.deck || !Array.isArray(parsed.slides)) return makeEmptyDraftDeck();
    return parsed as DraftDeck;
  } catch (err) {
    console.warn('[draft-deck] corrupted draft, starting fresh', err);
    return makeEmptyDraftDeck();
  }
}

function saveDraft(draft: DraftDeck) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DRAFT_DECK_KEY, JSON.stringify(draft));
  } catch (err) {
    console.warn('[draft-deck] save failed', err);
  }
}

/** Wipe the draft from localStorage. Use after a successful manifest export. */
export function clearDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DRAFT_DECK_KEY);
}

export function useDraftDeck(): DraftStore {
  const [draft, setDraft] = useState<DraftDeck>(() => loadDraft());

  // Keep localStorage in lockstep with state. Synchronous; no debounce
  // because the writes are tiny and an in-flight refresh should never lose
  // an author's last keystroke.
  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const nextSlideNumber = useCallback(
    () => (draft.slides.length === 0 ? 1 : Math.max(...draft.slides.map(s => s.slideNumber)) + 1),
    [draft.slides],
  );

  const updateDeck = useCallback((patch: Partial<DeckSpec>) => {
    setDraft(d => {
      const nextDeck = { ...d.deck, ...patch };
      // If the preset changed, re-apply it to every existing slide so the
      // deck stays internally consistent (e.g. switching presets later
      // strips stale per-slide titleStyle pins added by an old preset).
      const slides =
        patch.preset !== undefined && patch.preset !== d.deck.preset
          ? d.slides.map(s => applyPresetToSlide(s, nextDeck.preset))
          : d.slides;
      return { ...d, deck: nextDeck, slides };
    });
  }, []);

  const updateSlide = useCallback((slideNumber: number, next: SlideSpec) => {
    setDraft(d => ({
      ...d,
      slides: d.slides.map(s => (s.slideNumber === slideNumber ? next : s)),
    }));
  }, []);

  const addSlide = useCallback((type: SlideTypeValue) => {
    let createdNumber = 0;
    setDraft(d => {
      const num = d.slides.length === 0 ? 1 : Math.max(...d.slides.map(s => s.slideNumber)) + 1;
      createdNumber = num;
      const slide = makeSlide(type, num, d.deck.preset);
      return { ...d, slides: [...d.slides, slide] };
    });
    return createdNumber;
  }, []);

  const duplicateSlide = useCallback((slideNumber: number) => {
    let createdNumber = 0;
    setDraft(d => {
      const source = d.slides.find(s => s.slideNumber === slideNumber);
      if (!source) return d;
      const num = Math.max(...d.slides.map(s => s.slideNumber)) + 1;
      createdNumber = num;
      const copy: SlideSpec = applyPresetToSlide(
        {
          ...JSON.parse(JSON.stringify(source)),
          slideNumber: num,
          slideName: `${source.slideName}-copy`,
        },
        d.deck.preset,
      );
      return { ...d, slides: [...d.slides, copy] };
    });
    return createdNumber;
  }, []);

  const removeSlide = useCallback((slideNumber: number) => {
    setDraft(d => ({ ...d, slides: d.slides.filter(s => s.slideNumber !== slideNumber) }));
  }, []);

  const moveSlide = useCallback((slideNumber: number, toIndex: number) => {
    setDraft(d => {
      const idx = d.slides.findIndex(s => s.slideNumber === slideNumber);
      if (idx === -1) return d;
      const target = Math.max(0, Math.min(toIndex, d.slides.length - 1));
      if (target === idx) return d;
      const next = [...d.slides];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return { ...d, slides: next };
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = makeEmptyDraftDeck();
    setDraft(fresh);
  }, []);

  return useMemo(
    () => ({ draft, updateDeck, updateSlide, addSlide, duplicateSlide, removeSlide, moveSlide, reset }),
    [draft, updateDeck, updateSlide, addSlide, duplicateSlide, removeSlide, moveSlide, reset],
  );
}
