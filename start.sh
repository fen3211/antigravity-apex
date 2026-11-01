#!/usr/bin/env bash
# ==============================================================================
# AI Command Center - Quick Launcher for Linux and macOS
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${CYAN}=======================================================================${NC}"
echo -e "${CYAN}    AI COMMAND CENTER -- QUICK LAUNCHER                                ${NC}"
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

if command -v xdg-open >/dev/null 2>&1; then
    (sleep 2 && xdg-open "http://127.0.0.1:5173/") &
elif command -v open >/dev/null 2>&1; then
    (sleep 2 && open "http://127.0.0.1:5173/") &
fi

exec npm run dev
