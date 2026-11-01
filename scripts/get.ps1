<#
.SYNOPSIS
    One-line remote installer for AI Command Center on Windows.
.DESCRIPTION
    Usage:
        irm https://raw.githubusercontent.com/fen3211/ai-command-center/main/scripts/get.ps1 | iex
#>

$ErrorActionPreference = "Stop"

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "    AI COMMAND CENTER -- ONE-LINE REMOTE INSTALLER (WINDOWS)           " -ForegroundColor White
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ (https://nodejs.org/) or run:" -ForegroundColor Yellow
    Write-Host "    winget install OpenJS.NodeJS.LTS" -ForegroundColor White
    exit 1
}

$nodeVersion = (node -v).Trim()
Write-Host "  [✓] Node.js detected: $nodeVersion" -ForegroundColor Green

# 2. Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git (https://git-scm.com/) or run:" -ForegroundColor Yellow
    Write-Host "    winget install Git.Git" -ForegroundColor White
    exit 1
}

Write-Host "  [✓] Git detected" -ForegroundColor Green

# 3. Clone or update repository
$TargetDir = Join-Path $PWD "ai-command-center"

if (Test-Path (Join-Path $PWD "package.json")) {
    $pkgJson = Get-Content (Join-Path $PWD "package.json") -Raw
    if ($pkgJson -match '"name":\s*"ai-command-center"') {
        $TargetDir = $PWD
        Write-Host "  [✓] Current directory is already ai-command-center: $TargetDir" -ForegroundColor Green
    }
}

if ($TargetDir -ne $PWD) {
    if (-not (Test-Path $TargetDir)) {
        Write-Host "  [i] Cloning repository to $TargetDir..." -ForegroundColor Cyan
        git clone https://github.com/fen3211/ai-command-center.git $TargetDir
    } else {
        Write-Host "  [i] Existing folder found at $TargetDir, updating..." -ForegroundColor Cyan
        Set-Location $TargetDir
        git pull origin main --ff-only
    }
    Set-Location $TargetDir
}

# 4. Run Setup
Write-Host "  [i] Launching 1-Click setup..." -ForegroundColor Cyan
& ".\setup.cmd"
