#!/usr/bin/env bash
# =====================================================================
# slides-install.sh — Riseup Asia Slides bootstrap (Unix)
#
# Stages the slide-authoring scaffolding from
#   https://github.com/alimtvnetwork/coding-guidelines-v17 (branch: main)
# into the current directory, installs JS deps, and starts the dev
# server so you can give a prompt or voice and start authoring slides.
#
# Folders staged (src in archive → dest under target):
#   spec/slides              → spec/slides
#   src/slides               → src/slides
#   front-end/slide-template → front-end/slide-template
#
# Quick start (one-liner):
#   curl -fsSL https://raw.githubusercontent.com/alimtvnetwork/coding-guidelines-v17/main/slides-install.sh | bash
#
# Local:
#   ./slides-install.sh [--target <dir>] [--no-install] [--no-start]
#                       [--use-local-archive <path>] [--offline] [-h]
#
# Exit codes:
#   0 success · 1 generic failure · 2 offline-but-net-needed
#   3 archive download failed · 4 staged-folders verification failed
# =====================================================================

set -euo pipefail

REPO_SLUG="alimtvnetwork/coding-guidelines-v17"
BRANCH="main"
ARCHIVE_URL="https://codeload.github.com/${REPO_SLUG}/tar.gz/refs/heads/${BRANCH}"

TARGET="$(pwd)"
DO_INSTALL=true
DO_START=true
OFFLINE=false
LOCAL_ARCHIVE=""

# Mapping: src-in-archive | dest-under-target
MAPPING=(
  "spec/slides|spec/slides"
  "src/slides|src/slides"
  "front-end/slide-template|front-end/slide-template"
)

# ── Colors ────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  C_CYAN=$'\033[0;36m'; C_GREEN=$'\033[0;32m'; C_YELLOW=$'\033[1;33m'
  C_RED=$'\033[0;31m'; C_DIM=$'\033[2m'; C_NC=$'\033[0m'
else
  C_CYAN=""; C_GREEN=""; C_YELLOW=""; C_RED=""; C_DIM=""; C_NC=""
fi
step() { printf '%s▸ %s%s\n' "$C_CYAN" "$1" "$C_NC"; }
ok()   { printf '%s✓ %s%s\n' "$C_GREEN" "$1" "$C_NC"; }
warn() { printf '%s⚠ %s%s\n' "$C_YELLOW" "$1" "$C_NC"; }
err()  { printf '%s✗ %s%s\n' "$C_RED" "$1" "$C_NC" >&2; }

usage() {
  cat <<HELP
slides-install.sh — Riseup Asia Slides bootstrap

USAGE
  slides-install.sh [FLAGS]

FLAGS
  --target <dir>            Install destination (default: current dir).
  --no-install              Skip 'bun install' / 'npm install'.
  --no-start                Skip 'bun run dev' / 'npm run dev'.
  --use-local-archive PATH  Use a pre-staged main.tar.gz on disk
                            (implies --offline).
  --offline                 Refuse all network access. Requires
                            --use-local-archive, else exit 2.
  -h, --help                Show this help and exit.

WHAT IT DOES
  1. Downloads ${REPO_SLUG}@${BRANCH} as a tarball.
  2. Copies these folders into TARGET:
$(for p in "${MAPPING[@]}"; do printf '       • %s → %s\n' "${p%|*}" "${p#*|}"; done)
  3. Runs 'bun install' (or 'npm install' as fallback).
  4. Starts 'bun run dev' so the preview opens immediately.

EXIT CODES
  0 success · 1 generic · 2 offline-but-net-needed
  3 archive download failed · 4 verification failed
HELP
}

# ── Args ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target|--dest)        TARGET="$2"; shift 2 ;;
    --no-install)           DO_INSTALL=false; shift ;;
    --no-start)             DO_START=false; shift ;;
    --offline)              OFFLINE=true; shift ;;
    --use-local-archive)    LOCAL_ARCHIVE="$2"; OFFLINE=true; shift 2 ;;
    -h|--help)              usage; exit 0 ;;
    *) err "Unknown option: $1"; usage; exit 1 ;;
  esac
done

mkdir -p "$TARGET"
TARGET="$(cd "$TARGET" && pwd)"

