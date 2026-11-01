# Frequently Asked Questions (FAQ)

This document answers common technical, architectural, and operational questions about **AI Command Center**.

---

## 1. General & Architecture

### What is AI Command Center?
AI Command Center is a local, real-time management dashboard and operational supervisor for **Google Antigravity** multi-agent workspaces and the **AI Development Director** framework. It provides centralized visibility into autonomous subagents, active sessions, token consumption, and multi-tier quality governance.

### Does AI Command Center replace Antigravity CLI / IDE?
No. AI Command Center works alongside Antigravity as an operational oversight layer. While Antigravity executes autonomous tasks and tool interactions, AI Command Center monitors execution transcripts, manages concurrency, verifies Quality Gates, and controls Level 4 Argon escalations.

### Can I run AI Command Center without Antigravity installed?
Yes. AI Command Center is fully decoupled. If Antigravity is not installed or running, the dashboard operates with offline task management, memory document editing, and simulated telemetry.

### What platforms are supported?
AI Command Center is fully tested and supported on:
- **Windows 10/11** (64-bit)
- **macOS** 12+ (Intel and Apple Silicon)
- **Linux** (Ubuntu 22.04+, Debian 11+, Fedora, Arch)

---

## 2. Concurrency & Performance

### How many subagents can run in parallel?
The system supports up to **6 concurrent subagents** (`MAX_CONCURRENT_SUBAGENTS = 6`). By default, concurrency is throttled to **3 active agents** to maintain system responsiveness and avoid external API rate limits. Additionally, expensive Pro-tier models are capped at **2 concurrent instances** maximum.

### What is the "Zero-Disk-Read" ingestion engine?
Traditional log monitors re-read entire transcript files from line 0 on every modification. In long Antigravity sessions, transcripts grow to dozens of megabytes, causing CPU and disk spikes.

AI Command Center's `JsonlStreamReader` keeps track of the exact byte offset (`last_offset`) in SQLite. When a transcript updates, it reads only the newly appended 64 KB chunks directly from that offset, preserving multi-byte UTF-8 boundaries and eliminating redundant disk I/O.

### Will running the dashboard impact my local build performance?
Negligible impact. The backend runs on a lightweight Node.js event loop with `better-sqlite3` in WAL mode, consuming less than 1% CPU and ~60 MB RAM at idle.

---

## 3. Model Routing & Token Economics

### Which AI models are supported?
The system routes tasks across the Google Gemini family:
- **Gemini 3.8 Flash High**: Director orchestration, task triage, and quality arbitration.
- **Gemini Flash (Medium/Low)**: High-speed, cost-efficient standard development (frontend, backend, QA, review, research).
- **Gemini Pro**: Deep architectural refactoring, race-condition debugging (Level 3 Senior Architect).
- **Gemini 4 Argon**: Flagship reasoning in a closed contour for Level 4 architectural deadlocks.

### What is the difference between LIVE and ESTIMATED token metrics?
- **LIVE**: Tokens extracted directly from verified Antigravity execution transcripts (`transcript.jsonl`). These reflect actual prompt, completion, and cache-read tokens consumed during autonomous runs.
- **ESTIMATED**: Projected metrics derived from historical averages for tasks created outside of live sessions.

### Why is Gemini 4 Argon kept in a "Closed Contour"?
Gemini 4 Argon is an ultra-high-capability model reserved for critical architectural impasses. To prevent runaway token expenditure and accidental production regressions:
1. It is never triggered on routine errors (requires 2 failed attempts first).
2. It receives an isolated **10-point Prompt Pack** containing only the minimal 20–50 line reproduction snippet.
3. The human operator switches to Argon manually.
4. Argon produces an architectural diagnosis and resolution strategy, which is then routed back to Flash specialists for code execution.

---

## 4. Quality Gates & Legal Governance

### What are the 9 required points of a Subagent Report?
Every technical specialist must submit a structured report before a task can pass Quality Gate 1:
1. `taskName`
2. `status` (`SUCCESS`, `FAILURE`, or `BLOCKED`)
3. `summary`
4. `modifiedFiles`
5. `executedChecks`
6. `checkResults`
7. `issuesAndRisks`
8. `pendingItems`
9. `nextSteps`

Reports claiming "all tests passed" without concrete test runner output are automatically rejected.

### What is Quality Gate 2b (Legal Gate)?
Quality Gate 2b evaluates features before implementation for statutory compliance across the **Russian Federation** (`RU`) and **European Union** (`EU_NL`):
- Russian laws: 152-FZ (personal data), 156-FZ (isolated consent), 23-FZ (database localization), 149-FZ (information dissemination), 243-FZ (AI regulation), Part IV Civil Code (copyright), 38-FZ/479-FZ (advertising), Law 2300-1 / 69-FZ (ban on dark patterns), 54-FZ (online cash registers).
- European regulations: GDPR (Regulation 2016/679), EU AI Act (Regulation 2024/1689), ePrivacy Directive.

### Does the Legal Gate replace human legal counsel?
No. Quality Gate 2b is an automated technical compliance scanner designed to catch statutory violations early in the software lifecycle. For high-risk operations (`RED` or complex cross-border transfers), the gate explicitly advises consultation with qualified human legal counsel.

### What is the "Non-Blocking Invariant" on RED?
When the Legal Gate flags a compliance violation with `BLOCKED_RED`, it halts **only the specific non-compliant sub-task** (e.g., direct transmission of unlocalized personal data). Safe adjacent development (UI mockups, design tokens, unit tests, accessible layouts) continues uninterrupted.

---

## 5. Customization & Extension

### Can I add new agent roles to the 17-specialist pool?
Yes. To register a custom specialist:
1. Create a markdown specification file: `~/.gemini/config/plugins/ai-director/agents/<role-id>.md`.
2. Add the agent ID to `allowedAgents` in the dashboard **Control Center** or via `POST /api/control/settings`.
3. The agent will immediately appear in the **Agent Management** grid and become available for task assignment.

### How do I deploy AI Command Center on a remote server?
By default, the server binds to `127.0.0.1` for local loopback security. To deploy remotely:
1. Set `HOST=0.0.0.0` and configure your `PORT` in `.env`.
2. Put a secure reverse proxy (Nginx, Caddy, or Traefik) with SSL/TLS in front of the server.
3. Add your remote domain or IP to `CONFIG.ALLOWED_ORIGINS` in `server/src/config.ts`.
4. Ensure `COMMAND_CENTER_API_KEY` is set to a strong 32-byte hexadecimal secret.
