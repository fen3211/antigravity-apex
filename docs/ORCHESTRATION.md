[English](ORCHESTRATION.md) • [Русский](ORCHESTRATION.ru.md)

# Orchestration, Quality Gates & Argon Escalation

This guide explains the operational regulations, triage strategies, multi-tier quality gates, and Level 4 Argon escalation protocols governing the **Antigravity AI Development Director**.

---

## 1. Master Triage Rules

The Director evaluates every incoming request against a strict 3-tier complexity triage:

```
                               Incoming Task
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
           Simple (<15 lines)                 Non-Trivial Task
                    │                                 │
           ┌────────┴────────┐               ┌────────┴────────┐
           │  Solo Execution │               ▼                 ▼
           │  (No Subagents) │       Medium (1–3 files)   Large (Cross-Cutting)
           └─────────────────┘               │                 │
                                             ▼                 ▼
                                    Single Specialist     Parallel Subagents
                                    (e.g., frontend)      (Up to 6 Workers)
```

### Rule A: Simple Tasks (< 15 lines)
- **Scope**: Typos, minor bug fixes, single-line configuration tweaks, single utility functions.
- **Execution**: Handled **Solo** by the Director without spawning subagents, minimizing latency and token overhead.

### Rule B: Medium Tasks (1–3 files)
- **Scope**: Single UI component, single API route, focused database migration, unit test suite.
- **Execution**: Delegated to **exactly ONE** specialist role (e.g., `frontend-developer` or `backend-developer`).

### Rule C: Large Tasks (Cross-Cutting Systems)
- **Scope**: Full-stack features, authentication overhauls, major refactorings, security & compliance audits.
- **Execution**: Broken into independent, modular workstreams and executed in parallel across multiple specialists (up to 6 subagents).
- **Concurrency Caps**:
  - `MAX_CONCURRENT_SUBAGENTS = 6`
  - `DEFAULT_CONCURRENCY = 3`
  - `MAX_CONCURRENT_EXPENSIVE_MODELS = 2` (Pro-tier limit)

---

## 2. Multi-Tier Quality Gates

Every non-trivial task must progress through a sequence of automated Quality Gates before it reaches the `Approved` state:

```
[Task Initiated] ──► [Specialist Work] ──► [Gate 1: L1 Self-Check]
                                                    │
                                             (PASS: 9-pt report)
                                                    ▼
                                            [Gate 2: L2 QA & Review]
                                                    │
                                             (PASS: independent diff)
                                                    ▼
                                            [Gate 2b: Legal Gate]
                                                    │
                                            (GREEN / AMBER)
                                                    ▼
                                            [Task Approved]
```

### Gate 1: L1 Self-Check (Developer Verification)
- **Requirements**:
  - The developer agent must build the project (`npm run build` or equivalent).
  - Code must pass linter checks with zero warnings or errors.
  - Automated tests covering new code must pass.
  - Submission of the mandatory **9-point Subagent Report** (Task Name, Status, What Was Done, Modified Files, Executed Checks, Check Results, Issues & Risks, Pending Items, Next Steps).
- **Enforcement**: Any report missing required fields or containing placeholders like "tests passed verbally" is automatically rejected back to the developer.

### Gate 2: L2 Independent Verification (QA & Code Review)
- **Requirements**:
  - `qa-engineer` runs independent automated test suites, testing edge cases and verifying that existing functionality hasn't regressed.
  - `code-reviewer` reviews the Git diff for memory leaks, unhandled exceptions, type-safety violations, and security flaws.

### Gate 2b: Legal & Compliance Gate
- **When Triggered**: Invoked **before** implementing or releasing features involving personal data, external AI APIs, web scraping, commercial checkout, or advertising.
- **Statutory Audit Rules**:
  - **Russian Federation (`RU`)**: 152-FZ, 156-FZ isolated consent, 23-FZ primary database localization, 149-FZ information dissemination & ORI register, 243-FZ AI regulation (temporal invariant: marking & training effective 01.03.2027), Part IV Civil Code copyright, 38-FZ/479-FZ internet advertising, Law 2300-1 / 69-FZ dark pattern ban, 54-FZ online cash registers.
  - **European Union (`EU_NL`)**: GDPR / UAVG, EU AI Act risk tiers & Art. 50 transparency, ePrivacy Directive.
  - **Dual Harmonization (`DUAL_RU_EU`)**: Harmonizes Russian primary database localization with GDPR Chapter V international transfer mechanisms.
