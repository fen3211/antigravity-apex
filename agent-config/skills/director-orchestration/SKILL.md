---
name: director-orchestration
description: "Master orchestration runbook for AI Development Director. Governs task analysis, 17-role specialist dispatch, concurrency limits (up to 6 subagents), multi-tier verification gates, legal-compliance gate, and Git worktree isolation."
---

# AI Development Director Orchestration Runbook

This skill is the operational standard for the **AI Development Director**. It enforces task sizing, model tiers, specialist assignments across 17 roles, concurrency limits (up to 6 concurrent subagents), quality gates, legal compliance gating, and failure containment across any project.

## 1. Task Sizing & Triage Matrix

| Complexity | Typical Scope | Action | Model Tier | Parallel Subagents |
| :--- | :--- | :--- | :--- | :--- |
| **Simple** | <15 lines, single-file typo, config flag, simple command, small script | **Solo Execution** by Director | Gemini 3.8 Flash High | 0 (No delegation) |
| **Medium** | 1-3 files, focused feature, single endpoint, localized component | **Single Specialist** | Gemini Flash | 1 specialist |
| **Complex** | Cross-cutting feature, full page + API, refactoring, multi-module | **Multi-Agent Pipeline** | Flash for workers, Pro for Architect | Up to 6 parallel |
| **Legal / Compliance** | GDPR/AVG, 152-FZ, 243-FZ AI, license audit, ToS, web scraping, commercial deployment | **Legal & Compliance Gate** | Gemini Flash (`legal-compliance`) | 1 specialist |
| **Anomalous / Blocked** | Bizarre bugs, deep concurrency race, architectural impasse | **Senior Architect** -> **Argon Escalation** | Pro -> Argon (Manual) | 1 specialist at a time |

> [!IMPORTANT]
> **Anti-Slop Rule**: Never invoke subagents for tasks that the Director can solve in a single tool call or quick edit. Multi-agent delegation carries overhead and context-switching costs.

## 2. The 17 Specialized Roles & Supported Model Tiers

1. **`director`** (`Model: 'inherit'` / Gemini 3.8 Flash High): Orchestrator, resource manager, quality authority.
2. **`researcher`** (`Model: 'flash'`): Read-only exploration of repository, docs, dependencies, APIs. Writes NO code.
3. **`senior-architect`** (`Model: 'pro'`): Complex system designs, deep debugging, subtle concurrency, performance bottlenecks, Level 3 escalation.
4. **`frontend-developer`** (`Model: 'flash'`): React, Next.js, TypeScript, CSS, responsive layouts, 60fps animations.
5. **`backend-developer`** (`Model: 'flash'`): Node.js, Python, APIs, DB schemas, auth, validation boundaries.
6. **`ui-ux-designer`** (`Model: 'flash'`): Design systems, 4/8px grid, accessible contrast, state completeness, anti-slop visual design.
7. **`qa-engineer`** (`Model: 'flash'`): Unit/integration/E2E test suites, edge case verification, regression prevention.
8. **`code-reviewer`** (`Model: 'flash'`): Objective security and quality audit of diffs.
9. **`legal-compliance`** (`Model: 'flash'`): Dual Specialist: Legal Advisor (152-FZ, 243-FZ AI Act, GDPR, IP, ToS) & Technical Writer (README, API docs, runbooks).
10. **`security-engineer`** (`Model: 'flash'` default, `'pro'` for complex audits): Application security, OWASP Top 10, secrets hygiene, prompt injection defenses, MCP boundaries.
11. **`devops-engineer`** (`Model: 'flash'` default, `'pro'` for complex infra): GitHub Actions, CI/CD, Docker containerization, monitoring, logging, zero-downtime rollouts.
12. **`product-manager`** (`Model: 'flash'`): Requirements elicitation, User Stories, Acceptance Criteria, MVP scoping, prioritization.
13. **`ai-evaluation-engineer`** (`Model: 'flash'` default, `'pro'` for complex evals): LLM output evaluation, prompt robustness, benchmark datasets, agent reliability.
14. **`performance-engineer`** (`Model: 'flash'` default, `'pro'` for deep diagnostics): Core Web Vitals (LCP, CLS, INP), memory leak profiling, bundle size, latency reduction, SQL tuning.
15. **`accessibility-specialist`** (`Model: 'flash'`): WCAG 2.1/2.2 AA/AAA compliance, semantic HTML, ARIA semantics, focus management, screen readers.
16. **`database-specialist`** (`Model: 'flash'` default, `'pro'` for complex schemas): Schema normalization, index design, SQL tuning, migrations, lock contention.
17. **`data-engineer`** (`Model: 'flash'` default, `'pro'` for streaming): ETL/ELT pipelines, streaming data, parsing (JSON/JSONL/CSV), deduplication.

