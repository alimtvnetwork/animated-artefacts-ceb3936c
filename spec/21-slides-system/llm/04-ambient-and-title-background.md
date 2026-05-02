# 04 — Ambient Background + Title Slide

Two related topics in one file because the Title slide IS the canonical
consumer of the ambient layer. Replaces — for new builds — specs 15,
24, and 31.

---

## Part A — Ambient Background (the constellation)

### A.1 Component

`src/slides/components/AmbientBackground.tsx`

```ts
interface AmbientBackgroundProps {
  /** Stable seed → deterministic icon layout. Pass slide title or slug. */
  seed: string;
  /** Lucide icon set to scatter. Defaults to a generic productivity set. */
  icons?: ComponentType<LucideProps>[];
  /** Number of icons to render. Default 14. */
  count?: number;
  /** Peak per-icon opacity. Default 0.05. */
  opacity?: number;
  /** Drift radius in % of stage. 0 = static. 0.4 = subtle float. */
  drift?: number;
  /** Soft radial amber glow above the icons. */
  glow?: boolean;
  /** Cursor parallax max-shift in px. 0 = off. Default 18. */
  parallax?: number;
}
```

### A.2 Mount example (the only correct way)

> **Ownership (matches `08-background-system.md` §2):** the slide-type
> component mounts `<AmbientBackground />` at z=0 inside its own root.
> `SlideStage` never mounts it — that's why this example lives inside
> `MyTitleSlide`, not in a stage wrapper.

```tsx
import { AmbientBackground } from '@/slides/components/AmbientBackground';
import { FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users } from 'lucide-react';

export function MyTitleSlide({ spec }: { spec: SlideSpec }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* z-0 — constellation behind everything */}
      <AmbientBackground
        seed={spec.slideName}
        icons={[FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users]}
        count={14}
        opacity={0.05}
        drift={0.4}
        parallax={18}
        glow
      />

      {/* z-10 — your content sits on top */}
      <div className="relative z-10 flex h-full items-center justify-center">
        {/* … */}
      </div>
    </div>
  );
}
```

### A.3 Visual rules

- Icons render at 5 % opacity (`--ambient-opacity` token).
- Stroke width 1, sized 26–50 px (random per-icon, **deterministic** from `seed`).
- Avoid the central `30 % × 30 %` safe zone so icons don't crowd content.
- `drift > 0` → each icon Framer-animates with a 12–22 s sine loop on
  x + y of `±drift %`. Different phase per icon → field feels organic.
- `glow=true` → a single radial gradient (amber `hsl(28 75% 11%)`) layered
  above the icons, behind content.
- `pointer-events: none` and `aria-hidden="true"` always.

### A.4 Idle Lissajous sway (always alive, no mouse needed)

A single `requestAnimationFrame` loop drives BOTH idle sway and cursor
smoothing:

- **Idle target** = Lissajous figure with coprime periods (7 s × 11 s):
  `x = sin(t·2π/7) · 0.18`, `y = cos(t·2π/11) · 0.18`. Never visibly
  repeats.
- **Idle amplitude** `0.18` ≈ 36 % of the cursor `±0.5` range — visible
  but doesn't fight a real cursor.
- **Mouse handover:** `idleBlend` ramps `0 → 1` over 1000 ms after the
  mouse stops (200 ms grace). Real cursor dominates while moving; idle
  resumes smoothly once still.
- **Smoothing:** `cursor = lerp(cursor, target, 0.08)` per frame.
  Critically damped, no spring deps.
- **Reduced motion:** rAF loop is **skipped** entirely; icons static.

### A.5 Named presets (`src/slides/ambientPresets.ts`)

| Preset id      | Icons (verified — all exist in `lucide-react`) | Use it for |
|----------------|------------------------------------------------|-----------|
| `devtools`     | `Code2, Terminal, GitBranch, Github, Figma, Boxes, Cpu, Cloud` | Dev / engineering work |
| `productivity` | `FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users` | Knowledge work |
| `process`      | `Compass, Target, Hammer, TrendingUp, Workflow, Layers, Activity, Sparkles` | Strategy / methodology / step slides |
| `minimal`      | `Sparkles` only, very faint | Almost no visual weight; just atmosphere |

JSON shape (per slide, top level):

