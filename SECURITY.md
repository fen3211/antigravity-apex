# Security Policy

[English](SECURITY.md) • [Русский](SECURITY.ru.md)

## Supported Versions

Only the latest major and minor release versions receive security updates and vulnerability patches.

| Version | Supported          | Security Maintenance Level |
| ------- | ------------------ | -------------------------- |
| 1.0.x   | :white_check_mark: | Full Active Support        |
| < 1.0.0 | :x:                | End of Life (Deprecated)   |

---

## Reporting a Vulnerability

We take the security of Antigravity Apex and connected Google Antigravity workspaces seriously. If you discover a vulnerability or potential security flaw, please follow our responsible disclosure protocol:

1. **Do NOT open public GitHub issues or public discussions** for security vulnerabilities.
2. Submit a report privately via **GitHub Private Security Advisories** or send an email to:
   `security@antigravity-apex.local` (or the repository maintainers via GitHub profile contacts).
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

Antigravity Apex implements multi-layered defense-in-depth mechanisms designed specifically for local AI orchestration dashboards:

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
- Shell metacharacters (`&`, `|`, `;`, `$`, `>`, `<`, `` ` ``) are rejected at the router level.
- On Windows, subagent processes are killed via explicit tree termination (`taskkill /T /F`) to prevent orphaned zombie processes.

### 4. Path Traversal Defenses
- Reading and writing files in the Director Knowledge Base (`~/.gemini/antigravity/knowledge/ai-director/`) is strictly confined to `.md` files without path traversal sequences (`..`, `/`, `\`).
- Transcripts ingestion only reads files matching the validated Antigravity path predicate.

### 5. Sanitized Level 4 Argon Escalation Packs
- System paths containing the operator's local username (`C:\Users\<username>` $\to$ `~`) are automatically redacted before prompt packs are generated.
- Sensitive environment secrets, API keys, and credential formats are masked using regular expression sanitizers.

### 6. Production Deployment Restrictions
- Agents and automated scripts are strictly prohibited from performing non-sanctioned production deployments.
