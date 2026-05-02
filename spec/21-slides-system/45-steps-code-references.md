# 45 — Steps Code-Reference Snippets

> **Last Enriched:** 2026-04-26 · **Phase 5/20** · Illustrative snippets
> only — the runtime files (`StepTimelineSlide.tsx`, `useFocusTimeline.ts`,
> `sound.ts`, `enums.ts`) are the source of truth. Each snippet
> respects: ≤8 lines, no `any`/`unknown`, positive conditions, booleans
> prefixed `is`/`has`, no magic strings.

## 1. Constants file shape

`src/slides/types/StepTimelineSlide.tsx` (top of file):

```ts
const STEP_INTERVAL_MS = 2200;
const PAUSE_MS = 6000;
const REVEAL_BASE_DELAY = 0.3;
const REVEAL_STAGGER = 0.18;
const READY_WAIT_MS = 800;
const REDUCED_FADE_MS = 150;
```

Rule: every duration / delay used in motion lives in this block, not
inline. If a value moves, search-and-replace one place.

## 2. Enum file shape

`src/slides/enums.ts`:

```ts
export enum StepMotionState {
  Inactive = 'inactive',
  Entering = 'entering',
  Active = 'active',
  Leaving = 'leaving',
}
export enum StepMotionDirection {
  FromLeft = 'from-left',
  ToLeft = 'to-left',
}
```

Names PascalCase; string values kebab-case for use in `data-state="..."`.

## 3. Motion-state mapping function

```ts
function resolveMotionState(
  rowIndex: number,
  activeIndex: number,
  hasEntered: boolean,
): StepMotionState {
  if (!hasEntered) return StepMotionState.Entering;
  if (rowIndex === activeIndex) return StepMotionState.Active;
  return StepMotionState.Inactive;
}
```

8 lines, positive ifs, no nesting, boolean prefixed `has`.

## 4. Reduced-motion guard

```ts
function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mq.matches === true;
}
```

Use at the top of every motion variant builder; collapse all transforms
to opacity-only when `true`.

## 5. Sound trigger wrapper

```ts
function playFocusCue(volume: number): void {
  if (isReducedMotion() === false) {
    slideSound.play('whoosh', volume);
    return;
  }
  slideSound.play('whoosh', volume);
}
```

Reduced motion does **not** mute audio (see `44-steps-accessibility.md`
§6). The wrapper exists so future a11y rules can branch here without
touching every call site.

## 6. Continued

State source-of-truth, per-row attributes, and acceptance grep checks
live in `46-steps-code-references-2.md` (split for the ≤100-line rule).

## Changelog

- 2026-04-26 (v0.79.3): Phase 5 — snippets §1–§5 (constants, enums,
  motion mapper, reduced-motion guard, sound wrapper).
