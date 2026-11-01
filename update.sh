#!/usr/bin/env bash
# ==============================================================================
# Antigravity Apex - Project Updater for Linux and macOS
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}=======================================================================${NC}"
echo -e "${CYAN}    ANTIGRAVITY APEX -- PROJECT UPDATER                                ${NC}"
echo -e "${CYAN}=======================================================================${NC}\n"

if [ ! -d ".git" ]; then
    echo -e "${RED}[Error] .git directory not found. Updating is only supported in git clones.${NC}"
    exit 1
fi

echo -e "${CYAN}[1/4] Pulling latest changes from GitHub...${NC}"
git pull origin main

echo -e "\n${CYAN}[2/4] Updating dependencies...${NC}"
npm install --ignore-scripts
npm --prefix client install

echo -e "\n${CYAN}[3/4] Compiling server...${NC}"
npm run server:build

echo -e "\n${CYAN}[4/4] Building client application...${NC}"
npm run client:build

echo -e "\n${GREEN}=======================================================================${NC}"
echo -e "${GREEN}    ANTIGRAVITY APEX UPDATED SUCCESSFULLY!                             ${NC}"
echo -e "${GREEN}=======================================================================${NC}\n"
