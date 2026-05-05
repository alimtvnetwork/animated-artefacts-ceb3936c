# 16 — Light-Theme Capsule Contract

> **For AI authors editing slide components.** Read this BEFORE adding
> any pill / chip / capsule / tag / badge to a slide.

## 1. The one rule

> **Capsules are painted by classNames, not by inline `style.background`
> / `style.color`.** Use one of:
>
> - `.capsule-gold`
> - `.capsule-ember`
> - `.capsule-cream`
> - `.capsule-ink`
> - `.capsule-outline`
> - `.capsule-violet` / `.capsule-rose` / `.capsule-sky` (vibrant tones)
>
> Combine with the layout class `.capsule-base` (px/py/rounded/leading).

If you reach for `style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--ink))' }}`
on a chip, **stop**. That path silently breaks every light theme.

## 2. Why classNames win

The `.capsule-{tone}` system has theme-scoped overrides in
`src/index.css`:

| Theme | Selector | What it remaps |
|---|---|---|
| `paper-ink` | `[data-theme='paper-ink'] .capsule-gold` | `bg: hsl(var(--gold))` + `color: white` (instead of dark-on-dark) |
| `paper-ink` | `[data-theme='paper-ink'] .capsule-ember` | `bg: hsl(var(--ember))` + `color: white` |
| `paper-ink` | `[data-theme='paper-ink'] { --capsule-cream-bg: ... ; --capsule-cream-fg: ink }` | re-tunes cream chip to paper + ink text |
| `github-light` | same shape | mirror overrides |

Inline styles **bypass every selector above**. The slide ships looking
correct in noir, breaks in every light theme, and nobody catches it
until a presenter switches palette mid-talk.

## 3. Token collision cheat-sheet

Tokens that **change meaning** between dark themes and light themes —
NEVER reference these inside an inline style on a chip:

| Token | Dark themes | Light themes (paper-ink, github-light) |
|---|---|---|
| `--ink` | dark surface (bg) | dark text (fg) |
| `--cream` | warm-light text | **repurposed → dark ink** |
| `--white` | pure white text | **repurposed → dark ink** |
| `--gold` | bright accent (L≈48) | darkened accent (L≈30) |
| `--ember` | warm coral (L≈57) | darkened rust (L≈45) |
| `--gold-glow` | brighter accent | darker accent (text-title-gold legibility) |

Tokens **safe in inline styles** because they always mean what they say:

| Token | Always means |
|---|---|
| `--background` | the slide plate |
| `--foreground` | body text on `--background` (auto-flips per theme) |
| `--muted-foreground` | secondary body text |
| `--primary` / `--primary-foreground` | accent + its readable text |
| `--card` / `--card-foreground` | surface + its readable text |
| `--border` | hairline that's visible on both modes |

If you MUST inline a color, use `--foreground` / `--muted-foreground` /
`--primary` + `--primary-foreground` (Radix-style pairs). Never reach
into the brand tokens (`--gold`, `--ember`, `--cream`, `--ink`, `--white`)
directly from inline styles.

## 4. Decision tree (AI, run this in your head before writing the JSX)

```
Q: Am I about to write style={{ background: ... }} on a pill/chip?
├─ YES
│  ├─ Q: Does the className `.capsule-{tone}` already exist for this voice?
│  │  ├─ YES → use it. Delete the inline style. STOP.
│  │  └─ NO  → add a new `.capsule-{tone}` to index.css with paper-ink + github-light overrides. Then use the class.
│  └─ Q: Is this a non-capsule surface (header bar, card)?
│     └─ YES → use --card / --card-foreground or --background / --foreground. Never --gold/--ink/--cream/--white from inline.
└─ NO → carry on.
```

## 5. Audit grep

Run this BEFORE shipping any slide change:

```bash
rg -n "style=\{\{[^}]*hsl\(var\(--(gold|ember|cream|ink|white)" src/slides/types/
```

Zero matches expected on capsule/chip/pill/badge elements. Hits on
genuine SVG fills, ghost watermarks (numerals), or background gradients
are fine **only** if they have a documented per-theme behavior tested
under paper-ink + github-light.

## 6. Meta / time / counter chips

For the "5 MIN" / "30-40 MIN" tag pattern, use `.capsule-meta`:

```css
.capsule-meta {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  border: 1px solid hsl(var(--border));
}
```

This flips per theme automatically because `--muted` /
`--muted-foreground` / `--border` are mode-aware Radix tokens.

NEVER:
```tsx
style={{ background: 'hsl(var(--ink) / 0.55)', color: 'hsl(var(--cream) / 0.85)' }}
```
Both tokens collapse on light themes (translucent dark bg over cream =
gray, cream = ink = dark text — gray-on-gray fails AA).

## 7. Eyebrow capsules above titles

The "Sessions 1-3" pattern (single accent capsule above a panel title)
is a `.capsule-gold` (or whatever tone the spec says) — never inline.

```tsx
{activeStep?.capsule && (
  <span className={`capsule-base capsule-${activeStep.capsule.color ?? 'gold'} mb-4`}>
    {activeStep.capsule.text}
  </span>
)}
```

## 8. Tone cycling for bullet capsules

When auto-generating capsules from a `bullets[]` array, cycle the
**className tone** — never inline a color per index:

```tsx
const TONES = ['gold', 'ember', 'cream', 'outline'] as const;
// ...
labels.map((label, i) => (
  <li
    key={i}
    className={`capsule-base capsule-${TONES[i % TONES.length]}`}
  >
    {label}
  </li>
))
```

This guarantees every theme automatically tunes the cycle.

## 9. New theme checklist

When adding a future theme, the maintainer's only obligation for capsules
is to add (in `src/index.css` `[data-theme='new-id']` block):

```css
/* If light surface */
--capsule-cream-bg: ...;
--capsule-cream-fg: ...;
--capsule-cream-border: ...;
--capsule-ink-bg: ...;
--capsule-ink-fg: ...;
--capsule-ink-border: ...;
--capsule-outline-bg: ...;
--capsule-outline-fg: ...;
--capsule-outline-border: ...;

/* If --gold L < 50 (dark accent), force solid + white */
[data-theme='new-id'] .capsule-gold,
[data-theme='new-id'] .capsule-ember {
  background: hsl(var(--gold));   /* or --ember */
  color: hsl(0 0% 100%);
  border-color: hsl(var(--gold));
}
```

Zero slide-level edits needed. That's the payoff for using classNames.

## 10. Changelog

- 2026-05-05 — Born from RCA #15 (paper-ink illegible chips on slide 2).
  Locks the capsule contract for all future slides + the AI Blind-Authoring
  Guide (specs 13/14).
