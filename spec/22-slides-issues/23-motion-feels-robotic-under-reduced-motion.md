# 23 — Motion feels robotic / page transitions don't animate

> **Filed:** 2026-04-27 · **Severity:** High (UX regression) ·
> **Reporter:** MD ALIM UL KARIM · **Affects:** every slide transition
> and every in-slide text animation, but **only** for users who have
> their OS set to `prefers-reduced-motion: reduce`.
>
> **Status:** Root-caused. Fix specified below in §3.

## 1. Symptoms

- Slide → slide transitions (`FadeIn`, `SlideIn`, `PushIn`, `PushLeft`,
  `PushRight`) appear to **snap** with no visible motion. The new
  slide just "pops" onto the screen.
- In-slide text animations (`Bounce`, `SlideUp`, `Stagger`,
  `cinematicCapsules`, `titleSlide`) all collapse to instant.
- Step timeline rows snap between active states with no opacity ramp.
- The deck feels **robotic** — no sense of forward momentum, no
  visible cue that the slide changed.
- The user reports it "used to still animate before."

## 2. Root cause

The reporter has the OS setting **Reduce Motion** enabled. That is
the trigger.

Three things combined to produce the regression:

### 2.1 Spec 27 added a JS-layer flattener (intentional)

Before spec 27, only **CSS-driven** motion respected reduced-motion
(via the `@media (prefers-reduced-motion: reduce)` rule in
`src/index.css`). Framer Motion variants written inline in JS — the
ones that drive every `<AnimatePresence>` slide transition and every
text animation — were **not** flattened. Authors who set
`transitionTiming.durationMs: 1200` still saw the full 1.2s
back-overshoot under reduce-motion, while the rest of the page
collapsed to ~0ms. That mismatch was the bug spec 27 fixed.

The fix added `src/slides/motionPreferences.ts` with two helpers:

- `flattenVariants(v)` — strips `x / y / z / rotate / scale / skew /
  filter` from every named state and replaces the `transition` block
  with a "safe" tween.
- `flattenTransition(t)` — clamps any inline transition to that same
  safe tween (preserving `delay` and `staggerChildren` for ordering).

These are wired into `transitions.ts` (`getSlideVariants`,
`resolveSlideTransitionConfig`) and `textAnimations.ts`
(`resolvePreset`, `getContainerVariants`). Correct so far.

### 2.2 The "safe tween" was set to 10 ms (the actual bug)

In `src/slides/motionPreferences.ts` line 88:

```ts
const SAFE_TRANSITION: Transition = { duration: 0.01, ease: 'linear' };
```

`resolveSlideTransitionConfig` independently returns the same shape
under reduced motion (lines 132–143), and `getContainerVariants` clamps
`staggerChildren` to `0.01s` (line 257).

`0.01s` = 10 ms. At 60 fps that is **0.6 frames** — the human eye
cannot perceive an opacity fade that fast. The slide reads as an
instantaneous swap, which is exactly what the user is calling
"robotic".

### 2.3 The motion contract says 150 ms, not 10 ms

`spec/slides/llm/13-motion-system.md` §5 — the master rule for
reduced motion across the deck — is unambiguous:

> `prefers-reduced-motion: reduce` collapses every transition to a
> **single 150ms opacity cross-fade**.

`spec/slides/42-steps-motion.md` §5 agrees:

> Keep: `opacity` cross-fades capped at **150 ms**.

And `textAnimations.ts` even ships a preset built for this exact
purpose:

```ts
reducedFade: {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: 'linear' } },
},
```

…180 ms (close enough to the 150 ms target). But the slide-transition
and variant flatteners never use it — they use the 10 ms `SAFE_TRANSITION`
constant instead. So the **slide → slide** path and the **inline
variant** path collapse to 10 ms while the only "good" preset sits
unused except as a fallback for `resolvePreset(undefined)`.

### 2.4 Why this didn't show up in tests

`src/test/motionPreferences.test.ts` asserts that the flattened
transition has `duration: 0.01` — so the test passes precisely
because the implementation matches the (wrong) constant. The test
encodes the bug. There is no test that asserts the flattened duration
matches the 150 ms motion-system contract.

### 2.5 Why the user says it "used to still animate"

Before spec 27, JS-layer Framer transitions ignored reduced-motion
entirely. So under "Reduce Motion" the user still saw the full
550 ms slide transitions and the full text animations — bug-by-luck,
but it looked right. Spec 27 plugged the leak and, in the same patch,
over-clamped the safe value, flipping the experience from
"animations leak through" to "animations are dead".

## 3. Solution

### 3.1 Code fix (small, surgical)

In `src/slides/motionPreferences.ts`:

```ts
// 150 ms matches spec/slides/llm/13-motion-system.md §5 and
// spec/slides/42-steps-motion.md §5 — long enough to read as a
// transition, short enough to honor the OS preference.
const SAFE_TRANSITION: Transition = { duration: 0.15, ease: 'linear' };
```

Apply the same `0.15s` to the inline branches in
`flattenTransition()` (line 142) and the reduced-motion short-circuit
in `resolveSlideTransitionConfig()` (lines 141–142).

In `textAnimations.ts` `getContainerVariants()` (line 257), bump the
reduced-motion stagger so children have visible breathing room within
the 150 ms window:

```ts
return { animate: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } } };
```

(Children's individual transitions are still 150 ms; a 30 ms stagger
cascades 5 children across ~150 ms total — perceptible cascade,
still well under any vestibular threshold.)

### 3.2 Test fix

Update `src/test/motionPreferences.test.ts` to assert the new contract:
flattened transitions report `duration === 0.15` (not `0.01`). Add a
new test that cross-references the constant against the spec-quoted
150 ms ceiling so future drift gets caught.

### 3.3 Memory + spec sync

- Update `.lovable/memory/features/motion-preferences.md` to replace
  the `{ duration: 0.01, ease: 'linear' }` snippet with the 150 ms
  value and cite spec 13 §5 as the source of truth.
- Add a one-line note to `spec/slides/03-animation-rules.md` §5
  pointing readers at spec 13 §5 for the exact ceiling, so the
  authoring rules and the runtime rules cannot drift again.

### 3.4 Acceptance

- With OS `Reduce Motion` ON, slide → slide transitions show a
  visible ~150 ms opacity cross-fade (no transform, no scale, no
  bounce).
- With OS `Reduce Motion` OFF, full authored transitions
  (`SlideIn`, `PushIn`, etc.) play unchanged at their 550 ms / spring
  defaults.
- `bun run test` passes; `motionPreferences.test.ts` asserts 150 ms.
- The user re-tests on their machine and confirms the deck no longer
  feels robotic.

## 4. Lessons / preventive

- **Specs disagreed silently.** `13-motion-system.md` said 150 ms,
  `motion-preferences.md` (memory) said `0.01s`. Both are "the
  contract" depending on which one you read. Going forward, the
  motion-system spec wins; the memory file is a pointer, not a
  source of truth, and should quote the spec verbatim.
- **Tests encoded the implementation, not the contract.** The test
  matched the constant in the same file — passing didn't prove
  correctness. New tests should reference the spec value as a named
  import / fixture so the spec remains the only place to change it.
