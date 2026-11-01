// Backend Developer Audit & Verification Test Suite
process.env.NODE_ENV = 'test';
process.env.AGY_MOCK_SPAWN = 'true';

import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { db, initDatabase } from '../server/src/db/database.js';
import { CONFIG, resolveAgyCliPath, getAllowedOrigins, checkPathExists } from '../server/src/config.js';
import { antigravityBridge } from '../server/src/services/antigravity-bridge.js';
import { processSupervisor } from '../server/src/services/process-supervisor.js';
import { controlService } from '../server/src/services/control.js';
import { taskManager } from '../server/src/services/task-manager.js';
import { app, server } from '../server/src/index.js';

async function runAuditTests() {
  console.log('================================================================');
  console.log('BACKEND AUDIT TEST SUITE: Cross-Platform, Security, 17 Roles, Doctor');
  console.log('================================================================\n');

  initDatabase();

  // Start test server on dynamic port
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test HTTP Server running on ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // TEST 1: Cross-Platform agy CLI Resolution (resolveAgyCliPath)
    // -------------------------------------------------------------
    console.log('[TEST 1] Cross-platform CLI discovery & env override...');
    
    // 1a. Explicit AGY_CLI_PATH override
    const customCli = path.resolve('custom/bin/agy-custom');
    const resolvedCustom = resolveAgyCliPath({ AGY_CLI_PATH: customCli }, 'win32');
    assert.strictEqual(resolvedCustom, customCli, 'Explicit AGY_CLI_PATH env must take highest priority');

    // 1b. Windows fallback when file not found
    const winFallback = resolveAgyCliPath({}, 'win32');
    assert(winFallback.endsWith('agy.exe'), `Windows default must target agy.exe, got ${winFallback}`);

    // 1c. Linux/macOS fallback when file not found
    const linuxFallback = resolveAgyCliPath({ HOME: '/home/testuser' }, 'linux');
    assert(linuxFallback.includes('.local') && linuxFallback.endsWith('agy'), `Linux default must target ~/.local/bin/agy, got ${linuxFallback}`);

    const macFallback = resolveAgyCliPath({ HOME: '/Users/testuser' }, 'darwin');
    assert(macFallback.includes('.local') && macFallback.endsWith('agy'), `macOS default must target ~/.local/bin/agy, got ${macFallback}`);

    // 1d. PATH lookup simulation
    const tempBin = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-bin-test-'));
    const dummyAgy = path.join(tempBin, process.platform === 'win32' ? 'agy.exe' : 'agy');
    fs.writeFileSync(dummyAgy, '#!/bin/sh\necho "dummy agy"\n', { mode: 0o755 });

    const pathFound = resolveAgyCliPath({ PATH: tempBin, USERPROFILE: tempBin, HOME: tempBin, LOCALAPPDATA: tempBin }, process.platform);
    assert.strictEqual(path.resolve(pathFound), path.resolve(dummyAgy), 'Must discover agy executable from PATH');
    fs.rmSync(tempBin, { recursive: true, force: true });

    console.log('  ✓ PASSED: Cross-platform CLI discovery & env overrides verified.\n');

    // -------------------------------------------------------------
    // TEST 2: CORS Configuration & Custom Allowed Origins
    // -------------------------------------------------------------
    console.log('[TEST 2] CORS & Allowed Origins configuration...');
    
    const defaultOrigins = getAllowedOrigins({});
    assert(defaultOrigins.includes('http://localhost:5173'));
    assert(defaultOrigins.includes('http://127.0.0.1:3001'));

    const customOrigins = getAllowedOrigins({ ALLOWED_ORIGINS: 'https://command-center.internal, https://director.mycorp.ru' });
    assert(customOrigins.includes('https://command-center.internal'));
    assert(customOrigins.includes('https://director.mycorp.ru'));
    assert(customOrigins.includes('http://localhost:5173'), 'Defaults must be retained alongside custom origins');

    // Test CORS HTTP rejection
    const blockedCors = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://malicious-attacker.com' }
    });
    assert.strictEqual(blockedCors.status, 403, 'Unauthorized CORS origin must be blocked with HTTP 403');

    const allowedCors = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://localhost:5173' }
    });
    assert.strictEqual(allowedCors.status, 200, 'Allowed CORS origin must succeed with HTTP 200');

    console.log('  ✓ PASSED: CORS hardening and configurable origins verified.\n');

    // -------------------------------------------------------------
    // TEST 3: Path Traversal Security in Knowledge Docs
    // -------------------------------------------------------------
    console.log('[TEST 3] Path Traversal Security in saveKnowledgeDoc & getKnowledgeDoc...');

    // 3a. Direct Bridge Validation
    const traversalAttempts = [
      '../test.md',
      '../../secret.md',
      '..\\windows\\traversal.md',
      'nested/path.md',
      'doc\0hidden.md',
      'not_markdown.txt',
      'evil.sh',
      '../'
    ];

    for (const attempt of traversalAttempts) {
      assert.strictEqual(antigravityBridge.saveKnowledgeDoc(attempt, 'payload'), false, `saveKnowledgeDoc must reject "${attempt}"`);
      assert.strictEqual(antigravityBridge.getKnowledgeDoc(attempt), null, `getKnowledgeDoc must reject "${attempt}"`);
    }

    // 3b. Legitimate document creation and reading
    const testDocName = 'AUDIT_VERIFIED_DOC.md';
    const testDocContent = '# Security Audit\nVerified at ' + new Date().toISOString();
    const saved = antigravityBridge.saveKnowledgeDoc(testDocName, testDocContent);
    assert.strictEqual(saved, true, 'Legitimate knowledge doc save must succeed');

    const retrieved = antigravityBridge.getKnowledgeDoc(testDocName);
    assert(retrieved !== null, 'Saved doc must be retrievable via getKnowledgeDoc');
    assert.strictEqual(retrieved?.title, 'Security Audit');
    assert.strictEqual(retrieved?.content, testDocContent);

    // 3c. REST API Endpoint Traversal Checks
    const apiTraversal1 = await fetch(`${baseUrl}/api/knowledge/..%2fsecret.md`);
    assert.strictEqual(apiTraversal1.status, 400, 'GET /api/knowledge with traversal must return 400');

    const apiTraversal2 = await fetch(`${baseUrl}/api/knowledge/secret.txt`);
    assert.strictEqual(apiTraversal2.status, 400, 'GET /api/knowledge with non-markdown must return 400');

    const apiGetLegit = await fetch(`${baseUrl}/api/knowledge/${testDocName}`);
    assert.strictEqual(apiGetLegit.status, 200, 'GET /api/knowledge legitimate doc must return 200');
    const legitJson = await apiGetLegit.json();
    assert.strictEqual(legitJson.title, 'Security Audit');

    // Clean up created audit doc
    const auditDocPath = path.join(CONFIG.KNOWLEDGE_DIR, testDocName);
    try { if (fs.existsSync(auditDocPath)) fs.unlinkSync(auditDocPath); } catch {}

    console.log('  ✓ PASSED: Comprehensive path traversal protection verified.\n');

    // -------------------------------------------------------------
    // TEST 4: Supervisor Input Validation & Whitelist Defense
    // -------------------------------------------------------------
    console.log('[TEST 4] CLI argument validation & supervisor defenses...');

    // 4a. Supervisor direct spawn validation
    await assert.rejects(
      async () => {
        await processSupervisor.spawnTask('valid-task-id', 'test', 'unauthorized-agent; rm -rf /');
      },
      /Invalid agentName format|allowed agents whitelist/,
      'Supervisor must reject malicious agentName'
    );

    await assert.rejects(
      async () => {
        await processSupervisor.spawnTask('invalid taskId with spaces!', 'test', 'director');
      },
      /Invalid taskId format/,
      'Supervisor must reject invalid taskId'
    );

    // 4b. REST API /tasks/:id/execute validation
    const legitTask = taskManager.createTask({
      title: 'Supervisor Defense Task',
      assignedAgent: 'backend-developer'
    });

    const unauthAgentExec = await fetch(`${baseUrl}/api/tasks/${legitTask.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({ agentName: 'hacker-agent' })
    });
    assert.strictEqual(unauthAgentExec.status, 400, 'Execute with unlisted agent must return 400');

    const legitExec = await fetch(`${baseUrl}/api/tasks/${legitTask.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({ agentName: 'backend-developer' })
    });
    assert.strictEqual(legitExec.status, 200, 'Execute with valid agent must return 200');

    // Wait for task completion
    await processSupervisor.waitForCompletion(legitTask.id, 5000);

    console.log('  ✓ PASSED: Supervisor input validation and whitelist enforcement verified.\n');

    // -------------------------------------------------------------
    // TEST 5: All 17 Agent Roles Verification
    // -------------------------------------------------------------
    console.log('[TEST 5] Verification of all 17 agent roles...');

    const expected17Roles = [
      'director',
      'researcher',
      'senior-architect',
      'frontend-developer',
      'backend-developer',
      'ui-ux-designer',
      'qa-engineer',
      'code-reviewer',
      'legal-compliance',
      'security-engineer',
      'devops-engineer',
      'product-manager',
      'ai-evaluation-engineer',
      'performance-engineer',
      'accessibility-specialist',
      'database-specialist',
      'data-engineer'
    ];

    const knownAgents = antigravityBridge.getKnownAgents();
    assert.strictEqual(knownAgents.length, 17, `Must have exactly 17 registered agents, found ${knownAgents.length}`);

    const registeredIds = knownAgents.map(a => a.id);
    for (const role of expected17Roles) {
      assert(registeredIds.includes(role), `Agent role "${role}" must be registered`);
      const agent = knownAgents.find(a => a.id === role);
      assert(agent?.domain && agent.domain.length > 0, `Agent "${role}" must have a populated domain`);
      assert(agent?.model && agent.model.length > 0, `Agent "${role}" must have an assigned model`);
    }

    // Verify GET /api/agents returns all 17
    const agentsRes = await fetch(`${baseUrl}/api/agents`);
    assert.strictEqual(agentsRes.status, 200);
    const agentsJson = await agentsRes.json();
    assert.strictEqual(agentsJson.length, 17, 'GET /api/agents must return 17 agents');

    // Verify single agent retrieval for each role
    for (const role of expected17Roles) {
      const singleRes = await fetch(`${baseUrl}/api/agents/${role}`);
      assert.strictEqual(singleRes.status, 200, `GET /api/agents/${role} must return 200`);
      const singleJson = await singleRes.json();
      assert.strictEqual(singleJson.id, role);
    }

    console.log('  ✓ PASSED: All 17 agent roles fully registered and accessible via API.\n');

    // -------------------------------------------------------------
    // TEST 6: GET /api/system/doctor Endpoint
    // -------------------------------------------------------------
    console.log('[TEST 6] GET /api/system/doctor diagnostic endpoint...');

    const doctorRes = await fetch(`${baseUrl}/api/system/doctor`);
    assert.strictEqual(doctorRes.status, 200, 'GET /api/system/doctor must return HTTP 200');
    
    const doctor = await doctorRes.json();
    assert(doctor.status === 'ok' || doctor.status === 'degraded', `Status must be ok or degraded, got ${doctor.status}`);
    assert(doctor.timestamp !== null, 'Doctor must include timestamp');

    // Check Node.js diagnostics
    assert(doctor.nodejs, 'Doctor must include nodejs block');
    assert(typeof doctor.nodejs.version === 'string', 'Node version must be string');
    assert(typeof doctor.nodejs.uptimeSeconds === 'number', 'Uptime must be number');
    assert(doctor.nodejs.memory, 'Node memory stats must be present');

    // Check SQLite diagnostics
    assert(doctor.sqlite, 'Doctor must include sqlite block');
    assert.strictEqual(doctor.sqlite.connected, true, 'SQLite must be connected');
    assert(doctor.sqlite.tables.includes('tasks'), 'SQLite tables must include tasks');
    assert(doctor.sqlite.tables.includes('events'), 'SQLite tables must include events');
    assert(doctor.sqlite.tables.includes('settings'), 'SQLite tables must include settings');

    // Check Antigravity paths
    assert(doctor.antigravity, 'Doctor must include antigravity block');
    assert(doctor.antigravity.antigravityDir.path, 'Antigravity path must be present');
    assert(doctor.antigravity.brainDir.path, 'Brain path must be present');
    assert(doctor.antigravity.presenceDir.path, 'Presence path must be present');

    // Check Knowledge base
    assert(doctor.knowledgeBase, 'Doctor must include knowledgeBase block');
    assert(typeof doctor.knowledgeBase.documentsCount === 'number');

    // Check agy CLI
    assert(doctor.agyCli, 'Doctor must include agyCli block');
    assert(doctor.agyCli.configuredPath, 'CLI configured path must be present');

    // Check Agents
    assert(doctor.agents, 'Doctor must include agents block');
    assert.strictEqual(doctor.agents.totalRegistered, 17, 'Doctor must report 17 registered agents');
    assert.strictEqual(doctor.agents.allRolesCovered, true, 'Doctor must verify allRolesCovered: true');

    // Check Supervisor
    assert(doctor.supervisor, 'Doctor must include supervisor block');
    assert(typeof doctor.supervisor.activeProcesses === 'number');
    assert(typeof doctor.supervisor.maxConcurrent === 'number');

    console.log('  ✓ PASSED: GET /api/system/doctor provides full multi-subsystem diagnostics.\n');

    console.log('================================================================');
    console.log('ALL BACKEND AUDIT TESTS PASSED WITH 100% SUCCESS RATE! ✓');
    console.log('================================================================');
    server.close();
    await antigravityBridge.closeWatcher();
    process.exit(0);
  } finally {
    server.close();
  }
}

runAuditTests().catch(err => {
  console.error('\nAUDIT TEST SUITE FAILED:', err);
  process.exit(1);
});
