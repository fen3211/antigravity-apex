<#
.SYNOPSIS
    Installs the AI Development Director multi-agent configuration and connects it to Antigravity.

.DESCRIPTION
    Non-destructively deploys 17 specialized agent definitions, orchestration rules, and skills
    into ~/.gemini/config/plugins/ai-director and ~/.gemini/config.
    Includes automated prerequisite validation, timestamped backups, and diagnostic reporting.

.PARAMETER DryRun
    Simulate the installation without writing any files or creating directories.

.PARAMETER CheckOnly
    Only check prerequisites and environment health; exit with 0 if OK, 1 if critical error.

.PARAMETER Force
    Overwrite existing files without prompting (backups are still created unless explicitly suppressed).

.PARAMETER TargetGeminiDir
    Override default ~/.gemini base directory.

.EXAMPLE
    .\scripts\install.ps1
    .\scripts\install.ps1 -DryRun
    .\scripts\install.ps1 -CheckOnly
    .\scripts\install.ps1 -Force
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$CheckOnly,
    [switch]$Force,
    [string]$TargetGeminiDir = ""
)

$ErrorActionPreference = "Stop"

# Helper for colorized output
function Write-Status($symbol, $color, $title, $msg = "") {
    Write-Host "  [" -NoNewline
    Write-Host "$symbol" -ForegroundColor $color -NoNewline
    Write-Host "] $title" -NoNewline
    if ($msg) {
        Write-Host " - $msg" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

function Write-SectionHeader($title) {
    Write-Host ""
    Write-Host "=== $title ===" -ForegroundColor Cyan
}

Write-Host "=======================================================================" -ForegroundColor DarkCyan
Write-Host "    AI COMMAND CENTER - AGENT INFRASTRUCTURE INSTALLER                " -ForegroundColor White
Write-Host "    Target: Google Antigravity & AI Development Director Suite         " -ForegroundColor Gray
Write-Host "=======================================================================" -ForegroundColor DarkCyan

if ($DryRun) {
    Write-Host "  >> RUNNING IN DRY-RUN MODE (No filesystem changes will be made) <<" -ForegroundColor Yellow
}
if ($CheckOnly) {
    Write-Host "  >> RUNNING IN CHECK-ONLY MODE (Diagnostic audit only) <<" -ForegroundColor Magenta
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$AgentConfigDir = Join-Path $ProjectRoot "agent-config"

if (-not (Test-Path $AgentConfigDir)) {
    Write-Host "Error: agent-config directory not found at $AgentConfigDir" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# 1. PREREQUISITES VERIFICATION
# -----------------------------------------------------------------------------
Write-SectionHeader "1. Validating System Prerequisites"
$hasPrereqError = $false

# 1.1 Node.js
try {
    $nodeVersionOutput = node -v 2>$null
    if ($nodeVersionOutput -match 'v(\d+)\.') {
        $nodeMajor = [int]$matches[1]
        if ($nodeMajor -ge 18) {
            Write-Status "OK" Green "Node.js $nodeVersionOutput (>= v18 required)"
        } else {
            Write-Status "FAIL" Red "Node.js $nodeVersionOutput is too old" "Version >= 18 is required"
            $hasPrereqError = $true
        }
    } else {
        Write-Status "FAIL" Red "Node.js version check failed"
        $hasPrereqError = $true
    }
} catch {
    Write-Status "FAIL" Red "Node.js is not installed or not in PATH"
    $hasPrereqError = $true
}

# 1.2 npm
try {
    $npmVersion = npm -v 2>$null
    if ($npmVersion) {
        Write-Status "OK" Green "npm v$npmVersion"
    } else {
        Write-Status "FAIL" Red "npm is not found"
        $hasPrereqError = $true
    }
} catch {
    Write-Status "FAIL" Red "npm is not installed or not in PATH"
    $hasPrereqError = $true
}

# 1.3 git
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Status "OK" Green "$gitVersion"
    } else {
        Write-Status "WARN" Yellow "git not found" "Worktree and branch features will be disabled"
    }
} catch {
    Write-Status "WARN" Yellow "git not detected"
}

# 1.4 Antigravity CLI / Directories
$homeDir = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::UserProfile)
$baseGeminiDir = if ($TargetGeminiDir) { $TargetGeminiDir } else { Join-Path $homeDir ".gemini" }
$agyCliLocal = Join-Path $homeDir "AppData\Local\agy\bin\agy.exe"
$agyInPath = Get-Command "agy" -ErrorAction SilentlyContinue

$agyFound = $false
$agyPath = ""

if ($agyInPath) {
    $agyFound = $true
    $agyPath = $agyInPath.Source
    Write-Status "OK" Green "Antigravity CLI (in PATH)" $agyPath
} elseif (Test-Path $agyCliLocal) {
    $agyFound = $true
    $agyPath = $agyCliLocal
    Write-Status "OK" Green "Antigravity CLI (local)" $agyPath
} else {
    Write-Status "INFO" Yellow "Antigravity CLI (agy.exe) not found" "Command execution bridge will operate in mock/read-only mode"
}

# -----------------------------------------------------------------------------
# 2. ANTIGRAVITY DIRECTORIES DISCOVERY
# -----------------------------------------------------------------------------
Write-SectionHeader "2. Discovering Antigravity Directories"

$antigravityDir = Join-Path $baseGeminiDir "antigravity"
$configDir = Join-Path $baseGeminiDir "config"
$pluginsDir = Join-Path $configDir "plugins"
$aiDirectorPluginDir = Join-Path $pluginsDir "ai-director"
$targetAgentsDir = Join-Path $aiDirectorPluginDir "agents"
$targetRulesDir = Join-Path $aiDirectorPluginDir "rules"
$targetSkillsDir = Join-Path $aiDirectorPluginDir "skills"
$backupsDir = Join-Path $baseGeminiDir "backups"

Write-Status "INFO" Cyan "Base Gemini Directory" $baseGeminiDir
Write-Status "INFO" Cyan "Plugin Destination" $aiDirectorPluginDir

if (Test-Path $antigravityDir) {
    Write-Status "OK" Green "Antigravity directory exists" $antigravityDir
} else {
    Write-Status "WARN" Yellow "Antigravity directory not present yet" "Will be created or initialized by Antigravity"
}

if ($CheckOnly) {
    Write-SectionHeader "Diagnostic Check Summary"
    if ($hasPrereqError) {
        Write-Host "`nResult: FAILED. Missing critical prerequisites.`n" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "`nResult: PASSED. All prerequisites and directories verified.`n" -ForegroundColor Green
        exit 0
    }
}

# -----------------------------------------------------------------------------
# 3. BACKUP CREATION (Non-destructive)
# -----------------------------------------------------------------------------
Write-SectionHeader "3. Creating Backups"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupSessionDir = Join-Path $backupsDir "backup_ai_director_$timestamp"
$backupCount = 0

$backupMsg = if ($DryRun) { "[DryRun] $backupSessionDir" } else { $backupSessionDir }
if (Test-Path $aiDirectorPluginDir) {
    if (-not $DryRun) {
        if (-not (Test-Path $backupSessionDir)) {
            New-Item -ItemType Directory -Path $backupSessionDir -Force | Out-Null
        }
        Copy-Item -Path $aiDirectorPluginDir -Destination (Join-Path $backupSessionDir "ai-director") -Recurse -Force
        $backupCount++
    }
    Write-Status "OK" Green "Existing plugin backup created" $backupMsg
} else {
    Write-Status "INFO" Gray "No prior ai-director plugin directory found. Skipping backup."
}

# Check GEMINI.md in config root
$rootGeminiFile = Join-Path $configDir "GEMINI.md"
if (Test-Path $rootGeminiFile) {
    if (-not $DryRun) {
        if (-not (Test-Path $backupSessionDir)) {
            New-Item -ItemType Directory -Path $backupSessionDir -Force | Out-Null
        }
        Copy-Item -Path $rootGeminiFile -Destination (Join-Path $backupSessionDir "GEMINI.md") -Force
        $backupCount++
    }
    Write-Status "OK" Green "Existing config/GEMINI.md backed up"
}

# -----------------------------------------------------------------------------
# 4. DEPLOYING 17 AGENTS, RULES & SKILLS
# -----------------------------------------------------------------------------
Write-SectionHeader "4. Deploying AI Director Package"

$dirsToEnsure = @(
    $targetAgentsDir,
    $targetRulesDir,
    (Join-Path $targetSkillsDir "director-orchestration"),
    $backupsDir
)

foreach ($dir in $dirsToEnsure) {
    if (-not (Test-Path $dir)) {
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        Write-Status "CREATE" Cyan "Created directory" $dir
    }
}

# 4.1 Deploy Agents
$srcAgentsDir = Join-Path $AgentConfigDir "agents"
$agentFiles = Get-ChildItem -Path $srcAgentsDir -Filter "*.md"
$installedAgents = 0

foreach ($file in $agentFiles) {
    $dest = Join-Path $targetAgentsDir $file.Name
    if (-not $DryRun) {
        Copy-Item -Path $file.FullName -Destination $dest -Force
    }
    $installedAgents++
}
Write-Status "OK" Green "Deployed $installedAgents agent definitions" $targetAgentsDir

# 4.2 Deploy Rules
$srcRulesDir = Join-Path $AgentConfigDir "rules"
$rulesFiles = Get-ChildItem -Path $srcRulesDir -Filter "*.md"

foreach ($file in $rulesFiles) {
    $destPlugin = Join-Path $targetRulesDir $file.Name
    if (-not $DryRun) {
        Copy-Item -Path $file.FullName -Destination $destPlugin -Force
    }
    # Also deploy to $configDir/GEMINI.md and $configDir/AGENTS.md for global discovery
    $destConfig = Join-Path $configDir $file.Name
    if (-not $DryRun) {
        Copy-Item -Path $file.FullName -Destination $destConfig -Force
    }
    Write-Status "OK" Green "Deployed rule $($file.Name)" "$destPlugin & $destConfig"
}

# 4.3 Deploy Skills
$srcSkillDir = Join-Path $AgentConfigDir "skills\director-orchestration"
$destSkillDir = Join-Path $targetSkillsDir "director-orchestration"
if (Test-Path $srcSkillDir) {
    if (-not $DryRun) {
        if (-not (Test-Path $destSkillDir)) {
            New-Item -ItemType Directory -Path $destSkillDir -Force | Out-Null
        }
        Copy-Item -Path (Join-Path $srcSkillDir "*") -Destination $destSkillDir -Recurse -Force
    }
    Write-Status "OK" Green "Deployed director-orchestration skill" $destSkillDir
}

# 4.4 Deploy plugin.json manifest
$pluginJsonContent = @"
{
  "name": "ai-director",
  "version": "1.0.0",
  "description": "Antigravity AI Development Director Multi-Agent Orchestration Suite",
  "author": "AI Development Director",
  "agents": "./agents",
  "rules": "./rules",
  "skills": "./skills"
}
"@

$pluginJsonPath = Join-Path $aiDirectorPluginDir "plugin.json"
if (-not $DryRun) {
    Set-Content -Path $pluginJsonPath -Value $pluginJsonContent -Encoding UTF8
}
Write-Status "OK" Green "Created plugin manifest" $pluginJsonPath

# -----------------------------------------------------------------------------
# 5. SUMMARY & NEXT STEPS
# -----------------------------------------------------------------------------
Write-SectionHeader "5. Installation Completed Successfully"

Write-Host "
Summary:
  - 17 Agent Definitions: $targetAgentsDir
  - Rules (AGENTS.md, GEMINI.md): $targetRulesDir & $configDir
  - Orchestration Skills: $destSkillDir
  - Plugin Manifest: $pluginJsonPath
  - Backups Stored: $backupSessionDir

Next Steps:
  1. Run diagnostic self-check:
     npm run doctor
  2. Launch AI Command Center:
     npm run dev
     or double-click start.cmd
  3. Open Dashboard in browser:
     http://127.0.0.1:5173/
" -ForegroundColor White