- **Non-Blocking Invariant**: If the Legal Gate returns `BLOCKED_RED`, only the legally risky sub-operation is halted. Peripheral safe tasks (UI styling, test harnesses, mock fixtures) continue unaffected.

---

## 3. Escalation Protocol & Gemini 4 Argon (Level 4)

The AI Development Director strictly enforces a **2-attempt maximum retry budget** per approach:

```
    Attempt 1 (Fails)
           │
           ▼
    Attempt 2 (Fails)
           │
           ▼
[Automatic Lock Triggered]
           │
           ▼
[Level 3: Senior Architect (Gemini Pro)]
           │
   (Persistent Impasse)
           │
           ▼
[Level 4: Gemini 4 Argon Escalation (Closed Contour)]
```

### Level 3: Senior Architect (Pro Tier)
When an agent fails twice on the same approach, the task is automatically reassigned to `senior-architect` powered by **Gemini Pro**. The Senior Architect investigates root causes, race conditions, or flawed design assumptions, producing a structural redesign.

### Level 4: Intelligent Argon Escalation (Autonomous Detection & Closed Contour)

If a task encounters repeated failure or an architectural deadlock, the system activates the **Intelligent Argon Escalation Engine**:

#### 1. Autonomous Detection Signals & Sensitivity Modes
The system continuously evaluates tasks via `EscalationManager`:
- **Repeated Failures**: Tracks attempts against configurable thresholds.
- **Diagnostic Impasse**: Detects keywords indicating deadlocks, race conditions, memory leaks, or unreleased thread contention.
- **Agent Contradiction**: Detects conflicting verdicts between independent specialist reports.
- **Sensitivity Switcher**:
  - `Conservative`: Requires 3 consecutive failed retries before escalating.
  - `Balanced` (Default): Warning on retry 2; escalates on retry 3, diagnostic impasse, or agent contradiction.
  - `Aggressive`: Warning on retry 1; escalates on retry 2 or critical concurrency hazards.
- **Non-Blocking Invariant**: The escalated subtask is quarantined in `Argon_L4`, while safe parallel tasks continue running unblocked.
- **System Directive**: Emits official message `[ARGON ESCALATION REQUIRED]`.

#### 2. 18-Point Prompt Pack Generator with Automated Sanitization
The Director synthesizes a structured 18-point package formatted for maximum reasoning efficiency:
1. Title & Executive Metadata (Timestamp, Task ID, Priority, Sensitivity Profile).
2. Root Problem Statement & Symptoms.
3. Affected Subsystems & Component Architecture.
4. Minimal Isolated Code Context (20–60 lines).
5. Reproduction Steps & Failure Conditions.
6. Sanitized Stack Traces & Error Logs (API keys and user home directories are regex-masked).
7. Failed Approach 1 (Specialist hypothesis and failure mechanism).
8. Failed Approach 2 (Senior Architect hypothesis and failure mechanism).
9. Ruled-Out Hypotheses & Ineffective Fixes.
10. System Invariants & Strict Constraints (SQLite WAL integrity, non-blocking UI).
11. Agent Contradictions & Divergent Findings.
12. Diagnostic Impasse & Concurrency/Race Analysis.
13. Security & Compliance Implications (OWASP, 152-FZ, GDPR).
14. Targeted Directive & Specific Questions for Gemini 4 Argon.
15. Required Output Format from Argon (Root Cause, Architectural Blueprint, Verification Command).
16. Closed-Loop Handoff Instructions back to Gemini Flash / Pro.
17. Risk Analysis if Left Unresolved.
18. Multi-Tier Verification Plan upon Resolution.

#### 3. Dashboard Integration & Workflow
- **Mission Control Banner**: Prominent `[ARGON ESCALATION REQUIRED]` alert banner with quick-copy actions.
- **Sidebar Counter**: Live badge counter on the **Argon Escalations** tab.
- **Escalation Center**: Filter by status, priority, and date, with instant copy-to-clipboard confirmation.
- **Closed-Loop Resolution**: Operator pastes Argon's response into the modal. The Director digests the blueprint, generates an execution directive, and hands off implementation back to Gemini 3.8 Flash High specialists.

---

## 4. Git Worktree Isolation for Parallel Agents

When multiple subagents work on independent tasks simultaneously:
- Avoid editing overlapping files concurrently to prevent merge conflicts.
- For substantial feature branches, use Git Worktrees:
  ```bash
  git worktree add ../feature-auth feature/auth
  git worktree add ../feature-billing feature/billing
  ```
- Each specialist works within its dedicated worktree, running isolated test suites before merging into the main working tree.
