# Text Weight Shadow — Spec

**Status:** v1.0 — canonical
**Scope:** All themes, all slide types, all chrome
**Owner:** Design system (`src/index.css` tokens)

---

## 1. Intent

Light-colored text on dark backgrounds (and vice versa) can feel weightless —
the letters "float" and lose perceived mass. A very subtle, low-blur,
diagonally-offset shadow gives glyphs a quiet sense of dimensionality without
veering into 90s "drop shadow" territory.

This is **not** a decorative effect. It is a structural typography token,
applied via design-system classes / CSS variables — never inline hex per
component.

---

## 2. Rules of application

### 2.1 ALWAYS apply (light text on dark / mid surfaces)

Any text rendered in:
- `--white` (cream / pure white)
- `--cream` (`#F0D78C`)
- `--gold` (`#C9A84C`)
- `--ember` (`#E85D3A`)
- Any `text-foreground` token resolving to a value with **L ≥ 70%** (light)
  on a background with **L ≤ 35%** (dark).

→ Apply `--text-shadow-weight-light` (default).

### 2.2 SOMETIMES apply (dark text on light surfaces)

Dark text on light themes (e.g. GitHub Light's `--foreground = hsl(210 12% 16%)`
on `hsl(210 17% 98%)`) is already heavy by virtue of contrast. Add shadow
**only** when:
- The text sits on a **gradient or image background** (not a flat fill).
- The text is **display-size** (≥ `clamp(2.5rem, 4vw, 4rem)` ≈ slide titles).
- The designer explicitly opts in via `text-weight-dark` utility class.

→ Apply `--text-shadow-weight-dark` (optional).

### 2.3 NEVER apply

- Body copy < 18px rendered (too small — shadow muddies anti-aliasing).
- Text inside capsules / pills (the fill already provides weight).
- Code / monospace blocks.
- Numeric counters that animate on every frame (perf).
- When `prefers-reduced-transparency` is set (we drop the alpha-blur layer).

---

## 3. The tokens (CSS)

Defined once in `src/index.css` under `:root`, never overridden per theme
(the colors inside the shadow auto-adapt because they are alpha-only on
black or white).

```css
:root {
  /* Light text on dark — the default "weight" treatment.
     Two-stop shadow:
       1. A 1px hairline offset at 45° in near-black @ 35% — "ink edge"
       2. A 4px soft halo at the same angle in pure black @ 18% — "ground"
     Combined effect ≈ a quiet bevel that adds perceived mass to glyphs
     without producing a visible drop shadow. */
  --text-shadow-weight-light:
    0.7px 0.7px 0px hsl(0 0% 0% / 0.35),
    1.4px 1.4px 4px hsl(0 0% 0% / 0.18);

  /* A heavier variant for hero / display text where extra anchoring helps
     (TitleSlide H1, SectionDivider headlines). Same direction, more depth. */
  --text-shadow-weight-light-strong:
    1px 1px 0px hsl(0 0% 0% / 0.40),
    2px 2px 6px hsl(0 0% 0% / 0.22),
    3px 3px 14px hsl(0 0% 0% / 0.10);

  /* Dark text on light — opt-in only. Shadow is light-gray rather than
     black so it suggests embossing, not a drop shadow. Direction inverted
     to feel like top-left light source on a raised letter. */
  --text-shadow-weight-dark:
    -0.5px -0.5px 0px hsl(0 0% 100% / 0.6),
    0.5px 0.5px 1px hsl(220 10% 30% / 0.10);

  /* Display variant for light themes (GitHub Light hero titles). */
  --text-shadow-weight-dark-strong:
    -0.5px -0.5px 0px hsl(0 0% 100% / 0.7),
    1px 1px 2px hsl(220 10% 25% / 0.14),
    2px 2px 6px hsl(220 10% 25% / 0.06);
}

@media (prefers-reduced-transparency: reduce) {
  :root {
    /* Drop the soft halo, keep only the hairline edge. */
    --text-shadow-weight-light: 0.7px 0.7px 0px hsl(0 0% 0% / 0.35);
    --text-shadow-weight-light-strong: 1px 1px 0px hsl(0 0% 0% / 0.40);
    --text-shadow-weight-dark: -0.5px -0.5px 0px hsl(0 0% 100% / 0.6);
    --text-shadow-weight-dark-strong: -0.5px -0.5px 0px hsl(0 0% 100% / 0.7);
  }
}
```

### 3.1 Direction

All shadows use a **45° offset toward bottom-right** (positive X, positive Y)
for light-on-dark — matches the implied "top-left light source" used across
the slide system (BrandHeader gold gradient, gold capsule inset highlight).
Dark-on-light inverts to **top-left** (negative X, negative Y) so the letter
appears to catch light from the same source.

### 3.2 Why 0.7px / 1.4px (not whole pixels)

Sub-pixel offsets render as a true anti-aliased bevel rather than a visible
1px ghost. On 1x and 2x displays both look correct; on 3x the sub-pixel
preserves softness rather than hardening into a stair-step.

---

## 4. The utility classes

