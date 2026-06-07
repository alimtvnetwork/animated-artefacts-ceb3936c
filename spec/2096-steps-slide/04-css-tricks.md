# 04 — CSS Tricks (connector + depth without scale)

This file documents the two CSS decisions a blind LLM must copy exactly for
Type B step slides:

1. the **gold vertical connector** that visually ties the numbered chips
2. the **depth-without-scale** rule that keeps step titles crisp

Source anchors:

- Runtime rail/fill: `src/slides/types/StepTimelineSlide.tsx:771-790`
- Canon motion rule: `spec/21-slides-system/42-steps-motion.md:12-25,38-39`
- Canon older geometry note: `spec/21-slides-system/17-step-timeline-v2.md:42-43`
- Shared tokens: `src/index.css:208-230`

---

## 1. Gold vertical connector

The left column is not just a list of rows. It is a **numbered rail**:

- each step has a circular number chip
- a dim vertical baseline ties all chips together
- a brighter active fill climbs from the top toward the current chip

### 1.1 Base rail

Use a dedicated absolutely positioned element behind the rows.

| Property | Value | Why |
|---|---|---|
| horizontal position | `left: 18px` | aligns to the centerline of the numbered chip system in the canon spec |
| top inset | `top: 2px` | keeps the line from visually poking through the rounded top cap |
| bottom inset | `bottom: 2px` | same reason at the bottom |
| width | `1px` | hairline, never thicker |
| color | `bg-gold/20` | dim scaffold; visible but subordinate |

Canonical expression from spec history:

```tsx
className="absolute left-[18px] top-2 bottom-2 w-px bg-gold/20"
```

### 1.2 Active fill

Paint a second 1px element on the same x-position. This is the **active fill**.

| Property | Value |
|---|---|
| position | same `left: 18px` rail centerline |
| width | `1px` |
| color | `bg-gold` |
| glow | `shadow-[0_0_8px_hsl(var(--gold)/0.6)]` |
| origin | `transform-origin: top` |

Canonical class recipe:

```tsx
className="absolute left-[18px] top-2 w-px bg-gold shadow-[0_0_8px_hsl(var(--gold)/0.6)]"
```

The fill height animates upward toward the current chip. The visual rule is more
important than the exact formula: the line should feel like it is **climbing the
rail** to meet the active step.

### 1.3 Alignment note

The current runtime uses `left-[14px]` in `StepTimelineSlide.tsx`, while the
canon step-spec pack documents `left: 18px` as the intended rail position. For a
blind reimplementation, use **`18px` as the spec target** unless you are
explicitly matching the present runtime's local offset for backward-compat.

That difference is layout tuning, not a behavior change. The important invariant
is: **base rail and active fill must share the exact same x-position**.

---

## 2. Depth without scale

The step list must feel layered and cinematic, but the titles must stay sharp.

### 2.1 Forbidden technique

Do **not** use `transform: scale()` on step rows or their text.

Why it is forbidden:

- it blurs glyph edges on large projected text
- it makes white-on-dark titles look fuzzy during motion
- it introduces fake depth instead of honest typographic hierarchy

This rule is explicit in the canon docs:

- `spec/21-slides-system/42-steps-motion.md`
- `spec/21-slides-system/27-step-timeline-v3.2.md`
- `spec/21-slides-system/llm/12-steps-pattern.md`

### 2.2 Required replacement strategy

Depth comes from the combination of:

1. **real font-size jumps** via the three title tokens
2. **opacity ramp** by distance from the active step
3. **pure-white active title**
4. optional **active connector glow** on the rail

Use these title-size tokens from `src/index.css`:

| Token | Value |
|---|---|
| `--step-title-active` | `clamp(2.93rem, 5.46vw, 4.88rem)` |
| `--step-title-adjacent` | `clamp(1.95rem, 2.86vw, 2.6rem)` |
| `--step-title-far` | `clamp(1.46rem, 2.08vw, 1.95rem)` |

And the opacity ramp:

| State | Opacity |
|---|---|
| Active | `1.0` |
| Adjacent | `0.55` |
| Far | `0.30` |

So the illusion of depth is:

```text
active row = biggest + brightest + pure white
adjacent row = smaller + dimmed
far row = smallest + most faded
```

