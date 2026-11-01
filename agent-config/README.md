# AI Development Director - Agent Configuration Package

[English](README.md) • [Русский](README.ru.md)

This package bundles the complete, production-tested configuration for the **AI Development Director multi-agent system** in Google Antigravity.

## Package Contents

- **`agents/`**: Universal Markdown definitions for all 17 specialized roles:
  1. `director` (Gemini 3.8 Flash High - Orchestrator)
  2. `researcher` (Gemini Flash - Codebase & Tech Research)
  3. `senior-architect` (Gemini Pro - System Design & L3 Escalation)
  4. `frontend-developer` (Gemini Flash - UI, React, CSS, A11y)
  5. `backend-developer` (Gemini Flash - APIs, Schemas, Auth, Services)
  6. `ui-ux-designer` (Gemini Flash - Ergonomics & Design Systems)
  7. `qa-engineer` (Gemini Flash - Automated Tests & Quality Gates)
  8. `code-reviewer` (Gemini Flash - Diff Audits & Security)
  9. `legal-compliance` (Gemini Flash - Legal Advisor & Technical Writer)
  10. `security-engineer` (Gemini Flash / Pro - OWASP & DevSecOps)
  11. `devops-engineer` (Gemini Flash / Pro - CI/CD & Infrastructure)
  12. `product-manager` (Gemini Flash - User Stories & MVP Scoping)
  13. `ai-evaluation-engineer` (Gemini Flash / Pro - LLM Quality & Evals)
  14. `performance-engineer` (Gemini Flash / Pro - Speed & Core Web Vitals)
  15. `accessibility-specialist` (Gemini Flash - WCAG 2.1/2.2 Compliance)
  16. `database-specialist` (Gemini Flash / Pro - Schemas & Index Tuning)
  17. `data-engineer` (Gemini Flash / Pro - Streaming & Data Ingestion)

- **`rules/`**: Global system instructions and operational invariants:
  - `AGENTS.md`: Specialist dispatch limits (max 6 parallel, default 3, max 2 pro), Legal Gate 2b, Argon escalation protocol.
  - `GEMINI.md`: Full Director persona, triage matrix, multi-stage quality gates, reporting protocols.

- **`skills/`**: Orchestration runbooks:
  - `director-orchestration/SKILL.md`: Master runbook for task sizing, specialist routing, and quality gates.
  - `argon-escalation/SKILL.md`: Level 4 Argon Escalation operational protocol.

- **`templates/`**: Starter templates:
  - `agent-template.md`: Template for authoring custom agents.
  - `skill-template.md`: Template for authoring custom skills.
  - `project-rules-template.md`: Project-specific rule extension template.
  - `escalation-pack-template.md`: Argon Level 4 escalation prompt pack.

## ⚡ 1-Click Fast Installation

### Windows (1-Click)
Run `..\setup.cmd` or from PowerShell:
```powershell
..\scripts\install.ps1 -Force
```

### macOS / Linux (1-Click)
```bash
../scripts/install.sh --force
```

### In-App 1-Click Sync
Inside the AI Command Center web UI, click **`⚡ 1-Click Setup`** in the header or **`1-Click Sync Antigravity`** on the Agents page.
