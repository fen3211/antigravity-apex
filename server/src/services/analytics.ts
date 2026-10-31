import fs from 'fs';
import path from 'path';
import { db } from '../db/database.js';
import { CONFIG, checkPathExists } from '../config.js';
import type { ModelMetrics } from '../types.js';

export class AnalyticsService {
  public getModelAnalytics(): {
    tiers: ModelMetrics[];
    totalTokens: { input: number; output: number; cacheRead: number };
    totalRuns: number;
    overallSuccessRate: number;
    escalationRate: number;
    verifiedRealSessionsCount: number;
  } {
    // 1. Read real token counts from all available brain transcripts
    let liveInputTokens = 0;
    let liveOutputTokens = 0;
    let liveCacheTokens = 0;
    let verifiedRealSessionsCount = 0;

    if (checkPathExists(CONFIG.BRAIN_DIR)) {
      try {
        const brainDirs = fs.readdirSync(CONFIG.BRAIN_DIR);
        for (const dir of brainDirs) {
          const transcriptPath = path.join(CONFIG.BRAIN_DIR, dir, '.system_generated', 'logs', 'transcript.jsonl');
          if (fs.existsSync(transcriptPath)) {
            try {
              const content = fs.readFileSync(transcriptPath, 'utf-8');
              const lines = content.split('\n');
              let sessionInput = 0;
              let sessionOutput = 0;
              let sessionCache = 0;

              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const item = JSON.parse(line);
                  if (item.input_tokens) sessionInput += item.input_tokens;
                  if (item.output_tokens) sessionOutput += item.output_tokens;
                  if (item.cache_read_tokens) sessionCache += item.cache_read_tokens;
                } catch {
                  // ignore
                }
              }

              if (sessionInput > 0 || sessionOutput > 0) {
                liveInputTokens += sessionInput;
                liveOutputTokens += sessionOutput;
                liveCacheTokens += sessionCache;
                verifiedRealSessionsCount++;
              }
            } catch {
              // skip unreadable
            }
          }
        }
      } catch (err) {
        console.error('[Analytics] Error scanning brain transcripts:', err);
      }
    }

    // 2. Read tier records from SQLite
    const rows = db.prepare('SELECT * FROM model_usage').all() as any[];
    const tiers: ModelMetrics[] = rows.map(r => ({
      tier: r.tier,
      displayName: r.display_name,
      runsCount: r.runs_count,
      tasksCompleted: r.tasks_completed,
      successRate: r.runs_count > 0 ? Math.round((r.tasks_completed / r.runs_count) * 100) : 100,
      escalationCount: r.escalation_count,
      inputTokens: r.tier === 'gemini-3.8-flash-high' && liveInputTokens > 0 ? liveInputTokens : r.input_tokens,
      outputTokens: r.tier === 'gemini-3.8-flash-high' && liveOutputTokens > 0 ? liveOutputTokens : r.output_tokens,
      isEstimate: r.is_estimate === 1
    }));

    // Calculate totals
    const totalRuns = tiers.reduce((acc, t) => acc + t.runsCount, 0);
    const totalCompleted = tiers.reduce((acc, t) => acc + t.tasksCompleted, 0);
    const totalEscalations = tiers.reduce((acc, t) => acc + t.escalationCount, 0);
    const overallSuccessRate = totalRuns > 0 ? Math.round((totalCompleted / totalRuns) * 100) : 100;
    const escalationRate = totalRuns > 0 ? parseFloat(((totalEscalations / totalRuns) * 100).toFixed(1)) : 0;

    return {
      tiers,
      totalTokens: {
        input: liveInputTokens > 0 ? liveInputTokens : tiers.reduce((acc, t) => acc + t.inputTokens, 0),
        output: liveOutputTokens > 0 ? liveOutputTokens : tiers.reduce((acc, t) => acc + t.outputTokens, 0),
        cacheRead: liveCacheTokens
      },
      totalRuns,
      overallSuccessRate,
      escalationRate,
      verifiedRealSessionsCount
    };
  }
}

export const analyticsService = new AnalyticsService();
