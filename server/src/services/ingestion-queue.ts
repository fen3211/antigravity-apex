import path from 'path';
import { db } from '../db/database.js';
import { eventBus } from './event-bus.js';
import { jsonlStreamReader, extractConversationId } from './jsonl-stream-reader.js';
import type { EventPayload, LogParseState, IngestionMetrics } from '../types.js';

export class IngestionQueue {
  private queue: string[] = [];
  private enqueuedSet: Set<string> = new Set();
  private activeSet: Set<string> = new Set();
  private rerunSet: Set<string> = new Set();
  private isProcessing: boolean = false;

  private metrics: Omit<IngestionMetrics, 'queueLength' | 'activeWorkers'> = {
    totalEnqueued: 0,
    totalProcessed: 0,
    totalLinesParsed: 0,
    totalEventsInserted: 0,
    totalBytesRead: 0,
    totalErrors: 0,
    busyRetries: 0,
    lastProcessedAt: null
  };

  private _insertEventStmt?: any;
  private _upsertStateStmt?: any;
  private _getStateStmt?: any;
  private _upsertSessionTokensStmt?: any;
  private _incrementModelUsageStmt?: any;
  private _runTransaction?: (
    events: EventPayload[],
    state: LogParseState,
    tokenDelta?: { input: number; output: number; cacheRead: number },
    stepsCount?: number,
    modelTier?: string
  ) => EventPayload[];

  private db: any;
  private eventBus: any;

  constructor(customDb?: any, customEventBus?: any) {
    this.db = customDb || db;
    this.eventBus = customEventBus || eventBus;
  }

  private get insertEventStmt() {
    if (!this._insertEventStmt) {
      this._insertEventStmt = this.db.prepare(`
        INSERT OR IGNORE INTO events (id, timestamp, project_id, task_id, agent_id, type, source, data)
        VALUES (@id, @timestamp, @project_id, @task_id, @agent_id, @type, @source, @data)
      `);
    }
    return this._insertEventStmt;
  }

  private get upsertStateStmt() {
    if (!this._upsertStateStmt) {
      this._upsertStateStmt = this.db.prepare(`
        INSERT INTO log_parse_state (
          file_path, conversation_id, last_offset, last_line_number,
          file_size, file_inode, file_birthtime_ms, file_mtime_ms,
          last_parsed_at, status, error_count, last_error
        ) VALUES (
          @file_path, @conversation_id, @last_offset, @last_line_number,
          @file_size, @file_inode, @file_birthtime_ms, @file_mtime_ms,
          @last_parsed_at, @status, @error_count, @last_error
        )
        ON CONFLICT(file_path) DO UPDATE SET
          conversation_id = excluded.conversation_id,
          last_offset = excluded.last_offset,
          last_line_number = excluded.last_line_number,
          file_size = excluded.file_size,
          file_inode = excluded.file_inode,
          file_birthtime_ms = excluded.file_birthtime_ms,
          file_mtime_ms = excluded.file_mtime_ms,
          last_parsed_at = excluded.last_parsed_at,
          status = excluded.status,
          error_count = excluded.error_count,
          last_error = excluded.last_error
      `);
    }
    return this._upsertStateStmt;
  }

  private get upsertSessionTokensStmt() {
    if (!this._upsertSessionTokensStmt) {
      this._upsertSessionTokensStmt = this.db.prepare(`
        INSERT INTO session_token_usage (
          conversation_id, file_path, input_tokens, output_tokens, cache_read_tokens,
          model_tier, step_count, last_updated
        ) VALUES (
          @conversation_id, @file_path, @input_tokens, @output_tokens, @cache_read_tokens,
          @model_tier, @step_count, @last_updated
        )
        ON CONFLICT(conversation_id) DO UPDATE SET
          input_tokens = session_token_usage.input_tokens + excluded.input_tokens,
          output_tokens = session_token_usage.output_tokens + excluded.output_tokens,
          cache_read_tokens = session_token_usage.cache_read_tokens + excluded.cache_read_tokens,
          step_count = session_token_usage.step_count + excluded.step_count,
          file_path = excluded.file_path,
          model_tier = excluded.model_tier,
          last_updated = excluded.last_updated
      `);
    }
    return this._upsertSessionTokensStmt;
  }

