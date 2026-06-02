# 14 — AI Blind-Authoring Guide for Slide Layouts (Part 2 of N)

**Date:** 2026-05-03
**Audience:** any AI editing `LayoutSlide` / compact card layouts in this repo without prior context.
**Prereq:** read [13 — Part 1](./13-ai-blind-authoring-guide.md) first. This part assumes the **3-axis model** (A vertical / B internal / C horizontal) is internalized.
**Scope of this part:** the *exact mechanics* of compact cards and CSS Grid stretching that caused updates **#07** and **#08**. After reading this, an AI should be able to predict — without rendering — whether two cards in a column will stretch, hug, top-anchor, bottom-anchor, or spread.

Reply `next` for Part 3 (decision tree + pre-flight checklist) and Part 4 (per-mistake postmortem table).

---

## 0. Why this part exists

Updates #07 and #08 were both *grid-mechanics* bugs disguised as *padding* bugs. The AI kept adjusting `padding` on `.slide-card.is-compact` and the cards kept rendering tall. The actual culprits were:

1. **#07** — default grid item `align-self: stretch` made each compact card grow to fill its row track. Padding changes were invisible because the card was already as tall as the row.
2. **#08** — when a sibling slot in `split-2-equal` used `rowSpan: 2`, the column with two compact cards got two auto rows that **split the available height evenly**, so even after #07 fixed stretching, the cards were pushed to the top and bottom edges with a huge gap.

Both bugs share a root cause: **the AI was thinking about the card, not the grid track the card lives in**. This document fixes that.

---

## 1. The CSS Grid track model (memorize this)

A `.slide-grid-*` preset is a CSS Grid container. Two things determine where a card ends up:

### 1a. Track sizing (how tall is the row?)

