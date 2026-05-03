# 13 — AI Blind-Authoring Guide for Slide Layouts (Part 1 of N)

**Date:** 2026-05-03
**Audience:** any AI (or human) editing slide layout components in this repo without prior context.
**Goal:** eliminate the *repeat mistakes* the AI made on slides 05 and 09 between updates #06 and #12. After reading this single document, an AI should be able to author or fix a TileSlide / LayoutSlide / compact-card layout **blind** — without seeing the preview — and get it right on the first attempt.

This is **Part 1**: the *Layout Mental Model* + the *TileSlide / LayoutSlide* contracts. Reply `next` for Part 2 (compact cards + grid stretching), Part 3 (decision tree + checklist), and Part 4 (per-mistake postmortem table).

---

## 0. Why this document exists (read this first, AI)

Between updates #06 and #12 the AI made the **same class of mistake five times in a row** on the same slides. The pattern was always:

1. User asks: "make these cards smaller / closer / centered / aligned."
2. AI changes the wrong lever (margins on children instead of `justify-content` on the section, or a Tailwind `px-*` instead of the brand inset token).
3. The visual problem moves but does not resolve.
4. User repeats the request, more frustrated each time.
5. AI eventually finds the right lever — but only after 3–5 round trips.

This is **not** a knowledge problem. The information was already in `mem://` and in `updates/spec/06–11`. It is a **lever-selection problem**: the AI did not have a single, unambiguous map of *"when the user says X, change Y on Z element."* This document is that map.

---

## 1. The Layout Mental Model (non-negotiable)

Every slide section in this repo is a **single flex column** that owns three independent axes. **Never confuse them.**

| Axis | Lever (CSS) | Lives on | Controls |
|---|---|---|---|
| **A. Vertical placement of the whole content group** | `justify-content` (`justify-center` / `justify-start` / `justify-end`) | the outer `<section>` | where the eyebrow→title→cards→caption block sits on the canvas (top / middle / bottom). |
| **B. Internal spacing between siblings inside the group** | `mb-*` / `mt-*` / `gap-*` | the children (header, grid, caption) | how tight or loose the header→cards→caption stack is. |
| **C. Horizontal alignment with the brand column** | `paddingLeft` / `paddingRight` | the outer `<section>`, **as inline style** using `var(--brand-inset-x)` | whether the headline's left edge lines up with the Riseup Asia logo. |

### The rule

- **Do not** move the group up/down by tweaking `pt-*` / `pb-*` / `mt-*` on children. That is axis B leaking into axis A. **Use `justify-content` on the section.**
- **Do not** tighten header→cards spacing by adding `flex-1` or `content-center` to the grid. That is axis A leaking into axis B. **Use `mb-6` on the header.**
- **Do not** align with the logo using `px-24` (or any Tailwind `px-*`). The brand inset is a runtime token; Tailwind utilities drift the moment the token is re-tuned. **Use `style={{ paddingLeft: 'var(--brand-inset-x)', paddingRight: 'var(--brand-inset-x)' }}`.**

If you remember nothing else from this document, remember the **3-axis rule** above.

---

## 2. TileSlide — current authoring contract (canonical)

Supersedes updates #10 (item 1) and #11. Combined truth lives here.

### Required structure

```tsx
<section
  className="relative h-full w-full overflow-hidden flex flex-col justify-center pt-24 pb-40"
  style={{
    paddingLeft: 'var(--brand-inset-x)',
    paddingRight: 'var(--brand-inset-x)',
  }}
>
  <header className="mb-6">
    {eyebrow && <p className="slide-eyebrow mb-3">{eyebrow}</p>}
    {title   && <h2 className="slide-title-content …">{title}</h2>}
    {subtitle && <p className="slide-subtitle mt-3">{subtitle}</p>}
  </header>

  <div className={`grid ${gridClassFor(tiles.length)} gap-6`}>
    {/* tiles */}
  </div>

  {caption && <p className="mt-8 text-center text-sm italic …">{caption}</p>}
</section>
```

### Required values (do not deviate)

| Property | Value | Why |
|---|---|---|
| Section vertical | `justify-center` | content sits in the vertical middle of the canvas. |
| Section top pad | `pt-24` | clears the brand header. |
| Section bottom pad | `pb-40` | clears the controller pill + caption. |
| Section horizontal | `var(--brand-inset-x)` (inline style) | shares x-axis with the logo. |
| Header bottom margin | `mb-6` (24px) | close-couples header to grid. |
| Grid | `grid grid-cols-{2|3|4} gap-6` | derived from tile count via `gridClassFor`. **Never** add `flex-1` or `content-center`. |
| Caption | `mt-8` (only if present) | does not push the centered group off-axis because flex centers the full child column. |

### Acceptance test (blind, no preview required)

If your TileSlide JSX matches the structure above **byte for byte** at the structural level (classes + inline style + child order), it is correct. Open `/5` to confirm:

