# Audit 16 — Blind-LLM Gap Audit (Phase 16)

## 1. TL;DR scorecard

| Subsystem | Score (x/10) | Verdict |
| :--- | :--- | :--- |
| Steps timeline | 10/10 | Masterclass in constraint definition via File 02. |
| Sound | 9/10 | AudioContext singleton and fallback behavior perfectly scoped. |
| Ambient background | 6/10 | Stage vs inline mounting responsibilities conflict across files. |
| Title slide | 9/10 | Stagger delays and layout math are un-ambiguous. |
| Theme tokens | 7/10 | Good rules, but the TS payload to swap a theme is incomplete. |
| JSON shape (deck + slide) | 10/10 | The schema arrays and cheat sheets leave zero guesswork. |
| Folder/file ownership | 9/10 | `01-architecture-and-files.md` provides an exact mental map. |
| Motion timing | 9/10 | Defined spring/tween variables and strict reduced-motion rules. |
| Acceptance gating | 10/10 | The 40-check grid is ruthless and actionable. |
| Voice/text intake | 10/10 | 60-second recipe with strict default fallbacks prevents LLM hallucination. |
| Webcam overlay | 8/10 | Solid proposed JSON contract, though UI z-index handling is absent. |
| Accessibility | 4/10 | Mentions focus rings, but lacks ARIA state and tab-order orchestration. |
| Click-reveal/hotspots | 2/10 | Valid JSON is shown, but rendering logic is a total black box. |
| **Aggregate** | **7.8/10** | Core systems are airtight; edge slide-types and interactive overlays are left to the imagination. |

## 2. Top missing behaviors (ranked, max 10)

### 1. Click-Reveal & Hotspot Implementation — severity: high
- **Where the gap lives:** File 06 (§12, §13).
- **Symptom:** A blind implementer will render random unstyled absolute `div`s because percentage math, `"ghost"` styling, and the return-to-parent navigation logic completely lack visual specifications.
- **Suggested spec fix:** Add `21-click-reveal-and-hotspots.md` specifying coordinate mapping, styling for ghost/outline, and `ClickRevealBadge` z-index behavior.
- **Suggested implementation fix:** `src/slides/components/HotspotLayer.tsx` and `src/slides/components/ClickRevealBadge.tsx`.

### 2. Ambient Chrome Ownership (SlideStage vs. SlideType) — severity: high
- **Where the gap lives:** File 08 (§2) vs. File 04 (§A.2).
- **Symptom:** Implementers will double-render the background because File 08 says `SlideStage` maps the ambient layer at z=1, but File 04 explicitly instructs mounting `<AmbientBackground />` inside `<TitleSlide>`.
- **Suggested spec fix:** File 08 §2 (1 line clarifying whether `SlideStage` mounts ambient via JSON read or defers to the slide component).
- **Suggested implementation fix:** `src/slides/SlideStage.tsx` vs individual slide types.

### 3. FocusTimelineSlide UI & Layout Layout — severity: high
- **Where the gap lives:** File 06 (§8).
- **Symptom:** An implementer has the JSON template but mathematically zero idea how to render a `"windowSize": 3` horizontal carousel, so they will invent an unbranded flex-row.
- **Suggested spec fix:** Append `FocusTimelineSlide` anatomy and grid rules to `02-step-system-complete.md` (or write a new spec).
- **Suggested implementation fix:** `src/slides/types/FocusTimelineSlide.tsx`.

### 4. Capsule Expansion UI — severity: medium
- **Where the gap lives:** File 05 (§4).
- **Symptom:** The spec expects a capsule to "expand into a card on the same slide", but provides zero dimensions, transition profiles, or z-index rules for the expanded state.
- **Suggested spec fix:** File 05 §4 (Add two lines referencing an expanded card geometry and Framer `layoutId` behavior).
- **Suggested implementation fix:** `src/slides/components/Capsule.tsx`.

