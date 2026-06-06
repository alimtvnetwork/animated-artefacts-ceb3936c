# 11 — Color Tokens

> **Phase 9/20** · The full semantic palette. **No raw hex** in any
> component — only `hsl(var(--token))`.

## 1. Brand palette (HSL — defined in `src/index.css :root`)

| Token | HSL | Hex (reference only) | Use |
|---|---|---|---|
| `--ink` | `0 0% 5%` | `#0D0D0D` | Default plate, capsule ink fill |
| `--gold` | `40 96% 48%` | `#F3A502` | Primary accent, eyebrows, active glyphs |
| `--gold-glow` | `42 100% 65%` | soft variant | Hover/glow halo |
| `--cream` | `42 100% 94%` | `#FFF1D6` | Title text, presenter chip |
| `--white` | `0 0% 100%` | `#FFFFFF` | Active step title only |
| `--ember` | `12 80% 57%` | `#E85D3A` | Secondary accent, ember capsule |
| `--soft-coral` | `14 78% 66%` | gradient pair for ember | Capsule ember gradient end |

**Rule:** any color used in a component refers to one of these tokens
via `hsl(var(--token))` or `hsl(var(--token) / 0.NN)` for opacity.

## 2. Token → use-case mapping

| Surface | Token | Notes |
|---|---|---|
| Slide background | `--ink` | Always |
| Hero / slide title | `--cream` | Default cream variant |
| Active step title | `--white` | Pure white for max contrast |
| Eyebrow | `--gold` | Solid; never `cream` |
| Subtitle / muted body | `--cream` @ `0.85` | Opacity-driven hierarchy |
| Capsule `gold` fill | gradient `--gold` → `--gold-glow` | Ink text |
| Capsule `ember` fill | gradient `--ember` → `--soft-coral` | Ink text |
| Capsule `outline` | transparent + `--gold / 0.6` border | Cream text |
| Connector idle | `--gold / 0.20` | Vertical rail in step slide |
| Connector active | `--gold` + `0_0_8px_hsl(var(--gold)/0.6)` shadow | Active fill |
| Glow shadow | `hsl(var(--gold) / 0.45)` | `shadows.gold` in theme |

## 3. Forbidden

- Raw hex (`#FFF`, `rgb(...)`, named colors) anywhere in `.tsx` files.
- Tailwind shorthands like `text-white`, `bg-black` — use the semantic
  utility (`text-cream`, `text-title-white`, `bg-ink`).
- New tokens added without a memory note + version bump.
- Light-mode tokens — the deck is dark-only.

## 4. Title style variants (`titleStyle` JSON field)

| Value | Class | Effect |
|---|---|---|
| `cream` (default) | `text-title-cream` | Solid cream |
| `white` | `text-title-white` | Pure white (slide 02 Capabilities) |
| `gold` | `text-title-gold` | Solid gold-glow |
| `gradient` | legacy | Only when paired with `titleShimmer: true` |

## 5. Acceptance

- `grep -rEn "#[0-9a-fA-F]{3,8}" src/slides/types/ src/slides/components/`
  returns zero matches.
- Theme swap (future light theme) only requires editing `:root` HSL —
  zero component changes.
- DevTools color picker on every text element shows a token-derived
  HSL string, not a hex.

## 6. Open questions & changelog

- Open: introduce a `--accent` token distinct from `--gold` for ember-
  forward decks? Default: no — ember is the secondary.
- 2026-04-26 (v0.80.3): Phase 9 — pinned 7 tokens, mapping table, and
  the no-hex rule.
- 2026-06-06 (v1.53.0): added 3 image-derived themes (`glasswing`,
  `think-yellow`, `riseup-pro`) — all override brand triplets only and
  pin Ubuntu+Poppins fonts. Full theme catalog now lives in pack `05` §7b.
  Spec: `spec/21-slides-system/08-image-derived-themes.md`.
