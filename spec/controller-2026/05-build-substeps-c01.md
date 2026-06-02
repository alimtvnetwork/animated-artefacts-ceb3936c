# Controller Build — C01 Broken Into 10 Code-Ready Sub-Steps (C01.1–C01.10)

The controller documentation track is complete (100-step design, C01–C10 build
plan, CT01–CT20 verification). The next actionable layer is to start **coding**.
This file expands **C01 — "Build deck nav foundation + URL/title sync"** into 10
concrete, ordered sub-steps a blind AI can implement directly. Each names the file
to touch (adapt to your tree), the change, the reasoning, and a time estimate.

| # | Sub-step | File | Reasoning | Time |
|---|----------|------|-----------|------|
| C01.1 | Define `Slide` + `Deck` types (`{ id, title }[]`) | `src/slides/types.ts` | A typed slide model is the contract every other module imports; defining it first prevents `any` leaks and rework. | 15 m |
| C01.2 | Add `clampSlide(n, total)` pure helper + unit test | `src/slides/utils/clampSlide.ts` | Bounds logic is reused by `next/prev/goTo` and the jump input; isolating it as a pure, tested function removes a whole class of off-by-one bugs. | 20 m |
| C01.3 | Create `useDeckNavigation()` returning `{ current, total, next, prev, goTo }` | `src/slides/hooks/useDeckNavigation.ts` | This is the single nav API the controller and keyboard handler both consume; centralizing it avoids divergent navigation paths. | 40 m |
| C01.4 | Read `current` from the URL (`/N` or `?slide=N`) as source of truth | same hook | URL-as-truth makes refresh and deep links land correctly and keeps React state minimal. Parse + validate against `total`. | 30 m |
| C01.5 | Write URL on `goTo` — `replaceState` (editor) vs `pushState` (present) | same hook | Choosing history strategy per mode gives correct back/forward behavior; replace avoids polluting history while editing. | 25 m |
| C01.6 | Sync `document.title` to `` `${current}/${total} — ${title}` `` | same hook | Self-describing tabs and screen recordings; a one-line effect with big diagnostic payoff. | 15 m |
| C01.7 | Add looping/clamp policy flag (`loop?: boolean`, default off) | same hook | Decides whether `next` on the last slide wraps or stops; making it explicit now prevents ambiguous edge behavior later. | 15 m |
| C01.8 | Add `prefers-reduced-motion` + z-index/token reads (foundations) | `src/index.css` + `useReduceMotion` | Steps 7–9 of the 100-step guide: tokens (`--ctrl-*`, `--z-controller`) and the reduced-motion boolean must exist before any visual work. | 25 m |
| C01.9 | Guard empty/invalid decks (`total < 1` renders nothing) | same hook | An early guard keeps an empty deck from crashing the controller and documents the contract. | 10 m |
| C01.10 | Unit-test the hook (nav, clamp, URL write, title, loop) | `src/test/useDeckNavigation.test.ts` | Locking the foundation with tests now (CT02 preview) means every later group builds on verified ground. | 25 m |

**Subtotal (C01.1–C01.10): ~3.5 h** (fits within C01's ~2 h core + buffer for tests/tokens).

## Remaining items
1. **Finish C01** via C01.1–C01.10, then proceed to **C02–C10** (~17.5 h remaining of the ~19.5 h build).
2. **Execute CT01–CT20** — verification + hardening after the code lands. (~18 h)
3. **Acceptance walk-through** — end-to-end presenter story, fix defects, flip the controller track to done.

This is the last useful "next 10" documentation layer: beyond per-sub-step
breakdowns, the only remaining work is writing the actual controller code
(C01.1 onward) and running the CT verification suite.
