#!/usr/bin/env bash
# ==============================================================================
# Antigravity Apex - Quick Launcher for Linux and macOS
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${CYAN}=======================================================================${NC}"
echo -e "${CYAN}    ANTIGRAVITY APEX -- QUICK LAUNCHER                                ${NC}"
echo -e "${CYAN}    URL: http://127.0.0.1:5173/                                        ${NC}"
echo -e "${CYAN}=======================================================================${NC}\n"

if [ ! -f ".env" ]; then
    cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
    echo -e "Missing node_modules! Running initial setup..."
    chmod +x ./setup.sh
    exec ./setup.sh
fi

if [ -d ".git" ]; then
    echo -e "${CYAN}[Auto-Update] Checking for updates...${NC}"
    if git fetch origin main --quiet 2>/dev/null; then
        BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo 0)
        if [ "$BEHIND" -gt 0 ]; then
            echo -e "${GREEN}[Auto-Update] Found $BEHIND new commit(s). Pulling updates...${NC}"
            git pull origin main --quiet
            echo -e "${CYAN}[Auto-Update] Updating dependencies and building...${NC}"
            npm install --silent
            npm --prefix client install --silent
            npm run server:build --silent
            npm run client:build --silent
            echo -e "${GREEN}[Auto-Update] Updated successfully!${NC}\n"
        else
            echo -e "${GREEN}[Auto-Update] Antigravity Apex is up to date.${NC}\n"
        fi
    fi
fi

if command -v xdg-open >/dev/null 2>&1; then
    (sleep 2 && xdg-open "http://127.0.0.1:5173/") &
elif command -v open >/dev/null 2>&1; then
    (sleep 2 && open "http://127.0.0.1:5173/") &
fi

exec npm run dev
