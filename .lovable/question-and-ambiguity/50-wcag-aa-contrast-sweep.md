# 50 — WCAG 2.2 AA contrast sweep

## Status: ✅ resolved (35 → 0 contrast failures)

## What shipped
- `src/index.css` :root: switched `--capsule-violet-fg` / `--capsule-rose-fg`
  / `--capsule-sky-fg` from `0 0% 100%` (white) → `0 0% 4%` (near-black).
  White on bright violet/rose/sky gradients was failing AA across every
  dark theme (worst: sky-end 1.82:1 on noir-gold).
- Bumped `--capsule-violet-start` 62%→66% L so the inner stop also clears
  4.5:1 with the new dark fg.
- `src/index.css [data-theme='github-light']`: re-asserted
  `--capsule-{violet,rose,sky}-fg: 0 0% 100%` since github-light's
  intentionally-dark stops are designed for white text.
- `[data-theme='macos-sonoma'] .capsule-gold`: split out a darker
  L=45 solid bg variant (only for the capsule recipe) so white-on-gold
  clears AA without darkening the brand `--gold` token used on
  eyebrow / step-label / hero text.
- `src/slides/themes.ts`:
  - `vscode-dark` `--gold` 40%→50% L (ink-on-gold capsule cleared from
    3.95:1 → 5.85:1).
  - `windows-11` `--gold-glow` 42%→50% L (ink stop cleared from 4.02:1 → 6.09:1).
  - `macos-sonoma` `--ember` overridden to L=45 (white-on-ember solid
    capsule cleared from 3.33:1 → 4.74:1).
- `src/test/capsuleContrast.test.ts`:
  - Added `--surface-1/-2/-3` to NEEDED_VARS so `deref` resolves
    `--capsule-ink-bg: var(--surface-2)` (pre-existing test bug).
  - macos-sonoma branch in `recipeFor('gold')` returns the explicit
    L=45 darker stop (mirrors the new CSS override).

## Bundle / behavior impact
- Zero. Token-level color tweaks only; no JS, no markup, no layout.

## Verification
- `capsuleContrast.test.ts` — 81/81 ✓ (was 35 failing)
- `chromeContrast.test.ts` — 29/29 ✓
- `deckContrastAudit.test.ts` — 127/127 ✓ (was 3 failing on macos-sonoma
  eyebrow / step-label / cta-button after first naive --gold drop;
  resolved by splitting the CSS override).
- `stepTimelineGithubLightContrast.test.ts` — 11/11 ✓

## Remaining 15 failures in the full suite
Unrelated to a11y work:
- `brandChromeInheritance.test.ts` — 218px sweet-spot sentinel.
- `hardcodedWhiteAudit.test.ts` — separate hardcoded-color sweep.
- `stepsChain3DDepthHierarchy.test.ts` + `stepsChain3DResponsiveLayout.test.tsx`
  (8) — slide 4 layout regression on rail/marker positions.
Logged for a future `next` cycle.

## Files touched
- created `.lovable/question-and-ambiguity/50-wcag-aa-contrast-sweep.md`
- edited `src/index.css`
- edited `src/slides/themes.ts`
- edited `src/test/capsuleContrast.test.ts`
- bumped `.lovable/question-and-ambiguity/task-counter.md` → 12/40
