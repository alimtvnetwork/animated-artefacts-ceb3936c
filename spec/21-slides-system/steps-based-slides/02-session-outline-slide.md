# 02 — SessionOutlineSlide (the Outline Section), fully specified

This is the canonical step-based slide. Implement it exactly and the rest of
the family follows. Component file: `src/slides/types/SessionOutlineSlide.tsx`.

## ASCII anatomy

```
 ┌────────────────────────────────────────────────────────────────────┐
 │  (brand-inset-y top padding)                                         │
 │  TODAY                            ← eyebrow  (.slide-eyebrow, gold)   │
 │  What we'll cover                 ← title    (.slide-title-content)   │
 │  Four moves, forty minutes.       ← kicker   (white/55, max 60ch)     │
 │                                                                      │
 │  │                                                                   │  ← glowing vertical
 │  │ 01   Recap                                       [ 5 min ]        │     hairline in the
 │  │      Where we left off                                           │     index gutter
 │  ├───────────────────────────────────────────────────────────────  │
 │  │ 02   The problem                                  10 min          │
 │  │      Why it matters now                                          │
 │  ├───────────────────────────────────────────────────────────────  │
 │  │ 03   The build                                   [ 20 min ]       │
 │  │      Live walkthrough                                            │
 │  └ ...                                                               │
 │  (brand-inset-y * 0.6 bottom padding)                                │
 └────────────────────────────────────────────────────────────────────┘
```

## Container

```tsx
<motion.div
  variants={container}          // getContainerVariants(spec.textAnimation)
  initial="initial"
  animate="animate"
  className="flex h-full flex-col"
  style={{
    paddingLeft:  'var(--brand-inset-x)',
    paddingRight: 'var(--brand-inset-x)',
    paddingTop:   'var(--brand-inset-y)',
    paddingBottom:'calc(var(--brand-inset-y) * 0.6)',
  }}
>
```

- The whole slide is a Framer Motion `container` so children stagger in.
- `flex h-full flex-col`: header sits at top, list takes remaining height and
  is vertically centered within it.

## Header block

`<div className="mb-12">` containing, in order, each optional and only rendered
when present:

| Region  | Element | Class / style |
|---------|---------|---------------|
| eyebrow | `motion.div` | `slide-eyebrow text-xs tracking-[0.4em] uppercase text-gold/90 mb-4` |
| title   | `motion.h2`  | `slide-title-content ${titleClassFor(spec)}`, `lineHeight: 1.05` |
| kicker  | `motion.p`   | `mt-3 text-base text-[hsl(var(--white)/0.55)]`, `maxWidth: '60ch'` |

Each region's variants = `c.animations?.<region>` resolved via `resolvePreset`,
falling back to `getItemVariants(spec.textAnimation)`.

> **Theme-safe color note:** the kicker uses `text-[hsl(var(--white)/0.55)]`,
> NOT `text-white/55`. The `--white` token flips to dark ink on light themes,
> so this stays legible everywhere. Never use literal `text-white` here.

## Outline list

```tsx
<div className="relative flex-1 flex flex-col justify-center">
  {/* vertical hairline */}
  <div aria-hidden className="absolute top-0 bottom-0 pointer-events-none"
       style={{ left: '40px', width: '1px',
         background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--gold)/0.18) 12%, hsl(var(--gold)/0.18) 88%, transparent 100%)' }} />
  <motion.ol variants={itemsV} className="relative flex flex-col gap-6">
    {items.map((it, i) => { ... })}
  </motion.ol>
</div>
```

- `flex-1 ... justify-center` vertically centers the list in the leftover space.
- The hairline is a fixed `1px` vertical gradient at `left: 40px` (the center of
  the index gutter). It fades in/out at the top/bottom 12%.

## A single row (`motion.li`)

Grid with three columns: **index gutter | title column | meta column**.

```tsx
<motion.li
  variants={itemsV}
  className="grid items-center gap-6 group"
  style={{
    gridTemplateColumns: '88px 1fr auto',
    paddingTop: '12px',
    paddingBottom: '12px',
    borderTop: i === 0 ? '1px solid hsl(var(--gold)/0.10)' : undefined,
    borderBottom: '1px solid hsl(var(--gold)/0.10)',
    opacity: active >= 0 && !isActive ? 0.55 : 1,
    transition: 'opacity 240ms ease-out',
  }}
>
```

- `gridTemplateColumns: '88px 1fr auto'` — 88px index gutter, flexible title,
  auto-width meta.
- Hairline separators top (only first row) + bottom of every row, at
  `hsl(var(--gold)/0.10)`.
- **Active dimming:** if some row is active (`active >= 0`) and this one is not,
  drop to `opacity: 0.55`. The active row stays at `1`. Crossfade 240ms.

### Index numeral (column 1)

```tsx
<div className="font-display tabular-nums leading-none"
  style={{
    fontSize: 'clamp(2.4rem, 4.4vw, 3.8rem)',
    color: isActive ? 'hsl(var(--gold))' : 'hsl(var(--gold)/0.55)',
    textShadow: isActive ? '0 0 28px hsl(var(--gold)/0.45)' : 'var(--text-shadow-weight-md)',
    transition: 'color 240ms ease-out, text-shadow 240ms ease-out',
  }}>
  {String(i + 1).padStart(2, '0')}
</div>
```

- `tabular-nums` so `01`/`02` widths match.
- Active numeral is full gold with a 28px glow; inactive is gold/55 with the
  standard weight-shadow token. Never inline a custom shadow for the inactive
  state — use `var(--text-shadow-weight-md)`.

### Title + subtitle (column 2)

```tsx
<div className="flex flex-col">
  <div className="font-display step-title"
       style={{ fontSize: 'clamp(1.75rem, 2.6vw, 2.4rem)', lineHeight: 1.15, color: 'hsl(var(--white))' }}>
    {it.title}
  </div>
  {it.subtitle && (
    <div className="mt-1 text-[hsl(var(--white)/0.60)]"
         style={{ fontSize: 'clamp(1rem, 1.15vw, 1.15rem)', lineHeight: 1.35 }}>
      {it.subtitle}
    </div>
  )}
</div>
```

- Title uses the `.step-title` semantic class (gets the weight-shadow bevel).
- Subtitle color via `text-[hsl(var(--white)/0.60)]` (theme-safe), never
  `text-white/60`.

### Meta / capsule (column 3)

```tsx
<div className="flex items-center gap-3 justify-self-end">
  {it.capsule && <Capsule spec={it.capsule as never} />}
  {it.meta && !it.capsule && <span className="capsule-meta">{it.meta}</span>}
  {it.meta && it.capsule && <span className="capsule-meta">{it.meta}</span>}
</div>
```

- Prefer the `<Capsule>` component (it emits `.capsule-{tone}` classes).
- Plain meta uses the `.capsule-meta` class (Radix muted tokens, theme-safe).
- **Never** build a pill with inline `background`/`color` referencing brand
  tokens here.

## Required imports

```ts
import { motion } from 'framer-motion';
import type { SlideSpec } from '../types';
import { getContainerVariants, getItemVariants, resolvePreset } from '../textAnimations';
import { titleClassFor } from '../preset';
import { Capsule } from '../components/Capsule';
```

## What this slide does NOT do

- It does **not** advance internally. There is no `active` state machine, no
  keyboard handler, no timer. `activeIndex` is a static prop. (Advancing
  behavior belongs to `StepTimelineSlide` / `FocusTimelineSlide` /
  `AdvanceStepSlide`.)
- It does **not** fetch or compute content. Pure function of `spec.content`.
