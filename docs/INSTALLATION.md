# Installation & Setup Guide

This guide provides detailed, step-by-step instructions for installing and setting up **AI Command Center** across **Windows**, **macOS**, and **Linux** environments.

---

## 1. System Requirements & Prerequisites

### Minimum Requirements
- **Node.js**: `v18.0.0` or higher (tested on Node.js v20.x LTS and v24.x).
- **npm**: `v9.0.0` or higher.
- **RAM**: 2 GB minimum (4 GB recommended when running Vite and heavy subagent concurrency).
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
> AI Command Center works seamlessly even without Antigravity running. When Antigravity is absent, the dashboard operates with simulated demo events, offline task tracking, and local database storage.

---

## 2. Step-by-Step Installation

### Step 1: Clone Repository
Clone the repository using Git:

```bash
git clone https://github.com/your-org/ai-command-center.git
cd ai-command-center
```

### Step 2: Install Backend Dependencies
Install the root dependencies (Express, better-sqlite3, WebSocket, Chokidar, Zod, TypeScript, tsx):

```bash
npm install
```

> [!TIP]
> `better-sqlite3` downloads precompiled native C++ binaries for your platform. If your environment lacks standard prebuilts, ensure you have Python 3 and a C++ compiler (`windows-build-tools` on Windows or `build-essential` on Linux).

### Step 3: Install Frontend Client Dependencies
Navigate to the client directory and install React 19, Vite, Tailwind CSS, Lucide React, and Framer Motion:

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

Open `.env` in your editor. On first startup, if `COMMAND_CENTER_API_KEY` is left blank, the server will automatically generate a secure 32-byte cryptographic token and save it to `.env`.

---

## 3. Database Initialization

The SQLite database (`command_center.sqlite`) is initialized automatically when the server starts.

Key database characteristics:
- **Engine**: `better-sqlite3` with native bindings.
- **Journal Mode**: **WAL (Write-Ahead Logging)** enabled for zero-lock concurrent reading and atomic write performance.
- **Pragmas**: `busy_timeout = 5000` to prevent database locks under rapid ingestion bursts.
- **Tables**: `tasks`, `events`, `settings`, `model_usage`, `session_token_usage`, `log_parse_state`, `legal_assessments`.

No manual SQL migration scripts are required.

---

## 4. Verification & Testing

Verify that your installation satisfies all operational requirements by executing the test suite:

```bash
npm test
```

This runs 6 specialized test suites sequentially:
1. `tests/api.test.ts`: REST API security, CORS, authentication, path traversal defense, and CLI injection prevention (20 tests).
2. `tests/ingestion.test.ts`: Incremental stream reader, 64 KB chunking, UTF-8 byte boundary preservation, and file truncation recovery (7 tests).
3. `tests/analytics.test.ts`: LIVE vs ESTIMATED token metrics, cache-read tracking, and aggregation logic.
4. `tests/websocket-resilience.test.ts`: WebSocket auth, payload boundaries (64 KB ceiling), ping-pong heartbeats.
5. `tests/process-supervisor.test.ts`: Subagent process spawning, tree-kill timeouts, and concurrency throttling (9 tests).
6. `tests/legal-compliance.test.ts`: Legal Gate 2b statutory audit engine across 16 legal scenarios (152-FZ, 243-FZ, GDPR).

All suites must complete with **0 errors**.

---

## 5. Launch Modes

### Mode A: Development Mode (Hot-Reload)
Launches both the Express server (with `tsx` hot-reloading on port 3001) and the Vite frontend (with HMR on port 5173) in parallel:

```bash
npm run dev
```

### Mode B: Windows One-Click Launch
Double-click [`start.cmd`](../start.cmd) from File Explorer.

### Mode C: Production Build & Run
To compile and execute in a production-hardened environment:

```bash
# 1. Compile backend TypeScript
npm run server:build

# 2. Compile frontend Vite bundle
npm run client:build

# 3. Start production server
npm start
```

---

## 6. Troubleshooting Common Installation Issues

### Issue 1: `better-sqlite3` native build fails on Linux
**Cause**: Missing C++ build tools.
**Fix**:
```bash
sudo apt-get update && sudo apt-get install -y build-essential python3
npm rebuild better-sqlite3
```

### Issue 2: Port 3001 or 5173 already in use
**Cause**: Another local process is occupying the default port.
**Fix**: Specify a custom port in `.env`:
```env
PORT=3005
```
And pass `--port 5175` to the client script in `client/package.json` if needed.

### Issue 3: Antigravity directory not detected
**Cause**: Antigravity is installed in a non-standard location.
**Fix**: Set the path explicitly in your `.env`:
```env
ANTIGRAVITY_DIR=/custom/path/to/.gemini/antigravity
BRAIN_DIR=/custom/path/to/.gemini/antigravity/brain
PRESENCE_DIR=/custom/path/to/.gemini/antigravity/presence
```
