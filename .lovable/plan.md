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
## Steps 41–50 — closeout (2026-06-02)

Reasoning: the previous batch (31–40) built image/step/gallery/caption authoring. The remaining
open threads were spec-hygiene and a data-model cross-check, not new UI. StepsChain3D is a
2000-line cinematic file whose design forbids card backgrounds — adding step thumbnails would
fight its depth-only language, so the correct outcome was a documented *decision*, not code.

- 41. Cross-check StepSpec.image vs StepsChain3D — decision: 3D ignores step images by design (~20m)
- 42. Document decision in spec 61 §12 with rationale + revisit condition (~15m)
- 43. App-issues 22.01–22.03 Resolution status table appended (~15m)
- 44. No-questions window 2 closed (40/40), window 3 opened, tied to mem://~user rule (~10m)
- 45. Memory: image-authoring note that 3D render is a silent no-op for step images (~10m)
- 46. Verify suite green (imageExamplesDeck + stepOffsets = 23 tests) (~10m)

Remaining (beyond 50):
- motion-showcase distinct-cue MP3s — optional polish.
- Single-<video>-via-portal refactor (#63) — large, deferred.
- StepsChain3D depth-aware marker-medallion — only if a future spec preserves no-background rule.

## Steps 51–60 — closeout (2026-06-02)

- 51. Distinct sound cues on motion-showcase step family 08–11 (whoosh/fadeZoom/zoom/pop, JSON-only) (~25m)
- 52. JSON validated for all four slides (~5m)
- 53. New guard test `motionShowcaseSoundCues.test.ts` — registered + mutually distinct (~20m)
- 54. Demo cue-map table + spare-asset (fade_swoosh_v3/v4) note in sound spec 21 (~15m)
- 55. Video-portal refactor (#63) scoping doc — decision: DEFER with full portal plan + interim rebind rule (~30m)
- 56. Interim prevention rule recorded (new surface must join the stream-rebind loop) (~5m)
- 57. Verify suite green (motionShowcaseSoundCues + imageExamplesDeck = 7 tests) (~10m)
- 58–60. Closeout bundle: plan log, cross-links (~10m)

Remaining (beyond 60):
- Video-portal refactor (#63) — implement only after a measured perf/desync complaint (see scoping doc).
- StepsChain3D depth-aware marker-medallion — only if a future spec preserves no-background rule.
- Promote a spare fade_swoosh take — repoint whoosh asset URL, no new SoundKind.

## Steps 61–70 — closeout (2026-06-02)

- 61. Ran FULL suite (863 tests) — caught a real regression from the steps 31–40 images[] refine (~20m)
- 62. Root cause: `slideFixtures` ImageSlide "missing image" case expected issue at `content.image`/`required`, but the any-of refine reports at `content` ("requires image or non-empty images[]") (~15m)
- 63. Fixed fixture expectation (expectPath `content`, message match `requires image|images[]`) — semantics correct, no schema change (~10m)
- 64. Re-ran slideFixtures (49 tests) green (~5m)
- 65. Confirmed image-examples deck cross-linked in spec/README §26 + §images (~10m)
- 66–70. Closeout: plan log, suite now fully green (863 tests) (~15m)

Remaining (beyond 70):
- Video-portal refactor (#63) — deferred until measured perf/desync complaint.
- StepsChain3D depth-aware marker-medallion — deferred (no-background rule).
- Promote a spare fade_swoosh take — repoint whoosh asset URL, no new SoundKind.
- motion-showcase not yet listed in spec/README deck enumeration (cosmetic).

## Steps 71–80 — closeout (2026-06-02)

- 71. Audited runtime decks (8) vs spec/26 folders (5 have folders) (~20m)
- 72. Found stale spec/README §26 reference to `navy-showcase/` + `test-step-light/` spec folders that don't exist (~10m)
- 73. Corrected §26 deck list to only real spec folders (~10m)
- 74. Added accurate Deck inventory table (slug · slides · spec folder · notes) (~25m)
- 75. Documented that demo/probe decks intentionally have no spec folder (~10m)
- 76. Verified vite dev-server log clean (no errors/exceptions) (~10m)
- 77–80. Closeout bundle (~15m)

Remaining (beyond 80):
- Video-portal refactor (#63) — deferred until measured perf/desync complaint.
- StepsChain3D depth-aware marker-medallion — deferred (no-background rule).
- Promote a spare fade_swoosh take — repoint whoosh asset URL, no new SoundKind.
- Optional: add spec folders for motion-showcase/navy-showcase if they graduate to maintained decks.

## Camera-2026 webcam track — steps 1–11 (2026-06-02)

Reasoning: the presenter rejected the webcam overlay's thick opaque gold/white
ring (images 1+2). The baked `04-…plate-gold-shadow.png` + `02-…mask-black.png`
crop produced it. Approved look (image 3) = live video cropped to a squircle
with a THIN gold→ember rim + soft shadow, transparent interior. The whole batch
converts the overlay to a CSS-only rim and removes the PNG machinery.

- 1.  Remove plate `<img>` + mask from the `on` card; transparent interior; CSS rim (border 2px gold/0.85 + layered ember/gold/drop box-shadow) (~25m)
- 2.  Align the fullscreen no-stream preview frame to the same rim tokens (~10m)
- 3.  Delete orphaned `src/assets/camera-2026/{02-mask,04-plate}.png` (dir now empty) (~5m)
- 4.  Update `O`-morph WAAPI shape-pop keyframes to layer the new rim (no flash to old shadow) (~15m)
- 5.  New guard test `presenterWebcamRimContract.test.ts` — no plate/mask import, no platePad/showPlate, no url() crop mask, gold border + transparent bg (4 tests) (~20m)
- 6.  Ran rim+halo+stability tests green (17) (~5m)
- 7.  camera-2026 README + assets/README — mark 02/04 reference-only, runtime CSS-only, dir empty (~15m)
- 8.  spec 05 §8 v2 rewrite (CSS-only recipe) + top-of-file CURRENT-TRUTH banner marking §1–§6 historical (~20m)
- 9.  mem://features/webcam-halo-and-stage updated to CSS-only rim (~10m)
- 10. Full webcam suite green (25 tests) (~10m)
- 11. Plan closeout (~5m)

Estimated total: ~2h 20m.

Remaining (camera-2026, beyond step 11):
- Optional: a pixel-exact superellipse via `paint()` Houdini / SVG clip-path if
  border-radius 38%/34% reads too round on very large sizes (not requested).
- Reference PNGs in `spec/camera-2026/assets/` are kept for visual diffing only;
  prune later if the spec is ever trimmed.
- Carryover from earlier tracks: video-portal refactor (#63), StepsChain3D
  depth-aware medallion, promote a spare fade_swoosh take — all still deferred.

## Camera-2026 webcam track — steps 12–21 (2026-06-02): spec-pack reconciliation

Reasoning: steps 1–11 shipped the CSS-only rim + memory + spec 05 §8 v2, but the
rest of the camera-2026 pack (acceptance checklist, overview, overlay-rendering,
build logs, implementation steps, READMEs) still described the rejected two-plate
stack as the shipped design. A blind re-implementer would have rebuilt the bug.
This batch makes every living doc agree with the CSS-only truth.

- 12. spec 07 §Shape&rim — replaced two-plate criteria with CSS-only rim contract (~20m)
- 13. spec 07 — persistence line (no plate flag) + test table (drop plate test, add rim-contract test) (~15m)
- 14. spec 00 §capabilities + spec 02 surface table & shape line → CSS-only rim (~15m)
- 15. spec 06 top banner: steps 24–26 plate work superseded (~10m)
- 16. README intro + "what is" para → CSS-only rim, assets reference-only (~15m)
- 17. Full suite green (867 tests) — asset deletion broke nothing (~15m)
- 18. Verified system specs 64/51 have no stale plate refs (mask hits are halo/circle only) (~10m)
- 19. README live-code-map line counts refreshed (744 / 1736) (~5m)
- 20. spec 06 step 25/26 + spec 10 build-log: inline strike-through + HISTORICAL banner (~20m)
- 21. Rim contract re-run green + plan closeout (~5m)

Estimated total: ~2h 10m. The camera-2026 pack is now internally consistent:
every living doc points at §8 v2 (CSS-only rim); historical build logs are
banner-marked, not silently wrong.

Remaining (camera-2026, beyond step 21):
- spec 05 §1–§6 remain as banner-marked HISTORICAL recipe; could be trimmed to a
  short "rejected approach" appendix if the pack is ever shortened (cosmetic).
- Reference PNGs in spec/camera-2026/assets/ kept for visual diffing only.
- Optional pixel-exact superellipse (Houdini/SVG clip-path) if border-radius
  reads too round at XL sizes — not requested.
- Carryover: video-portal refactor (#63), StepsChain3D depth-aware medallion,
  promote a spare fade_swoosh take — all still deferred.

## Camera-2026 webcam track — steps 22–31 (2026-06-02): final pack closeout

Reasoning: steps 12–21 reconciled the primary living docs; this batch sweeps the
last stale "plate" references in the build-log / test-execution docs and the
spec 05 §1 asset table (which still called 04 "the only shipped plate"), then
hardens the contract test to lock the squircle radii + rim box-shadow.

- 22. spec 08 build-log — HISTORICAL (pre-v2) banner (~10m)
- 23. spec 09 build-log — HISTORICAL banner; "plate"→"CSS rim" guidance (~10m)
- 24. spec 12 T16 manual-QA — describe CSS-only rim + "matches image 3" check (~10m)
- 25. spec 05 §1 table — 02/04 marked Historical/REJECTED, reference-only (kills the "only shipped plate" contradiction) (~10m)
- 26. Hardened presenterWebcamRimContract — lock border-radius 38%/34% / 50% / 999 + layered ember/gold/drop box-shadow (2 new tests) (~20m)
- 27. Rim contract green (6 tests) (~5m)
- 28. Verified reduced-motion guard early-returns the shape-pop WAAPI (no animation when reduced) (~5m)
- 29. Verified minimized puck + chrome inherit the gold rim border (unconditional on frame) (~5m)
- 30. Full suite green (869 tests, +2 from new contract assertions) (~15m)
- 31. Plan closeout (~5m)

Estimated total: ~1h 35m. The camera-2026 pack now has ZERO living doc that
claims the plate ships; all plate text is either banner-marked HISTORICAL or
explicitly REJECTED, and the radii + rim are test-locked.

Remaining (camera-2026, beyond step 31):
- spec 05 §1–§6 remain a banner-marked HISTORICAL recipe — could be trimmed to a
  short "rejected approach" appendix (cosmetic, ~30m).
- Reference PNGs in spec/camera-2026/assets/ kept for visual diffing only.
- True pixel-exact superellipse (SVG path stroke / Houdini) only if border-radius
  reads too round at XL sizes on a real lens feed (T16 manual check) — not requested.
- Carryover: video-portal refactor (#63), StepsChain3D depth-aware medallion,
  promote a spare fade_swoosh take — all still deferred.
