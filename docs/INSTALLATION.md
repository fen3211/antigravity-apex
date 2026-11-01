# Installation & Setup Guide

[English](INSTALLATION.md) • [Русский](INSTALLATION.ru.md)

This guide provides detailed, step-by-step instructions for installing and setting up **Antigravity Apex** across **Windows**, **macOS**, and **Linux** environments, including 1-click launchers, terminal one-liners, and manual setups.

---

## ⚡ 1-Click Fast Installation

### Windows 1-Click Setup
1. Download or clone this repository.
2. Double-click [`setup.cmd`](../setup.cmd) (or [`setup.bat`](../setup.bat)) in the project root.
3. The script automatically installs all dependencies, deploys the 17-agent configuration into `~/.gemini/config/plugins/ai-director`, runs `doctor.js`, starts the server, and opens your browser at `http://127.0.0.1:5173/`.

### Linux / macOS 1-Click Setup
```bash
chmod +x setup.sh && ./setup.sh
```

### Remote One-Liner (No Clone Required)
- **Windows (PowerShell)**:
  ```powershell
  irm https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.ps1 | iex
  ```
- **Linux & macOS (Bash)**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.sh | bash
  ```

---

## 1. System Requirements & Prerequisites

### Minimum Requirements
- **Node.js**: `v18.0.0` or higher (tested on Node.js v20.x LTS and v24.x).
- **npm**: `v9.0.0` or higher.
- **RAM**: 2 GB minimum (4 GB recommended for concurrent subagent execution).
- **Disk Space**: 200 MB free space for dependencies and local SQLite database.
- **Operating System**:
  - Windows 10/11 (64-bit)
  - macOS 12+ (Apple Silicon or Intel)
  - Ubuntu 22.04+ / Debian 11+ / Fedora 38+ / Arch Linux

### Antigravity Environment (Optional but Recommended)
For live session and telemetry monitoring:
- Google Antigravity installed on the local system.
- Standard workspace directory located at `~/.gemini/antigravity/` (on Windows: `%USERPROFILE%\.gemini\antigravity`).
- Antigravity CLI binary `agy.exe` (on Windows typically at `%LOCALAPPDATA%\agy\bin\agy.exe`).

> [!NOTE]
> Antigravity Apex works seamlessly even without Antigravity running. When Antigravity is absent, the dashboard operates with offline task tracking, local database storage, and simulated telemetry.

---

## 2. Step-by-Step Manual Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/fen3211/antigravity-apex.git
cd antigravity-apex
```

### Step 2: Install Backend Dependencies
```bash
npm install
```

### Step 3: Install Frontend Client Dependencies
```bash
npm --prefix client install
```

### Step 4: Configure Environment Variables
Copy the provided `.env.example` template to `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

On first startup, if `COMMAND_CENTER_API_KEY` is left blank, the server will automatically generate a secure 32-byte cryptographic token and save it to `.env`.

### Step 5: Deploy Antigravity Agents & Skills
Deploy the complete 17-agent suite, rules, and skills into your Antigravity environment:

**Windows (PowerShell):**
```powershell
.\scripts\install.ps1 -Force
```

**macOS / Linux:**
```bash
./scripts/install.sh --force
```

---

## 3. Database Initialization

The SQLite database (`command_center.sqlite`) is initialized automatically when the server starts.

Key database characteristics:
- **Engine**: `better-sqlite3` with native bindings.
- **Journal Mode**: **WAL (Write-Ahead Logging)** enabled for zero-lock concurrent reading and atomic write performance.
- **Pragmas**: `busy_timeout = 5000` to prevent database locks under rapid ingestion bursts.
- **Tables**: `tasks`, `events`, `settings`, `model_usage`, `session_token_usage`, `log_parse_state`, `legal_assessments`, `escalations`.

No manual SQL migration scripts are required.

---

## 4. Diagnostic Doctor (`npm run doctor`)

Run the comprehensive diagnostic check at any time:

```bash
npm run doctor
```

Validates:
- Node.js & npm runtime versions
- Git availability and branch state
- SQLite WAL mode and schema integrity
- Presence of all 17 agent definitions
- Orchestration rules and skills (`director-orchestration`, `argon-escalation`)
- Antigravity directories (`brain`, `presence`, `knowledge`)

---

## 5. Verification & Testing

Verify that your installation satisfies all operational requirements by executing the test suite:

```bash
npm test
```

Runs all 8 specialized test suites:
1. `tests/api.test.ts`: REST API security, CORS, auth, and CLI injection defense.
2. `tests/ingestion.test.ts`: Incremental stream reader, 64 KB chunking, and file rotation.
3. `tests/analytics.test.ts`: LIVE vs ESTIMATED token metrics and cost accounting.
4. `tests/websocket-resilience.test.ts`: WebSocket auth, payload boundaries, ping-pong heartbeats.
5. `tests/process-supervisor.test.ts`: Subagent process spawning, tree-kill timeouts, and concurrency throttling.
6. `tests/legal-compliance.test.ts`: Legal Gate 2b statutory audit engine across 16 scenarios.
7. `tests/backend-audit.test.ts`: Cross-platform discovery, path traversal security, and doctor check.
8. `tests/intelligent-argon-escalation.test.ts`: Level 4 Argon escalation, 18-point prompt pack, and anti-spam cooldown.

---

## 6. Launch Modes

### Mode A: Development Mode (Hot-Reload)
```bash
npm run dev
```

### Mode B: Windows One-Click Quick Launch
Double-click [`start.cmd`](../start.cmd).

### Mode C: Production Build & Run
```bash
npm run server:build
npm --prefix client run build
npm start
```
