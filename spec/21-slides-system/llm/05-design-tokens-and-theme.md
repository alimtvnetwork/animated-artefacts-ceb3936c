# 05 — Design Tokens & Theme

Replaces — for new builds — spec 07 + the design rules scattered
across specs 03 / 15 / 17. Single source.

---

## 1. The "no hex" rule (#1 violation in code reviews)

**NEVER write a hex value in a component.** Always go through CSS
variables defined in `src/index.css` and consumed via Tailwind's
`hsl(var(--token))` pattern.

Why: the deck supports live theme switching (Noir & Gold ↔ Bright
Gold). A hard-coded `#C9A84C` silently breaks the swap.

```tsx
// ❌ Wrong
<div className="text-[#C9A84C]">Discovery</div>
<div style={{ color: '#C9A84C' }}>Discovery</div>

// ✅ Right
<div className="text-gold">Discovery</div>
<div style={{ color: 'hsl(var(--gold))' }}>Discovery</div>
```

The only exception: the StepTimeline ambient layer's per-icon
**brand** colors (`#007ACC` for VS Code blue, `#F24E1E` for Figma
orange, etc.). Those are *literal* third-party brand colors, not deck
design tokens — they don't theme-swap.

---

## 2. Token table (Noir & Gold theme)

| Token | HSL | Hex (reference only) | Use it for |
|-------|-----|----------------------|------------|
| `--background`         | `0 0% 5%`        | `#0D0D0D` | Slide stage background |
| `--foreground`         | `0 0% 100%`      | `#FFFFFF` | Default text |
| `--gold`               | `45 56% 54%`     | `#C9A84C` | Primary accent — eyebrows, capsules, connectors |
| `--gold-glow`          | `45 73% 67%`     | `#E8C77E` | Hover / glow / shimmer overlay |
| `--cream`              | `42 79% 75%`     | `#F0D78C` | Title default (`titleStyle: "cream"`) |
| `--ember`              | `13 79% 56%`     | `#E85D3A` | Secondary accent (max 1 ember per slide) |
| `--ink`                | `0 0% 8%`        | `#141414` | Capsule text on cream/gold fills |
| `--primary`            | aliases `--gold` | — | Used by shadcn buttons |
| `--ring`               | aliases `--gold` | — | Focus rings |
| `--border`             | `0 0% 18%`       | `#2E2E2E` | Hairline dividers |
| `--muted-foreground`   | `0 0% 65%`       | `#A6A6A6` | Secondary text |
| `--gradient-noir`      | `linear-gradient(180deg, #0D0D0D, #1A1A1A)` | — | Brand strip gradient |
| `--gradient-text-gold` | `linear-gradient(135deg, #C9A84C, #F0D78C)` | — | Legacy — avoid for new slides |

Bright Gold theme overrides only the brand triplets:

| Token | Noir & Gold | Bright Gold |
|-------|-------------|-------------|
| `--gold`      | `#C9A84C` | `#F3A502` |
| `--gold-glow` | `#E8C77E` | `#FFC547` |
| `--cream`     | `#F0D78C` | `#FFF1D6` |

Everything else (background, ember, foreground, typography) is shared.

---

## 3. Typography

| Family | Usage |
|--------|-------|
| **Ubuntu Bold** (`font-display`)  | Slide titles, step row titles (per spec 36 — supersedes Poppins), all hero text |
| **Inter** (`font-sans`)            | Body, subtitles, descriptions, capsule labels (Inter Medium), UI |
| Apple system (`-apple-system, BlinkMacSystemFont`) | Fallback chain for both |

Loaded via Google Fonts in `index.html` — no self-hosting in v0.x.

### Title size ramp (deck-wide preset)

When `deck.preset === 'premium'` (the showcase deck), titles use a
clamp-based ramp from `src/slides/preset.ts`:

```css
font-size: clamp(2.75rem, 4.5vw, 5.5rem);  /* h1 / TitleSlide */
font-size: clamp(2rem,   3.5vw, 4rem);      /* h2 / slide title */
```

### Step row title ramp (StepTimeline)

```
text-3xl md:text-4xl xl:text-5xl    /* clamp-equivalent */
leading: 1.05
```

---

## 4. Capsule colors

| Color   | Token       | Best for |
|---------|-------------|----------|
| `gold`     | `--gold`     | Time-box ("Week 1") |
| `ember`    | `--ember`    | Critical / urgent / hero call-out (max 1/slide) |
| `cream`    | `--cream`    | Soft accent |
| `ink`      | `--ink`      | High-contrast on light surfaces (rare on noir) |
| `outline`  | `--gold`     | Stroke-only, transparent fill |
| `violet`   | (v0.25)     | Variety on multi-capsule slides |
| `teal`     | (v0.25)     | Variety on multi-capsule slides |
| `rose`     | (v0.25)     | Variety on multi-capsule slides |
| `sky`      | (v0.25)     | Variety on multi-capsule slides |

Implementation in `src/slides/components/Capsule.tsx`. Hover plays a
label-flip if `hoverText` is set (see spec 22). Click can either
navigate (`clickRevealSlide`) or expand into a card on the same slide
(`expand` payload).

---

## 5. Spacing scale (1920×1080 stage)

| Token | px | Use it for |
|-------|----|-----------|
| `--slide-safe-inset` | 80  | Safe area on every edge |
| `--slide-content-max-width` | 1440 | Centered content cap |
| Margins (left / right) | 240 | Symmetric — `(1920-1440)/2` |
| Header zone | 80–260 | top: 80, height: 180 |
| Body zone   | 300–860 | height: 560 |
| Footer zone | 900–1000 | dots row |

---

## 6. Animation tokens

| Token / constant | Value | Use it for |
|------------------|-------|-----------|
| `--transition-smooth` | `cubic-bezier(0.22, 1, 0.36, 1)` (out-expo) | Stage transitions |
| Step expo-out         | `cubic-bezier(0.19, 1, 0.22, 1)` (longer tail) | Step active fade |
| `STEP_INTERVAL_MS`    | 2200 | Autoplay tick |
| `PAUSE_MS`            | 6000 | Manual-interaction pause window |
| `READY_WAIT_MS`       | 800  | Sound asset ready timeout |
| Whoosh attack         | 0.06 s | Sound runtime envelope |
| Whoosh release        | 0.12 s | Sound runtime envelope |
| Title cascade gap     | 0.09 s | Capsule per-index delay |

---

## 7. Reduced motion

Set globally in `src/index.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Slides MUST also branch via `useReducedMotion()` from framer-motion to
swap their variants (the global rule alone doesn't kill spring physics).
Pattern:

```ts
const reduced = useReducedMotion();
const variants = reduced ? reducedVariants : fullVariants;
```

---

## 8. How to add a new theme

1. Append to `THEMES` in `src/slides/themes.ts`:
   ```ts
   {
     id: 'midnight-emerald',
     label: 'Midnight Emerald',
     gold: '156 60% 50%',
     goldGlow: '156 70% 65%',
     cream: '60 40% 88%',
   }
   ```
2. Add `'midnight-emerald'` to the `theme` enum in
   `spec/slides/deck.schema.json`.
3. Update this file (token table).
4. Render swatches into `spec/slides/llm/assets/themes/{id}.png` if
   you have time.
5. Bump version (minor — new theme).