  private get incrementModelUsageStmt() {
    if (!this._incrementModelUsageStmt) {
      this._incrementModelUsageStmt = this.db.prepare(`
        INSERT INTO model_usage (
          tier, display_name, runs_count, tasks_completed, escalation_count,
          input_tokens, output_tokens, is_estimate, provenance, updated_at
        ) VALUES (
          @tier, @tier, 1, 0, 0, @input_tokens, @output_tokens, 0, 'LIVE', @updated_at
        )
        ON CONFLICT(tier) DO UPDATE SET
          input_tokens = CASE WHEN model_usage.provenance = 'DEMO' THEN excluded.input_tokens ELSE model_usage.input_tokens + excluded.input_tokens END,
          output_tokens = CASE WHEN model_usage.provenance = 'DEMO' THEN excluded.output_tokens ELSE model_usage.output_tokens + excluded.output_tokens END,
          provenance = 'LIVE',
          is_estimate = 0,
          updated_at = excluded.updated_at
      `);
    }
    return this._incrementModelUsageStmt;
  }

  private get getStateStmt() {
    if (!this._getStateStmt) {
      this._getStateStmt = this.db.prepare(`
        SELECT * FROM log_parse_state WHERE file_path = ?
      `);
    }
    return this._getStateStmt;
  }

  private get runTransaction(): (
    events: EventPayload[],
    state: LogParseState,
    tokenDelta?: { input: number; output: number; cacheRead: number },
    stepsCount?: number,
    modelTier?: string
  ) => EventPayload[] {
    if (!this._runTransaction) {
      this._runTransaction = this.db.transaction((
        events: EventPayload[],
        state: LogParseState,
        tokenDelta?: { input: number; output: number; cacheRead: number },
        stepsCount?: number,
        modelTier?: string
      ): EventPayload[] => {
        const newlyInserted: EventPayload[] = [];
        for (const evt of events) {
          const info = this.insertEventStmt.run({
            id: evt.id,
            timestamp: evt.timestamp,
            project_id: evt.project_id,
            task_id: evt.task_id || null,
            agent_id: evt.agent_id || null,
            type: evt.type,
            source: evt.source,
            data: JSON.stringify(evt.data || {})
          });
          if (info.changes > 0) {
            newlyInserted.push(evt);
          }
        }
        this.upsertStateStmt.run(state);

        const hasTokens = Boolean(tokenDelta && (tokenDelta.input > 0 || tokenDelta.output > 0 || tokenDelta.cacheRead > 0));
        const hasSteps = Boolean(stepsCount && stepsCount > 0);
        if (hasTokens || hasSteps) {
          const tier = modelTier || 'gemini-3.8-flash-high';
          const now = new Date().toISOString();
          const inTokens = tokenDelta?.input || 0;
          const outTokens = tokenDelta?.output || 0;
          const cacheTokens = tokenDelta?.cacheRead || 0;
          const steps = stepsCount || 0;

          this.upsertSessionTokensStmt.run({
            conversation_id: state.conversation_id,
            file_path: state.file_path,
            input_tokens: inTokens,
            output_tokens: outTokens,
            cache_read_tokens: cacheTokens,
            model_tier: tier,
            step_count: steps,
            last_updated: now
          });

          if (hasTokens) {
            this.incrementModelUsageStmt.run({
              tier,
              input_tokens: inTokens,
              output_tokens: outTokens,
              updated_at: now
            });
          }
        }

        return newlyInserted;
      });
    }
    return this._runTransaction!;
  }

  public enqueue(filePath: string): void {
    const normalized = path.resolve(filePath);
    this.metrics.totalEnqueued++;

    if (this.activeSet.has(normalized)) {
      this.rerunSet.add(normalized);
      return;
    }

    if (this.enqueuedSet.has(normalized)) {
      return;
    }

    this.queue.push(normalized);
    this.enqueuedSet.add(normalized);

    if (!this.isProcessing) {
      this.processQueue().catch(err => {
        console.error('[IngestionQueue] Unhandled error in processQueue:', err);
      });
    }
  }

