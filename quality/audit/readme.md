# Audit — Spec vs. Implementation Gap Analysis

**Created:** 2026-05-01
**Tracked in:** `plan.md` Phase 2.
**Status:** Scaffolding only. Subsystem files + scoring populated when the user says `next` to begin Phase 2.

## Purpose

Honest, file-cited delta between *what the spec says the slide system does* and *what the running code under `src/slides/` + `front-end/project/**` actually does*. Detailed enough that a "blind" AI given only the spec could answer:

> "How much of the actual implementation could I rebuild from spec alone, and where would I get it wrong?"

## Folder layout

```
audit/
  readme.md                         (this file)
  00-methodology.md
  01-inventory-spec.md
  02-inventory-implementation.md
  03-gap-matrix.md
  subsystems/
    01-slide-types.md
    02-animation-system.md
    03-navigation-and-url.md
    04-share-and-deep-link.md
    05-click-reveal.md
    06-controller.md
    07-branding.md
    08-typography-and-tokens.md
    09-import-export-json.md
    10-audio-and-narration.md
    11-keyboard-and-accessibility.md
    12-reduced-motion.md
    13-static-deploy-and-asset-copy.md
    14-per-project-spec-workflow.md
    15-mermaid-and-erd.md
    16-equation-rendering.md
    17-number-animation.md
    18-data-table.md
  blind-ai-walkthrough.md
  ai-blind-score.md
  remediation-plan.md
```

## Distinct from `spec/audit/`

`spec/audit/` (00–07) is the **historical** blind-LLM audit series from Phase 1 → Phase 18. This new `/audit/` folder is the **current** snapshot keyed to the v1.1.0 release and the four-new-slide-types addendum (`spec/21-slides-system/29-*.md`). The two coexist; future audits replace files in `/audit/` and are never deleted from `spec/audit/`.

## Severity scale (`GapSeverityEnum`)

| Value | Meaning |
|---|---|
| `Blocking` | Spec promise that does not work at all, or is wrong enough to mislead a blind AI into shipping a broken deck. |
| `Major` | Works partially or only via undocumented code paths. Blind AI would produce a degraded experience. |
| `Minor` | Works, but spec wording is ambiguous or the implementation is over/under-strict relative to the docs. |
| `None` | Spec and implementation match. |

See `00-methodology.md` for the full per-subsystem template.
