# 17 — Common Mistakes

Anti-patterns observed (or anticipated) in focus-timeline work, each with the
rule it violates and the correct move. If a review hits one of these, fix it
before merging.

Source anchors:

- Component: `src/slides/types/FocusTimelineSlide.tsx`
- Tokens: `src/index.css`
- Guidelines: `.lovable/coding-guidelines.md` (12 rules)

---

## 1. Inline hex / inline capsule colors

**Wrong:** `style={{ background: '#C9A84C' }}` or `style={{ color: 'var(--cream)' }}`.
**Why bad:** brand tokens change meaning on light themes (paper-ink, github-light);
inline-styled chips collapse to dark-on-dark.
**Right:** `.capsule-gold` / `.capsule-ember` / `.capsule-cream` / `.capsule-meta`.

## 2. Depth via transform scale

**Wrong:** `transform: scale(0.92)` on far rows.
**Why bad:** scaling reflows the rail and shifts neighbours; depth should read as
recession, not size jitter.
**Right:** opacity + color + blur ramp bound to `data-state` (see `15-css-recipes.md`).

## 3. Silent catch

**Wrong:** `try { slideSound.play('click') } catch {}`.
**Why bad:** violates guideline rule 4 — every catch logs; silent failure hides
the real fault.
**Right:** narrow `catch (err: unknown)` and log via `src/lib/errors.ts`, or add
`// intentional: <reason>` when degradation truly is the contract.

## 4. Re-render hack instead of `tryAdvance`

**Wrong:** forcing a key change or remount to "fix" boundary navigation.
**Why bad:** symptom-patch; the deck must short-circuit through the imperative
handle before navigating slides.
**Right:** implement `FocusTimelineHandle.tryAdvance(dir)` returning `false` at
the boundary (see `10-interaction-contract.md`).

## 5. Ignoring reduced motion

**Wrong:** running the full variant/transform animation regardless of preference.
**Why bad:** breaks the reduced-motion contract and accessibility.
**Right:** drop transforms/variants/pulse, keep opacity+blur under both
`@media (prefers-reduced-motion)` and `[data-reduce-motion="true"]`
(see `11-reduced-motion.md`).

## 6. Paragraph rows

**Wrong:** a full sentence per step.
**Why bad:** violates keywords-only + narrow-idea-per-slide (rules 12).
**Right:** one keyword label per step; the presenter narrates the detail.

## 7. Magic timing numbers

**Wrong:** `transition: opacity 240ms` inline.
**Why bad:** violates rule 6 — timings live in `index.css` as `--dur-*`.
**Right:** `transition: opacity var(--dur-fast) var(--ease-standard)`.
