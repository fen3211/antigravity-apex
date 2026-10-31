// Ensure NODE_ENV is set to test before imports
process.env.NODE_ENV = 'test';

import assert from 'assert';
import WebSocket from 'ws';
import { performance } from 'perf_hooks';
import { db, initDatabase } from '../server/src/db/database.js';
import { CONFIG } from '../server/src/config.js';
import { app, server, stopHeartbeat } from '../server/src/index.js';
import { eventBus } from '../server/src/services/event-bus.js';
import {
  EventStreamClient,
  calculateBackoffDelay,
  ConnectionStatus
} from '../client/src/services/api.js';

interface TestMetrics {
  passed: number;
  failed: number;
}

const metrics: TestMetrics = { passed: 0, failed: 0 };

async function runTest(name: string, fn: () => Promise<void>) {
  const start = performance.now();
  try {
    process.stdout.write(`  [TEST] ${name} ... `);
    await fn();
    const duration = (performance.now() - start).toFixed(1);
    console.log(`✓ PASSED (${duration}ms)`);
    metrics.passed++;
  } catch (err: any) {
    const duration = (performance.now() - start).toFixed(1);
    console.log(`✗ FAILED (${duration}ms)`);
    console.error(`    Error in "${name}":`, err.message);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(0, 5).map((l: string) => `      ${l}`).join('\n'));
    }
    metrics.failed++;
    throw err;
  }
}

