#!/usr/bin/env bash
# =============================================================================
# ANTIGRAVITY APEX - SYSTEM DIAGNOSTICS WRAPPER (POSIX / macOS / Linux)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCTOR_JS="$SCRIPT_DIR/doctor.js"

if ! command -v node >/dev/null 2>&1; then
    echo -e "\033[0;31m[ERROR] Node.js is not installed or not found in PATH.\033[0m"
    echo -e "\033[1;33mPlease install Node.js >= 18 from https://nodejs.org/\033[0m"
    exit 1
fi

cd "$PROJECT_ROOT"
node "$DOCTOR_JS"