  public async processFile(filePath: string): Promise<void> {
    const normalized = path.resolve(filePath);
    let state = this.getState(normalized);

    if (!state) {
      state = {
        file_path: normalized,
        conversation_id: extractConversationId(normalized),
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
    }

    while (true) {
      const prevOffset = state.last_offset;
      const quantum = await jsonlStreamReader.readQuantum(normalized, state, 50, 16);

      this.metrics.totalLinesParsed += quantum.linesInQuantum;
      if (quantum.newOffset > prevOffset) {
        this.metrics.totalBytesRead += (quantum.newOffset - prevOffset);
      }

      // Check if we have anything to commit
      const hasTokens = quantum.tokenDelta.input > 0 || quantum.tokenDelta.output > 0 || quantum.tokenDelta.cacheRead > 0;
      const hasSteps = quantum.stepsCount > 0;
      const hasChanges =
        quantum.events.length > 0 ||
        hasTokens ||
        hasSteps ||
        quantum.newOffset !== state.last_offset ||
        quantum.updatedState.status !== state.status ||
        quantum.updatedState.error_count !== state.error_count;

      if (hasChanges) {
        // Atomic transaction with SQLITE_BUSY retry
        const insertedEvents = await this.commitTransactionWithRetry(
          quantum.events,
          quantum.updatedState,
          quantum.tokenDelta,
          quantum.stepsCount
        );

        this.metrics.totalEventsInserted += insertedEvents.length;

        // STRICT INVARIANT: broadcast strictly AFTER successful transaction commit!
        for (const evt of insertedEvents) {
          try {
            this.eventBus.broadcastRawEvent(evt);
          } catch (e) {
            console.error('[IngestionQueue] Error broadcasting raw event:', e);
          }
        }
      }

      state = quantum.updatedState;

      // Break if no more chunks or if no progress was made in this quantum
      if (!quantum.hasMore || (quantum.newOffset === prevOffset && quantum.linesInQuantum === 0)) {
        break;
      }

      // Yield execution to Event Loop between quanta
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  private async commitTransactionWithRetry(
    events: EventPayload[],
    state: LogParseState,
    tokenDelta?: { input: number; output: number; cacheRead: number },
    stepsCount?: number,
    modelTier?: string,
    maxRetries: number = 5
  ): Promise<EventPayload[]> {
    let attempt = 0;
    while (true) {
      try {
        return this.runTransaction(events, state, tokenDelta, stepsCount, modelTier);
      } catch (err: any) {
        attempt++;
        const isBusy = err && (err.code === 'SQLITE_BUSY' || (err.message && err.message.includes('busy')));
        if (isBusy && attempt <= maxRetries) {
          this.metrics.busyRetries++;
          const baseDelay = Math.min(100 * Math.pow(2, attempt), 2000);
          const jitter = Math.random() * 50;
          const delay = baseDelay + jitter;
          console.warn(`[IngestionQueue] Database busy (attempt ${attempt}/${maxRetries}), retrying in ${delay.toFixed(0)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        this.metrics.totalErrors++;
        throw err;
      }
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const filePath = this.queue.shift()!;
        this.enqueuedSet.delete(filePath);
        this.activeSet.add(filePath);

        try {
          await this.processFile(filePath);
          this.metrics.totalProcessed++;
          this.metrics.lastProcessedAt = new Date().toISOString();
        } catch (err: any) {
          this.metrics.totalErrors++;
          console.error(`[IngestionQueue] Error processing file ${filePath}:`, err);
        } finally {
          this.activeSet.delete(filePath);

          // If file was updated while being processed, re-enqueue
          if (this.rerunSet.has(filePath)) {
            this.rerunSet.delete(filePath);
            if (!this.enqueuedSet.has(filePath)) {
              this.queue.push(filePath);
              this.enqueuedSet.add(filePath);
            }
          }
        }

        // Brief yield between files
        await new Promise(resolve => setImmediate(resolve));
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        this.processQueue().catch(err => {
          console.error('[IngestionQueue] Error restarting processQueue:', err);
        });
      }
    }
  }

  public getState(filePath: string): LogParseState | undefined {
    try {
      const normalized = path.resolve(filePath);
      return this.getStateStmt.get(normalized) as LogParseState | undefined;
    } catch (err) {
      console.error('[IngestionQueue] Error getting log parse state:', err);
      return undefined;
    }
  }

  public getMetrics(): IngestionMetrics {
    return {
      ...this.metrics,
      queueLength: this.queue.length,
      activeWorkers: this.activeSet.size
    };
  }
}

export const ingestionQueue = new IngestionQueue();
