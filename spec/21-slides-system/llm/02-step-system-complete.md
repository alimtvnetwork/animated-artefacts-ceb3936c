# 02 — Step System (Canonical Playbook)

> **This file replaces — for new builds — every prior step spec:** 17,
> 18, 20, 23, 27, 32, 33, 36, 40. Those files are kept for archeology
> only. If you build a step slide today, follow this document.
>
> If a fact here contradicts an older spec, **this one wins.**

---

## 1. Reference images

| Target (what to ship) | Anti-pattern (broken layout — do NOT replicate) |
|-----------------------|--------------------------------------------------|
| ![target](./assets/step/target.png) | ![broken](./assets/step/broken-reference.png) |

The "broken" image shows: content jammed against the left edge, header
title and step list misaligned, right description column dead, ghost
numeral bleeding off-canvas. If your build looks like that, return to §4.

---

## 2. Two slide types — pick the right one

| Slide type | Use it when | Don't use it when |
|------------|-------------|-------------------|
| `StepTimelineSlide` | A vertical chain of 3–6 steps where the audience needs to **see all steps at once** plus a **single rich description** for the focused step. The presenter narrates while gradually focusing each row. | You want each step to fill the screen as its own moment. |
| `AdvanceStepSlide` | A 3–7-step methodology where each step deserves to fill the stage. Camera "dollies" from frame to frame on Next/Prev. | You need to show the whole chain at once. |

If the user just says "step slide", default to **`StepTimelineSlide`** —
it's the canon for the showcase deck (slide 3).

---

## 3. JSON shape (StepTimelineSlide canonical)

```jsonc
{
  "slideNumber": 3,
  "slideName": "process",
  "slideType": "StepTimelineSlide",
  "transition": "SlideIn",
  "textAnimation": "SlideUp",
  "enabled": true,
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "brandStrip": false,
  "titleStyle": "white",
  "titleShimmer": false,
  "sound": { "on": "focus", "kind": "whoosh", "volume": 0.5 },
  "content": {
    "eyebrow": "How we work",
    "title": "Engagement Process",
    "steps": [
      {
        "label": "Step 1",
        "title": "Discovery",
        "subtitle": "Listen, audit, align",
        "description": "Two-week intake — stakeholder interviews, asset audit, alignment workshop.",
        "capsule": { "text": "Week 1", "color": "gold" }
      },
      {
        "label": "Step 2",
        "title": "Strategy",
        "subtitle": "Frame the bet",
        "description": "We narrow to a single, measurable bet. One page, one team, one number.",
        "capsule": { "text": "Week 2-3", "color": "ember" },
        "cta": { "text": "See sample", "revealSlide": 7, "variant": "gold" }
      },
      {
        "label": "Step 3",
        "title": "Build",
        "subtitle": "Ship in increments",
        "description": "Two-week increments. Demo every Friday. Each increment shippable.",
        "capsule": { "text": "Week 4-8", "color": "cream" },
        "leftOffsetPx": 28
      },
      {
        "label": "Step 4",
        "title": "Scale",
        "subtitle": "Compound the wins",
        "description": "Ongoing optimisation. Quarterly review against the original bet.",
        "capsule": { "text": "Ongoing", "color": "outline" }
      }
    ]
  }
}
```

### Field reference

- `eyebrow`: gold, uppercase, tracking `0.18em`. Keep ≤ 4 words.
- `title`: deck-level slide title. White by default (`titleStyle: "white"`).
- `steps[]`: 3–6 items. Required: `label`, `title`. Optional: `subtitle`,
  `description`, `capsule`, `cta`, `leftOffsetPx`.
  - `label` reads as a small gold "STEP N" pill.
  - `subtitle` sits under the title in the **left** column.
  - `description` populates the **right** column (1–2 sentences).
  - `capsule` shows a colored chip — typical use: time-box ("Week 1").
  - `cta` is a clickable pill in the right panel; `href` opens new tab,
    `revealSlide` jumps inside the deck.
  - `leftOffsetPx` (0–80) snaps the row to the Logo/Body/Rail guides
    via the editor's snap buttons. Manual values are clamped.
- `sound`: defaults to `{ on: "focus", kind: "whoosh", volume: 0.45 }`.
  Set `mute: true` to silence this specific slide.

