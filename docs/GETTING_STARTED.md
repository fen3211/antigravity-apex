# Getting Started with AI Command Center

Welcome to **AI Command Center**, the mission-control dashboard for **Google Antigravity** and the **AI Development Director** multi-agent orchestration framework.

This guide walks you through your first 5 minutes with AI Command Center, from launching the local environment to monitoring autonomous subagents, reviewing 9-point reports, and inspecting real-time telemetry.

---

## 1. What is AI Command Center?

Google Antigravity enables autonomous AI agents to build software in isolated workspaces. However, as autonomous agents proliferate across frontend, backend, security, testing, and legal tasks, developers need centralized visibility and control.

AI Command Center provides:
- **Real-Time Visibility**: Track active agent sessions, running subagents, and token consumption live as they happen.
- **Dynamic Concurrency Control**: Safely throttle concurrent subagents (up to 6 parallel workers) to prevent memory saturation and API rate limits.
- **Multi-Tier Quality Gates**: Enforce rigorous verification (Gate 1 unit tests, Gate 2 independent review, Gate 2b legal compliance) before tasks are approved.
- **Closed-Contour Argon L4 Escalation**: Automatically detect repeated failures (2-attempt limit) and escalate to Gemini Pro or Gemini 4 Argon with minimal reproduction packages.

---

## 2. 5-Minute Quick Onboarding

### Step 1: Launch the Services
Open your terminal and navigate to the project directory:

```bash
cd d:\Projects\ai-command-center
npm run dev
```

Alternatively, on Windows, double-click [`start.cmd`](../start.cmd).

The terminal will report:
```
[AI COMMAND CENTER] Server running on http://127.0.0.1:3001
[AI COMMAND CENTER] WebSocket stream at ws://127.0.0.1:3001/ws
[AI COMMAND CENTER] Antigravity dir: C:\Users\<user>\.gemini\antigravity
[AI COMMAND CENTER] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
VITE v8.3.5 ready in 250 ms
➜  Local:   http://localhost:5173/
```

### Step 2: Open the Dashboard
Open your web browser and navigate to:
**[http://127.0.0.1:5173](http://127.0.0.1:5173)**

The interface will display the **Liquid Dark Glass** dashboard with the connection status pill showing **ONLINE**.

---

## 3. Touring the Dashboard Sections

AI Command Center organizes complex multi-agent telemetry into 8 focused views:

### 1. Overview
The high-level status cockpit:
- **Director Status**: Model version (`Gemini 3.8 Flash High`), active sessions, and active file locks.
- **KPI Metrics**: Active subagents, completed tasks, overall success rate, and total token usage.
- **Recent Telemetry**: Real-time event ticker broadcasting agent starts, completions, and quality gate results.

### 2. Agent Management
The 17-role specialist grid:
- View status (`idle`, `running`, `blocked`, `escalated`) for all specialists.
- Inspect system prompt specifications and domain definitions directly from `~/.gemini/config/plugins/ai-director/agents/*.md`.
- Monitor per-agent success rates and historical execution runs.

### 3. Live Workflow
An interactive visual flow graph showing the lifecycle of tasks:
- Progression through stages: `Director_Triage` → `Solo` / `Specialist` → `QualityGate_L1` → `Independent_L2` → `LegalGate` → `Architect_L3` → `Argon_L4` → `Approved`.
- Real-time pulse animations highlighting active tasks at each node.

### 4. Model Analytics
Token expenditure and performance tracking:
- Breakdown across Gemini models: **Gemini 3.8 Flash**, **Gemini Pro (Senior Architect)**, and **Gemini 4 Argon**.
- Clear separation between verified **LIVE** transcript tokens and projected **ESTIMATED** metrics.
- Cost monitoring and input/output/cache-read token counters.

### 5. Task Manager
Operational task board:
- Filter tasks by status, priority, and assigned agent.
- View task details, retry counters, and error logs.
- Inspect the strict **9-point Subagent Report** submitted by specialists upon task completion.

### 6. Director Memory
Online browser and editor for the global AI Director knowledge repository:
- Edit `DIRECTOR_PROTOCOL.md`, `AGENT_REGISTRY.md`, `QUALITY_GATES.md`, `FAILURE_LOG.md`, and other core policies in place.
- Updates are written directly to `~/.gemini/antigravity/knowledge/ai-director/` with zero latency.

### 7. Control Center
Operational command center and safe execution bridge:
- Configure concurrency boundaries (1–6 parallel agents) and maximum retry thresholds.
- Execute verified prompts via `agy CLI` with strict argument validation.
- Synthesize 10-point **Argon Prompt Packs** for Level 4 escalations and route resolved architectural verdicts.

### 8. Unified Event Stream
High-throughput JSON event inspector:
- Real-time stream of all system events (`agent.*`, `task.*`, `legal_gate.*`, `escalation.*`).
- Search and filter by event type, agent ID, and task ID.
- One-click JSON payload copying for debugging.

---

## 4. Your First Task Lifecycle

Let's walk through creating and tracking a task:

1. In the **Task Manager** tab, click **New Task**.
2. Enter:
   - **Title**: `Implement Zod validation schema for user profile`
   - **Assigned Agent**: `backend-developer`
   - **Priority**: `Medium`
3. Click **Create Task**.
4. The task appears in stage `Director_Triage` and transitions to `Specialist`.
5. Once the backend developer completes the code and local unit tests, it submits a **9-point report**:
   - Status: `SUCCESS`
   - Modified Files: `src/schemas/user.ts`, `tests/user-schema.test.ts`
   - Executed Checks: `npm test` passed 14/14 tests.
6. The task enters `QualityGate_L1` and advances through `Independent_L2` to `Approved`.

---

## 5. Next Steps

- Review the [Architecture Blueprint](ARCHITECTURE.md) to understand the internals.
- Explore the [17-Role Specialist Registry](AGENTS.md) to see agent responsibilities and model allocations.
- Read the [Orchestration & Quality Gates Guide](ORCHESTRATION.md) to master triage rules and Argon escalation.
