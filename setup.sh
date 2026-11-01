#!/usr/bin/env bash
# ==============================================================================
# Antigravity Apex - 1-Click Setup & Launch for Linux and macOS
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=======================================================================${NC}"
echo -e "${CYAN}    ANTIGRAVITY APEX -- ONE-CLICK INSTALLATION & LAUNCHER             ${NC}"
echo -e "${CYAN}    Target: Google Antigravity & AI Development Director Suite         ${NC}"
echo -e "${CYAN}=======================================================================${NC}\n"

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Node.js is not installed!${NC}"
    echo -e "Please install Node.js 18+ from https://nodejs.org/ or run:"
    echo -e "    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}[1/6] Node.js detected: ${NODE_VERSION} (OK)${NC}"

# 2. Check Git
if ! command -v git >/dev/null 2>&1; then
    echo -e "${YELLOW}[WARN] Git is not found in PATH. Continuing without git tracking...${NC}"
else
    echo -e "${GREEN}[2/6] Git detected (OK)${NC}"
fi

# 3. Setup environment file
if [ ! -f ".env" ]; then
    echo -e "${CYAN}[3/6] Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "      .env file created successfully."
else
    echo -e "${GREEN}[3/6] Existing .env file detected (OK)${NC}"
fi

# 4. Install npm dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}[4/6] Installing root dependencies (this may take a minute)...${NC}"
    npm install
else
    echo -e "${GREEN}[4/6] Root dependencies already installed (OK)${NC}"
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "${CYAN}      Installing client dependencies...${NC}"
    (cd client && npm install)
else
    echo -e "${GREEN}      Client dependencies already installed (OK)${NC}"
fi

# 5. Install Antigravity 17-Agent Suite non-destructively
echo -e "${CYAN}[5/6] Deploying 17 Specialist Agents & Director Rules to Antigravity...${NC}"
chmod +x ./scripts/install.sh
./scripts/install.sh --force || echo -e "${YELLOW}[WARN] Agent installer returned non-zero code.${NC}"

# 6. Run Diagnostic Doctor
echo -e "\n${CYAN}[6/6] Verifying system health with Diagnostic Doctor...${NC}"
node ./scripts/doctor.js || true

echo -e "\n${GREEN}=======================================================================${NC}"
echo -e "${GREEN}  INSTALLATION COMPLETE! Launching Antigravity Apex Dashboard...      ${NC}"
echo -e "${GREEN}  Local Dashboard URL: http://127.0.0.1:5173/                          ${NC}"
echo -e "${GREEN}=======================================================================${NC}\n"

# Open default browser
if command -v xdg-open >/dev/null 2>&1; then
    (sleep 2 && xdg-open "http://127.0.0.1:5173/") &
elif command -v open >/dev/null 2>&1; then
    (sleep 2 && open "http://127.0.0.1:5173/") &
fi

# Start Server + Client
npm run dev
