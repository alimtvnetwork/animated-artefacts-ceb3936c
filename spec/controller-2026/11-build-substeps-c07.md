# Controller Build — C07 Broken Into 10 Code-Ready Sub-Steps (C07.1–C07.10)

Expands **C07 — "First-run onboarding 'story' popup"** into 10 concrete, ordered
sub-steps. Builds on C01–C06 (reuses the `SHORTCUTS` core group + nav/fullscreen
actions). New component lives at `src/slides/controls/OnboardingCoachmark.tsx`.

| # | Sub-step | File | Reasoning | Time |
|---|----------|------|-----------|------|
| C07.1 | Add `useOnboardingFlag()` reading/writing `ctrl.onboarded.v1` | `src/slides/controls/useOnboardingFlag.ts` | A single gate decides whether the popup shows; centralizing read/write keeps every dismiss path consistent. | 20 m |
| C07.2 | Create `OnboardingCoachmark` centered card shell | `OnboardingCoachmark.tsx` | A non-blocking centered card (not a hard modal) teaches without trapping the presenter. | 25 m |
| C07.3 | Render the core key legend from `SHORTCUTS` core group | `OnboardingCoachmark.tsx` | Pulling keys (`←/→`, `Enter/Space`, `F`, `/`, `M`) from the single source means the legend can never go stale. | 20 m |
| C07.4 | Build a ≤3-step story (nav → fullscreen → shortcuts+music) | `OnboardingCoachmark.tsx` | Three short steps teach the essentials without annoyance; Next advances, Skip dismisses. | 30 m |
| C07.5 | Teach-by-doing: pressing `→` while open advances the story step | `OnboardingCoachmark.tsx` | Reacting to the real key turns the popup into active learning, reinforcing the muscle memory. | 25 m |
| C07.6 | Respect `prefers-reduced-motion` (fade/instant, no slide-in) | `OnboardingCoachmark.tsx` | Keeps the intro accessible and consistent with the deck's motion policy. | 10 m |
| C07.7 | Dismiss paths: "Got it" button, `Esc`, backdrop click → set flag | `OnboardingCoachmark.tsx` | Every exit must persist the onboarded flag so the popup never nags on later visits. | 20 m |
| C07.8 | Add "Show intro again" item to the overflow menu (clears flag) | `ControllerBar.tsx` | Lets presenters re-demo onboarding on demand without clearing storage manually. | 15 m |
| C07.9 | Focus-trap + initial focus + restore focus on close (a11y) | `OnboardingCoachmark.tsx` | Keyboard users must land in the card, tab within it, and return focus to the trigger on close. | 25 m |
| C07.10 | Tests: shows once, all dismiss paths set flag, re-trigger, auto-advance | `src/test/onboarding.test.tsx` | Locks gating + interactions (CT08 preview) so the popup never reappears unexpectedly or fails to show. | 30 m |

**Subtotal (C07.1–C07.10): ~3.3 h** (within C07's ~2 h core + buffer for a11y + tests).

## Remaining items
1. **Build order:** C01–C06 (spec'd) → **C07** via C07.1–C07.10 → C08–C10 (~2.5 h remaining of the ~19.5 h build).
2. **Execute CT01–CT20** — verification + hardening after the code lands. (~18 h)
3. **Acceptance walk-through** — end-to-end presenter story, fix defects, flip the controller track to done.

Per-step breakdowns continue C-by-C on request (C08 next); beyond them only
writing the actual controller code and running the CT suite remain.
