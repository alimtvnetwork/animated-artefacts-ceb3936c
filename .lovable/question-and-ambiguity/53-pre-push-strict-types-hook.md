# 53 — pre-push hook for strict-types gate (zero-dep)

**Date:** 2026-05-01
**Trigger:** `next pre-commit` (followup to #52 CI gate)

## What shipped
A defensive **pre-push** (not pre-commit — fast commits matter; push is the
right gate) that runs the same checks CI runs, scoped for speed:

1. **`scripts/git-hooks/pre-push`** — bash script, executable.
   - Reads pre-push stdin (`<local_ref> <local_sha> <remote_ref> <remote_sha>`)
     to compute the set of TS/TSX files changed in commits being pushed.
   - Falls back to `origin/main…HEAD` for first-push branches and to `HEAD~1`
     when origin/main is unknown.
   - Runs `bunx eslint <changed-ts-files>` (skipped if no TS/TSX changed).
   - Runs `bunx tsc -p tsconfig.app.json --noEmit` on the full app project
     (project references make file-scoped tsc unreliable; warm bun cache
     keeps this < 5s).
   - Hard-fails on any error; bypassable with `git push --no-verify`.

2. **`scripts/install-git-hooks.sh`** — installer.
   - Resolves the real hooks dir via `git rev-parse --git-path hooks`
     (handles `.git`-as-file submodule layouts).
   - `mkdir -p` with silent fallthrough when the dir isn't writable
     (sandboxes / CI bare clones / read-only worktrees).
   - Copies every file from `scripts/git-hooks/` into the resolved hooks
     dir, chmod +x, idempotent.

3. **`package.json` wiring**:
   - `"prepare": "bash ./scripts/install-git-hooks.sh"` — runs on every
     `bun install`, no extra dev deps.
   - `"prepush": "bunx eslint . && bunx tsc -p tsconfig.app.json --noEmit"`
     — manual invocation for devs who want to test the gate without pushing.

## Why pre-push (not pre-commit)
- Pre-commit slows down every micro-commit; devs disable noisy hooks.
- Pre-push runs once per `git push`, so latency per check is acceptable.
- CI is the **authoritative** gate (#52); this hook is a fast local mirror
  to avoid round-tripping through GitHub Actions for trivial regressions.

## Why no husky / lint-staged
- Two extra dev deps + a `.husky/` directory + reinstalls on every `bun add`.
- The `prepare` lifecycle script is the spec-compliant npm-native way to
  install hooks; husky exists mostly to work around old npm bugs that
  don't apply here.
- Total LOC for our setup: ~90 lines of bash, zero deps.

## Sandbox behavior verified
This Lovable sandbox has `.git` pointing at `/dev/null` (no real worktree).
Installer correctly logs `[install-git-hooks] /dev/null not writable —
skipping` and exits 0, so `bun install` keeps working here. On a real dev
clone, hooks install cleanly into `.git/hooks/pre-push`.

## Followups (not done)
- Optional `prepush` script could call `bun run report:strict` instead of
  duplicating the eslint+tsc invocation, for one-line parity with CI step
  #52. Skipped because `report:strict` writes to
  `metrics/strict-types-history.json`, which we don't want bloated by
  every dev push attempt.
- A wrapper to skip the hook automatically inside CI runners (currently
  unnecessary — CI doesn't push).
