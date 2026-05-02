# Spec 18 — AdvanceStepSlide (Cinematic Camera-Zoom Step Chain)

> **Codename to refer to in chat:** "**advance step**" (or "advance steps",
> "cinematic step chain"). When the user says "use the advance step
> implementation here" any AI must rebuild this slide following this spec
> verbatim. The runtime source of truth is
> `src/slides/types/AdvanceStepSlide.tsx`. JSON is
> `slideType: "AdvanceStepSlide"`.

This is **NOT** an enhancement of `StepTimelineSlide`. It is a separate slide
type with completely different visual language: a single "in-focus" step
fills the stage at any moment, the previous step shrinks/recedes upward, the
next step is a small ghost below it, and Next/Prev triggers a **camera dolly**
between them.

---

## 1. Purpose

For decks where each step deserves a moment — a methodology walkthrough, a
product timeline, a 5-step framework. The user explicitly described it as:

> "It feels like the camera is zooming in to that location, and then the
> texts are fading in… when we move to the next one, it zooms out, moves to
> the next one, and then zooms in."

Use it for chains of 3–7 steps. More than 7 becomes exhausting; fewer than 3
defeats the cinematic payoff.

---

## 2. Mental model: a vertical reel

Picture a tall vertical strip of "frames" (one per step), each ≈ 1080px tall.
The viewport is a 1920×1080 window onto that strip. Navigation moves the
camera (translateY) by exactly **one frame** and dollies the zoom (`scale`)
in two beats:

```
Beat 1 (out):   active frame scales 1.0 → 0.78,    opacity 1 → 0.4
                next frame   scales 0.78 → 0.78,   stays in place
                camera Y     translates by -100% with spring
Beat 2 (in):    new active   scales 0.78 → 1.0,    opacity 0.4 → 1
                old active   already faded (Beat 1)
                text inside  fades in 120ms after Beat 2 starts
```

The two beats overlap: the camera glides while the outgoing zoom-out is
still finishing, so the eye never sees a static "in-between" state. Total
transition time ≈ **900 ms**.

---

## 3. Anatomy of one frame

```
┌──────────────────────────────────────────────────────┐ <-- viewport
│                                                      │
│            STEP 02 / 05                              │  small gold eyebrow
│                                                      │
│                                                      │
│            S T R A T E G Y                           │  display 8xl
│                                                      │
│            ─────────────                             │  60px gold rule
│                                                      │
│            Frame the bet, set the                    │  body text
│            measurable outcome, align                 │  (fades in last)
│            the team on a single bet.                 │
│                                                      │
│                                            [Week 2-3]│  capsule, top-right
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Eyebrow: `text-[12px] tracking-[0.32em] uppercase text-gold`.
- Title: `font-display text-8xl text-foreground` (clamps via global title
  rules — see `preset.ts`).
- Rule: `60px × 1px` `bg-gold/60`, `mt-6 mb-8`, animates from `width: 0` to
  `60px` after the title arrives.
- Body: `max-w-2xl`, `text-foreground/70`, `leading-relaxed`. Fades in last.
- Capsule: optional, top-right, anchored absolute.
- Background: `bg-background`, plus a soft radial glow centered on the
  active frame (`bg-[radial-gradient(circle_at_50%_50%,hsl(var(--gold)/0.08),transparent_60%)]`).

Adjacent (non-active) frames render the same content but at `scale-78` and
`opacity-40` so the audience sees a *peek* of what's next/before — this is
what sells the "camera dolly" feeling.

---

## 4. State machine

```
       [ idle, active=0 ]
            │
     Next   │
     ────── ▼ (tryAdvance returns TRUE while there's a next)
       [ animating-out (Beat 1) ]
            │ 0.45s
            ▼
       [ animating-in (Beat 2) ]
            │ 0.45s + 0.12s text-fade
            ▼
       [ idle, active=1 ]
            ⋮
            ▼ on the LAST step + Next: tryAdvance returns FALSE
       deck navigates to the next sibling slide.
```

Like `FocusTimelineSlide`, this slide consumes Next/Prev internally via the
existing `FocusTimelineHandle`-style imperative ref so the deck only
advances to a sibling when the chain is exhausted. **Implementation reuses
the same `useFocusTimeline` contract** — the handle exposes
`tryAdvance(direction): boolean`. See spec 11 for the contract.

---

## 5. Transition specifics

### 5.1 Camera (the strip itself)

```ts
const yPct = -active * 100; // strip translates by full viewport heights
<motion.div
  animate={{ y: `${yPct}%` }}
  transition={{ type: 'spring', stiffness: 90, damping: 20, mass: 1 }}
/>
```

Spring is intentional — slight overshoot (≈ 4 %) sells the "camera settles"
feel. Duration falls out at ≈ 700–800 ms.

### 5.2 Active scale + opacity (per frame)

Each frame consumes a derived `state` prop: `'far-prev' | 'prev' | 'active'
| 'next' | 'far-next'`.

| State       | scale | opacity | translateY (within strip cell) |
|-------------|-------|---------|--------------------------------|
| `far-prev`  | 0.65  | 0       | 0                              |
| `prev`      | 0.78  | 0.4     | 0                              |
| `active`    | 1.0   | 1.0     | 0                              |
| `next`      | 0.78  | 0.4     | 0                              |
| `far-next`  | 0.65  | 0       | 0                              |

Tween: `{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }`. The active frame's
spring scale slightly overshoots: replace its tween with
`{ type: 'spring', stiffness: 220, damping: 22 }`.

### 5.3 Text fade (active frame only)

Inside the active frame, eyebrow / title / rule / body / capsule animate in
**after** the camera and scale have finished, in a short stagger:

| Element  | delay | duration | effect                                     |
|----------|-------|----------|---------------------------------------------|
| eyebrow  | 0.55  | 0.30     | opacity + translateY(-6 → 0)                |
| title    | 0.62  | 0.40     | opacity + translateY(8 → 0) + blur(6→0)     |
| rule     | 0.78  | 0.35     | width 0 → 60px                              |
| body     | 0.88  | 0.45     | opacity + translateY(8 → 0)                 |
| capsule  | 0.92  | 0.30     | opacity + scale(0.92 → 1)                   |

These delays are measured from `active`-state-change. Use a `key={active}`
on the active frame's text-group so re-mounts re-fire the entrance whenever
we land on a new step (even when scrubbing back and forth).

### 5.4 Backward navigation

Mirror it. The strip animates `y` toward the new index. The outgoing
"active" rolls back to `prev` state; the new "active" was previously `prev`,
scales up, and re-fires its text entrance.

---

## 6. Layout & sizing

- Outer container: `relative overflow-hidden h-full w-full bg-background`.
- Strip: `absolute inset-0 will-change-transform` containing N frames each
  `h-full w-full` and stacked with `flex flex-col` (vertical reel).
- Each frame renders centered content via
  `flex h-full w-full items-center justify-center px-24`.
- The optional capsule lives in `absolute top-12 right-12` of the frame.
- The radial glow lives only on the active frame so the eye is drawn there.

---

## 7. Progress indicator

A vertical dot column on the right edge of the viewport (`absolute right-8
top-1/2 -translate-y-1/2`). N dots stacked with `gap-3`. Active dot is a
gold pill (`h-6 w-1.5 rounded-full bg-gold`); others are `h-1.5 w-1.5
rounded-full bg-foreground/25`. Clicking a dot jumps to that step (uses the
same `setActive` path that Next/Prev use, so the camera animates).

A `Step NN / NN` micro-label sits below the dot column in mono gold —
mirrors the badge in spec 17 so the system feels coherent.

---

## 8. Reduced motion

- Strip `y` tween → `{ duration: 0 }` (snap).
- Per-frame scale/opacity → snap.
- Text entrance → snap (no blur, no translate).
- Camera spring is replaced by a plain assignment.

The slide remains fully functional — it just stops being cinematic.

---

## 9. Accessibility

- The whole stage gets `role="region"` and `aria-roledescription="step
  carousel"`.
- The active frame's outer wrapper gets `aria-current="step"`.
- The dot column dots are real `<button>`s with
  `aria-label={`Go to step ${i+1}`}` and `aria-current="step"` for the
  active one.
- Status pill (`Step 3 / 5`) has `aria-live="polite"`.
- Inactive frames have `aria-hidden="true"` so screen-readers never read
  past the active step.

---

## 10. Keyboard

The slide uses the deck's existing Next/Prev (ArrowRight / ArrowLeft / Space
/ Enter / Backspace). It does NOT add its own bindings beyond what
`useFocusTimeline` already plumbs. This keeps the global keyboard contract
identical to every other slide.