---

## 4. Layout — the centered 1440px composition

The canvas is **1920 × 1080**. The slide content lives in a centered
1440 px column with **240 px symmetric margins**.

```
┌──────────────────────── 1920 ────────────────────────┐
│ 240    ┌────────── 1440 (centered) ──────────┐  240  │
│ margin │           Header Zone                │ margin│   y: 80–260
│        ├──────────────────────────────────────┤       │
│        │  Step List (560)  ┊  Detail (800)   │       │   y: 300–860
│        │                   ┊                  │       │
│        ├──────────────────────────────────────┤       │
│        │           Footer Zone                │       │   y: 900–1000
│        └──────────────────────────────────────┘       │
└───────────────────────────────────────────────────────┘
```

Tokens (see `src/slides/types/StepTimelineSlide.tsx` + spec 32):

| CSS var | Value |
|---------|-------|
| `--slide-safe-inset`           | `80px`   |
| `--slide-content-max-width`    | `1440px` |
| `--slide-content-x-start`      | `240px`  |
| `--slide-content-x-end`        | `1680px` |
| `--slide-header-zone-top`      | `80px`   |
| `--slide-header-zone-height`   | `180px`  |
| `--slide-body-zone-top`        | `300px`  |
| `--slide-body-zone-height`     | `560px`  |
| `--slide-footer-zone-top`      | `900px`  |
| `--step-list-column-width`     | `560px`  |
| `--step-detail-column-width`   | `800px`  |
| `--step-body-gutter`           | `80px`   |
| `--step-decorative-number-size`| `32rem`  |

**Math sanity:** `560 + 80 + 800 = 1440 ✓`. `(1920 − 1440) / 2 = 240 ✓`.

### Critical alignment rules

1. Header title left edge **==** Step List column left edge **==** `x = 240`.
2. Step Detail Panel right edge **≤** `x = 1680`.
3. Empty space left of `240` and right of `1680` is **equal**.
4. Footer dots centered on the **canvas centerline** (`x = 960`), NOT
   the body content centerline.
5. The composition is symmetric around `x = 960` even though the inner
   two-column grid is asymmetric — the heavier reading-text mass on the
   right keeps optical center balanced.

If your slide is jammed left or jammed right, you have **NOT** applied
this rule. Re-read it.

---

## 5. Row anatomy — fixed-slot rule

Each `.step-row` reserves its **active** size as its slot height so
focus changes don't reflow siblings:

```css
.step-row {
  min-height: calc(var(--step-title-active) * 1.05);
  display: flex;
  align-items: center;
}
```

Result: when a row activates and the title font-size grows, the outer
box does **not** change height. Emphasis moves; the chain does not.

**No `transform: scale()` anywhere on rows.** Depth reads through real
font-size jumps + opacity + a constant pure-white text color.

---

## 6. Typography (Ubuntu Bold, white at every state)

Step row titles are **deck headers**, not body text:

```css
.step-row .step-title {
  font-family: 'Ubuntu', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 700;
  color: hsl(0 0% 100%);
}
```

Inactive rows fade via the **row container's `opacity`** (1 / 0.55 /
0.30), not via translucent text color. White-at-low-opacity reads
correctly recessed against `#0D0D0D`.

| Element | Class / size |
|---------|--------------|
| Eyebrow above row title | `STEP NN`, 12px, `tracking-[0.32em]`, gold |
| Step title (`h3`)       | `text-3xl md:text-4xl xl:text-5xl`, leading `1.05` |
| Subtitle                | `text-lg`, `text-foreground/65`, `mt-2` |
| Right description       | `text-xl md:text-2xl`, `text-foreground/85`, `max-w-prose` |

The slide-level `<h2>` ("Engagement Process") follows the deck preset
(Ubuntu, clamp sizing) — see file 05.

---

## 7. Right-panel description — cinematic snap

The right column is a **single sticky panel** keyed by the focused
step. On every focus change:

- Wrap in `<AnimatePresence mode="wait" initial={false}>` so the
  outgoing panel exits before the new one enters.