### 5. Brand Header & Controller Chrome Orchestration — severity: medium
- **Where the gap lives:** File 06 (JSON props) vs File 08 (Layer math).
- **Symptom:** Implementers will guess whether `SlideStage` parses `showBrandHeader: true` to mount global UI blocks over `children`, or if each slide must map them manually.
- **Suggested spec fix:** File 01 §2 (Add a line to `SlideStage.tsx` confirming it parses slide JSON to conditionally mount Brand Header and Brand Strip).
- **Suggested implementation fix:** `src/slides/SlideStage.tsx`.

### 6. ImageSlide & Missing Constraints — severity: medium
- **Where the gap lives:** File 06 (§10) vs File 07 (§3).
- **Symptom:** A blind implementer will render images full-bleed across 1920x1080 instead of containing them within the 1440px text safe-zones.
- **Suggested spec fix:** File 07 §3 (Note whether image attachments break the 1440 wrapper or live fully inside it).
- **Suggested implementation fix:** `src/slides/types/ImageSlide.tsx`.

### 7. Dynamic Theme Swap Payload — severity: medium
- **Where the gap lives:** File 05 (§8).
- **Symptom:** Implementers adding new themes via `themes.ts` will fail to provide required tokens (like `--ink`, `--background`) because the template only shows `gold`, `goldGlow`, and `cream`.
- **Suggested spec fix:** File 05 §8 (Write out the COMPLETE required payload type for a new theme block).
- **Suggested implementation fix:** `src/slides/themes.ts`.

### 8. Deck Routing ID Resolution — severity: low
- **Where the gap lives:** File 01 vs File 06 (§14).
- **Symptom:** Implementers won't know how URL `/3` accesses `04-divider.json` if array positioning vs regex matching isn't strictly defined.
- **Suggested spec fix:** File 01 §2 (Detail exact `loader.ts` 0-indexing math: Route `/N` maps to `deck.slides[N-1]`).
- **Suggested implementation fix:** `src/slides/loader.ts`.

### 9. Controller Hover Mechanics — severity: low
- **Where the gap lives:** File 00 (§10, rule 7).
- **Symptom:** Implementers will build a naive CSS `:hover` that locks up on mobile/touch, or intercepts clicks inside the main slide footer area unnecessarily.
- **Suggested spec fix:** File 13 §8 (Specify the hit-box padding and `focus-within` keyboard overrides for the ControllerBar).
- **Suggested implementation fix:** `src/slides/controls/ControllerBar.tsx`.

### 10. Accessibility / Panel Tab Order — severity: low
- **Where the gap lives:** File 18 (§A.1).
- **Symptom:** Users navigating step or capsule slides via `Tab` will experience erratic jumping between hidden/decor elements because DOM order doesn't match visual flow.
- **Suggested spec fix:** File 18 §A.1 (Mandate `tabIndex` sequencing rules for detail panels vs horizontal lists).
- **Suggested implementation fix:** `src/slides/types/StepTimelineSlide.tsx`.

## 3. Already-strong areas (no action needed)

*   **StepTimelineSlide Math:** Math validation (`560 + 80 + 800 = 1440`) and exact position limits are bulletproof (File 02).
*   **Motion Constants:** Frame-specific transition lists and strict reduced-motion rules guarantee UI consistency (File 13).
*   **Sound AudioContext Lifecycle:** Pre-fetching, debouncing, and ducking implementation steps are spelled out flawlessly (File 03).
*   **LLM Authoring & JSON Schemas:** Templates and variety validation logic leave zero room for LLM hallucinations (Files 06, 16, 19).
*   **Design Typography and Tokens:** Fixed pair scaling clamps (Ubuntu/Inter) and strict "no raw hex" directives are perfect (Files 05, 10).

## 4. Recommended next phase

The highest-leverage spec change is writing `21-click-reveal-and-hotspots.md` alongside an update to `08-background-system.md` to resolve `SlideStage` layer ownership ambiguity. Without this, developers will construct wildly diverging UI trees for floating elements that will fundamentally break z-index stacking and deck routing.
