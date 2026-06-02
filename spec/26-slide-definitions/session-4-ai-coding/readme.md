# Session 4 — AI Coding for Non-Coders

Per `mem://core` spec-first rule, this folder is the design contract for the
deck. Runtime JSON lives at `front-end/project/session-4-ai-coding/data/`.

## Narrow-idea per slide

| # | Slide | Narrow idea | Type |
|---|---|---|---|
| 1 | Title | "Session 4 exists, here's the topic" | TitleSlide |
| 2 | Outline | "Today is a 5-step chain" | StepsChain3DSlide ← per request |
| 3 | Recap | "Here's what you should already know" | CapsuleListSlide |
| 4 | Mindset | "Two blockers stop mastery" | KeywordSlide |
| 5 | Ship today | "Three concrete things we'll touch" | CapsuleListSlide |
| 6 | References | "Read along — here are the URLs" | CapsuleListSlide |
| 7 | Riseup Asia | "What we offer beyond the session" | CapsuleListSlide |
| 8 | Guidelines | "Strict rules tame the model" | KeywordSlide |
| 9 | Your call | "Audience picks the live build" | CapsuleListSlide |
| 10 | Meeting | "Book a 1:1" | QrMeetingSlide |

## Animation rules followed

- StepsChain3D used exactly once (slide 2). Spring-zoom + revolver rotate.
  No hover effects on the cards (`mem://constraints/no-hover-on-steps-chain-3d`).
- Cinematic capsule preset on every CapsuleListSlide.
- Transitions vary slide-to-slide: FadeIn → FadeIn → PushLeft → PushIn →
  SlideIn → PushRight → PushIn → PushLeft → SlideIn → FadeIn.
- Text animations vary: Bounce → SlideUp → Stagger → Bounce → Stagger →
  Stagger → Stagger → Stagger → Stagger → Stagger.
- All `prefers-reduced-motion` handling inherited from the slide engine.

## Theme

`noir-gold` (default). Black + gold. No raw hex in any slide JSON — colors
come from capsule color tokens (`gold`, `ember`, `cream`, `outline`, `ink`,
`teal`, `violet`, `rose`, `sky`).

## Open URL

`http://localhost:8080/?deck=session-4-ai-coding` then `/1` … `/10`.
