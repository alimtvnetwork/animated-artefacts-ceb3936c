# Update 12 — TileSlide content block must be vertically centered, not bottom-anchored

**Date:** 2026-05-03
**Slide affected:** `05` (TileSlide), and TileSlide pattern in general.
**Supersedes:** the `justify-end` rule in `updates/spec/10-tile-slide-header-bottom-aligned.md` (item #1 only — close-coupling and brand-x-axis rules from #10 and #11 still apply).

## The mistake (read carefully, AI)

In update **#10** the AI bottom-anchored the TileSlide section using `flex flex-col justify-end pb-24`. Combined with the brand header (which lives at the very top of the slide, ~pt-24), this produced:

- A huge empty band of ~360–420px between the brand logo (top) and the eyebrow "TODAY'S GOAL" (lower-middle).
- The entire block (eyebrow + title + 3 tile cards + caption) sitting in the bottom 55% of the canvas.
- Visually heavy bottom, empty top — the slide looks unbalanced and "falling off the bottom".

The user circled this exact dead band and asked for the whole block to move up.

### Why the previous fix was wrong

Update #10 read "header should sit close to the cards" as "anchor everything to the bottom." That is wrong. **Close-coupling header→cards (small gap between them) is independent from where the GROUP sits on the canvas.** The group should sit in the **vertical middle** of the canvas; the header–cards gap stays tight (`mb-6`).

## Rule (authoring contract for TileSlide — current truth)

1. **Vertical placement: CENTER.** The outer section uses `flex flex-col justify-center`. Never `justify-end`, never `justify-start`.
2. **Top padding ≥ pt-24** so the content block does not collide with the brand header.
3. **Bottom padding ≥ pb-40** so the centered block visually clears the slide-number controller and the optional caption.
4. **Header and tile grid stay close-coupled** — `mb-6` (24px) between header and grid. (Rule from #10, still valid.)
5. **Horizontal padding = `var(--brand-inset-x)`** so headline left-edge aligns with the brand logo. (Rule from #11, still valid.)
6. The caption (`tilesCaption`) sits inside the centered group with `mt-8` and does not push the group off-center because the section's flex centering accounts for the full child column.

## Implementation

`src/slides/types/TileSlide.tsx`:

```tsx
<section
  className="relative h-full w-full overflow-hidden flex flex-col justify-center pt-24 pb-40"
  style={{
    paddingLeft: 'var(--brand-inset-x)',
    paddingRight: 'var(--brand-inset-x)',
  }}
>
  <header className="mb-6">…</header>
  <div className={`grid ${cols} gap-6`}>…tiles…</div>
  {caption && <p className="mt-8 …">{caption}</p>}
</section>
```

## Don't (anti-patterns the AI must refuse)

- ❌ `justify-end` on a TileSlide section — bottom-anchors the block, leaves dead space below the brand header.
- ❌ `justify-start` on a TileSlide section — top-anchors and leaves dead space above the controller.
- ❌ Adding `flex-1` to the tile grid — stretches the grid to fill, destroys close-coupling with the header.
- ❌ Increasing `mb-*` between header and grid above `mb-6` — breaks the close-coupled header→cards relationship.
- ❌ Hard-coding `px-24` (or any tailwind `px-*`) on the section — breaks brand-x-axis alignment. Always use `var(--brand-inset-x)`.

## Mental model for the AI when "center the content" is requested

When a user says "put it in the middle / a bit up / closer to the logo," the correct lever is **`justify-content` on the outer slide section**, NOT moving individual children with margins. The layout primitive owns vertical placement; children own internal spacing.

| User says | Correct lever |
|---|---|
| "Put this in the middle" | `justify-center` on section |
| "Move it up a bit" | `justify-center` (from `justify-end`) + ensure `pt-*` is not eating the slot |
| "Keep header close to cards" | small `mb-*` on header, no `flex-1` on grid |
| "Align with the logo" | `paddingLeft/Right: var(--brand-inset-x)` |

## Test

Open `/5`. The eyebrow "TODAY'S GOAL" should sit roughly at 38–42% of the canvas height. The bottom edge of the tile cards should sit roughly at 75–80% of the canvas height. There should be NO dead band larger than ~80px between the brand header and the eyebrow.
