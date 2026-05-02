---
name: house-style
description: Authoritative house style for every new slide — branding spelling, theme palette, typography, capsule rules, animation/transition pairing, controller chrome. Consult before authoring any slide JSON or component.
type: preference
---

This is the single source of truth for "the way Riseup Asia decks must look and move." It supersedes any contradictory ad-hoc decisions made during a session. When in doubt, follow this file. When this file conflicts with an older memory, this file wins (then update the older memory).

## 1. Branding (NEVER deviate)

- Brand: **Riseup Asia LLC** — exact spelling. Never "Rise Up", "RiseUp", "Riseup-Asia", or "Riseup Asia Sdn Bhd".
- Presenter: **MD ALIM UL KARIM** — all caps, exact spelling.
- No Lovable branding anywhere (no logo, favicon, meta, og tags).
- Top **BrandStrip banner is permanently disabled** — never re-add `deck.brandStrip` or per-slide `brandStrip: true`.
- The only top chrome allowed is `BrandHeader` (Riseup logo + slide counter), and only when `showBrandHeader !== false`.
- QR codes: always render via `<BrandedQR asset="<slug>" />` — designer-authored PNG, white tile + ink modules. Never red-on-black, never runtime-generated.

## 2. Theme + palette

- Default theme: **`bright-gold`** (gold `hsl(40 88% 50%)`, cream `#fff1d6`, ember `#E85D3A`, ink bg `#0D0D0D`).
- Alt theme: **`noir-gold`** (gold `#C9A84C`, cream `#F0D78C`).
- **Always use `hsl(var(--token))`** — never raw hex in components or class strings.
- Hero titles are **WHITE** on noir, never gold. Subtitles are warm cream at ~85% opacity. Always route through `titleClassFor(spec)`.
- `deck.preset: "premium"` is the implicit default — Ubuntu Bold titles, clamp sizing, auto-picked white/cream/gold.

## 3. Typography

- Titles: **Ubuntu Bold**, sized via `clamp()` + `max-w-[92vw]`. Never hard-code `text-[8rem]` — it clips long words.
- Body: **Inter** (Apple system fallback).
- Capsules: **Inter Semibold**, `px-4 py-2`, `rounded-full`, `letter-spacing: 0.01em`.
- Author the casing yourself in JSON — NO CSS `text-transform` (preserves "MD", "LLC", proper nouns).
- Use the four reusable utility classes in `src/index.css`:
  `.slide-title-display`, `.slide-title-content`, `.slide-eyebrow`, `.slide-subtitle`.

## 4. Content rules

- **Keywords-only.** Never write paragraphs. Presenter narrates; slides are visual anchors.
- ≤ 6 words per chunk (title, eyebrow, capsule label, step description).
- One concept per row. Split sentences with two ideas into two `steps[]` entries.
- Verbs in present tense. Strip filler ("we help our clients to discover" → "Discover").
- No trailing punctuation on capsule labels or eyebrows.

## 5. Capsules

Vibrant filled buttons, not muted tags:

- `gold` — gradient gold→gold-glow, ink text, gold glow shadow (primary).
- `ember` — gradient ember→soft-coral, ink text, ember glow (accent).
- `cream` — solid cream, ink text (quiet).
- `ink` — dark surface, cream text, thin gold border (quiet).
- `outline` — transparent, gold-tinted hairline border (quiet).

Default: `gold` for primary capsules, `outline` for neutral lists.

## 6. Hover language (LOCKED)

- Use only `.lift-hover` (capsules/CTAs) and `.lift-hover-subtle` (chrome/buttons).
- Both are translateY + soft drop shadow only — defined in `src/index.css`.
- **NEVER** invent new hover effects. **NEVER** use scale/zoom hovers (rejected deck-wide).

## 7. Animations + transitions

- Variety required across the deck. Always run the variety guard against neighbors N-1 and N+1.
- `SlideTransition` enum: `FadeIn`, `SlideIn`, `PushIn`, `PushLeft`, `PushRight`.
- `TextAnimation` enum: `Bounce`, `FadeIn`, `SlideUp`, `Stagger`.
- Allowed pairings + collision rules live in `spec/slides/llm/24-collision-matrix.md` — consult before authoring.
- Respect `prefers-reduced-motion` — Framer's `MotionConfig reducedMotion="user"` is the global default.
- Never invent new transition or text-animation names — extend the enum + matrix instead.
- Sound on a slide is **opt-in** (`sound.on: true`). Default off. Use the existing `whoosh` / `click` / `pop` cues only.

## 8. Controller chrome

- Position: **bottom-right** (`fixed bottom-6 right-6`).
- Collapsed by default: `← →` two-button pill (~96×48), ~55% opacity.
- Hover or recent mousemove (2.2s) → expand to full pill: prev / N/total / next / grid / presenter / manifest / share / fullscreen.
- Slide-number tooltip is **center-aligned** above the indicator.
- Fullscreen button shows `<kbd>F</kbd>` in its tooltip; `F` toggles fullscreen globally (guarded against form inputs).
- Always mounted; only opacity/scale animate.

## 9. Layout contract

- All slides render at 1920×1080 and scale via `transform: scale(min(scaleX, scaleY))`.
- `BrandHeader` is `h-24`. Body padding `pt-32 pb-20` so titles never collide with the logo.
- Logo size `h-16`. Brand inset = `--brand-inset-x` (`clamp(48px, 15vw, 288px)`); never bypass it.
- Ambient background default: `drift` icon scatter + radial glow.

## 10. Spec-first authoring flow

For every new slide, emit three artifacts atomically:

1. `spec/slides/{deck}/NN-name.json` — runtime source of truth.
2. `spec/slides/{deck}/NN-name.md` — one paragraph of design intent.
3. Patched `spec/slides/{deck}/deck.json` — append to the `slides` array.

Then bump `package.json` patch version and append a `readme.md` milestone block (`let's start now {date} {time}` + `vX.Y.Z — summary` + file list, Malaysia UTC+8).

## 11. Where to look first

- `spec/slides/llm/15-authoring-template.md` — minimal slide template.
- `spec/slides/llm/16-voice-to-slide-protocol.md` — the 6-question intake.
- `spec/slides/llm/24-collision-matrix.md` — transition × textAnimation rules.
- `spec/slides/llm/18-acceptance-checklist.md` — pre-merge checklist.
- `mem://design/design-tokens` — palette + capsule fill specifics.
- `mem://features/deck-preset` — premium preset behavior.
