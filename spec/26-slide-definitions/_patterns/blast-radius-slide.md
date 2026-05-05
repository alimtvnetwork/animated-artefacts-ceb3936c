# BlastRadiusSlide — Authoring Spec

> **Slide pattern.** A cinematic, full-bleed **title moment** — a single
> oversized chrome/gradient word floats at center while polygonal **shards**
> tumble in 3D and a fine **particulate field** drifts toward the camera.
> The slide ends by **fading + zooming the entire stage forward** so the
> next slide feels like it was *behind* the title and is now arriving.
>
> Use it for: chapter openers, product reveals ("Blast Radius"),
> dramatic section breaks where you need the audience to **stop talking**
> and look up. One word. One moment. No body text.
>
> Reference frames:
> `spec/26-slide-definitions/_patterns/blast-radius-reference-1.png`
> `spec/26-slide-definitions/_patterns/blast-radius-reference-2.png`
> (logo cropped — frames are sourced from a third-party reel for motion
> reference only; no third-party brand assets are reproduced.)

---

## 1. Mental model — what the AI must internalize before authoring

This slide is **a single gesture**. Three rules:

1. **One word, full screen.** The title is the slide. Eyebrow/subtitle
   are optional and *whisper-quiet* — they exist to caption the title,
   never to compete with it. If the AI catches itself adding a third
   line, it has misread the pattern: use `MiddleTitleSlide` instead.

2. **Everything moves, nothing wiggles.** Particles drift on a
   continuous slow trajectory. Shards rotate on their own axes at
   different speeds. The title itself has a faint chrome shimmer that
   sweeps across the gradient every ~6s. The motion is **ambient**,
   not jittery — if any single element calls attention to itself
   (jumps, snaps, ticks), it's wrong.

3. **The outro is part of the slide.** When the deck advances *off*
   this slide, the entire stage **scales 1.0 → 1.18 + opacity 1 → 0**
   over 600ms (expoIn) so the audience perceives "we just flew through
   the title." The next slide's normal entrance plays *underneath*
   this exit — that's the `zoomOut` push that the spec exposes as a
   first-class transition value (`SlideTransition.ZoomOut`).

If the AI loses any of the three, the slide collapses to a generic
fade-in title.

---

## 2. Aspect ratio & canvas

- **Author at 1920×1080.** ScaledSlide handles all rescaling.
- **No safe-area inset** — this slide is intentionally full-bleed.
  The brand header still renders above (BrandHeader ignores the
  background), but the title and shards extend to all four edges.
- **Vignette layer:** a radial dark mask hugs the corners
  (`hsl(var(--ink) / 0.85)` at corners → `transparent` at 60% radius)
  so shards exiting frame fade naturally instead of clipping.

---

## 3. Layer stack (back → front)

| z | Layer                  | Owner                       | Theme-aware? |
|---|------------------------|-----------------------------|--------------|
| 0 | Page background        | SlideStage (`bg-background`) | yes |
| 1 | Radial vignette        | `<RadialVignette>`           | yes (ink token) |
| 2 | Particulate field      | `<ParticleField count={N}>`  | yes (gold/cream tokens) |
| 3 | Tumbling shard cluster | `<ShardCluster count={S}>`   | yes (cream/gold tokens) |
| 4 | Chrome title           | `<BlastTitle text=… />`      | yes (gradient token) |
| 5 | Eyebrow + subtitle     | inline (optional)            | yes |
| 6 | Brand chrome           | SlideStage                   | n/a |

Every layer above z=0 is `pointer-events: none` so slide-jump
shortcuts and hover-to-reveal controller still work.

---

## 4. Color treatment — theme-driven, never hard-coded

The reference uses cyan→silver. **Do NOT hard-code that.** This deck
runs across Noir & Gold, Paper & Ink, GitHub Light, custom imported
themes — a fixed cyan would explode contrast on light themes.

