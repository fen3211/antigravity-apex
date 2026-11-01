<#
.SYNOPSIS
    Runs the AI Command Center diagnostic health checks on Windows.

.DESCRIPTION
    Executes scripts/doctor.js using Node.js, validating prerequisites,
    17 agent definitions, rules, skills, and database integrity.
#>

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$DoctorJs = Join-Path $ScriptDir "doctor.js"

if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not found in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js >= 18 from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Push-Location $ProjectRoot
try {
    node $DoctorJs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
