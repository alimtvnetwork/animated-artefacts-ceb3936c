## Next 10 (steps 31–40) — deepen image authoring + close the deferred combos

Steps 1–30 shipped the four image sources (asset / SVG / Base64 / data URI), the `imageRole` wiring, the authoring doc, the `image-examples` deck, tests, and browser QA. The next 10 finish the combos we deferred and harden the contract.

### 31. Image + steps combo slide — ~35 min
**Why:** original ask explicitly wanted "slides with images AND steps". Today `StepTimelineSlide` has no per-row thumbnail path. Add an optional `image`/`imageRole:"inlineThumbnail"` on `StepSpec` and render it beside the step row.
**Reasoning:** uses the existing slot resolver, so it's additive and theme-safe.

### 32. Real `titleHero` example — ~25 min
**Why:** slot exists but no live example. Confirm `TitleSlide` renders `content.image` at the `titleHero` slot; add slide + JSON/MD to `image-examples`.

### 33. Two-up / caption image layout — ~30 min
**Why:** authors need "image + caption" and "image + bullets" patterns. Add an `ImageSlide` variant (or doc pattern) with a caption line under the figure.

### 34. Multi-image row (gallery) example — ~30 min
**Why:** show how to place 2–3 small figures in one row via repeated `inlineThumbnail`/`iconBadge` slots. Document the density budget.

### 35. Register `image-examples` in the deck switcher / docs index — ~15 min
**Why:** today it's only reachable via `?deck=image-examples`. Cross-link from `spec/README.md` and the LLM catalog so it's discoverable.

### 36. JSON image-source lint / CI sanity — ~30 min
**Why:** catch broken `image` srcs (missing asset file, malformed data URI) at build/test time. Add a test that walks every deck slide's `image` and asserts it resolves.

### 37. Reduced-motion + alt-text audit on image slides — ~25 min
**Why:** a11y house rule. Verify each `ImageSlide` has meaningful alt (falls back to title) and honors `prefers-reduced-motion` (opacity-only entry).

### 38. Base64/data-URI size guard + doc note — ~20 min
**Why:** inline Base64 bloats JSON. Add a soft warning when an inline image exceeds ~10 KB and document the CDN (`lovable-assets`) escape hatch.

### 39. Visual QA remaining slides (1, 3, 6, 7) + fix title overlap — ~25 min
**Why:** slides 2/4/5 were verified; confirm cover, SVG file, thumbnail, icon-badge. The bottom title currently sits near the controller — nudge it up.

### 40. Memory + spec closeout — ~15 min
**Why:** persist the image-authoring contract to project memory and add a `## Resolution` note to the relevant spec/issue files.

**Estimated total: ~4 hours.**

## Remaining items (beyond step 40)

- **Step 23 / StepsChain3D** — cross-check 3D-depth (spec #61) vs shared data model (still open from earlier backlog).
- **motion-showcase audio slugs** — verified registered; optional distinct-cue MP3s remain polish.
- **`22-app-issues.md`** — long-lived multi-issue RCA log; sweep for stale entries.
- **Single-`<video>`-via-portal refactor** — broad reading of issue #63; large, deferred.
- **No-questions window** — window 2 closed (40/40); confirm whether to open window 3.
- **Spec upkeep** — ensure each closed issue gets a `## Resolution` section.

Approve and I'll implement 31–40, then pause for your next batch.