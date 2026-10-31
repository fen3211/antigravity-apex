import assert from 'assert';
import http from 'http';
import { db, initDatabase } from '../server/src/db/database.js';
import { taskManager } from '../server/src/services/task-manager.js';
import { eventBus } from '../server/src/services/event-bus.js';
import { antigravityBridge } from '../server/src/services/antigravity-bridge.js';
import { controlService } from '../server/src/services/control.js';
import { analyticsService } from '../server/src/services/analytics.js';

async function runTests() {
  console.log('--- STARTING AI COMMAND CENTER SYSTEM TESTS ---');

  // 1. Database & Tables Test
  console.log('Test 1: Initializing SQLite Schema...');
  initDatabase();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
  const tableNames = tables.map(t => t.name);
  assert(tableNames.includes('tasks'), 'tasks table should exist');
  assert(tableNames.includes('events'), 'events table should exist');
  assert(tableNames.includes('settings'), 'settings table should exist');
  assert(tableNames.includes('model_usage'), 'model_usage table should exist');
  console.log('✓ SQLite schema verified: tasks, events, settings, model_usage present.');

  // 2. Task Manager CRUD & Retry Policy Test
  console.log('Test 2: Task Manager Lifecycle & Retry Policy...');
  const testTask = taskManager.createTask({
    title: 'Test Integration Task',
    description: 'Verifying automatic state transitions and escalation logic',
    priority: 'high',
    assignedAgent: 'backend-developer',
    isDemo: true
  });
  assert(testTask.id.startsWith('task-'), 'Task ID should be prefixed');
  assert.strictEqual(testTask.status, 'pending');
  assert.strictEqual(testTask.retryCount, 0);

  // Restart attempt 1
  const restart1 = taskManager.restartTask(testTask.id);
  assert.strictEqual(restart1.escalated, false);
  assert.strictEqual(restart1.task?.retryCount, 1);
  assert.strictEqual(restart1.task?.status, 'in_progress');

  // Restart attempt 2
  const restart2 = taskManager.restartTask(testTask.id);
  assert.strictEqual(restart2.escalated, false);
  assert.strictEqual(restart2.task?.retryCount, 2);

  // Restart attempt 3 -> exceeds maxRetries (2) -> ESCALATION TRIGGER!
  const restart3 = taskManager.restartTask(testTask.id);
  assert.strictEqual(restart3.escalated, true, 'Should trigger escalation after 2 retries');
  assert.strictEqual(restart3.task?.status, 'escalated');
  assert.strictEqual(restart3.task?.assignedAgent, 'senior-architect');
  assert.strictEqual(restart3.task?.stage, 'Architect_L3');
  console.log('✓ Task escalation verified: Automatically routed to Senior Architect (Level 3).');

  // 3. Subagent 9-point Report Submission
  console.log('Test 3: Subagent 9-point Reporting Protocol...');
  const reportedTask = taskManager.submitSubagentReport(testTask.id, {
    taskName: 'Test Integration Task',
    status: 'SUCCESS',
    summary: 'Integration verified cleanly',
    modifiedFiles: ['server/src/test.ts'],
    executedChecks: ['Unit assertion pass'],
    checkResults: '100% checks passed',
    issuesAndRisks: 'None detected',
    pendingItems: 'Ready for final review',
    nextSteps: 'Director approval'
  });
  assert.strictEqual(reportedTask?.status, 'verification');
  assert.strictEqual(reportedTask?.stage, 'QualityGate_L1');
  console.log('✓ 9-point subagent reporting and Quality Gate transition verified.');

  // 4. Event Bus Publishing & Querying Test
  console.log('Test 4: Event Bus & Event Persistence...');
  const testEvent = eventBus.publish({
    type: 'agent.started',
    source: 'INTERNAL_BRIDGE',
    project_id: 'test-project',
    agent_id: 'researcher',
    data: { test: true }
  });
  assert(testEvent.id.startsWith('evt-'));
  const recentEvents = eventBus.getRecentEvents({ limit: 5 });
  assert(recentEvents.length > 0, 'Recent events should return at least one event');
  console.log('✓ Event publishing and retrieval verified.');

  // 5. Antigravity Bridge & Knowledge Docs Test
  console.log('Test 5: Antigravity Knowledge Base & Agent Specs...');
  const agents = antigravityBridge.getKnownAgents();
  assert(agents.length >= 8, `Expected at least 8 agents, found ${agents.length}`);
  const directorAgent = agents.find(a => a.id === 'director');
  assert(directorAgent, 'Director agent must exist');
  assert.strictEqual(directorAgent?.model, 'gemini-3.8-flash-high');

  const knowledgeDocs = antigravityBridge.getKnowledgeDocs();
  console.log(`✓ Antigravity Knowledge Base connected: Found ${knowledgeDocs.length} markdown documents.`);
  const filenames = knowledgeDocs.map(d => d.filename);
  assert(filenames.includes('DIRECTOR_PROTOCOL.md'), 'DIRECTOR_PROTOCOL.md must exist');
  assert(filenames.includes('ESCALATION_POLICY.md'), 'ESCALATION_POLICY.md must exist');
  assert(filenames.includes('MODEL_ROUTING_POLICY.md'), 'MODEL_ROUTING_POLICY.md must exist');
  console.log('✓ Core Director knowledge files verified.');

  // 6. Level 4 Argon Escalation Generator Test
  console.log('Test 6: Level 4 Argon Escalation Pack Synthesis...');
  const argonPack = controlService.generateArgonEscalationPack({
    issueTitle: 'Complex Race Condition in File Synchronization',
    rootCauseHypothesis: 'Multiple watchers locking file simultaneously',
    failedAttempt1: 'Introduced 100ms debounce',
    failedAttempt2: 'Implemented single-flight lock without queuing',
    isolatedContextSnippet: 'const lock = acquireLock(); // Deadlock',
    targetQuestion: 'Suggest non-blocking concurrency queue design'
  });
  assert(argonPack.promptPack.includes('LEVEL 4 ESCALATION TO GEMINI 4 ARGON'));
  assert(argonPack.promptPack.includes('Gemini 4 Argon (High)'));
  assert(argonPack.promptPack.includes('Gemini 3.8 Flash High'));
  console.log('✓ Level 4 Argon Escalation prompt pack verified.');

  // 7. Analytics Service Test
  console.log('Test 7: Analytics & Model Metrics Calculation...');
  const analytics = analyticsService.getModelAnalytics();
  assert(analytics.tiers.length >= 4, 'Should have metrics for all 4 tiers');
  console.log(`✓ Analytics verified: ${analytics.totalRuns} total runs, ${analytics.overallSuccessRate}% success rate, verified real sessions: ${analytics.verifiedRealSessionsCount}.`);

  console.log('\n=============================================');
  console.log('ALL 7 SYSTEM TESTS PASSED SUCCESSFULLY! ✓');
  console.log('=============================================\n');
}

runTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
