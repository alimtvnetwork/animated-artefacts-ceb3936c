# 10 — Typography

> **Phase 9/20** · The locked font system. No other typefaces ship.

## 1. Approved pair (locked)

| Role | Family | Weights used | Source |
|---|---|---|---|
| Display / Titles | **Ubuntu** | `700` (Bold) only | `--font-display` in `src/index.css` |
| Body | **Inter** | `400`, `500`, `600`, `700` | `--font-body` |
| Capsules | Inter | `600` (Semibold) | inline class |
| System fallback | Apple system / -apple-system | — | body stack |

**No serif** anywhere. **No script / display alternates.** Past specs
mentioned Poppins for step row titles — that is **superseded** by spec
36: step row titles use Ubuntu Bold like every other title.

## 2. Size scale (`clamp()` only)

Hard-coded `text-[8rem]` etc. is forbidden — it clipped "Building" on
slide 1. Always use `clamp()` + a `max-w-[92vw]` safety net.

| Use | CSS |
|---|---|
| Hero title (Title slide) | `font-size: clamp(3rem, 12vw, 9rem)` |
| Slide title (most slides) | `font-size: clamp(2.25rem, 6vw, 5rem)` |
| Eyebrow | `font-size: clamp(0.875rem, 1vw, 1.05rem); letter-spacing: 0.18em; text-transform: uppercase` |
| Step active title | `var(--step-title-active)` `clamp(3rem, 5vw, 4.75rem)` |
| Step adjacent | `var(--step-title-adjacent)` `clamp(1.75rem, 2.4vw, 2.25rem)` |
| Step far | `var(--step-title-far)` `clamp(1.25rem, 1.7vw, 1.625rem)` |
| Body / description | `clamp(1rem, 1.2vw, 1.25rem); line-height: 1.55` |
| Capsule label | `0.875rem` fixed; `font-weight: 600; letter-spacing: 0.01em` |

Body wrapper around any title must include `overflow-hidden` as a
safety net for clamp edge cases.

## 3. Weight rules

- Titles: **only** `700` (Ubuntu Bold). No 800/900 — Ubuntu's heavier
  weights are noticeably worse on screen.
- Body: `400` for prose, `500` for emphasis, `600` for chip / capsule
  labels, `700` for inline strong / numerals.
- Never use `<i>` italic — Ubuntu italic is weak. Use color/weight
  contrast instead.

## 4. Tracking & line-height

| Surface | `letter-spacing` | `line-height` |
|---|---|---|
| Hero title | `-0.02em` | `1.0` |
| Slide title | `-0.015em` | `1.05` |
| Eyebrow | `0.18em` | `1.0` (single line) |
| Body | `0` | `1.55` |
| Capsule | `0.01em` | `1.0` |

Negative tracking on titles is what makes Ubuntu Bold feel premium
instead of utilitarian. **Never** widen title tracking past `0`.

## 5. Forbidden

- New typeface in JSX (`fontFamily: 'Poppins'` etc.) — kills theme swap.
- Hard-coded pixel/rem font sizes for titles.
- Mixed weights inside one title (e.g. bold word + regular word).
- Drop shadows on text — read as low-budget. Use color/contrast instead.

## 6. Acceptance

- `grep -rn "fontFamily\\|font-family" src/slides/types/` returns only
  references to `var(--font-display)` / `var(--font-body)`.
- `grep -rn "text-\\[" src/slides/types/` returns zero matches for
  arbitrary px/rem on title elements.
- All title containers include `overflow-hidden` and `max-w-[92vw]`.

## 7. Open questions & changelog

- Open: support a presenter-specific font for keynote decks? Default: no.
- 2026-04-26 (v0.80.3): Phase 9 — pinned Ubuntu/Inter pair, full size
  scale, weight + tracking rules.
