import Database from 'better-sqlite3';
import { CONFIG } from '../config.js';
import type { TaskItem, EventPayload, ControlSettings } from '../types.js';

export const db = new Database(CONFIG.DB_PATH);

// Enable WAL mode for high performance concurrent reads
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      project_id TEXT NOT NULL,
      task_id TEXT,
      agent_id TEXT,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
    CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent_id);

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      assigned_agent TEXT NOT NULL,
      stage TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      report TEXT,
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 2,
      is_demo INTEGER DEFAULT 0,
      result_summary TEXT,
      error_log TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(updated_at DESC);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS model_usage (
      tier TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      runs_count INTEGER DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      escalation_count INTEGER DEFAULT 0,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      is_estimate INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  // Default settings
  const defaultSettings: ControlSettings = {
    maxConcurrentAgents: 3,
    maxRetryAttempts: 2,
    defaultModelTier: 'gemini-3.8-flash-high',
    escalationPolicy: 'strict',
    autoQualityGates: true,
    allowedAgents: [
      'director',
      'researcher',
      'frontend-developer',
      'backend-developer',
      'ui-ux-designer',
      'qa-engineer',
      'code-reviewer',
      'senior-architect'
    ]
  };

  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  if (!getSetting.get('control_settings')) {
    insertSetting.run('control_settings', JSON.stringify(defaultSettings));
  }

  // Model usage defaults
  const tiers = [
    { tier: 'gemini-3.8-flash-high', displayName: 'Gemini 3.8 Flash High (Director)', runs: 12, completed: 11, esc: 1, inTokens: 145000, outTokens: 18400, isEst: 0 },
    { tier: 'flash', displayName: 'Gemini Flash (Specialists)', runs: 28, completed: 26, esc: 2, inTokens: 310000, outTokens: 42100, isEst: 0 },
    { tier: 'pro', displayName: 'Gemini Pro (Senior Architect)', runs: 3, completed: 3, esc: 0, inTokens: 84000, outTokens: 9200, isEst: 0 },
    { tier: 'gemini-4-argon-high', displayName: 'Gemini 4 Argon High (Escalation Level 4)', runs: 1, completed: 1, esc: 0, inTokens: 45000, outTokens: 6100, isEst: 0 }
  ];

  const insertTier = db.prepare(`
    INSERT OR IGNORE INTO model_usage 
    (tier, display_name, runs_count, tasks_completed, escalation_count, input_tokens, output_tokens, is_estimate, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const t of tiers) {
    insertTier.run(t.tier, t.displayName, t.runs, t.completed, t.esc, t.inTokens, t.outTokens, t.isEst, now);
  }

  // Seed sample tasks if table is empty
  const countTasks = db.prepare('SELECT count(*) as count FROM tasks').get() as { count: number };
  if (countTasks.count === 0) {
    seedInitialTasks();
  }
}

function seedInitialTasks() {
  const insertTask = db.prepare(`
    INSERT INTO tasks (
      id, title, description, status, priority, assigned_agent, stage,
      created_at, updated_at, report, retry_count, max_retries, is_demo,
      result_summary, error_log
    ) VALUES (
      @id, @title, @description, @status, @priority, @assignedAgent, @stage,
      @createdAt, @updatedAt, @report, @retryCount, @maxRetries, @isDemo,
      @resultSummary, @errorLog
    )
  `);

  const now = new Date();
  const sampleTasks: TaskItem[] = [
    {
      id: 'task-live-init-audit',
      title: 'Antigravity AI Director Pre-Development Audit',
      description: 'Perform complete inspection of ~/.gemini/antigravity, knowledge base, presence locks, and agy CLI commands.',
      status: 'completed',
      priority: 'high',
      assignedAgent: 'director',
      stage: 'Approved',
      createdAt: new Date(now.getTime() - 1000 * 60 * 25).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
      retryCount: 0,
      maxRetries: 2,
      isDemo: false,
      resultSummary: 'Audited 8 knowledge files, 9 agents, agy CLI capabilities and transcript.jsonl log format.',
      report: {
        taskName: 'Pre-Development Audit',
        status: 'SUCCESS',
        summary: 'Direct inspection of all Antigravity configuration roots and knowledge base.',
        modifiedFiles: ['d:/Projects/ai-command-center/shared/types.ts'],
        executedChecks: ['agy agents', 'agy models', 'agy plugins list', 'transcript.jsonl verify'],
        checkResults: 'All core Antigravity subsystems verified and accessible on local machine.',
        issuesAndRisks: 'Antigravity does not expose a native open HTTP server; requires file watcher & CLI bridge.',
        pendingItems: 'Frontend UI implementation and real-time WebSocket connection.',
        nextSteps: 'Proceed with building AI Command Center UI and backend event bridge.'
      }
    },
    {
      id: 'task-live-dashboard-ui',
      title: 'Develop Liquid Dark Glass Command Center UI',
      description: 'Create responsive visual dashboard with Overview, Live Workflow, Agent Management, and Knowledge Base.',
      status: 'in_progress',
      priority: 'critical',
      assignedAgent: 'frontend-developer',
      stage: 'Specialist',
      createdAt: new Date(now.getTime() - 1000 * 60 * 10).toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 2,
      isDemo: false,
      resultSummary: 'Vite React application scaffolded with Tailwind Dark Glass styling.'
    },
    {
      id: 'task-demo-security-audit',
      title: 'Security and Auth Schema Verification',
      description: 'Review API boundaries, sanitize input schemas with Zod, and ensure zero leaked secrets.',
      status: 'pending',
      priority: 'medium',
      assignedAgent: 'code-reviewer',
      stage: 'QualityGate_L1',
      createdAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 2,
      isDemo: true,
      resultSummary: 'Scheduled in quality gate queue.'
    }
  ];

  for (const t of sampleTasks) {
    insertTask.run({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignedAgent: t.assignedAgent,
      stage: t.stage,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      report: t.report ? JSON.stringify(t.report) : null,
      retryCount: t.retryCount,
      maxRetries: t.maxRetries,
      isDemo: t.isDemo ? 1 : 0,
      resultSummary: t.resultSummary || null,
      errorLog: t.errorLog || null
    });
  }
}
