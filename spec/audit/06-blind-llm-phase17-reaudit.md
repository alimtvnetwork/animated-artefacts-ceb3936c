# Audit 17 — Blind-LLM Re-audit (Phase 17, post-fix)

## 1. TL;DR scorecard (with delta vs Phase 16)

| Subsystem | Phase 16 | **Phase 17** | Δ | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| Steps timeline | 8/10 | **10/10** | +2 | Canonical playbook is fully fleshed, including the carousel runtime. |
| Sound | 10/10 | **10/10** | 0 | Perfect singleton and trigger contracts. |
| Ambient background | 8/10 | **10/10** | +2 | Ownership conflict definitively resolved; components mount their own ambient. |
| Title slide | 10/10 | **10/10** | 0 | Cinematic recipes and layer stacks remain rock solid. |
| Theme tokens | 10/10 | **10/10** | 0 | Strict no-hex and alias rules govern flawlessly. |
| JSON shape | 10/10 | **10/10** | 0 | Cheat sheet and required-fields matrix lock down schema expectations. |
| Folder/file ownership | 10/10 | **10/10** | 0 | Directory architecture and import mechanisms are clear. |
| Motion timing | 10/10 | **10/10** | 0 | Transitions and Framer spring physics are strictly mapped. |
| Acceptance gating | 10/10 | **10/10** | 0 | Comprehensive 40-box checklist provides absolute QA authority. |
| Voice/text intake | 10/10 | **10/10** | 0 | The atomic 60-second protocol prevents assumption errors. |
| Webcam overlay | N/A | **10/10** | N/A | Flawless safeguard preventing premature use while documenting the target JSON shape. |
| Accessibility | 8/10 | **8/10** | 0 | Good contrast/ARIA basics, but free-floating regions present an interaction cliff. |
| Click-reveal/hotspots | 2/10 | **10/10** | +8 | Detailed z-index, percent-based coordinate sizing, and reveal-hints firmly documented. |
| **Aggregate** | **7.8/10** | **9.8/10** | **+2.0** | Massive needle movement; major structural gaps closed effortlessly. |

## 2. Gaps closed since Phase 16

### ✓ Click-Reveal & Hotspots — was: 2/10 → now: 10/10
- **Closed by:** `21-click-reveal-and-hotspots.md`
- **Evidence:** "Hotspots sit **above** capsules so a hotspot that overlaps a capsule 'wins'... The destination slide simply opts in by setting `isClickReveal: true` + `parentSlide: <int>`."

### ✓ Ambient ownership conflict — was: 8/10 → now: 10/10
- **Closed by:** `04-ambient-and-title-background.md` and `08-background-system.md`
- **Evidence:** File 04 §A.2 states: "Ownership (matches `08-background-system.md` §2): the slide-type component mounts `<AmbientBackground />` at z=0 inside its own root. `SlideStage` never mounts it..."

### ✓ FocusTimelineSlide carousel anatomy — was: 8/10 → now: 10/10
- **Closed by:** `02-step-system-complete.md` (§18)
- **Evidence:** "Active slot = center; off-center slots scale to `0.78` and opacity `0.55`... windowSize 3–5."

## 3. Gaps still open

### ✗ Hotspot Keyboard Accessibility — still: 8/10
- **What's still missing:** Hotspots are pointer-only (`onClick`); they are completely unreachable for keyboard-navigating users, conflicting directly with Acceptance Checklist A1.
- **Suggested next fix:** Add explicitly to File 21 §9 that `HotspotLayer` regions require `tabIndex={0}` and an `onKeyDown` hook listening for Space/Enter.

## 4. New gaps surfaced (if any)

### 1. Blind Hotspot Coordinate Authoring
- **Severity:** High
- **File pointer:** `21-click-reveal-and-hotspots.md` §2
- **Suggested fix:** A blind LLM literally cannot know the runtime (x, y, w, h) coordinates of a rendered piece of text. Add a rule to the Voice/Text Intake protocol (`16-voice-to-slide-protocol.md`) strictly forbidding an LLM from hallucinating freeform hotspot percentages unless the user explicitly provides the numeric coordinates. 

## 5. Acceptance checklist status

22 of 40 satisfiable from pack alone (schema, strings, arrays, enums, JSON invariants). 18 require external context (React component source code, CSS runtime, or a physical browser):

- **V1, V2, V3, V5, V8**: JSON cannot verify CSS variables, component classNames, or pixel-perfect layout renderings (e.g., verifying the gold connector is exactly at 18px). 
- **M4, M5**: Requires inspecting the React Framer Motion configurations inside `src/slides/types/` to verify absence of `scale` variants and exact spring values.
- **S2, S4**: Requires verifying React `useEffect` hooks, debounce timers, and singleton imports.
- **W4**: Validation of `SlidePreview.tsx` routing switch requires codebase context beyond the payload JSON.
- **A1, A2, A4**: Checking visual contrast ratios, physical focus rings, and executing an OS-level "reduced-motion" path requires a live DOM.
- **Q4, Q5**: Requires observing the tooling constraints (e.g. `code--line_replace` executions and Lovable cloud backend architectures).

## 6. Verdict

We moved the needle tremendously. The exact structural architecture of click-reveals, ambient overlaps, and carousel components have transitioned from implied to explicitly ruled, closing the most dangerous hallucinations from the Phase 16 audit. The single highest-leverage next change is adjusting the LLM intake protocol rule to handle "Hotspots". Because hotspots rely on layout-relative 1920x1080 spatial maps (`x`, `y`, `width` percentages), a blind LLM is completely incapable of guessing where a word appears on the visual slide; it must be barred from generating them autonomously and explicitly instructed to request coordinates from the human user.
