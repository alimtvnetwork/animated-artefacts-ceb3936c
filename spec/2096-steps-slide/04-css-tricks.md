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

## 3. Minimum implementation rules

- Keep the connector as **two separate layers**: dim rail + active fill.
- Keep both rail layers on the **same x coordinate**.
- Keep the rail at **1px**.
- Keep the active glow on the fill, not on the whole column.
- Use **font-size + opacity + color** for depth.
- Never use `scale()` to enlarge or shrink a step row.

If you skip either rule set, the slide stops reading like the Riseup Asia step
system and starts reading like a generic animated list.