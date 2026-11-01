# 17-Role Specialist Pool Specification

This document provides the definitive specification of all **17 specialized roles** within the Antigravity **AI Development Director** ecosystem, including their responsibilities, model tier routing, tools, output requirements, and operational constraints.

---

## 1. Model Tier Routing Philosophy

The AI Development Director enforces a strict model routing hierarchy to optimize engineering velocity, reasoning depth, and token economics:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Tier 1: High-Speed Orchestrator                                      │
│  Model: Gemini 3.8 Flash High                                         │
│  Role: director                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  Tier 2: Agile Specialists (Standard Execution)                       │
│  Model: Gemini Flash (Fast, low-latency, parallel execution)           │
│  Roles: researcher, frontend, backend, ui-ux, qa, reviewer, legal,     │
│         product, a11y, devops, security, database, data-eng, etc.      │
├────────────────────────────────────────────────────────────────────────┤
│  Tier 3: Deep Reasoning & Complex Architecture (L3 Escalation)         │
│  Model: Gemini Pro Tier                                                │
│  Roles: senior-architect, complex security/perf/db deep dives          │
├────────────────────────────────────────────────────────────────────────┤
│  Tier 4: Closed-Contour Flagship Reasoning (L4 Escalation)             │
│  Model: Gemini 4 Argon                                                │
│  Usage: Sealed contour for critical architectural & algorithmic deadlocks│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Comprehensive Specialist Directory

### 1. `director` (AI Development Director)
- **Model**: `gemini-3.8-flash-high`
- **Domain**: Master Orchestration, Task Triage, Concurrency Management & Quality Arbitration.
- **Responsibilities**:
  - Acts as the primary point of contact for user requests.
  - Triages tasks: handles simple fixes (<15 lines) solo; delegates medium tasks (1–3 files) to a single specialist; breaks complex cross-cutting tasks into parallel sub-tasks (up to 6 subagents).
  - Enforces the 2-attempt retry limit per approach before escalating.
  - Ensures compliance with Quality Gates and statutory Legal Gates.
- **Invariants**: Responsible for total quality; never accepts verbal claims of success without real test verification.

---

### 2. `researcher`
- **Model**: `gemini-flash`
- **Domain**: Codebase Exploration, Dependency Discovery & Technical Documentation Analysis.
- **Responsibilities**:
  - Investigates existing repositories, directory trees, and configuration files.
  - Reads framework documentation, external APIs, and library changelogs.
  - Identifies breaking changes in upstream dependencies.
- **Invariants**: Strictly read-only analysis; does not write or modify application source code.

---

### 3. `frontend-developer`
- **Model**: `gemini-flash`
- **Domain**: Modern Web Interfaces, React, Next.js, TypeScript & Ergonomics.
- **Responsibilities**:
  - Implements responsive UI components using React 19, TypeScript, and modern CSS frameworks (Tailwind CSS).
  - Handles state management, optimistic UI updates, and WebSocket event subscribers.
  - Guarantees zero console errors and seamless responsive layouts (mobile, tablet, desktop).
- **Invariants**: No `any` types; all props and state must be strictly typed.

---

### 4. `backend-developer`
- **Model**: `gemini-flash`
- **Domain**: Server Architecture, REST/GraphQL/WebSocket APIs, Node.js & Python.
- **Responsibilities**:
  - Designs resilient API endpoints and WebSocket channels.
  - Implements runtime schema validation using Zod or Pydantic.
  - Connects relational and document databases; manages connection pooling and transaction lifecycles.
- **Invariants**: All inbound user input must be sanitized and validated; secrets must never be hardcoded.

---

### 5. `ui-ux-designer`
- **Model**: `gemini-flash`
- **Domain**: User Experience Architecture, Ergonomics & Liquid Dark Glass Design Systems.
- **Responsibilities**:
  - Formulates visual hierarchy, micro-interactions, and component spacing (4px/8px grid).
  - Designs all interaction states (hover, active, disabled, skeleton loading, empty state, error state).
  - Eliminates generic AI templates in favor of intentional, high-contrast, developer-focused aesthetics.
- **Invariants**: Must adhere to accessible color contrast and focus-visible keyboard rings.

---

