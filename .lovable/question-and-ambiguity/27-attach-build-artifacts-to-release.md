# 27 · Attach production build artifacts to the v1.1.0 GitHub Release

**Date:** 2026-04-30
**Trigger:** User: "Export and attach the production build artifacts (zip or static output) to the v1.1.0 release automatically."

## What shipped

Extended `.github/workflows/release.yml` with a new **"Package dist artifacts"** step (between `Measure dist` and `Extract changelog`) and updated **"Publish GitHub Release"** to upload the assets.

For every release, the workflow now produces, attaches, and surfaces in the body:

- `riseup-asia-slides-v<version>.zip` — recursive `zip -r -q -X` of the staged build (no extra Mac/file metadata; falls back to a Python `zipfile` shim if `zip` is missing on a self-hosted runner).
- `riseup-asia-slides-v<version>.tar.gz` — `tar -czf` of the same staged tree.
- `SHA256SUMS` — `sha256sum`-format sidecar listing both archives, so downloaders can verify integrity with `sha256sum -c SHA256SUMS`.

Both archives stage the build under a versioned top-level dir (`riseup-asia-slides-v1.1.0/index.html`, not a bare `dist/`) so extracting somewhere and pointing any HTTP server with SPA fallback at the directory just works.

The release body now has an **Artifacts** table with:
- linked filenames (`<repo>/releases/download/<tag>/<name>`),
- human-readable sizes,
- SHA-256 hashes inline.

`action-gh-release` is called with `files:` listing both archives + `SHA256SUMS`, and `fail_on_unmatched_files: true` so a packaging regression breaks the release loudly instead of publishing an empty assets list.

## Verification

Local smoke test in `/tmp` (mirroring the workflow steps):

```
artifacts-smoke/
  SHA256SUMS                         # sha256sum -c SHA256SUMS → OK / OK
  riseup-asia-slides-v1.1.0.tar.gz
  riseup-asia-slides-v1.1.0.zip
```

`sha256sum -c SHA256SUMS` round-trips clean for both archives.

## Decisions

- **Two formats (zip + tar.gz), not one.** Zip is the universal default for non-technical recipients on Windows; tar.gz stays the preferred format for Linux deployers and CI pipelines. The cost is a few extra seconds and ~2× release-asset disk; the upside is no friction for either audience.
- **Versioned top-level dir inside archives.** Avoids the classic "extract dumped files into the current directory" footgun.
- **`SHA256SUMS` sidecar, not detached signatures.** No code-signing key is provisioned; a checksum file is the honest level of assurance and is verifiable with stock `coreutils`.
- **No GitHub Actions artifact upload.** The release assets ARE the artifacts — duplicating to the workflow's own artifact store would be redundant churn.

## Why no question

No-questions mode (27/40). The user's "zip or static output" wording was permissive ("or"), so I went with both formats — the marginal cost is small and it covers both common consumer profiles. If only one is wanted, dropping the tar.gz is a one-line change in the workflow.
