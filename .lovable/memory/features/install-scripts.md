---
name: install-scripts
description: Cross-platform bootstrap (slides-install.sh + slides-install.ps1) that fetches spec/slides, src/slides, front-end/slide-template from coding-guidelines-v17 main, runs bun/npm install, and starts the dev server. One-liner: curl ... | bash  /  irm ... | iex.
type: feature
---

## What
v0.115 added two cross-platform bootstrap scripts so anyone can spin up the slide-authoring environment in one line.

## Files
- `slides-install.sh` (Unix bash, `set -euo pipefail`).
- `slides-install.ps1` (Windows PowerShell, `[CmdletBinding()]`).

## Source repo
Both scripts pull from `https://codeload.github.com/alimtvnetwork/coding-guidelines-v17/tar.gz/refs/heads/main` (zip on Windows). User answered with that exact slug — keep it canonical.

## Folders staged (src in archive → dest under target)
- `spec/slides → spec/slides`
- `src/slides → src/slides`
- `front-end/slide-template → front-end/slide-template`

If the user expands scope later (e.g. adding `.lovable/memory/`), add to BOTH the `MAPPING` array (sh) and the `$Mapping` array (ps1).

## Flags (parity across both scripts)
- `--target <dir>` / `-Target <dir>` — install destination, default cwd.
- `--no-install` / `-NoInstall` — skip `bun install`.
- `--no-start` / `-NoStart` — skip `bun run dev`.
- `--offline` / `-Offline` — refuse network; requires local archive.
- `--use-local-archive PATH` / `-UseLocalArchive PATH` — implies offline.
- `-h/--help` / `-Help` — show help and exit 0 before any side effects.

## Exit codes (must stay in sync with README table)
0 success · 1 generic · 2 offline-but-net-needed · 3 download failed · 4 verification failed.

## Auto-start behavior
After staging + install, scripts `exec bun run dev` (sh) or run `bun run dev` (ps1). Falls back to npm if bun is missing. User explicitly approved "Stage files + run install + start dev server".

## Conventions adapted from
`alimtvnetwork/coding-guidelines-v17/slides-install.{sh,ps1}` — banner format, archive-root resolution (codeload wraps content in `<repo>-<ref>/`), exit-code table.
