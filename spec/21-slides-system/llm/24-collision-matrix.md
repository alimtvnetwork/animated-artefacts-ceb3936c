# 24 — Transition × TextAnimation Collision Matrix

> **Phase 24/24** · The complete `transition × textAnimation` grid:
> every cell labelled allowed/reserved/blocked, plus the
> neighbor-collision rules that decide whether a given pair can sit
> next to slide N-1 or N+1. Supersedes the partial 10-pair allowlist
> in `19-remediation-pack.md` §G4 — that table remains as a
> quick-reference; this file is the authoritative source.

The runtime enums (`src/slides/enums.ts`):

- `SlideTransition` (5):  `FadeIn`, `SlideIn`, `PushIn`, `PushLeft`, `PushRight`
- `TextAnimation` (4):    `FadeIn`, `Bounce`, `SlideUp`, `Stagger`

That gives **20 combinations**. Convention in this doc: rows =
`transition`, columns = `textAnimation`. The "5×5" framing in the
title accounts for the diagonal (header row + header column) — the
content grid itself is 5×4.

---

## Legend

| Cell | Meaning |
|---|---|
| ✅  | **Allowed** — ships in real decks. Pick freely. |
| ⚠️  | **Reserved** — only allowed for the explicit use noted. Do not pick blindly. |
| 🚫  | **Forbidden** — never ship. Reads as a tic, distracts from content, or breaks reduced-motion. |

Reasons codes (right-most cells in §3 detail table):

- `R1` Both axes carry strong horizontal motion → reads as a glitch.
- `R2` Both axes carry strong vertical motion → text appears to "fall through" the slide.
- `R3` Bounce on a non-hero slide → cartoony, breaks the Noir & Gold tone.
- `R4` Push + Stagger duplicates the "wave" feeling → no clear focal point.
- `R5` PushIn + Bounce reserved for slide 1 hero only (see file 06 §title).

---

## 1. The full 5 × 4 matrix

|                | `FadeIn` | `Bounce` | `SlideUp` | `Stagger` |
|---|---|---|---|---|
| **`FadeIn`**     | ✅ #1 quiet hand-off, image slides | ⚠️ R3 reserved | ✅ #2 title → content | ✅ #3 capsule lists, keywords |
| **`SlideIn`**    | ✅ #4 restful content | ⚠️ R3 reserved | ✅ #5 **default content slide** | ✅ #6 step rows |
| **`PushIn`**     | ✅ #7 section divider | ⚠️ #8 R5 slide-1 hero only | 🚫 R2 | ⚠️ R4 reserved |
| **`PushLeft`**   | 🚫 R1 | 🚫 R3 | ✅ #9 narrative leftward | ⚠️ R4 reserved |
| **`PushRight`**  | 🚫 R1 | 🚫 R3 | ⚠️ R2 reserved | ✅ #10 narrative rightward |

Counts: 10 ✅ allowed · 6 ⚠️ reserved · 4 🚫 forbidden = 20 total.
The 10 allowed cells are exactly the pairs #1–#10 in
`19-remediation-pack.md` §G4 — the numbering is preserved here for
cross-reference.

---

## 2. Neighbor-collision rule

A pair on slide N **collides** with a neighbor if EITHER axis
matches:

- Same `transition` as N-1 → collision (transition collision).
- Same `textAnimation` as N-1 → collision (text collision).

Both axes count independently. A pair is "neighbor-safe" only if
**both** axes differ from N-1 AND from N+1 (when N+1 is already
authored).

In an unauthored future slot (N+1 is empty), only check N-1.

### Worked example — neighbor is pair #5 (`SlideIn` + `SlideUp`)

