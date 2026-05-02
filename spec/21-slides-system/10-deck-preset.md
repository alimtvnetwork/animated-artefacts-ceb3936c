# 10 — Deck Preset (`premium`)

A reusable, deck-level preset that locks Ubuntu Bold title-case styling,
white/cream/gold rules, and clamp-based sizing for every slide in a deck —
without having to repeat the same className ladder on every slide type.

## Why

Every slide used to repeat:

```tsx
font-display text-5xl md:text-6xl text-title-cream max-w-[92vw]
```

…plus a 3- or 4-branch ternary to derive `titleStyle`. Changing the deck's
typography meant editing every slide component. The preset moves all of that
into one CSS scale + one resolver, so authoring a new deck is a one-line
opt-in.

## Opt in (or rather, opt out)

`premium` is the **implicit default** for every deck. A `deck.json` with no
`preset` field is treated as `{ "preset": "premium" }`. You only need to
set the field if a future preset is added and you want to switch to it.

To make the choice explicit (recommended for clarity in shared decks):

```json
{ "preset": "premium" }
```

Either way, every slide inherits:

- **Ubuntu Bold titles** with -0.02em tracking, leading 0.95.
- **Clamp-based sizing** — one global scale, no per-breakpoint className ladders.
- **Author-written casing** — no CSS `text-transform` (preserves "MD", "LLC", etc.).
- **Auto-picked title color** when the slide doesn't declare `titleStyle`.
- **Subtitles** always rendered with `--foreground/70`.

## CSS scale (the lockstep tokens)

Defined in `src/index.css`:

| Class                    | Use on                                        | Size |
|--------------------------|-----------------------------------------------|------|
| `.slide-title-display`   | Hero / TitleSlide / large CapsuleListSlide   | `clamp(2.5rem, 6vw, 6rem)` |
| `.slide-title-content`   | Body slides (StepTimeline, QrMeeting, …)     | `clamp(2rem, 4.2vw, 3.75rem)` |
| `.slide-eyebrow`         | All eyebrows                                  | fixed `0.75rem`, `0.35em` tracking, gold |
| `.slide-subtitle`        | All subtitles                                 | `clamp(1rem, 1.6vw, 1.5rem)`, `--foreground/70` |

Slides should compose: a CSS scale class **plus** the resolved color class
returned by `titleClassFor(spec)`.

```tsx
<h2 className={`slide-title-display ${titleClassFor(spec)}`}>{c.title}</h2>
```

## Color resolution (precedence)

The `resolveTitleStyle(slide)` helper in `src/slides/preset.ts` returns
the effective title color, in this order:

1. **Per-slide `titleStyle`** — always wins, regardless of preset.
2. **Preset auto-pick** — applies whenever the deck's resolved preset is
   `premium`. Since `premium` is now the implicit default, this branch runs
   for every deck unless a different preset is added in the future:
   - `TitleSlide` / `SectionDividerSlide` → `white`  (hero moments)
   - `titleShimmer: true`                 → `gold`   (brand emphasis)
   - everything else                      → `cream`  (default)
3. **Cream fallback** — only reached if a future preset name is added that
   does not auto-pick.

## Round-trip

The deck manifest export (`buildManifest` → `downloadManifest`) writes
`preset` into the manifest's `deck` object alongside `theme` and
`brandStrip`. Importing into another project reapplies it automatically.

## Adding a new preset

1. Add the new name to `DeckPreset` in `src/slides/types.ts`.
2. Extend `resolveTitleStyle` in `src/slides/preset.ts` with the new branch.
3. If the preset needs different sizes, add new `.slide-title-*` utility
   classes to `index.css` rather than hard-coding sizes inside slides.
4. Add the new enum value to `spec/slides/deck.schema.json`.
5. Document it here.

Never reintroduce per-slide className ladders for typography. If you find
yourself writing `text-5xl md:text-6xl` inside a slide component, that's a
signal the preset scale needs a new token.
