---
name: argon-escalation
description: "Operational protocol for Level 4 Escalation to Gemini 4 Argon. Governs escalation criteria, prompt pack synthesis, manual model switching workflow, and returning implementation back to Flash."
---

# Gemini 4 Argon Level 4 Escalation Protocol

This skill details the exact protocol for escalating critical architectural impasses, deep anomalous bugs, or multi-approach failures to **Gemini 4 Argon**.

## 1. Multi-Tier Escalation Hierarchy

- **Level 1 (Self-Verification)**: The assigned specialist (Flash) verifies their own output with tests/builds.
- **Level 2 (Independent Review)**: `qa-engineer` or `code-reviewer` checks the implementation independently.
- **Level 3 (Senior Architect Consultation)**: If a defect repeats or an approach fails, the Director engages `senior-architect` (`Model: 'pro'`) for deep root-cause diagnosis.
- **Level 4 (Gemini 4 Argon Escalation)**: If Senior Architect investigation and two distinct independent approaches fail, or if a fundamental architectural decision exceeds Pro tier reasoning capacity, escalate to **Gemini 4 Argon**.

## 2. Autonomous Escalation Detection & Sensitivity Modes

The AI Command Center continuously monitors task execution and subagent reports. When triggered:
- **`[ARGON ESCALATION REQUIRED]`**: The official system message generated when autonomous criteria are met.
- **Non-Blocking Invariant**: The blocked subtask enters `Argon_L4` stage, while safe parallel subtasks continue uninterrupted.
- **Sensitivity Thresholds**:
  - `Conservative`: 3 consecutive failed retries required.
  - `Balanced` (Default): 2 warnings, 3 escalate; immediate escalation on deadlock impasse or contradictory agent reports.
  - `Aggressive`: 1 warning, 2 escalate; immediate escalation on any high-risk concurrency or architectural hazard.

## 3. 18-Point Prompt Pack Generator

To ensure maximal reasoning density and eliminate context pollution, the Director compiles a structured 18-point package:

1. **Title & Executive Metadata**: Task ID, timestamp, priority, sensitivity profile.
2. **Root Problem Statement & Symptoms**: Concise description of failure and behavior.
3. **Affected Subsystems & Component Architecture**: Service nodes, DB layer, client sync.
4. **Minimal Isolated Code Context**: 20-60 lines reproducing the issue.
5. **Reproduction Steps & Failure Conditions**: Deterministic steps to reproduce.
6. **Sanitized Stack Traces & Error Logs**: Fully scrubbed of API keys, tokens, and personal paths.
7. **Failed Approach 1**: Specialist hypothesis and why it failed.
8. **Failed Approach 2**: Senior Architect hypothesis and why it failed.
9. **Ruled-Out Hypotheses**: Ineffective ideas already tested and rejected.
10. **System Invariants & Strict Constraints**: E.g., SQLite WAL zero-loss integrity, non-blocking UI.
11. **Agent Contradictions & Divergent Findings**: Conflicts between specialist reports.
12. **Diagnostic Impasse & Concurrency/Race Analysis**: Technical root causes.
13. **Security & Compliance Implications**: OWASP, personal data, licenses.
14. **Targeted Directive & Specific Questions for Gemini 4 Argon**: Exact architectural guidance needed.
15. **Required Output Format from Argon**: Root Cause Diagnosis, Architectural Blueprint, Verification Command.
16. **Closed-Loop Handoff Instructions back to Flash / Pro**: Assignment back to Flash workers.
17. **Risk Analysis if Left Unresolved**: Impact on dependent pipelines.
18. **Multi-Tier Verification Plan upon Resolution**: Gate 1, Gate 2, Gate 3 checks.

## 4. Manual Model Switching Workflow

1. Operator copies the 18-point prompt pack from the AI Command Center Escalation Center.
2. Operator switches model selector to **Gemini 4 Argon (High)**.
3. Operator submits the prompt pack and receives the architectural blueprint.
4. Operator switches model back to **Gemini 3.8 Flash High**.
5. Operator submits the response into the Command Center.
6. AI Director analyzes the blueprint and assigns code implementation to Flash subagents.
7. `qa-engineer` verifies the fix and marks the escalation resolved.