# ── Banner ────────────────────────────────────────────────────────
echo ""
echo "${C_CYAN}════════════════════════════════════════════════════════${C_NC}"
echo "${C_CYAN}  📦 Riseup Asia Slides — install${C_NC}"
echo "${C_CYAN}     repo:    ${REPO_SLUG}${C_NC}"
echo "${C_CYAN}     branch:  ${BRANCH}${C_NC}"
echo "${C_CYAN}     target:  ${TARGET}${C_NC}"
if [[ -n "$LOCAL_ARCHIVE" ]]; then
  echo "${C_CYAN}     source:  local-archive (${LOCAL_ARCHIVE})${C_NC}"
else
  echo "${C_CYAN}     source:  ${ARCHIVE_URL}${C_NC}"
fi
$DO_INSTALL || echo "${C_YELLOW}     install: SKIPPED (--no-install)${C_NC}"
$DO_START   || echo "${C_YELLOW}     start:   SKIPPED (--no-start)${C_NC}"
echo "${C_CYAN}════════════════════════════════════════════════════════${C_NC}"
echo ""

have() { command -v "$1" >/dev/null 2>&1; }

# ── Acquire archive ───────────────────────────────────────────────
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
ARCHIVE_PATH="$WORK_DIR/source.tar.gz"

if [[ -n "$LOCAL_ARCHIVE" ]]; then
  if [[ ! -f "$LOCAL_ARCHIVE" ]]; then
    err "Local archive not found: $LOCAL_ARCHIVE"; exit 1
  fi
  cp "$LOCAL_ARCHIVE" "$ARCHIVE_PATH"
  ok "Using local archive: $LOCAL_ARCHIVE"
else
  if $OFFLINE; then
    err "--offline requires --use-local-archive"; exit 2
  fi
  step "Downloading $ARCHIVE_URL"
  if have curl; then
    curl -fsSL --retry 2 --retry-delay 1 -o "$ARCHIVE_PATH" "$ARCHIVE_URL" \
      || { err "Download failed"; exit 3; }
  elif have wget; then
    wget -qO "$ARCHIVE_PATH" "$ARCHIVE_URL" \
      || { err "Download failed"; exit 3; }
  else
    err "Neither curl nor wget found"; exit 1
  fi
  ok "Downloaded $(du -h "$ARCHIVE_PATH" | cut -f1)"
fi

# ── Extract ───────────────────────────────────────────────────────
step "Extracting archive"
EXTRACT_DIR="$WORK_DIR/extract"
mkdir -p "$EXTRACT_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$EXTRACT_DIR"

# Codeload tarballs wrap content in <repo>-<ref>/. Find the real root.
ARCHIVE_ROOT="$(find "$EXTRACT_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
if [[ -z "$ARCHIVE_ROOT" ]]; then
  err "Archive is empty or malformed"; exit 3
fi
ok "Archive root: $(basename "$ARCHIVE_ROOT")"

# ── Stage folders ─────────────────────────────────────────────────
step "Staging folders into $TARGET"
MISSING=()
for pair in "${MAPPING[@]}"; do
  src="${pair%|*}"; dest="${pair#*|}"
  src_path="$ARCHIVE_ROOT/$src"
  dest_path="$TARGET/$dest"
  if [[ ! -d "$src_path" ]]; then
    warn "  archive missing: $src"
    MISSING+=("$src")
    continue
  fi
  mkdir -p "$dest_path"
  # Use cp -a to preserve attrs; copy contents (not the dir itself).
  cp -a "$src_path/." "$dest_path/"
  ok "  $src → $dest_path"
done

if (( ${#MISSING[@]} > 0 )); then
  err "Missing folders in archive: ${MISSING[*]}"; exit 4
fi

# ── Install deps ──────────────────────────────────────────────────
if $DO_INSTALL; then
  step "Installing dependencies"
  cd "$TARGET"
  if [[ ! -f "package.json" ]]; then
    warn "No package.json in target — skipping install."
  elif have bun; then
    bun install || { err "bun install failed"; exit 1; }
    ok "bun install complete"
  elif have npm; then
    npm install || { err "npm install failed"; exit 1; }
    ok "npm install complete"
  else
    warn "Neither bun nor npm found — skipping install."
  fi
fi

# ── Start dev server ──────────────────────────────────────────────
if $DO_START; then
  step "Starting dev server"
  cd "$TARGET"
  if [[ ! -f "package.json" ]]; then
    warn "No package.json — cannot start dev server."
  elif have bun; then
    echo "${C_DIM}  (Ctrl+C to stop)${C_NC}"
    exec bun run dev
  elif have npm; then
    echo "${C_DIM}  (Ctrl+C to stop)${C_NC}"
    exec npm run dev
  else
    warn "Neither bun nor npm found — start the dev server manually."
  fi
fi

ok "Done."
