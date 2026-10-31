import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { performance } from 'perf_hooks';
import Database from 'better-sqlite3';
import { initDatabase } from '../server/src/db/database.js';
import {
  JsonlStreamReader,
  jsonlStreamReader,
  extractConversationId,
  extractEventsFromTranscriptEntry
} from '../server/src/services/jsonl-stream-reader.js';
import { IngestionQueue } from '../server/src/services/ingestion-queue.js';
import { createAntigravityPathFilter } from '../server/src/services/antigravity-bridge.js';
import type { EventPayload, LogParseState } from '../server/src/types.js';

interface TestMetrics {
  passed: number;
  failed: number;
  totalDurationMs: number;
}

const metrics: TestMetrics = {
  passed: 0,
  failed: 0,
  totalDurationMs: 0
};

class MockEventBus {
  public broadcastEvents: EventPayload[] = [];

  public broadcastRawEvent(evt: EventPayload): void {
    this.broadcastEvents.push(evt);
  }

  public reset(): void {
    this.broadcastEvents = [];
  }
}

async function runScenario(name: string, fn: () => Promise<void>) {
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
    console.error(`    Assertion / Execution error in "${name}":`, err.message);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(0, 5).map((l: string) => `      ${l}`).join('\n'));
    }
    metrics.failed++;
    throw err;
  }
}