- Blocked by transition collision (`SlideIn`): #4, #5, #6
- Blocked by text collision (`SlideUp`):       #2, #5, #9
- Union of blocked: {#2, #4, #5, #6, #9}
- Safe for N: **{#1, #3, #7, #8, #10}** ← matches §G4 quick lookup

### Worked example — neighbor is pair #3 (`FadeIn` + `Stagger`)

- Blocked by transition (`FadeIn`): #1, #2, #3
- Blocked by text (`Stagger`):       #3, #6, #10
- Union: {#1, #2, #3, #6, #10}
- Safe for N: **{#4, #5, #7, #8, #9}**

---

## 3. Quick-lookup — every allowed pair

For each of the 10 allowed pairs, this table lists which other
allowed pairs collide (must NOT be picked for an adjacent slide) and
which are safe.

| Pair | transition | textAnimation | Collides with | Safe neighbors |
|---|---|---|---|---|
| #1  | `FadeIn`    | `FadeIn`   | #2, #3, #4, #7 | #5, #6, #8, #9, #10 |
| #2  | `FadeIn`    | `SlideUp`  | #1, #3, #5, #7, #9 | #4, #6, #8, #10 |
| #3  | `FadeIn`    | `Stagger`  | #1, #2, #6, #7, #10 | #4, #5, #8, #9 |
| #4  | `SlideIn`   | `FadeIn`   | #1, #5, #6, #7 | #2, #3, #8, #9, #10 |
| #5  | `SlideIn`   | `SlideUp`  | #2, #4, #6, #9 | #1, #3, #7, #8, #10 |
| #6  | `SlideIn`   | `Stagger`  | #3, #4, #5, #10 | #1, #2, #7, #8, #9 |
| #7  | `PushIn`    | `FadeIn`   | #1, #2, #3, #4, #8 | #5, #6, #9, #10 |
| #8  | `PushIn`    | `Bounce`   | #7 (transition only) | #1, #2, #3, #4, #5, #6, #9, #10 — **but only legal on slide 1** |
| #9  | `PushLeft`  | `SlideUp`  | #2, #5 | #1, #3, #4, #6, #7, #8, #10 |
| #10 | `PushRight` | `Stagger`  | #3, #6 | #1, #2, #4, #5, #7, #8, #9 |

### Reading the table

- "Collides with" considers BOTH axes — same `transition` OR same
  `textAnimation`.
- "Safe neighbors" is the complement (within the 10-pair allowlist).
- Pair #8 is special: it has the fewest neighbor collisions (because
  `Bounce` and `PushIn` both appear nowhere else in the allowlist),
  but its **R5 reservation** restricts it to slide 1 regardless.

---

## 4. Edge cases the matrix does NOT cover

The matrix is local — it only checks N against N-1 and N+1. The
following deck-wide rules still apply on top:

1. **Same `transition` for 3 consecutive slides** is forbidden (mem
   `index.md` core rule, even when both transitions are technically
   "allowed" pairs). The matrix prevents 2-in-a-row; you must also
   look at N-2.
2. **Reduced-motion** (file 13 §reduced-motion) collapses every cell
   to a 150ms opacity fade. The matrix is a no-op when the user
   prefers reduced motion — but the JSON authoring still picks one of
   the 10 pairs so the spec is honest.
3. **TitleSlide and AdvanceStepSlide** override the deck transition
   internally. The pair recorded in JSON is what the matrix checks,
   even if the runtime renderer remaps it. Authors should still pick
   a coherent pair.

---

## 5. Authoring procedure (use this every time)

When picking a pair for slide N:

1. Read the pair on slide N-1 from JSON (and N+1 if already written).
2. Look up that pair's "Collides with" row in §3.
3. Pick from "Safe neighbors". If both N-1 and N+1 are set, pick from
   the **intersection** of the two safe lists.
4. If the intersection is empty (rare — only happens when N-1 and N+1
   share an axis), prefer the pair whose `transition` differs from
   N-1 (the more recent neighbor) and accept the text collision with
   N+1 — or rewrite N±1 so the deck has rhythm.
5. Run the §3 row for the chosen pair against slide N-2 to verify the
   3-in-a-row rule from §4.1 isn't violated.

This procedure plus the §1 matrix is what the file 18 acceptance
checklist's "variety" box (#22) is testing for.

---

## 6. Acceptance test

```ts
// Pseudocode used by the variety guard in file 19 §G4.
function isPairAllowed(t: Transition, a: TextAnimation): boolean { /* §1 cell */ }
function neighborSafe(prev: Pair, next: Pair | null, candidate: Pair): boolean {
  if (prev.transition === candidate.transition) return false;
  if (prev.textAnimation === candidate.textAnimation) return false;
  if (next) {
    if (next.transition === candidate.transition) return false;
    if (next.textAnimation === candidate.textAnimation) return false;
  }
  return true;
}
```

A future runtime check (not yet wired) should:

- Walk `linearSlides` in order.
- For each slide, assert `isPairAllowed` AND `neighborSafe(prev, next, pair)`.
- Emit a structured warning matching the contract format in
  `23-slide-type-contracts.md`: `[deck] Slide #N "name" pair (Tx + Ta) collides with neighbor #M ...`.

When that check ships, this file becomes the spec it validates against.
