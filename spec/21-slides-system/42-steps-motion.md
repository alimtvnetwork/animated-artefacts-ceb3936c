# 42 — Steps Motion Spec (Enriched)

> **Last Enriched:** 2026-04-26 · **Phase 2/20** · Supersedes motion
> sections of 17, 23, 27, 32, 33. Companions: `43-steps-sound.md`,
> `44-steps-accessibility.md`, `45-steps-code-references.md`.

## 1. Visual reference

![Canonical steps look](llm/assets/step/target.png)
![Anti-pattern (do not ship)](llm/assets/step/broken-reference.png)

**Stays:** vertical gold connector, numbered chip, eyebrow + title,
right-side description panel, `STEP NN / NN` counter, icon-only Play /
Pause. **Changes vs. v2:** no CSS `transform: scale()` on rows; depth
reads through font-size jumps + opacity ramp + pure-white active title.

## 2. Motion specification (concrete numbers)

| Property | Active | Adjacent (±1) | Far | Notes |
|---|---|---|---|---|
| `font-size` token | `--step-title-active` `clamp(3rem,5vw,4.75rem)` | `--step-title-adjacent` `clamp(1.75rem,2.4vw,2.25rem)` | `--step-title-far` `clamp(1.25rem,1.7vw,1.625rem)` | Defined in `src/index.css :root` |
| `opacity` | `1.0` | `0.55` | `0.30` | Linear ramp; no easing |
| `color` | `hsl(0 0% 100%)` | `hsl(0 0% 100% / 0.75)` | `hsl(0 0% 100% / 0.55)` | Pure white on active |
| `translateX` (slide-in) | `-24px → 0` | unchanged | unchanged | Active text only |
| `transform: scale()` | **forbidden** | **forbidden** | **forbidden** | Blurs glyphs |
| `perspective` / `rotateY` / `translateZ` | none | none | none | No 3D on rows |

Detail-panel snap (right side, on focused step change):

| Phase | Property | Value |
|---|---|---|
| Enter | `opacity` | `0 → 1`, 280ms `cubic-bezier(0.16,1,0.3,1)` |
| Enter | `y` | `+12 → 0` (forward) / `-12 → 0` (backward) |
| Enter | `scale` | `0.985 → 1`, spring `{ stiffness: 380, damping: 28, mass: 0.7 }` |
| Exit | `opacity` | `1 → 0`, 220ms `ease-out` |
| Inner stagger | eyebrow → rule → desc → capsule | 0.05s / 0.12s / 0.18s / 0.26s |

Active connector fill: `bg-gold` + `shadow-[0_0_8px_hsl(var(--gold)/0.6)]`,
height animates from previous chip to current chip center, 320ms ease.

## 3. Constants — single source of truth in code

File: `src/slides/types/StepTimelineSlide.tsx` (lines 73-76).

| Name | Value | Meaning |
|---|---|---|
| `STEP_INTERVAL_MS` | `2200` | Autoplay tick |
| `PAUSE_MS` | `6000` | Manual-interaction pause window |
| `REVEAL_BASE_DELAY` | `0.3` (s) | First row reveal delay |
| `REVEAL_STAGGER` | `0.18` (s) | Per-row reveal stagger |

**Rule:** specs reference constants by name + path. Never duplicate
values inline — if the code file changes, this spec is stale by
definition; bump the patch version and update the table.

## 4. Enums

Defined alongside the slide type in `src/slides/enums.ts` (add if missing):

| Enum | Values |
|---|---|
| `StepMotionState` | `Inactive`, `Entering`, `Active`, `Leaving` |
| `StepMotionDirection` | `FromLeft`, `ToLeft` |

PascalCase, no string concatenation — see Phase 5 for the snippet.

## 5. Reduced-motion behavior

When `window.matchMedia('(prefers-reduced-motion: reduce)').matches`:

- Disable: `translateX`, `y`, `scale`, connector grow animation,
  detail-panel directional snap.
- Keep: `opacity` cross-fades capped at **150ms**.
- Font-size jumps are CSS-driven via `clamp()` — they remain because
  they are layout, not motion.

## 6. Active-step source of truth

The `useFocusTimeline` hook (`src/slides/hooks/useFocusTimeline.ts`)
owns `active`, `hoveredIndex`, `pauseUntilRef`, and exposes
`tryAdvance(dir)`. **Do not introduce a second state machine.** Any new
interaction (keyboard, snap, sound trigger) reads from / writes to this
hook only.

## 7. Acceptance criteria

- **Visual:** active title is pure white at the active font-size token;
  adjacent rows visibly smaller; no blur on any glyph.
- **Behavioral:** keyboard `← → ↑ ↓ Home End` advance; click on inactive
  row jumps + pauses 6s; autoplay default OFF.
- **Accessibility:** with reduced motion on, only opacity changes;
  contrast ratio ≥ 7:1 on active title against `#0D0D0D`.

## 8. Open questions & Changelog

- Open: expose `StepMotionState` via `data-state` (default: yes) and
  per-slide `STEP_INTERVAL_MS` override (default: no).
- 2026-04-26 (v0.79.0): Phase 2 — consolidated motion numbers from
  17/23/27/32/33.
