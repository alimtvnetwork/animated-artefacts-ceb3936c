# 05 — Color and Tokens

This file locks the **theme-safe color contract** for step slides. The short
version:

- step slides must use **semantic tokens** from `src/index.css`
- capsules must use **`.capsule-{tone}` classes** or `.capsule-meta`
- authors must **never inline brand-token colors** for chips/capsules

Source anchors:

- Root brand + capsule tokens: `src/index.css:38-91`
- Brand inset + step title tokens: `src/index.css:186-230`
- Capsule utility classes: `src/index.css:826-912`
- Light-theme capsule overrides: `src/index.css:1053-1185`
- Canon rule: `.lovable/memory/index.md:32`, `spec/llm-guideline/10-theme-creation.md:24-34,96-101`

---

## 1. Root cause of the color bug class

The step system breaks on light themes when an implementer bypasses the capsule
classes and writes inline `background` / `color` styles from raw brand tokens,
because tokens like `--gold`, `--cream`, `--white`, and `--ink` are **repurposed
per theme** and no longer mean the same foreground/background pair.

That is why the project-wide rule is strict:

```tsx
className="capsule-gold"
className="capsule-ember"
className="capsule-cream"
className="capsule-ink"
className="capsule-outline"
className="capsule-violet"
className="capsule-rose"
className="capsule-sky"
className="capsule-meta"
```

and **never**:

```tsx
style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--cream))' }}
```

---

## 2. The capsule rule (non-negotiable)

### 2.1 Use the class, not the token math

Step-slide capsules are authored by **tone name**, not by color formula.

| Use case | Correct | Wrong |
|---|---|---|
| brand-accent pill | `.capsule-gold` | inline `background: hsl(var(--gold))` |
| warm secondary pill | `.capsule-ember` | inline `background: hsl(var(--ember))` |
| pale paper pill | `.capsule-cream` | inline `background: hsl(var(--cream))` |
| dark utility pill | `.capsule-ink` | inline `background: hsl(var(--ink))` |
| quiet ghost pill | `.capsule-outline` | inline transparent + token border recipe |
| time / duration tag | `.capsule-meta` | inline muted gray recipe |

Why: the class owns the full recipe — background, foreground, border, sheen,
glow, and light-theme overrides.

### 2.2 `.capsule-meta` is special

Time/duration labels such as `5 MIN`, `30–40 MIN`, `DAY 01` use
**`.capsule-meta`**, not a brand tone.

`src/index.css:902-912` makes it theme-safe by binding it to Radix semantic
tokens:

- background → `hsl(var(--muted))`
- text → `hsl(var(--muted-foreground))`
- border → `hsl(var(--border))`

This is the correct choice for neutral metadata because it auto-flips between
dark and light appearances.

---

## 3. Why brand tokens flip on light themes

The deck supports multiple appearances. In light themes, some brand variables are
re-mapped for contrast:

- `--white` becomes a **dark ink-like title color** in `github-light`
- `--gold-glow` becomes a **darker accent** so gold text is legible on paper
- capsule tokens such as `--capsule-cream-*`, `--capsule-ink-*`, and
  `--capsule-outline-*` are retuned completely

Examples from `src/index.css`:

| Theme block | What changes |
|---|---|
| `[data-theme='github-light']` | `--white: 210 12% 16%`, capsule cream/ink/outline tokens retuned, vibrant capsule fg reasserted to white |
| `[data-theme='paper-ink']` | `--white: 36 25% 12%`, warm-paper capsule palette, darker gold-glow for text legibility |
| `[data-theme='github-light'] .capsule-gold` | gold chip becomes a darker solid blue so white text clears AA |
| `[data-theme='paper-ink'] .capsule-gold` | gold chip reuses the darker local `--gold` token with white text |

So a token name such as `--cream` does **not** universally mean “light text on
dark background.” On a paper theme, it may be part of a background recipe or be
replaced by an ink-like value entirely.

---

## 4. Relevant step-slide tokens

These are the tokens a blind LLM must know before rebuilding the step family.

### 4.1 Brand + accent tokens

| Token | Default value | Used for |
|---|---|---|
| `--gold` | `40 88% 50%` | eyebrow accents, active rail/chip color, brand-accent capsule basis |
| `--gold-glow` | `42 100% 62%` | lighter highlight stop, glow/shimmer partner |
| `--ember` | `14 80% 57%` | warm secondary accent, ember capsule family |
| `--cream` | `42 100% 94%` | warm light text/surface ingredient on noir themes |
| `--white` | `0 0% 100%` in noir themes | literal bright title/reference token; can remap on light themes |
| `--ink` | `0 0% 9%` | dark text/contrast plate on bright capsules |

### 4.2 Layout alignment tokens

| Token | Default value | Used for |
|---|---|---|
| `--brand-inset-x` | `max(48px, 218px)` | left/right body inset aligned to the logo chrome |
| `--brand-inset-y` | `116px` | top body inset aligned to the header chrome |

Step slides must align the title block, rail, and counter chip to these inset
tokens, not custom padding values.

### 4.3 Step depth tokens

| Token | Default value | Meaning |
|---|---|---|
| `--step-title-active` | `clamp(2.93rem, 5.46vw, 4.88rem)` | active row title size |
| `--step-title-adjacent` | `clamp(1.95rem, 2.86vw, 2.6rem)` | ±1 neighbor size |
| `--step-title-far` | `clamp(1.46rem, 2.08vw, 1.95rem)` | distant row size |

These work together with `--step-opacity-active`, `--step-opacity-adjacent`, and
`--step-opacity-far` from the same token block.

### 4.4 Text-weight shadow tokens

| Token | Purpose |
|---|---|
| `--text-shadow-weight-light` | standard bevel for light text on dark surfaces |
| `--text-shadow-weight-light-strong` | stronger hero/content title bevel |
| `--text-shadow-weight-dark` | embossed dark-text treatment on light surfaces |
| `--text-shadow-weight-dark-strong` | stronger dark-text variant |

Do not inline `text-shadow` in a step slide. Use the semantic text classes that
already consume these tokens.

---

## 5. Capsule tone lookup table

Use this lookup when writing step JSON or JSX.

| Tone name | Class | Voice |
|---|---|---|
| `gold` | `.capsule-gold` | primary brand/accent |
| `ember` | `.capsule-ember` | warm secondary/accent |
| `cream` | `.capsule-cream` | pale contrast chip |
| `ink` | `.capsule-ink` | dark contrast chip |
| `outline` | `.capsule-outline` | quiet ghost/secondary chip |
| `violet` | `.capsule-violet` | vivid tertiary highlight |
| `rose` | `.capsule-rose` | vivid tertiary highlight |
| `sky` | `.capsule-sky` | vivid tertiary highlight |
| metadata only | `.capsule-meta` | neutral duration/date/status |

If a schema stores `capsule.color: "gold"`, the renderer maps that to
`.capsule-gold`. The stored value is the **tone key**, not a free-form CSS color.

---

## 6. Minimum implementation rules

- Use **semantic tokens** from `src/index.css`; never inline hex.
- Use **`.capsule-{tone}` classes** for every colored chip.
- Use **`.capsule-meta`** for neutral metadata such as time/duration.
- Treat `--gold`, `--ember`, `--cream`, `--white`, and `--ink` as
  **theme-dependent semantic roles**, not fixed literal colors.
- Align step layout from `--brand-inset-x/-y`.
- Reuse the shared step-title and text-shadow tokens; do not invent local ones.

If you violate the capsule-class rule, the step slide may look acceptable on the
default noir theme and then fail immediately on `github-light`, `paper-ink`, or
future imported themes.