```jsonc
"ambientBackground": "process"
// or fine-tuned:
"ambientBackground": {
  "preset": "process",
  "count": 16,
  "opacity": 0.05,
  "drift": 0.4,
  "glow": true,
  "parallax": 18
}
// explicit off:
"ambientBackground": false
```

> **`StepTimelineSlide` ignores this field** and renders its own
> theme-specific ambient layer (the `STEP_AMBIENT_POOL` from file 02).

### A.6 Per-slide-type defaults

| Slide type | Default icons |
|---|---|
| `TitleSlide` | `productivity` preset |
| `MiddleTitleSlide` | `productivity` preset, lower count (~10) |
| `StepTimelineSlide` | Internal pool (`Code2, Terminal, GitBranch, Github, Figma, Boxes, Container, Cpu, Cloud, Database, Braces, Bug`) |
| `CapsuleListSlide` | none unless `ambientBackground` is set |
| `FocusTimelineSlide` | none unless `ambientBackground` is set |
| `QrMeetingSlide` / Contact | none |

---

## Part B — Title Slide (the hero)

Reference asset: `assets/title/riseup-asia-logo.png`,
`assets/title/presenter.png`.

### B.1 Layer stack (back → front)

1. **Base** — `bg-background` (`#0F1115` / `#0D0D0D` depending on theme).
2. **Radial glow** — absolute, full-bleed:
   ```css
   background: radial-gradient(
     ellipse 60% 45% at 50% 55%,
     hsl(28 75% 11% / 0.95) 0%,
     hsl(28 75% 11% / 0.55) 25%,
     transparent 60%
   );
   pointer-events: none;
   ```
3. **Scattered icons** — `<AmbientBackground seed={spec.slideName} icons={[FileText, Video, MessageSquare, Clipboard, UserCheck, Book, GitBranch, Users]} count={14} opacity={0.05} drift={0.4} glow={false} parallax={18} />`.
   Glow is FALSE here because layer 2 already provides it.
4. **Content** — centered title / subtitle / capsules block.
   - Title color: `hsl(var(--gold))` (always — overrides preset auto-pick).
   - Subtitle color: `hsl(var(--foreground) / 0.65)` (lighter than the
     standard `/0.70` because the warm glow underneath needs more
     contrast cut).
   - **No eyebrow by default** — the glow + icons carry the visual
     weight. If the user explicitly asks for an eyebrow, render it.

### B.2 Enter timeline (canonical, from `t = 0`)

```
 t = 0.00s   Stage transition begins (SlideStage AnimatePresence enter)
 t = 0.20s   Glow fade 0 → 1                    (0.80s ease-out)
 t = 0.25s   Eyebrow reveal                      (fadeIn,  0.45s)
 t = 0.40s   Title reveal                         (titleSlide preset, 0.55s)
 t = 0.85s   Subtitle reveal                      (fadeIn,  0.50s)
 t = 1.10s + (i * 0.09s)   Capsule i lands       (cinematicCapsules, 0.55s)
 t ≈ 1.65s   All elements at rest
```

Children inherit Framer's stagger only as a fallback — **explicit
`delay` values on each block are authoritative** so the curve is
identical regardless of sibling count.

### B.3 The `titleSlide` text-animation preset

```ts
titleSlide: {
  initial: { opacity: 0, scale: 0.94 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 240, damping: 18, mass: 0.9 },
  },
}
```

Use `titleSlide` instead of `bounce` when long titles look unsettled
with both bounce + slide-up.

### B.4 Stage-level transition variants

`src/slides/transitions.ts`. Title Slide defaults to `FadeIn` (per spec
15) but supports the full enum:

| Transition | Initial | Animate | Exit | Duration |
|---|---|---|---|---|
| `FadeIn`     | `opacity 0`             | `opacity 1`   | `opacity 0`            | 0.55s |
| `SlideIn`    | `opacity 0, y +40`       | `opacity 1, y 0` | `opacity 0, y -40`    | 0.55s |
| `PushIn`     | `opacity 0, scale 0.92`  | `opacity 1, scale 1` | `opacity 0, scale 1.04` | 0.55s |
| `PushLeft`   | `opacity 0, x +8% (fwd)` | `opacity 1, x 0` | `opacity 0, x -8% (fwd)` | 0.55s |
| `PushRight`  | `opacity 0, x -8% (fwd)` | `opacity 1, x 0` | `opacity 0, x +8% (fwd)` | 0.55s |

Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (out-expo). Same on enter and
exit so the slide breathes symmetrically.

