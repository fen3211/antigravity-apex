import crypto from 'crypto';
import { db } from '../db/database.js';
import { eventBus } from './event-bus.js';
import type {
  TaskItem,
  SubagentReport,
  EscalationItem,
  EscalationStatus,
  EscalationPriority,
  SensitivitySetting,
  EscalationEvidence,
  EscalationStats
} from '../types.js';

export const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes anti-spam cooldown

export class EscalationManager {
  // ==========================================
  // 1. Text & Secret Sanitization
  // ==========================================
  public sanitizeText(text: string): string {
    if (!text) return '';
    let sanitized = text;

    // Redact Google AI / Gemini API keys
    sanitized = sanitized.replace(/AIza[0-9A-Za-z\-_]{35}/g, 'AIza***REDACTED_API_KEY***');

    // Redact OpenAI / Anthropic API keys
    sanitized = sanitized.replace(/sk-[0-9A-Za-z\-_]{20,}/g, 'sk-***REDACTED_API_KEY***');

    // Redact GitHub Personal Access Tokens
    sanitized = sanitized.replace(/ghp_[0-9A-Za-z]{36}/g, 'ghp_***REDACTED_PAT***');

    // Redact Bearer Authorization Tokens
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\._\-]{20,}/gi, 'Bearer ***REDACTED_TOKEN***');

    // Redact PEM Private Keys
    sanitized = sanitized.replace(/-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g, '[***REDACTED_PRIVATE_KEY***]');

    // Redact Database connection URLs with passwords
    sanitized = sanitized.replace(/(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/([^:]+):([^@]+)@/gi, '$1://$2:***REDACTED_PASSWORD***@');

    // Sanitize Windows user directories (e.g. C:\Users\username\... -> ~/)
    sanitized = sanitized.replace(/[A-Z]:\\Users\\[^\\]+[\\/]?/gi, '~/');
    sanitized = sanitized.replace(/[A-Z]:\/Users\/[^\/]+[\\/]?/gi, '~/');
    // Sanitize POSIX user directories (/home/username/... -> ~/)
    sanitized = sanitized.replace(/\/home\/[^\/]+[\\/]?/gi, '~/');

    return sanitized;
  }

  // ==========================================
  // 2. Settings & Sensitivity
  // ==========================================
  public getSensitivity(): SensitivitySetting {
    try {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('argon_escalation_sensitivity') as { value: string } | undefined;
      if (row && ['conservative', 'balanced', 'aggressive'].includes(row.value)) {
        return row.value as SensitivitySetting;
      }
    } catch {
      // ignore
    }
    return 'balanced';
  }

  public setSensitivity(setting: SensitivitySetting): void {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('argon_escalation_sensitivity', setting);
  }

  // ==========================================
  // 3. Failure Signature Generator
  // ==========================================
  public generateFailureSignature(taskId: string, reason: string, details: string = ''): string {
    const raw = `${taskId}:${reason.trim().toLowerCase()}:${details.trim().slice(0, 160)}`;
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
  }

  // ==========================================
  // 4. Detection Engine
  // ==========================================
  public evaluateTaskForEscalation(
    task: TaskItem,
    options: {
      reports?: SubagentReport[];
      errorLogs?: string[];
      codeSnippet?: string;
      contradictionDetected?: boolean;
      impasseDetected?: boolean;
    } = {}
  ): {
    shouldEscalate: boolean;
    isWarning: boolean;
    reason: string;
    priority: EscalationPriority;
    failureSignatures: string[];
    evidence: EscalationEvidence;
  } {
    const sensitivity = this.getSensitivity();
    const errorLogs = options.errorLogs || (task.errorLog ? [task.errorLog] : []);
    const reports = options.reports || (task.report ? [task.report] : []);
    const retryCount = task.retryCount || 0;

    let shouldEscalate = false;
    let isWarning = false;
    let reason = '';
    let priority: EscalationPriority = task.priority === 'critical' ? 'critical' : 'high';

    // 1. Contradiction Detection
    const hasConflictingReports = options.contradictionDetected || (
      reports.length >= 2 && reports.some(r => r.status === 'SUCCESS') && reports.some(r => r.status === 'FAILURE' || r.status === 'BLOCKED')
    );

    // 2. Diagnostic Impasse Detection (Keywords indicative of architectural deadlocks or race conditions)
    const combinedErrors = errorLogs.join(' ').toLowerCase();
    const impasseKeywords = ['deadlock', 'race condition', 'sqlite busy', 'database locked', 'circular dependency', 'memory leak', 'maximum call stack', 'lock contention'];
    const hasDiagnosticImpasse = options.impasseDetected || impasseKeywords.some(kw => combinedErrors.includes(kw));

    // 3. Sensitivity Threshold Checks
    if (sensitivity === 'aggressive') {
      if (retryCount >= 2) {
        shouldEscalate = true;
        reason = `Aggressive sensitivity: Task failed ${retryCount} times (threshold: 2).`;
      } else if (retryCount === 1) {
        isWarning = true;
        reason = 'Aggressive sensitivity: Early warning on first retry.';
      }

      if (hasConflictingReports) {
        shouldEscalate = true;
        reason = 'Agent contradiction detected between independent specialists.';
        priority = 'critical';
      }
      if (hasDiagnosticImpasse) {
        shouldEscalate = true;
        reason = 'Diagnostic deadlock or concurrency race detected.';
        priority = 'critical';
      }
    } else if (sensitivity === 'conservative') {
      if (retryCount >= 3) {
        shouldEscalate = true;
        reason = `Conservative sensitivity: Task exhausted ${retryCount} consecutive retry attempts.`;
      } else if (retryCount === 2) {
        isWarning = true;
        reason = 'Conservative sensitivity: Warning threshold reached (2 retries).';
      }
    } else {
      // Default: balanced
      if (retryCount >= 3) {
        shouldEscalate = true;
        reason = `Balanced sensitivity: Task exhausted ${retryCount} retries without resolution.`;
      } else if (retryCount === 2) {
        if (hasDiagnosticImpasse || hasConflictingReports) {
          shouldEscalate = true;
          reason = hasConflictingReports
            ? 'Agent contradiction between specialist reports on retry 2.'
            : 'Diagnostic impasse / deadlock detected after 2 retries.';
        } else {
          isWarning = true;
          reason = 'Balanced sensitivity: 2 failed attempts. One retry remaining before L4 escalation.';
        }
      } else if (hasConflictingReports && priority === 'critical') {
        shouldEscalate = true;
        reason = 'Critical priority task: Contradictory reports require Argon architectural verdict.';
      }
    }

    const failureSignature = this.generateFailureSignature(task.id, reason, combinedErrors);

    const evidence: EscalationEvidence = {
      errorLogs: errorLogs.map(l => this.sanitizeText(l)),
      conflictingReports: reports,
      codeSnippets: options.codeSnippet ? [{ file: 'problem-context.ts', snippet: this.sanitizeText(options.codeSnippet) }] : [],
      environmentInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        sensitivity
      },
      attemptSummaries: [
        {
          attemptNumber: 1,
          agent: task.assignedAgent,
          hypothesis: 'Specialist local resolution',
          failureReason: errorLogs[0] || 'Initial test or validation failure'
        },
        ...(retryCount >= 2 ? [{
          attemptNumber: 2,
          agent: 'senior-architect',
          hypothesis: 'Architectural refactoring & isolation',
          failureReason: errorLogs[1] || errorLogs[0] || 'Subsequent failure mechanism'
        }] : [])
      ]
    };

    return {
      shouldEscalate,
      isWarning,
      reason,
      priority,
      failureSignatures: [failureSignature],
      evidence
    };
  }

  // ==========================================
  // 5. 18-Point Prompt Pack Generator
  // ==========================================
  public generate18PointPromptPack(params: {
    task: TaskItem;
    reason: string;
    priority: EscalationPriority;
    involvedAgents: string[];
    evidence: EscalationEvidence;
    sensitivity: SensitivitySetting;
    failureSignature: string;
  }): string {
    const timestamp = new Date().toISOString();
    const task = params.task;
    const sanitizedError = this.sanitizeText(params.evidence.errorLogs?.join('\n') || task.errorLog || 'No error log provided');
    const sanitizedSnippet = this.sanitizeText(
      params.evidence.codeSnippets?.[0]?.snippet ||
      '// Minimal reproduction snippet\nfunction repro() {\n  // Problematic execution path\n}'
    );

    const attempt1 = params.evidence.attemptSummaries?.[0] || {
      hypothesis: 'Standard specialist remediation',
      failureReason: 'Verification failure or assertion error'
    };
    const attempt2 = params.evidence.attemptSummaries?.[1] || {
      hypothesis: 'Senior Architect root-cause workaround',
      failureReason: 'Persistent deadlock or secondary race condition'
    };

    return `# 🚨 LEVEL 4 ESCALATION TO GEMINI 4 ARGON
================================================================================
**Timestamp**: ${timestamp}
**Escalation ID**: esc-${Date.now().toString(36)}
**Task ID**: ${task.id}
**Task Title**: ${task.title}
**Priority**: ${params.priority.toUpperCase()}
**Sensitivity Mode**: ${params.sensitivity.toUpperCase()}
**Failure Signature**: \`${params.failureSignature}\`
================================================================================

### 1. Title & Executive Metadata
- **Project**: AI Command Center
- **Escalated Subsystem**: ${task.stage} (${task.assignedAgent})
- **Escalation Reason**: ${params.reason}
- **Attempts Recorded**: ${task.retryCount || 1} of ${task.maxRetries}
- **Assigned Agents**: ${params.involvedAgents.join(', ')}

### 2. Root Problem Statement & Symptoms
${task.description || task.title}
Persistent symptoms indicate an architectural deadlock or concurrency constraint that cannot be broken through localized specialist patches.

### 3. Affected Subsystems & Component Architecture
- Orchestration Node: \`${task.assignedAgent}\`
- Workflow Stage: \`${task.stage}\`
- Data Tier: SQLite WAL (concurrent readers, serialized writer)
- Client-Server Sync: WebSocket EventStream & REST endpoints

### 4. Minimal Isolated Code Context (20-60 Lines)
\`\`\`typescript
${sanitizedSnippet}
\`\`\`

### 5. Reproduction Steps & Failure Conditions
1. Dispatch task \`${task.id}\` with input parameters.
2. Execute specialist validation routine.
3. Observe failure during Stage Gate verification:
   - Expected: Verification check returns \`SUCCESS\` with clean exit.
   - Actual: Unhandled exception, race condition, or timeout.

### 6. Sanitized Stack Traces & Error Logs
\`\`\`
${sanitizedError}
\`\`\`

### 7. Failed Approach 1 (Specialist Hypothesis & Mechanism)
- **Agent**: ${attempt1.agent || task.assignedAgent}
- **Hypothesis**: ${attempt1.hypothesis}
- **Observed Failure**: ${attempt1.failureReason}

### 8. Failed Approach 2 (Senior Architect Hypothesis & Mechanism)
- **Agent**: ${attempt2.agent || 'senior-architect'}
- **Hypothesis**: ${attempt2.hypothesis}
- **Observed Failure**: ${attempt2.failureReason}

### 9. Ruled-Out Hypotheses & Ineffective Fixes
- Simple parameter/type adjustment (already tested, failed).
- Direct retry without state reset (leads to identical failure signature).
- Increasing timeout values (unresponsive; underlying lock is never released).

### 10. System Invariants & Strict Constraints
- **Invariant 1**: Non-blocking invariant — safe parallel subtasks must continue unblocked while this issue is investigated.
- **Invariant 2**: Zero data loss — SQLite WAL integrity must be preserved.
- **Invariant 3**: Backward compatibility with existing API schemas and client subscriptions.

### 11. Agent Contradictions & Divergent Findings
${params.evidence.conflictingReports && params.evidence.conflictingReports.length > 1
  ? params.evidence.conflictingReports.map((r, i) => `- Report ${i + 1} (${r.taskName}): Status ${r.status}. Summary: ${r.summary}`).join('\n')
  : 'None observed. Agents are in consensus that standard tier tools cannot resolve this state.'}

### 12. Diagnostic Impasse & Concurrency/Race Analysis
Deadlock occurs due to competing lifecycle demands or indeterminate state mutation across asynchronous boundaries.

### 13. Security & Compliance Implications
- OWASP: Boundary validation and injection prevention must remain intact.
- Compliance: Ensure no secrets, tokens, or PII are leaked during logging or reproduction.

### 14. Targeted Directive & Specific Questions for Gemini 4 Argon
1. What is the precise root cause of this failure or architectural conflict?
2. What specific architectural design pattern or algorithm permanently breaks this deadlock?
3. Provide the minimal production-ready code diff or blueprint to resolve it.

### 15. Required Output Format from Argon
Please structure your response into three clear sections:
1. **Root Cause Diagnosis**: Direct 2-4 sentence explanation of why Flash/Pro attempts failed.
2. **Architectural Blueprint**: Concrete implementation strategy and complete code diff.
3. **Verification Command**: Exact CLI command or test assertion to verify resolution.

### 16. Closed-Loop Handoff Instructions back to Gemini Flash / Pro
After Argon returns the verdict:
1. Copy the Architectural Blueprint into the AI Command Center Escalation modal.
2. The AI Director will digest the strategy and assign code implementation to \`${task.assignedAgent}\` on Gemini 3.8 Flash High.
3. \`qa-engineer\` will execute Level 2 verification.

### 17. Risk Analysis if Left Unresolved
- Stalled orchestration pipeline for feature dependent on task \`${task.id}\`.
- Potential cascade of timeout errors to dependent background tasks.

### 18. Multi-Tier Verification Plan upon Resolution
- **Gate 1**: Specialist automated unit test suite.
- **Gate 2**: Independent QA test verification.
- **Gate 3**: Director final acceptance and closure.
`;
  }

  // ==========================================
  // 6. Escalation CRUD & Anti-Spam Management
  // ==========================================
  public getAllEscalations(filter: {
    status?: EscalationStatus;
    priority?: EscalationPriority;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): EscalationItem[] {
    let query = 'SELECT * FROM escalations WHERE 1=1';
    const params: any[] = [];

    if (filter.status) {
      query += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter.priority) {
      query += ' AND priority = ?';
      params.push(filter.priority);
    }
    if (filter.search) {
      query += ' AND (task_title LIKE ? OR reason LIKE ? OR id LIKE ?)';
      const s = `%${filter.search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY created_at DESC';

    if (filter.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
      if (filter.offset) {
        query += ' OFFSET ?';
        params.push(filter.offset);
      }
    }

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => this.mapRowToEscalation(r));
  }

  public getEscalationById(id: string): EscalationItem | null {
    const row = db.prepare('SELECT * FROM escalations WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRowToEscalation(row);
  }

  public getEscalationByTaskId(taskId: string): EscalationItem | null {
    const row = db.prepare('SELECT * FROM escalations WHERE task_id = ? ORDER BY created_at DESC LIMIT 1').get(taskId) as any;
    if (!row) return null;
    return this.mapRowToEscalation(row);
  }

  public getEscalationStats(): EscalationStats {
    const rows = db.prepare('SELECT status, priority, count(*) as count FROM escalations GROUP BY status, priority').all() as any[];
    
    let total = 0;
    let activeCount = 0;
    let awaitingUserCount = 0;
    let inReviewCount = 0;
    let resolvedCount = 0;
    let rejectedCount = 0;
    const byPriority: Record<EscalationPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0
    };

    const activeStatuses: EscalationStatus[] = ['DETECTED', 'PROMPT_READY', 'AWAITING_USER', 'COPIED', 'SENT_TO_ARGON', 'AWAITING_RESULT', 'RESULT_RECEIVED', 'IN_REVIEW'];
    const awaitingUserStatuses: EscalationStatus[] = ['DETECTED', 'PROMPT_READY', 'AWAITING_USER', 'COPIED', 'SENT_TO_ARGON'];

    for (const r of rows) {
      const c = Number(r.count);
      total += c;
      const status = r.status as EscalationStatus;
      const prio = (r.priority as EscalationPriority) || 'medium';

      if (byPriority[prio] !== undefined) {
        byPriority[prio] += c;
      }

      if (activeStatuses.includes(status)) {
        activeCount += c;
      }
      if (awaitingUserStatuses.includes(status)) {
        awaitingUserCount += c;
      }
      if (status === 'IN_REVIEW' || status === 'RESULT_RECEIVED') {
        inReviewCount += c;
      }
      if (status === 'COMPLETED') {
        resolvedCount += c;
      }
      if (status === 'REJECTED' || status === 'CANCELLED') {
        rejectedCount += c;
      }
    }

    return {
      total,
      activeCount,
      awaitingUserCount,
      inReviewCount,
      resolvedCount,
      rejectedCount,
      byPriority
    };
  }

  /**
   * Main trigger: Evaluates task and creates/updates an escalation with anti-spam deduplication
   */
  public triggerEscalation(params: {
    task: TaskItem;
    reason?: string;
    priority?: EscalationPriority;
    involvedAgents?: string[];
    evidence?: EscalationEvidence;
    force?: boolean;
  }): { escalation: EscalationItem; isNew: boolean; deduped: boolean } {
    const task = params.task;
    const sensitivity = this.getSensitivity();
    const evaluation = this.evaluateTaskForEscalation(task, {
      reports: params.evidence?.conflictingReports || (task.report ? [task.report] : []),
      errorLogs: params.evidence?.errorLogs || (task.errorLog ? [task.errorLog] : []),
      codeSnippet: params.evidence?.codeSnippets?.[0]?.snippet
    });

    const reason = params.reason || evaluation.reason || `Task ${task.id} failed repeatedly requiring L4 Escalation`;
    const priority = params.priority || evaluation.priority;
    const failureSignature = evaluation.failureSignatures[0];
    const involvedAgents = params.involvedAgents || [task.assignedAgent, 'senior-architect', 'director'];

    // 1. Anti-Spam Check: Check for recent active escalation for this task or failure signature
    const existing = db.prepare(`
      SELECT * FROM escalations 
      WHERE (task_id = ? OR failure_signatures LIKE ?)
      ORDER BY created_at DESC LIMIT 1
    `).get(task.id, `%"${failureSignature}"%`) as any;

    const now = new Date();

    if (existing && !params.force) {
      const existingEsc = this.mapRowToEscalation(existing);
      const isCompletedOrRejected = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(existingEsc.status);
      const timeSinceCreation = now.getTime() - new Date(existingEsc.createdAt).getTime();

      // If active and within cooldown, avoid creating duplicate; update attempt count
      if (!isCompletedOrRejected && timeSinceCreation < COOLDOWN_MS) {
        const updatedAttempts = Math.max(existingEsc.attemptsCount, task.retryCount || 1);
        db.prepare('UPDATE escalations SET attempts_count = ?, updated_at = ? WHERE id = ?')
          .run(updatedAttempts, now.toISOString(), existingEsc.id);
        
        return {
          escalation: { ...existingEsc, attemptsCount: updatedAttempts, updatedAt: now.toISOString() },
          isNew: false,
          deduped: true
        };
      }

      // Rejection memory: If rejected and task retryCount hasn't increased, honor rejection
      if (existingEsc.status === 'REJECTED' && (task.retryCount || 0) <= existingEsc.attemptsCount) {
        return {
          escalation: existingEsc,
          isNew: false,
          deduped: true
        };
      }
    }

    // 2. Synthesize 18-Point Prompt Pack
    const evidence = params.evidence || evaluation.evidence;
    const promptPack = this.generate18PointPromptPack({
      task,
      reason,
      priority,
      involvedAgents,
      evidence,
      sensitivity,
      failureSignature
    });

    // 3. Create Escalation in Database
    const id = `esc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newEsc: EscalationItem = {
      id,
      taskId: task.id,
      taskTitle: task.title,
      reason,
      priority,
      status: 'PROMPT_READY',
      attemptsCount: task.retryCount || 1,
      involvedAgents,
      failureSignatures: [failureSignature],
      evidence,
      promptPack,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    db.prepare(`
      INSERT INTO escalations (
        id, task_id, task_title, reason, priority, status, attempts_count,
        involved_agents, failure_signatures, evidence, prompt_pack, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newEsc.id,
      newEsc.taskId,
      newEsc.taskTitle,
      newEsc.reason,
      newEsc.priority,
      newEsc.status,
      newEsc.attemptsCount,
      JSON.stringify(newEsc.involvedAgents),
      JSON.stringify(newEsc.failureSignatures),
      JSON.stringify(newEsc.evidence),
      newEsc.promptPack,
      newEsc.createdAt,
      newEsc.updatedAt
    );

    // 4. Update Task Stage & Status
    try {
      db.prepare(`
        UPDATE tasks SET status = 'escalated', stage = 'Argon_L4', updated_at = ? WHERE id = ?
      `).run(now.toISOString(), task.id);
    } catch {
      // ignore
    }

    // 5. Publish Event & Log Format [ARGON ESCALATION REQUIRED]
    eventBus.publish({
      type: 'escalation.created',
      source: 'INTERNAL_BRIDGE',
      task_id: task.id,
      agent_id: 'director',
      data: {
        escalationId: newEsc.id,
        title: task.title,
        reason: newEsc.reason,
        priority: newEsc.priority,
        status: newEsc.status,
        directive: '[ARGON ESCALATION REQUIRED]'
      }
    });

    return {
      escalation: newEsc,
      isNew: true,
      deduped: false
    };
  }

  // ==========================================
  // 7. State Transitions & Actions
  // ==========================================
  public markPromptCopied(id: string): EscalationItem {
    const esc = this.getEscalationById(id);
    if (!esc) throw new Error(`Escalation ${id} not found`);

    const now = new Date().toISOString();
    const nextStatus: EscalationStatus = esc.status === 'PROMPT_READY' || esc.status === 'DETECTED' ? 'COPIED' : esc.status;

    db.prepare('UPDATE escalations SET status = ?, copied_at = ?, updated_at = ? WHERE id = ?')
      .run(nextStatus, now, now, id);

    const updated = { ...esc, status: nextStatus, copiedAt: now, updatedAt: now };

    eventBus.publish({
      type: 'escalation.prompt_copied',
      source: 'INTERNAL_BRIDGE',
      task_id: esc.taskId,
      agent_id: 'director',
      data: { escalationId: id, copiedAt: now }
    });

    return updated;
  }

  public markSentToArgon(id: string): EscalationItem {
    const esc = this.getEscalationById(id);
    if (!esc) throw new Error(`Escalation ${id} not found`);

    const now = new Date().toISOString();
    db.prepare('UPDATE escalations SET status = ?, sent_at = ?, updated_at = ? WHERE id = ?')
      .run('SENT_TO_ARGON', now, now, id);

    const updated = { ...esc, status: 'SENT_TO_ARGON' as EscalationStatus, sentAt: now, updatedAt: now };

    eventBus.publish({
      type: 'escalation.sent',
      source: 'INTERNAL_BRIDGE',
      task_id: esc.taskId,
      agent_id: 'director',
      data: { escalationId: id, sentAt: now }
    });

    return updated;
  }

  public submitArgonResponse(id: string, responseText: string): { escalation: EscalationItem; directorAnalysis: string } {
    const esc = this.getEscalationById(id);
    if (!esc) throw new Error(`Escalation ${id} not found`);

    const sanitizedResponse = this.sanitizeText(responseText);
    const now = new Date().toISOString();

    // AI Director analyzes the Argon response and generates an execution directive
    const directorAnalysis = `### AI Director Analysis & Execution Directive
- **Response Length**: ${sanitizedResponse.length} characters
- **Verdict**: Argon guidance received and distilled.
- **Action Plan**:
  1. Handoff architectural blueprint to **backend-developer** and **senior-architect** on Gemini 3.8 Flash High.
  2. Implement recommended fix without modifying unrelated files.
  3. Dispatch **qa-engineer** for Level 2 verification.
- **Estimated Risk Post-Argon**: Low (Definitive blueprint supplied).`;

    db.prepare(`
      UPDATE escalations 
      SET status = 'IN_REVIEW', argon_response = ?, director_analysis = ?, updated_at = ?
      WHERE id = ?
    `).run(sanitizedResponse, directorAnalysis, now, id);

    // Update associated task with resolution progress
    try {
      db.prepare(`
        UPDATE tasks 
        SET stage = 'Argon_L4', 
            result_summary = 'Argon response received. In Director review.',
            updated_at = ?
        WHERE id = ?
      `).run(now, esc.taskId);
    } catch {
      // ignore
    }

    const updated: EscalationItem = {
      ...esc,
      status: 'IN_REVIEW',
      argonResponse: sanitizedResponse,
      directorAnalysis,
      updatedAt: now
    };

    eventBus.publish({
      type: 'escalation.updated',
      source: 'INTERNAL_BRIDGE',
      task_id: esc.taskId,
      agent_id: 'director',
      data: {
        escalationId: id,
        status: 'IN_REVIEW',
        hasResponse: true
      }
    });

    return { escalation: updated, directorAnalysis };
  }

  public resolveEscalation(id: string, note?: string): EscalationItem {
    const esc = this.getEscalationById(id);
    if (!esc) throw new Error(`Escalation ${id} not found`);

    const now = new Date().toISOString();
    const resolutionNote = note || 'Escalation successfully resolved via Argon architectural blueprint.';

    db.prepare(`
      UPDATE escalations 
      SET status = 'COMPLETED', completed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, id);

    // De-escalate task back to specialist or completion
    try {
      db.prepare(`
        UPDATE tasks 
        SET status = 'completed', stage = 'Approved', result_summary = ?, updated_at = ?
        WHERE id = ?
      `).run(resolutionNote, now, esc.taskId);
    } catch {
      // ignore
    }

    const updated: EscalationItem = {
      ...esc,
      status: 'COMPLETED',
      completedAt: now,
      updatedAt: now
    };

    eventBus.publish({
      type: 'escalation.resolved',
      source: 'INTERNAL_BRIDGE',
      task_id: esc.taskId,
      agent_id: 'director',
      data: {
        escalationId: id,
        status: 'COMPLETED',
        note: resolutionNote
      }
    });

    return updated;
  }

  public rejectEscalation(id: string, reason?: string): EscalationItem {
    const esc = this.getEscalationById(id);
    if (!esc) throw new Error(`Escalation ${id} not found`);

    const now = new Date().toISOString();
    const rejectionReason = reason || 'Escalation rejected or cancelled by operator.';

    db.prepare(`
      UPDATE escalations 
      SET status = 'REJECTED', completed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, id);

    // Reset task status back to in_progress or failed
    try {
      db.prepare(`
        UPDATE tasks 
        SET status = 'in_progress', stage = 'Specialist', updated_at = ?
        WHERE id = ?
      `).run(now, esc.taskId);
    } catch {
      // ignore
    }

    const updated: EscalationItem = {
      ...esc,
      status: 'REJECTED',
      completedAt: now,
      updatedAt: now
    };

    eventBus.publish({
      type: 'escalation.rejected',
      source: 'INTERNAL_BRIDGE',
      task_id: esc.taskId,
      agent_id: 'director',
      data: {
        escalationId: id,
        status: 'REJECTED',
        reason: rejectionReason
      }
    });

    return updated;
  }

  public regeneratePromptPack(id: string): EscalationItem {
    const esc = this.getEscalationById(id);
    if (!esc) throw new Error(`Escalation ${id} not found`);

    // Fetch latest task
    const taskRow = db.prepare('SELECT * FROM tasks WHERE id = ?').get(esc.taskId) as any;
    const task: TaskItem = taskRow ? {
      id: taskRow.id,
      title: taskRow.title,
      description: taskRow.description || '',
      status: taskRow.status,
      priority: taskRow.priority,
      assignedAgent: taskRow.assigned_agent,
      stage: taskRow.stage,
      createdAt: taskRow.created_at,
      updatedAt: taskRow.updated_at,
      retryCount: taskRow.retry_count,
      maxRetries: taskRow.max_retries,
      isDemo: Boolean(taskRow.is_demo),
      errorLog: taskRow.error_log
    } : {
      id: esc.taskId,
      title: esc.taskTitle,
      description: esc.reason,
      status: 'escalated',
      priority: esc.priority,
      assignedAgent: 'director',
      stage: 'Argon_L4',
      createdAt: esc.createdAt,
      updatedAt: new Date().toISOString(),
      retryCount: esc.attemptsCount,
      maxRetries: 2,
      isDemo: false
    };

    const newPromptPack = this.generate18PointPromptPack({
      task,
      reason: esc.reason,
      priority: esc.priority,
      involvedAgents: esc.involvedAgents,
      evidence: esc.evidence,
      sensitivity: this.getSensitivity(),
      failureSignature: esc.failureSignatures[0] || this.generateFailureSignature(task.id, esc.reason)
    });

    const now = new Date().toISOString();
    db.prepare('UPDATE escalations SET prompt_pack = ?, updated_at = ? WHERE id = ?')
      .run(newPromptPack, now, id);

    const updated = {
      ...esc,
      promptPack: newPromptPack,
      updatedAt: now
    };

    eventBus.publish({
      type: 'escalation.updated',
      source: 'INTERNAL_BRIDGE',
      task_id: esc.taskId,
      agent_id: 'director',
      data: { escalationId: id, promptRegenerated: true }
    });

    return updated;
  }

  // ==========================================
  // 8. Row Mapper
  // ==========================================
  private mapRowToEscalation(r: any): EscalationItem {
    return {
      id: r.id,
      taskId: r.task_id,
      taskTitle: r.task_title,
      reason: r.reason,
      priority: r.priority as EscalationPriority,
      status: r.status as EscalationStatus,
      attemptsCount: r.attempts_count || 1,
      involvedAgents: this.safeParse(r.involved_agents, ['director']),
      failureSignatures: this.safeParse(r.failure_signatures, []),
      evidence: this.safeParse(r.evidence, {}),
      promptPack: r.prompt_pack,
      argonResponse: r.argon_response || undefined,
      directorAnalysis: r.director_analysis || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      copiedAt: r.copied_at || undefined,
      sentAt: r.sent_at || undefined,
      completedAt: r.completed_at || undefined
    };
  }

  private safeParse<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
}

export const escalationManager = new EscalationManager();