- **Enter** (forward focus): `{ opacity: 0, x: -32, filter: 'blur(6px)' }`
  → `{ opacity: 1, x: 0, filter: 'blur(0)' }`, **1100 ms**, easing
  `cubic-bezier(0.19, 1, 0.22, 1)` (expo-out).
- **Exit:** `{ opacity: 0, x: 24, filter: 'blur(4px)' }`, **250 ms**,
  same easing.
- Inside the panel, **stagger** children:
  - eyebrow → delay 0.05s
  - gold rule width 0 → 56px, delay 0.12s, dur 0.4s
  - description text, delay 0.18s, dur 0.4s
  - capsule, delay 0.26s
  - CTA pill, delay 0.30s, slide-up 6px

**Reduced motion:** swap the whole snap for a 150 ms opacity crossfade.
No `x`, no `blur`, no `scale`. The autoplay still runs (slide is still
navigable) but loses its cinematic edge.

---

## 8. Active-row entry (left column)

| Beat | Value |
|------|-------|
| Active text slide-in | `translateX -32px → 0`, 1100 ms |
| Active opacity       | 0 → 1, 1100 ms |
| Easing               | `cubic-bezier(0.19, 1, 0.22, 1)` |
| Badge "bubble-in"    | one-shot scale 0.8 → 1.05 → 1, 320 ms |
| Badge halo (radiate) | infinite 2400 ms ease-in-out (see §9) |

The active step badge is `h-12 w-12` (slightly bigger than the
`h-11 w-11` inactive badges). Reduced motion drops the radiate animation
but keeps the static glow.

---

## 9. Background — ghost numeral + ambient field

The active step's number (`01`, `02`, …) is stamped as a **giant faded
numeral** behind the right column:

| Property | Value |
|----------|-------|
| Position | `absolute; right: 80px; top: 50%; translateY(-50%)` |
| Font     | `font-display`, weight 900 |
| Size     | `clamp(20rem, 38vw, 44rem)` |
| Color    | `hsl(var(--gold) / 0.045)` (only just visible against noir) |
| z-index  | `0` (behind content), `pointer-events: none`, `aria-hidden` |

Cross-fade behavior: `<AnimatePresence mode="sync">` keyed on the active
index. Old numeral fades out ~700 ms; new fades in ~900 ms (delayed
150 ms) so they overlap softly.

The slide also wraps its body in `<AmbientBackground>` (file 04). On
the StepTimeline this is **always on** — the slide ignores the
`ambientBackground` JSON field and renders its own theme-specific layer
(devtools-flavored icons, see `STEP_AMBIENT_POOL` in
`src/slides/types/StepTimelineSlide.tsx`).

---

## 10. Active-step badge — radiate keyframe

```css
@keyframes step-badge-radiate {
  0%, 100% {
    box-shadow:
      0 0 0 0 hsl(var(--gold) / 0.55),
      0 0 24px -2px hsl(var(--gold) / 0.55);
  }
  50% {
    box-shadow:
      0 0 0 10px hsl(var(--gold) / 0),
      0 0 36px -2px hsl(var(--gold) / 0.85);
  }
}
.step-badge-radiate { animation: step-badge-radiate 2400ms ease-in-out infinite; }
```

---

## 11. Interaction layer

| Trigger | Effect |
|---------|--------|
| `ArrowRight` / `ArrowDown` | `focusNext()`, plays `whoosh`. |
| `ArrowLeft`  / `ArrowUp`   | `focusPrev()`, plays `whoosh`. |
| `Home` / `End`             | jump to first / last. |
| Digit `1`–`9`              | jump to that step. |
| `p` / `P`                  | toggle autoplay. |
| Click a row                | focus + play `fadeClick` precursor + `whoosh`. |
| Click the autoplay pill    | toggle, `aria-pressed` flips. |

**Listener guards:** ignore when `event.target` is `<input>`,
`<textarea>`, `<select>`, or `[contenteditable]`. The deck's other
inputs must keep working.

**Autoplay:**
- `STEP_INTERVAL_MS = 2200`. Manual interaction pushes a pause window:
  `pauseUntil = Date.now() + 6000`. Autoplay no-ops while paused.
- Default OFF (the user wants to drive). Reduced-motion forces OFF.

**ArrowLeft/Right + Space/Enter** are *also* the deck's prev/next.
StepTimelineSlide owns them via the `useFocusTimeline` `tryAdvance`
contract:

