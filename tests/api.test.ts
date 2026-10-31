// Ensure NODE_ENV is set to test before imports
process.env.NODE_ENV = 'test';

import assert from 'assert';
import http from 'http';
import WebSocket from 'ws';
import { db, initDatabase } from '../server/src/db/database.js';
import { taskManager } from '../server/src/services/task-manager.js';
import { eventBus } from '../server/src/services/event-bus.js';
import { antigravityBridge } from '../server/src/services/antigravity-bridge.js';
import { controlService } from '../server/src/services/control.js';
import { analyticsService } from '../server/src/services/analytics.js';
import { CONFIG } from '../server/src/config.js';
import { app, server } from '../server/src/index.js';

async function runTests() {
  console.log('--- STARTING AI COMMAND CENTER SYSTEM & SECURITY TESTS ---');

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

  // Start test server on dynamic port
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address() as any;
  const testPort = address.port;
  const baseUrl = `http://127.0.0.1:${testPort}`;
  const wsUrl = `ws://127.0.0.1:${testPort}/ws`;
  console.log(`\nTest HTTP/WS Server running on ${baseUrl}`);

  try {
    // 8. API Key Initialization & Persistence
    console.log('\nTest 8: API Key Initialization & Format...');
    assert(CONFIG.API_KEY, 'CONFIG.API_KEY must be defined');
    assert.strictEqual(CONFIG.API_KEY.length, 64, 'API Key should be a 32-byte hex string (64 characters)');
    assert(/^[a-f0-9]{64}$/i.test(CONFIG.API_KEY), 'API Key must match hex format');
    console.log('✓ API Key verified as 32-byte hex token.');

    // 9. CORS Hardening
    console.log('\nTest 9: CORS Hardening & Error Handling...');
    const forbiddenOriginRes = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://malicious-website.com' }
    });
    assert.strictEqual(forbiddenOriginRes.status, 403, 'Forbidden Origin must receive HTTP 403');
    const corsErrorJson = await forbiddenOriginRes.json() as any;
    assert(corsErrorJson.error.includes('Blocked by CORS policy'), 'Should indicate CORS blocked error');

    const allowedOriginRes = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://localhost:5173' }
    });
    assert.strictEqual(allowedOriginRes.status, 200, 'Allowed Origin must receive HTTP 200');
    console.log('✓ CORS protection verified: Unauthorized origin blocked with HTTP 403, allowed origin passes.');

    // 10. GET /api/auth/token Bootstrapping
    console.log('\nTest 10: GET /api/auth/token Local Bootstrap...');
    // Request with forbidden Origin
    const tokenForbiddenRes = await fetch(`${baseUrl}/api/auth/token`, {
      headers: { Origin: 'http://evil.com' }
    });
    assert.strictEqual(tokenForbiddenRes.status, 403, 'Forbidden origin requesting token must get 403');

    // Request with allowed Origin from localhost
    const tokenAllowedRes = await fetch(`${baseUrl}/api/auth/token`, {
      headers: { Origin: 'http://localhost:5173' }
    });
    assert.strictEqual(tokenAllowedRes.status, 200, 'Allowed origin from local loopback must get token');
    const tokenData = await tokenAllowedRes.json() as any;
    assert.strictEqual(tokenData.token, CONFIG.API_KEY, 'Returned token must match CONFIG.API_KEY');
    console.log('✓ Auth token endpoint verified: Rejects external origin, returns key to allowed local origin.');

    // 11. Endpoint Authentication (requireAuth)
    console.log('\nTest 11: requireAuth Middleware Protection...');
    // 11a. Unauthenticated POST /api/tasks
    const unauthPostRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized Task' })
    });
    assert.strictEqual(unauthPostRes.status, 401, 'Unauthenticated mutation must return 401');

    // 11b. Invalid API key
    const invalidAuthRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 0000000000000000000000000000000000000000000000000000000000000000'
      },
      body: JSON.stringify({ title: 'Invalid Auth Task' })
    });
    assert.strictEqual(invalidAuthRes.status, 401, 'Invalid API key must return 401');

    // 11c. Valid Bearer Token
    const validBearerRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        title: 'Authenticated Task via Bearer',
        priority: 'medium',
        assignedAgent: 'backend-developer'
      })
    });
    assert.strictEqual(validBearerRes.status, 201, 'Valid Bearer token must succeed with 201');
    const createdTask = await validBearerRes.json() as any;
    assert(createdTask.id.startsWith('task-'));

    // 11d. Valid x-api-key header on PATCH
    const validApiKeyRes = await fetch(`${baseUrl}/api/tasks/${createdTask.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.API_KEY
      },
      body: JSON.stringify({ description: 'Updated with x-api-key' })
    });
    assert.strictEqual(validApiKeyRes.status, 200, 'Valid x-api-key must succeed with 200');

    // 11e. Sensitive GET /control/settings protected
    const unauthSettingsRes = await fetch(`${baseUrl}/api/control/settings`);
    assert.strictEqual(unauthSettingsRes.status, 401, 'GET /control/settings must be protected by requireAuth');
    console.log('✓ requireAuth verified: 401 on missing/invalid credentials, 200/201 on valid Bearer & x-api-key.');

    // 12. CLI Argument Injection Protection
    console.log('\nTest 12: CLI Argument Injection & Whitelist Validation...');
    // 12a. Missing confirmation
    const noConfirmRes = await fetch(`${baseUrl}/api/control/run-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({ prompt: 'test', agentName: 'director', confirm: false })
    });
    assert.strictEqual(noConfirmRes.status, 400, 'Must require confirm: true');

    // 12b. Malicious agentName with shell injection characters
    const injectionAgentRes = await fetch(`${baseUrl}/api/control/run-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({ prompt: 'test', agentName: 'director; rm -rf /', confirm: true })
    });
    assert.strictEqual(injectionAgentRes.status, 400, 'Malicious agentName with injection characters must be rejected');

    // 12c. AgentName not in allowedAgents whitelist
    const unlistedAgentRes = await fetch(`${baseUrl}/api/control/run-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({ prompt: 'test', agentName: 'unauthorized-hacker-agent', confirm: true })
    });
    assert.strictEqual(unlistedAgentRes.status, 400, 'Unlisted agent must be rejected by whitelist');
    console.log('✓ CLI Argument Injection protection verified: Shell metachars rejected, whitelist enforced.');

    // 13. Path Traversal Protection
    console.log('\nTest 13: Path Traversal Protection...');
    // 13a. Bridge direct call
    const bridgeTraversal = antigravityBridge.saveKnowledgeDoc('../../outside.md', 'malicious content');
    assert.strictEqual(bridgeTraversal, false, 'saveKnowledgeDoc must reject traversal filename');

    // 13b. Route filename regex validation
    const routeTraversalRes = await fetch(`${baseUrl}/api/knowledge/..%2fevil.md`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({ content: 'evil content' })
    });
    assert.strictEqual(routeTraversalRes.status, 400, 'Route must reject traversal with HTTP 400');

    // 13c. Valid markdown filename
    const validSaveRes = await fetch(`${baseUrl}/api/knowledge/SECURITY_AUDIT_DOC.md`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({ content: '# Security Audit Passed\nAll checks verified.' })
    });
    assert.strictEqual(validSaveRes.status, 200, 'Valid knowledge doc save must succeed with 200');
    console.log('✓ Path traversal protection verified: ".." and non-standard filenames blocked.');

    // 14. Strict 9-Point Subagent Report Validation
    console.log('\nTest 14: Strict 9-Point Report Schema Validation...');
    const incompleteReportRes = await fetch(`${baseUrl}/api/tasks/${createdTask.id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        report: {
          taskName: 'Incomplete Task',
          status: 'SUCCESS'
          // Missing 7 required items
        }
      })
    });
    assert.strictEqual(incompleteReportRes.status, 400, 'Incomplete 9-point report must return 400');

    const validReportRes = await fetch(`${baseUrl}/api/tasks/${createdTask.id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        report: {
          taskName: 'Strict Report Verification',
          status: 'SUCCESS',
          summary: 'All requirements met',
          modifiedFiles: ['server/src/routes/api.ts'],
          executedChecks: ['Zod schema validation test'],
          checkResults: 'Passed',
          issuesAndRisks: 'None',
          pendingItems: 'None',
          nextSteps: 'Production deployment'
        }
      })
    });
    assert.strictEqual(validReportRes.status, 200, 'Valid complete 9-point report must return 200');
    console.log('✓ Strict 9-point report validation verified.');

    // 15. WebSocket Authentication & Origin Protection
    console.log('\nTest 15: WebSocket Security (Token & Origin)...');

    // 15a. WS connection with invalid token -> close code 1008
    const wsUnauthorized = await new Promise<number>((resolve) => {
      const ws = new WebSocket(`${wsUrl}?token=invalid-secret-key`);
      ws.on('close', (code) => resolve(code));
      ws.on('error', () => {});
    });
    assert.strictEqual(wsUnauthorized, 1008, 'WS with invalid token must close with code 1008');

    // 15b. WS connection with unauthorized Origin -> close code 1008
    const wsBadOrigin = await new Promise<number>((resolve) => {
      const ws = new WebSocket(`${wsUrl}?token=${CONFIG.API_KEY}`, {
        headers: { Origin: 'http://malicious-site.com' }
      });
      ws.on('close', (code) => resolve(code));
      ws.on('error', () => {});
    });
    assert.strictEqual(wsBadOrigin, 1008, 'WS with unauthorized origin must close with code 1008');

    // 15c. WS connection with valid token and allowed Origin -> connects and receives handshake
    const wsHandshake = await new Promise<string>((resolve, reject) => {
      const ws = new WebSocket(`${wsUrl}?token=${CONFIG.API_KEY}`, {
        headers: { Origin: 'http://localhost:5173' }
      });
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        ws.close();
        resolve(msg.message);
      });
      ws.on('error', (err) => reject(err));
    });
    assert(wsHandshake.includes('Connected to AI Command Center Event Stream'), 'Handshake message received');
    console.log('✓ WebSocket security verified: Unauthorized token/origin closed with 1008, valid client handshakes.');

  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  console.log('\n======================================================');
  console.log('ALL 15 SYSTEM & SECURITY TESTS PASSED SUCCESSFULLY! ✓');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
