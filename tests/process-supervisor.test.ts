// Process Supervisor & Execution Bridge Acceptance Tests
process.env.NODE_ENV = 'test';
process.env.AGY_MOCK_SPAWN = 'true';

import assert from 'assert';
import http from 'http';
import { db, initDatabase } from '../server/src/db/database.js';
import { taskManager } from '../server/src/services/task-manager.js';
import { eventBus } from '../server/src/services/event-bus.js';
import { controlService } from '../server/src/services/control.js';
import { processSupervisor } from '../server/src/services/process-supervisor.js';
import { CONFIG } from '../server/src/config.js';
import { app, server } from '../server/src/index.js';
import type { EventPayload } from '../server/src/types.js';

async function runTests() {
  console.log('================================================================');
  console.log('PHASE 5 ACCEPTANCE SUITE: TASK PROCESS SUPERVISOR & EXECUTION BRIDGE');
  console.log('FSM Lifecycles, Concurrency Queue, Process Tree Kill & Argon Closed-Loop');
  console.log('================================================================\n');

  initDatabase();

  // Clean supervisor state before running
  processSupervisor.shutdown();

  // Start test HTTP server
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test HTTP Server active on ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // TEST 1: FSM State Machine (STARTING -> RUNNING -> COMPLETED)
    // -------------------------------------------------------------
    console.log('  [TEST] 1. FSM State Transitions: QUEUED -> STARTING -> RUNNING -> COMPLETED ...');
    const task1 = taskManager.createTask({
      title: 'FSM Test Task',
      description: 'Verifying process supervisor execution lifecycle',
      assignedAgent: 'backend-developer'
    });

    const proc1 = await processSupervisor.spawnTask(
      task1.id,
      'Execute task 1',
      'backend-developer'
    );

    assert(proc1.state === 'RUNNING' || proc1.state === 'STARTING', `Initial state should be RUNNING or STARTING, got ${proc1.state}`);
    assert(proc1.pid !== null && proc1.pid > 0, 'Spawned process should have a valid OS PID');

    // TaskManager status should transition to 'in_progress'
    const inProgressTask = taskManager.getTaskById(task1.id);
    assert.strictEqual(inProgressTask?.status, 'in_progress', 'Task status in TaskManager should be in_progress');

    // Wait for completion
    const completedProc1 = await processSupervisor.waitForCompletion(task1.id, 5000);
    assert.strictEqual(completedProc1.state, 'COMPLETED', 'Final process state should be COMPLETED');
    assert.strictEqual(completedProc1.exitCode, 0, 'Process exitCode should be 0');
    assert.strictEqual(completedProc1.pid, null, 'PID should be reset to null upon completion');
    assert(completedProc1.finishedAt !== null, 'finishedAt timestamp should be set');
    assert(completedProc1.stdout.includes('Task completed successfully'), 'stdout should capture execution output');

    // Task in TaskManager should be completed with resultSummary
    const finishedTask = taskManager.getTaskById(task1.id);
    assert.strictEqual(finishedTask?.status, 'completed', 'TaskManager task status should be completed');
    assert(finishedTask?.resultSummary?.includes('Task completed successfully'), 'resultSummary should be populated');
    console.log('  ✓ PASSED: FSM lifecycle and TaskManager status sync verified.\n');

    // -------------------------------------------------------------
    // TEST 2: Process Cancellation & PID Cleanup
    // -------------------------------------------------------------
    console.log('  [TEST] 2. Process Cancellation: cancelTask() -> CANCELLED, clean PID & process tree kill ...');
    const task2 = taskManager.createTask({
      title: 'Long-running Task to Cancel',
      assignedAgent: 'frontend-developer'
    });

    const proc2 = await processSupervisor.spawnTask(
      task2.id,
      '__MOCK_SLEEP_10000__', // Sleeps 10s
      'frontend-developer'
    );

    assert(proc2.state === 'RUNNING', 'Task 2 should be RUNNING');
    const pidToCancel = proc2.pid;
    assert(pidToCancel !== null && pidToCancel > 0, 'Must have active PID before cancellation');

    const cancelled = await processSupervisor.cancelTask(task2.id);
    assert.strictEqual(cancelled, true, 'cancelTask() should return true for active process');

    const cancelledProc = processSupervisor.getProcess(task2.id);
    assert.strictEqual(cancelledProc?.state, 'CANCELLED', 'State must be CANCELLED');
    assert.strictEqual(cancelledProc?.pid, null, 'PID must be cleaned and set to null');
    assert(cancelledProc?.finishedAt !== null, 'finishedAt timestamp must be set');

    // Check TaskManager
    const cancelledTask = taskManager.getTaskById(task2.id);
    assert.strictEqual(cancelledTask?.status, 'failed', 'Cancelled task status in TaskManager should be failed');
    assert(cancelledTask?.errorLog?.includes('cancelled'), 'errorLog should record cancellation');

    // Second cancellation should return false (idempotent / terminal)
    const secondCancel = await processSupervisor.cancelTask(task2.id);
    assert.strictEqual(secondCancel, false, 'Cancelling already cancelled task should return false');
    console.log('  ✓ PASSED: Cancellation, process termination and clean PID verified.\n');

    // -------------------------------------------------------------
    // TEST 3: Timeout Watchdog
    // -------------------------------------------------------------
    console.log('  [TEST] 3. Timeout Watchdog: Forced kill on exceeding timeout limit -> TIMEOUT ...');
    const task3 = taskManager.createTask({
      title: 'Task Exceeding Timeout',
      assignedAgent: 'qa-engineer'
    });

    // Spawn with 150ms timeout, but mock script attempts to sleep 5000ms
    await processSupervisor.spawnTask(
      task3.id,
      '__MOCK_SLEEP_5000__',
      'qa-engineer',
      150 // timeout: 150ms
    );

    const timedOutProc = await processSupervisor.waitForCompletion(task3.id, 4000);
    assert.strictEqual(timedOutProc.state, 'TIMEOUT', 'State must transition to TIMEOUT');
    assert(timedOutProc.error?.includes('timed out after 150ms'), 'Error message must record timeout');
    assert.strictEqual(timedOutProc.pid, null, 'PID must be null after timeout kill');

    const timedOutTask = taskManager.getTaskById(task3.id);
    assert.strictEqual(timedOutTask?.status, 'failed', 'TaskManager status should be failed on timeout');
    assert(timedOutTask?.errorLog?.includes('timed out'), 'errorLog should record timeout');
    console.log('  ✓ PASSED: Timeout enforcement and process tree kill verified.\n');

    // -------------------------------------------------------------
    // TEST 4: Concurrency Limit (Max 6 Parallel) & Queueing
    // -------------------------------------------------------------
    console.log('  [TEST] 4. Concurrency Limit (Max 6 Parallel) & Automatic Queue Draining ...');
    // Ensure clean state
    processSupervisor.shutdown();
    assert.strictEqual(processSupervisor.getActiveCount(), 0, 'Active count should be 0');

    const tasks = [
      taskManager.createTask({ title: 'Batch Task 1' }),
      taskManager.createTask({ title: 'Batch Task 2' }),
      taskManager.createTask({ title: 'Batch Task 3' }),
      taskManager.createTask({ title: 'Batch Task 4' }),
      taskManager.createTask({ title: 'Batch Task 5' }),
      taskManager.createTask({ title: 'Batch Task 6' }),
      taskManager.createTask({ title: 'Batch Task 7' }),
    ];

    // Spawn 6 active processes sleeping 250ms
    const procs = await Promise.all([
      processSupervisor.spawnTask(tasks[0].id, '__MOCK_SLEEP_250__', 'director'),
      processSupervisor.spawnTask(tasks[1].id, '__MOCK_SLEEP_250__', 'researcher'),
      processSupervisor.spawnTask(tasks[2].id, '__MOCK_SLEEP_250__', 'ui-ux-designer'),
      processSupervisor.spawnTask(tasks[3].id, '__MOCK_SLEEP_250__', 'frontend-developer'),
      processSupervisor.spawnTask(tasks[4].id, '__MOCK_SLEEP_250__', 'backend-developer'),
      processSupervisor.spawnTask(tasks[5].id, '__MOCK_SLEEP_250__', 'qa-engineer'),
    ]);

    assert.strictEqual(processSupervisor.getActiveCount(), 6, 'Active processes should equal max limit (6)');
    for (const p of procs) {
      assert(['STARTING', 'RUNNING'].includes(p.state));
    }

    // Spawn 7th process: must be enqueued into QUEUED state
    const p7 = await processSupervisor.spawnTask(tasks[6].id, 'Task 7 Prompt', 'code-reviewer');
    assert.strictEqual(p7.state, 'QUEUED', '7th task must be in QUEUED state');
    assert.strictEqual(p7.pid, null, 'Queued task must have pid null');
    assert.strictEqual(processSupervisor.getActiveCount(), 6, 'Active count should remain 6');

    // Await completion of Task 7: once one of the 6 finishes, Task 7 must automatically start and complete!
    const completed7 = await processSupervisor.waitForCompletion(tasks[6].id, 6000);
    assert.strictEqual(completed7.state, 'COMPLETED', 'Queued task should have been dequeued and COMPLETED');
    assert(completed7.stdout.includes('Task completed successfully'), 'stdout of dequeued task should be captured');
    console.log('  ✓ PASSED: Concurrency throttling (6 max) and automatic queue drain verified.\n');

    // -------------------------------------------------------------
    // TEST 5: Real-time stdout & stderr Streaming via EventBus
    // -------------------------------------------------------------
    console.log('  [TEST] 5. Real-time stdout & stderr Event Streaming ...');
    const capturedEvents: EventPayload[] = [];
    const origBroadcast = eventBus.broadcastRawEvent.bind(eventBus);

    eventBus.broadcastRawEvent = (event: EventPayload) => {
      capturedEvents.push(event);
      origBroadcast(event);
    };

    try {
      const streamTask = taskManager.createTask({ title: 'Streaming Test Task' });
      await processSupervisor.spawnTask(streamTask.id, '__MOCK_STREAM__', 'backend-developer');
      const completedStream = await processSupervisor.waitForCompletion(streamTask.id, 5000);

      assert.strictEqual(completedStream.state, 'COMPLETED');
      assert(completedStream.stdout.includes('Stream chunk 1'));
      assert(completedStream.stdout.includes('Stream chunk 2'));

      // Check captured streaming events
      const stdoutEvents = capturedEvents.filter(
        e => e.task_id === streamTask.id && e.data?.streamType === 'stdout'
      );
      assert(stdoutEvents.length >= 2, `Expected at least 2 stdout events, captured ${stdoutEvents.length}`);
      assert(stdoutEvents.some(e => e.data?.streamChunk?.includes('Stream chunk 1')), 'Stream chunk 1 event captured');
      assert(stdoutEvents.some(e => e.data?.streamChunk?.includes('Stream chunk 2')), 'Stream chunk 2 event captured');
      console.log(`  ✓ PASSED: Captured ${stdoutEvents.length} real-time WebSocket stdout stream chunks.\n`);
    } finally {
      eventBus.broadcastRawEvent = origBroadcast;
    }

    // -------------------------------------------------------------
    // TEST 6: Non-zero Exit Code Handling (FAILED)
    // -------------------------------------------------------------
    console.log('  [TEST] 6. Non-zero Exit Code Failure & Error Handling ...');
    const failTask = taskManager.createTask({ title: 'Failing CLI Task' });
    await processSupervisor.spawnTask(failTask.id, '__MOCK_FAIL__', 'backend-developer');
    const failedProc = await processSupervisor.waitForCompletion(failTask.id, 5000);

    assert.strictEqual(failedProc.state, 'FAILED', 'Process state should be FAILED');
    assert.strictEqual(failedProc.exitCode, 1, 'Exit code should be 1');
    assert(failedProc.stderr.includes('Simulated CLI execution failure'), 'stderr should contain error message');

    const updatedFailTask = taskManager.getTaskById(failTask.id);
    assert.strictEqual(updatedFailTask?.status, 'failed', 'TaskManager status should be failed');
    assert(updatedFailTask?.errorLog?.includes('Simulated CLI execution failure'), 'errorLog should record stderr');
    console.log('  ✓ PASSED: Non-zero exit code failure and error propagation verified.\n');

    // -------------------------------------------------------------
    // TEST 7: Argon Closed-Loop De-escalation
    // -------------------------------------------------------------
    console.log('  [TEST] 7. Argon Closed-Loop De-escalation: Argon_L4 -> Specialist ...');
    // Create task in Argon_L4 stage
    const argonTask = taskManager.createTask({
      title: 'Critical Race Condition in Cache Layer',
      description: 'Distributed locks failing under concurrency burst',
      stage: 'Argon_L4',
      assignedAgent: 'director'
    });
    taskManager.updateTask(argonTask.id, { status: 'escalated' });

    let deescalationEventCaptured: EventPayload | null = null;
    const origPublish = eventBus.publish.bind(eventBus);
    eventBus.publish = (eventParams: any) => {
      const res = origPublish(eventParams);
      if (res.type === 'escalation.resolved') {
        deescalationEventCaptured = res;
      }
      return res;
    };

    try {
      const resolvedTask = controlService.resolveArgonVerdict({
        taskId: argonTask.id,
        verdict: 'Adopt Redis Redlock algorithm with deterministic monotonic TTL to prevent race condition',
        targetSpecialist: 'backend-developer'
      });

      assert.strictEqual(resolvedTask.stage, 'Specialist', 'Task stage should be Specialist');
      assert.strictEqual(resolvedTask.assignedAgent, 'backend-developer', 'Task assigned agent should be backend-developer');
      assert.strictEqual(resolvedTask.status, 'in_progress', 'Task status should be in_progress');
      assert(resolvedTask.resultSummary?.includes('Adopt Redis Redlock algorithm'), 'resultSummary should contain Argon verdict');
      assert(resolvedTask.description.includes('Adopt Redis Redlock algorithm'), 'description should contain Argon directive');

      assert(deescalationEventCaptured !== null, 'escalation.resolved event should be published');
      assert.strictEqual((deescalationEventCaptured as any)?.task_id, argonTask.id);
      assert.strictEqual((deescalationEventCaptured as any)?.data?.resolvedStage, 'Specialist');
      assert.strictEqual((deescalationEventCaptured as any)?.data?.assignedAgent, 'backend-developer');
      console.log('  ✓ PASSED: Argon closed-loop de-escalation and escalation.resolved event verified.\n');
    } finally {
      eventBus.publish = origPublish;
    }

    // -------------------------------------------------------------
    // TEST 8: REST API Execution Endpoints & Security
    // -------------------------------------------------------------
    console.log('  [TEST] 8. REST API Endpoints: /tasks/:id/execute, /cancel, /process-status, /processes, /argon-verdict ...');
    const apiTask = taskManager.createTask({
      title: 'API Execution Test Task',
      assignedAgent: 'backend-developer'
    });

    // 8a. POST /api/tasks/:id/execute without auth -> 401
    const unauthExec = await fetch(`${baseUrl}/api/tasks/${apiTask.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test prompt' })
    });
    assert.strictEqual(unauthExec.status, 401, 'Execute endpoint must require auth');

    // 8b. POST /api/tasks/:id/execute with Bearer auth -> 200
    const authExec = await fetch(`${baseUrl}/api/tasks/${apiTask.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({ prompt: 'Execute via API', agentName: 'backend-developer' })
    });
    assert.strictEqual(authExec.status, 200, 'Authenticated execute should return 200');
    const execJson = await authExec.json() as any;
    assert.strictEqual(execJson.success, true);
    assert.strictEqual(execJson.process.taskId, apiTask.id);

    // 8c. GET /api/tasks/:id/process-status
    const statusRes = await fetch(`${baseUrl}/api/tasks/${apiTask.id}/process-status`);
    assert.strictEqual(statusRes.status, 200, 'process-status should return 200');
    const statusJson = await statusRes.json() as any;
    assert.strictEqual(statusJson.taskId, apiTask.id);

    // 8d. GET /api/processes
    const processesRes = await fetch(`${baseUrl}/api/processes`);
    assert.strictEqual(processesRes.status, 200, 'processes list should return 200');
    const processesJson = await processesRes.json() as any[];
    assert(Array.isArray(processesJson), 'processes should be an array');
    assert(processesJson.some(p => p.taskId === apiTask.id), 'Current task should be in processes list');

    // 8e. POST /api/tasks/:id/cancel
    const cancelApiTask = taskManager.createTask({ title: 'API Cancel Task' });
    await processSupervisor.spawnTask(cancelApiTask.id, '__MOCK_SLEEP_10000__', 'backend-developer');

    const cancelRes = await fetch(`${baseUrl}/api/tasks/${cancelApiTask.id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      }
    });
    assert.strictEqual(cancelRes.status, 200, 'cancel should return 200');
    const cancelJson = await cancelRes.json() as any;
    assert.strictEqual(cancelJson.success, true);
    assert.strictEqual(cancelJson.taskId, cancelApiTask.id);

    // 8f. POST /api/control/argon-verdict
    const argonApiTask = taskManager.createTask({
      title: 'Argon API Task',
      stage: 'Argon_L4'
    });
    const verdictRes = await fetch(`${baseUrl}/api/control/argon-verdict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        taskId: argonApiTask.id,
        verdict: 'Refactor database connection pool sizing',
        targetSpecialist: 'senior-architect'
      })
    });
    assert.strictEqual(verdictRes.status, 200, 'argon-verdict endpoint should return 200');
    const verdictJson = await verdictRes.json() as any;
    assert.strictEqual(verdictJson.success, true);
    assert.strictEqual(verdictJson.task.stage, 'Specialist');
    assert.strictEqual(verdictJson.task.assignedAgent, 'senior-architect');
    console.log('  ✓ PASSED: All REST API endpoints and authentication verified.\n');

    // -------------------------------------------------------------
    // TEST 9: Clean Shutdown
    // -------------------------------------------------------------
    console.log('  [TEST] 9. Supervisor Shutdown Lifecycle ...');
    processSupervisor.shutdown();
    assert.strictEqual(processSupervisor.getActiveCount(), 0, 'Active count must be 0 after shutdown');
    console.log('  ✓ PASSED: Clean supervisor shutdown verified.\n');

  } finally {
    processSupervisor.shutdown();
    eventBus.stopHeartbeat();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  console.log('================================================================');
  console.log('ALL 9 PROCESS SUPERVISOR & EXECUTION BRIDGE TESTS PASSED! ✓');
  console.log('================================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\nPROCESS SUPERVISOR TEST FAILED:', err);
  process.exit(1);
});
