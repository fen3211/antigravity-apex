# Changelog

[English](CHANGELOG.md) • [Русский](CHANGELOG.ru.md)

All notable changes to **Antigravity Apex** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-01

### Initial Open Source Release

The initial production-grade release of **Antigravity Apex**, the premier multi-agent orchestration dashboard for Google Antigravity and the **AI Development Director** framework.

### Added

#### 1. Multi-Agent Orchestration & 17-Role Specialist Pool
- Comprehensive support for the 17-role specialist pool:
  - **Core Roles**: `director` (Gemini 3.8 Flash High), `researcher` (Flash), `frontend-developer` (Flash), `backend-developer` (Flash), `ui-ux-designer` (Flash), `qa-engineer` (Flash), `code-reviewer` (Flash), `senior-architect` (Pro Tier), `legal-compliance` (Flash).
  - **Domain Specialists**: `security-engineer` (Flash/Pro), `devops-engineer` (Flash/Pro), `product-manager` (Flash), `ai-evaluation-engineer` (Flash/Pro), `performance-engineer` (Flash/Pro), `accessibility-specialist` (Flash), `database-specialist` (Flash/Pro), `data-engineer` (Flash/Pro).
- Dynamic concurrency control: configurable up to 6 parallel subagents (`MAX_CONCURRENT_SUBAGENTS = 6`), default concurrency of 3, and a cap of 2 expensive Pro-tier models simultaneously.
- Automatic queue draining with status tracking across `QUEUED`, `STARTING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`, and `TIMEOUT`.

#### 2. Intelligent Level 4 Gemini 4 Argon Escalation Engine
- Complete implementation of the **Argon Escalation Protocol**:
  - Automated detection of two consecutive failed attempts per approach.
  - Automatic escalation to **Level 3: Senior Architect (Pro Tier)**.
  - Upon persistent architectural impasse, generation of the isolated 18-point **Argon Prompt Pack** (minimal reproduction context, proof of two failed attempts, exact architectural diagnosis question).
  - Operator manual model-switching directive without leaking unverified output.
  - Closed-loop de-escalation endpoint (`POST /api/escalations/:id/response`) returning validated architectural solutions back to Flash specialists for code execution.
  - SHA-256 anti-spam cooldown and rejection memory.

#### 3. Multi-Tier Quality Gates & Subagent 9-Point Reporting
- **Gate 1 (L1 Self-Check)**: Mandatory local unit tests, linter checks, and build validation accompanied by strict 9-point subagent reports (Task Name, Status, Summary, Modified Files, Executed Checks, Check Results, Issues & Risks, Pending Items, Recommended Next Steps).
- **Gate 2 (L2 Independent Verification)**: Automated verification through independent `qa-engineer` and `code-reviewer`.
- **Gate 2b (Legal & Compliance Gate)**:
  - Automated trigger evaluation across 10 jurisdiction criteria.
  - Full compliance rules for Russian Federation (`RU`: 152-FZ, 156-FZ isolated consent, 23-FZ primary localization, 149-FZ ORI/social platforms, 243-FZ AI regulation with 01.09.2026 / 01.03.2027 effective date split, Part IV Civil Code copyright, 38-FZ/479-FZ internet advertising, Law 2300-1 / 69-FZ dark pattern ban, 54-FZ online cash registers).
  - Full compliance rules for European Union (`EU_NL`: GDPR / UAVG, EU AI Act risk tiers & Art. 50 transparency, ePrivacy Directive).
  - Harmonization engine for dual jurisdiction (`DUAL_RU_EU`).
  - **Non-blocking invariant**: `BLOCKED_RED` halts only risky sub-operations while allowing safe peripheral tasks (UI styling, tests) to proceed.

#### 4. Zero-Disk-Read Incremental Stream Ingestion
- `JsonlStreamReader` engine reading Antigravity logs (`~/.gemini/antigravity/brain/**/transcript.jsonl`) without repeated disk re-reads.
- Chunked 64 KB buffered reads with byte-level UTF-8 continuation safety (preserving Cyrillic characters and emojis across buffer boundaries).
- Inode, file size, birthtime, and mtime tracking to reliably detect file rotation, truncation, or replacement.
- Post-commit WebSocket broadcast invariant ensuring clients only receive events confirmed in SQLite.
- Deterministic event ID generation via SHA-256 for atomic deduplication.

#### 5. Real-Time Telemetry, Presence & Antigravity Bridge
- Active lock file monitor (`~/.gemini/antigravity/presence/*.lock`).
- Strict separation of confirmed **LIVE** transcript tokens and projected **ESTIMATED** tokens.
- Interactive **Memory Explorer** for reading and editing the Director's persistent knowledge documents (`~/.gemini/antigravity/knowledge/ai-director/`).

#### 6. Refero Vercel Design System & Dual Light/Dark Themes
- Production-grade engineering aesthetic inspired by Refero / Vercel design principles.
- Native Light Theme (Paper White `#FAFAFA`) and Dark Theme (Obsidian Black `#0A0A0A`).
- Zero-flash-of-unstyled-theme (FOUT) inline head bootstrap script.
- Accessible contrast ratios (WCAG 2.1 AA), keyboard focus-visible rings, and mobile responsive drawer.

#### 7. 1-Click Installation Ecosystem
- Windows 1-Click desktop launcher [`setup.cmd`](setup.cmd) / [`setup.bat`](setup.bat).
- Linux / macOS 1-Click launcher [`setup.sh`](setup.sh).
- Remote terminal one-liners `scripts/get.ps1` and `scripts/get.sh`.
- In-App `⚡ 1-Click Setup` button in the dashboard for instant deployment and synchronization of all 17 agents into Antigravity.
- Cloud 1-click sandbox via `.devcontainer/devcontainer.json` for GitHub Codespaces.
