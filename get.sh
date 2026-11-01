#!/usr/bin/env bash
# Antigravity Apex root launcher delegating to scripts/get.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/scripts/get.sh" "$@"
