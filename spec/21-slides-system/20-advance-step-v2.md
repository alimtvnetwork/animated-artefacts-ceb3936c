# Spec 20 — AdvanceStepSlide v2 (Readable-Focus + Optional Brand Header + Sound)

> **Codename:** still "**advance step**" — this spec **supersedes**
> `18-advance-step-cinematic.md` for the type ramp, brand-header handling, and
> sound contract. Camera dolly + state mapping rules from spec 18 still
> apply unchanged.

---

## 1. Why v2

User feedback after shipping spec 18:

1. The active-frame text reads **too small at booth distance**. The whole
   point of the camera-dolly is "we focus in on this step" — the type ramp
   has to feel like a focus, not a peek.
2. The deck's top-left **brand header logo** competes with the eyebrow / deck
   title overlay that the slide already paints. On AdvanceStep specifically
   it must be hideable.
3. Presenters want a **whoosh** as the camera lands so the audience's ear
   confirms the visual cue. Sound must be **opt-in per slide** (see
   `spec/slides/21-sound-system.md`), not a global background change.

> Note on scaling: the user asked "make slides grow with the screen". The deck
> intentionally keeps a flow layout (not a fixed 1920×1080 canvas) — see the
> Q&A on 2026-04-26. The fix for "text too small at distance" is therefore a
> larger type ramp on this slide, **not** a global rescale.

---

## 2. Locked changes vs spec 18

### 2.1 Type ramp on the active frame

| Element              | Spec 18           | Spec 20 (v2)                                  | Why                              |
|----------------------|-------------------|-----------------------------------------------|----------------------------------|
| Step counter eyebrow | `text-[12px]`     | `text-[16px]` (`md:text-[18px]`)              | Reads at distance.               |
| Step title (`h3`)    | `text-7xl md:text-8xl` | `text-[7.5rem] md:text-[9rem] xl:text-[11rem]` | The title becomes the focus.     |
| Title leading        | `0.95`            | `0.92`                                        | Tighter so the bigger title doesn't blow vertical rhythm. |
| Subtitle             | `text-lg`         | `text-2xl md:text-3xl`                        | Pairs with the new title weight. |
| Description          | `text-base`       | `text-lg md:text-xl`                          | Still secondary, still legible.  |
| Gold rule            | `w-[60px] h-px`   | `w-[88px] h-[2px]`                            | Heavier divider survives the bigger type. |
| Vertical gap (rule)  | `my-8`            | `my-10`                                       | Match the new ramp.              |
| Frame padding        | `px-24`           | `px-16 md:px-24`                              | More usable width on smaller screens. |
| `max-w-3xl`          | `max-w-3xl`       | `max-w-5xl`                                   | Title needs the room.            |

Inactive (`prev` / `next`) frames still render the static text block. They
inherit the new ramp so the peek silhouette matches what's coming. The
`scale: 0.78` already shrinks them ~22%, which is exactly what we want.

### 2.2 Optional brand-header suppression

`AdvanceStepSlide` paints its own deck-level header overlay (eyebrow + deck
title, fixed top-left). When the deck-wide `showBrandHeader: true` ALSO
applies, two logos stack on top of each other.

Resolution: this slide should default to `showBrandHeader: false` in the
showcase deck. The renderer doesn't change — `SlideStage` already honors
`spec.showBrandHeader`. Author guidance:

```jsonc
{
  "slideType": "AdvanceStepSlide",
  "showBrandHeader": false,    // hide the deck-wide RiseupAsia header logo
  "showPresenterChip": true,   // KEEP the presenter chip — it's brand-strip, not header
  "brandStrip": true,          // KEEP the top-right "DECK" strip
  ...
}
```

> The user said "remove the top **logo** banner" — that's specifically the
> brand-header (top-left RiseupAsia wordmark). The right-side brand strip
> (`RISEUP ASIA LLC · 2026 DECK`) and the controller pill stay.

### 2.3 Sound on focus arrival

Each time a new frame becomes active (forward, backward, or a jump from the
right-edge dot column) the slide plays exactly one sound from the **sound
manager** (spec 21). Default kind: `whoosh`.

Behavior contract:

- The very first arrival when the slide mounts **does play** a whoosh — it
  marks the camera "landing" on step 1.