```ts
// pseudo
tryAdvance(dir) {
  if (atChainEdge(dir)) return false; // tells deck to advance to sibling slide
  setActive(active + dir);
  return true;
}
```

So when the audience is on the last step and the presenter hits Right,
the deck moves to the next slide.

---

## 12. Per-row snap-to-guide (`leftOffsetPx`)

The Step editor reads live x-coordinates from the alignment overlay
(`src/slides/components/SlidePreviewAlignmentOverlay.tsx`) via the
`guidePositions` pub/sub store and lets the author one-click-snap each
row to the **Logo edge**, **Body grid edge**, or **Timeline rail**:

```
leftOffsetPx = max(0, guideX - bodyX)
```

Clamped to `[0, 80]` at runtime. Renders as inline `paddingLeft` on the
row. When the alignment guide is OFF, the buttons fall back to:

| Button | Fallback offset |
|--------|----------------|
| Logo   | 0 |
| Body   | 0 |
| Rail   | 28 |

---

## 13. First-load quiet rule

When the slide mounts, `active = -1` while a stagger-reveal plays. After
the reveal completes React sets `active = 0`. **Do NOT replay Step 1's
active animation or sound on this `-1 → 0` handoff** — Step 1 was
already visible during the reveal, so re-firing looks like a stutter.

```ts
const [hasLeftInitialStep, setHasLeftInitialStep] = useState(false);
useEffect(() => { if (active > 0) setHasLeftInitialStep(true); }, [active]);

const skippedInitialFocusSound = useRef(false);
useEffect(() => {
  if (active === 0 && !skippedInitialFocusSound.current) {
    skippedInitialFocusSound.current = true;
    return; // no whoosh for the first arrival
  }
  // …play whoosh as normal
}, [active]);
```

Returning to Step 1 *later* DOES play normally.

---

## 14. Active-step focus-into-view

After every nav action, scroll the active row into view with the
**least disruption**:

```ts
stepRefs.current[active]?.scrollIntoView({
  behavior: reduced ? 'auto' : 'smooth',
  block:    'nearest',
  inline:   'nearest',
});
```

Why `block: 'nearest'`: when the row is already on-screen, this is a
no-op. When it's clipped, it slides up *just enough* — never centers,
never over-scrolls.

---

## 15. Ambient layer (StepTimeline-specific)

The ambient pool, accent colors, and per-step rotation rules are in
`src/slides/types/StepTimelineSlide.tsx`. Six icons render at any
moment, picked deterministically by `(activeStep + iconIndex) % pool`:

```ts
const STEP_AMBIENT_POOL = [
  Code2, Terminal, GitBranch, Github, Figma, Boxes,
  Container, Cpu, Cloud, Database, Braces, Bug,
];
const AMBIENT_PER_STEP = 6;
const AMBIENT_SIZE_RANGE: [number, number] = [36, 72];

const ICON_BRAND_COLORS = new Map([
  [Code2,    '#007ACC'],
  [Figma,    '#F24E1E'],
  [Github,   '#FFFFFF'],
  [Cloud,    '#4FC3F7'],
  [Database, '#F0DB4F'],
]);
```

One icon per step gets a real brand-color accent; the rest stay faded
white silhouettes. Sizes 36–72 px (don't go bigger — they overlap the
right description text).

---

## 16. AdvanceStepSlide — short version

`AdvanceStepSlide` is a **separate slide type**, not a variant.

- Vertical reel of N frames, each 1920×1080.
- Camera (`translateY` of the strip) moves by exactly **one frame** per
  Next/Prev with a soft spring.
- Active frame: scale `1.0`, opacity `1`. Adjacent frames: scale `0.78`,
  opacity `0.4`. Far frames: scale `0.65`, opacity `0`.
- Active frame text staggers in **after** the camera lands:
  eyebrow (delay 0.55) → title (0.62) → rule (0.78) → body (0.88) →
  capsule (0.92).
- Default `showBrandHeader: false` (the slide paints its own header
  overlay; two logos would stack).
- Default sound: `{ on: 'focus', kind: 'whoosh', volume: 0.45 }`.
- Owns Next/Prev via the same `tryAdvance` contract.
- See `src/slides/types/AdvanceStepSlide.tsx` for the implementation.

