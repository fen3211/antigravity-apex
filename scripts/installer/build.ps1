$ErrorActionPreference = "Stop"
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Building Antigravity-Apex-Setup.exe with csc.exe" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    $csc = "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}

if (-not (Test-Path $csc)) {
    Write-Error "Microsoft .NET Framework 4.0+ C# Compiler (csc.exe) not found!"
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$sourceFile = Join-Path $scriptDir "Program.cs"
$outFile = Join-Path $projectRoot "Antigravity-Apex-Setup.exe"

Write-Host "Using C# Compiler: $csc" -ForegroundColor Gray
Write-Host "Source: $sourceFile" -ForegroundColor Gray
Write-Host "Output: $outFile" -ForegroundColor Gray

& $csc /target:exe /out:$outFile /optimize+ /r:System.Windows.Forms.dll /r:System.Drawing.dll $sourceFile

if ($LASTEXITCODE -eq 0) {
    $binDir = Join-Path $projectRoot "bin"
    if (-not (Test-Path $binDir)) {
        New-Item -ItemType Directory -Path $binDir | Out-Null
    }
    Copy-Item -Path $outFile -Destination (Join-Path $binDir "Antigravity-Apex-Setup.exe") -Force
    Write-Host "[SUCCESS] Compiled Antigravity-Apex-Setup.exe successfully (root & bin/)!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Compilation failed with code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
