# 15 — CSS Recipes

Copy-paste snippets for the focus-timeline look. Every value references a token
from `src/index.css`; never inline raw hex or timing numbers into a component.

Source anchors:

- Tokens: `src/index.css` (`--gold`, `--cream`, `--step-title-active/-adjacent/-far`,
  `--dur-*`, `--ease-*`, `--brand-inset-*`)
- Consumers: `FocusTimelineSlide.tsx`, `StepTimelineSlide.tsx`

---

## 1. Connector glow (vertical rail)

```css
.timeline-rail {
  background: linear-gradient(
    to bottom,
    hsl(var(--gold) / 0.05),
    hsl(var(--gold) / 0.35),
    hsl(var(--gold) / 0.05)
  );
  box-shadow: 0 0 12px hsl(var(--gold) / 0.25);
}
```

## 2. Depth-without-scale ramp

Depth is communicated by opacity + color, not transform scale (so rows never
reflow). See `08-motion-constants.md` for the canonical values.

```css
.step-row[data-state="active"]   { color: hsl(var(--step-title-active));   opacity: 1; }
.step-row[data-state="adjacent"] { color: hsl(var(--step-title-adjacent)); opacity: 0.62; }
.step-row[data-state="far"]      { color: hsl(var(--step-title-far));      opacity: 0.55; }
.step-row {
  transition: opacity var(--dur-base) var(--ease-out),
              color var(--dur-base) var(--ease-out),
              filter var(--dur-base) var(--ease-out);
}
```

## 3. Blur ramp (background depth cue)

```css
.step-row[data-state="active"]   { filter: blur(0); }
.step-row[data-state="adjacent"] { filter: blur(1.2px); }
.step-row[data-state="far"]      { filter: blur(2.5px); }
```

## 4. Capsule tones

Always use the `.capsule-{tone}` classes — never inline `style.background`
referencing brand tokens (they flip meaning on light themes). See
`05-color-and-tokens.md`.

```css
.capsule-gold  { background: hsl(var(--gold) / 0.14);  color: hsl(var(--gold)); }
.capsule-ember { background: hsl(var(--ember) / 0.14); color: hsl(var(--ember)); }
.capsule-meta  { background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); }
```

## 5. Reduced-motion override

```css
:root[data-reduce-motion="true"] .step-row {
  transition: none;
  transform: none;
}
```
