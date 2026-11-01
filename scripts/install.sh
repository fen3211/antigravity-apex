#!/usr/bin/env bash
# =============================================================================
# AI COMMAND CENTER - AGENT INFRASTRUCTURE INSTALLER (POSIX / macOS / Linux)
# Target: Google Antigravity & AI Development Director Suite
# =============================================================================

set -euo pipefail

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

DRY_RUN=false
CHECK_ONLY=false
FORCE=false
TARGET_GEMINI_DIR=""

usage() {
    cat <<EOF
Usage: ./scripts/install.sh [OPTIONS]

Options:
  --dry-run           Simulate installation without making filesystem changes
  --check-only        Verify system prerequisites and directories, then exit
  --force             Overwrite files without interactive prompt
  --target-dir <path> Override ~/.gemini base destination directory
  -h, --help          Show this help message
EOF
    exit 0
}

# Parse command line flags
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --check-only)
            CHECK_ONLY=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --target-dir)
            TARGET_GEMINI_DIR="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

print_status() {
    local symbol="$1"
    local color="$2"
    local title="$3"
    local msg="${4:-}"
    if [[ -n "$msg" ]]; then
        echo -e "  [${color}${symbol}${NC}] ${title} ${GRAY}- ${msg}${NC}"
    else
        echo -e "  [${color}${symbol}${NC}] ${title}"
    fi
}

print_header() {
    echo ""
    echo -e "${CYAN}=== $1 ===${NC}"
}

echo -e "${CYAN}=======================================================================${NC}"
echo -e "${WHITE}    AI COMMAND CENTER - AGENT INFRASTRUCTURE INSTALLER                ${NC}"
echo -e "${GRAY}    Target: Google Antigravity & AI Development Director Suite         ${NC}"
echo -e "${CYAN}=======================================================================${NC}"

