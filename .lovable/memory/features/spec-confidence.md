---
name: spec-confidence
description: Pre-render gate in src/slides/specConfidence.ts that scores a deck 0–100 across four categories — contract (Zod), unknown-enum (transition/textAnimation), unknown-field (top-level typos vs KNOWN_SLIDE_FIELDS allowlist), motion-variety (adjacent linear collisions). Bands excellent≥95 / good≥80 / fair≥50 / poor<50. `assertHighConfidence(slides, min=80)` throws below threshold. Loader logs `[deck] ✓ spec confidence: N/100 (band) — …` on boot.
type: feature
---

## Surface
- `auditSpecConfidence(slides: SlideSpec[]) → SpecConfidenceReport`
- `assertHighConfidence(slides, min = 80)` — throws below threshold
- `KNOWN_SLIDE_FIELDS` — the parity guard. Adding a new top-level SlideSpec field requires extending this allowlist (or a parity test fails).

## Penalties
| Category | Severity | Penalty | Source |
|---|---|---|---|
| `contract` | hard | −10 | `validateSlide` (Zod) |
| `unknown-enum` | hard | −10 | `transition` ∉ SlideTransition · `textAnimation` ∉ TextAnimation |
| `unknown-field` | soft | −2 | top-level keys absent from `KNOWN_SLIDE_FIELDS` |
| `motion-variety` | soft | −2 | `detectMotionCollisions` adjacent-linear pairs |

## Integration
- `src/slides/loader.ts` exports `specConfidence` and logs a one-line boot summary per deck.
- Tests: `src/test/specConfidence.test.ts` (12 tests).

## See also
- `updates/spec/20-spec-confidence-validator.md`
- Companion: `src/slides/schema.ts` (Zod), `scripts/motion-variety-audit.ts`
