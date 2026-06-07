# 06 — Typography

This file locks the **type system** for step slides so a blind LLM reproduces
the exact font stacks, weights, depth ramp, and weight-bevel behavior.

Source anchors:

- Step title type + bevel: `src/index.css:1512-1546`
- Depth ramp (active/adjacent/far): `src/index.css:1562-1582`
- Title size tokens: `src/index.css:208-210`, override `src/index.css:679`
- Slide title / eyebrow classes: `src/index.css:723-770`
- Body font: `src/index.css:241,752`
- Weight-shadow tokens: `mem://design/text-weight-shadow`

---

## 1. Font stacks (non-negotiable)

| Role | Class / selector | Family | Weight |
|---|---|---|---|
| Deck/slide title | `.slide-title-display` | `'Ubuntu', 'Inter', sans-serif` | 700 |
| Eyebrow / kicker | `.slide-eyebrow` | `'Inter', sans-serif` | medium |
| Step title (the item) | `.step-row .step-title` | `'Ubuntu', 'Inter', -apple-system, …` | 700 |
| Step row container | `.step-row` | `'Inter', -apple-system, …` | — |
| Supporting/subtitle copy | preset body | `var(--preset-body-font, 'Inter', sans-serif)` | 400 |

House rule: **titles are Ubuntu, body is Inter.** Supporting copy stays Inter
unless overridden by the active preset body font. Never serif on a step slide.

---

## 2. Step-title micro-typography

From `src/index.css:1512-1518`:

```css
.step-row .step-title {
  font-family: 'Ubuntu', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-shadow: var(--text-shadow-weight-light-strong);
}
```

- `letter-spacing: -0.02em` — slight negative tracking for display tightness.
- `text-shadow` uses the **weight-bevel token**, never an inline shadow. The
  shadow is part of the transition list so it animates on activation.
- Antialiasing on `.step-row`: `-webkit-font-smoothing: antialiased`,
  `text-rendering: optimizeLegibility` (`src/index.css:1509-1511`).

---

## 3. The depth ramp (size + alpha, NOT scale)

Hierarchy is conveyed by **font-size token + foreground alpha**, never by a
permanent `transform: scale()`. See `04-css-tricks.md §2`.

| State | Font-size token | Color | Value |
|---|---|---|---|
| active | `--step-title-active` | `hsl(var(--foreground))` | `clamp(2.93rem, 5.46vw, 4.88rem)` |
| adjacent | `--step-title-adjacent` | `hsl(var(--foreground) / 0.62)` | `clamp(1.95rem, 2.86vw, 2.6rem)` |
| far | `--step-title-far` | `hsl(var(--foreground) / 0.55)` | `clamp(1.46rem, 2.08vw, 1.95rem)` |

> The `far` alpha is **0.55**, not 0.40 — 0.40 failed WCAG AA-large (3:1) on
> github-light (~2.36:1 on white). Guarded by
> `stepTimelineGithubLightContrast.test.ts`. Do not lower it.

`--foreground` is theme-aware (cream on noir, dark ink on light themes), so the
same alpha ramp works in both modes — never hardcode a grayscale ramp.

---

## 4. Weight-bevel on light themes

On `github-light` / `macos-sonoma` the bevel is **dropped** because the white
halo around dark glyphs reads as a ghost, not weight
(`src/index.css:1537-1546`):

```css
[data-theme='github-light'] .step-row .step-title,
[data-theme='macos-sonoma'] .step-row .step-title { text-shadow: none; }
```

Hierarchy there is carried by font-size + alpha alone.

---

## 5. Keywords-only content rule

Step titles are **keyword anchors**, not sentences. The presenter narrates; the
slide shows short phrases. Multiple sub-items become colored capsules
(`05-color-and-tokens.md`), never paragraphs. Density is a defect
(coding-guidelines rule 12).

---

## Acceptance

- [ ] Titles render in Ubuntu 700; body in Inter.
- [ ] No inline `text-shadow` in any step component — bevel comes from tokens.
- [ ] Depth ramp uses size+alpha tokens; no permanent scale on titles.
- [ ] `far` alpha stays ≥ 0.55; contrast test passes on github-light.
