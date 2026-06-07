# 03 — Focus Animation (how "first one, then the next" works)

This is the heart of **Type B** (interactive focus). It explains the active-step
state machine and the exact motion numbers. Source of truth: tokens in
`src/index.css` (lines 208–210), constants in
`src/slides/types/StepTimelineSlide.tsx`, motion table in
`spec/21-slides-system/42-steps-motion.md`.

---

## 1. The state machine ("first one, second one")

- On **mount**, steps reveal sequentially (stagger) and the focus lands on
  **step 0** — "the first one."
- The presenter presses **Next** → `tryAdvance('forward')` moves `active` to
  step 1 — "the second one." Step 0 dims to its neighbor treatment; step 1 grows
  to active; the right detail panel swaps with a directional snap.
- **Prev** → `tryAdvance('backward')`. At the chain edges `tryAdvance` returns
  `false`, so the **deck** advances to a sibling slide instead.
- There is exactly **one** owner of `active` / `hoveredIndex` / `pauseUntilRef`:
  the `useFocusTimeline` hook. Never add a second state machine
  (see `09-enums-and-state.md`).

```
mount ──► active = 0 ──Next──► active = 1 ──Next──► active = 2 ──Next──► (edge) deck advances
            ▲                                            │
            └──────────────── Prev ─────────────────────┘
```

`hoveredIndex` overrides `active` for the **right panel only** — hovering a row
previews its description without moving the connector/chip glow.

---

## 2. Depth without scale — exact per-state numbers

Each step row is classified relative to `active`: **Active**, **Adjacent (±1)**,
or **Far (≥2 away)**. Depth reads through **font-size jump + opacity ramp +
pure-white active color** — never `transform: scale()` (it blurs glyphs).

| Property | Active | Adjacent (±1) | Far | Source |
|---|---|---|---|---|
| `font-size` token | `--step-title-active` `clamp(2.93rem,5.46vw,4.88rem)` | `--step-title-adjacent` `clamp(1.95rem,2.86vw,2.6rem)` | `--step-title-far` `clamp(1.46rem,2.08vw,1.95rem)` | `src/index.css:208-210` |
| `opacity` | `1.0` | `0.55` | `0.30` | linear ramp, no easing |
| `color` | `hsl(0 0% 100%)` | `hsl(0 0% 100% / 0.75)` | `hsl(0 0% 100% / 0.55)` | pure white on active |
| `translateX` (slide-in) | `-24px → 0` | unchanged | unchanged | active text only |
| `transform: scale()` | **forbidden** | **forbidden** | **forbidden** | blurs glyphs |
| 3D (`perspective`/`rotateY`/`translateZ`) | none | none | none | no 3D on rows |

Active connector fill: `bg-gold` + `shadow-[0_0_8px_hsl(var(--gold)/0.6)]`; the
fill height animates from the previous chip to the current chip center, 320ms ease.

---

## 3. Detail-panel snap (right side, on focused-step change)

The right panel cinematically swaps left→right with a soft blur ramp on every
`active`/hover change (`StepTimelineSlide` §13.4).

| Phase | Property | Value |
|---|---|---|
| Enter | `opacity` | `0 → 1`, 280ms `cubic-bezier(0.16,1,0.3,1)` |
| Enter | `y` | `+12 → 0` (forward) / `-12 → 0` (backward) |
| Enter | `scale` | `0.985 → 1`, spring `{ stiffness: 380, damping: 28, mass: 0.7 }` |
| Exit | `opacity` | `1 → 0`, 220ms `ease-out` |
| Inner stagger | eyebrow → rule → desc → capsule | 0.05s / 0.12s / 0.18s / 0.26s |

The `y` direction is derived from `StepMotionDirection` (`FromLeft` / `ToLeft`),
so forward and backward feel physically distinct.

---

## 4. Reveal cadence (mount)

Steps reveal in order on mount. Default cadence (legacy) is base delay `300ms`
+ per-row stagger `180ms`; both are now author-overridable per slide via
`content.stepTiming.baseDelayMs` / `staggerMs` (resolved by
`resolveStepRevealOrder()` in `StepTimelineSlide.tsx`, v0.145). When the slide
doesn't override, the legacy values apply, so default behavior is unchanged.

See `08-motion-constants.md` for the autoplay/pause constants
(`STEP_INTERVAL_MS=2200`, `PAUSE_MS=6000`) and `11-reduced-motion.md` for the
opacity-only fallback path.
