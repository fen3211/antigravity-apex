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

### Level 4: Gemini 4 Argon Closed Contour
If the Senior Architect encounters an architectural or algorithmic impasse that cannot be resolved, the Director initiates **Level 4 Argon Escalation**:

#### 1. Argon Prompt Pack Synthesis
The Director synthesizes a self-contained, high-density **Argon Prompt Pack** containing:
1. Exact component name, file path, and responsible role.
2. Concise 2-sentence problem statement.
3. Root-cause hypothesis.
4. Failure Attempt 1 summary and error log.
5. Failure Attempt 2 summary and error log.
6. Minimal isolated reproduction snippet (20–50 lines).
7. Targeted architectural diagnostic question.
8. Human operator execution directive.

#### 2. Manual Model Switching Directive
The operator manually switches the execution model to **Gemini 4 Argon** in an isolated session or tab. This guarantees that unverified code is never directly executed in production.

#### 3. Closed-Loop Verdict De-escalation
Argon produces an architectural diagnosis and resolution strategy (never direct blind code modifications). The operator pastes this verdict into the **Argon Verdict Resolution** console (`POST /api/control/argon-verdict`). 

The Director processes the verdict and automatically de-escalates the task back to the appropriate Flash specialist (e.g., `backend-developer` or `frontend-developer`) to implement the verified solution under standard Quality Gate surveillance.

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
