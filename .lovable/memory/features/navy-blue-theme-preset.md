---
name: Navy-blue theme preset
description: navy-blue ThemePreset extras — capsule remap, cyan→orange gradients, 5-stop chart palette, optional Poppins/JetBrains Mono fonts; house style stays the default
type: design
---

# Navy-blue theme preset (v0.178)

The `'navy-blue'` entry in `src/slides/themes.ts` is the only theme that overrides anything beyond the core var set. Other themes intentionally stay minimal — the global `:root` defaults from `index.css` apply.

## What navy-blue ships
- **Brand vars** — cyan `#06b6d4` mapped onto `--gold` (the "primary accent" slot in our token contract), orange `#f59e0b` onto `--ember`, deep navy `222 35% 12%` background, slate cream `210 40% 96%` foreground.
- **Gradients** — `--gradient-noir` retuned to a navy radial; `--gradient-gold` becomes cyan→orange linear; `--gradient-text-gold` becomes cyan-glow→cyan→orange. Any `.text-gradient-gold` headline or `var(--gradient-gold)` accent retunes natively.
- **Capsules** — every `--capsule-{gold,ember,cream,ink,outline}-{bg,fg,border}` remapped to navy-tuned colors so `.capsule-gold` reads cyan-on-navy, `.capsule-ember` reads warm-amber-on-navy, etc.
- **Chart palette** — `--chart-1..5` overridden to cyan / orange / sky / violet / mint. `:root` defaults (in `index.css`) are gold / ember / cream / teal / violet.
- **Fonts (opt-in)** — Poppins body + JetBrains Mono code; display stays Ubuntu so house-style display rhythm holds. Other themes omit `fonts` entirely → global Ubuntu/Inter defaults.

## Rules
- Never inline navy hex into a component — always go through the CSS vars (`hsl(var(--gold))`, `hsl(var(--chart-2))`, `var(--gradient-gold)`, `.capsule-ember`).
- House style is the **default**. Any new per-theme overrides (capsules, gradients, charts, fonts) MUST be opt-in on the preset object — never lifted to `:root` in `index.css` for a single theme.
- When adding a future theme that needs custom capsules/gradients/charts, mirror the navy-blue shape (vars + optional fonts). Don't add new var names — reuse the established `--capsule-*` / `--chart-*` token surface.
