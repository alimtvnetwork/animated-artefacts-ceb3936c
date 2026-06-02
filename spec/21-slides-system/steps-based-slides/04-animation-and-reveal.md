# 04 — Animation & Reveal

Step-based slides reveal their items with a **staggered entrance** and, for the
interactive members, move an **active** highlight as the presenter advances.

## Reveal system (shared)

The text-animation system lives in `src/slides/textAnimations.ts`:

- `getContainerVariants(spec.textAnimation)` → the parent variants. Put it on
  the outermost `motion.div` with `initial="initial" animate="animate"`. Its job
  is to orchestrate `staggerChildren`.
- `getItemVariants(spec.textAnimation)` → the default per-child variants.
- `resolvePreset(name)` → resolves a named preset (e.g. `"SlideUp"`, `"FadeIn"`,
  `"Bounce"`, `"Stagger"`) to variants, used for per-region overrides via
  `content.animations`.

Wiring pattern (from `SessionOutlineSlide`):

```ts
const container   = getContainerVariants(spec.textAnimation);
const defaultItem = getItemVariants(spec.textAnimation);
const eyebrowV = c.animations?.eyebrow ? resolvePreset(c.animations.eyebrow) : defaultItem;
const titleV   = c.animations?.title   ? resolvePreset(c.animations.title)   : defaultItem;
const kickerV  = c.animations?.kicker  ? resolvePreset(c.animations.kicker)  : defaultItem;
const itemsV   = c.animations?.items   ? resolvePreset(c.animations.items)   : defaultItem;
```

Every animated node gets `variants={...}`; the container drives them. The
`<ol>` ALSO carries `variants={itemsV}` and each `<li>` carries `variants={itemsV}`
so list items stagger top-to-bottom.

## Active-row highlight (outline = static, others = moving)

- **SessionOutlineSlide:** `active = content.activeIndex ?? -1`. Pure prop.
  - If `active < 0`: all rows opacity 1, all index numerals at gold/55.
  - If `active >= 0`: the active row stays opacity 1 with a full-gold glowing
    numeral; every other row dims to opacity 0.55. Crossfade 240ms.
- **StepTimeline / FocusTimeline / AdvanceStep:** `active` is internal React
  state advanced by input (click / ←→ / Space / controller). The same dimming +
  glow rules apply to the *current* step. See specs `17`, `23`, `27`, `32`,
  `33`, `42` for the cinematic layer (ghost numerals, breathing badge halo,
  per-transition timing).

## Reduced motion (mandatory)

Honor `prefers-reduced-motion`. The text-animation presets already provide a
reduced path; when reduced:

- Replace translate/scale entrances with a short **opacity-only crossfade**
  (~150ms).
- Drop continuous/looping effects (badge "radiate" halo, ghost-numeral
  cross-fades) to a static state.
- Active-row dimming may stay (it is a 240ms opacity tween, acceptable), but do
  not animate position.

Never ship a step slide whose only entrance is a transform with no reduced
fallback.

## Transition vs textAnimation

- `spec.transition` (FadeIn / SlideIn / PushIn / PushLeft / PushRight) governs
  how the **whole slide** enters when navigated to. Handled by the deck shell,
  not the slide component.
- `spec.textAnimation` (Bounce / FadeIn / SlideUp / Stagger) governs how the
  **content within** the slide reveals. This is what the variants above consume.

Pick variety across a deck (Core rule) — do not make every step slide use the
same pair.
