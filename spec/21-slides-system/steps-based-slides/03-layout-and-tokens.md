# 03 — Layout, Geometry & Tokens

All step-based slides render inside the fixed **1920×1080** stage and are scaled
to fit (see the slides-app scaling rules). Use the tokens below; never hardcode
pixel insets that should track the brand axis.

## Spacing tokens (from `src/index.css`)

| Token | Value | Use |
|-------|-------|-----|
| `--brand-inset-x` | `max(48px, 218px)` | Left & right padding for header, list, capsules. Aligns with brand logo. |
| `--brand-inset-y` | `116px` | Top padding. Bottom padding = `calc(var(--brand-inset-y) * 0.6)`. |

Reading every horizontal edge from `--brand-inset-x` is what keeps the index
gutter, the title, and the trailing capsule on one shared vertical axis. Do not
substitute `px-24` or arbitrary values.

## Index gutter geometry

- Grid column 1 width: **88px**.
- Vertical hairline x-position: **40px** (≈ center of the 88px gutter), width 1px.
- Index font size: `clamp(2.4rem, 4.4vw, 3.8rem)`, `tabular-nums`, `font-display`.

## Row geometry

- Rows: CSS grid `gridTemplateColumns: '88px 1fr auto'`, `gap-6`, `items-center`.
- Vertical rhythm between rows: `gap-6` on the `<ol>`; per-row `padding: 12px 0`.
- Separators: `1px solid hsl(var(--gold)/0.10)` bottom on every row, top only on
  the first.

## Typography (semantic classes — never raw `text-*` for slide copy)

| Region | Class | Size |
|--------|-------|------|
| Eyebrow | `.slide-eyebrow` (+ `text-xs tracking-[0.4em] uppercase`) | small, tracked |
| Title | `.slide-title-content` + `titleClassFor(spec)` color | from token scale |
| Item title | `.step-title` (`font-display`) | `clamp(1.75rem, 2.6vw, 2.4rem)` |
| Item subtitle | (theme-safe white) | `clamp(1rem, 1.15vw, 1.15rem)` |
| Meta tag | `.capsule-meta` | inherits |

The weight-shadow bevel is auto-applied to `.slide-title-display`,
`.slide-eyebrow`, `.step-title`, etc. via `--text-shadow-weight-*`. **Never**
write inline `text-shadow` on these.

## Color tokens

| Purpose | Token | Note |
|---------|-------|------|
| Active accent | `hsl(var(--gold))` | full gold for active index + glow |
| Inactive index | `hsl(var(--gold)/0.55)` | dimmed |
| Hairline / separators | `hsl(var(--gold)/0.10–0.18)` | |
| Item title text | `hsl(var(--white))` | flips to ink on light themes |
| Subtitle / kicker | `hsl(var(--white)/0.55–0.60)` | use bracket syntax, not `text-white/xx` |

### Capsule tones (defined as `--capsule-{tone}-{bg,fg,border}`)

`gold`, `ember`, `cream`, `ink` (+ any others in `src/index.css`). The
`<Capsule>` component maps `color` → `.capsule-{tone}`. These auto-flip per
theme. **The single most important rule in this folder:** capsules and meta
tags must use these classes, never inline brand-token styles.

## Light-theme trap (why the bracket syntax)

On light themes (`paper-ink`, `github-light`) the brand tokens `--white`,
`--cream` are repurposed to *dark ink*, and `--gold`/`--ember` darken. So:

- `text-white` (Tailwind literal) → stays pure white → invisible on light bg. ❌
- `text-[hsl(var(--white)/0.6)]` → resolves the token → becomes dark ink on
  light themes → legible everywhere. ✅
- Inline `style={{ background: 'hsl(var(--gold))' }}` chip → may collapse to
  dark-on-dark. ❌ → use `.capsule-gold`. ✅