```css
@layer utilities {
  .text-weight        { text-shadow: var(--text-shadow-weight-light); }
  .text-weight-strong { text-shadow: var(--text-shadow-weight-light-strong); }
  .text-weight-dark   { text-shadow: var(--text-shadow-weight-dark); }
  .text-weight-dark-strong { text-shadow: var(--text-shadow-weight-dark-strong); }
  .text-weight-none   { text-shadow: none; }   /* explicit opt-out */
}
```

### 4.1 Auto-application (the `.slide-content` default)

To avoid having to retrofit every component, the default treatment is
applied at the `.slide-content` scope:

```css
.slide-content {
  /* Default for light-themed text on dark slides. Components opt-out via
     .text-weight-none on the specific element. */
  --slide-text-shadow: var(--text-shadow-weight-light);
}

/* Light themes flip the default. */
[data-theme='github-light'] .slide-content,
[data-theme='macos-sonoma'] .slide-content {
  --slide-text-shadow: none;            /* dark text on light = no default */
}

.slide-content h1,
.slide-content h2,
.slide-content .text-weight-auto {
  text-shadow: var(--slide-text-shadow);
}
```

Components that need the **strong** variant (TitleSlide hero, etc.) opt
in explicitly with `.text-weight-strong`. Components that should not have
any shadow (capsules, code blocks, body copy under 18px) opt out with
`.text-weight-none`.

---

## 5. Per-slide-type matrix

| Slide type             | Element                          | Class / token                     |
|------------------------|----------------------------------|-----------------------------------|
| TitleSlide             | H1 hero                          | `.text-weight-strong`             |
| TitleSlide             | Subtitle                         | `.text-weight` (default)          |
| KeywordSlide           | Single keyword                   | `.text-weight-strong`             |
| CapsuleListSlide       | Heading                          | `.text-weight`                    |
| CapsuleListSlide       | Capsule labels                   | `.text-weight-none` (capsule fill = weight) |
| StepTimelineSlide      | Title (`Engagement Process`)     | `.text-weight-strong`             |
| StepTimelineSlide      | Eyebrow (`HOW WE WORK`)          | `.text-weight`                    |
| StepTimelineSlide      | Active step label (`Discovery`)  | `.text-weight-strong`             |
| StepTimelineSlide      | Adjacent / far step labels       | `.text-weight` (alpha < 1, light) |
| StepTimelineSlide      | Side-panel description           | `.text-weight`                    |
| StepTimelineSlide      | Step subtitle ("Listen, audit…") | `.text-weight`                    |
| StepTimelineSlide      | Capsule labels (Week 1 etc.)     | `.text-weight-none`               |
| StepTimelineSlide      | CTA button label                 | `.text-weight-none`               |
| ImageSlide             | Caption                          | `.text-weight`                    |
| QrMeetingSlide         | Headline                         | `.text-weight-strong`             |
| QrMeetingSlide         | URL / handle                     | `.text-weight`                    |
| ClickRevealSlide       | Inherits parent slide rules      | (auto)                            |
| SectionDividerSlide    | Section label                    | `.text-weight-strong`             |
| BrandHeader            | "Riseup Asia" wordmark           | `.text-weight` (gold gradient)    |
| BrandHeader            | Presenter chip name              | `.text-weight-none` (small + chip)|
| ControllerBar / chrome | All chrome text                  | `.text-weight-none` (already pill)|

Light-theme overrides:
- TitleSlide H1 → `text-weight-dark-strong`
- StepTimelineSlide title → `text-weight-dark-strong`
- All other body copy → no shadow (rely on contrast)

---

## 6. Examples

### 6.1 TitleSlide hero (noir theme)

```tsx
<h1 className="font-display text-8xl text-foreground text-weight-strong">
  Riseup Asia
</h1>
```
Renders as cream ink with a subtle bottom-right bevel that anchors the
glyphs against the noir lattice.

### 6.2 StepTimelineSlide active step (noir)

```tsx
<div
  className="step-title font-display font-bold text-weight-strong"
  data-debug-token="step-title (active)"
>
  Discovery
</div>
```

### 6.3 Capsule (always opt-out)

```tsx
<span className="capsule-gold text-weight-none">Week 1</span>
```

### 6.4 GitHub Light TitleSlide hero (opt-in dark variant)

```tsx
// In github-light, the .slide-content default is `none`. Hero text
// opts back in to the dark-strong variant.
<h1 className="font-display text-8xl text-foreground text-weight-dark-strong">
  Riseup Asia
</h1>
```

---

## 7. Validation

A test (`src/test/textShadowTokens.test.ts`) asserts:
1. The four `--text-shadow-weight-*` tokens exist in `src/index.css`.
2. The four utility classes (`text-weight`, `text-weight-strong`,
   `text-weight-dark`, `text-weight-dark-strong`) are defined.
3. `prefers-reduced-transparency` block is present.
4. No component re-defines `text-shadow` with hardcoded hex (only via
   the tokens). Lint via regex over `src/slides/**/*.tsx`.

---

## 8. Future work

- Per-theme tuning: a high-contrast theme might want a heavier shadow.
- Animation: when a step row transitions from `far` → `active`, fade the
  shadow alpha alongside the color change (already covered by the existing
  1300ms ease on `.step-row .step-title`, since `text-shadow` interpolates).