`Home` / `End` jump to the first/last step **only when this slide owns the
keyboard** (i.e. the active document target isn't an input). They reuse the
same `setActive` path.

---

## 11. JSON shape

```json
{
  "slideNumber": 12,
  "slideName": "advance-process",
  "slideType": "AdvanceStepSlide",
  "transition": "FadeIn",
  "enabled": true,
  "isClickReveal": false,
  "showBrandHeader": true,
  "content": {
    "eyebrow": "How we work",
    "title": "Engagement, in motion",
    "steps": [
      {
        "label": "Step 1",
        "title": "Discovery",
        "subtitle": "Two weeks of listening — interviews, audits, alignment.",
        "capsule": { "text": "Week 1", "color": "gold" }
      },
      {
        "label": "Step 2",
        "title": "Strategy",
        "subtitle": "Frame the bet. One page, one team, one number.",
        "capsule": { "text": "Week 2-3", "color": "ember" }
      }
      // …
    ]
  }
}
```

`StepSpec` is reused unchanged. The slide does not require `description`;
when present it is shown under the subtitle (same fade-in beat).

The deck-level `eyebrow`/`title` (outside the steps) render once in a
**fixed header overlay** at the top-left of the viewport (so they don't
participate in the camera dolly). They fade in at slide entry and out at
slide exit.

---

## 12. Files of record

- Implementation: `src/slides/types/AdvanceStepSlide.tsx`
- Spec: this file (`spec/slides/18-advance-step-cinematic.md`)
- Memory: `.lovable/memory/features/advance-step.md`
- Enum entry: `SlideType.AdvanceStepSlide` in `src/slides/enums.ts`
- Stage wiring: `src/slides/SlideStage.tsx`
- Schema: `spec/slides/slide.schema.json`

---

## 13. Test checklist

1. Mounting the slide on step 1 shows the title text fading + sliding in
   ≈ 0.6 s after the slide enter transition.
2. Pressing `→` (Next) makes the strip dolly upward by one viewport height
   with a small overshoot, the previous step shrinks to 0.78 / 0.4 opacity,
   and the new active grows to 1.0 with text-stagger.
3. Pressing `←` reverses it cleanly.
4. On the last step, pressing `→` again navigates to the next deck slide
   (deck handles it via `tryAdvance() === false`).
5. Clicking a dot in the right-edge column jumps to that step with the same
   camera animation.
6. With `prefers-reduced-motion: reduce` the dolly + scale + blur are
   skipped; the slide still updates correctly.
7. Inactive frames are not announced by screen-readers; the active frame is
   announced as the current step.
