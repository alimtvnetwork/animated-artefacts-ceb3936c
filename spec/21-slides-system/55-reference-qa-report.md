# Spec 55 — Reference QA report (CI artifact) — v0.163

## Why

The reference-asset manifest (spec 25 & `referenceAssetsManifest.ts`) and the
glyph/font invariants used by the Reference Gallery already have a vitest
guard. That guard is binary and verbose: when it fails, you have to scroll
through Vitest output to see *which* asset drifted or *which* glyph dropped.

Spec 55 adds a dedicated, single-pass report script that produces a compact
Markdown table — one row per asset, one row per glyph, one row per font
stack — and uploads it from CI as a build artifact. Reviewers can open the
artifact to see exactly what passed and failed without re-running anything.

## Script — `scripts/reference-qa-report.ts`

```bash
bun run qa:reference                 # writes reports/reference-qa.md
REFERENCE_QA_OUT=/tmp/qa.md bun run qa:reference
```

### Checks performed

1. **Asset checks** — for every entry in `REFERENCE_ASSETS`:
   - file exists on disk
   - file is non-empty
   - PNG signature is intact (via `decodePngDimensions`)
   - decoded `width × height` matches the manifest `expectedWidth × expectedHeight`
2. **Glyph checks** — for every entry in `REQUIRED_GLYPHS` (× · §):
   - the codepoint matches the pinned Unicode value (U+00D7, U+00B7, U+00A7)
3. **Font-stack checks** — for `display` and `body`:
   - the primary face (`Ubuntu` / `Inter`) is still listed in
     `tailwind.config.ts` (string match on `'Ubuntu'` / `'Inter'`)

### Exit codes (matches the other audits)

| Code | Meaning |
|---|---|
| `0` | All checks passed |
| `1` | Script error (couldn't read the manifest or `tailwind.config.ts`) |
| `2` | At least one asset / glyph / font-stack check failed |

### Output format

```markdown
# Reference QA report

_Generated 2026-04-27T08:00:00.000Z_

**14/14** checks passed (0 failed)

| Category | Item | Detail | Status |
|---|---|---|---|
| asset | `/reference/canvas/canvas-1920x1080.png` | 1920×1080 ✓ | ✅ pass |
| ... |
| glyph | `×` | U+00D7 ✓ | ✅ pass |
| font-stack | `display` | primary "Ubuntu" in tailwind.config.ts | ✅ pass |
```

When something fails, the same row gets `❌ fail` and a `## Failures`
section is appended at the bottom for fast scanning.

## CI wiring

`.github/workflows/ci.yml` runs `bun run qa:reference` after the resolution
audit step, then unconditionally uploads `reports/reference-qa.md` as the
`reference-qa-report` artifact (30-day retention). Failures stop the job
*before* the production build to save runner time.

```yaml
- name: Reference QA suite
  run: bun run qa:reference

- name: Upload reference QA report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: reference-qa-report
    path: reports/reference-qa.md
    retention-days: 30
```

The `if: always()` matters — when the script exits 2, GitHub still uploads
the report so the reviewer can see exactly which checks failed.

## Why this is separate from the vitest run

- `vitest` results live inside the runner log; an artifact survives the
  log being trimmed.
- The Markdown table is grep-friendly and copy-pasteable into a PR comment.
- The script has zero new dependencies (uses Node `fs` + the existing
  `decodePngDimensions` helper) so it runs identically on local and CI Bun.

## Related

- Spec 25 — Strict asset preload + slug validation
- Spec 53 — Asset-resolution audit (deck-asset content audit)
- Spec 54 — Runtime image QA (browser-side decode probe)
- This spec (55) — single, machine-readable Markdown summary for CI artifacts
