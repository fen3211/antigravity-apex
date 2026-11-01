import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'assert';
import http from 'http';
import express from 'express';
import { db, initDatabase } from '../server/src/db/database.js';
import { escalationManager, COOLDOWN_MS } from '../server/src/services/escalation-manager.js';
import { taskManager } from '../server/src/services/task-manager.js';
import { eventBus } from '../server/src/services/event-bus.js';
import { apiRouter } from '../server/src/routes/api.js';
import { CONFIG } from '../server/src/config.js';
import type { TaskItem, SubagentReport, EventPayload } from '../server/src/types.js';

let server: http.Server;
let baseUrl: string;
const receivedEvents: EventPayload[] = [];

async function postJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(data)
  });
  return { status: res.status, body: await res.json() };
}

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: { ...headers }
  });
  return { status: res.status, body: await res.json() };
}

async function putJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(data)
  });
  return { status: res.status, body: await res.json() };
}

async function runTests() {
  console.log('\n================================================================');
  console.log('INTELLIGENT ARGON ESCALATION TEST SUITE');
  console.log('================================================================\n');

  // Set up test server
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr: any = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`Test HTTP Server running on ${baseUrl}\n`);
      resolve();
    });
  });

  eventBus.subscribe((evt) => {
    receivedEvents.push(evt);
  });

  // TEST 1: Text & Secret Sanitization
  console.log('[TEST 1] Secret & Path Sanitization...');
  {
    const rawText = `
Error in C:\\Users\\developer\\AppData\\Local\\Temp\\leak.log
Server failed at /home/developer/projects/app.js
Google AI API Key: AIzaSyD3x4mPlE_kEy1234567890abcdef-1234
OpenAI Key: sk-proj-1234567890abcdef1234567890abcdef1234
GitHub Token: ghp_1234567890abcdefghijklmnopqrstuvwxyz12
Bearer Token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secretpayload
DB String: postgresql://admin:SuperSecretPass123!@localhost:5432/production_db
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0m4w...
-----END RSA PRIVATE KEY-----
    `;

    const sanitized = escalationManager.sanitizeText(rawText);

    assert(!sanitized.includes('AIzaSyD3x4mPlE_kEy1234567890abcdef-1234'), 'Google API key must be sanitized');
    assert(sanitized.includes('AIza***REDACTED_API_KEY***'), 'Google API key must show redacted placeholder');

    assert(!sanitized.includes('sk-proj-1234567890abcdef1234567890abcdef1234'), 'OpenAI key must be sanitized');
    assert(sanitized.includes('sk-***REDACTED_API_KEY***'), 'OpenAI key must show redacted placeholder');

    assert(!sanitized.includes('ghp_1234567890abcdefghijklmnopqrstuvwxyz12'), 'GitHub token must be sanitized');
    assert(sanitized.includes('ghp_***REDACTED_PAT***'), 'GitHub PAT must show redacted placeholder');

    assert(!sanitized.includes('SuperSecretPass123!'), 'Database password must be sanitized');
    assert(sanitized.includes('***REDACTED_PASSWORD***'), 'Database password placeholder must be present');

    assert(!sanitized.includes('C:\\Users\\developer'), 'Windows user path must be stripped');
    assert(!sanitized.includes('/home/developer'), 'POSIX user path must be stripped');
    assert(sanitized.includes('~/AppData'), 'Windows user path should be replaced with ~');

    assert(!sanitized.includes('MIIEowIBAAKCAQEA0m4w...'), 'Private key body must be stripped');
    assert(sanitized.includes('[***REDACTED_PRIVATE_KEY***]'), 'Private key placeholder must be present');

    console.log('  ✓ PASSED: Comprehensive secret and path sanitization verified.');
  }

  // TEST 2: Sensitivity Settings API & Logic
  console.log('\n[TEST 2] Sensitivity Modes & Thresholds...');
  {
    // Update setting via API
    const authHeaders = { Authorization: `Bearer ${CONFIG.API_KEY}` };
    const putRes = await putJson('/api/escalations/settings', { sensitivity: 'aggressive' }, authHeaders);
    assert.strictEqual(putRes.status, 200);
    assert.strictEqual(escalationManager.getSensitivity(), 'aggressive');

    const dummyTask: TaskItem = {
      id: 'task-test-eval-1',
      title: 'Simulated Data Pipeline Deadlock',
      description: 'Pipeline hangs on SQLite WAL concurrency contention',
      status: 'in_progress',
      priority: 'high',
      assignedAgent: 'data-engineer',
      stage: 'Specialist',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 1,
      maxRetries: 2,
      isDemo: false,
      errorLog: 'Worker 1 failed'
    };

    // Under aggressive sensitivity: retryCount = 1 triggers warning
    let evalResult = escalationManager.evaluateTaskForEscalation(dummyTask);
    assert.strictEqual(evalResult.isWarning, true, 'Aggressive mode should warn on retry 1');
    assert.strictEqual(evalResult.shouldEscalate, false);

    // retryCount = 2 triggers escalation
    dummyTask.retryCount = 2;
    evalResult = escalationManager.evaluateTaskForEscalation(dummyTask);
    assert.strictEqual(evalResult.shouldEscalate, true, 'Aggressive mode should escalate on retry 2');

    // Switch to balanced
    await putJson('/api/escalations/settings', { sensitivity: 'balanced' }, authHeaders);
    assert.strictEqual(escalationManager.getSensitivity(), 'balanced');

    // Under balanced: retryCount = 2 without impasse is warning
    dummyTask.retryCount = 2;
    evalResult = escalationManager.evaluateTaskForEscalation(dummyTask, { errorLogs: ['General compilation timeout'] });
    assert.strictEqual(evalResult.isWarning, true, 'Balanced mode should warn on retry 2');
    assert.strictEqual(evalResult.shouldEscalate, false);

    // retryCount = 2 WITH diagnostic deadlock impasse -> escalate!
    evalResult = escalationManager.evaluateTaskForEscalation(dummyTask, {
      errorLogs: ['Database locked: SQLite busy deadlock detected across thread boundary']
    });
    assert.strictEqual(evalResult.shouldEscalate, true, 'Balanced mode should escalate on deadlock impasse');

    // retryCount = 3 -> escalate unconditionally
    dummyTask.retryCount = 3;
    evalResult = escalationManager.evaluateTaskForEscalation(dummyTask);
    assert.strictEqual(evalResult.shouldEscalate, true, 'Balanced mode should escalate on 3 retries');

    // Contradictory reports trigger escalation
    dummyTask.retryCount = 1;
    dummyTask.priority = 'critical';
    const report1: SubagentReport = {
      taskName: 'Pipeline Ingestion',
      status: 'SUCCESS',
      summary: 'Data parsed correctly',
      modifiedFiles: [],
      executedChecks: ['unit-test'],
      checkResults: 'PASS',
      issuesAndRisks: 'None',
      pendingItems: 'None',
      nextSteps: 'Proceed'
    };
    const report2: SubagentReport = {
      taskName: 'Pipeline Persistence',
      status: 'FAILURE',
      summary: 'Data loss during write lock contention',
      modifiedFiles: [],
      executedChecks: ['integration-test'],
      checkResults: 'FAIL',
      issuesAndRisks: 'Corruption risk',
      pendingItems: 'Fix lock',
      nextSteps: 'Rollback'
    };
    evalResult = escalationManager.evaluateTaskForEscalation(dummyTask, {
      reports: [report1, report2],
      contradictionDetected: true
    });
    assert.strictEqual(evalResult.shouldEscalate, true, 'Contradictory specialist reports must trigger escalation');

    console.log('  ✓ PASSED: Sensitivity settings, thresholds, and impasse/contradiction rules verified.');
  }

  // TEST 3: 18-Point Prompt Pack Structure
  console.log('\n[TEST 3] 18-Point Prompt Pack Generation...');
  {
    const task: TaskItem = {
      id: 'task-test-pack-18',
      title: 'Subtle Distributed Event Sync Concurrency Hazard',
      description: 'WebSocket broadcast and SQLite WAL post-commit listener race condition',
      status: 'in_progress',
      priority: 'critical',
      assignedAgent: 'backend-developer',
      stage: 'Specialist',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 3,
      maxRetries: 2,
      isDemo: false,
      errorLog: 'Error: Database locked during high concurrent load with API key AIzaSyD3x4mPlE_kEy1234567890abcdef-1234'
    };

    const promptPack = escalationManager.generate18PointPromptPack({
      task,
      reason: 'Persistent database deadlock under concurrent event throughput',
      priority: 'critical',
      involvedAgents: ['backend-developer', 'senior-architect', 'director'],
      evidence: {
        errorLogs: [task.errorLog!],
        codeSnippets: [{
          file: 'event-bus.ts',
          snippet: 'function broadcast() { db.prepare("INSERT INTO events...").run(); ws.send(); }'
        }]
      },
      sensitivity: 'balanced',
      failureSignature: 'sig-test-1234'
    });

    const requiredHeaders = [
      '### 1. Title & Executive Metadata',
      '### 2. Root Problem Statement & Symptoms',
      '### 3. Affected Subsystems & Component Architecture',
      '### 4. Minimal Isolated Code Context',
      '### 5. Reproduction Steps & Failure Conditions',
      '### 6. Sanitized Stack Traces & Error Logs',
      '### 7. Failed Approach 1',
      '### 8. Failed Approach 2',
      '### 9. Ruled-Out Hypotheses & Ineffective Fixes',
      '### 10. System Invariants & Strict Constraints',
      '### 11. Agent Contradictions & Divergent Findings',
      '### 12. Diagnostic Impasse & Concurrency/Race Analysis',
      '### 13. Security & Compliance Implications',
      '### 14. Targeted Directive & Specific Questions for Gemini 4 Argon',
      '### 15. Required Output Format from Argon',
      '### 16. Closed-Loop Handoff Instructions back to Gemini Flash / Pro',
      '### 17. Risk Analysis if Left Unresolved',
      '### 18. Multi-Tier Verification Plan upon Resolution'
    ];

    for (const h of requiredHeaders) {
      assert(promptPack.includes(h), `Prompt pack must contain header "${h}"`);
    }

    assert(promptPack.includes('LEVEL 4 ESCALATION TO GEMINI 4 ARGON'), 'Must contain Level 4 Argon banner');
    assert(!promptPack.includes('AIzaSyD3x4mPlE_kEy1234567890abcdef-1234'), 'Keys inside prompt pack must be sanitized');

    console.log('  ✓ PASSED: All 18 structured sections verified with full sanitization.');
  }

  // TEST 4: Anti-Spam Deduplication & Rejection Memory
  console.log('\n[TEST 4] Anti-Spam Deduplication & Cooldown...');
  {
    const task = taskManager.createTask({
      title: 'Recurring Deadlock Task for Dedup Test',
      description: 'Investigating deduplication mechanics',
      priority: 'high',
      assignedAgent: 'backend-developer'
    });

    // 1. Initial escalation trigger
    const res1 = escalationManager.triggerEscalation({
      task,
      reason: 'Database busy deadlock'
    });
    assert.strictEqual(res1.isNew, true, 'First escalation should be new');
    assert.strictEqual(res1.deduped, false);
    const escId = res1.escalation.id;

    // 2. Immediate second trigger within cooldown -> should dedup
    const res2 = escalationManager.triggerEscalation({
      task,
      reason: 'Database busy deadlock'
    });
    assert.strictEqual(res2.isNew, false, 'Immediate duplicate should not create new escalation');
    assert.strictEqual(res2.deduped, true);
    assert.strictEqual(res2.escalation.id, escId, 'Must return existing escalation instance');

    // 3. Reject escalation and test rejection memory
    escalationManager.rejectEscalation(escId, 'Dismissed by test operator');
    const rejectedEsc = escalationManager.getEscalationById(escId);
    assert.strictEqual(rejectedEsc?.status, 'REJECTED');

    // 4. Triggering again without retryCount increment should honor rejection memory
    const res3 = escalationManager.triggerEscalation({
      task,
      reason: 'Database busy deadlock'
    });
    assert.strictEqual(res3.isNew, false, 'Rejection memory must suppress duplicate trigger');
    assert.strictEqual(res3.deduped, true);

    console.log('  ✓ PASSED: Anti-spam cooldown and rejection memory verified.');
  }

  // TEST 5: State Machine Lifecycle via REST API
  console.log('\n[TEST 5] Full Escalation Lifecycle via REST API...');
  {
    const authHeaders = { Authorization: `Bearer ${CONFIG.API_KEY}` };

    const task = taskManager.createTask({
      title: 'Full Lifecycle Test Task',
      description: 'End-to-end Argon workflow test',
      priority: 'critical',
      assignedAgent: 'senior-architect'
    });

    // 1. Trigger Escalation
    const trigRes = await postJson('/api/escalations/trigger', {
      taskId: task.id,
      reason: 'End-to-end lifecycle verification',
      priority: 'critical'
    }, authHeaders);
    assert.strictEqual(trigRes.status, 201);
    const escId = trigRes.body.escalation.id;
    assert.strictEqual(trigRes.body.escalation.status, 'PROMPT_READY');

    // 2. Mark Copied
    const copyRes = await postJson(`/api/escalations/${escId}/copy`, {});
    assert.strictEqual(copyRes.status, 200);
    assert.strictEqual(copyRes.body.status, 'COPIED');
    assert(copyRes.body.copiedAt != null);

    // 3. Mark Sent to Argon
    const sendRes = await postJson(`/api/escalations/${escId}/send`, {});
    assert.strictEqual(sendRes.status, 200);
    assert.strictEqual(sendRes.body.status, 'SENT_TO_ARGON');
    assert(sendRes.body.sentAt != null);

    // 4. Submit Argon Response
    const responseText = `
### Gemini 4 Argon Architectural Verdict
- Root Cause: Concurrency starvation in SQLite single-writer queue during async event broadcast.
- Blueprint: Apply post-commit transaction hook pattern with asynchronous drain queue.
- Verification: Assert zero SQLITE_BUSY exceptions under 50 concurrent transactions.
    `;
    const respRes = await postJson(`/api/escalations/${escId}/response`, { responseText }, authHeaders);
    assert.strictEqual(respRes.status, 200);
    assert.strictEqual(respRes.body.escalation.status, 'IN_REVIEW');
    assert(respRes.body.directorAnalysis.includes('AI Director Analysis'));

    // Check task status updated
    const updatedTask = taskManager.getTaskById(task.id);
    assert.strictEqual(updatedTask?.stage, 'Argon_L4');

    // 5. Regenerate Prompt Pack endpoint
    const regenRes = await postJson(`/api/escalations/${escId}/regenerate`, {}, authHeaders);
    assert.strictEqual(regenRes.status, 200);
    assert(regenRes.body.promptPack.includes('### 1. Title & Executive Metadata'));

    // 6. Resolve Escalation
    const resolveRes = await postJson(`/api/escalations/${escId}/resolve`, {
      note: 'Applied asynchronous drain queue pattern'
    }, authHeaders);
    assert.strictEqual(resolveRes.status, 200);
    assert.strictEqual(resolveRes.body.status, 'COMPLETED');
    assert(resolveRes.body.completedAt != null);

    // 7. Verify Stats
    const statsRes = await getJson('/api/escalations/stats');
    assert.strictEqual(statsRes.status, 200);
    assert(statsRes.body.total > 0);
    assert(statsRes.body.resolvedCount > 0);

    // 8. Verify EventBus published all lifecycle events
    const eventTypes = receivedEvents.map(e => e.type);
    assert(eventTypes.includes('escalation.created'), 'Must publish escalation.created');
    assert(eventTypes.includes('escalation.prompt_copied'), 'Must publish escalation.prompt_copied');
    assert(eventTypes.includes('escalation.sent'), 'Must publish escalation.sent');
    assert(eventTypes.includes('escalation.updated'), 'Must publish escalation.updated');
    assert(eventTypes.includes('escalation.resolved'), 'Must publish escalation.resolved');

    console.log('  ✓ PASSED: Full state machine, API endpoints, and event stream verified.');
  }

  // TEST 6: TaskManager Automated Escalation on Max Retries
  console.log('\n[TEST 6] TaskManager Automatic Escalation to Argon_L4...');
  {
    const task = taskManager.createTask({
      title: 'Exhausted Retries Pipeline Task',
      description: 'Task designed to exhaust retries',
      priority: 'high',
      assignedAgent: 'backend-developer'
    });

    // Attempt 1 -> retryCount = 1 (Specialist)
    taskManager.restartTask(task.id);
    // Attempt 2 -> retryCount = 2 (Specialist)
    taskManager.restartTask(task.id);
    // Attempt 3 -> retryCount = 3 -> Exceeds maxRetries (2) -> L3 Architect
    const l3Result = taskManager.restartTask(task.id);
    assert.strictEqual(l3Result.escalated, true);
    assert.strictEqual(l3Result.task?.stage, 'Architect_L3');

    // Attempt 4 -> In Architect_L3 fails again -> Escalates to Argon_L4
    const l4Result = taskManager.restartTask(task.id);
    assert.strictEqual(l4Result.escalated, true);
    assert.strictEqual(l4Result.task?.stage, 'Argon_L4');

    // Verify Escalation record was automatically created by TaskManager
    const autoEsc = escalationManager.getEscalationByTaskId(task.id);
    assert(autoEsc != null, 'Escalation record must be automatically created when task reaches Argon_L4');
    assert.strictEqual(autoEsc?.taskId, task.id);
    assert.strictEqual(autoEsc?.status, 'PROMPT_READY');

    console.log('  ✓ PASSED: TaskManager automated escalation to Argon_L4 verified.');
  }

  console.log('\n================================================================');
  console.log('ALL 6 INTELLIGENT ARGON ESCALATION TESTS PASSED WITH 100% SUCCESS! ✓');
  console.log('================================================================\n');

  server.close();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