| Theme appearance | Title gradient                                | Particles  | Shards     |
|------------------|-----------------------------------------------|------------|------------|
| dark             | `--gold` → `--cream` → `--ember`              | `--gold`   | `--cream`  |
| light            | `--ember` → `--gold` (darker)                 | `--ink`    | `--gold`   |

Implementation: build the gradient with `hsl(var(--gold))` etc.;
the theme stylesheet remaps the token. **Never write a raw hex** in
the component (project Core rule + `mem://design/light-theme-capsule-fg-rule`).

The vignette uses `hsl(var(--ink) / 0.85)` on dark themes and
flips to `hsl(var(--background) / 0.0)` on light themes (handled
automatically because `--ink` already remaps under light themes).

---

## 5. Title — the chrome word

Element: `<h1 class="slide-title-display blast-title">`.

- **Font:** `Ubuntu Bold` (deck title font; same as TitleSlide).
- **Size:** `clamp(8rem, 14vw, 18rem)` — about 2× the regular hero.
- **Letter-spacing:** `-0.02em` to keep the word optically tight.
- **Fill:** `background: linear-gradient(180deg, …); -webkit-background-clip: text;`
  with the theme tokens above.
- **Bevel:** the deck's `--text-shadow-weight-strong` token (already
  applied to `.slide-title-display` per `mem://design/text-weight-shadow`).
  **Never write inline `text-shadow`** — the token handles per-theme
  contrast.
- **Shimmer:** an absolutely-positioned overlay with a 30%-wide
  vertical gradient stripe at `mix-blend-mode: overlay`, sweeping
  `translateX(-120% → 220%)` over 6s, infinite, ease-in-out. Disabled
  under `prefers-reduced-motion`.
- **Entrance:** opacity 0 → 1 (520ms) + scale 0.86 → 1.0 (760ms,
  spring damping 18 stiffness 140) + a one-shot 320ms gradient-position
  animation (`background-position: 0% 0% → 100% 100%`) so the chrome
  "settles."

---

## 6. Particle field

Element: `<ParticleField count={…}>` rendering `count` absolutely-positioned
`<span>` dots.

- **Count:** `60` (`reduced-motion` → `0`, no DOM at all).
- **Distribution:** uniform random across the 1920×1080 frame using a
  deterministic seed = slide title (so SSR + rerenders are identical).
- **Per-particle props:**
  - size: 1.5–4px (gaussian)
  - opacity: 0.20–0.85
  - color: `hsl(var(--gold))` or `hsl(var(--cream))` (alternating)
  - blur: 0px on 70% of particles, 0.5–1px on 30% (depth feel)
- **Motion:** each particle owns a CSS-animation with a 12–22s
  duration (random per particle) translating `translate(0,0) → translate(dx,dy)`
  where `dx ∈ [-40, 40]` and `dy ∈ [-60, -20]` (gentle upward drift,
  toward camera). Linear easing. `animation-delay: random(0, -22s)` so
  the field is already in motion on mount (no synchronized "start").

---

## 7. Shard cluster

Element: `<ShardCluster count={…}>` rendering `count` SVG polygons.

- **Count:** `7` (`reduced-motion` → `0`).
- **Geometry:** irregular convex pentagons/hexagons, edge length
  60–180px. Generated from a deterministic seed (same as particles).
- **Fill:** `none`. **Stroke:** `hsl(var(--cream) / 0.45)`,
  `stroke-width: 1.5px`. Subtle inner highlight via a second polygon
  at 40% scale + 0.15 stroke alpha (gives the "metallic edge" look).
- **Position:** scattered around the title, never inside a 40% × 30%
  centered safe zone (so they never sit *on* the word).
