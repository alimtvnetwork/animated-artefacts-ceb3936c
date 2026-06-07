# 01 — The Two Step Types (the core of this spec)

There are **two fundamentally different kinds of step slide**. They share the
same *mental model* (ordered index + title + capsule) but differ in **what the
audience sees** and **how the presenter drives it**. Pick the right one first;
everything downstream (data key, motion, layout) follows from this choice.

---

## Type A — Static outline (`SessionOutlineSlide`)

**What it is:** a single, all-at-once vertical list. Every item is visible
simultaneously, separated by hairline rules, with a glowing vertical rule down
the index gutter. There is **no internal step advance** — the whole list IS the
slide. Pressing Next leaves the slide entirely.

**Use it for:** agendas, chapter openers, "what we'll cover", any list the
audience should scan as a whole.

**Optional accent:** `content.activeIndex` (zero-based) can highlight ONE item
(glow) and dim the rest to `opacity: 0.55` — a *static* spotlight, not an
animated walk.

```
EYEBROW
What we'll cover
────────────────────────────────────────────
 01   Recap            Where we left off   [ 5 min ]
 02   The problem      Why it matters      [ 10 min ]
 03   The build        Live walkthrough    [ 20 min ]   ← all visible at once
 04   Q&A              Open floor          [ 5 min ]
```

**Data key:** reads `content.items[]` (see `02-data-model.md`).

---

## Type B — Interactive focus (`StepTimelineSlide` / `FocusTimelineSlide` / `AdvanceStepSlide`)

**What it is:** the items become a presenter-advanced **sequence**. Exactly one
step is **active** at any moment. On mount, the reveal lands on **step 0** ("the
first one"). The presenter advances → step 1 becomes active ("the second one"),
step 0 dims, a right-side detail panel cinematically swaps. This is the
"first one, second one" focus behavior the whole motion spec is built around.

**Active vs. neighbors** (the depth illusion, full numbers in `03-focus-animation.md`):

| State    | Title size token        | Title color        | Opacity |
|----------|-------------------------|--------------------|---------|
| Active   | `--step-title-active`   | `#FFFFFF` (pure)   | `1.0`   |
| Adjacent | `--step-title-adjacent` | `#FFFFFF / 0.75`   | `0.55`  |
| Far      | `--step-title-far`      | `#FFFFFF / 0.55`   | `0.30`  |

```
EYEBROW
Our process
┌──── 560px ────┐ 80gut ┌────── 800px ──────┐
│  ① Discover   │       │  eyebrow          │
│  ② Design  *  │ ───►  │  ─── gold rule    │   right panel swaps
│  ③ Deliver    │       │  description      │   on every active change
└───────────────┘       └───────────────────┘
▶  STEP 02 / 03
```

**Data key:** reads `content.steps[]` — a superset of the Type A item that adds
presenter narration (`description`), `expand`, and `revealSlide`.

### The three Type-B variants

| Variant | Shape | Use for |
|---------|-------|---------|
| `StepTimelineSlide` | Left rail of steps + right detail panel | Walking through a process live |
| `FocusTimelineSlide` | Timeline that spotlights one active step | Narrated, one-step-at-a-time |
| `AdvanceStepSlide` | Cinematic full-frame carousel, one step per advance | Big reveal |

All three share **one** state owner: the `useFocusTimeline` hook
(`active`, `hoveredIndex`, `pauseUntilRef`, `tryAdvance`). Never add a second
state machine (see `09-enums-and-state.md`).

---

## Decision table — A or B?

| Question | Type A (outline) | Type B (focus) |
|----------|------------------|----------------|
| Audience scans all items at once? | ✅ | ❌ (one at a time) |
| Presenter narrates each step in turn? | ❌ | ✅ |
| Needs per-step `description` / `expand` / `revealSlide`? | ❌ | ✅ |
| Advancing should move *within* the slide? | ❌ (leaves slide) | ✅ |
| Data key | `content.items[]` | `content.steps[]` |
| Autoplay possible? | n/a | yes (default OFF) |

## Migration cost between types

Because both consume the same index+title+capsule shape, switching A → B is
mostly: rename `items` → `steps`, add a `description` per step for the right
panel, and (optionally) `activeIndex` → driven by the hook instead of static.
**Never invent a third per-slide key.** `items[]` and `steps[]` are the only two.