async function main() {
  console.log('================================================================');
  console.log('STAGE 2 ACCEPTANCE SUITE: DATA INGESTION & JSONL STREAM PARSER');
  console.log('Isolated temp test environment with dedicated SQLite database');
  console.log('================================================================\n');

  const suiteStart = performance.now();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-ingest-qa-'));
  const dbPath = path.join(tempDir, 'test_isolated.sqlite');
  const tempDb = new Database(dbPath);

  // Initialize schema on isolated DB
  initDatabase(tempDb);

  const mockBus = new MockEventBus();
  const queue = new IngestionQueue(tempDb, mockBus);

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Initial read of a new file
    // ------------------------------------------------------------------------
    await runScenario('1. Initial read of a new transcript file', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s1', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      const entry1 = JSON.stringify({
        step_index: 1,
        created_at: new Date().toISOString(),
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'researcher', Role: 'Researcher' } }]
      });
      const entry2 = JSON.stringify({
        step_index: 2,
        created_at: new Date().toISOString(),
        status: 'ERROR',
        content: 'Initial query failed'
      });
      fs.writeFileSync(filePath, `${entry1}\n${entry2}\n`, 'utf-8');

      mockBus.reset();
      await queue.processFile(filePath);

      // Verify DB events
      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s1') as any[];
      assert.strictEqual(events.length, 2, 'Should insert 2 events');
      assert.strictEqual(mockBus.broadcastEvents.length, 2, 'Should broadcast 2 events');

      // Verify log_parse_state
      const state = queue.getState(filePath);
      assert(state, 'log_parse_state record must exist');
      assert.strictEqual(state.last_line_number, 2, 'Line number should be 2');
      assert(state.last_offset > 0, 'Offset should be greater than 0');
      assert.strictEqual(state.status, 'ACTIVE', 'Status should be ACTIVE');
      assert.strictEqual(state.error_count, 0, 'No parse error for valid JSON');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 2: Appending new lines
    // ------------------------------------------------------------------------
    await runScenario('2. Appending new lines to existing file', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s1', '.system_generated', 'logs');
      const filePath = path.join(convDir, 'transcript.jsonl');
      const prevState = queue.getState(filePath)!;
      const prevOffset = prevState.last_offset;

      const entry3 = JSON.stringify({
        step_index: 3,
        created_at: new Date().toISOString(),
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'frontend-developer' } }]
      });
      fs.appendFileSync(filePath, `${entry3}\n`, 'utf-8');

      mockBus.reset();
      await queue.processFile(filePath);

      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s1') as any[];
      assert.strictEqual(events.length, 3, 'Should have 3 total events now');
      assert.strictEqual(mockBus.broadcastEvents.length, 1, 'Only 1 new event should be broadcast');

      const newState = queue.getState(filePath)!;
      assert.strictEqual(newState.last_line_number, 3, 'Line number should advance to 3');
      assert(newState.last_offset > prevOffset, 'Offset must advance past appended entry');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 3: Splitting a single JSONL line across chunks (chunk split)
    // ------------------------------------------------------------------------
    await runScenario('3. Single JSONL line split across 64KB chunk boundaries', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s3', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      // Create a 75KB single line (exceeding 64KB CHUNK_SIZE)
      const bigPrompt = 'X'.repeat(75 * 1024);
      const bigEntry = JSON.stringify({
        step_index: 10,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'chunk-agent', Prompt: bigPrompt } }]
      });
      fs.writeFileSync(filePath, `${bigEntry}\n`, 'utf-8');

      mockBus.reset();
      await queue.processFile(filePath);

      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s3') as any[];
      assert.strictEqual(events.length, 1, 'Should parse complete 75KB line across chunks');
      assert.strictEqual(events[0].agent_id, 'chunk-agent');
      assert.strictEqual(mockBus.broadcastEvents.length, 1);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 4: UTF-8 multi-byte characters split across 64KB boundary
    // ------------------------------------------------------------------------
    await runScenario('4. Multi-byte UTF-8 (Cyrillic & Emojis) across 64KB boundary', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s4', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      // Craft exact split at offset 65535:
      // Line 1 pads almost up to the chunk boundary
      const line1Prefix = '{"step_index":19,"pad":"';
      const line1Suffix = '"}\n';
      const line2Prefix = '{"step_index":20,"tool_calls":[{"name":"invoke_subagent","args":{"TypeName":"utf8-lead","Prompt":"';
      const targetSplitOffset = 65535; // last byte of chunk 1
      const padLen = targetSplitOffset - (line1Prefix.length + line1Suffix.length + line2Prefix.length);
      assert(padLen > 0, 'Padding length must be positive');

      const line1 = line1Prefix + 'x'.repeat(padLen) + line1Suffix;
      const part1 = Buffer.from(line1 + line2Prefix, 'utf8');
      assert.strictEqual(part1.length, 65535, 'part1 length must be exactly 65535 bytes');

      const emojiBytes = Buffer.from('🚀 Привет, мир! 💎', 'utf8');
      const line2Suffix = Buffer.from('"}}] }\n', 'utf8');

      const fullBuffer = Buffer.concat([part1, emojiBytes, line2Suffix]);
      assert.strictEqual(fullBuffer[65535], 0xf0, 'Byte at 65535 must be 0xF0 (lead byte of rocket emoji)');
      assert.strictEqual(fullBuffer[65536], 0x9f, 'Byte at 65536 must be 0x9F (second byte of rocket emoji)');

      fs.writeFileSync(filePath, fullBuffer);

      mockBus.reset();
      await queue.processFile(filePath);

      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s4') as any[];
      assert.strictEqual(events.length, 1, 'Should extract event without corruption');
      const parsedData = JSON.parse(events[0].data);
      assert(parsedData.promptSnippet.startsWith('🚀 Привет, мир!'), 'Must preserve 🚀 Привет, мир! without replacement characters');
      assert(!parsedData.promptSnippet.includes('\uFFFD'), 'Must NOT contain UTF-8 replacement char');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 5: File without trailing newline (pending fragment)
    // ------------------------------------------------------------------------
    await runScenario('5. Incomplete trailing fragment without newline', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s5', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      // Valid line with newline, followed by partial incomplete line without newline
      const line1 = JSON.stringify({
        step_index: 30,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'valid-agent' } }]
      });
      const partialLine = '{"step_index":31,"tool_calls":[{"name":"invoke_subagent"';

      fs.writeFileSync(filePath, `${line1}\n${partialLine}`, 'utf-8');

      mockBus.reset();
      await queue.processFile(filePath);

      // Line 1 should be parsed, but partialLine should be left pending (uncommitted offset)
      let events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s5') as any[];
      assert.strictEqual(events.length, 1, 'Only complete line should be committed');
      assert.strictEqual(events[0].agent_id, 'valid-agent');

      // Now writer finishes the line and appends newline
      const completedRemainder = ',"args":{"TypeName":"completed-agent"}}]}\n';
      fs.appendFileSync(filePath, completedRemainder, 'utf-8');

      await queue.processFile(filePath);
      events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s5') as any[];
      assert.strictEqual(events.length, 2, 'Completed line must be parsed cleanly on next pass');
      assert.strictEqual(events[1].agent_id, 'completed-agent');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 6: Corrupted JSON between valid events (resilience)
    // ------------------------------------------------------------------------
    await runScenario('6. Resilience against malformed JSON between valid events', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s6', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      const line1 = JSON.stringify({
        step_index: 40,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'first-agent' } }]
      });
      const malformedLine = '{ this is broken json without closing brace...';
      const line3 = JSON.stringify({
        step_index: 41,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'third-agent' } }]
      });

      fs.writeFileSync(filePath, `${line1}\n${malformedLine}\n${line3}\n`, 'utf-8');

      mockBus.reset();
      await queue.processFile(filePath);

      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s6') as any[];
      assert.strictEqual(events.length, 2, 'Must extract both valid lines despite corrupt line in middle');
      assert.strictEqual(events[0].agent_id, 'first-agent');
      assert.strictEqual(events[1].agent_id, 'third-agent');

      const state = queue.getState(filePath)!;
      assert.strictEqual(state.error_count, 1, 'Must record 1 parse error in state');
      assert(state.last_error && state.last_error.includes('JSON parse error'), 'last_error must record JSON parse failure');
      assert.strictEqual(state.last_line_number, 3, 'Must have processed all 3 lines');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 7: Repeated run with saved offset (zero duplication)
    // ------------------------------------------------------------------------
    await runScenario('7. Repeated run with saved offset produces zero duplication', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s6', '.system_generated', 'logs');
      const filePath = path.join(convDir, 'transcript.jsonl');

      const eventsBefore = tempDb.prepare('SELECT count(*) as c FROM events').get() as any;
      mockBus.reset();

      // Run again with no file modifications
      await queue.processFile(filePath);

      const eventsAfter = tempDb.prepare('SELECT count(*) as c FROM events').get() as any;
      assert.strictEqual(eventsAfter.c, eventsBefore.c, 'No events should be inserted');
      assert.strictEqual(mockBus.broadcastEvents.length, 0, 'No broadcasts on no-op run');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 8: Process restart with offset recovery from SQLite
    // ------------------------------------------------------------------------
    await runScenario('8. Process restart with offset recovery from SQLite log_parse_state', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s8', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      const line1 = JSON.stringify({
        step_index: 50,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'agent-pre-restart' } }]
      });
      fs.writeFileSync(filePath, `${line1}\n`, 'utf-8');

      // Process with queue1
      await queue.processFile(filePath);

      // Simulate complete process restart: instantiate brand new IngestionQueue on same DB
      const freshQueue = new IngestionQueue(tempDb, mockBus);

      // Append new event while "restarted"
      const line2 = JSON.stringify({
        step_index: 51,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'agent-post-restart' } }]
      });
      fs.appendFileSync(filePath, `${line2}\n`, 'utf-8');

      mockBus.reset();
      await freshQueue.processFile(filePath);

      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s8') as any[];
      assert.strictEqual(events.length, 2, 'Should contain both events');
      assert.strictEqual(mockBus.broadcastEvents.length, 1, 'Only post-restart event broadcasted');
      assert.strictEqual(mockBus.broadcastEvents[0].agent_id, 'agent-post-restart');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 9: File truncation (size < offset -> detection and reset offset to 0)
    // ------------------------------------------------------------------------
    await runScenario('9. Truncation detection when file size shrinks below offset', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s9', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      // Create long file
      const longLine = JSON.stringify({
        step_index: 60,
        content: 'Long initial content '.repeat(20)
      });
      fs.writeFileSync(filePath, `${longLine}\n`, 'utf-8');
      await queue.processFile(filePath);
      const stateBefore = queue.getState(filePath)!;
      assert(stateBefore.last_offset > 100);

      // Truncate file to shorter line
      const shortLine = JSON.stringify({
        step_index: 61,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'truncated-recovery-agent' } }]
      });
      fs.writeFileSync(filePath, `${shortLine}\n`, 'utf-8');

      mockBus.reset();
      await queue.processFile(filePath);

      const stateAfter = queue.getState(filePath)!;
      assert.strictEqual(stateAfter.last_line_number, 1, 'Line number must reset to 1');
      assert(stateAfter.last_offset < stateBefore.last_offset, 'Offset must reset and reflect new shorter file');

      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s9') as any[];
      assert(events.some(e => e.agent_id === 'truncated-recovery-agent'), 'New content parsed after truncation');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 10: File replacement with same path (birthtime changed)
    // ------------------------------------------------------------------------
    await runScenario('10. File replacement detection via birthtime change', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s10', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      const lineA = JSON.stringify({
        step_index: 70,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'file-v1-agent' } }]
      });
      fs.writeFileSync(filePath, `${lineA}\n`, 'utf-8');
      await queue.processFile(filePath);

      // Simulate file replacement by mutating birthtime in stored state (>1000ms difference)
      tempDb.prepare('UPDATE log_parse_state SET file_birthtime_ms = ? WHERE file_path = ?')
        .run(Date.now() - 50000, path.resolve(filePath));

      const lineB = JSON.stringify({
        step_index: 71,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'file-v2-agent' } }]
      });
      fs.writeFileSync(filePath, `${lineB}\n`, 'utf-8');

      mockBus.reset();
      await queue.processFile(filePath);

      const state = queue.getState(filePath)!;
      assert.strictEqual(state.last_line_number, 1, 'Line number should reset to 1 due to birthtime change');
      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s10') as any[];
      assert(events.some(e => e.agent_id === 'file-v2-agent'), 'Replaced file content ingested');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 11: Rotation and renaming
    // ------------------------------------------------------------------------
    await runScenario('11. Log rotation and file renaming', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s11', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      fs.writeFileSync(filePath, JSON.stringify({ step_index: 80, tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'pre-rotate' } }] }) + '\n');
      await queue.processFile(filePath);

      // Rotate: rename file to transcript.jsonl.1
      const rotatedPath = path.join(convDir, 'transcript.jsonl.1');
      fs.renameSync(filePath, rotatedPath);

      // Create new fresh transcript.jsonl
      fs.writeFileSync(filePath, JSON.stringify({ step_index: 81, tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'post-rotate' } }] }) + '\n');

      mockBus.reset();
      await queue.processFile(filePath);

      const state = queue.getState(filePath)!;
      assert.strictEqual(state.last_line_number, 1);
      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s11') as any[];
      assert(events.some(e => e.agent_id === 'post-rotate'));
    });

    // ------------------------------------------------------------------------
    // SCENARIO 12: Simultaneous modification of multiple files (concurrency & queue)
    // ------------------------------------------------------------------------
    await runScenario('12. Concurrent queue ingestion across multiple files', async () => {
      const filePaths: string[] = [];
      const numFiles = 5;

      for (let i = 0; i < numFiles; i++) {
        const cDir = path.join(tempDir, 'brain', `conv-s12-${i}`, '.system_generated', 'logs');
        fs.mkdirSync(cDir, { recursive: true });
        const fPath = path.join(cDir, 'transcript.jsonl');
        const entry = JSON.stringify({
          step_index: 90 + i,
          tool_calls: [{ name: 'invoke_subagent', args: { TypeName: `concurrent-agent-${i}` } }]
        });
        fs.writeFileSync(fPath, `${entry}\n`, 'utf-8');
        filePaths.push(fPath);
      }

      mockBus.reset();
      // Enqueue all files concurrently into the IngestionQueue
      filePaths.forEach(fp => queue.enqueue(fp));

      // Wait until queue processing completes
      let waitedMs = 0;
      while (queue.getMetrics().queueLength > 0 || queue.getMetrics().activeWorkers > 0) {
        await new Promise(r => setTimeout(r, 20));
        waitedMs += 20;
        if (waitedMs > 5000) throw new Error('Timeout waiting for concurrent queue processing');
      }

      for (let i = 0; i < numFiles; i++) {
        const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all(`conv-s12-${i}`) as any[];
        assert.strictEqual(events.length, 1, `File ${i} must have 1 ingested event`);
        assert.strictEqual(events[0].agent_id, `concurrent-agent-${i}`);
      }
      assert.strictEqual(mockBus.broadcastEvents.length, numFiles, 'All concurrent events broadcast');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 13: Very large transcript streaming without OOM & MAX_LINE_SIZE
    // ------------------------------------------------------------------------
    await runScenario('13. Very large transcript streaming without OOM + 5MB line protection', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s13', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      // Write 2,500 entries (streaming test)
      const stream = fs.createWriteStream(filePath, { flags: 'w', encoding: 'utf-8' });
      const lineCount = 2500;
      for (let i = 0; i < lineCount; i++) {
        const entry = JSON.stringify({
          step_index: 1000 + i,
          content: `Test stream entry line payload index #${i}`
        });
        stream.write(`${entry}\n`);
      }
      await new Promise(r => stream.end(r));

      const memBefore = process.memoryUsage().heapUsed;

      // Ingest through reader
      let curState: LogParseState = {
        file_path: filePath,
        conversation_id: 'conv-s13',
        last_offset: 0,
        last_line_number: 0,
        file_size: 0,
        file_inode: null,
        file_birthtime_ms: 0,
        file_mtime_ms: 0,
        last_parsed_at: new Date().toISOString(),
        status: 'ACTIVE',
        error_count: 0,
        last_error: null
      };

      let quantaCount = 0;
      while (true) {
        const res = await jsonlStreamReader.readQuantum(filePath, curState, 200, 20);
        curState = res.updatedState;
        quantaCount++;
        if (!res.hasMore) break;
      }

      assert.strictEqual(curState.last_line_number, lineCount, 'Must process all 2500 lines');
      const memAfter = process.memoryUsage().heapUsed;
      const memDiffMb = (memAfter - memBefore) / (1024 * 1024);
      assert(memDiffMb < 50, `Memory growth during streaming must be < 50MB (was ${memDiffMb.toFixed(1)}MB)`);

      // Test MAX_LINE_SIZE protection: line exceeding 5MB is safely dropped without OOM
      const oversizedPath = path.join(convDir, 'oversized.jsonl');
      const sixMbPayload = 'Z'.repeat(5.5 * 1024 * 1024);
      const oversizedEntry = `{"step_index":9999,"content":"${sixMbPayload}"}\n`;
      const normalEntry = JSON.stringify({ step_index: 10000, tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'post-oversized-agent' } }] }) + '\n';
      fs.writeFileSync(oversizedPath, oversizedEntry + normalEntry, 'utf-8');

      const overState: LogParseState = {
        file_path: oversizedPath,
        conversation_id: 'conv-s13',
        last_offset: 0,
        last_line_number: 0,
        file_size: 0,
        file_inode: null,
        file_birthtime_ms: 0,
        file_mtime_ms: 0,
        last_parsed_at: new Date().toISOString(),
        status: 'ACTIVE',
        error_count: 0,
        last_error: null
      };

      const overQuantum = await jsonlStreamReader.readQuantum(oversizedPath, overState, 10, 100);
      assert.strictEqual(overQuantum.updatedState.error_count, 1, 'Must record error for oversized fragment');
      assert(overQuantum.updatedState.last_error && overQuantum.updatedState.last_error.includes('Max line size exceeded'), 'last_error indicates max line size');
      assert(overQuantum.events.some(e => e.agent_id === 'post-oversized-agent'), 'Subsequent valid line parsed safely');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 14: Re-delivery of the exact same event (INSERT OR IGNORE deduplication)
    // ------------------------------------------------------------------------
    await runScenario('14. Idempotent deduplication (INSERT OR IGNORE)', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s14', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      const entry = JSON.stringify({
        step_index: 200,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'idempotent-agent' } }]
      });
      fs.writeFileSync(filePath, `${entry}\n`, 'utf-8');

      mockBus.reset();
      await queue.processFile(filePath);
      assert.strictEqual(mockBus.broadcastEvents.length, 1);

      // Reset parse state to 0 to simulate re-parsing the file
      tempDb.prepare('UPDATE log_parse_state SET last_offset = 0, last_line_number = 0 WHERE file_path = ?')
        .run(path.resolve(filePath));

      mockBus.reset();
      await queue.processFile(filePath);

      // Verify no duplicates inserted and no duplicate broadcast
      const count = tempDb.prepare('SELECT count(*) as c FROM events WHERE id LIKE ?')
        .get('%s200%') as any;
      assert.strictEqual(count.c, 1, 'Events count must remain exactly 1');
      assert.strictEqual(mockBus.broadcastEvents.length, 0, 'No broadcast for duplicated/ignored event');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 15: File access errors (ENOENT / EBUSY)
    // ------------------------------------------------------------------------
    await runScenario('15. File access errors handled gracefully (ENOENT)', async () => {
      const nonExistentPath = path.join(tempDir, 'brain', 'missing', 'transcript.jsonl');

      const dummyState: LogParseState = {
        file_path: nonExistentPath,
        conversation_id: 'missing-conv',
        last_offset: 0,
        last_line_number: 0,
        file_size: 0,
        file_inode: null,
        file_birthtime_ms: 0,
        file_mtime_ms: 0,
        last_parsed_at: new Date().toISOString(),
        status: 'ACTIVE',
        error_count: 0,
        last_error: null
      };

      const result = await jsonlStreamReader.readQuantum(nonExistentPath, dummyState);
      assert.strictEqual(result.updatedState.status, 'ERROR');
      assert(result.updatedState.last_error && result.updatedState.last_error.includes('ENOENT'), 'Must report ENOENT in last_error');
      assert.strictEqual(result.events.length, 0);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 16: SQLite busy/locked (retry and exponential backoff)
    // ------------------------------------------------------------------------
    await runScenario('16. SQLite busy/locked backoff retry handling', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s16', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      fs.writeFileSync(filePath, JSON.stringify({
        step_index: 300,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'busy-retry-agent' } }]
      }) + '\n');

      // Set a very short busy timeout on tempDb to trigger SQLITE_BUSY quickly during lock
      tempDb.pragma('busy_timeout = 20');

      // Open second connection to hold an exclusive transaction lock
      const lockConn = new Database(dbPath);
      lockConn.pragma('busy_timeout = 20');
      lockConn.exec('BEGIN EXCLUSIVE');

      // Release lock after 100ms
      setTimeout(() => {
        try {
          lockConn.exec('COMMIT');
          lockConn.close();
        } catch {}
      }, 100);

      mockBus.reset();
      const metricsBefore = queue.getMetrics();
      await queue.processFile(filePath);

      // Restore normal busy_timeout
      tempDb.pragma('busy_timeout = 5000');

      const metricsAfter = queue.getMetrics();
      assert(metricsAfter.busyRetries > metricsBefore.busyRetries, 'Must record busyRetries retry attempt');

      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s16') as any[];
      assert.strictEqual(events.length, 1, 'Event committed successfully after lock release');
      assert.strictEqual(mockBus.broadcastEvents.length, 1, 'Event broadcasted post-commit');
    });

    // ------------------------------------------------------------------------
    // SCENARIO 17: createAntigravityPathFilter predicate accuracy
    // ------------------------------------------------------------------------
    await runScenario('17. Antigravity path filter predicate accuracy', async () => {
      const brainDir = 'C:/Users/vlad2/.gemini/antigravity/brain';
      const presenceDir = 'C:/Users/vlad2/.gemini/antigravity/presence';
      const filter = createAntigravityPathFilter(brainDir, presenceDir);

      const fakeDirStats = { isDirectory: () => true } as fs.Stats;
      const fakeFileStats = { isDirectory: () => false } as fs.Stats;

      // Allowed files
      assert.strictEqual(
        filter('C:/Users/vlad2/.gemini/antigravity/brain/session-1/.system_generated/logs/transcript.jsonl', fakeFileStats),
        true,
        'transcript.jsonl in .system_generated/logs must be allowed'
      );
      assert.strictEqual(
        filter('C:/Users/vlad2/.gemini/antigravity/presence/session-1.lock', fakeFileStats),
        true,
        'presence lock file must be allowed'
      );

      // Allowed directory traversal
      assert.strictEqual(
        filter('C:/Users/vlad2/.gemini/antigravity/brain/session-1', fakeDirStats),
        true,
        'session directory in brain must be allowed'
      );
      assert.strictEqual(
        filter('C:/Users/vlad2/.gemini/antigravity/brain/session-1/.system_generated', fakeDirStats),
        true,
        '.system_generated directory must be allowed'
      );

      // Denied temporary and junk files
      assert.strictEqual(filter('C:/test/file.tmp', fakeFileStats), false, '.tmp rejected');
      assert.strictEqual(filter('C:/test/file.swp', fakeFileStats), false, '.swp rejected');
      assert.strictEqual(filter('C:/test/file~', fakeFileStats), false, '~ rejected');
      assert.strictEqual(filter('C:/test/file.bak', fakeFileStats), false, '.bak rejected');
      assert.strictEqual(filter('C:/test/~$file.docx', fakeFileStats), false, '~$ rejected');
      assert.strictEqual(filter('C:/test/file.crdownload', fakeFileStats), false, '.crdownload rejected');

      // Denied excluded directories
      assert.strictEqual(filter('C:/test/node_modules', fakeDirStats), false, 'node_modules rejected');
      assert.strictEqual(filter('C:/test/.git', fakeDirStats), false, '.git rejected');
      assert.strictEqual(filter('C:/test/scratch', fakeDirStats), false, 'scratch rejected');
      assert.strictEqual(filter('C:/test/tempmediaStorage', fakeDirStats), false, 'tempmediaStorage rejected');

      // Denied arbitrary files outside logs
      assert.strictEqual(
        filter('C:/Users/vlad2/.gemini/antigravity/brain/session-1/notes.txt', fakeFileStats),
        false,
        'notes.txt outside logs rejected'
      );
    });

    // ------------------------------------------------------------------------
    // SCENARIO 18: Crash before transaction commit (no WS broadcast on rollback)
    // ------------------------------------------------------------------------
    await runScenario('18. Strict rollback invariant: zero WS broadcast on transaction failure', async () => {
      const convDir = path.join(tempDir, 'brain', 'conv-s18', '.system_generated', 'logs');
      fs.mkdirSync(convDir, { recursive: true });
      const filePath = path.join(convDir, 'transcript.jsonl');

      fs.writeFileSync(filePath, JSON.stringify({
        step_index: 400,
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'rollback-agent' } }]
      }) + '\n');

      // Create a faulty queue where runTransaction throws an unexpected database error
      const faultyBus = new MockEventBus();
      const faultyQueue = new IngestionQueue(tempDb, faultyBus);

      // Intercept runTransaction to simulate crash/rollback
      (faultyQueue as any)._runTransaction = () => {
        throw new Error('SIMULATED_TRANSACTION_CRASH_DURING_COMMIT');
      };

      let threw = false;
      try {
        await faultyQueue.processFile(filePath);
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('SIMULATED_TRANSACTION_CRASH_DURING_COMMIT'));
      }

      assert(threw, 'ProcessFile must propagate unrecoverable transaction crash');
      assert.strictEqual(faultyBus.broadcastEvents.length, 0, 'CRITICAL: No WS broadcast should happen if transaction rolled back');

      const events = tempDb.prepare('SELECT * FROM events WHERE project_id = ?').all('conv-s18') as any[];
      assert.strictEqual(events.length, 0, 'No event should be saved in DB upon rollback');
    });

    // ------------------------------------------------------------------------
    // PERFORMANCE & EVENT LOOP LATENCY BENCHMARK
    // ------------------------------------------------------------------------
    console.log('\n--- PERFORMANCE & EVENT LOOP LATENCY BENCHMARK ---');
    const benchDir = path.join(tempDir, 'brain', 'bench', '.system_generated', 'logs');
    fs.mkdirSync(benchDir, { recursive: true });
    const benchFile = path.join(benchDir, 'transcript.jsonl');

    // Create 1,000 JSON lines with agent calls and error events
    const benchLinesCount = 1000;
    const writeStream = fs.createWriteStream(benchFile, { flags: 'w', encoding: 'utf-8' });
    for (let i = 0; i < benchLinesCount; i++) {
      const entry = JSON.stringify({
        step_index: 5000 + i,
        created_at: new Date().toISOString(),
        tool_calls: [{ name: 'invoke_subagent', args: { TypeName: 'bench-worker', Prompt: `Task index ${i}` } }]
      });
      writeStream.write(`${entry}\n`);
    }
    await new Promise(r => writeStream.end(r));

    let maxEventLoopLagMs = 0;
    let totalLagSamples = 0;
    let sumLagMs = 0;
    let lastTimerCheck = performance.now();

    const lagInterval = setInterval(() => {
      const now = performance.now();
      const expectedDiff = 5; // 5ms timer
      const lag = Math.max(0, now - lastTimerCheck - expectedDiff);
      if (lag > maxEventLoopLagMs) maxEventLoopLagMs = lag;
      sumLagMs += lag;
      totalLagSamples++;
      lastTimerCheck = now;
    }, 5);

    const benchStart = performance.now();
    const benchMemStart = process.memoryUsage();

    await queue.processFile(benchFile);

    clearInterval(lagInterval);
    const benchDurationMs = performance.now() - benchStart;
    const benchMemEnd = process.memoryUsage();
    const avgLagMs = totalLagSamples > 0 ? (sumLagMs / totalLagSamples).toFixed(2) : '0';
    const heapDiffMb = ((benchMemEnd.heapUsed - benchMemStart.heapUsed) / (1024 * 1024)).toFixed(2);
    const throughput = ((benchLinesCount / benchDurationMs) * 1000).toFixed(0);

    console.log(`  Processed: ${benchLinesCount} lines in ${benchDurationMs.toFixed(1)}ms (${throughput} lines/sec)`);
    console.log(`  Max Event Loop Lag: ${maxEventLoopLagMs.toFixed(2)}ms (Target < 25.0ms)`);
    console.log(`  Avg Event Loop Lag: ${avgLagMs}ms`);
    console.log(`  Heap Memory Delta: ${heapDiffMb} MB`);

    assert(
      maxEventLoopLagMs < 25.0,
      `Event Loop max lag must be under 25ms (was ${maxEventLoopLagMs.toFixed(2)}ms)`
    );
    console.log('  ✓ Latency Criteria Satisfied: Max Event Loop latency < 25ms verified!');

  } finally {
    tempDb.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }

  metrics.totalDurationMs = performance.now() - suiteStart;
  console.log('\n================================================================');
  console.log(`INGESTION QA PASS COMPLETE: ${metrics.passed}/18 SCENARIOS PASSED, ${metrics.failed} FAILED`);
  console.log(`Total duration: ${(metrics.totalDurationMs / 1000).toFixed(2)}s`);
  console.log('================================================================\n');

  if (metrics.failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch(err => {
  console.error('\nFATAL ERROR IN INGESTION TEST SUITE:', err);
  process.exit(1);
});