**Exit always runs at 0.55 s** regardless of the enter timeline so the
deck never feels sticky when advancing. The capsule cascade does NOT
play in reverse on exit.

### B.5 Capsule cascade

Each capsule enters with the `cinematicCapsules` preset (blur → focus +
spring overshoot) and a **0.09 s per-index delay** added to the row's
1.10 s base offset. So with 3 capsules:

- Capsule 0 → 1.10s
- Capsule 1 → 1.19s
- Capsule 2 → 1.28s

Origin: each capsule scales from its **center**, so the row reads as a
keyboard rolling left → right, not a single block expanding.

### B.6 Reduced motion

Mandatory contract:

1. Stage transition collapses to a 0.2 s opacity fade. No translate, no
   scale.
2. Each text block: `initial = animate` (instantly visible), but the
   **delay sequence is preserved** — the audience still perceives the
   step timeline, just without movement.
3. Glow + icons appear at final opacity instantly. No per-icon stagger.
4. Capsule cascade collapses to `opacity 0 → 1` over 0.18 s with the
   same 0.09 s per-index delay so the rhythm survives.

### B.7 Implementation contract

The component (`src/slides/types/TitleSlide.tsx`) MUST:

1. Pull `useReducedMotion()` once at the top.
2. Resolve each block's variants via `resolvePreset()` with these
   defaults: `eyebrow → fadeIn`, `title → titleSlide`, `subtitle →
   fadeIn`, `capsules → cinematicCapsules`.
3. Apply explicit per-block `transition.delay` values from B.2 — do not
   rely on container stagger.
4. Pass `delay = 1.10 + i * 0.09` to each `Capsule` motion wrapper.
5. When reduced motion is on, swap variants for the reduced-motion
   versions (also defined in `textAnimations.ts`) and **keep the delays**.

The stage transition is owned by `SlideStage`; Title Slide does NOT
wrap itself in another `AnimatePresence`.

### B.8 Title shimmer

Set `titleShimmer: true` in JSON to enable the one-shot diagonal
highlight sweep:

```css
.shimmer-sweep::after {
  background: linear-gradient(
    115deg,
    transparent 30%,
    hsl(var(--gold-glow) / 0.35) 50%,
    transparent 70%
  );
  animation: shimmer-slide 1.6s var(--transition-smooth) 0.4s 1 forwards;
}
```

**Rule:** prefer solid colors (`titleStyle: "cream" | "white" | "gold"`)
and add `titleShimmer: true` to put motion on top, instead of using a
static gradient (`titleStyle: "gradient"`). Static gradients read as
decoration; moving highlights read as craft.

### B.9 Acceptance

- [ ] Glow rises ~0.20 s after the slide enters.
- [ ] Eyebrow → title → subtitle → capsules land in that order, no
      overlap.
- [ ] Capsules cascade left → right with a perceptible 90 ms gap.
- [ ] All five `slide.transition` variants render correctly with no
      layout jump.
- [ ] On `prefers-reduced-motion`, the cascade rhythm is preserved but
      no element translates or scales.
- [ ] Slide exit completes inside 0.55 s; capsules don't reverse-blur.
- [ ] Idle ambient icons sway without a mouse movement (Lissajous).
- [ ] Cursor parallax kicks in on mousemove and hands back to idle
      ~1 s after the mouse stops.
- [ ] No console warnings from framer-motion about animating
      conflicting properties (e.g. `y` and `transform`).

---

## C. Common mistakes (and what to do instead)

| Mistake | Fix |
|---------|-----|
| Animating everything via container `staggerChildren` | Use **explicit per-block `delay`** so curve survives conditional rendering. |
| Hard-coding `#FCA311` for the title gold | Use `hsl(var(--gold))`. |
| Adding a 7th icon to the title constellation | The seeded layout assumes 14 (`count={14}`). If you raise it, regenerate — see `assets/title/`. |
| Importing `Telescope` from lucide-react | It exists, but check the version pinned in `package.json` before using exotic icons. Stick to the verified preset lists. |
| Mounting `AmbientBackground` above content (z-index error) | Always wrap in `relative` parent and put content inside `relative z-10`. |
| Skipping `seed` prop | Every render reshuffles. Pass `seed={spec.slideName}` (or any stable string). |
| Calling `useReducedMotion()` per child | Call it once in the slide root, branch variants down. |