| Grid auto-row mode | Behavior |
|---|---|
| `grid-auto-rows: 1fr` (default in some presets) | Every implicit row is the **same height**, splitting the container's free space evenly. Two compact cards in one column → each row is 50% of the column height. |
| `grid-auto-rows: min-content` (set by update #08) | Each implicit row is **exactly the height of its content**. Two compact cards → two short rows packed at the top. |
| `grid-auto-rows: auto` | Row sizes to its tallest item. With one compact + one tall sibling, the row matches the tall one. |

### 1b. Item alignment within the track (where does the card sit in the row?)

| `align-self` value | Behavior |
|---|---|
| `stretch` (default) | Card fills the row track vertically. **Padding has no visible effect on height.** This is why #07 happened. |
| `start` (set by `.slide-card.is-compact`) | Card hugs its content, anchored to the top of the row. |
| `center` | Card hugs content, vertical-center of the row. |
| `end` | Card hugs content, anchored to the bottom of the row. |

### The combined truth table

For two compact cards in the right column of a `split-2-equal` where the left slot has `rowSpan: 2`:

| `grid-auto-rows` | `align-self` on cards | Result |
|---|---|---|
| `1fr` (default) | `stretch` (default) | **Two tall cards** filling 50% each. Padding invisible. *(pre-#07 bug)* |
| `1fr` (default) | `start` (post-#07) | **Two short cards spread to top and bottom** of column with huge gap. *(pre-#08 bug)* |
| `min-content` (post-#08) | `start` (post-#07) | **Two short cards packed together at top** with `row-gap`. ✅ correct. |
| `min-content` (post-#08) | `stretch` | Cards hug content (no row to stretch into). Equivalent to ✅. |

**Reading the table:** updates #07 and #08 are both required and they fix *different axes*. #07 fixes per-card vertical sizing; #08 fixes how the column distributes empty space between cards.

---

## 2. The two CSS rules (current source of truth)

Both live in `src/index.css`. Do not duplicate them on individual decks.

### 2a. `.slide-card.is-compact` (update #07)

```css
.slide-card.is-compact {
  padding: 1rem 1.25rem;
  border-radius: 0.875rem;
  align-self: start;          /* ← prevents row-stretch */
}
.slide-card.is-compact h3            { font-size: 1.25rem; margin-bottom: 0.25rem; }
.slide-card.is-compact .slide-eyebrow { margin-bottom: 0.25rem; }
.slide-card.is-compact p             { font-size: 0.95rem; line-height: 1.4; margin-bottom: 0; }
```

**Authoring contract:** opt in via JSON `"compact": true`. Never hard-code `h-*` / `min-h-*` / `max-h-*` on a compact card — it fights `align-self: start`.

### 2b. Compact-aware grid packing (update #08)

```css
.slide-grid-2-equal:has(.slide-card.is-compact),
.slide-grid-5-7:has(.slide-card.is-compact),
.slide-grid-4-8:has(.slide-card.is-compact),
.slide-grid-3-9:has(.slide-card.is-compact),
.slide-grid-12-column:has(.slide-card.is-compact) {
  grid-auto-rows: min-content;
  align-content: start;
  row-gap: 1rem;
}
```

**Authoring contract:** the rule auto-activates when *any* slot in the grid has `compact: true`. **Do not** add row-gap overrides, `grid-template-rows`, or `rowSpan` math to "fix spacing" — the rule already handles it.

---

## 3. Decision matrix — which lever for which symptom?

| Symptom in preview | Diagnosis | Lever |
|---|---|---|
| Compact card is **as tall as a full hero card**. | `align-self: stretch` is winning. | Verify `compact: true` is in JSON; verify no `h-*`/`min-h-*` override on the card. |
| Two compact cards are short but **spread to top and bottom of column** with a big gap. | `grid-auto-rows: 1fr` distributing free space across two rows. | Verify the `:has(.slide-card.is-compact)` rule from #08 is in `index.css` and the column's grid is one of the listed presets. |
| Compact cards stack with the **right gap (~16px) but sit too low/high in the canvas**. | This is axis A (vertical placement of the whole group), not a card bug. | **Re-read Part 1 §1.** Use `justify-center` on the section, not card tweaks. |
| One compact card next to one **tall plain slot**, both feel out of balance. | The plain slot is fine; the compact card is hugging content (correct). The "balance" complaint is aesthetic, not structural. | Do **not** add `min-h-*` to make them equal. Either: (a) drop `compact` if you want full hero balance, or (b) accept asymmetric heights — they're correct. |
| Compact card text is wrapping awkwardly. | Card width is grid-driven, not card-driven. | Adjust grid preset (e.g. `split-5-7` → `split-4-8`) or shorten body copy. Never add `max-w-*` to the card. |

---

## 4. Mental model: "the column is a stack of receipts"

Think of a compact-card column as a **stack of receipts on a desk**, not a set of slots in a vending machine.

- Each receipt (card) is exactly as tall as its printed text. → `align-self: start`
- The stack sits at the top of the desk; you don't push receipts to the bottom. → `align-content: start` + `grid-auto-rows: min-content`
- Receipts are separated by a fixed paper-clip gap. → `row-gap: 1rem`
- If you want the *whole stack* in the middle of the desk, you move the desk's content alignment (axis A on the section), not the receipts.

This metaphor maps 1:1 to the CSS rules above. When debugging, ask: *"Am I changing the receipt, the stack, or the desk?"*

- Receipt → card padding / typography (rare; the `.is-compact` rule already nails it)
- Stack → grid auto-rows / align-content / row-gap (handled by #08; **don't override**)
- Desk → section `justify-content` (axis A from Part 1)

---

## 5. Anti-patterns specific to compact cards (refuse outright)

If you are about to write any of these, **stop**.

- ❌ `h-32`, `min-h-[200px]`, `max-h-*` on a `.slide-card.is-compact`. Fights `align-self: start`.
- ❌ `flex-1` or `flex-grow` on the grid container. Distorts row tracks.
- ❌ `grid-template-rows: repeat(2, 1fr)` on a column with compact cards. Re-introduces the spread bug from #08.
- ❌ `rowSpan: 2` on a compact card. Compact cards are short by definition; spanning rows is a contradiction.
- ❌ Empty placeholder slots inserted "to push cards together." The CSS already packs them.
- ❌ Per-deck CSS overrides of `.slide-card.is-compact` or the `:has()` rule. Edit `src/index.css` if the contract genuinely needs to change, then update this guide.
- ❌ Mixing `compact: true` with `kind: "plain"` or `kind: "codeblock"`. The `is-compact` class only exists on `kind: "card"`.

---

## 6. Worked example — slide 09 ("Where do we go from here?")

### JSON (correct, current)

```json
{
  "type": "LayoutSlide",
  "content": {
    "layout": "split-2-equal",
    "layoutVerticalAlign": "center",
    "layoutSlots": [
      { "kind": "plain", "title": "Pick your path", "rowSpan": 2, "body": "…" },
      { "kind": "card",  "eyebrow": "Plan A", "title": "Add a feature to Gitmap", "body": "Continue where we left off.", "compact": true },
      { "kind": "card",  "eyebrow": "Plan B", "title": "Start fresh", "body": "New repo, new idea.",                "compact": true }
    ]
  }
}
```

### What the CSS does for you (no extra work needed)

1. `LayoutSlide` section gets `justify-content: center` from `layoutVerticalAlign: "center"` (axis A).
2. Section gets `paddingLeft/Right: var(--brand-inset-x)` (axis C).
3. The `.slide-grid-2-equal` container detects `:has(.slide-card.is-compact)` and switches to `grid-auto-rows: min-content; align-content: start; row-gap: 1rem` (#08).
4. Each `.slide-card.is-compact` applies `align-self: start` so it hugs content (#07).
5. Plan A and Plan B render as two short, packed cards in the right column, vertically centered as a group with the left "Pick your path" plain slot.

### What you should NOT do

- Don't add `gap-y-*` to the section.
- Don't set `rowSpan` on Plan A or Plan B.
- Don't add `flex-1` to the inner motion.div in `LayoutSlide.tsx`.
- Don't change `pt-*` / `pb-*` to "shift them up." That's axis A — already handled by `justify-content`.

---

## 7. Quick self-check (run this mentally before writing any compact-card change)

1. **Am I changing card height?** → Only via `compact: true` flag. If still wrong, check for stray `h-*` overrides.
2. **Am I changing card spacing within the column?** → Don't. Update #08 owns this.
3. **Am I changing where the whole column sits vertically?** → That's axis A on the section, not a card concern. Re-read Part 1 §1.
4. **Am I aligning the headline with the logo?** → Axis C on the section (`var(--brand-inset-x)` inline style). Re-read Part 1 §2.
5. **Am I about to add a per-deck CSS override?** → Stop. Either the global rule needs updating (then update it AND this guide) or you're solving the wrong problem.

If you can answer all five honestly, you will not reproduce the #07/#08 bug class.

---

## 8. Index update

Added to `updates/spec/readme.md` as entry **14**.
