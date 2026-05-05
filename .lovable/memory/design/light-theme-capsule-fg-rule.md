---
name: light-theme-capsule-fg-rule
description: Capsules/chips MUST use `.capsule-{tone}` classNames; inline `style.background/color` referencing --gold/--ember/--cream/--ink/--white silently breaks light themes (paper-ink, github-light) because those tokens are repurposed
type: design
---

## Rule

**All capsules, chips, pills, tags, badges in slide components MUST be
painted via the `.capsule-{tone}` className system.** Never use inline
`style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--ink))' }}`
(or any of `--ember`, `--cream`, `--white`) on a chip element.

Available tones: `gold`, `ember`, `cream`, `ink`, `outline`, `violet`,
`rose`, `sky`. Combine with `.capsule-base` for spacing.

## Why

Brand tokens **change meaning** between dark and light themes:

| Token | Dark themes | Light (paper-ink, github-light) |
|---|---|---|
| `--ink` | dark surface | dark text (fg) |
| `--cream` | warm light text | **repurposed → dark ink** |
| `--white` | pure white | **repurposed → dark ink** |
| `--gold` | L≈48 bright accent | L≈30 darkened accent |
| `--ember` | L≈57 coral | L≈45 rust |

So `style={{ bg: hsl(var(--gold)), color: hsl(var(--ink)) }}` paints
dark-amber + dark-text on cream → invisible. The `.capsule-gold`
className has paper-ink + github-light overrides that swap to
`bg: hsl(var(--gold)) + color: white` for AA contrast. Inline styles
bypass every override.

## How to apply

```tsx
// ❌ WRONG — silently breaks paper-ink + github-light
<span style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--ink))' }}>...</span>

// ✅ RIGHT — works on every theme
<span className="capsule-base capsule-gold">...</span>

// ✅ Tone cycling
const TONES = ['gold','ember','cream','outline'] as const;
<li className={`capsule-base capsule-${TONES[i % TONES.length]}`}>...</li>
```

For meta/time tags ("5 MIN"), use `.capsule-meta` (backed by Radix
`--muted` / `--muted-foreground` / `--border` — mode-aware).

For inline styles you can't avoid, only use Radix mode-aware pairs:
`--background`/`--foreground`, `--card`/`--card-foreground`,
`--primary`/`--primary-foreground`, `--muted`/`--muted-foreground`,
`--border`. Never the brand tokens.

## Audit

```bash
rg -n "style=\{\{[^}]*hsl\(var\(--(gold|ember|cream|ink|white)" src/slides/types/
```
Expected: zero matches on capsule/chip/pill elements.

## History

- Born from RCA: `updates/spec/15-paper-ink-contrast-rca.md`
- Full contract: `updates/spec/16-light-theme-capsule-contract.md`
- 2026-05-05: User reported slide 2 chips invisible on paper-ink.
  Root cause: `StepsChain3DSlide` painted capsules with inline styles
  hardcoding `--gold/--ember/--cream/--ink`, bypassing all per-theme
  overrides. Fix: replace inline styles with `.capsule-*` classes.
