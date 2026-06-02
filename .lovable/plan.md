## Next 10 — prioritized, with reasoning + time

These are grounded in the current active surfaces (presenter webcam, StepsChain3D, motion-showcase boot, audio cues) and the open items in `spec/22-slides-issues/` and the leftover notes from the camera work.

### Tier 1 — finish what's in flight (camera + boot)

1. **Register `zoom` / `whoosh` / `click` audio slugs (motion-showcase boot)** — ~20 min
   Reasoning: the deck currently boots referencing unregistered slugs, which throws warnings and risks a silent boot failure. Either register the three slugs in the audio registry or drop the references. Highest priority because it's an active boot error.

2. **Distinct audio cue MP3s** — ~30 min
   Reasoning: every cue currently maps to `pop`. The cinematic `]` cycle and `O` shaping read as polished only with distinct whoosh/zoom/click sounds. Cheap, high perceived-quality payoff once slugs (item 1) exist.

3. **Camera `]` cinematic-cycle regression test** — ~25 min
   Reasoning: the 3-state phase machine (fullscreen→off squish, off→on bounce, on→fullscreen zoom) self-heals on phase, not a counter. Lock that contract with a test so future edits can't silently break it or reintroduce counter drift.

### Tier 2 — StepsChain3D correctness

4. **Step 23: cross-check StepsChain3D 3D-depth vs shared data model (spec #61)** — ~40 min
   Reasoning: flagged leftover. The 3D-depth layering may diverge from the shared step model; reconcile so slide 3 ↔ slide 4 stay in parity.

5. **Resolve issue 24 — steps-3d-refinements** — ~45 min
   Reasoning: open refinement backlog for the 3D chain (marker/rail polish). Bundle the small visual fixes into one pass.

6. **Resolve issue 25 — steps-3d-layout-knobs** — ~40 min
   Reasoning: exposes layout knobs so the 3D slide is tunable without code edits; reduces future one-off requests.

### Tier 3 — motion + a11y

7. **Issue 23 — motion feels robotic under reduced-motion** — ~40 min
   Reasoning: reduced-motion currently collapses to instant/flat. Add tasteful opacity-only fades so the muted path still feels intentional, not broken.

8. **Issue 26 — slide3 step-motion + slide4 step-typography follow-ups** — ~35 min
   Reasoning: remaining deltas from the typography/motion parity work; close them out.

### Tier 4 — resilience

9. **Issue 01 — root boot watchdog RCA hardening** — ~50 min
   Reasoning: convert the RCA into a guard so a single bad deck/slug can't blank the whole app at boot.

10. **Issue 27 — presenter-webcam-overlay loose ends** — ~40 min
    Reasoning: sweep remaining overlay edge cases (denied/tray/stage transitions) now that the shaping cycle is in place.

**Estimated total: ~6 hours.**

## Remaining items (beyond the next 10)

- `22-app-issues.md` — long-lived multi-issue RCA log; review for any still-open sub-issues (brand strip export, presenter nav).
- Optional: literal single-`<video>`-via-portal refactor (broad reading of #63) — large refactor, deferred.
- Spec/doc upkeep: ensure each closed issue gets its `## Resolution` section and the memory index stays in sync.
- No-questions window 2 is closed (40/40) — confirm whether to reopen window 3 or resume normal questions.

Tell me which tier (or specific numbers) to start on and I'll implement.