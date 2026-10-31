import fs from 'fs';
import path from 'path';
import { db } from '../db/database.js';
import { ingestionQueue, IngestionQueue } from './ingestion-queue.js';
import type { ModelMetrics, DataProvenance } from '../types.js';

export interface ModelAnalyticsResponse {
  tiers: ModelMetrics[];
  totalTokens: {
    input: number;
    output: number;
    cacheRead: number;
    provenance: DataProvenance;
  };
  totalRuns: number;
  overallSuccessRate: number;
  escalationRate: number;
  verifiedRealSessionsCount: number;
  provenance: DataProvenance;
}

export class AnalyticsService {
  private db: any;
  private queue: IngestionQueue;
  private isSyncingHistorical: boolean = false;

  private _sessionSummaryStmt?: any;
  private _tierTokensStmt?: any;
  private _modelUsageStmt?: any;
  private _taskStatsStmt?: any;

  constructor(customDb?: any, customQueue?: IngestionQueue) {
    this.db = customDb || db;
    this.queue = customQueue || ingestionQueue;
  }

  private get sessionSummaryStmt() {
    if (!this._sessionSummaryStmt) {
      this._sessionSummaryStmt = this.db.prepare(`
        SELECT 
          COUNT(*) as session_count,
          COALESCE(SUM(input_tokens), 0) as total_input,
          COALESCE(SUM(output_tokens), 0) as total_output,
          COALESCE(SUM(cache_read_tokens), 0) as total_cache
        FROM session_token_usage
        WHERE input_tokens > 0 OR output_tokens > 0
      `);
    }
    return this._sessionSummaryStmt;
  }

  private get tierTokensStmt() {
    if (!this._tierTokensStmt) {
      this._tierTokensStmt = this.db.prepare(`
        SELECT 
          model_tier,
          COUNT(*) as session_count,
          COALESCE(SUM(input_tokens), 0) as input_tokens,
          COALESCE(SUM(output_tokens), 0) as output_tokens,
          COALESCE(SUM(cache_read_tokens), 0) as cache_tokens
        FROM session_token_usage
        GROUP BY model_tier
      `);
    }
    return this._tierTokensStmt;
  }

  private get modelUsageStmt() {
    if (!this._modelUsageStmt) {
      this._modelUsageStmt = this.db.prepare(`
        SELECT 
          tier,
          display_name,
          runs_count,
          tasks_completed,
          escalation_count,
          input_tokens,
          output_tokens,
          is_estimate,
          COALESCE(provenance, 'DEMO') as provenance,
          updated_at
        FROM model_usage
      `);
    }
    return this._modelUsageStmt;
  }

