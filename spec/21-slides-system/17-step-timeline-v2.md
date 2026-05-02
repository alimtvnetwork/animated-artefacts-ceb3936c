# Spec 17 — StepTimelineSlide v2 (Autoplay + Keyboard + Hover/Select Reveal)

> **Codename to refer to in chat:** "**steps implementation**" (or "step timeline v2").
> When the user says "use the steps implementation here" any AI must rebuild the
> slide following this spec verbatim. The runtime source of truth is
> `src/slides/types/StepTimelineSlide.tsx`. JSON is `slideType: "StepTimelineSlide"`.

---

## 1. Purpose

Vertical, sequential step list (`Step 1 → Step N`) used to walk an audience
through a process (engagement, onboarding, methodology). Designed for a
**presenter-paced** experience but with an **autoplay** demo mode for
unattended kiosks / loops.

---

## 2. Anatomy

```
┌──────────────────────────────────────────────────────┐
│ EYEBROW  (gold, uppercase, tracking-[0.18em])         │
│ Title    (display, gradient cream by default)         │
│                                                       │
│ ┌─────────────────────┐  ┌────────────┐  [▶ Auto]   │
│ │● STEP 3 / 4         │  │▓▓▓▓▓░░░░░ │   pill        │ <- progress row
│ └─────────────────────┘  └────────────┘               │
│                                                       │
│ │   ① ─ STEP 1 — Discovery   [Week 1]                │
│ │       Listen, audit, align                          │
│ │       ╭─────────────────────────────╮ ← reveal     │
│ │       │ Extra description fades+    │   panel      │
│ │       │ slides in on hover/active   │              │
│ │       ╰─────────────────────────────╯              │
│ │   ✓ ─ STEP 2 — Strategy    [Week 2-3]              │
│ │   ② ─ STEP 3 — Build       [Week 4-8]  ← active    │
│ │   ○ ─ STEP 4 — Scale       [Ongoing]               │
└──────────────────────────────────────────────────────┘
```

- Vertical gold connector (`absolute left-[18px]`, `w-px`, `bg-gold/20`).
- Active connector (`bg-gold` + `shadow-[0_0_8px_hsl(var(--gold)/0.6)]`)
  fills from top down to the active step's chip center.
- Each step row: numbered chip (36×36, rounded-full) + label/title/subtitle
  block + optional `Capsule` chip.

---

## 3. State machine

```
       [ revealing ]  ← REVEAL_BASE_DELAY + i*REVEAL_STAGGER per row
            │
            ▼ (after last row + 0.5s)
       [ idle ]
        │      │
   user │      │ autoplay
   hovers/     │ tick
   clicks      ▼
        │   [ active = (active+1) % total ]
        ▼
   [ paused ]  ← Date.now() < pauseUntil
        │
        ▼ (after PAUSE_MS)
   resume autoplay (if enabled)
```

- `active: number` — `-1` while revealing, `0..total-1` afterwards.
- `autoplay: boolean` — defaults to `true` when `prefers-reduced-motion` is
  off, `false` otherwise.
- `hoveredIndex: number | null` — independent of `active`; drives the reveal
  panel without disturbing autoplay.
- `pauseUntilRef` — timestamp; manual interactions (click, keyboard) push it
  to `Date.now() + PAUSE_MS`.

---

## 4. Constants (do not change without a migration note)

| Token              | Value         | Why                                         |
|--------------------|---------------|---------------------------------------------|
| `STEP_INTERVAL_MS` | `2200`        | Slow enough to read a 6-word title.         |
| `PAUSE_MS`         | `6000`        | Lets a presenter explain after a manual pick. |
| `REVEAL_BASE_DELAY`| `0.3 s`       | Starts after the title text settles.        |
| `REVEAL_STAGGER`   | `0.18 s`      | Per-row stagger for the entrance.           |
| `REVEAL_DUR`       | `0.5 s`       | Per-row entrance duration.                  |
| `EASING`           | `[0.22, 1, 0.36, 1]` | Project-standard out-cubic. |
| `DESC_REVEAL_MS`   | `0.35 s`      | Description panel fade+slide-in duration.   |
| `DESC_OFFSET_PX`   | `8`           | Distance the panel slides up from.          |

---

## 5. Autoplay control

- A small **▶ Auto / ⏸ Auto** pill sits at the right end of the progress row,
  same height (`h-7`), gold border, monospace label.
