# 03 — Animation Rules

Animation is a **deck-wide design language**, not a per-slide decoration.
These rules keep the deck feeling premium and intentional rather than busy.

## 1. No always-on gradients

- **Solid colors are the default** for titles, step pills, capsules, connectors.
- The `--gradient-text-gold` token still exists for legacy use but should not
  appear on new slides.
- A single accent (gold or ember) carries the eye — additional contrast comes
  from capsule colors, not from layered gradients.

## 2. If you use a gradient, put motion on top

Gradients are allowed **only when they animate**. Static gradients read as
decoration; moving highlights read as craft.

The supported pattern is the `shimmer-sweep` utility (defined in `index.css`):
a single-pass diagonal highlight that slides across the element on entrance.
Enable it on a slide via `"titleShimmer": true` in the slide JSON.

```css
.shimmer-sweep::after {
  background: linear-gradient(115deg, transparent 30%, hsl(var(--gold-glow) / 0.35) 50%, transparent 70%);
  animation: shimmer-slide 1.6s var(--transition-smooth) 0.4s 1 forwards;
}
```

Other moving accents (e.g. a glow that pulses once, a connector line that
draws itself) are also fine. The rule is: **motion must be one-shot on
entrance, not looping**, so the slide settles into a calm steady state.

## 3. Variety across slides

A deck should feel composed. Avoid:

- The same `transition` on three consecutive slides.
- The same `textAnimation` on every slide.
- Identical capsule colors filling an entire slide.

Use the enums to rotate:

| Enum             | Values                                              |
|------------------|-----------------------------------------------------|
| `transition`     | `FadeIn`, `SlideIn`, `PushIn`, `PushLeft`, `PushRight` |
| `textAnimation`  | `Bounce`, `FadeIn`, `SlideUp`, `Stagger`            |

## 3a. Per-block animation presets

The slide-level `textAnimation` sets the default for every text block. To make
one element pop without redesigning the slide, drop a `content.animations`
object on it. Keys target the content blocks; values are preset names.

```json
"content": {
  "title": "Building Asia's\nNext Wave",
  "subtitle": "Strategy · Design · Growth",
  "animations": {
    "title": "pushLeft",
    "subtitle": "fadeIn"
  }
}
```

| Preset         | Visual character                                              |
|----------------|---------------------------------------------------------------|
| `fadeIn`       | Soft fade with a tiny upward drift. Safe default.             |
| `slideUp`      | Larger upward slide. Good for headlines.                      |
| `slideInLeft`  | Enters from the left edge.                                    |
| `slideInRight` | Enters from the right edge.                                   |
| `pushLeft`     | Stronger left push — like a slide transition for one block.   |
| `pushRight`    | Stronger right push.                                          |
| `bounce`       | Springy scale-in. Use on a single hero element only.          |
| `stagger`      | Same as `fadeIn` but spaces sibling children further apart.   |
| `none`         | No animation — element appears instantly. Use sparingly.      |

Targetable blocks: `eyebrow`, `title`, `subtitle`, `keywords`, `capsules`,
`steps`. Anything not listed in `animations` falls back to the slide-level
default.

## 4. Title color tokens

Set per slide via `titleStyle`:

| Value      | Token / Class           | When to use |
|------------|-------------------------|-------------|
| `cream`    | `text-title-cream`      | Default. Maximum legibility on noir background. |
| `gold`     | `text-title-gold`       | When the slide's content is the brand itself or a moment of emphasis. |
| `gradient` | `text-gold-gradient`    | Legacy. Pair with `titleShimmer: true` if used. |

## 5. Reduced motion

`prefers-reduced-motion: reduce` collapses all animation/transition durations
to ~0ms (set globally in `index.css`). Slides should still be **fully
readable and navigable** with no animation — never put critical information
behind a delayed reveal.

## 6. Authoring checklist

When adding a new slide, set:

```json
"transition": "<one of the enum values>",
"textAnimation": "<one of the enum values>",
"titleStyle": "cream",
"titleShimmer": true,
"enabled": true
```

Then double-check the surrounding slides in `deck.json` to make sure you're
not repeating the same `transition` three times in a row.
