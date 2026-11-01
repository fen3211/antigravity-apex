<#
.SYNOPSIS
    Antigravity Apex root launcher delegating to scripts/get.ps1
#>
$scriptPath = Join-Path $PSScriptRoot "scripts\get.ps1"
& $scriptPath @args
