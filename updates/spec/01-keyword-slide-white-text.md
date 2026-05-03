# Update — KeywordSlide text colors locked to white

**Date**: 2026-05-03
**Scope**: `src/slides/types/KeywordSlide.tsx`
**Theme impact**: All themes (Noir & Gold, Navy Blue, future palettes)

## Change

Both the **middle title** AND the **keyword row** on `KeywordSlide` are
now hard-locked to white, regardless of the active theme.

| Element | Before | After |
|---|---|---|
| `c.title` (middle headline, e.g. "Bad becomes master") | `text-white/75` | `text-white/75` (unchanged — already white) |
| `c.keywords` (e.g. "Try  Ask  Repeat") | `titleClassFor(spec)` → gold/cream/gradient depending on theme + `titleStyle` | `text-white` (locked, every theme) |

Capsules below the keywords still carry the brand accent (gold/ember/etc.) — they remain the only colored element in the lower stack so the slide reads as: muted eyebrow → white title → white keywords → colored capsule labels.

## Rationale

User-confirmed pattern across themes: the middle text + keyword row should be a calm white anchor. Color belongs on capsules (small, contained) and on the eyebrow (gold), not on the largest typographic element in the slide. This prevents the slide from looking "tinted" under any theme and keeps the keywords legible on dark plates.

## Code

```tsx
// src/slides/types/KeywordSlide.tsx
<motion.span
  key={i}
  variants={keywordsV}
  className="font-display text-white"
  style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', lineHeight: 1 }}
>
  {k}
</motion.span>
```

`titleClassFor(spec)` is no longer called for keyword rendering; `titleStyle` on KeywordSlide JSON is now ignored for the keyword row (still respected for the middle title via the existing `text-white/75` rule).

## Authoring impact

- `titleStyle: "gold" | "cream" | "white" | "gradient"` on a KeywordSlide JSON has **no visible effect** on the keyword row anymore. Authors can leave it as-is — the field is harmless but dead for keywords.
- Capsules are now the **only** color carrier on a KeywordSlide. Use `gold` / `ember` capsule colors to signal hierarchy.

## Related prior updates (recap)

- ThemeMenu compacted (`w-64`, `p-1.5`, `text-[12px]`/`text-[10.5px]`, smaller swatches and icons) so theme labels stop overflowing.
- Middle title (`c.title`) was already locked to `text-white/75` in the previous patch — this update extends the same rule to the keyword row.

## Acceptance

- Switch theme on slide 4 (`/4`) — keyword row stays white in every palette.
- `grep` `titleClassFor` in `KeywordSlide.tsx` returns zero matches.
- Capsules below keywords still render in their declared `color`.
