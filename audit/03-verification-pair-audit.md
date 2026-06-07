# Audit 03 — Verification pair: `17-common-mistakes.md` + `18-acceptance-and-qa.md`

Audit target: the self-check half of the spec set — the anti-pattern catalog and
the acceptance/QA exit gate. Step 3 of the 10-step audit series.

Scoring rubric: how well a **blind AI implementer** could use these two files to
catch its own mistakes and prove the slide is shippable, with no extra context.

---

## Scores (1–100)

| Factor | `17` mistakes | `18` accept/QA | Notes |
| --- | ---: | ---: | --- |
| Clarity | 93 | 90 | `17` pairs each anti-pattern with the rule it breaks + the right move; `18` matrix is scannable. |
| Success criteria | 85 | 95 | `18`'s acceptance checklist is binary and tickable; `17` is corrective, not pass/fail. |
| Checklist quality | 82 | 96 | `18` is the strongest checklist in the series; `17` is a catalog, not a list. |
| Self-containment | 88 | 86 | Both cite sibling files for detail but state the core rule inline. |
| Failure-mode coverage | 95 | 90 | `17` is purpose-built for failure modes; `18` covers theme × motion × sound × nav. |
| Verifiability (can an agent self-test?) | 84 | 94 | `18` maps to real tests (`stepTimelineGithubLightContrast.test.ts`); `17` relies on review. |
| Token/guardrail compliance | 96 | 95 | Both enforce token-only + capsule-className rules. |
| **Composite blind-implementation score** | **89** | **92** | Pair composite **90.5/100** — the verification layer is the series' strongest. |

## Top weaknesses (ranked)

1. **`17` has no severity ranking** — all 7 anti-patterns read as equal weight; a
   blind agent can't triage. *Fix:* tag each as blocker / warning.
2. **`18` QA matrix lacks expected-result cells** — it lists axes/values but not
   the exact pass condition per cell. *Fix:* add an "expected" column.
3. **No cross-link from `17` → `18`** — the catalog doesn't point to the gate
   that would catch each mistake. *Fix:* add "caught by `18` row X" per item.

## What's already excellent

- `18`'s acceptance checklist + contrast/reduced-motion guards are directly
  testable and tie to a real test file.
- `17` consistently grounds each anti-pattern in a numbered coding-guideline rule.

## Verdict

Pair composite **90.5/100** — the highest so far. These two close the
implement→verify loop well; the three fixes above are polish, not blockers.
