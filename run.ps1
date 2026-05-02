# run.ps1
# Local dev runner for the Riseup Asia slide deck.
# Usage (from project root, in PowerShell):
#   .\run.ps1                  # pull, install if needed, start dev server, open browser
#   .\run.ps1 -Slide 3         # open directly on slide 3
#   .\run.ps1 -NoPull          # skip git pull
#   .\run.ps1 -Port 8080       # use a custom port (default 8080)

[CmdletBinding()]
param(
    [int]$Slide = 1,
    [int]$Port = 8080,
    [switch]$NoPull,
    [switch]$NoInstall
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Test-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

# 1. Git pull
if (-not $NoPull) {
    if (Test-Command git) {
        Write-Step "Pulling latest changes from git..."
        try {
            git pull --ff-only
        } catch {
            Write-Host "git pull failed (continuing anyway): $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "git not found in PATH, skipping pull." -ForegroundColor Yellow
    }
} else {
    Write-Step "Skipping git pull (-NoPull)"
}

# 2. Pick a package manager (prefer bun, then npm)
$pkgManager = $null
if (Test-Command bun) {
    $pkgManager = "bun"
} elseif (Test-Command npm) {
    $pkgManager = "npm"
} else {
    Write-Host "Neither bun nor npm found. Install Node.js or Bun first." -ForegroundColor Red
    exit 1
}
Write-Host "Using package manager: $pkgManager" -ForegroundColor DarkGray

# 3. Install dependencies if node_modules missing
if (-not $NoInstall) {
    if (-not (Test-Path "node_modules")) {
        Write-Step "Installing dependencies ($pkgManager install)..."
        if ($pkgManager -eq "bun") {
            bun install
        } else {
            npm install
        }
    } else {
        Write-Host "node_modules already present, skipping install." -ForegroundColor DarkGray
    }
}

# 4. Start dev server in background
$url = "http://localhost:$Port/$Slide"
Write-Step "Starting dev server on port $Port..."

$env:PORT = "$Port"

if ($pkgManager -eq "bun") {
    $proc = Start-Process -FilePath "bun" -ArgumentList "run","dev","--","--port","$Port" -PassThru -NoNewWindow
} else {
    $proc = Start-Process -FilePath "npm" -ArgumentList "run","dev","--","--port","$Port" -PassThru -NoNewWindow
}

# 5. Wait until the server responds, then open the browser
Write-Step "Waiting for $url ..."
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 2
        if ($resp.StatusCode -ge 200) { $ready = $true; break }
    } catch {
        Start-Sleep -Milliseconds 1000
    }
}

if ($ready) {
    Write-Step "Opening $url in default browser..."
    Start-Process $url
} else {
    Write-Host "Server did not become ready in time. Open $url manually once Vite reports it." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Dev server PID: $($proc.Id). Press Ctrl+C in this window to stop." -ForegroundColor Green

# 6. Keep this window attached to the dev server so Ctrl+C stops it
try {
    Wait-Process -Id $proc.Id
} catch {
    # process already exited
}