---

## 17. Acceptance checklist (run before shipping any step slide)

- [ ] Header title and step list left edges line up to the pixel
      (`x = 240`).
- [ ] Left and right margins are equal (`240px` each on a 1920 canvas).
- [ ] No content jammed against the left edge of the slide stage.
- [ ] Ghost numeral sits behind the right column, doesn't shift layout.
- [ ] Footer dots centered on canvas centerline (`x = 960`).
- [ ] Active step description sits to the right of the active row at
      the same vertical midpoint (±8 px).
- [ ] Step row titles in **Ubuntu Bold**, color pure white at every
      state.
- [ ] Active-row text slide-in is **1100 ms expo-out** with `x = -32`.
- [ ] Right description swap uses **AnimatePresence mode="wait"**.
- [ ] Reduced-motion: every animation collapses to a 150 ms opacity
      crossfade.
- [ ] Fresh load: Step 1 is visible but does **not** replay activation
      animation or sound.
- [ ] Move to Step 2: animation + whoosh play normally.
- [ ] Click the per-step CTA: plays `click` then opens new tab or
      `navigate(/N)`.
- [ ] `leftOffsetPx` snap buttons (Logo / Body / Rail) update the row
      padding when the alignment guide is on.
- [ ] Pressing `→` on the last step advances to the next slide
      (deck-level), not a no-op.
- [ ] No `transform: scale()` anywhere on a step row.
- [ ] No hard-coded hex values — all colors via `hsl(var(--token))`.

---

## 18. FocusTimelineSlide — third step variant (carousel)

> **Closes Audit-16 §2.3.** This was previously inferred from the JSON
> template only. Below is the runtime contract.

`FocusTimelineSlide` (`src/slides/types/FocusTimelineSlide.tsx`) is the
**horizontal** sibling of `StepTimelineSlide`. Pick it when each step is
a single keyword (no description) and the audience benefits from seeing
a sliding window of N items rather than a vertical chain.

### 18.1 Required JSON

```json
{
  "slideType": "FocusTimelineSlide",
  "content": {
    "title": "Roadmap",
    "steps": [
      { "title": "Discover" },
      { "title": "Define" },
      { "title": "Design" },
      { "title": "Deliver" },
      { "title": "Iterate" }
    ],
    "windowSize": 3,
    "autoplayMs": 2200
  }
}
```

| Field | Type | Default | Purpose |
|---|---|---|---|
| `windowSize` | int 3–5 | `3` | How many items are simultaneously visible. Active item is **center** (index `floor(windowSize/2)`). |
| `autoplayMs` | int | `2200` | Same `STEP_INTERVAL_MS` semantics as StepTimelineSlide; `0` disables. |

### 18.2 Layout math (1920×1080 canvas)

- Track is centered on `x = 960`. Total track width = `windowSize × 320 + (windowSize-1) × 40` (slot 320px, gap 40px). For `windowSize: 3` → `1040px` track.
- Active slot = center; off-center slots scale to `0.78` and opacity `0.55`.
- On `focusNext`, all slots translate left by `360px` (slot+gap) over `600ms ease [0.22,1,0.36,1]`; the now-leftmost slot is removed and a new one appended on the right.
- Title sits at the standard `pt-32` band (matches `02 §4`). Track sits at vertical center (`y = 540 ± 24`).

### 18.3 Imperative handle

Same `tryAdvance(dir)` contract as StepTimeline (see `src/slides/hooks/useFocusTimeline.ts`). Deck Next/Prev walk the focus first; only at chain edges does navigation escape to siblings.

### 18.4 Sound

Single `whoosh` per focus change (no `fadeClick` precursor — the carousel never accepts row clicks). `volume: 0.5` like StepTimeline.

### 18.5 Acceptance

- [ ] Active item is the **center** of the visible window, not the first.
- [ ] On a `windowSize: 3` deck of 5 items, you must see all 5 cycle through the center within `4 × autoplayMs`.
- [ ] Reduced-motion: opacity-only swap at center, no translate, 150ms.
- [ ] First load: center item is visible but its activation animation is suppressed (matches StepTimeline §13).
