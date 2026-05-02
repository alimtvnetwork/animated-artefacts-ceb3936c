<#
.SYNOPSIS
    Riseup Asia Slides bootstrap (Windows / PowerShell).

.DESCRIPTION
    Stages the slide-authoring scaffolding from
      https://github.com/alimtvnetwork/coding-guidelines-v17 (branch: main)
    into the current directory, installs JS deps, and starts the dev
    server so you can give a prompt or voice and start authoring slides.

    Folders staged (src in archive -> dest under target):
      spec/slides              -> spec/slides
      src/slides               -> src/slides
      front-end/slide-template -> front-end/slide-template

.PARAMETER Target
    Install destination (default: current directory).

.PARAMETER NoInstall
    Skip 'bun install' / 'npm install'.

.PARAMETER NoStart
    Skip 'bun run dev' / 'npm run dev'.

.PARAMETER UseLocalArchive
    Use a pre-staged main.zip on disk (implies -Offline).

.PARAMETER Offline
    Refuse all network access. Requires -UseLocalArchive, else exits 2.

.EXAMPLE
    irm https://raw.githubusercontent.com/alimtvnetwork/coding-guidelines-v17/main/slides-install.ps1 | iex

.EXAMPLE
    & ([scriptblock]::Create((irm https://raw.githubusercontent.com/alimtvnetwork/coding-guidelines-v17/main/slides-install.ps1))) -Target .\my-deck

.NOTES
    Exit codes:
      0 success · 1 generic · 2 offline-but-net-needed
      3 archive download failed · 4 verification failed
#>

[CmdletBinding()]
param(
    [string]$Target = "",
    [switch]$NoInstall,
    [switch]$NoStart,
    [string]$UseLocalArchive = "",
    [switch]$Offline,
    [Alias("?")]
    [switch]$Help
)

if ($Help) { Get-Help $PSCommandPath -Full; exit 0 }

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$RepoSlug   = "alimtvnetwork/coding-guidelines-v17"
$Branch     = "main"
$ArchiveUrl = "https://codeload.github.com/$RepoSlug/zip/refs/heads/$Branch"

$Mapping = @(
    [pscustomobject]@{ Src = "spec/slides";              Dest = "spec/slides" }
    [pscustomobject]@{ Src = "src/slides";               Dest = "src/slides" }
    [pscustomobject]@{ Src = "front-end/slide-template"; Dest = "front-end/slide-template" }
)

if ($UseLocalArchive) { $Offline = $true }

if ([string]::IsNullOrEmpty($Target)) { $Target = (Get-Location).Path }
New-Item -ItemType Directory -Path $Target -Force | Out-Null
$Target = (Resolve-Path $Target).Path

# ── Banner ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📦 Riseup Asia Slides — install" -ForegroundColor Cyan
Write-Host "     repo:    $RepoSlug" -ForegroundColor Cyan
Write-Host "     branch:  $Branch" -ForegroundColor Cyan
Write-Host "     target:  $Target" -ForegroundColor Cyan
if ($UseLocalArchive) {
    Write-Host "     source:  local-archive ($UseLocalArchive)" -ForegroundColor Cyan
} else {
    Write-Host "     source:  $ArchiveUrl" -ForegroundColor Cyan
}
if ($NoInstall) { Write-Host "     install: SKIPPED (-NoInstall)" -ForegroundColor Yellow }
if ($NoStart)   { Write-Host "     start:   SKIPPED (-NoStart)"   -ForegroundColor Yellow }
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

function Test-Cmd($name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }

# ── Acquire archive ───────────────────────────────────────────────
$WorkDir = Join-Path ([System.IO.Path]::GetTempPath()) ("slides-install-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $WorkDir -Force | Out-Null
$ArchivePath = Join-Path $WorkDir "source.zip"

try {
    if ($UseLocalArchive) {
        if (-not (Test-Path $UseLocalArchive)) {
            Write-Host "✗ Local archive not found: $UseLocalArchive" -ForegroundColor Red
            exit 1
        }
        Copy-Item $UseLocalArchive $ArchivePath -Force
        Write-Host "✓ Using local archive: $UseLocalArchive" -ForegroundColor Green
    } else {
        if ($Offline) {
            Write-Host "✗ -Offline requires -UseLocalArchive" -ForegroundColor Red
            exit 2
        }
        Write-Host "▸ Downloading $ArchiveUrl" -ForegroundColor Cyan
        try {
            Invoke-WebRequest -Uri $ArchiveUrl -OutFile $ArchivePath -UseBasicParsing
        } catch {
            Write-Host "✗ Download failed: $_" -ForegroundColor Red
            exit 3
        }
        $sizeKb = [math]::Round((Get-Item $ArchivePath).Length / 1KB, 1)
        Write-Host "✓ Downloaded ${sizeKb} KB" -ForegroundColor Green
    }

    # ── Extract ───────────────────────────────────────────────────
    Write-Host "▸ Extracting archive" -ForegroundColor Cyan
    $ExtractDir = Join-Path $WorkDir "extract"
    New-Item -ItemType Directory -Path $ExtractDir -Force | Out-Null
    Expand-Archive -Path $ArchivePath -DestinationPath $ExtractDir -Force

    # Codeload zips wrap content in <repo>-<ref>/. Find the real root.
    $ArchiveRoot = Get-ChildItem -Path $ExtractDir -Directory | Select-Object -First 1
    if (-not $ArchiveRoot) {
        Write-Host "✗ Archive is empty or malformed" -ForegroundColor Red
        exit 3
    }
    Write-Host "✓ Archive root: $($ArchiveRoot.Name)" -ForegroundColor Green

    # ── Stage folders ─────────────────────────────────────────────
    Write-Host "▸ Staging folders into $Target" -ForegroundColor Cyan
    $missing = @()
    foreach ($pair in $Mapping) {
        $srcPath  = Join-Path $ArchiveRoot.FullName $pair.Src
        $destPath = Join-Path $Target $pair.Dest
        if (-not (Test-Path $srcPath)) {
            Write-Host "⚠  archive missing: $($pair.Src)" -ForegroundColor Yellow
            $missing += $pair.Src
            continue
        }
        New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        Copy-Item -Path (Join-Path $srcPath '*') -Destination $destPath -Recurse -Force
        Write-Host "✓   $($pair.Src) -> $destPath" -ForegroundColor Green
    }

    if ($missing.Count -gt 0) {
        Write-Host "✗ Missing folders in archive: $($missing -join ', ')" -ForegroundColor Red
        exit 4
    }
} finally {
    if (Test-Path $WorkDir) { Remove-Item $WorkDir -Recurse -Force -ErrorAction SilentlyContinue }
}

# ── Install deps ──────────────────────────────────────────────────
if (-not $NoInstall) {
    Write-Host "▸ Installing dependencies" -ForegroundColor Cyan
    Set-Location $Target
    if (-not (Test-Path "package.json")) {
        Write-Host "⚠  No package.json in target — skipping install." -ForegroundColor Yellow
    } elseif (Test-Cmd "bun") {
        bun install
        if ($LASTEXITCODE -ne 0) { Write-Host "✗ bun install failed" -ForegroundColor Red; exit 1 }
        Write-Host "✓ bun install complete" -ForegroundColor Green
    } elseif (Test-Cmd "npm") {
        npm install
        if ($LASTEXITCODE -ne 0) { Write-Host "✗ npm install failed" -ForegroundColor Red; exit 1 }
        Write-Host "✓ npm install complete" -ForegroundColor Green
    } else {
        Write-Host "⚠  Neither bun nor npm found — skipping install." -ForegroundColor Yellow
    }
}

# ── Start dev server ──────────────────────────────────────────────
if (-not $NoStart) {
    Write-Host "▸ Starting dev server" -ForegroundColor Cyan
    Set-Location $Target
    if (-not (Test-Path "package.json")) {
        Write-Host "⚠  No package.json — cannot start dev server." -ForegroundColor Yellow
    } elseif (Test-Cmd "bun") {
        Write-Host "  (Ctrl+C to stop)" -ForegroundColor DarkGray
        bun run dev
    } elseif (Test-Cmd "npm") {
        Write-Host "  (Ctrl+C to stop)" -ForegroundColor DarkGray
        npm run dev
    } else {
        Write-Host "⚠  Neither bun nor npm found — start the dev server manually." -ForegroundColor Yellow
    }
}

Write-Host "✓ Done." -ForegroundColor Green
