# Spec 61 — StepsChain3DSlide (Cinematic 3D Steps Chain)

> **Codename to refer to in chat:** "**steps chain 3D**".
> Runtime source of truth: `src/slides/types/StepsChain3DSlide.tsx`.
> JSON `slideType: "StepsChain3DSlide"` (new enum value, additive — does not
> replace `StepTimelineSlide`).
> Companion to spec 17 / 23 / 27 (StepTimelineSlide v1–v3) but **not** a
> behavioural replacement. Same data, new motion.

---

## 1. Why a new slide type

The existing `StepTimelineSlide` communicates the active step with a **solid
background fill** on the active card. That works at a glance but flattens the
slide and reads like a list. We want a deck moment that feels like a
**presentation animation**: a chain of items in 3D space where the active link
zooms forward, siblings recede, and the chain rotates like a revolver cylinder
from one chamber to the next. Active state must be communicated **purely
through scale, depth, opacity, and motion** — never through a coloured card
background.

The two slide types coexist:

- `StepTimelineSlide` — calm vertical list, autoplay-friendly, kiosk safe.
- `StepsChain3DSlide` — cinematic, presenter-driven, "AE bouncy zoom" feel.

---

## 2. Visual language

### 2.1 Chain metaphor

- Steps are vertical links in a chain connected by a single vertical line.
- Numeric markers sit **on** the line, slightly offset to the side (left edge
  of the marker passes through the line's centre).
- The active link sits forward in Z; siblings recede behind it.
- **No solid background** on the active card. Ever. Recognition comes from
  scale + sharpness + marker glow + crisp text.

### 2.2 Depth states (per step)

Distance `d = abs(index - activeIndex)`.

| State    | d   | Scale | Opacity | Blur   | TranslateZ |
| -------- | --- | ----- | ------- | ------ | ---------- |
| Active   | 0   | 1.00  | 1.00    | 0px    | 0px        |
| Adjacent | 1   | 0.85  | 0.55    | 0.5px  | -60px      |
| Distant  | ≥2  | 0.70  | 0.30    | 1.2px  | -140px     |

Depth values are tokens (CSS custom properties), not magic numbers in the
component. See §6.

### 2.3 Numeric markers

- Inactive: 36px circle, muted ring, `text-cream/55`, no glow.
- Active: scale 1 → 1.25 → 1 (overshoot), gold ring + radial glow, accent
  colour.
- Marker spring lands **~80ms after** the card spring settles, so the eye
  reads "card snaps in, number lights up" — not simultaneous.

---

## 3. Motion specification

All motion is **spring-based**, computed in JS via a hand-rolled spring solver
driving the **Web Animations API** (`element.animate(...)`). No
`framer-motion`. No CSS `transition` on the depth/zoom changes.

Animate **only `transform`, `opacity`, and `filter`**. Never animate layout
properties (width, height, top, left, margin).

### 3.1 Card spring (zoom + depth)

```
damping   = 14
stiffness = 180
mass      = 1
```

Perceived motion: 480–620ms total. Outgoing card eases from active → adjacent
state. Incoming card overshoots: `scale 0.85 → 1.04 → 1.00`.

### 3.2 Marker spring (bubble-up)

Same spring constants as card, but with a **+80ms delay** on activation, and
a slightly higher overshoot peak (`1.25` vs `1.04`).

### 3.3 Revolver rotation (chain container)

On every active-index change the chain container plays a one-shot
`rotateX 0deg → 4deg → 0deg` over ~520ms with `easeOutQuint`. Cap at **6deg**
maximum — beyond that the slide reads as broken, not cinematic.

### 3.4 Text slide-in (left, 3D faded)

The right-side detail panel (active step's title/subtitle/body/capsule) plays
a staggered slide-in:

| Element  | translateX | rotateY | opacity | delay  |
| -------- | ---------- | ------- | ------- | ------ |
| Label    | -32 → 0    | 6 → 0   | 0 → 1   | 0ms    |
| Title    | -32 → 0    | 6 → 0   | 0 → 1   | +60ms  |
| Subtitle | -32 → 0    | 6 → 0   | 0 → 1   | +120ms |

Same card spring, no overshoot on translate (overshoot only on the card scale
channel).

### 3.6 Cause-tagged transition variants

Every active-index change is tagged with the **cause** that produced it:

| Cause          | Source                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| `click`        | Pointer press directly on a step card                                    |
| `keyboard`     | Focused-card `ArrowUp/Down/Left/Right`, `Home`, `End`                   |
| `controller`   | Deck Next/Prev (keyboard arrows at deck level, controller pill, etc.)   |
| `programmatic` | `setStep(idx)` / `replay()` from the animation scrubber                 |

The motion variant chosen by the WAAPI effect depends on `cause`. All variants
keep the §3.1–§3.4 spring physics (damping 14, stiffness 180, mass 1) so the
deck reads consistently; only the **emphasis envelope** differs.

| Variant     | Card overshoot | Marker overshoot | Revolver tilt | Card press-pulse on clicked card |
| ----------- | -------------- | ---------------- | ------------- | -------------------------------- |
| click       | +0.06          | 0.30             | 5deg          | ON (existing CSS `data-pulse` re-fires on the clicked card only) |
| keyboard    | +0.04          | 0.25             | 4deg          | OFF                              |
| controller  | +0.04          | 0.25             | 4deg          | OFF                              |
| programmatic| +0.03          | 0.18             | 3deg          | OFF                              |

Reduced motion ignores `cause` entirely — the 180ms opacity crossfade applies
to every variant.

### 3.7 Reduced motion (`prefers-reduced-motion: reduce`)


- No `rotateX`, no `translateZ`, no `rotateY`, no overshoot.
- Active vs inactive distinction kept via **opacity + a flat 1.0 / 0.5 scale
  step** with a 180ms linear opacity crossfade.
- Marker glow is replaced with a static gold ring; no scale animation.

---

## 4. Layout

```
┌──────────────────────────────────────────────────────────┐
│  EYEBROW                                                 │
│  Title                                                   │
│                                                          │
│  ┌──────── perspective: 1200px ──────────┬────────────┐  │
│  │                                       │            │  │
│  │   ●─ Step 1   (recede)                │  ACTIVE    │  │
│  │   │                                   │  PANEL     │  │
│  │   ◉─ Step 2   (active, forward Z)    →│  label     │  │
│  │   │                                   │  title     │  │
│  │   ●─ Step 3   (adjacent)              │  subtitle  │  │
│  │   │                                   │  capsule   │  │
│  │   ●─ Step 4   (distant)               │            │  │
│  │                                       │            │  │
│  └───────────────────────────────────────┴────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- Outer wrapper: `perspective: 1200px; transform-style: preserve-3d;`.
- Vertical line: behind the cards (`z-index: 0`), in the same perspective
  space so it tilts with the chain.
- Markers: absolute on the line, `translate(-50%, -50%)`.
- Right detail panel: independent component, slides in with §3.4.

---

## 5. Component contract

```ts
// slideType: "StepsChain3DSlide"
type StepsChain3DContent = {
  eyebrow?: string;
  title?: string;
  steps: Array<{
    label: string;        // "Step 1"
    title: string;        // "Discovery"
    subtitle?: string;    // "Listen, audit, align"
    description?: string; // body for the right panel
    capsule?: { text: string; color: "gold" | "ember" | "cream" | "outline" };
  }>;
  // Optional knobs (all have safe defaults):
  perspectivePx?: number;       // default 1200
  revolverTiltDeg?: number;     // default 4, max 6
  markerDelayMs?: number;       // default 80
  spring?: { damping?: number; stiffness?: number; mass?: number };
};
```

State:

- Single `activeStepIndex: number` (driven by Next/Prev or click on a
  marker/card).
- Each step computes its `DepthState` from
  `distance = Math.abs(i - activeStepIndex)`:
  `0 → active`, `1 → adjacent`, `>=2 → distant`.

Navigation contract:

- `StepsChain3DSlide` is **presenter-driven only**. It must not auto-advance
  after mount, after hover, or after any timer.
- Valid active-step changes come only from explicit user/deck actions:
  direct card click, focused-card keyboard rove (`Arrow*`, `Home`, `End`),
  deck Next/Prev via `tryAdvance(dir)`, or the animation scrubber's
  `setStep(index)` / `replay()` handle.
- Deck-level hold-to-autoplay must be disabled while this slide is active.
  Pressing `Enter`, `Space`, or arrow keys may move **one step per discrete
  key press** only; holding a key must not schedule repeated `next()` calls.
- Deck Next/Prev and controller click buttons must call `tryAdvance(dir)` first.
  The slide consumes the action while another step exists in that direction;
  only at the first/last step may the deck navigate to a sibling slide.
- `replay()` may reset the active step to 0, but it must not start an automatic
  timer. The next movement still requires click, keyboard, controller, or
  scrubber input.
- **Click-only — no hover effect of any kind.** Step cards must not change
  appearance on hover (no glow ring, no marker brightening, no lift, no
  brightness/filter change). The pointer cursor is the only hover affordance.
  The activation animation triggered by the click is the entire user feedback.

Sound:

- **Preserve the existing step-change SFX exactly.** Reuse the same trigger
  hook used by `StepTimelineSlide` (`useStepSound` / `playStepWhoosh`).
- Do not add a second cue for the marker bubble or the panel slide-in.

---

## 6. Tokens (added to `src/index.css`)

```css
:root {
  /* Depth tokens for StepsChain3D */
  --chain-depth-active-scale:    1.00;
  --chain-depth-active-opacity:  1.00;
  --chain-depth-active-blur:     0px;
  --chain-depth-active-z:        0px;

  --chain-depth-adjacent-scale:    0.85;
  --chain-depth-adjacent-opacity:  0.55;
  --chain-depth-adjacent-blur:     0.5px;
  --chain-depth-adjacent-z:        -60px;

  --chain-depth-distant-scale:    0.70;
  --chain-depth-distant-opacity:  0.30;
  --chain-depth-distant-blur:     1.2px;
  --chain-depth-distant-z:        -140px;

  --chain-revolver-tilt: 4deg;
  --chain-perspective:  1200px;
}
```

Components must read these tokens via `getComputedStyle` at mount and feed
the spring solver. Never inline the magic numbers in the component.

---

## 7. Spring solver (hand-rolled WAAPI)

A small utility lives at `src/slides/lib/spring.ts`:

```ts
// Critically-tunable underdamped spring → keyframe array for WAAPI.
// Returns { keyframes: number[], durationMs: number }
springKeyframes({
  from: number,
  to: number,
  damping: number,    // default 14
  stiffness: number,  // default 180
  mass: number,       // default 1
  fps?: number,       // default 60
  settleEpsilon?: number, // default 0.001
}): { keyframes: number[]; durationMs: number };
```

- Integrates the spring at `1/fps` until both displacement and velocity are
  below `settleEpsilon` for two consecutive frames.
- Caps duration at 1200ms as a safety net.
- Pure function — no DOM. The component multiplies the resulting normalized
  keyframes into transform strings and hands them to `el.animate(...)`.

---

## 8. Acceptance criteria

1. Active step has **no solid background fill**. Recognisable purely by
   scale, sharpness, and number glow.
2. Switching steps shows a clear **bouncy zoom** on the new active step and
   a **recede** on the previous.
3. Inactive steps are smaller, dimmer, slightly blurred; depth grows with
   distance from active.
4. Numeric markers bubble up on activation and shrink/fade on deactivation,
   landing **~80ms after** the card settles.
5. The active card's text and the right-side detail panel slide in from the
   left with a faded 3D feel.
6. Container plays a brief `rotateX 0 → 4° → 0` revolver tilt on each step
   change. Continuous, weighted, never abrupt.
7. **Existing step-change sound still fires** at the same moment as before
   (no extra cues, no retiming).
8. `prefers-reduced-motion` users get a calm opacity crossfade fallback —
   no 3D, no bounce, no rotateX.
9. Only `transform`, `opacity`, and `filter` are animated. No layout
   properties.
10. Step data, ordering, copy, and sound trigger are **unchanged** vs
    `StepTimelineSlide`.
11. No auto-step timer exists for `StepsChain3DSlide`. Waiting on slide 4 must
    leave the active step unchanged.
12. Controller Next/Prev clicks and deck keyboard actions move one 3D step at a
    time through `tryAdvance(dir)` before navigating away from slide 4.
13. All step card buttons remain fully visible and pointer-clickable in the
    first viewport at presenter preview height; no step may be clipped under
    the controller, dot pagination, or viewport bottom.

---

## 9. Transition flow diagram

```
[Step N active]
    │  user advances
    ▼
[Trigger ActiveStepIndex = N+1]
    │
    ├── Sound: existing step-change SFX (unchanged)
    ├── Step N: spring zoom-out (scale 1→0.85, z 0→-60, opacity 1→0.55)
    ├── Step N+1: spring zoom-in with overshoot (scale 0.85→1.04→1.0)
    ├── Marker N: bubble-down (scale 1.25→0.85, glow off)
    ├── Marker N+1: bubble-up (scale 0.85→1.25→1.0, glow on)  +80ms
    ├── Right panel: slide-in-left + fade (label, title, subtitle staggered)
    └── Chain container: brief rotateX 0→4°→0 (revolver feel)
    ▼
[Step N+1 settled, others recede by depth distance]
```

---

## 10. Out of scope (do NOT do)

- Do not change the existing `StepTimelineSlide` component or its data.
- Do not reintroduce a solid background on the active card here.
- Do not add new sound cues. Reuse the existing trigger.
- Do not animate `width`, `height`, `top`, `left`, `margin`, or `padding`.
- Do not use `framer-motion` or any CSS `transition` for the depth/zoom
  changes — spring + WAAPI only. (CSS `transition` is allowed for the
  marker glow `box-shadow` fade, since `box-shadow` is cheap and the
  motion is purely visual decay.)
- Do not exceed 6° on the revolver tilt.

---

## 11. References

- Spec 17 — StepTimelineSlide v2 (data shape, sound trigger).
- Spec 23 / 27 / 32 — StepTimelineSlide v3 evolutions (composition, alignment).
- Spec 42 — Steps motion baseline (timing presets).
- Spec 43 — Steps sound (the SFX trigger we must preserve).
- Memory: [animations](mem://features/animations), [slide-types](mem://features/slide-types).
