# Troubleshooting & Diagnostics Guide

[English](TROUBLESHOOTING.md) • [Русский](TROUBLESHOOTING.ru.md)

This guide provides diagnostic procedures and actionable solutions for common issues encountered when running **AI Command Center**.

---

## 1. WebSocket Disconnection & "DISCONNECTED" Status

### Symptoms
- The status pill in the UI header displays **DISCONNECTED** or **RECONNECTING**.
- The Unified Event Stream stops updating in real time.

### Diagnostic Steps
1. Open the browser Developer Tools (F12) and inspect the **Console** and **Network** (WS tab) logs.
2. Look for WebSocket close codes:
   - `1008 (Policy Violation)`: Authentication failure (invalid API key) or unauthorized origin.
   - `1009 (Message too large)`: A single message exceeded the 64 KB limit.
   - `1006 (Abnormal Closure)`: Server process died or network interface dropped.

### Remediation
- **Token Mismatch**: Fetch a fresh token by visiting `http://127.0.0.1:3001/api/auth/token` directly from your browser. The client will automatically store and reuse this token.
- **Origin Mismatch**: If you are accessing the dashboard from a custom IP or host (e.g., `http://192.168.1.50:5173`), ensure that origin is added to `CONFIG.ALLOWED_ORIGINS` in `server/src/config.ts`.
- **Restart the Server**: If the backend crashed, check the terminal output for stack traces and restart via `npm run dev` or `start.cmd`.

---

## 2. Antigravity Sessions or Transcripts Not Detected

### Symptoms
- **Overview** displays `0 Active Locks` and `0 Live Transcripts`, despite Antigravity running in another terminal.

### Diagnostic Steps
1. Verify the Antigravity base paths in the server startup logs:
   ```
   [AI COMMAND CENTER] Antigravity dir: C:\Users\<user>\.gemini\antigravity
   [AI COMMAND CENTER] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
   ```
2. Verify that the files exist on disk:
   - Locks: `~/.gemini/antigravity/presence/`
   - Transcripts: `~/.gemini/antigravity/brain/**/.system_generated/logs/transcript.jsonl`

### Remediation
- **Path Override**: If your Antigravity installation uses a custom location, explicitly set the paths in `.env`:
  ```env
  ANTIGRAVITY_DIR=D:\CustomPath\.gemini\antigravity
  BRAIN_DIR=D:\CustomPath\.gemini\antigravity\brain
  PRESENCE_DIR=D:\CustomPath\.gemini\antigravity\presence
  KNOWLEDGE_DIR=D:\CustomPath\.gemini\antigravity\knowledge\ai-director
  ```
- **File Permissions**: Ensure that the user account running Node.js has read access to the `.gemini` directory.

---

## 3. Subagent Process Hangs or Times Out

### Symptoms
- A task remains in the `in_progress` state indefinitely.
- The terminal indicates a subagent spawned via the supervisor has stopped outputting logs.

### Diagnostic Steps
1. Navigate to the **Task Manager** tab in the dashboard.
2. Select the hanging task and check its execution details and process PID.

### Remediation
- **Dashboard Cancel**: Click the **Cancel Task** button in the task detail drawer. The supervisor will send a termination signal.
- **Process Tree Kill**: If the process fails to terminate gracefully, the supervisor automatically triggers a process tree termination. On Windows, you can manually force-kill the process tree from PowerShell:
  ```powershell
  taskkill /PID <PID> /T /F
  ```
- **Adjust Timeout**: For long-running compilation or E2E testing tasks, increase the timeout parameter when invoking `/tasks/:id/execute`:
  ```json
  {
    "timeoutMs": 300000
  }
  ```

---

## 4. SQLite Database Locks (`SQLITE_BUSY: database is locked`)

### Symptoms
- REST API requests return HTTP 500 with `SQLITE_BUSY: database is locked`.

### Diagnostic Steps
1. Check whether an external SQLite viewer (e.g., DB Browser for SQLite) has opened `command_center.sqlite` in exclusive mode.
2. Verify that WAL files exist: `command_center.sqlite-wal` and `command_center.sqlite-shm`.

### Remediation
- **Close External Viewers**: Close any external database GUI tools that maintain exclusive read/write locks.
- **WAL Pragma**: AI Command Center uses WAL mode and sets `busy_timeout = 5000` by default. If you modified `database.ts`, ensure that `busy_timeout` is set to at least 5000 ms.
- **Reset DB**: If the database file is permanently corrupted, delete `command_center.sqlite`, `command_center.sqlite-wal`, and `command_center.sqlite-shm`. The server will automatically re-create fresh tables on startup.

---

## 5. Legal Gate Returns `BLOCKED_RED`

### Symptoms
- A task fails Quality Gate 2b with status `BLOCKED_RED`.

### Diagnostic Steps
1. Review the generated `LegalAssessment` object attached to the task or query `GET /api/events?type=legal_gate.blocked`.
2. Review the `identifiedRisks` and `mechanismOfNonCompliance` fields.

### Common Causes & Fixes
- **Viral Copyleft License**: An AGPL-3.0 or GPL-3.0 library was introduced into a proprietary or cloud-distributed codebase. Replace it with an MIT, Apache-2.0, or BSD-licensed alternative.
- **RF Personal Data Localization (23-FZ)**: A database or cloud service storing Russian citizens' personal data is located abroad without a primary Russian recording instance. Implement primary database recording on a Russian server before replicating.
- **Pre-Ticked Checkbox (69-FZ)**: A consent or purchase flow includes a pre-selected checkbox. Remove pre-ticking to satisfy the 01.09.2025 dark pattern prohibition.
- **Remember the Non-Blocking Invariant**: When `BLOCKED_RED` occurs, only the specific non-compliant feature is halted. You do not need to pause UI styling or unit test development.

---

## 6. CLI Execution Rejection (`Agent not allowed` / `Command failed`)

### Symptoms
- Triggering a task run via the Control Center fails with `error: Agent "<name>" is not allowed` or `Invalid CLI arguments`.

### Diagnostic Steps
1. Review the whitelist settings: `GET /api/control/settings`.
2. Inspect the prompt for banned shell metacharacters: `&`, `|`, `;`, `$`, `>`, `<`, `` ` ``.

### Remediation
- Ensure that the agent name exists in `settings.allowedAgents`. You can add new agent IDs through the **Control Center** settings tab.
- Remove chained shell operators from your prompt payload. Pass plain instructional text to `agy.exe`.
