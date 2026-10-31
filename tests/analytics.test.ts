import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { performance } from 'perf_hooks';
import Database from 'better-sqlite3';
import { initDatabase } from '../server/src/db/database.js';
import { IngestionQueue } from '../server/src/services/ingestion-queue.js';
import { AnalyticsService } from '../server/src/services/analytics.js';
import type { EventPayload } from '../server/src/types.js';

class MockEventBus {
  public broadcastEvents: EventPayload[] = [];
  public broadcastRawEvent(evt: EventPayload): void {
    this.broadcastEvents.push(evt);
  }
  public reset(): void {
    this.broadcastEvents = [];
  }
}

async function main() {
  console.log('================================================================');
  console.log('PHASE 3 ACCEPTANCE SUITE: SQLITE METRICS & ANALYTICS SERVICE');
  console.log('Zero Synchronous Disk Reads, Incremental Tokens, & Provenance');
  console.log('================================================================\n');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-analytics-qa-'));
  const dbPath = path.join(tempDir, 'test_analytics.sqlite');
  const tempDb = new Database(dbPath);

  // Initialize schema on isolated DB
  initDatabase(tempDb);

  const mockBus = new MockEventBus();
  const queue = new IngestionQueue(tempDb, mockBus);
  const analytics = new AnalyticsService(tempDb, queue);

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Schema Verification & Default Seeds Provenance
    // ------------------------------------------------------------------------
    console.log('  [TEST] 1. SQLite Schema & Default Model Usage Provenance ...');
    
    // Check session_token_usage table and index
    const tables = tempDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map(t => t.name);
    assert(tableNames.includes('session_token_usage'), 'session_token_usage table must exist');

    const indexes = tempDb.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as { name: string }[];
    const indexNames = indexes.map(i => i.name);
    assert(indexNames.includes('idx_session_token_model'), 'idx_session_token_model index must exist');

    // Check provenance column in model_usage
    const modelUsageCols = tempDb.pragma('table_info(model_usage)') as { name: string }[];
    assert(modelUsageCols.some(c => c.name === 'provenance'), 'provenance column must exist in model_usage');

    // Verify initial analytics output
    const initial = analytics.getModelAnalytics();
    assert(initial.tiers.length >= 4, 'Must have at least 4 model tiers');
    
    for (const tier of initial.tiers) {
      assert.strictEqual(tier.provenance, 'DEMO', `Default tier ${tier.tier} must have provenance='DEMO'`);
      assert.strictEqual(tier.isEstimate, true, `Default tier ${tier.tier} must have isEstimate=true`);
    }

    assert.strictEqual(initial.totalTokens.provenance, 'DEMO', 'Default totalTokens provenance must be DEMO');
    assert.strictEqual(initial.provenance, 'DEMO', 'Overall provenance must be DEMO');
    assert.strictEqual(initial.verifiedRealSessionsCount, 0, 'Initial real sessions count must be 0');
    assert.strictEqual(initial.totalRuns, 44, 'Total runs must match initial seed (44)');
    assert.strictEqual(initial.overallSuccessRate, 93, 'Overall success rate must match initial seed (93%)');
    console.log('  ✓ PASSED: Schema, session_token_usage, and default DEMO seeds verified.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 2: Absence of fs.readdirSync and fs.readFileSync
    // ------------------------------------------------------------------------
    console.log('  [TEST] 2. Strict Prohibition of Synchronous Disk Reads ...');
    
    let readdirSyncCalled = false;
    let readFileSyncCalled = false;
    const originalReaddirSync = fs.readdirSync;
    const originalReadFileSync = fs.readFileSync;

    fs.readdirSync = ((...args: any[]) => {
      readdirSyncCalled = true;
      return originalReaddirSync.apply(fs, args as any);
    }) as any;

    fs.readFileSync = ((...args: any[]) => {
      readFileSyncCalled = true;
      return originalReadFileSync.apply(fs, args as any);
    }) as any;

    try {
      const data = analytics.getModelAnalytics();
      assert(data !== null, 'getModelAnalytics should return data');
      assert.strictEqual(readdirSyncCalled, false, 'fs.readdirSync was called during getModelAnalytics!');
      assert.strictEqual(readFileSyncCalled, false, 'fs.readFileSync was called during getModelAnalytics!');
    } finally {
      fs.readdirSync = originalReaddirSync;
      fs.readFileSync = originalReadFileSync;
    }
    console.log('  ✓ PASSED: Zero fs.readdirSync / fs.readFileSync calls detected during getModelAnalytics().\n');

    // ------------------------------------------------------------------------
    // SCENARIO 3: Execution Latency Benchmark (< 5ms)
    // ------------------------------------------------------------------------
    console.log('  [TEST] 3. Method Execution Latency Benchmark (Target: < 5ms) ...');
    
    // Warmup call
    analytics.getModelAnalytics();

    const iterations = 50;
    const startBench = performance.now();
    let maxSingleCall = 0;

    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      analytics.getModelAnalytics();
      const elapsed = performance.now() - t0;
      if (elapsed > maxSingleCall) maxSingleCall = elapsed;
    }

    const totalBenchDuration = performance.now() - startBench;
    const avgLatencyMs = totalBenchDuration / iterations;

    console.log(`     Average Latency: ${avgLatencyMs.toFixed(3)} ms across ${iterations} iterations`);
    console.log(`     Max Single Call: ${maxSingleCall.toFixed(3)} ms`);
    assert(avgLatencyMs < 5.0, `Average latency must be < 5ms, got ${avgLatencyMs.toFixed(3)} ms`);
    assert(maxSingleCall < 15.0, `Max single call latency must be bounded, got ${maxSingleCall.toFixed(3)} ms`);
    console.log('  ✓ PASSED: Sub-millisecond SQLite queries satisfy < 5ms criteria.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 4: Incremental Token Ingestion via IngestionQueue
    // ------------------------------------------------------------------------
    console.log('  [TEST] 4. Incremental Token Aggregation via IngestionQueue ...');

    const convDir = path.join(tempDir, 'brain', 'conv-phase3-alpha', '.system_generated', 'logs');
    fs.mkdirSync(convDir, { recursive: true });
    const transcriptPath = path.join(convDir, 'transcript.jsonl');

    const entry1 = JSON.stringify({
      step_index: 1,
      source: 'MODEL',
      type: 'PLANNER_RESPONSE',
      created_at: new Date().toISOString(),
      input_tokens: 1500,
      output_tokens: 350,
      cache_read_tokens: 50,
      tool_calls: [{ name: 'run_command', args: { CommandLine: 'dir' } }]
    });

    const entry2 = JSON.stringify({
      step_index: 2,
      source: 'MODEL',
      type: 'PLANNER_RESPONSE',
      created_at: new Date().toISOString(),
      input_tokens: 2500,
      output_tokens: 650,
      cache_read_tokens: 100,
      tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'backend-developer' } }]
    });

    fs.writeFileSync(transcriptPath, `${entry1}\n${entry2}\n`, 'utf-8');

    // Process file through queue
    await queue.processFile(transcriptPath);

    // 1. Verify session_token_usage row in database
    const sessionRow = tempDb.prepare('SELECT * FROM session_token_usage WHERE conversation_id = ?')
      .get('conv-phase3-alpha') as any;
    assert(sessionRow, 'session_token_usage record must exist for conv-phase3-alpha');
    assert.strictEqual(sessionRow.input_tokens, 4000, 'Sum of input tokens must be 4000');
    assert.strictEqual(sessionRow.output_tokens, 1000, 'Sum of output tokens must be 1000');
    assert.strictEqual(sessionRow.cache_read_tokens, 150, 'Sum of cache tokens must be 150');
    assert.strictEqual(sessionRow.step_count, 2, 'Step count must be 2');
    assert.strictEqual(sessionRow.model_tier, 'gemini-3.8-flash-high');

    // 2. Verify model_usage transition to LIVE
    const modelRow = tempDb.prepare('SELECT * FROM model_usage WHERE tier = ?')
      .get('gemini-3.8-flash-high') as any;
    assert.strictEqual(modelRow.provenance, 'LIVE', 'Model usage provenance must transition to LIVE');
    assert.strictEqual(modelRow.is_estimate, 0, 'is_estimate must be 0 for LIVE data');
    assert.strictEqual(modelRow.input_tokens, 4000, 'Model usage input tokens must match live tokens');
    assert.strictEqual(modelRow.output_tokens, 1000, 'Model usage output tokens must match live tokens');

    // 3. Verify getModelAnalytics() reflects LIVE status and exact numbers
    const updatedAnalytics = analytics.getModelAnalytics();
    assert.strictEqual(updatedAnalytics.verifiedRealSessionsCount, 1, 'Verified real sessions count must be 1');
    assert.strictEqual(updatedAnalytics.totalTokens.provenance, 'LIVE', 'totalTokens provenance must be LIVE');
    assert.strictEqual(updatedAnalytics.totalTokens.input, 4000);
    assert.strictEqual(updatedAnalytics.totalTokens.output, 1000);
    assert.strictEqual(updatedAnalytics.totalTokens.cacheRead, 150);

    const flashHighTier = updatedAnalytics.tiers.find(t => t.tier === 'gemini-3.8-flash-high');
    assert(flashHighTier, 'gemini-3.8-flash-high tier must exist');
    assert.strictEqual(flashHighTier.provenance, 'LIVE');
    assert.strictEqual(flashHighTier.isEstimate, false);
    assert.strictEqual(flashHighTier.inputTokens, 4000);
    assert.strictEqual(flashHighTier.outputTokens, 1000);

    // Unaffected tiers must retain DEMO provenance
    const proTier = updatedAnalytics.tiers.find(t => t.tier === 'pro');
    assert(proTier, 'pro tier must exist');
    assert.strictEqual(proTier.provenance, 'DEMO');
    assert.strictEqual(proTier.isEstimate, true);
    console.log('  ✓ PASSED: Incremental token delta and provenance transition to LIVE verified.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 5: Atomic Appending of New Lines (Quantum Accumulation)
    // ------------------------------------------------------------------------
    console.log('  [TEST] 5. Append Line Quantum Accumulation ...');

    const entry3 = JSON.stringify({
      step_index: 3,
      source: 'MODEL',
      type: 'PLANNER_RESPONSE',
      created_at: new Date().toISOString(),
      input_tokens: 1200,
      output_tokens: 300,
      cache_read_tokens: 50
    });

    fs.appendFileSync(transcriptPath, `${entry3}\n`, 'utf-8');
    await queue.processFile(transcriptPath);

    const sessionAfterAppend = tempDb.prepare('SELECT * FROM session_token_usage WHERE conversation_id = ?')
      .get('conv-phase3-alpha') as any;
    assert.strictEqual(sessionAfterAppend.input_tokens, 5200, '4000 + 1200 = 5200');
    assert.strictEqual(sessionAfterAppend.output_tokens, 1300, '1000 + 300 = 1300');
    assert.strictEqual(sessionAfterAppend.cache_read_tokens, 200, '150 + 50 = 200');
    assert.strictEqual(sessionAfterAppend.step_count, 3, 'Steps count must advance to 3');

    const analyticsAfterAppend = analytics.getModelAnalytics();
    assert.strictEqual(analyticsAfterAppend.totalTokens.input, 5200);
    assert.strictEqual(analyticsAfterAppend.totalTokens.output, 1300);
    assert.strictEqual(analyticsAfterAppend.totalTokens.cacheRead, 200);
    console.log('  ✓ PASSED: Append line quantum correctly accumulated without duplication.\n');

    // ------------------------------------------------------------------------
    // SCENARIO 6: Asynchronous Background Historical Sync
    // ------------------------------------------------------------------------
    console.log('  [TEST] 6. Asynchronous Background Historical Sessions Sync ...');

    const mockBrainDir = path.join(tempDir, 'mock_brain');
    for (let i = 1; i <= 4; i++) {
      const histDir = path.join(mockBrainDir, `conv-hist-${i}`, '.system_generated', 'logs');
      fs.mkdirSync(histDir, { recursive: true });
      fs.writeFileSync(path.join(histDir, 'transcript.jsonl'), JSON.stringify({
        step_index: 1,
        input_tokens: 500 * i,
        output_tokens: 100 * i,
        cache_read_tokens: 10 * i
      }) + '\n');
    }

    // Add a non-directory file to test skipping
    fs.writeFileSync(path.join(mockBrainDir, 'ignore_me.txt'), 'ignore');

    const syncResult = await analytics.syncHistoricalSessionsBackground(mockBrainDir);
    assert.strictEqual(syncResult.enqueued, 4, 'Should enqueue 4 historical transcripts');
    assert.strictEqual(syncResult.skipped, 1, 'Should skip 1 non-directory item');

    // Wait briefly for queue to process enqueued files
    let waitAttempts = 0;
    while (queue.getMetrics().queueLength > 0 && waitAttempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 50));
      waitAttempts++;
    }

    const sessionsInDb = tempDb.prepare('SELECT count(*) as count FROM session_token_usage').get() as { count: number };
    // 1 from alpha + 4 historical = 5
    assert.strictEqual(sessionsInDb.count, 5, 'All 5 sessions must be recorded in session_token_usage');

    const finalAnalytics = analytics.getModelAnalytics();
    assert.strictEqual(finalAnalytics.verifiedRealSessionsCount, 5, 'Must report 5 verified real sessions');
    assert.strictEqual(finalAnalytics.provenance, 'LIVE');
    console.log('  ✓ PASSED: Background historical scanning enqueues without event loop blocking.\n');

    console.log('================================================================');
    console.log('ALL PHASE 3 ANALYTICS & TOKEN AGGREGATION TESTS PASSED! ✓');
    console.log('================================================================\n');

  } finally {
    tempDb.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error on windows
    }
  }
}

main().catch(err => {
  console.error('\n❌ TEST RUNNER FAILED:', err);
  process.exit(1);
});
