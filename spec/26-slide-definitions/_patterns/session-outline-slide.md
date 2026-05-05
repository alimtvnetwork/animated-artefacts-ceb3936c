# SessionOutlineSlide — pattern spec

> Vertical numbered agenda. Title block on top, then 2–8 outline rows, each
> built from a big index numeral, a short title, an optional one-line
> subtitle, and an optional meta capsule (e.g. duration). Optional
> `activeIndex` highlights one row mid-deck as a "you are here" cue.

## When to use

- Session opener (after a `BlastRadiusSlide` chapter title).
- Mid-deck recap ("here's where we are now") with `activeIndex` set.
- Multi-session outlines where each row is one self-contained chapter.

Do NOT use if you need cinematic motion between steps — that's
`StepsChain3DSlide` or `AdvanceStepSlide`. SessionOutlineSlide is a calm,
single-screen list. The presenter narrates; the slide doesn't perform.

## Layout (1920×1080)

```
┌─ var(--brand-inset-x) ──────────────────────── var(--brand-inset-x) ─┐
│                                                                       │
│  TODAY                                       (eyebrow, gold tracking) │
│  Session outline                              (slide-title-content)   │
│  What we will cover, in order.                (kicker, white/55)      │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────    │
│   01   Recap              Where we left off              [5 min]      │
│  ─────────────────────────────────────────────────────────────────    │
│   02   Mindset            Bad becomes master             [3 min]   ◀ active
│  ─────────────────────────────────────────────────────────────────    │
│   03   Build              Two CLIs, live                 [35 min]     │
│  ─────────────────────────────────────────────────────────────────    │
│   ...                                                                 │
└───────────────────────────────────────────────────────────────────────┘
```

- Header block: 12 units bottom margin, then the outline list `flex-1
  justify-center` so it vertical-centers in the remaining stage.
- Row grid: `88px 1fr auto` — fixed-width index gutter so titles align;
  meta column hugs the right.
- Continuous gold hairline runs behind the index gutter (top→bottom,
  fades at the ends). At the active row the numeral itself glows
  (`--gold` solid + 28px gold halo) — the rail stays calm.
- Inactive rows dim to `opacity: 0.55` whenever `activeIndex` is set.

## Schema (zod, runtime contract)

```ts
const SessionOutlineItem = z.object({
  title: z.string().min(1).max(60),
  subtitle: z.string().max(120).optional(),
  meta: z.string().max(20).optional(),     // e.g. "5 min"
  capsule: Capsule.optional(),             // { text, color }
});
const SessionOutlineContent = z.object({
  title: z.string().min(1).max(80),
  eyebrow: z.string().max(40).optional(),
  kicker: z.string().max(160).optional(),
  items: z.array(SessionOutlineItem).min(2).max(8),
  activeIndex: z.number().int().min(0).max(7).optional(),
});
```

## Animation

- Reveal: inherits `spec.textAnimation` (default Stagger). Header items
  cascade first, then the rows stagger top-to-bottom — same pattern as
  `KeywordSlide`. Per-block override available via
  `content.animations.{eyebrow,title,kicker,items}`.
- Active-row transition: `color` + `text-shadow` 240ms ease-out — so
  flipping `activeIndex` between renders animates smoothly.
- Respects `prefers-reduced-motion` automatically (handled at the
  `textAnimations` layer).

## Theme rules

- Index numerals use `hsl(var(--gold))` — the only paint in the row that
  carries brand color. Active glow is `hsl(var(--gold) / 0.45)`.
- Title text: `hsl(var(--white))` — picks up the auto text-weight shadow
  via `step-title` semantic class (no inline `text-shadow`).
- Subtitles: `text-white/60` (Tailwind opacity utility — safe on every
  theme because it doesn't reference repurposed brand tokens).
- Capsules MUST come from the deck's `Capsule` color enum — never
  inline `style.background` (see [light-theme capsule fg rule]).
- Meta-only column uses the shared `.capsule-meta` class so light
  themes auto-flip muted/foreground.

## Anti-patterns

- ❌ Centered index numerals — they break the gutter alignment; titles
  jitter when index width changes (10 vs 100).
- ❌ More than 8 rows — past 8 the row height collapses below
  legible. Split into two outline slides instead.
- ❌ Paragraph subtitles — the slide is a list, not a brief. One line
  per row, max ~120 chars.
- ❌ Inline `style={{ color: 'var(--gold)' }}` on titles — use the
  semantic class so themes can repaint.
- ❌ Highlighting more than one row at a time — `activeIndex` is a
  single integer by design. If you need multi-active, this is the wrong
  pattern (use `ChecklistSlide`).

## Pairs with

- `BlastRadiusSlide` (chapter title) → `SessionOutlineSlide`
  (this chapter's outline) → first content slide. Cinematic→calm→work.
