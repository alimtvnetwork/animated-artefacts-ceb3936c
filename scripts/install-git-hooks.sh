#!/usr/bin/env bash
# Installs project-managed git hooks into .git/hooks/.
#
# Idempotent: re-running overwrites only files we own (pre-push, etc.).
# Skipped silently when not inside a git worktree (e.g. tarball install).
#
# Wired into package.json `prepare` so `bun install` installs hooks
# automatically. Run manually with: `bash scripts/install-git-hooks.sh`.

set -euo pipefail

# Resolve repo root; bail quietly if we're not in a git checkout.
if ! git_root=$(git rev-parse --show-toplevel 2>/dev/null); then
  exit 0
fi

hooks_dir="$git_root/.git/hooks"
src_dir="$git_root/scripts/git-hooks"

# In some sandboxes / submodule layouts `.git` is a file pointing at the real
# gitdir. `git rev-parse --git-path hooks` resolves that for us.
if real_hooks=$(git -C "$git_root" rev-parse --git-path hooks 2>/dev/null); then
  # Resolve relative paths against the repo root.
  case "$real_hooks" in
    /*) hooks_dir="$real_hooks" ;;
    *)  hooks_dir="$git_root/$real_hooks" ;;
  esac
fi

# Bail quietly if the resolved hooks dir isn't writable (e.g. read-only
# worktree, CI bare clones, or sandboxes without a proper .git directory).
if ! mkdir -p "$hooks_dir" 2>/dev/null; then
  echo "[install-git-hooks] $hooks_dir not writable — skipping" >&2
  exit 0
fi

if [ ! -d "$src_dir" ]; then
  echo "[install-git-hooks] $src_dir missing — skipping" >&2
  exit 0
fi

installed=0
for src in "$src_dir"/*; do
  [ -f "$src" ] || continue
  name=$(basename "$src")
  dest="$hooks_dir/$name"
  cp "$src" "$dest"
  chmod +x "$dest"
  installed=$((installed + 1))
done

if [ "$installed" -gt 0 ]; then
  echo "[install-git-hooks] installed $installed hook(s) into .git/hooks/"
fi
