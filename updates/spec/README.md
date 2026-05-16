# /updates/spec — change log for downstream systems

This folder mirrors changes made to the live app so other tools (linters,
spec-importers, second-brain LLMs) can pick them up without re-reading the
full `spec/` tree. Each file is a self-contained delta.

| # | Title | Date |
|---|---|---|
| 01 | KeywordSlide text colors locked to white | 2026-05-03 |
| 02 | ThemeMenu compaction | 2026-05-03 |
| 03 | Session 4 GitHub link CTAs + About slide white title | 2026-05-03 |
| 04 | Session 4 Slide 09 rebuilt as LayoutSlide ("Where do we go from here?") | 2026-05-03 |
| 05 | TileSlide added to slide system + slide 5 converted | 2026-05-03 |
| 06 | LayoutSlide brand-aligned padding + compact card variant | 2026-05-03 |
| 07 | `.slide-card.is-compact` hugs content (no row stretch) | 2026-05-03 |
| 08 | Compact cards in a grid column pack together (no spread) | 2026-05-03 |
| 09 | LayoutSlide centered-content mode for short compare slides | 2026-05-03 |
| 10 | TileSlide header bottom-aligned + close to tiles, brand x-axis | 2026-05-03 |
| 11 | TileSlide horizontal padding uses `--brand-inset-x` (not `px-24`) | 2026-05-03 |
| 12 | TileSlide content block vertically CENTERED (supersedes #10 `justify-end`) | 2026-05-03 |
| 13 | **AI Blind-Authoring Guide for Slide Layouts (Part 1/N)** — 3-axis model, TileSlide/LayoutSlide canonical contract, lever map, anti-patterns | 2026-05-03 |
| 14 | **AI Blind-Authoring Guide (Part 2/N)** — compact-card + grid-track mechanics, track-vs-item truth table, "stack of receipts" model, anti-patterns | 2026-05-03 |
| 15 | **Paper & Ink contrast RCA** — slide 2 chips invisible (dark-on-dark) because StepsChain3DSlide painted capsules with inline `--gold/--ember/--cream/--ink` styles, bypassing per-theme overrides | 2026-05-05 |
| 16 | **Light-Theme Capsule Contract** — capsules MUST use `.capsule-{tone}` classNames; brand tokens change meaning between dark/light themes; `.capsule-meta` added for time/duration tags | 2026-05-05 |
| 18 | **Bright-gold +15% + theme brightness preview + live HSL readout** in ThemeMenu | 2026-05-16 |
| 19 | **Brand-hex literal audit** — vitest-enforced ban on hard-coded brand hexes under `src/slides/**`; opt-out via `// brand-hex-ok:` | 2026-05-16 |
| 20 | **Spec confidence validator** — 0–100 pre-render gate (contract / enum / field / motion-variety) wired into deck loader | 2026-05-16 |
| 21 | **Bright-gold ambient glow +20% more golden** — `--gradient-noir` retuned to `hsl(42 75% 14%) → hsl(40 30% 6%)` (was brown-on-black) | 2026-05-16 |
| 22 | **Bright-gold ambient glow v2** — `--gradient-noir` shifted into cleaner yellow-gold hues (`49/47/44`) with a wider, brighter hotspot to remove the brown cast | 2026-05-16 |

## Conventions

- One markdown per change. Numbered `NN-kebab-title.md`.
- Always include: **Scope** (files), **Change** (table or diff), **Acceptance** (how to verify in preview).
- Do NOT mutate the canonical `spec/21-slides-system/` files from here —
  this folder is a delta log, not the source of truth. When a delta has
  stabilized, fold it into the matching canonical spec and remove it
  from `/updates/spec`.
