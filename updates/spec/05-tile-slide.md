# Update — TileSlide added to slide system

**Date**: 2026-05-03
**Scope**:
- `src/slides/enums.ts` — `TileSlide` added to `SlideType` enum.
- `src/slides/types.ts` — `TileSpec` interface + `tiles` / `tilesCaption` on `SlideContent`.
- `src/slides/contracts.ts` — `Tile` + `TileContent` zod schemas, `REQUIRED_FIELDS`, `SLIDE_CONTENT_CONTRACTS`, `SlideContract` discriminated union.
- `src/slides/types/TileSlide.tsx` — renderer.
- `src/slides/SlideStage.tsx` — switch case.
- `src/builder/fieldSchemas.ts` — `TileSlide` editor entry + defaults.
- `src/index.css` — `.tile-card`, `.tile-card__glow` tokens, hover lift, reduced-motion guard.
- `front-end/project/session-4-ai-coding/data/slides/05-ship-today.json` — slide 5 converted from `CapsuleListSlide` → `TileSlide`.

## Anatomy

```
┌─ EYEBROW (uppercase, gold)
│  Big Headline (Ubuntu Bold, white/cream)
│
│   ┌──────────┐  ┌──────────┐  ┌──────────┐
│   │  GLYPH   │  │  GLYPH   │  │  GLYPH   │
│   │  Title   │  │  Title   │  │  Title   │
│   │  TAG     │  │  TAG     │  │  TAG     │
│   │  desc    │  │  desc    │  │  desc    │
│   │  link →  │  │  link →  │  │  link →  │
│   └──────────┘  └──────────┘  └──────────┘
│
│           small italic caption
└─
```

## Data shape

```ts
interface TileSpec {
  name: string;     // "Alarm CLI"
  tag?: string;     // "alarm-app-v3"  → mono, gold/70, tracked
  desc?: string;    // 1–2 short sentences
  url?: string;     // external — opens in new tab
  glyph?: string;   // single emoji or 1–2 char icon
  cta?: string;     // CTA label (default: "View on GitHub")
}

content: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tiles: TileSpec[];          // 2–4 items (zod-enforced)
  tilesCaption?: string;
}
```

## Layout

- 2 tiles → `grid-cols-2`
- 3 tiles → `grid-cols-3`
- 4 tiles → `grid-cols-4`
- Grid wrapper: `flex-1 content-center` (vertically centered between header + caption).
- Each card stagger-enters with `delay = i * 0.15s`.

## Color tokens (NEVER hardcode)

| Element | Token |
|---|---|
| Card surface | `linear-gradient(135deg, hsl(--card), hsl(--background))` |
| Border idle | `hsl(--gold / 0.20)` |
| Border hover | `hsl(--gold / 0.60)` |
| Glow blob | `hsl(--gold / 0.05 → 0.18)` (700ms transition) |
| Title | `text-foreground` |
| Tag | `text-gold/70 font-mono` |
| Desc | `text-foreground/65` |
| CTA + arrow | `text-gold` |
| Drop shadow | `0 30px 80px -20px hsl(0 0% 0% / 0.85)` |

## Animations

| Where | Effect |
|---|---|
| Card entry | `opacity 0→1`, `y 24→0`, easing `[0.22,1,0.36,1]`, `delay i*0.15s` |
| Card hover | `translateY(-8px)`, border brightens, glow intensifies |
| Glyph hover | `scale(1.1) rotate(6deg)` over 500ms |
| CTA hover | `gap` widens 2→4 (arrow slides right) |
| Caption | fade in 0.5s @ delay 0.7s |
| `prefers-reduced-motion` | All transitions disabled, no transform |

## House rules

- 2–4 tiles per row only (zod max 4). For more, split into two slides.
- Description ≤ 90 chars per tile.
- One emoji glyph per tile (visual anchor).
- Always include `target="_blank" rel="noopener noreferrer"` — handled automatically by the renderer when `url` is provided.
- Always use semantic tokens; never raw hex.
- `<Slide>` background inherited — slide does NOT paint its own bg.

## Acceptance

- `/session-4-ai-coding/5` renders three cards (Alarm / Movie / Gitmap) matching the reference mock.
- Hover any card → lifts 8px, border + glow brighten, arrow slides.
- Click any card → opens GitHub repo in new tab.
- Theme switch repaints card surface + tag + CTA via tokens.
- Reduced-motion → cards appear instantly, no transforms.

## Authoring template

```json
{
  "slideType": "TileSlide",
  "transition": "SlideIn",
  "textAnimation": "Stagger",
  "titleStyle": "white",
  "content": {
    "eyebrow": "Today's goal",
    "title": "Headline goes here.",
    "tiles": [
      { "name": "…", "tag": "…", "desc": "…", "url": "https://…", "glyph": "✨" }
    ],
    "tilesCaption": "Click any tile to open."
  }
}
```
