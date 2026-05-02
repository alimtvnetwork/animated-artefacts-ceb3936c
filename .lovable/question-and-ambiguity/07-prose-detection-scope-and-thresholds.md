# Q07 — "Description field" interpretation + prose-detection heuristic

**Date:** 2026-04-28
**Task:** Show a contextual inline error under the description field (with a link to the contract) whenever I type prose into description on StepsChain3DSlide.

## The ambiguity

1. **What is "the description field"?** The 3D editor has no single description input — it explodes `description` into Title + Bullets[] + Meta + (legacy) Body. So "as I type prose" could mean (a) typing into one bullet, (b) any field, or (c) a removed/restored single textarea.
2. **What counts as "prose"?** No formal definition in the contract — only "keywords only, never paragraphs".

## Inference applied

### #1 Field scope → per-bullet (and legacy body)
- Bullets are where actual content lives, so prose typed there is the real risk. Inline error sits directly under the offending bullet input with `aria-invalid` + `aria-describedby` for a11y.
- The legacy `body` block already has a warning panel; added the contract link there too (single inline error, not duplicated under each child).
- Title and Meta intentionally NOT validated — by design they're short labels, never prose targets.

### #2 Heuristic thresholds for `looksLikeProse`
Trips when ANY of:
- `[.;]` followed by space + word — clearly multi-sentence
- `,` followed by space + word — clause separators
- `> 60` chars
- `> 8` words

Tuned so "Stakeholder interviews" / "One-page brief" / "System audit" pass; "We interview stakeholders, then audit the system." trips.

### #3 Contract link target
Pointed at `/spec/21-slides-system/61-steps-chain-3d.md` — the canonical 3D contract. Opens in a new tab with `decoration-dotted` underline so it reads as a reference link, not a primary action.

## Reviewable later

If thresholds are too aggressive (false positives on legitimate 3-word phrases with commas like "Discovery, alignment, brief"), tighten the comma rule to require both a comma AND a length over 30 chars.
