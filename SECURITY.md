# Security Policy

## Supported Versions

Only the latest major and minor release versions receive security updates and vulnerability patches.

| Version | Supported          | Security Maintenance Level |
| ------- | ------------------ | -------------------------- |
| 1.0.x   | :white_check_mark: | Full Active Support        |
| < 1.0.0 | :x:                | End of Life (Deprecated)   |

---

## Reporting a Vulnerability

We take the security of AI Command Center and connected Google Antigravity workspaces seriously. If you discover a vulnerability or potential security flaw, please follow our responsible disclosure protocol:

1. **Do NOT open public GitHub issues or public discussions** for security vulnerabilities.
2. Submit a report privately via **GitHub Private Security Advisories** or send an email to:
   `security@ai-command-center.local` (or the repository maintainers via GitHub profile contacts).
3. **Information to include in your report**:
   - Detailed description of the vulnerability and attack vector.
   - Proof of Concept (PoC) code or step-by-step reproduction instructions.
   - Component affected (e.g., API router, WebSocket server, CLI bridge, Process Supervisor, SQLite engine).
   - Potential impact (e.g., Remote Code Execution, Privilege Escalation, Path Traversal, Denial of Service).
   - Your proposed remediation or patch, if available.

### Response Timeframe
- **Initial Acknowledgement**: Within 24–48 hours of receipt.
- **Triage & Assessment**: Within 72 hours.
- **Patch Release & Advisory Publication**: Typically within 7–14 days depending on vulnerability severity.

---

## Security Architecture & Built-in Safeguards

AI Command Center implements multi-layered defense-in-depth mechanisms designed specifically for local AI orchestration dashboards:

### 1. Loopback Binding & CORS Whitelist
- By default, the server binds strictly to the local loopback interface (`127.0.0.1`).
- The Express HTTP server and WebSocket server validate incoming requests against an explicit origin whitelist (`CONFIG.ALLOWED_ORIGINS`). Rogue web applications running in the user's browser cannot send cross-origin requests to execute commands or query telemetry.

### 2. Cryptographic API Key & Timing-Safe Verification
- System operations require authentication via a 32-byte cryptographic hex token (`COMMAND_CENTER_API_KEY`).
- Token verification utilizes `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
- Local bootstrapping endpoint (`GET /api/auth/token`) is restricted strictly to local loopback addresses and authorized browser origins.

### 3. Command Injection & Subprocess Hardening
- Arbitrary terminal commands are prohibited.
- Interaction with the Antigravity engine is restricted to a strictly defined whitelist of commands (`agy models`, `agy agents`, `agy plugins list`, `agy -p`).
- Agent identifiers and input parameters are enforced with regular expressions (`^[a-zA-Z0-9_-]+$`) and validated through Zod schemas.
- Shell metacharacters (`&`, `|`, `;`, `$`, `>`, `<`, `` ` ``) are explicitly rejected before reaching any process spawning mechanism.

### 4. Path Traversal Defense
- File operations on knowledge base documents (`/api/knowledge/*`) enforce filename regex constraints (`^[a-zA-Z0-9_-]+\.md$`).
- Any attempt to provide relative path traversals (e.g., `..`, `../`, `..\`) is intercepted and rejected with HTTP 400.

### 5. WebSocket DoS & Payload Boundaries
- WebSocket frames are capped at a maximum payload of 64 KB (`MAX_WS_PAYLOAD`). Any frame exceeding this limit triggers immediate socket disconnection (code `1009`).
- Heartbeat ping-pong mechanisms monitor stale connections and terminate dead sockets cleanly.

### 6. Process Supervisor & Resource Quotas
- Subagent processes spawned by the supervisor are isolated with explicit timeout enforcement.
- When a task exceeds its maximum execution window or is aborted by the operator, the supervisor executes a complete process tree termination (`taskkill /T /F` on Windows) to prevent runaway or orphan processes.

### 7. Zero-Disk-Read & Ingestion Boundaries
- The JSONL stream reader maintains strict byte-offset tracking, chunk boundaries (64 KB), UTF-8 continuation safety, and inode verification.
- Malformed JSON fragments do not crash the engine or trigger infinite loops; atomic SQLite transactions guarantee event deduplication.

---

## Best Practices for Operators

1. **Environment Secrets**: Never commit `.env` containing API keys or private tokens to public repositories. Ensure `.env` is listed in your `.gitignore`.
2. **External AI API Credentials**: Keep Google Cloud and Gemini API tokens in your operating system environment variables or user-level Antigravity configuration files.
3. **Legal Compliance Auditing**: Always trigger the Legal Gate (`POST /api/legal/evaluate` or `POST /api/legal/assess`) prior to deploying workflows involving personal data collection or commercial external API integration.