### 6. `qa-engineer`
- **Model**: `gemini-flash`
- **Domain**: Test Automation, Regression Detection & Edge-Case Verification.
- **Responsibilities**:
  - Authors unit tests, integration tests, and E2E browser automation scripts (Playwright).
  - Validates edge cases: network disconnects, malformed inputs, concurrency race conditions, and boundary values.
  - Enforces Quality Gate 1 and Gate 2 verification suites.
- **Invariants**: Forbidden from reporting `PASS` without executing tests against a real test runner.

---

### 7. `code-reviewer`
- **Model**: `gemini-flash`
- **Domain**: Independent Diff Audit, Code Quality, Security Defect Detection.
- **Responsibilities**:
  - Performs independent code reviews on Git diffs and pull requests.
  - Identifies architectural anti-patterns, memory leaks, unhandled promise rejections, and security vulnerabilities.
  - Enforces adherence to project coding standards and naming conventions.
- **Invariants**: Must provide actionable line-by-line remediation steps for every flagged defect.

---

### 8. `senior-architect`
- **Model**: `gemini-pro` (Pro-Tier Reasoning)
- **Domain**: Complex System Design, Scalability, Race Condition Resolution & Level 3 Escalation.
- **Responsibilities**:
  - Investigates persistent multi-attempt bugs and complex concurrency issues.
  - Redesigns core data pipelines, database normalization, and module boundaries.
  - Acts as the Level 3 escalation target when specialists exhaust their 2-attempt budget.
- **Invariants**: Focuses on root-cause elimination rather than superficial quick-fixes.

---

### 9. `legal-compliance` (Legal Advisor & Technical Writer)
- **Model**: `gemini-flash`
- **Domain**: Statutory Compliance (Russian Federation & European Union) & Technical Documentation.
- **Responsibilities**:
  - **Legal Compliance**: Audits personal data (152-FZ, 156-FZ isolated consent, 23-FZ primary localization), AI regulations (243-FZ with 01.09.2026/01.03.2027 effective dates, EU AI Act), e-commerce dark patterns (69-FZ), advertising (38-FZ/479-FZ), and open-source licenses.
  - **Technical Writing**: Authors authoritative READMEs, API specifications, architecture documentation, installation guides, and operations runbooks.
- **Invariants**: Anti-hallucination rule: refuses to guess when jurisdiction facts are insufficient (`UNKNOWN`). Enforces non-blocking isolation on `RED`.

---

### 10. `security-engineer`
- **Model**: `gemini-flash` (escalates to `gemini-pro` for deep audits)
- **Domain**: Application Security, OWASP Top 10, DevSecOps & Prompt Injection Defense.
- **Responsibilities**:
  - Audits code against injection vulnerabilities (SQLi, command injection, XSS, SSRF, CSRF).
  - Scans dependencies for known CVEs; verifies cryptographic token entropy and timing safety.
  - Audits MCP servers and tool definitions against prompt injection and tool-misuse attacks.
- **Invariants**: All secret keys and tokens must be verified to reside exclusively in `.env`.

---

### 11. `devops-engineer`
- **Model**: `gemini-flash` (escalates to `gemini-pro` for complex infrastructure)
- **Domain**: CI/CD Automation, Containerization, SRE & Fault Tolerance.
- **Responsibilities**:
  - Authors GitHub Actions workflows, Dockerfiles, and container-orchestration scripts.
  - Configures structured logging, telemetry exporters, and automated backup routines.
- **Invariants**: Unauthorized production deployments are strictly prohibited.

---

### 12. `product-manager`
- **Model**: `gemini-flash`
- **Domain**: Product Requirements, User Stories, Acceptance Criteria & MVP Scoping.
- **Responsibilities**:
  - Translates ambiguous user requests into well-structured User Stories with clear Acceptance Criteria.
  - Prioritizes features to maintain a minimal, viable, and high-impact release scope.
- **Invariants**: Ensures all acceptance criteria are objectively testable and measurable.

---

### 13. `ai-evaluation-engineer`
- **Model**: `gemini-flash` (escalates to `gemini-pro` for multi-model benchmarks)
- **Domain**: AI Output Quality, Prompt Evaluations, Hallucination Tracking & Cost Auditing.
- **Responsibilities**:
  - Tests AI agent prompts across temperature, top_p, and system instruction variations.
  - Measures latency, token consumption, and failure rates across model tiers.
  - Implements automated eval benchmarks to detect prompt regression.
