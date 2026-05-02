---
name: LLM authoring pack
description: Canonical instruction pack at spec/slides/llm/ for any LLM authoring slides; supersedes legacy /spec/slides/NN-*.md
type: reference
---

# LLM Authoring Pack

**Location:** `spec/slides/llm/` (files 00–19 + `assets/`)

**Status as of v0.81.2:** Canonical. Supersedes legacy
`/spec/slides/NN-*.md` specs (which remain as append-only history).

## Reading order for any LLM touching the deck

1. `00-README.md` — orientation + 10 commandments
2. `01-architecture-and-files.md` — file map
3. `02-step-system-complete.md` — StepTimeline playbook
4. `03-sound-system-complete.md` — sound asset table + wiring
5. `04-ambient-and-title-background.md` — ambient + title build
6. `05-design-tokens-and-theme.md` — token rules
7. `06-json-authoring-cheatsheet.md` — copy-paste JSON per type
8. `07–14` — canvas, background, title bg, type, color, steps,
   motion, sound (deep dives)
9. `15-authoring-template.md` — JSON envelope + variety guard
10. `16-voice-to-slide-protocol.md` — six-question intake
11. `17-do-and-dont.md` — approved vs forbidden patterns
12. `18-acceptance-checklist.md` — 40-box pass/fail gate
13. `19-remediation-pack.md` — ASCII references, new-type recipe,
    required-fields table, variety collision matrix

## Audit trail

- `spec/audit/01-blind-llm-gap-analysis.md` — legacy specs: **7.0/10**
- `spec/audit/02-blind-llm-gap-analysis-v2.md` — pack pre-remediation: **8.9/10**
- `spec/audit/03-blind-llm-reaudit.md` — pack post-remediation: **9.6/10** (ship gate ≥9.5 passed)

## Apply when

- Adding a new slide instance → start at file 16 (intake) → file 06
  (template) → file 15 (envelope) → file 18 (checklist).
- Adding a brand-new `slideType` → file 19 §G2 (5-step recipe).
- Picking transition + textAnimation → file 19 §G4 (collision matrix).
- Asked "what fields does X need" → file 19 §G3 (required-fields table).
