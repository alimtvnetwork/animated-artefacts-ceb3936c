# 12 — Design Tokens (one table to rule them all)

Every colour, size and class the slide-number surfaces use. Tokens are CSS
variables defined in `src/index.css`; use them via Tailwind utilities
(`text-gold`, `bg-background/35`) or `hsl(var(--token))`. **Never hardcode hex
in components** — the deck has light themes that repurpose these tokens.

## Colour tokens

| Token | Role in slide numbers | Brand value (dark) |
|-------|-----------------------|--------------------|
| `--gold` | the current/active number; active dot pill; accents | #C9A84C |
| `--background` | surface fill (with alpha + blur) | #0D0D0D |
| `--foreground` | total + inactive numbers (at reduced alpha) | cream-ish |
| `--ink` | active dot number (dark on gold pill) | dark |
| `--border` | badge pill hairline (`border-border/60`) | theme border |
| `--popover` | dot tooltip fill (`bg-popover/95`) | theme popover |
| `--chrome-fg` | controller indicator base text | chrome fg |
| `--chrome-fg-muted` | controller indicator resting text | dimmer |
| `--chrome-fg-subtle` | controller indicator `/` separator | dimmest |
| `--chrome-hover` | controller indicator hover bg | hover tint |
| `--chrome-border` | controller history pill border | chrome border |
| `--chrome-bg` | controller history pill bg | chrome bg |

> Light-theme note: `--gold`, `--cream`, `--ink` change meaning on light
> themes (paper-ink, github-light). That is exactly why we use the tokens and
> the `text-gold` / `text-ink` utilities — never inline hex.

## Alpha / opacity conventions

| Use | Value |
|-----|-------|
| Top bar pill bg | `bg-background/35` |
| Badge pill bg | `bg-background/55` |
| Dot tooltip bg | `bg-popover/95` |
| Hairline gold borders | `border-gold/20` (top bar), `border-gold/25` (keycaps, tooltip) |
| Inactive dot bg | `hsl(var(--foreground) / 0.08)` |
| Inactive dot bg (hover) | `bg-foreground/20` |
| Inactive number | `text-foreground/55` |
| Total number | `text-foreground/75` (top bar), `/70` (badge) |
| Separator `/` | `text-foreground/30` (top bar), `/35` (badge) |

## Size / spacing

| Property | Value |
|----------|-------|
| Top bar height | `h-7` (28px) |
| Top bar number size | `text-[11px]`, tracking `0.18em`, font-mono |
| Badge number size | `text-[11px]`, tracking `0.18em`, font-mono |
| Dot slot height | `h-6` (24px); width 20px inactive / **32px active** |
| Dot budget | `SLOT = 24px`; row `maxWidth = min(total*24 + 32, 720)` |
| Dot scroll threshold | `total > 28` → horizontal scroll + edge fade mask |
| Active dot number | `text-[11px]` (`text-ink`) |
| Inactive dot number | `text-[10px]` |
| Controller chip | `h-9`, `px-3`, `min-w-[64px]`, `rounded-full`, `text-sm` |
| Controller input | `w-16 h-9`, centered, `rounded-full` |

## Z-index & position

| Surface | Position | z |
|---------|----------|---|
| Top bar | `fixed top-2 left-1/2 -translate-x-1/2` | `z-30` |
| Badge | `fixed bottom-4 right-5` | `z-30` |
| Dot pagination | `fixed bottom-6 left-1/2 -translate-x-1/2` | `z-30` |
| Controller pill (host) | `fixed bottom-6 right-6` | `z-50` |

## Shared effects

- `backdrop-blur-md` on every pill surface.
- `shadow-elegant` on top bar, badge, history pill.
- Dot tooltip shadow: `shadow-[0_8px_24px_-12px_hsl(var(--gold)/0.4)]`.
- Active dot glow: `box-shadow: 0 0 12px hsl(var(--gold)/0.55), 0 0 4px hsl(var(--gold)/0.8)`.
- `lift-hover-subtle` utility on interactive chips.
- `tabular-nums` on EVERY number.