- "TODAY'S GOAL" eyebrow sits at ~38–42% of canvas height.
- Bottom of tile cards sits at ~75–80% of canvas height.
- Headline "T" aligns vertically with the "R" of "Riseup Asia".
- No dead band > 80px between the brand header and the eyebrow.

---

## 3. LayoutSlide — current authoring contract

Established in updates #06 and #09. Recap, with the same 3-axis discipline applied:

### Required values

| Property | Value | Why |
|---|---|---|
| Section vertical | `justify-center` (centered-content mode, default for short compare slides) | matches user's stated preference: *"keep the content in the center."* |
| Section horizontal | `var(--brand-inset-x)` (inline style) | brand-aligned, same as TileSlide. |
| Card sizing | use `compact: true` in JSON for short cards | triggers `.slide-card.is-compact` rule (update #07). |
| Compact cards in a column | rely on `align-self: start` from `.slide-card.is-compact` | prevents row-stretching (update #07). |
| Multiple compact cards stacked | rely on update #08 rule (cards pack together, no spread) | no manual `gap-*` overrides on the column. |

### Authoring JSON (LayoutSlide centered-content, two compare cards)

```json
{
  "type": "LayoutSlide",
  "content": {
    "layout": "centered-content",
    "items": [
      { "title": "Plan A", "body": "…", "compact": true },
      { "title": "Plan B", "body": "…", "compact": true }
    ]
  }
}
```

If both items are `compact: true`, they will hug their content and pack together in the centered group. **Do not** add `rowSpan`, `flex-1`, or custom heights to make them "look balanced" — the compact rule already handles it.

---

## 4. The 3-axis lever map (memorize this table)

| User says… | Wrong lever (do NOT use) | Correct lever |
|---|---|---|
| "Put it in the middle / center vertically." | `pt-*`, `pb-*`, `mt-auto` on children | **`justify-center`** on section |
| "Move it up a bit." | reducing `pt-*` | switch from `justify-end` → **`justify-center`**; verify `pt-*` ≥ 24 |
| "Move it down a bit." | adding `mt-*` to header | switch to **`justify-end`** + `pb-*` ≥ 40 (rare; centered is default) |
| "Keep header close to the cards." | `flex-1` on grid, `content-center` on grid, `gap-y-*` on section | **`mb-6`** on `<header>`; **remove** `flex-1`/`content-center` if present |
| "Align with the Riseup Asia logo." | `px-24`, `pl-24`, `ml-auto` | **inline style** `paddingLeft: 'var(--brand-inset-x)'` (and `paddingRight`) |
| "Make the boxes shorter." | hard-coded `h-*`, `max-h-*` | set **`compact: true`** in JSON; rely on `.slide-card.is-compact` |
| "Keep the boxes together (don't spread them)." | `gap-y-0`, custom `grid-rows-*` | rely on update #08; ensure no `flex-1` on the column |

If a user's request is not in this table, **map it to the 3-axis model first** (axis A vertical / axis B internal / axis C horizontal), then pick the lever for that axis. **Never** modify two axes in the same fix unless the user asked for both.

---

## 5. Anti-patterns the AI must refuse outright

If you are about to write any of these, **stop** and re-read §1.

- ❌ `justify-end` on a TileSlide or LayoutSlide section (bottom-anchors, leaves dead space at top).
- ❌ `justify-start` on a TileSlide or LayoutSlide section (top-anchors, leaves dead space at bottom).
- ❌ `flex-1` on a tile/card grid (decouples header from cards, kills update #10).
- ❌ `content-center` on a tile/card grid (same problem as `flex-1`).
- ❌ `px-24` (or any Tailwind `px-*` / `pl-*` / `pr-*`) on the outer slide section (drifts from `--brand-inset-x`).
- ❌ Hard-coded `h-*` / `min-h-*` / `max-h-*` on a `.slide-card.is-compact` (fights the `align-self: start` rule).
- ❌ Inline `text-shadow` in components (use the semantic classes — see `mem://design/text-weight-shadow`).
- ❌ Raw hex colors in components (use semantic tokens from `index.css`).

---

## 6. What's coming in Parts 2–4

Reply `next` and I will append:

- **Part 2 — Card sizing & grid stretching deep-dive.** Why `align-self: start` matters when a sibling has `rowSpan: 2`. How `split-2-equal` distributes auto rows. Concrete diagrams of the failure mode update #07 fixed.
- **Part 3 — Blind-readiness decision tree + pre-flight checklist.** A flowchart the AI runs through *before* writing any layout code: "Is this a Tile/Layout slide? → Which axis is the user changing? → Which lever? → Verify against §4 table."
- **Part 4 — Per-mistake postmortem.** Each of updates #06–#12 reframed as: *the symptom the user reported, the wrong lever the AI pulled, the right lever, the one-line rule that would have prevented it.* Plus a memory-rule patch list.

---

## 7. Index update

Added to `updates/spec/README.md` as entry **13**.