if [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${YELLOW}>> RUNNING IN DRY-RUN MODE (No filesystem changes will be made) <<${NC}"
fi
if [[ "$CHECK_ONLY" == true ]]; then
    echo -e "  ${MAGENTA}>> RUNNING IN CHECK-ONLY MODE (Diagnostic audit only) <<${NC}"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AGENT_CONFIG_DIR="$PROJECT_ROOT/agent-config"

if [[ ! -d "$AGENT_CONFIG_DIR" ]]; then
    echo -e "${RED}Error: agent-config directory not found at $AGENT_CONFIG_DIR${NC}"
    exit 1
fi

# -----------------------------------------------------------------------------
# 1. PREREQUISITES VERIFICATION
# -----------------------------------------------------------------------------
print_header "1. Validating System Prerequisites"
HAS_PREREQ_ERROR=false

# 1.1 Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION="$(node -v)"
    NODE_MAJOR="$(echo "$NODE_VERSION" | sed -E 's/v([0-9]+)\..*/\1/')"
    if [[ "$NODE_MAJOR" -ge 18 ]]; then
        print_status "OK" "$GREEN" "Node.js $NODE_VERSION (>= v18 required)"
    else
        print_status "FAIL" "$RED" "Node.js $NODE_VERSION is too old" "Version >= 18 is required"
        HAS_PREREQ_ERROR=true
    fi
else
    print_status "FAIL" "$RED" "Node.js is not installed or not in PATH"
    HAS_PREREQ_ERROR=true
fi

# 1.2 npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION="$(npm -v)"
    print_status "OK" "$GREEN" "npm v$NPM_VERSION"
else
    print_status "FAIL" "$RED" "npm is not installed or not in PATH"
    HAS_PREREQ_ERROR=true
fi

# 1.3 git
if command -v git >/dev/null 2>&1; then
    GIT_VERSION="$(git --version)"
    print_status "OK" "$GREEN" "$GIT_VERSION"
else
    print_status "WARN" "$YELLOW" "git not found" "Worktree and branch features will be disabled"
fi

# 1.4 Antigravity CLI
BASE_GEMINI_DIR="${TARGET_GEMINI_DIR:-$HOME/.gemini}"
AGY_CLI_LOCAL="$HOME/.local/bin/agy"

if command -v agy >/dev/null 2>&1; then
    AGY_PATH="$(command -v agy)"
    print_status "OK" "$GREEN" "Antigravity CLI (in PATH)" "$AGY_PATH"
elif [[ -x "$AGY_CLI_LOCAL" ]]; then
    print_status "OK" "$GREEN" "Antigravity CLI (local)" "$AGY_CLI_LOCAL"
else
    print_status "INFO" "$YELLOW" "Antigravity CLI (agy) not found in PATH" "Command execution bridge will operate in mock/read-only mode"
fi

# -----------------------------------------------------------------------------
# 2. ANTIGRAVITY DIRECTORIES DISCOVERY
# -----------------------------------------------------------------------------
print_header "2. Discovering Antigravity Directories"

ANTIGRAVITY_DIR="$BASE_GEMINI_DIR/antigravity"
CONFIG_DIR="$BASE_GEMINI_DIR/config"
PLUGINS_DIR="$CONFIG_DIR/plugins"
AI_DIRECTOR_PLUGIN_DIR="$PLUGINS_DIR/ai-director"
TARGET_AGENTS_DIR="$AI_DIRECTOR_PLUGIN_DIR/agents"
TARGET_RULES_DIR="$AI_DIRECTOR_PLUGIN_DIR/rules"
TARGET_SKILLS_DIR="$AI_DIRECTOR_PLUGIN_DIR/skills"
BACKUPS_DIR="$BASE_GEMINI_DIR/backups"

print_status "INFO" "$CYAN" "Base Gemini Directory" "$BASE_GEMINI_DIR"
print_status "INFO" "$CYAN" "Plugin Destination" "$AI_DIRECTOR_PLUGIN_DIR"

if [[ -d "$ANTIGRAVITY_DIR" ]]; then
    print_status "OK" "$GREEN" "Antigravity directory exists" "$ANTIGRAVITY_DIR"
else
    print_status "WARN" "$YELLOW" "Antigravity directory not present yet" "Will be created or initialized by Antigravity"
fi

if [[ "$CHECK_ONLY" == true ]]; then
    print_header "Diagnostic Check Summary"
    if [[ "$HAS_PREREQ_ERROR" == true ]]; then
        echo -e "\n${RED}Result: FAILED. Missing critical prerequisites.${NC}\n"
        exit 1
    else
        echo -e "\n${GREEN}Result: PASSED. All prerequisites and directories verified.${NC}\n"
        exit 0
    fi
fi

# -----------------------------------------------------------------------------
# 3. BACKUP CREATION (Non-destructive)
# -----------------------------------------------------------------------------
print_header "3. Creating Backups"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_SESSION_DIR="$BACKUPS_DIR/backup_ai_director_$TIMESTAMP"

if [[ -d "$AI_DIRECTOR_PLUGIN_DIR" ]]; then
    if [[ "$DRY_RUN" == false ]]; then
        mkdir -p "$BACKUP_SESSION_DIR"
        cp -R "$AI_DIRECTOR_PLUGIN_DIR" "$BACKUP_SESSION_DIR/ai-director"
    fi
    BACKUP_MSG="$BACKUP_SESSION_DIR"
    if [[ "$DRY_RUN" == true ]]; then
        BACKUP_MSG="[DryRun] $BACKUP_SESSION_DIR"
    fi
    print_status "OK" "$GREEN" "Existing plugin backup created" "$BACKUP_MSG"
else
    print_status "INFO" "$GRAY" "No prior ai-director plugin directory found. Skipping backup."
fi

ROOT_GEMINI_FILE="$CONFIG_DIR/GEMINI.md"
if [[ -f "$ROOT_GEMINI_FILE" ]]; then
    if [[ "$DRY_RUN" == false ]]; then
        mkdir -p "$BACKUP_SESSION_DIR"
        cp "$ROOT_GEMINI_FILE" "$BACKUP_SESSION_DIR/GEMINI.md"
    fi
    print_status "OK" "$GREEN" "Existing config/GEMINI.md backed up"
fi

# -----------------------------------------------------------------------------
# 4. DEPLOYING 17 AGENTS, RULES & SKILLS
# -----------------------------------------------------------------------------
print_header "4. Deploying AI Director Package"

DIRS_TO_ENSURE=(
    "$TARGET_AGENTS_DIR"
    "$TARGET_RULES_DIR"
    "$TARGET_SKILLS_DIR/director-orchestration"
    "$BACKUPS_DIR"
)

for dir in "${DIRS_TO_ENSURE[@]}"; do
    if [[ ! -d "$dir" ]]; then
        if [[ "$DRY_RUN" == false ]]; then
            mkdir -p "$dir"
        fi
        print_status "CREATE" "$CYAN" "Created directory" "$dir"
    fi
done

# 4.1 Deploy Agents
SRC_AGENTS_DIR="$AGENT_CONFIG_DIR/agents"
INSTALLED_AGENTS=0

for file in "$SRC_AGENTS_DIR"/*.md; do
    if [[ -f "$file" ]]; then
        dest="$TARGET_AGENTS_DIR/$(basename "$file")"
        if [[ "$DRY_RUN" == false ]]; then
            cp "$file" "$dest"
        fi
        INSTALLED_AGENTS=$((INSTALLED_AGENTS + 1))
    fi
done
print_status "OK" "$GREEN" "Deployed $INSTALLED_AGENTS agent definitions" "$TARGET_AGENTS_DIR"

# 4.2 Deploy Rules
SRC_RULES_DIR="$AGENT_CONFIG_DIR/rules"

for file in "$SRC_RULES_DIR"/*.md; do
    if [[ -f "$file" ]]; then
        filename="$(basename "$file")"
        dest_plugin="$TARGET_RULES_DIR/$filename"
        dest_config="$CONFIG_DIR/$filename"
        if [[ "$DRY_RUN" == false ]]; then
            cp "$file" "$dest_plugin"
            cp "$file" "$dest_config"
        fi
        print_status "OK" "$GREEN" "Deployed rule $filename" "$dest_plugin & $dest_config"
    fi
done

# 4.3 Deploy Skills & Templates
SKILLS_ROOT_DIR="$AGENT_CONFIG_DIR/skills"
if [[ -d "$SKILLS_ROOT_DIR" ]]; then
    for skill_path in "$SKILLS_ROOT_DIR"/*; do
        if [[ -d "$skill_path" ]]; then
            skill_name=$(basename "$skill_path")
            dest_skill="$TARGET_SKILLS_DIR/$skill_name"
            if [[ "$DRY_RUN" == false ]]; then
                mkdir -p "$dest_skill"
                cp -R "$skill_path"/* "$dest_skill/"
            fi
            print_status "OK" "$GREEN" "Deployed skill: $skill_name" "$dest_skill"
        fi
    done
fi

SRC_TEMPLATES_DIR="$AGENT_CONFIG_DIR/templates"
DEST_TEMPLATES_DIR="$AI_DIRECTOR_PLUGIN_DIR/templates"
if [[ -d "$SRC_TEMPLATES_DIR" ]]; then
    if [[ "$DRY_RUN" == false ]]; then
        mkdir -p "$DEST_TEMPLATES_DIR"
        cp -R "$SRC_TEMPLATES_DIR"/* "$DEST_TEMPLATES_DIR/"
    fi
    print_status "OK" "$GREEN" "Deployed agent templates" "$DEST_TEMPLATES_DIR"
fi

# 4.4 Deploy plugin.json manifest
PLUGIN_JSON_PATH="$AI_DIRECTOR_PLUGIN_DIR/plugin.json"
if [[ "$DRY_RUN" == false ]]; then
    cat <<EOF > "$PLUGIN_JSON_PATH"
{
  "name": "ai-director",
  "version": "1.0.0",
  "description": "Antigravity AI Development Director Multi-Agent Orchestration Suite",
  "author": "AI Development Director",
  "agents": "./agents",
  "rules": "./rules",
  "skills": "./skills"
}
EOF
fi
print_status "OK" "$GREEN" "Created plugin manifest" "$PLUGIN_JSON_PATH"

# -----------------------------------------------------------------------------
# 5. SUMMARY & NEXT STEPS
# -----------------------------------------------------------------------------
print_header "5. Installation Completed Successfully"

if [[ -d "$BACKUP_SESSION_DIR" ]]; then
    BACKUP_DISPLAY="$BACKUP_SESSION_DIR"
else
    BACKUP_DISPLAY="None (Fresh Installation)"
fi

cat <<EOF

Summary:
  - 17 Agent Definitions: $TARGET_AGENTS_DIR
  - Rules (AGENTS.md, GEMINI.md): $TARGET_RULES_DIR & $CONFIG_DIR
  - Orchestration Skills: $DEST_SKILL_DIR
  - Plugin Manifest: $PLUGIN_JSON_PATH
  - Backups Stored: $BACKUP_DISPLAY

Next Steps:
  1. Run diagnostic self-check:
     npm run doctor
  2. Launch AI Command Center:
     npm run dev
  3. Open Dashboard in browser:
     http://127.0.0.1:5173/

EOF
