# Session 4 — AI Coding for Non-Coders

**Deck slug:** `session-4-ai-coding`
**Theme:** noir-gold (default — black + gold)
**Presenter:** MD ALIM UL KARIM
**Open URL:** `/?deck=session-4-ai-coding` then navigate to `/1`, `/2`, etc.

## Outline

| # | Slide | Type | Why it's narrow |
|---|---|---|---|
| 1 | Title | TitleSlide | One sentence: who & what |
| 2 | Session outline | **StepsChain3DSlide** | The 3D-steps animation as the TOC, per request |
| 3 | Build flow | StepTimelineSlide | The missing step-system slide inserted before the content run |
| 4 | Recap | CapsuleListSlide | Hover-expand for previous-session topics |
| 5 | Mindset | KeywordSlide | Three keywords + two blocker capsules |
| 6 | What we ship | CapsuleListSlide | Movie · Alarm · Gitmap |
| 7 | References | CapsuleListSlide | The 4 links you provided |
| 8 | Riseup Asia | CapsuleListSlide | Tech partner · Closer · NDA · Free help |
| 9 | Guidelines | KeywordSlide | Spec-first · Strict rules · Less hallucination |
| 10 | Your call | CapsuleListSlide | Two paths + vote |
| 11 | Meeting | QrMeetingSlide | QR closer |
| 12 | Session outline | SessionOutlineSlide | Calm vertical outline variant |
| 13 | Session outline — Build | SessionOutlineSlide | "We are here" active-step variant |
| 14 | Four sessions | SessionOutlineSlide | Multi-session arc summary |

## Animation variety

- Transitions used across the deck: `FadeIn`, `PushLeft`, `PushIn`, `SlideIn`, `PushRight`. No two adjacent slides share a transition.
- Text animations: `Bounce`, `Stagger`, `SlideUp`. Mix per slide.
- Slide 2 carries the cinematic `StepsChain3DSlide` motion (spring zoom + revolver rotation + marker bubble-up). Click-only — never hover.
- All capsule slides set `animations.capsules: "cinematicCapsules"` for the blur→focus + slide-up + spring-overshoot entrance.

## Source notes

Deck spec mirrors `spec/26-slide-definitions/session-4-ai-coding/` (per `mem://core` spec-first rule). JSON is the runtime source of truth.