- Reduced motion users still hear the whoosh (it's a cue, not a motion).
  Authors can override per slide with `sound: { mute: true }` if they want
  silence to be the reduced-motion fallback.
- Sound only fires when the deck is the active document (`document.hidden`
  guard) so background tabs don't randomly whoosh.
- The first user gesture on the deck unlocks WebAudio. Before that gesture
  the manager queues nothing — sounds simply do not play. This is a browser
  policy, not a bug.

JSON (slide-level, optional):

```jsonc
{
  "sound": {
    "on": "focus",         // "focus" | "enter" | "click" — defaults to "focus" for AdvanceStep
    "kind": "whoosh",      // "whoosh" | "click" | "pop"
    "volume": 0.45,         // 0..1, default 0.45
    "mute": false            // explicit mute for this slide
  }
}
```

If `sound` is omitted on an AdvanceStepSlide, the renderer uses a sensible
default `{ on: "focus", kind: "whoosh", volume: 0.45 }` so authors get the
intended experience for free.

---

## 3. Render contract

```
┌────────────────────────────────────────────────────────────┐
│ HOW WE WORK                                          [strip]│  <- top-right brand strip (kept)
│ Engagement Process                                          │  <- deck title overlay (kept)
│                                                             │
│                                                             │
│                                                             │
│           STEP 03 / 04                                      │  <- 16-18px, gold, tracking 0.32em
│                                                             │
│           Build                                             │  <- 7.5–11rem, display, foreground
│           ━━━━━━━                                            │  <- 88×2 gold rule, fades+grows in
│           Ship in increments                                │  <- 24-30px, foreground/70
│           Two-week sprints, end with a demo and             │  <- 18-20px, foreground/55
│           a written changelog.                              │
│                                                             │
│                                                  [Week 4–8] │  <- capsule, top-right of frame
│                                                          ●  │  <- right-edge dot column
│                                                          ○  │
│                                                          ●←active
│                                                          ○  │
│                                                       03/04 │
└────────────────────────────────────────────────────────────┘
```

The brand-header logo (top-left RiseupAsia) is **absent** because
`showBrandHeader: false`. The controller pill still appears at the
bottom-center on hover (deck-level chrome).

---

## 4. JSON example (showcase 03-process)

```jsonc
{
  "slideNumber": 3,
  "slideType": "AdvanceStepSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "showBrandHeader": false,
  "showPresenterChip": true,
  "brandStrip": true,
  "sound": { "on": "focus", "kind": "whoosh", "volume": 0.45 },
  "content": {
    "eyebrow": "HOW WE WORK",
    "title": "Engagement Process",
    "steps": [
      {
        "label": "Step 1",
        "title": "Discovery",
        "subtitle": "Listen, audit, align",
        "description": "Two-week intake: stakeholder interviews and an audit of existing assets. Output: a one-page brief signed by everyone in the room.",
        "capsule": { "text": "Week 1", "color": "gold" }
      }
      // ...
    ]
  }
}
```

---

## 5. Files of record

- Renderer: `src/slides/types/AdvanceStepSlide.tsx`
- Sound manager: `src/slides/sound.ts` (see spec 21)
- Type defs: `src/slides/types.ts → SlideSpec.sound`
- JSON schema: `spec/slides/slide.schema.json`
- Showcase slide: `spec/slides/showcase/03-process.json`
- Memory mirror: `.lovable/memory/features/advance-step.md` (now points
  here for v2 rules) + `.lovable/memory/features/sound-system.md`
- Predecessor (kept for archive): `spec/slides/18-advance-step-cinematic.md`

---

## 6. Test checklist

1. The active step's title fills the eye — the word "Build" reads from
   across the room, not just the laptop.
2. The top-left RiseupAsia logo is **gone** on this slide; the right-side
   "RISEUP ASIA LLC · 2026 DECK" strip is **still there**; the controller
   pill is **still there**.
3. Pressing Next plays one short whoosh as the new frame snaps into focus.
   Pressing Prev plays exactly one whoosh too. Jumping via the right-edge
   dot also plays exactly one whoosh.
4. Setting `sound.mute: true` on the slide silences it; `sound.kind: "click"`
   swaps to the click synth; omitting `sound` entirely still plays a whoosh.
5. With the deck in a background tab no sound plays.
6. With `prefers-reduced-motion: reduce` the camera snaps but the whoosh
   still plays (unless the slide explicitly mutes).
7. The peeking prev/next frames inherit the bigger type ramp and still
   render at scale 0.78 / opacity 0.4 — no layout jump as you advance.