This keeps the typography crisp because the browser is laying out real text at
real sizes rather than scaling a bitmap-like painted result.

---

## 3. Optional blur / glow effects (reduced-motion gated)

The step system uses **soft blur and glow as transient cues only** — never as a
permanent visual state. Every blur/glow effect below MUST be disabled when the
user prefers reduced motion.

Source anchors:

- Panel blur ramp on swap: `src/slides/types/StepTimelineSlide.tsx:1088-1105`
- Cleared resting state: `src/slides/types/StepTimelineSlide.tsx:1096`
- Reduced-motion guard: the `reduced` flag at `StepTimelineSlide.tsx:818,1022,1172`

### 3.1 Detail-panel backdrop blur ramp

When the right detail panel swaps step → step, the *outgoing* content carries a
small `filter: blur()` that **clears to `blur(0px)` at rest**. Blur is part of the
transition, not the destination.

| Phase | filter | Notes |
|---|---|---|
| enter (jump) | `blur(4px)` → `blur(0px)` | snappy, ~180ms clear |
| enter (auto/hover) | `blur(6px)` → `blur(0px)` | cinematic, longer expo |
| sideways crossfade | `blur(2px)` → `blur(0px)` | gentle hover swap |
| **resting** | `blur(0px)` | **always crisp at rest** |
| exit | `blur(3–4px)` | only while leaving |

Rule: the panel is **only blurred mid-motion**. If a panel is ever blurry while
sitting still, the effect is wrong.

### 3.2 Ember / cream glow halos

Glow halos are emitted from gold/ember/cream tokens, never raw hex:

```tsx
// active rail fill glow
shadow-[0_0_8px_hsl(var(--gold)/0.6)]
// secondary (cream) trail glow
shadow-[0_0_6px_hsl(var(--cream)/0.35)]
```

Keep halos **bound to the active element** (rail fill, active chip), never on the
whole column or panel. A column-wide glow flattens the depth hierarchy.

### 3.3 Reduced-motion gate

When `prefers-reduced-motion: reduce` is set, the runtime passes a `reduced`
flag that collapses every effect above:

- **Disable:** all `filter: blur()` ramps (set duration 0 / no blur keyframes),
  directional x/y entrance, scale spring, connector grow animation.
- **Keep:** a ≤150ms opacity crossfade, the static font-size tokens, and the
  resting glow on the active rail (it is a static state, not motion).

Never ship a blur that animates under reduced motion — gate it at the source,
not with a CSS override.

---

## 4. The numbered chip

Each step row is anchored by a **numbered chip**. This is the single most copied
primitive of the step system.

Source anchor: `src/slides/types/StepTimelineSlide.tsx:974` (chip element).

### 4.1 It is a `<button>`, never a `<div>`

The chip is interactive — clicking an inactive chip jumps focus to that step.
Render it as a real `<button>` so it is keyboard-focusable and exposes the right
ARIA role. A `<div>` with an `onClick` is a defect.

### 4.2 Geometry

| Property | Spec target | Why |
|---|---|---|
| size | `36 × 36` (`h-9 w-9`) | large enough to read the 2-digit label on projection |
| shape | `rounded-full` | circular chip, never a square or pill |
| font | `font-display font-bold` | Ubuntu Bold numerals match titles |
| transition | `transition-all duration-300` | smooth active/inactive state change |

> Runtime note: the present `StepTimelineSlide.tsx` uses a slightly smaller
> chip for local tuning; for a blind reimplementation, use **36×36** as the spec
> target unless explicitly matching the current runtime offset.

### 4.3 Index label format

The number inside the chip is **always 2 digits, zero-padded, 1-based**:

```tsx
const label = String(i + 1).padStart(2, '0'); // item 0 → "01", item 9 → "10"
```

This matches the `STEP NN / NN` counter pill and the ghost numeral. Never print a
bare `1` or a 0-based index.

---

## 5. Minimum implementation rules

- Keep the connector as **two separate layers**: dim rail + active fill.
- Keep both rail layers on the **same x coordinate**.
- Keep the rail at **1px**.
- Keep the active glow on the fill, not on the whole column.
- Use **font-size + opacity + color** for depth.
- Never use `scale()` to enlarge or shrink a step row.

If you skip either rule set, the slide stops reading like the Riseup Asia step
system and starts reading like a generic animated list.