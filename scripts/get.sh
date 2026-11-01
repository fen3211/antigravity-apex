#!/usr/bin/env bash
# ==============================================================================
# Antigravity Apex - One-Line Remote Installer for Linux & macOS
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.sh | bash
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}=======================================================================${NC}"
echo -e "${CYAN}    ANTIGRAVITY APEX -- ONE-LINE REMOTE INSTALLER (UNIX/MACOS)        ${NC}"
echo -e "${CYAN}=======================================================================${NC}\n"

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Node.js is not installed!${NC}"
    echo -e "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}  [✓] Node.js detected: $(node -v)${NC}"

# 2. Check Git
if ! command -v git >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Git is not installed!${NC}"
    echo -e "Please install Git: sudo apt install git / brew install git"
    exit 1
fi
echo -e "${GREEN}  [✓] Git detected${NC}"

# 3. Clone or update repository
TARGET_DIR="${PWD}/antigravity-apex"

if [ -f "${PWD}/package.json" ] && grep -q '"name": "antigravity-apex"' "${PWD}/package.json" 2>/dev/null; then
    TARGET_DIR="${PWD}"
    echo -e "${GREEN}  [✓] Current directory is already antigravity-apex${NC}"
fi

if [ "${TARGET_DIR}" != "${PWD}" ]; then
    if [ ! -d "${TARGET_DIR}" ]; then
        echo -e "${CYAN}  [i] Cloning repository to ${TARGET_DIR}...${NC}"
        git clone https://github.com/fen3211/antigravity-apex.git "${TARGET_DIR}"
    else
        echo -e "${CYAN}  [i] Existing folder found at ${TARGET_DIR}, updating...${NC}"
        cd "${TARGET_DIR}"
        git pull origin main --ff-only
    fi
    cd "${TARGET_DIR}"
fi

# 4. Run Setup
echo -e "${CYAN}  [i] Launching 1-Click setup...${NC}"
chmod +x ./setup.sh
exec ./setup.sh