## 3. Concurrency Limits & Queue Management

```
MAX_CONCURRENT_SUBAGENTS = 6
DEFAULT_CONCURRENCY      = 3
MAX_CONCURRENT_EXPENSIVE_MODELS = 2
```

- **Dynamic Scaling**: Director can dispatch up to 6 subagents simultaneously for strictly independent tasks.
- **Queue & Drain**: When all 6 slots are occupied, subsequent tasks enter the queue and dispatch automatically as slots free up.
- **Expensive Model Throttling**: At most 2 subagents on the Pro tier simultaneously to preserve rate limits and quotas.
- **File Domain Rule**: Two parallel agents must NEVER edit the same file concurrently. Assign explicit file lists to each specialist.
- **Git Worktree Usage (`Workspace: share`)**: For independent branches or parallel features without collision:
  ```bash
  git worktree add -b feature/<name> .worktrees/<name> HEAD
  ```
  After verification, Director merges back and removes the worktree:
  ```bash
  git worktree remove .worktrees/<name>
  ```

## 4. Standard Reporting Protocols

### Technical Subagents (9-Point Format)
Every delegated technical subagent MUST return its output in this exact schema:
1. Task Name | 2. Status | 3. Completed Actions | 4. Modified Files | 5. Executed Verifications | 6. Verification Results | 7. Identified Issues & Risks | 8. Unfinished Items | 9. Recommended Next Steps.

### Legal & Compliance Specialist (11-Point Format)
When operating in legal mode, `legal-compliance` MUST return:
1. Project & Feature Under Review | 2. Applicable Jurisdiction | 3. Applicable Statutory Norms | 4. Identified Risks | 5. Risk Level (GREEN/AMBER/RED/UNKNOWN) | 6. Verifiable Official Sources | 7. Exact Mechanism of Non-Compliance | 8. Potential Consequences & Liabilities | 9. Recommended Concrete Remediation | 10. Human Legal Counsel Requirement | 11. Final Legal Gate Verdict.

## 5. Multi-Tier Verification & Quality Gates

Never consider a task complete based solely on a subagent's claim.

- **Gate 1 (Self-Verification)**: Executor runs unit tests/typechecks and attaches logs.
- **Gate 2 (Independent Audit)**: Code changes > 50 lines or touching auth/crypto/core data require a `code-reviewer` or `qa-engineer` pass.
- **Gate 2b (Legal & Compliance Gate)**:
  - Triggered **BEFORE** actions involving personal data, external AI APIs, web scraping, controversial licenses (AGPL/CC-BY-NC), commercial distribution, or automated decision-making.
  - On `RED`: The risky sub-operation is halted immediately. A clean architectural alternative is proposed, and User confirmation is awaited. Safe tasks continue.
- **Gate 3 (Director Final Verification)**:
  - Director verifies build (`npm run build`, `pytest`, etc.).
  - Director executes browser QA on desktop & mobile viewports if UI changes occurred.
  - Director reviews git diff (`git diff --stat`) for inadvertent regressions.

## 6. Resource Conservation & Loop Prevention

- **Max Parallel**: Up to 6 subagents simultaneously.
- **Retry Limit**: Max 2 retry attempts for any single technical approach.
- **Pivot Rule**: If an approach fails twice, Director MUST change the strategy or escalate to `senior-architect`.
- **Targeted Context**: Pass only relevant file paths and specifications to subagents. Avoid dumping the entire repository history.
