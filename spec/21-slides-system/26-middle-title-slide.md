# 26 — Middle Title Slide ("Ideas to share" interlude)

A **section-break / interlude slide** used between major chapters of a
deck. Visually it is a darker, calmer cousin of the hero `TitleSlide`:
deep slate base, a focused warm amber spotlight at the optical center,
and a faint constellation of line-art icons scattered around the edges.

Use it whenever the presenter wants to **pause the audience and seed the
next idea** ("Meet the Team", "Now — about pricing", "What we believe",
etc.). Unlike `TitleSlide`, it is intentionally minimal: no eyebrow, no
capsules, no CTA — just a title, a subtitle, and an atmosphere.

---

## 1. Slide-type registration

| Field            | Value               |
| ---------------- | ------------------- |
| `SlideType` enum | `MiddleTitleSlide`  |
| Component        | `src/slides/types/MiddleTitleSlide.tsx` |
| Stage size       | 1920×1080 (the `SlideStage` already scales it; component renders at native size) |
| Brand chrome     | `showBrandHeader: true` (logo top-left), no presenter chip |

Add it after `TitleSlide` in the enum so the picker groups them visually.

---

## 2. JSON shape

```jsonc
{
  "slideNumber": 16,
  "slideName": "meet-the-team",
  "slideType": "MiddleTitleSlide",
  "transition": "FadeIn",
  "textAnimation": "FadeIn",
  "showBrandHeader": true,
  "showPresenterChip": false,
  "content": {
    "title": "Meet the Team",
    "subtitle": "The People Behind the Results"
  }
}
```

Allowed `content` fields:

- `title`     **required** — the gold headline.
- `subtitle`  **optional** — gray sub-line below the title.
- `eyebrow`   **optional** — small uppercase label above the title (off
  by default; only render when set).

Any other content field on `SlideSpec` is ignored by this slide type so
authors don't accidentally cram capsules / steps / hotspots into an
interlude. The schema layer should NOT throw on extra fields (so the
shared `SlideContent` interface stays one shape) — the component simply
chooses what to render.

---

## 3. Layers (back → front)

1. **Base** — `bg-background` (`#0F1115` in noir-gold). Inherited from
   `SlideStage` — the component does NOT redeclare it.
2. **Spotlight** — full-bleed absolute layer with a soft warm radial
   gradient centered at `50% 50%`:
   ```
   background: radial-gradient(
     ellipse 50% 38% at 50% 50%,
     hsl(40 96% 48% / 0.18) 0%,
     hsl(28 75% 11% / 0.55) 35%,
     transparent 65%
   );
   ```
   `pointer-events: none`. Tighter and warmer than `TitleSlide`'s glow,
   so the eye snaps to the title immediately.
3. **Icon scatter** — uses the shared `<AmbientBackground>` component
   with the `productivity` preset (FileText, Video, MessageSquare,
   Clipboard, UserCheck, Book, GitBranch, Users). Defaults: `count: 12`,
   `opacity: 0.05`, `drift: 0.35`, `parallax: 14`. Safe-zone is widened
   to `{x: 36, y: 36}` so no icon ever sits behind the title.
   Deterministic seed = `slide.slideName ?? slide.title`.
4. **Content** — vertically + horizontally centered flex column:
   - Optional eyebrow: `slide-eyebrow` style (gold, wide tracking, ~14px).
   - Title: gold (`hsl(var(--gold))`), `font-weight: 700`, font-size
     `clamp(3rem, 6vw, 5rem)`, `text-align: center`,
     `line-height: 1.05`. Uses the deck's display font (Ubuntu in
     noir-gold).
   - Subtitle: `hsl(var(--foreground) / 0.75)` (≈ `#B0B0B0` on noir),
     `font-weight: 400`, font-size `clamp(1rem, 1.4vw, 1.5rem)`,
     `margin-top: 16px`.

---

## 4. Animation

All motion respects `prefers-reduced-motion`.

| Layer       | Property | Duration | Easing                    | Delay   |
| ----------- | -------- | -------- | ------------------------- | ------- |
| Spotlight   | opacity  | 1.0s     | `easeOut`                 | 0       |
| Icons       | opacity  | 1.2s     | `easeOut`                 | 0.2s + per-icon stagger |
| Eyebrow     | opacity + y(-12→0) | 0.6s | `[0.19, 1, 0.22, 1]` (expo-out) | 0.15s |
| Title       | opacity + y(20→0)  | 0.85s | `[0.19, 1, 0.22, 1]`            | 0.30s |
| Subtitle    | opacity + y(12→0)  | 0.7s  | `[0.19, 1, 0.22, 1]`            | 0.55s |

Reduced-motion: spotlight + icons appear at final opacity instantly;
text reveals as opacity-only fades over 0.4s.

---

## 5. Layout (1920×1080 reference values)

- Title block is centered both axes via `flex items-center justify-center`
  on a `h-full w-full` container.
- The spotlight is centered at `50% 50%` (NOT 55% — this slide's title
  sits dead-center, unlike the hero `TitleSlide` which biases lower).
- Header occupies `top: 32px` (handled by `BrandHeader`); footer / dot-
  pagination are owned by the deck shell, not this slide.
- Maximum title width: `min(80%, 1280px)` so very long titles wrap
  before reaching the icon scatter zone.

---

## 6. Theming + tokens

- Title color: `hsl(var(--gold))` — always gold, regardless of preset
  auto-pick. Section-break slides are a deliberate accent moment.
- Subtitle color: `hsl(var(--foreground) / 0.75)`.
- Spotlight color uses `--gold` HSL channels at low alpha so a future
  theme swap (e.g., a blue palette) automatically retunes the glow.
- The component MUST NOT use raw hex values — all colors flow through
  the design tokens declared in `src/index.css`.

---

## 7. Accessibility

- Title is the slide's `<h1>`.
- Icon scatter has `aria-hidden="true"` (already enforced by
  `AmbientBackground`).
- Color contrast (gold `#F3A502` on `#0D0D0D`) ≥ 8:1 — well above WCAG
  AAA for large text.
- Reduced-motion path skips all transforms and lands on final state.

---

## 8. JSON schema delta

Append `"MiddleTitleSlide"` to the `slideType` enum in
`spec/slides/slide.schema.json`. No new content fields needed — the
existing optional `title`, `subtitle`, `eyebrow` are sufficient.

---

## 9. Reference screenshot

User-supplied: dark slate base, a soft amber radial glow at center,
faded line-art icons (people, document, video, chat, clipboard, book,
git-branch, user-check) scattered around the edges, gold "Meet the
Team" title centered, and a gray "The People Behind the Results"
subtitle. The chrome (logo top-left, controller pill top-right, dotted
pagination at bottom) is owned by the deck shell — this slide does
NOT render any of it.