- **Per-shard motion:**
  - **Tumble:** WAAPI `transform: rotate3d(rx, ry, rz, 0deg → 360deg)`
    where `(rx, ry, rz)` is a random unit vector. Duration 14–26s,
    linear, infinite. Each shard owns its axis.
  - **Float:** parallel translate animation, `translate3d(0,0,0) → translate3d(dx,dy,0)`,
    `dx ∈ [-90, 90]`, `dy ∈ [-60, 60]`, 9–15s, ease-in-out, alternate.
  - **Glint:** every 8–12s the stroke alpha pulses 0.45 → 0.85 → 0.45
    over 700ms (CSS animation, randomized delay per shard).

---

## 8. Outro — `SlideTransition.ZoomOut`

The whole point of the slide. When the deck advances **away** from
this slide, the exit variant is:

```ts
{
  exit: { opacity: 0, scale: 1.18, filter: 'blur(4px)' },
  transition: { duration: 0.60, ease: [0.7, 0, 0.84, 0] } // expoIn
}
```

This is registered as a new value of `SlideTransition`:
`ZoomOut: 'ZoomOut'`. The next slide's entrance plays normally
underneath; the audience perceives a forward dolly through the title.

`prefers-reduced-motion` collapses to a 240ms fade with no scale.

The outro is **only** applied when leaving a `BlastRadiusSlide` —
other slide types continue to use their authored `slide.transition`.
This is wired in `transitions.ts` by checking the *outgoing* slide's
`slideType`, not just the value of `transition`.

---

## 9. Schema (`SlideSpec.content` for `slideType: 'BlastRadiusSlide'`)

```ts
interface BlastRadiusContent {
  /** The single hero word. Required. Keep to ≤ 18 chars for legibility. */
  title: string;
  /** Optional small label above the title (e.g. "CHAPTER 03"). */
  eyebrow?: string;
  /** Optional whisper line below the title. ≤ 60 chars. */
  subtitle?: string;
  /** Override particle count. Default 60. Set 0 to disable. */
  particleCount?: number;
  /** Override shard count. Default 7. Set 0 to disable. */
  shardCount?: number;
  /** Override title gradient angle in degrees. Default 180. */
  gradientAngle?: number;
}
```

**Required fields:** `title`. Everything else is optional.

---

## 10. Accessibility

- The title is a real `<h1>` (or `<h2>` if not the first slide) — screen
  readers read the chapter name normally.
- All decorative layers (`vignette`, `particles`, `shards`, `shimmer`)
  carry `aria-hidden="true"`.
- `prefers-reduced-motion: reduce`:
  - Particles: not rendered (no DOM at all).
  - Shards: not rendered.
  - Shimmer: not rendered.
  - Title entrance: 240ms fade, no scale.
  - Outro: 240ms fade, no scale, no blur.

---

## 11. Anti-patterns (do NOT)

1. ❌ Hard-code cyan / teal / silver. Always go through theme tokens.
2. ❌ Add a third text line (subtitle + caption + tagline). One word.
3. ❌ Use raw `<img>` for shards — they must be SVG so theme tokens
   recolor them.
4. ❌ Animate `top`/`left` on particles (paint thrash). Use `transform`.
5. ❌ Render `particleCount > 80` — frame budget collapses on the
   1920×1080 stage at projector resolution.
6. ❌ Apply the `ZoomOut` exit to slides that aren't `BlastRadiusSlide`.
7. ❌ Place shards inside the centered safe zone (40% × 30% rect).
8. ❌ Inline `text-shadow` on the title — bevel is owned by the
   `--text-shadow-weight-*` tokens.
9. ❌ Ship without a `prefers-reduced-motion` audit. Particle DOM
   must be absent under reduced motion, not merely paused.
10. ❌ Use this slide for body content. If it has bullets, it isn't
    a BlastRadiusSlide.

---

## 12. Worked example (JSON)

```json
{
  "slideNumber": 7,
  "slideName": "Blast radius opener",
  "slideType": "BlastRadiusSlide",
  "transition": "ZoomOut",
  "textAnimation": "fadeIn",
  "content": {
    "eyebrow": "CHAPTER 03",
    "title": "Blast Radius",
    "subtitle": "what breaks when one secret leaks"
  }
}
```
