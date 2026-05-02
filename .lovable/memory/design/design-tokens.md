---
name: design-tokens
description: Theme palette, title color tokens (cream/white/gold), and capsule fill rules
type: design
---

## Brand palette (HSL — defined in `src/index.css`)

- `--ink` — bg `#0D0D0D`
- `--gold` — `#f3a502` → `hsl(40 96% 48%)` (updated from `#C9A84C`)
- `--gold-glow` — soft variant for hover/glow
- `--cream` — `#fff1d6` → `hsl(42 100% 94%)` (warmer, higher contrast)
- `--white` — pure white token, exposed in Tailwind as `bg-white`/`text-white`
- `--ember` — accent `#E85D3A`

Always use `hsl(var(--token))` — never raw hex in components.

## Title styles (`titleStyle` field on slide JSON)

- `"cream"` (default) — `text-title-cream`
- `"white"` — `text-title-white`, pure white for max contrast (e.g. slide 02 Capabilities)
- `"gold"` — `text-title-gold`, solid gold-glow
- `"gradient"` — legacy; only allowed when paired with `titleShimmer: true`

## Title sizing

Always use `clamp()` + `max-w-[92vw]`. Never hard-code `text-[8rem]` etc. — that clipped "Building" on slide 1.

```tsx
style={{ fontSize: 'clamp(3rem, 12vw, 9rem)' }}
className="max-w-[92vw] ..."
```

Body wrapper must include `overflow-hidden` as a safety net.

## Capsule design (vibrant, not muted)

`gold` and `ember` capsules are filled with a brand gradient, dark ink text, glow shadow, and a thin inner-highlight — they should read as confident buttons, not subtle tags.

- `gold` — gradient gold→gold-glow, ink text, gold glow shadow
- `ember` — gradient ember→soft-coral, ink text, ember glow
- `cream` — solid cream, ink text
- `ink` — dark surface, cream text, thin gold border
- `outline` — transparent, gold-tinted hairline border (1.5px)

All capsules: Inter Semibold (`font-semibold`), `px-4 py-2`, `rounded-full`, `letter-spacing: 0.01em`.
