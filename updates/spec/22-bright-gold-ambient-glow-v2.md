# 22 — Bright-gold ambient glow v2

**Date:** 2026-05-16  
**Scope:** `src/slides/themes.ts`

## Change

The `bright-gold` theme still read brown/sepia in the slide background ambient glow, especially on slide 1. The `--gradient-noir` token was retuned again to move the visible glow band into a cleaner yellow-gold range while preserving the dark noir falloff.

| Token | Before | After |
|---|---|---|
| `--gradient-noir` | `radial-gradient(ellipse 90% 70% at 50% 0%, hsl(44 100% 26%) 0%, hsl(42 80% 14%) 30%, hsl(38 35% 7%) 70%)` | `radial-gradient(ellipse 118% 82% at 50% -8%, hsl(49 100% 44%) 0%, hsl(47 96% 30%) 22%, hsl(44 82% 17%) 46%, hsl(40 24% 7%) 76%, hsl(0 0% 4%) 100%)` |

## Intent

- Remove the brown cast from the ambient top glow
- Make the background read as unmistakably gold-lit noir
- Keep the deck premium and dark, not washed out
- Preserve `bright-gold` as the default theme

## Acceptance

1. Open `/1` with theme set to `bright-gold`
2. Inspect the top/background glow behind the hero content
3. The glow should read yellow-gold, not brown or muddy amber
4. The edges should still fall to deep noir rather than turning flat gold
