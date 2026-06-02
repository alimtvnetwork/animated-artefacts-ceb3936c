# Controller Build — C03 Broken Into 10 Code-Ready Sub-Steps (C03.1–C03.10)

Expands **C03 — "Hover-reveal pill shell + chip layout"** into 10 concrete,
ordered sub-steps. Builds on C01 (nav + tokens) and C02 (portal + position).
File paths are suggestions — the live app's equivalent is
`src/slides/controls/ControllerBar.tsx`.

| # | Sub-step | File | Reasoning | Time |
|---|----------|------|-----------|------|
| C03.1 | Create `ControllerPill` shell (collapsed + expanded markup) | `src/slides/controls/ControllerPill.tsx` | The two-state container is the frame every chip lives in; building it first lets later chips just slot in. | 30 m |
| C03.2 | Add `isExpanded` state driven only by pill pointer-enter/leave | `ControllerPill.tsx` | Hover-only expansion (never stage activity) is the core rule; isolating the state keeps the trigger surface explicit. | 20 m |
| C03.3 | Add an oversized invisible hover hit-area around the collapsed chip | `ControllerPill.tsx` | A larger summon zone makes the pill easy to reveal without precise aiming, matching the design's "faint chip" affordance. | 15 m |
| C03.4 | Animate collapse↔expand (spring scale+width; instant if reduced-motion) | `ControllerPill.tsx` | Smooth reveal is the polish signal; gating on `prefers-reduced-motion` keeps it accessible. | 30 m |
| C03.5 | Style the pill surface with tokens (`--ctrl-bg/border`, blur, shadow) | `ControllerPill.tsx` + `index.css` | Token-only styling keeps it theme-safe across light/dark and the color-derived themes from C08. | 20 m |
| C03.6 | Define the chip order + render slots (prev·indicator·next·…·menu) | `ControllerPill.tsx` | A fixed, documented order makes the layout predictable and gives later steps named insertion points. | 25 m |
| C03.7 | Build a reusable `ControllerChip` (icon + aria-label + styled Tooltip) | `src/slides/controls/ControllerChip.tsx` | One chip primitive guarantees consistent sizing, focus ring, and tooltip side (from C02.5) across every button. | 30 m |
| C03.8 | Collapsed state shows one faint affordance (next arrow ~55% opacity) | `ControllerPill.tsx` | Hints interactivity without polluting the live stage, per the hidden-by-default rule. | 15 m |
| C03.9 | Grace-delay auto-collapse + stay-open while a child menu is open | `ControllerPill.tsx` | A ~400ms grace prevents flicker between chips; keeping it open during menus avoids the pill vanishing mid-action. | 25 m |
| C03.10 | Ensure collapsed pill doesn't steal pointer events; snapshot both states | `ControllerPill.tsx` + `src/test/controllerPill.test.tsx` | `pointer-events` only on the hit-area keeps slide clicks working; snapshots lock the look (CT04 preview). | 30 m |

**Subtotal (C03.1–C03.10): ~4 h** (within C03's ~2.5 h core + buffer for the chip primitive + tests).

## Remaining items
1. **Build order:** C01, C02 (spec'd) → **C03** via C03.1–C03.10 → C04–C10 (~11.5 h remaining of the ~19.5 h build).
2. **Execute CT01–CT20** — verification + hardening after the code lands. (~18 h)
3. **Acceptance walk-through** — end-to-end presenter story, fix defects, flip the controller track to done.

Per-step breakdowns continue C-by-C on request (C04 next); beyond them only
writing the actual controller code and running the CT suite remain.
