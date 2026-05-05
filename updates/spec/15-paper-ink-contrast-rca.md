# 15 — Paper & Ink Theme Contrast RCA

> **Date:** 2026-05-05
> **Theme:** `paper-ink` (light, warm cream)
> **Reported on:** Slide `/2` (StepsChain3DSlide), but applies to ANY slide
> using inline-style capsules / meta chips.
> **Severity:** High — content was effectively invisible.

## 1. What the user saw

On slide 2 under the **Paper & Ink** theme:

| Element | Visual symptom | Hidden cause |
|---|---|---|
| Eyebrow capsule "Sessions 1-3" | dark amber chip with dark amber text — looks like a single brown blob | bg & text both dark on light bg |
| Bullet capsule "Spec, audit, gap analysis" (gold tone) | same — dark on dark | inline style fills with `--gold` (L=30%) AND text `--ink` (L=12%) |
| Bullet capsule "Lovable + GitHub link" (ember tone) | dark rust chip with dark text | inline style fills with `--ember` (L=45%) AND text `--ink` (L=12%) |
| Bullet capsule "Workspace transfer" (cream tone) | renders as a **solid black pill** with no text | inline style fills with `--cream`, BUT in paper-ink `--cream` is REPURPOSED to ink (L=12%) — so bg is dark AND text is also `--ink` |
| Meta chip "5 MIN" | dark gray on lighter gray, low contrast | inline style: bg `hsl(var(--ink) / 0.55)`, text `hsl(var(--cream) / 0.85)` — both tokens collapse to dark on light theme |

Net effect: 4 out of 5 description chips are illegible.

## 2. Root cause

`src/slides/types/StepsChain3DSlide.tsx` paints capsules with **inline
`style={{ background, color, border }}` props that hardcode CSS-token
references** instead of using the `.capsule-{tone}` className system.

The capsule className system (`src/index.css` lines 826-866) already has
**per-theme overrides** for paper-ink (lines 1078-1114) and github-light
that:

- Re-tune `--capsule-cream-bg` / `--capsule-cream-fg` for light surfaces.
- Switch `.capsule-gold` / `.capsule-ember` to `bg: var(--gold/ember)` +
  `color: white` so contrast stays ≥ 4.5:1 on cream.
- Re-tune outline + ink chips.

The inline-style path **bypasses every one of those overrides**. The slide
re-implements the capsule recipe from the dark-noir era and never gets
re-tuned when the theme switches.

### Token collisions on light themes

The deeper trap that makes inline styles dangerous on light themes:

| Token | Noir meaning | Paper-Ink meaning |
|---|---|---|
| `--ink` | dark plate (bg) | dark text (fg) |
| `--cream` | warm light text | **REPURPOSED as dark ink** (so existing components keep working) |
| `--gold` | bright amber (L=48) | darkened amber (L=30) for AA on cream |
| `--ember` | warm coral (L=57) | darkened rust (L=45) |
| `--white` | pure white | **REPURPOSED as dark ink** |

A line like `color: hsl(var(--cream))` reads as "warm-light text" to a
developer reasoning on noir, but actually paints **dark text** on
paper-ink. Pair it with `bg: hsl(var(--ink) / 0.55)` (translucent dark)
on a cream backdrop and you get gray-on-gray.

**Lesson:** inline-style capsules are a contrast time-bomb. Every new
theme needs a per-selector override to fix them, and the override surface
keeps growing.

## 3. The fix (code)

Replace the three inline-style call sites in
`src/slides/types/StepsChain3DSlide.tsx` with the canonical
`.capsule-{tone}` classNames:

| Site | Before (inline) | After (className) |
|---|---|---|
| Eyebrow capsule (line 1768-1778) | `style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--ink))' }}` | `className="capsule-base capsule-gold"` |
| Bullet capsules `toneStyle()` (lines 1801-1813) | inline switch returning hardcoded bg/fg per tone | `className={`capsule-base capsule-${tone}`}` |
| Meta chip (lines 1842-1854) | inline `bg: hsl(var(--ink)/0.55)`, `color: hsl(var(--cream)/0.85)` | use `.capsule-meta` utility (new) backed by `--meta-bg` / `--meta-fg` tokens that flip per theme |

Animation styles (`animation`, `animationDelay`) stay inline — only the
**color contract** moves to CSS.

## 4. The fix (theming contract)

A new memory rule + spec section establishes the **light-theme capsule
contract**:

> **Capsules MUST be painted via the `.capsule-{tone}` className system.**
> Inline `style.background` / `style.color` on a capsule is **forbidden**
> because it bypasses per-theme overrides and breaks contrast on every
> light theme (paper-ink, github-light) silently.

See: `updates/spec/16-light-theme-capsule-contract.md` and
`mem://design/light-theme-capsule-fg-rule`.

## 5. Acceptance

- [x] Slide 2 in paper-ink: every chip ≥ 4.5:1 contrast against the
      cream backdrop.
- [x] Slide 2 in noir-gold: visual unchanged (regression check).
- [x] No raw `hsl(var(--gold))` / `hsl(var(--ember))` / `hsl(var(--cream))`
      / `hsl(var(--ink))` in `style.background` or `style.color` of any
      capsule element in `StepsChain3DSlide.tsx`.

## 6. Anti-patterns banned

| Anti-pattern | Why it fails | Use instead |
|---|---|---|
| `style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--ink))' }}` on a chip | dark-on-dark on paper-ink (gold L=30 + ink L=12) | `className="capsule-gold"` (per-theme override flips text to white) |
| `style={{ color: 'hsl(var(--cream))' }}` on light bg | `--cream` is repurposed as ink in paper-ink/github-light → dark text on light bg looks fine BUT pairing with translucent dark bg makes gray-on-gray | use `--foreground` for body text, `.capsule-*` for chips |
| `style={{ background: 'hsl(var(--ink) / 0.55)' }}` on light bg | translucent dark over cream = dim gray, fails AA | use a dedicated `.capsule-meta` class that flips per theme |
| Adding a NEW per-theme override every time a slide ships with inline capsule styles | override surface grows without bound | refactor the slide to use the className system once |

## 7. Why the original inline path existed

Historical: `StepsChain3DSlide` was built when only the noir theme existed
and the capsule className recipes lived in a different file. The author
inlined `--gold` / `--ink` references for "isolation" from a refactor in
flight. After 8 themes shipped, the inlining became a liability nobody
revisited because the noir preview always looked correct.

## 8. References

- `src/index.css` lines 826-866 — base capsule classes
- `src/index.css` lines 1028-1102 — light-theme capsule overrides
- `src/index.css` lines 1134-1157 — solid-fill `.capsule-gold` / `.capsule-ember` overrides
- `mem://design/light-theme-capsule-fg-rule` (new)
- `updates/spec/16-light-theme-capsule-contract.md` (new)
