# 00 — Methodology

## Sources of truth

**Spec (what the system *should* do):**
- `spec/21-slides-system/**` — system rules (00-README, 06-json-authoring-cheatsheet, 23-slide-type-contracts, 28-component-and-animation-catalog, **29-narrow-idea-and-new-slide-types** — addendum).
- `spec/21-slides-system/llm/CATALOG.json` — machine-readable enum truth.
- `spec/26-slide-definitions/**` — per-deck slide specs (JSON+MD pairs).
- `.lovable/memory/**` — design constraints + features.
- `.lovable/prompts/01-no-questions.md` — operating-mode rule.

**Implementation (what the system *actually* does):**
- `src/slides/**` — runtime: types, schema, loader, SlideStage, components, sound, runtimeImageQA, transitionOverride, etc.
- `src/pages/**` — routing surfaces.
- `src/App.tsx` — route table.
- `src/test/**` — contract + visual + behavioral tests (treat passing tests as part of the implementation contract).
- `front-end/project/<slug>/**` — concrete decks consumed at runtime.
- `front-end/slide-template/**` — per-type author templates.
- `front-end/themes/**` — theme JSON overlays.
- `scripts/**` — build-time and audit tooling.

## Per-subsystem template (mandatory)

Every file under `audit/subsystems/` follows this exact structure:

```markdown
# Subsystem: <Name>

## Spec Statement
<verbatim or summarized requirement, with file refs (path:line-range)>

## Implementation State
<what exists in code today, with file refs (path:line-range)>

## Gap
<delta between spec and implementation, bulleted>

## Severity
Blocking | Major | Minor | None

## Evidence
- spec: spec/21-slides-system/...
- impl: src/slides/...
- test: src/test/...

## Remediation
<concrete ordered steps to close the gap>
```

## Severity assignment rules

1. If a blind AI given only the spec would produce a deck that fails to load → `Blocking`.
2. If it would load but lose a documented feature (audio, click-reveal, share, controller hover) → `Major`.
3. If it would work but visibly drift from the house style (wrong easing, wrong capsule color rule) → `Minor`.
4. If spec and implementation are in lockstep → `None`.

## Blind-AI walkthrough rules

For each subsystem, `blind-ai-walkthrough.md` records:
1. Would a blind AI produce the correct output? (`yes` / `partial` / `no`)
2. Top ambiguities a blind AI would hit (≤3 bullets).
3. Most likely wrong guess (1 bullet).
4. Confidence score 0–10 (10 = spec is unambiguous and complete; 0 = blind AI would produce something unrecognizable).

## Score weighting (`ai-blind-score.md`)

```
weighted = Σ ( score_subsystem × weight_subsystem ) / Σ weight_subsystem
```

Weights (sum = 100):

| Subsystem | Weight |
|---|---|
| 01 slide-types | 12 |
| 02 animation-system | 10 |
| 03 navigation-and-url | 8 |
| 04 share-and-deep-link | 4 |
| 05 click-reveal | 6 |
| 06 controller | 6 |
| 07 branding | 6 |
| 08 typography-and-tokens | 8 |
| 09 import-export-json | 8 |
| 10 audio-and-narration | 5 |
| 11 keyboard-and-accessibility | 5 |
| 12 reduced-motion | 5 |
| 13 static-deploy-and-asset-copy | 4 |
| 14 per-project-spec-workflow | 5 |
| 15 mermaid-and-erd | 2 |
| 16 equation-rendering | 2 |
| 17 number-animation | 2 |
| 18 data-table | 2 |

(Subsystems 15–18 carry low weight because they describe Phase 3 work that does not yet exist in the implementation; they will rise once shipped.)

## Remediation plan grouping

`remediation-plan.md` groups items by phase:
- **Phase 1 — Blocking** (must-fix before next release).
- **Phase 2 — Major** (next minor version).
- **Phase 3 — Minor** (backlog / polish).

Each item: `Title`, `Severity`, `EstimatedEffort` (S/M/L), `Owner` (default: implementing AI), `DependsOn` (other item ids).
