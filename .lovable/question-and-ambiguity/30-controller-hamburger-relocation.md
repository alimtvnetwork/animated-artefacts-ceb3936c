# 30 — Controller hamburger (relocation from sidebar) + recall the "forgotten" item

**Logged:** 2026-05-02 · **Window 2 task:** 30 / 40
**Supersedes:** ambiguity #29 Q7 (hamburger location) — moves the dropdown
from the **left TOC sidebar header** to the **bottom-right controller pill**.

## What the user said (verbatim paraphrase)

> "You have not done the work on the menu section. That means the slides
> menu that we have in the bottom-right corner. They should have a
> hamburger menu, which actually combines most of the menus inside —
> from overview, present view, jump view, contrast menu item, reduce
> motion. This should all be compacted, and also add a new option to
> that menu. As I mentioned, keyboard shortcut and… I really forgot
> another one. Can you please put back from the memory that what I
> just discussed, there was another menu item that I requested you to
> add."

## Two things to resolve

### A. Hamburger location → bottom-right controller (NOT left sidebar)

In task #29 I logged the hamburger as living in the **left TOC sidebar
header**. The user's voice message today is unambiguous: it goes in the
**bottom-right controller pill** (`ControllerBar.tsx`). The left sidebar
keeps its `Esc` + `Ctrl+1` behavior but no longer needs a hamburger of
its own.

**Action:**
- Update `mem://features/toc-sidebar` to remove the hamburger reference.
- Append the hamburger spec to the **controller** memory area (new
  memory `mem://features/controller-hamburger`) and to spec
  `21-slides-system/02-controller.md`.
- Spec 64 §15.6 cross-reference re-pointed.

### B. The "forgotten" item from prior memory

User listed verbally: **Overview, Presenter view, Top Talk Jumper
toggle, Contrast debug, Reduce motion** (5 items) and asked to add
**Keyboard map** (6th) plus "another one I forgot" (7th).

Searching memory + ambiguity logs, the most likely candidate for the
7th item — given recent context — is **Reveal hints** (the
`revealHints` / `onToggleRevealHints` toggle that already lives on the
`ControllerBar` as a separate `Sparkles` button). It pulses
click-reveal capsules with a gold ring so the presenter can see which
items are interactive — a presenter-only affordance that fits the
"declutter the controller" theme of the consolidation.

Other candidates considered and rejected:
- **Theme menu** — too important to bury in a dropdown; stays as its
  own controller chip.
- **Deck manifest (export/import/reset)** — same; it's a primary
  controller action.
- **Animation scrubber / Transition inspector** — these are dev/debug
  tools already gated by URL flags, not presenter affordances.
- **Share** — primary controller action; stays.

**Inferred decision:** The 7th item = **Reveal hints**. Will add to the
hamburger dropdown and remove the standalone Sparkles button from the
controller pill (the dropdown becomes its only home).

If user meant a different item, they can correct on review and we move
one row in/out of the dropdown — no code rewiring needed.

## Final consolidated dropdown contents (controller pill, top-right)

1. **Overview** (`G`)
2. **Presenter view** — opens `/present` in new window
3. **Top Talk Jumper** — toggle visibility (`J`); default flipped to hidden
4. **Reveal hints** — toggle gold-ring pulse on click-reveal capsules
5. **Contrast debug** — token overlay
6. **Reduce motion**
7. **Keyboard map** (`?`) — opens KeyboardShortcutsDialog

## Impact on prior plan (#29)

- **Code:** the hamburger lands in `ControllerBar.tsx`, not
  `SlideTocSidebar.tsx`. Sidebar still gets `Esc` + `Ctrl+1` toggle.
- **Memory:** new `mem://features/controller-hamburger`; existing
  `toc-sidebar` memory trimmed.
- **Spec:** new section in `02-controller.md`; spec 64 §15.6
  cross-reference updated.

## Timestamp
2026-05-02
