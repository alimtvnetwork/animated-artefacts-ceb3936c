# 05 — Common mistakes (anti-patterns to never repeat)

Each item: what NOT to do → why → what to do instead.

## 1. Inline hex / brand tokens in JSON
❌ `{ "text": "Growth", "color": "#C9A84C" }`
**Why:** breaks on light themes — chips collapse to dark-on-dark.
✅ `{ "text": "Growth", "color": "gold" }` — always a token name
(`gold` · `ember` · `cream` · `ink` · `outline` · `violet` · `teal` · `rose` · `sky`).

## 2. Inventing layout fields
❌ `{ "content": { "title": "Hi", "align": "center", "x": 50, "y": 50 } }`
**Why:** the schema has no `align`/`x`/`y` — it fails validation or is ignored.
✅ Pick a slide type whose renderer centers (e.g. `MiddleTitleSlide`).

## 3. Hard-coding a font size
❌ `{ "content": { "title": "Big", "fontSize": "120px" } }`
**Why:** the 1920×1080 stage is scaled to fit any screen; fixed sizes break.
✅ Use `titleStyle` + the right slide type. Titles auto-scale via `clamp()`.

## 4. Writing paragraphs as visible content
❌ `{ "content": { "subtitle": "In this section we will explore the three…" } }`
**Why:** slides are visual anchors; the presenter narrates.
✅ Keyword-only on the slide; put narration in `notes` (or the sibling `.md`).

## 5. Overfilling a slide
❌ 9 capsules + a paragraph + 6 steps on one slide.
**Why:** unreadable when projected; overflows the 1080px height.
✅ ≤6 items per slide. If it overflows, split into another slide — don't shrink.

## 6. Editing the `.md` to change the slide
❌ Changing wording in `NN-name.md` and expecting the deck to update.
**Why:** the `.md` is never read at runtime.
✅ Edit `NN-name.json` — it is the runtime source of truth.

## 7. Duplicate or stale `slideNumber`
❌ Two slides both `"slideNumber": 5`.
**Why:** breaks `/N` routing and the indicator.
✅ Keep unique per deck; also keep the `slides.json` array stem in sync.

## 8. Two stacked logos
❌ `AdvanceStepSlide` with `showBrandHeader: true`.
**Why:** that type paints its own header → two logos overlap.
✅ Set `showBrandHeader: false` on self-headed types.

## 9. Orphan click-reveal
❌ `"isClickReveal": true` without `parentSlide`.
**Why:** the slide becomes unreachable.
✅ Always pair with `"parentSlide": N`.

## 10. Removing instead of muting
❌ Deleting a slide file to temporarily hide it.
**Why:** loses the work; hard to restore timing experiments.
✅ Set `"enabled": false` — keeps the file, removes it from the flow.
