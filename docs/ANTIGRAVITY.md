# Google Antigravity Integration Guide

This guide details the integration mechanisms between **AI Command Center** and the local **Google Antigravity** multi-agent runtime.

---

## 1. Antigravity Architecture & File System Layout

Google Antigravity stores agent state, execution transcripts, and knowledge within the user's home directory (`~/.gemini/antigravity/`):

```
~/.gemini/
├── antigravity/
│   ├── brain/
│   │   └── <conversation-id>/
│   │       ├── .system_generated/
│   │       │   └── logs/
│   │       │       └── transcript.jsonl      <-- Ingested by JsonlStreamReader
│   │       ├── scratch/                      <-- Scratchpads & temp scripts
│   │       └── ...
│   ├── presence/
│   │   ├── session-1.lock                    <-- Monitored by Presence Detector
│   │   └── session-2.lock
│   ├── knowledge/
│   │   └── ai-director/
│   │       ├── DIRECTOR_PROTOCOL.md          <-- Read/Edited via Memory Explorer
│   │       ├── AGENT_REGISTRY.md
│   │       ├── MODEL_ROUTING_POLICY.md
│   │       ├── ESCALATION_POLICY.md
│   │       ├── QUALITY_GATES.md
│   │       ├── FAILURE_LOG.md
│   │       ├── VERIFIED_SOLUTIONS.md
│   │       └── PROJECT_SPECIFIC_LESSONS.md
│   └── conversations/                        <-- Historical session state
└── config/
    └── plugins/
        └── ai-director/
            ├── agents/                       <-- Agent Markdown Specifications
            ├── rules/                        <-- Director Global Operational Rules
            └── skills/                       <-- Specialist Skills
```

---

## 2. Live Transcripts Inspector & Token Accounting

### File Path
`~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`

### Ingestion Mechanism
AI Command Center monitors these files using `chokidar` and streams new entries using `JsonlStreamReader`:
1. **Incremental Offsets**: The reader only processes bytes appended since the last scan (`last_offset`).
2. **Chunking & Multi-Byte UTF-8**: Data is read in 64 KB buffers. Partial UTF-8 byte sequences at buffer edges are preserved across chunks to prevent decoding errors in Cyrillic characters and emojis.
3. **Token Usage Extraction**: The reader inspects line objects for step events and extracts:
   - `input_tokens`
   - `output_tokens`
   - `cache_read_tokens`
   - `step_count`
4. **Data Provenance**:
   - Metrics derived directly from verified `transcript.jsonl` files are tagged with provenance **`LIVE`**.
   - Aggregated projections or offline simulations are tagged as **`ESTIMATED`** or **`DEMO`**.

---

## 3. Active Presence Detector

### File Path
`~/.gemini/antigravity/presence/*.lock`

### Detection Mechanism
- Antigravity creates a `.lock` file whenever an active agent session is launched.
- `chokidar` tracks `add`, `change`, and `unlink` events within `CONFIG.PRESENCE_DIR`.
- When a lock file is added, the dashboard increments `activeLocksCount` and marks the associated conversation session as **LIVE**.
- When an agent process finishes or is terminated, the lock file is removed, and the session status returns to idle.

---

## 4. Director Knowledge Base & Memory Explorer

### Directory Path
`~/.gemini/antigravity/knowledge/ai-director/`

AI Command Center provides an integrated Markdown explorer and editor for the Director's persistent knowledge documents.

### Key Knowledge Documents

| Document | Purpose |
|----------|---------|
| `DIRECTOR_PROTOCOL.md` | Core rules of engagement, solo vs subagent triage, and resource limits. |
| `AGENT_REGISTRY.md` | Current catalog of available specialist roles and assigned models. |
| `MODEL_ROUTING_POLICY.md` | Routing rules (Gemini 3.8 Flash vs Pro vs Gemini 4 Argon). |
| `ESCALATION_POLICY.md` | Protocol for 2-failure limits, Senior Architect (L3), and Argon (L4). |
| `QUALITY_GATES.md` | Standards for Gate 1 (9-point report), Gate 2 (QA/Review), Gate 2b (Legal). |
| `FAILURE_LOG.md` | Incident post-mortems and anti-patterns observed during development. |
| `VERIFIED_SOLUTIONS.md` | Proven architectural blueprints and code templates. |
| `PROJECT_SPECIFIC_LESSONS.md`| Domain-specific notes for individual repositories. |

### REST API Integration
- `GET /api/knowledge`: Returns the list of all available knowledge documents.
- `GET /api/knowledge/:filename`: Retrieves the raw markdown content of a document.
- `POST /api/knowledge/:filename`: Saves updated markdown content directly to disk.
- **Security**: The filename is validated against `^[a-zA-Z0-9_-]+\.md$`. Path traversal attempts (`..`, `/`) are strictly rejected.

---

## 5. Antigravity CLI Bridge (`agy.exe`)

AI Command Center interacts with the Antigravity CLI binary (`agy.exe`):

### Supported Commands
- `agy models`: Lists models available in the current Antigravity environment.
- `agy agents`: Lists configured agents and subagents.
- `agy plugins list`: Displays installed plugins and active extensions.
- `agy -p <prompt>`: Executes a task prompt under the supervision of the Process Supervisor.

### Security & Hardening Safeguards
1. **Argument Whitelisting**: Commands must match a strict allowed list.
2. **Metacharacter Injection Prevention**: Inputs containing shell operators (`&`, `|`, `;`, `$`, `>`, `<`, `` ` ``) are rejected immediately.
3. **Operator Confirmation Checkbox**: Mutating CLI executions require an explicit `confirm: true` payload in the REST request to prevent accidental triggerings.