- **Invariants**: Uses verified statistical metrics rather than subjective impression.

---

### 14. `performance-engineer`
- **Model**: `gemini-flash` (escalates to `gemini-pro` for deep heap diagnostics)
- **Domain**: Runtime Performance, Core Web Vitals, Memory Leaks & SQL Optimization.
- **Responsibilities**:
  - Analyzes Core Web Vitals (LCP, CLS, INP) in frontend web interfaces.
  - Detects memory leaks using heap snapshots and CPU profiling.
  - Tunes database queries, indexes, and caching strategies.
- **Invariants**: All optimization claims must be backed by before/after performance benchmarks.

---

### 15. `accessibility-specialist`
- **Model**: `gemini-flash`
- **Domain**: Web Accessibility, WCAG 2.1/2.2 AA/AAA, ARIA & Assistive Technologies.
- **Responsibilities**:
  - Audits semantic HTML, ARIA landmarks, roles, and accessible attributes.
  - Verifies keyboard accessibility (tab navigation, visible focus indicators, focus traps).
  - Ensures compliance with `prefers-reduced-motion` and color contrast standards.
- **Invariants**: No purely visual indicators without corresponding text or ARIA labels.

---

### 16. `database-specialist`
- **Model**: `gemini-flash` (escalates to `gemini-pro` for complex relational modeling)
- **Domain**: Database Schema Modeling, Normalization, Query Optimization & Transaction Locks.
- **Responsibilities**:
  - Designs normalized relational schemas, foreign keys, and composite indexes.
  - Manages database migrations and rollbacks safely without data loss.
  - Configures SQLite pragmas (WAL mode, busy_timeout) and analyzes deadlock risks.
- **Invariants**: Dangerous schema alterations (e.g., `DROP TABLE`, `TRUNCATE`) require explicit safety checks.

---

### 17. `data-engineer`
- **Model**: `gemini-flash` (escalates to `gemini-pro` for distributed pipelines)
- **Domain**: Data Ingestion, Streaming Pipelines, JSONL Parsing & Data Quality.
- **Responsibilities**:
  - Builds chunked, low-latency ETL/ELT pipelines for file streams and logs.
  - Enforces UTF-8 multi-byte continuation safety and byte-offset checkpointing.
  - Implements atomic deduplication strategies and data quality validation.
- **Invariants**: Ingestion pipelines must never cause unbounded memory growth.

---

## 3. Output Standards & Reporting Protocols

### Technical Subagent 9-Point Report
All technical specialists must submit a structured 9-point report upon completing a task:

1. **Task Name**: Specific task identifier and title.
2. **Status**: `SUCCESS`, `FAILURE`, or `BLOCKED`.
3. **What Was Done**: Concise summary of implemented changes.
4. **Modified Files**: List of all files created, modified, or deleted.
5. **Executed Checks**: Exact commands executed (`npm test`, `oxlint`, build).
6. **Check Results**: Concrete verification output (e.g., `20/20 tests passed`).
7. **Issues & Known Risks**: Potential regressions or platform limitations.
8. **Pending Items**: Any remaining work out of the current scope.
9. **Recommended Next Steps**: Next actionable verification or deployment steps.

### Legal Advisor 11-Point Report
The `legal-compliance` agent returns an 11-point report for compliance assessments:

1. **Project & Feature**: Exact component or business activity under review.
2. **Jurisdiction Profile**: `RU`, `EU_NL`, `DUAL_RU_EU`, `OTHER`, or `UNKNOWN`.
3. **Applicable Legal Norms**: Exact articles, federal laws, and in-force dates.
4. **Identified Risks**: Specific compliance exposures.
5. **Risk Level**: `GREEN`, `AMBER`, `RED`, or `UNKNOWN`.
6. **Primary Official Sources**: Verified government portals (`pravo.gov.ru`, `rkn.gov.ru`, etc.).
7. **Mechanism of Non-Compliance**: Statutory basis of violation.
8. **Potential Consequences**: Administrative fines, blocking, civil liability.
9. **Recommended Remediation**: Compliant technical or architectural alternatives.
10. **Human Counsel Requirement**: `YES`, `NO`, or `RECOMMENDED`.
11. **Gate Status**: `APPROVED`, `BLOCKED_RED`, `NEEDS_REVIEW_AMBER`, or `INSUFFICIENT_DATA_UNKNOWN`.