- Clicking toggles `autoplay`. The icon swaps (`Play` ↔ `Pause` from
  `lucide-react`). `aria-pressed` reflects the state.
- When `autoplay` flips OFF the interval is cleared but `active` stays put —
  the audience does not lose context.
- When `autoplay` flips ON mid-presentation, the next tick fires after
  `STEP_INTERVAL_MS`, not immediately, so the change feels intentional.
- Autoplay also pauses (without flipping the toggle) while
  `Date.now() < pauseUntil`. The toggle only reflects user intent; the pause
  window is internal.

---

## 6. Keyboard control (slide-scoped)

The slide attaches a `keydown` listener on `window` while it is mounted.
Listener guards: ignore when `event.target` is `<input>`, `<textarea>`,
`<select>`, or `contenteditable` (so the deck's other inputs keep working).

| Key                  | Action                                                          |
|----------------------|-----------------------------------------------------------------|
| `ArrowDown`, `j`     | `active = (active + 1) % total`, push pauseUntil.               |
| `ArrowUp`,   `k`     | `active = (active - 1 + total) % total`, push pauseUntil.       |
| `Home`               | `active = 0`, push pauseUntil.                                  |
| `End`                | `active = total - 1`, push pauseUntil.                          |
| `1`..`9`             | `active = min(digit-1, total-1)`, push pauseUntil.              |
| `p` / `P`            | Toggle `autoplay`.                                              |

> ⚠️ **Do not bind ArrowLeft / ArrowRight / Space / Enter** — those are
> reserved for the deck-level prev/next/grid handlers in `SlideDeckPage`.

---

## 7. Hover / selection description reveal

Every step may carry an optional `description` (already in `StepSpec`). When
present:

- The description panel sits **immediately under the step's title/subtitle
  block**, indented to align with the title (left padding matches the
  numbered chip's right edge + the row gap, ≈ `60px`).
- It is hidden by default. It animates **in** when the row is either the
  `active` step OR the `hoveredIndex`. It animates **out** otherwise.
- Animation:
  ```ts
  initial: { opacity: 0, y: 8, height: 0 }
  animate: { opacity: 1, y: 0, height: 'auto' }
  exit:    { opacity: 0, y: 4, height: 0 }
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  ```
  Use Framer Motion's `<AnimatePresence initial={false}>` so the very first
  active row's panel still animates *in* (not pop-in).
- Visual: subtle left border in gold (`border-l-2 border-gold/40`), padding
  `pl-4 py-2`, body text `text-foreground/70`, max width `max-w-prose`.
- The panel must NOT shift the row above it — siblings re-flow downward
  (height tween handles this).
- If the description is `undefined` or empty string the panel is not
  rendered at all (no empty stub, no border).

Hover behavior:

- `onMouseEnter` / `onMouseLeave` on the row sets/clears `hoveredIndex`.
- Hover does **not** push `pauseUntil` (so autoplay keeps marching while the
  presenter explores). Click / keyboard do push it.
- `hoveredIndex` takes priority over `active` ONLY for the description panel
  — the chip glow / connector still follow `active`.

---

## 8. Reduced motion

When `useReducedMotion()` returns true:

- `autoplay` defaults to `false` (no auto-cycling).
- Reveal entrance is skipped: rows render at final state.
- Connector is fully filled at mount (`scaleY: 1`).
- The description panel still renders for the active/hovered row, but the
  height tween is replaced with a snap (`transition: { duration: 0 }`).
- The pulsing chip ring is not rendered.

---

## 9. Accessibility

- Each step is a `<button type="button">` with `aria-current="step"` when
  active.
- The progress pill has `aria-live="polite"` so screen-readers announce
  "Step 3 of 4" when autoplay or keyboard advances.
- The autoplay toggle: `aria-label="Toggle autoplay"`, `aria-pressed`.
- The description panel uses `role="region"` with `aria-label="Step details"`
  so it is not announced as a generic group.
- All interactive elements expose visible focus rings
  (`focus-visible:ring-2 focus-visible:ring-gold/60`).

---

## 10. JSON shape (unchanged from v1 — `description` already supported)

```json
{
  "slideType": "StepTimelineSlide",
  "content": {
    "eyebrow": "How we work",
    "title": "Engagement Process",
    "steps": [
      {
        "label": "Step 1",
        "title": "Discovery",
        "subtitle": "Listen, audit, align",
        "description": "Two-week intake: stakeholder interviews, audit of existing assets, alignment workshop. Output: a one-page brief signed by everyone in the room.",
        "capsule": { "text": "Week 1", "color": "gold" }
      }
    ]
  }
}
```

> Authors who don't want the reveal panel simply omit `description`.

---

## 11. Files of record

- Implementation: `src/slides/types/StepTimelineSlide.tsx`
- Spec: this file (`spec/slides/17-step-timeline-v2.md`)
- Memory: `.lovable/memory/features/step-timeline-v2.md`
- Schema: `spec/slides/slide.schema.json` (`StepSpec.description`)

---

## 12. Test checklist

1. Autoplay advances every 2.2 s and loops back to step 1 after the last.
2. `▶ Auto` toggle stops/starts the cycle, `aria-pressed` flips.
3. `↑/↓`, `j/k`, `Home/End`, digit keys reposition the cursor and pause
   autoplay for 6 s.
4. Hover over an inactive step reveals its description panel (fade + slide
   from below + height tween) without changing the active chip.
5. Click on a step makes it active, reveals its description, and pauses
   autoplay for 6 s.
6. With `prefers-reduced-motion: reduce` the slide renders fully populated
   with no cycling and no animated reveals.
7. Description panel is omitted entirely when the step has no `description`.

---

## 13. v2.1 addendum (2026-04-26) — readable focus + sound

The deck uses a flow layout (not a fixed 1920×1080 canvas), so the user
asked for the slide to "feel focused, with bigger readable text". This
addendum locks the **bigger type ramp**, the **brand-header guidance**, and
**sound on focus arrival**.

### 13.1 Type ramp (locked)

| Element              | Old              | New (v2.1)                                     | Why                                            |
|----------------------|------------------|------------------------------------------------|------------------------------------------------|
| Outer container      | `max-w-5xl`      | `max-w-6xl`                                    | More breathing room for the bigger title.      |
| Row vertical gap     | `space-y-7`      | `space-y-10`                                   | Match the new ramp.                            |
| Step `h3` title      | `text-3xl`       | `text-4xl md:text-5xl xl:text-6xl`, leading `1.05` | Step title becomes the visual focus.       |
| Step subtitle        | `text-base`      | `text-lg md:text-xl`, `mt-2`                   | Pairs with the bigger title.                   |
| Description panel    | `text-base`      | `text-lg md:text-xl`                           | Reads at distance.                             |

The connector / chip / progress pill / autoplay toggle sizes are unchanged
(they're chrome, not content). The slide-level eyebrow + headline come from
the deck preset and are unaffected.

### 13.2 Brand-header guidance

The deck-wide `RiseupAsia` logo (top-left, painted by `BrandHeader` when
the slide sets `showBrandHeader: true`) competes with the slide's own
`eyebrow + h2` headline. **For StepTimelineSlide we recommend
`showBrandHeader: false`** in the showcase deck so the headline owns the
top-left visual zone. The right-side brand strip (`RISEUP ASIA LLC · 2026
DECK`) and the controller pill stay — they're chrome.

This is a recommendation, not a hard rule. Authors may keep the brand
header on internal/training decks where the wordmark is required at all
times.

### 13.3 Sound on `active` change

Each time `active` changes (autoplay tick, click, keyboard nav, digit key)
the slide plays exactly one cue from the **slide sound system** (spec 21).
Default: `{ on: 'focus', kind: 'whoosh', volume: 0.35 }`.

- The first arrival (when the reveal stagger hands off `active = 0`) DOES
  play. It's the audible cue that the slide is "live" and the cursor has
  landed.
- Hover changes do **not** play sound — only `active` changes do. (Hover
  is a passive read; `active` is a navigation event.)
- Reduced-motion users still hear the cue. Authors can opt out per slide
  with `sound.mute: true`.
- Authors override per slide via the `SlideSpec.sound` field. Omitting the
  field uses the default above.

### 13.4 Description side panel (locked 2026-04-26, supersedes §8 inline panel)

The description must read **cinematically**, not as a footnote. The user's
phrasing: "the title comes from the left, so the description should fade and
slide in from left to right on the right side — it should feel filmy."

Layout — the slide body becomes a **two-column grid** below the headline +
progress row:

```
┌────────────────────────────── slide body ──────────────────────────────┐
│  ┌─ left column (timeline) ────┐   ┌─ right column (description) ────┐ │
│  │  ① Discovery                │   │                                 │ │
│  │  ● Strategy   ◀ active      │   │   STEP 02 — Strategy            │ │
│  │  ○ Build                    │   │   ─────                         │ │
│  │  ○ Scale                    │   │   We narrow to a single,        │ │
│  │                             │   │   measurable bet. One page,     │ │
│  │                             │   │   one team, one number to move. │ │
│  └─────────────────────────────┘   └─────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

Grid spec:

- Container: `grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-12 xl:gap-20 items-start`.
- Left column: existing timeline list (chip + label + title + subtitle).
  The inline description block under each row is **REMOVED** — there is now
  a single description region for the whole slide.
- Right column: a **single sticky panel** keyed by the active/hovered
  step index. When the key changes, the old panel exits to the right and
  the new one enters from the left.
- Below `lg`: collapse to single column. The right column stacks under the
  timeline and uses a shorter slide distance (`x: -16` instead of `-40`).

Right-panel content:

```
STEP NN — {step.title}      ← gold, 12px, tracking-[0.32em], uppercase
─────                        ← 56×2 gold rule, mt-3 mb-6
{step.description}           ← text-xl md:text-2xl, leading-relaxed,
                               text-foreground/85, max-w-prose
{step.capsule, if any}       ← reused capsule, mt-6
```

Animation contract for the right panel:

- Wrapped in `<AnimatePresence mode="wait" initial={false}>` so each
  description swap waits for the previous one to exit before entering.
- Enter: `{ opacity: 0, x: -40, filter: 'blur(6px)' }` →
  `{ opacity: 1, x: 0, filter: 'blur(0px)' }` over **0.45s** with ease
  `[0.22, 1, 0.36, 1]`.
- Exit: `{ opacity: 0, x: 24, filter: 'blur(4px)' }` over **0.25s** same
  ease.
- Stagger inside the panel: eyebrow (delay 0.05s) → rule width 0→56px
  (delay 0.12s, duration 0.4s) → description text (delay 0.18s, duration
  0.4s) → capsule (delay 0.26s). All re-key on the active step so each
  swap replays the staggered entrance.
- Reduced motion: skip blur + x; render `opacity 0 → 1` over 0.15s. No
  exit animation (snap).
- Hover override behavior is unchanged: `hoveredIndex ?? active` drives
  the panel; chip glow + connector stay bound to `active`.
- If the active step has no `description`, the right panel renders just
  the eyebrow + rule + (capsule if any) so the column doesn't visually
  collapse mid-deck.

Left column tweaks (because it now shares the canvas):

- Outer max width drops from `max-w-6xl` → `max-w-7xl` overall, but each
  column lives in its own `min-w-0` cell so long step titles wrap inside
  the left column instead of pushing the right column off-screen.
- Step `h3` ramp drops one stop on the largest breakpoint:
  `text-3xl md:text-4xl xl:text-5xl` (the right panel now carries the
  visual weight of the description, so the title doesn't need to be the
  loudest element on the slide).
- Subtitle stays `text-lg`.
- Row gap stays `space-y-10`.

### 13.5 Test additions

8. The step titles read clearly at booth distance (≥ 30px on a 14"
   laptop, ≥ 40px on a 27" monitor) — they're now part of a two-column
   composition, not the sole hero.
9. With `showBrandHeader: false` the top-left RiseupAsia logo is gone but
   the right-side brand strip and bottom controller stay.
10. Each `active` change (autoplay, click, ↑/↓, digit) fires exactly one
    whoosh after the user has clicked anywhere on the page (autoplay
    policy). Hovering a row never plays a sound.
11. Setting `sound.mute: true` on the slide silences the cue; setting
    `sound.kind: "click"` swaps to the click synth.
12. The description appears **only** in the right column. There is no
    inline description block under any row in the left column.
13. When `active` changes (or hover swaps the focused step), the right
    panel's previous content slides out to the right and the new content
    slides in from the left over ~0.45s with a soft blur ramp. Both
    movements are visible — the swap reads as "filmy", not as a fade.
14. With `prefers-reduced-motion`, the right panel content swaps via a
    150ms opacity crossfade with no x movement and no blur.
15. On viewports below `lg` the right column stacks under the timeline
    with the same enter animation but a shorter slide distance.

---

## 14. v2.2 addendum (2026-04-26) — pause UX, step-first nav, dim-card focus

User feedback after v2.1:

1. The active row's "border" looked harsh in pause mode (it was actually the
   `focus-visible:ring-2` fired by keyboard navigation; the visual still
   read as a heavy orange box).
2. Autoplay should default to **OFF** so the presenter is in control.
3. The pause/play pill should be **icon-only, no label** — the meaning is
   universal and the word "PAUSED" doubled the visual weight of the row.
4. The deck's Next/Prev buttons should walk the **steps** first and only
   advance to a sibling slide once the chain edges are reached. Same
   contract as `AdvanceStepSlide` and `FocusTimelineSlide`.

### 14.1 Active row — dim card, no border (locked)

The active row sits in a soft gold-tinted card; **no border, no ring at
rest**. The card scales 1.015 and the title scales 1.04 (origin: left
center) so the focus reads cinematically — like the camera leans in on
this row — without ever drawing a rectangle.

```
inactive row: { backgroundColor: 'transparent' }
hovered row : { backgroundColor: 'hsl(var(--foreground) / 0.025)' }
active row  : { backgroundColor: 'hsl(var(--gold) / 0.07)',
                scale: 1.015, transformOrigin: 'left center' }
title scale : isActive ? 1.04 : 1, transformOrigin: 'left center'
transition  : 0.35-0.40s ease [0.22, 1, 0.36, 1]
```

Each row button now wraps in a `rounded-2xl px-4 py-3 -mx-4` card so the
gold tint has visible padding on all sides without pushing the timeline
column wider.

The focus ring is softened to `focus-visible:ring-1 focus-visible:ring-gold/40`
and the `ring-offset-2` is removed entirely (offset rings paint a hollow
rectangle one ring-width outside the element, which read as the second
border in the user's screenshot). Mouse interaction never paints a ring
because we only style `focus-visible`.

### 14.2 Autoplay — OFF by default, icon-only toggle (locked)

```
const [autoplay, setAutoplay] = useState<boolean>(false);   // not !reduced
```

Reduced-motion behavior is unchanged: it still skips the reveal and snaps
to step `total - 1`. The `P` keyboard shortcut still toggles autoplay.

The toggle pill is replaced with a 28×28px round icon button (`h-7 w-7
rounded-full border`). It shows a `<Play>` icon when paused and a
`<Pause>` icon when playing. **No label text.** Hover lifts the border
opacity. The play icon is nudged 1px right (`translate-x-[1px]`) so the
optical center matches the pause icon.

`aria-label` swaps between `"Play autoplay"` and `"Pause autoplay"`.
`aria-pressed` reflects the autoplay state. No `title` tooltip — the icon
plus aria-label is enough.

### 14.3 Step-first Next/Prev (locked)

`StepTimelineSlide` now exports as `forwardRef<FocusTimelineHandle>` and
exposes `tryAdvance(dir)` via `useImperativeHandle`. Wired in
`SlideStage` exactly like `AdvanceStepSlide`:

```tsx
case 'StepTimelineSlide':
  return <StepTimelineSlide ref={focusRef} spec={slide} />;
```

Contract:

| State                         | `tryAdvance('forward')`                | `tryAdvance('backward')`               |
|-------------------------------|----------------------------------------|----------------------------------------|
| Pre-reveal (`active === -1`)  | Snap to step 0, return `true`          | Return `false` (deck goes to prev slide) |
| On a middle step              | `active += 1`, return `true`           | `active -= 1`, return `true`            |
| On the last step (forward)    | Return `false` (deck advances)         | n/a                                    |
| On step 0 (backward)          | n/a                                    | Return `false` (deck goes back)        |

Every successful `tryAdvance` also calls `pushPause()` so deck-driven
navigation pauses autoplay for `PAUSE_MS` just like a click would. Sound
fires through the existing `active`-change effect.

### 14.4 Test additions

16. The active row has **no rectangular border or ring** at rest. It reads
    via the gold chip + soft gold-tinted background card + a 1.015 card
    scale + a 1.04 title scale.
17. Tabbing to a row paints only a hairline `ring-1 ring-gold/40` with no
    offset — there is no second box outside the card.
18. Loading the slide leaves autoplay **OFF**. The toggle is a small round
    button showing a Play icon; clicking it swaps to a Pause icon and
    starts the cursor.
19. Pressing the deck's Next button on `/3` advances Discovery → Strategy
    → Build → Scale **without changing slides**. Only the 5th forward
    press leaves the slide. Reverse direction works symmetrically.
20. Pressing Next during the pre-reveal phase snaps to step 0 (instead of
    blowing through the slide).
21. With `prefers-reduced-motion`, autoplay stays OFF, the active card
    background still tints (it's a color, not motion), but the 1.015 +
    1.04 scales collapse to 1.