  private get taskStatsStmt() {
    if (!this._taskStatsStmt) {
      this._taskStatsStmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total_tasks,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_tasks,
          COALESCE(SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END), 0) as escalated_tasks
        FROM tasks
      `);
    }
    return this._taskStatsStmt;
  }

  public getModelAnalytics(): ModelAnalyticsResponse {
    // 1. Query SQLite session token usage (Zero disk reads)
    const sessionSummary = this.sessionSummaryStmt.get() as {
      session_count: number;
      total_input: number;
      total_output: number;
      total_cache: number;
    };

    const tierTokenRows = this.tierTokensStmt.all() as {
      model_tier: string;
      session_count: number;
      input_tokens: number;
      output_tokens: number;
      cache_tokens: number;
    }[];

    const tierTokensMap = new Map<string, { input: number; output: number; cache: number }>();
    for (const row of tierTokenRows) {
      tierTokensMap.set(row.model_tier, {
        input: row.input_tokens,
        output: row.output_tokens,
        cache: row.cache_tokens
      });
    }

    // 2. Query model_usage tier records
    const usageRows = this.modelUsageStmt.all() as {
      tier: string;
      display_name: string;
      runs_count: number;
      tasks_completed: number;
      escalation_count: number;
      input_tokens: number;
      output_tokens: number;
      is_estimate: number;
      provenance: string;
      updated_at: string;
    }[];

    // 3. Query tasks for validation and cross-checks
    const taskStats = this.taskStatsStmt.get() as {
      total_tasks: number;
      completed_tasks: number;
      escalated_tasks: number;
    };

    const tiers: ModelMetrics[] = usageRows.map(r => {
      const liveTokens = tierTokensMap.get(r.tier);
      const hasLiveTokens = Boolean(liveTokens && (liveTokens.input > 0 || liveTokens.output > 0));
      const isLive = r.provenance === 'LIVE' || hasLiveTokens;

      const provenance: DataProvenance = isLive 
        ? 'LIVE' 
        : (r.provenance === 'DEMO' ? 'DEMO' : (r.provenance as DataProvenance || 'DEMO'));

      const isEstimate = !isLive && (r.is_estimate === 1 || provenance === 'DEMO');

      const inputTokens = isLive
        ? (liveTokens ? liveTokens.input : r.input_tokens)
        : r.input_tokens;

      const outputTokens = isLive
        ? (liveTokens ? liveTokens.output : r.output_tokens)
        : r.output_tokens;

      return {
        tier: r.tier,
        displayName: r.display_name,
        runsCount: r.runs_count,
        tasksCompleted: r.tasks_completed,
        successRate: r.runs_count > 0 ? Math.round((r.tasks_completed / r.runs_count) * 100) : 100,
        escalationCount: r.escalation_count,
        inputTokens,
        outputTokens,
        isEstimate,
        provenance
      };
    });

    const verifiedRealSessionsCount = sessionSummary.session_count || 0;
    const hasAnyLive = verifiedRealSessionsCount > 0 || tiers.some(t => t.provenance === 'LIVE');

    const totalInput = hasAnyLive && sessionSummary.total_input > 0
      ? sessionSummary.total_input
      : tiers.reduce((acc, t) => acc + t.inputTokens, 0);

    const totalOutput = hasAnyLive && sessionSummary.total_output > 0
      ? sessionSummary.total_output
      : tiers.reduce((acc, t) => acc + t.outputTokens, 0);

    const totalCache = sessionSummary.total_cache || 0;

    const overallProvenance: DataProvenance = hasAnyLive
      ? 'LIVE'
      : (tiers.every(t => t.provenance === 'DEMO') ? 'DEMO' : 'ESTIMATED');

    const totalRuns = tiers.reduce((acc, t) => acc + t.runsCount, 0);
    const totalCompleted = tiers.reduce((acc, t) => acc + t.tasksCompleted, 0);
    const totalEscalations = tiers.reduce((acc, t) => acc + t.escalationCount, 0);
    const overallSuccessRate = totalRuns > 0 ? Math.round((totalCompleted / totalRuns) * 100) : 100;
    const escalationRate = totalRuns > 0 ? parseFloat(((totalEscalations / totalRuns) * 100).toFixed(1)) : 0;

    return {
      tiers,
      totalTokens: {
        input: totalInput,
        output: totalOutput,
        cacheRead: totalCache,
        provenance: overallProvenance
      },
      totalRuns,
      overallSuccessRate,
      escalationRate,
      verifiedRealSessionsCount,
      provenance: overallProvenance
    };
  }

  public async syncHistoricalSessionsBackground(brainDir: string): Promise<{ enqueued: number; skipped: number }> {
    if (this.isSyncingHistorical) {
      return { enqueued: 0, skipped: 0 };
    }
    this.isSyncingHistorical = true;

    let enqueued = 0;
    let skipped = 0;

    try {
      try {
        await fs.promises.access(brainDir);
      } catch {
        return { enqueued: 0, skipped: 0 };
      }

      const entries = await fs.promises.readdir(brainDir, { withFileTypes: true });
      let counter = 0;

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          skipped++;
          continue;
        }

        const transcriptPath = path.join(brainDir, entry.name, '.system_generated', 'logs', 'transcript.jsonl');
        try {
          await fs.promises.access(transcriptPath);
          this.queue.enqueue(transcriptPath);
          enqueued++;
        } catch {
          skipped++;
        }

        counter++;
        if (counter % 15 === 0) {
          // Cooperative yield to avoid blocking the event loop
          await new Promise(resolve => setImmediate(resolve));
        }
      }
    } catch (err) {
      console.error('[Analytics] Error syncing historical sessions in background:', err);
    } finally {
      this.isSyncingHistorical = false;
    }

    return { enqueued, skipped };
  }
}

export const analyticsService = new AnalyticsService();