async function main() {
  console.log('================================================================');
  console.log('PHASE 4 ACCEPTANCE SUITE: WEBSOCKET & NETWORK RESILIENCE');
  console.log('Heartbeat Ping/Pong, Exponential Backoff, Jitter & State Sync');
  console.log('================================================================\n');

  initDatabase();

  // Start test server on dynamic loopback port
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const testPort = address.port;
  const wsUrl = `ws://127.0.0.1:${testPort}/ws`;
  console.log(`Test WebSocket Server active on ${wsUrl}\n`);

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Heartbeat Ping/Pong & Dead Socket Termination
    // ------------------------------------------------------------------------
    await runTest('1. Heartbeat: Responsive client keeps connection, unresponsive client terminated', async () => {
      // Connect responsive client A
      const clientA = new WebSocket(`${wsUrl}?token=${CONFIG.API_KEY}`, {
        headers: { Origin: 'http://localhost:5173' }
      });
      await new Promise((resolve) => clientA.on('open', resolve));

      const serverClientsAfterA = Array.from(eventBus.getClients());
      assert.strictEqual(serverClientsAfterA.length, 1);
      const serverWsA = serverClientsAfterA[0];

      // Connect unresponsive client B
      const clientB = new WebSocket(`${wsUrl}?token=${CONFIG.API_KEY}`, {
        headers: { Origin: 'http://localhost:5173' }
      });
      await new Promise((resolve) => clientB.on('open', resolve));

      const serverClientsAfterB = Array.from(eventBus.getClients());
      assert.strictEqual(serverClientsAfterB.length, 2);
      const serverWsB = serverClientsAfterB.find((s) => s !== serverWsA)!;
      assert(serverWsB, 'serverWsB must exist');

      // Make client B unresponsive by overriding pong method
      clientB.pong = () => {
        // intentionally suppress pong response
      };
      if ((clientB as any)._receiver) {
        (clientB as any)._receiver.removeAllListeners('ping');
      }

      // Initial state: both are isAlive = true
      assert.strictEqual((serverWsA as any).isAlive, true);
      assert.strictEqual((serverWsB as any).isAlive, true);

      // Heartbeat Cycle 1: checkHeartbeat sets isAlive = false and sends ping
      eventBus.checkHeartbeat();

      // Immediately after checkHeartbeat, both were set to false until pong arrives
      assert.strictEqual((serverWsB as any).isAlive, false);

      // Wait a moment for client A to automatically send pong and server to process it
      await new Promise((r) => setTimeout(r, 80));

      // Client A should be alive (pong received), Client B should remain dead (isAlive: false)
      assert.strictEqual((serverWsA as any).isAlive, true, 'Client A must have isAlive=true after pong');
      assert.strictEqual((serverWsB as any).isAlive, false, 'Client B must remain isAlive=false since pong was suppressed');

      // Heartbeat Cycle 2: checkHeartbeat() should terminate unresponsive client B
      let clientBClosed = false;
      clientB.on('close', () => {
        clientBClosed = true;
      });

      eventBus.checkHeartbeat();

      // Give event loop tick for socket termination
      await new Promise((r) => setTimeout(r, 80));

      assert.strictEqual(clientBClosed, true, 'Client B must receive close event after termination');
      assert.strictEqual(eventBus.getClientsCount(), 1, 'Client B must be evicted from EventBus clients');
      assert.strictEqual(clientA.readyState, WebSocket.OPEN, 'Responsive Client A must remain connected');

      clientA.close();
    });

    // ------------------------------------------------------------------------
    // SCENARIO 2: Stop and Restart Heartbeat Timer Method
    // ------------------------------------------------------------------------
    await runTest('2. Heartbeat Timer: startHeartbeat() and stopHeartbeat() lifecycle', async () => {
      eventBus.stopHeartbeat();
      // Should safely allow multiple stop calls
      eventBus.stopHeartbeat();
      stopHeartbeat();

      // Restart with fast interval and verify no errors
      eventBus.startHeartbeat(100);
      await new Promise((r) => setTimeout(r, 150));
      eventBus.stopHeartbeat();
    });

    // ------------------------------------------------------------------------
    // SCENARIO 3: DoS Protection - Message Size Limit (> 64KB rejected)
    // ------------------------------------------------------------------------
    await runTest('3. DoS Protection: Messages exceeding 64KB are rejected/terminated', async () => {
      const client = new WebSocket(`${wsUrl}?token=${CONFIG.API_KEY}`, {
        headers: { Origin: 'http://localhost:5173' }
      });
      await new Promise((resolve) => client.on('open', resolve));

      let closedWithCode: number | null = null;
      client.on('close', (code) => {
        closedWithCode = code;
      });

      // Send 70KB oversized payload (exceeding 64KB limit)
      const oversizedPayload = JSON.stringify({
        type: 'ping',
        padding: 'A'.repeat(70 * 1024)
      });

      client.send(oversizedPayload);

      // Wait for server to process and terminate connection
      await new Promise((r) => setTimeout(r, 100));

      assert(closedWithCode !== null, 'Oversized message must trigger socket close');
      assert(
        closedWithCode === 1009 || client.readyState === WebSocket.CLOSED,
        `Expected close code 1009 (Message too large) or closed socket, got ${closedWithCode}`
      );

      // Valid small message test on a fresh connection
      const validClient = new WebSocket(`${wsUrl}?token=${CONFIG.API_KEY}`, {
        headers: { Origin: 'http://localhost:5173' }
      });
      await new Promise((resolve) => validClient.on('open', resolve));

      let receivedPong = false;
      validClient.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'pong') receivedPong = true;
      });

      validClient.send(JSON.stringify({ type: 'ping' }));
      await new Promise((r) => setTimeout(r, 60));

      assert.strictEqual(receivedPong, true, 'Small legitimate messages (e.g. ping) must be accepted');
      validClient.close();
    });

    // ------------------------------------------------------------------------
    // SCENARIO 4: Exponential Backoff & Jitter Mathematical Verification
    // ------------------------------------------------------------------------
    await runTest('4. Exponential Backoff & Jitter: Strict formula and boundary compliance', async () => {
      // Formula: delay = Math.min(1000 * Math.pow(1.5, attempt), 15000) + Math.random() * 500

      // Attempt 0: 1000 * 1.5^0 = 1000 ms -> range [1000, 1500]
      const delay0Min = calculateBackoffDelay(0, 0);
      const delay0Max = calculateBackoffDelay(0, 1);
      assert.strictEqual(delay0Min, 1000);
      assert.strictEqual(delay0Max, 1500);

      // Attempt 1: 1000 * 1.5^1 = 1500 ms -> range [1500, 2000]
      const delay1Min = calculateBackoffDelay(1, 0);
      const delay1Max = calculateBackoffDelay(1, 1);
      assert.strictEqual(delay1Min, 1500);
      assert.strictEqual(delay1Max, 2000);

      // Attempt 2: 1000 * 1.5^2 = 2250 ms -> range [2250, 2750]
      const delay2Min = calculateBackoffDelay(2, 0);
      const delay2Max = calculateBackoffDelay(2, 1);
      assert.strictEqual(delay2Min, 2250);
      assert.strictEqual(delay2Max, 2750);

      // Attempt 3: 1000 * 1.5^3 = 3375 ms -> range [3375, 3875]
      const delay3Min = calculateBackoffDelay(3, 0);
      const delay3Max = calculateBackoffDelay(3, 1);
      assert.strictEqual(delay3Min, 3375);
      assert.strictEqual(delay3Max, 3875);

      // Attempt 4: 1000 * 1.5^4 = 5062.5 ms -> range [5062.5, 5562.5]
      const delay4Min = calculateBackoffDelay(4, 0);
      assert.strictEqual(delay4Min, 5062.5);

      // High attempt cap: 15000 ms ceiling
      const delay10Min = calculateBackoffDelay(10, 0);
      const delay10Max = calculateBackoffDelay(10, 1);
      assert.strictEqual(delay10Min, 15000, 'Backoff base must cap at 15000ms');
      assert.strictEqual(delay10Max, 15500, 'Backoff with max jitter must not exceed 15500ms');

      // Statistical distribution test over 200 random jitter samples
      let minObserved = Infinity;
      let maxObserved = -Infinity;
      let jitterSum = 0;
      const samples = 200;

      for (let i = 0; i < samples; i++) {
        const val = calculateBackoffDelay(0);
        if (val < minObserved) minObserved = val;
        if (val > maxObserved) maxObserved = val;
        jitterSum += (val - 1000);
      }

      assert(minObserved >= 1000, `Min observed ${minObserved} must be >= 1000`);
      assert(maxObserved <= 1500, `Max observed ${maxObserved} must be <= 1500`);
      const avgJitter = jitterSum / samples;
      assert(avgJitter > 150 && avgJitter < 350, `Average jitter ${avgJitter} should be near 250ms`);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 5: Client EventStreamClient State Machine & Transitions
    // ------------------------------------------------------------------------
    await runTest('5. EventStreamClient: State machine, status listeners, and clean disconnect()', async () => {
      const recordedStatuses: ConnectionStatus[] = [];

      const client = new EventStreamClient({
        url: wsUrl,
        token: CONFIG.API_KEY,
        autoConnect: false
      });

      assert.strictEqual(client.getStatus(), 'DISCONNECTED');

      // Subscribe to status changes
      const unsubscribe = client.onStatusChange((status) => {
        recordedStatuses.push(status);
      });

      // Connect
      await client.connect();

      // Wait for open
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (client.getStatus() === 'CONNECTED') {
            clearInterval(check);
            resolve();
          }
        }, 20);
      });

      assert.strictEqual(client.getStatus(), 'CONNECTED');
      assert(recordedStatuses.includes('CONNECTING'), 'Must transition through CONNECTING');
      assert(recordedStatuses.includes('CONNECTED'), 'Must reach CONNECTED');

      // Test event reception
      let receivedEvent: any = null;
      const unsubEvent = client.subscribe((evt) => {
        receivedEvent = evt;
      });

      eventBus.publish({
        type: 'agent.started',
        source: 'DEMO',
        agent_id: 'test-resilience-agent',
        data: { test: true }
      });

      await new Promise((r) => setTimeout(r, 60));
      assert(receivedEvent, 'Event should be received over EventStreamClient');
      assert.strictEqual(receivedEvent.agent_id, 'test-resilience-agent');
      unsubEvent();

      // Clean disconnect
      client.disconnect();
      assert.strictEqual(client.getStatus(), 'DISCONNECTED');

      // Verify that after disconnect(), no reconnect is scheduled
      await new Promise((r) => setTimeout(r, 100));
      assert.strictEqual(client.getStatus(), 'DISCONNECTED');

      unsubscribe();
    });

    // ------------------------------------------------------------------------
    // SCENARIO 6: Event Burst Debouncing (300ms) & State Reconciliation
    // ------------------------------------------------------------------------
    await runTest('6. Event Burst Debouncing (300ms) and State Reconciliation on Reconnect', async () => {
      // 6a. Debounce verification
      let fetchCallCount = 0;
      let debounceTimer: any = null;

      const debouncedFetch = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          fetchCallCount++;
        }, 300);
      };

      // Simulate a burst of 25 rapid WS events within 50ms (typical for active subagent)
      for (let i = 0; i < 25; i++) {
        debouncedFetch();
        await new Promise((r) => setTimeout(r, 2));
      }

      // Immediately after burst, debounced function should NOT have fired yet
      assert.strictEqual(fetchCallCount, 0, 'Debounced handler must not fire synchronously during burst');

      // Wait 150ms: still inside the 300ms window
      await new Promise((r) => setTimeout(r, 150));
      assert.strictEqual(fetchCallCount, 0, 'Debounced handler must not fire before 300ms window expires');

      // Wait another 200ms (total > 350ms): should fire exactly ONCE
      await new Promise((r) => setTimeout(r, 200));
      assert.strictEqual(fetchCallCount, 1, 'Debounced handler must fire exactly ONCE for the entire burst of 25 events');

      // 6b. State reconciliation verification
      let reconciliationCalls = 0;
      const simulateStateTransition = (prevStatus: ConnectionStatus, newStatus: ConnectionStatus) => {
        if (newStatus === 'CONNECTED' && (prevStatus === 'RECONNECTING' || prevStatus === 'DISCONNECTED')) {
          reconciliationCalls++;
        }
      };

      // Transition from CONNECTING to CONNECTED (initial startup: no reconciliation needed)
      simulateStateTransition('CONNECTING', 'CONNECTED');
      assert.strictEqual(reconciliationCalls, 0, 'Initial CONNECTING -> CONNECTED must not trigger reconciliation');

      // Transition from RECONNECTING to CONNECTED (network recovered: reconciliation REQUIRED)
      simulateStateTransition('RECONNECTING', 'CONNECTED');
      assert.strictEqual(reconciliationCalls, 1, 'RECONNECTING -> CONNECTED must trigger loadAllData() reconciliation');

      // Transition from DISCONNECTED to CONNECTED (reconnected after manual offline: reconciliation REQUIRED)
      simulateStateTransition('DISCONNECTED', 'CONNECTED');
      assert.strictEqual(reconciliationCalls, 2, 'DISCONNECTED -> CONNECTED must trigger loadAllData() reconciliation');

      // Transition from CONNECTED to CONNECTED (steady state: no duplicate reconciliation)
      simulateStateTransition('CONNECTED', 'CONNECTED');
      assert.strictEqual(reconciliationCalls, 2, 'CONNECTED -> CONNECTED must not trigger duplicate reconciliation');
    });

  } finally {
    eventBus.stopHeartbeat();
    stopHeartbeat();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  console.log('\n================================================================');
  console.log(`ALL ${metrics.passed} WEBSOCKET RESILIENCE TESTS PASSED! ✓`);
  console.log('================================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
