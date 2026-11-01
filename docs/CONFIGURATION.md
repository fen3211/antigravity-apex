# Configuration Reference

This document provides a comprehensive reference for all static and runtime configuration options in **AI Command Center**.

---

## 1. Environment Variables (`.env`)

AI Command Center loads configuration from `.env` using `dotenv`. All parameters have sensible production-ready defaults.

### Server Network & Runtime

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | `number` | `3001` | The HTTP and WebSocket port that the backend Express server binds to. |
| `HOST` | `string` | `127.0.0.1` | The network interface address to bind. Defaults to the loopback interface for local security. |
| `NODE_ENV` | `string` | `development` | Set to `production` in production builds to enable strict caching and disable verbose logs. |

### Security & Authentication

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `COMMAND_CENTER_API_KEY` | `string` | *(Auto-generated)* | 32-byte cryptographic hex token (64 hex characters) required for all mutating REST endpoints and WebSocket handshakes. If left empty, the server generates a token on first run and persists it to `.env`. |

### Antigravity File System Paths

By default, paths are resolved relative to the user's home directory (`~/.gemini/antigravity`). You can override them individually:

| Variable | Default (Windows) | Default (Linux/macOS) | Description |
|----------|-------------------|-----------------------|-------------|
| `ANTIGRAVITY_DIR` | `%USERPROFILE%\.gemini\antigravity` | `~/.gemini/antigravity` | Base directory of the Google Antigravity installation. |
| `KNOWLEDGE_DIR` | `%USERPROFILE%\.gemini\antigravity\knowledge\ai-director` | `~/.gemini/antigravity/knowledge/ai-director` | Directory containing AI Development Director markdown protocol documents. |
| `PRESENCE_DIR` | `%USERPROFILE%\.gemini\antigravity\presence` | `~/.gemini/antigravity/presence` | Directory monitored for active session `.lock` files. |
| `BRAIN_DIR` | `%USERPROFILE%\.gemini\antigravity\brain` | `~/.gemini/antigravity/brain` | Directory containing subagent run transcripts (`transcript.jsonl`). |
| `AGY_CLI_PATH` | `%LOCALAPPDATA%\agy\bin\agy.exe` | `/usr/local/bin/agy` | Path to the Antigravity CLI executable. |
| `DB_PATH` | `./command_center.sqlite` | `./command_center.sqlite` | File system path to the local SQLite database. |

---

## 2. Dynamic Control Settings (Runtime API)

In addition to `.env`, AI Command Center stores dynamic operational settings in the `settings` table of SQLite. These can be adjusted via the UI (**Control Center**) or via REST API:

- **Endpoint**: `GET /api/control/settings` and `POST /api/control/settings`
- **Authentication**: Requires `COMMAND_CENTER_API_KEY` header or query token.

### Schema & Attributes

```json
{
  "maxConcurrentAgents": 3,
  "maxRetryAttempts": 2,
  "defaultModelTier": "gemini-3.8-flash-high",
  "escalationPolicy": "strict",
  "autoQualityGates": true,
  "allowedAgents": [
    "director",
    "researcher",
    "frontend-developer",
    "backend-developer",
    "ui-ux-designer",
    "qa-engineer",
    "code-reviewer",
    "senior-architect",
    "legal-compliance",
    "security-engineer",
    "devops-engineer",
    "product-manager",
    "ai-evaluation-engineer",
    "performance-engineer",
    "accessibility-specialist",
    "database-specialist",
    "data-engineer"
  ]
}
```

### Parameter Explanations

1. `maxConcurrentAgents` (integer, 1–10):
   Controls the maximum number of subagent processes the supervisor can spawn simultaneously. Recommended: `3` for typical multi-agent development; maximum tested: `6`.
2. `maxRetryAttempts` (integer, 1–10):
   The maximum number of retries per approach before triggering automatic Level 3 escalation to Senior Architect. Default: `2`.
3. `defaultModelTier` (string):
   The default Gemini model tier assigned to new tasks. Typically `gemini-3.8-flash-high`.
4. `escalationPolicy` (`"strict"` | `"relaxed"`):
   - `"strict"`: Immediately blocks tasks upon 2 consecutive failures and invokes the Argon prompt pack synthesizer.
   - `"relaxed"`: Permits one additional retry attempt before escalating.
5. `autoQualityGates` (boolean):
   When true, the system automatically runs Quality Gate 1 checks upon subagent report submission.
6. `allowedAgents` (array of strings):
   Strict whitelist of agent IDs permitted to be spawned via the execution bridge. Prevents unauthorized agent execution.

---

## 3. CORS & Network Whitelisting

The backend enforces a strict CORS origin check via `CONFIG.ALLOWED_ORIGINS`:

```typescript
ALLOWED_ORIGINS: [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
]
```

Requests from unauthorized origins are rejected with **HTTP 403 Forbidden**. If you run the frontend on a non-standard port or hostname, add it to `CONFIG.ALLOWED_ORIGINS` in `server/src/config.ts`.

---

## 4. WebSocket Operational Parameters

The WebSocket server (`ws://127.0.0.1:3001/ws`) operates under strict resilience bounds:

- **Max Payload Size**: `64 KB` (`MAX_WS_PAYLOAD = 64 * 1024`). Any incoming frame exceeding this ceiling is rejected with WebSocket close code `1009 (Message too large)` and immediate socket termination.
- **Heartbeat Interval**: 30 seconds. Clients must respond to `ping` messages with a `pong` frame; inactive connections are pruned automatically.
- **Authentication**: Requires a valid token provided either via:
  - Query parameter: `?token=<API_KEY>`
  - Header: `Authorization: Bearer <API_KEY>`
  - Header: `x-api-key: <API_KEY>`

---

## 5. File System Watcher Filter Configuration

The Chokidar file system watcher filters events through `createAntigravityPathFilter(brainDir, presenceDir)`:

### Allowed Files:
- Any file ending in `.lock` within the `PRESENCE_DIR`.
- Any file named `transcript.jsonl` located within a `.system_generated/logs/` subdirectory inside `BRAIN_DIR`.

### Excluded / Ignored Targets:
- Temporary files: `.tmp`, `.swp`, `~*`, `.bak`, `~$*`, `.crdownload`.
- Dotfiles, hidden directories (except `.system_generated`).
- Heavy build and cache directories: `node_modules`, `.git`, `dist`, `scratch`, `tempmediaStorage`, `.user_uploaded`.
