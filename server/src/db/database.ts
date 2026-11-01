import Database from 'better-sqlite3';
import { CONFIG } from '../config.js';
import type { TaskItem, EventPayload, ControlSettings } from '../types.js';

export const db = new Database(CONFIG.DB_PATH);

// Enable WAL mode for high performance concurrent reads
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

export function initDatabase(targetDb: any = db) {
  targetDb.pragma('journal_mode = WAL');
  targetDb.pragma('foreign_keys = ON');
  targetDb.pragma('busy_timeout = 5000');

  targetDb.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_events_task ON events(task_id);

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
    CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(assigned_agent);

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
      provenance TEXT DEFAULT 'DEMO',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_token_usage (
      conversation_id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cache_read_tokens INTEGER DEFAULT 0,
      model_tier TEXT NOT NULL DEFAULT 'gemini-3.8-flash-high',
      step_count INTEGER DEFAULT 0,
      last_updated TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_session_token_model ON session_token_usage(model_tier);

    CREATE TABLE IF NOT EXISTS log_parse_state (
      file_path TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      last_offset INTEGER NOT NULL DEFAULT 0,
      last_line_number INTEGER NOT NULL DEFAULT 0,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_inode TEXT,
      file_birthtime_ms REAL NOT NULL DEFAULT 0,
      file_mtime_ms REAL NOT NULL DEFAULT 0,
      last_parsed_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      error_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_log_parse_conv ON log_parse_state(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_log_parse_status ON log_parse_state(status);
    CREATE INDEX IF NOT EXISTS idx_log_parse_updated ON log_parse_state(last_parsed_at DESC);
  `);

  // Migration: verify provenance column exists in model_usage
  const modelUsageCols = targetDb.pragma('table_info(model_usage)') as { name: string }[];
  if (!modelUsageCols.some(c => c.name === 'provenance')) {
    targetDb.exec(`ALTER TABLE model_usage ADD COLUMN provenance TEXT DEFAULT 'DEMO';`);
  }

  // Default settings
  const defaultSettings: ControlSettings = {
    maxConcurrentAgents: 6,
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
      'senior-architect',
      'legal-compliance',
      'security-engineer',
      'devops-engineer',
      'product-manager',
      'ai-evaluation-engineer',
      'performance-engineer',
      'accessibility-specialist',
      'database-specialist',
      'data-engineer'
    ]
  };

  const getSetting = targetDb.prepare('SELECT value FROM settings WHERE key = ?');
  const insertSetting = targetDb.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  const existingSetting = getSetting.get('control_settings') as { value: string } | undefined;
  if (!existingSetting) {
    insertSetting.run('control_settings', JSON.stringify(defaultSettings));
  } else {
    try {
      const parsed = JSON.parse(existingSetting.value);
      let changed = false;
      if (parsed.maxConcurrentAgents === 3 || parsed.maxConcurrentAgents == null) {
        parsed.maxConcurrentAgents = 6;
        changed = true;
      }
      if (!Array.isArray(parsed.allowedAgents)) {
        parsed.allowedAgents = [...defaultSettings.allowedAgents];
        changed = true;
      } else {
        for (const ag of defaultSettings.allowedAgents) {
          if (!parsed.allowedAgents.includes(ag)) {
            parsed.allowedAgents.push(ag);
            changed = true;
          }
        }
      }
      if (changed) {
        insertSetting.run('control_settings', JSON.stringify(parsed));
      }
    } catch {
      insertSetting.run('control_settings', JSON.stringify(defaultSettings));
    }
  }

  // Model usage defaults with provenance='DEMO', is_estimate=1
  const tiers = [
    { tier: 'gemini-3.8-flash-high', displayName: 'Gemini 3.8 Flash High (Директор)', runs: 12, completed: 11, esc: 1, inTokens: 145000, outTokens: 18400, isEst: 1, provenance: 'DEMO' },
    { tier: 'flash', displayName: 'Gemini Flash (Специалисты)', runs: 28, completed: 26, esc: 2, inTokens: 310000, outTokens: 42100, isEst: 1, provenance: 'DEMO' },
    { tier: 'pro', displayName: 'Gemini Pro (Senior Architect)', runs: 3, completed: 3, esc: 0, inTokens: 84000, outTokens: 9200, isEst: 1, provenance: 'DEMO' },
    { tier: 'gemini-4-argon-high', displayName: 'Gemini 4 Argon High (Эскалация L4)', runs: 1, completed: 1, esc: 0, inTokens: 45000, outTokens: 6100, isEst: 1, provenance: 'DEMO' }
  ];

  const insertTier = targetDb.prepare(`
    INSERT OR IGNORE INTO model_usage 
    (tier, display_name, runs_count, tasks_completed, escalation_count, input_tokens, output_tokens, is_estimate, provenance, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const t of tiers) {
    insertTier.run(t.tier, t.displayName, t.runs, t.completed, t.esc, t.inTokens, t.outTokens, t.isEst, t.provenance, now);
  }

  targetDb.exec(`UPDATE model_usage SET provenance = 'DEMO', is_estimate = 1 WHERE provenance IS NULL;`);

  // Seed sample tasks if table is empty
  const countTasks = targetDb.prepare('SELECT count(*) as count FROM tasks').get() as { count: number };
  if (countTasks.count === 0) {
    seedInitialTasks(targetDb);
  }
}

function seedInitialTasks(targetDb: any = db) {
  const insertTask = targetDb.prepare(`
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
      title: 'Аудит подсистем Antigravity и конфигурации AI Director',
      description: 'Полная проверка ~/.gemini/antigravity, базы знаний, наличия блокировок presence и CLI-команд agy.',
      status: 'completed',
      priority: 'high',
      assignedAgent: 'director',
      stage: 'Approved',
      createdAt: new Date(now.getTime() - 1000 * 60 * 25).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
      retryCount: 0,
      maxRetries: 2,
      isDemo: false,
      resultSummary: 'Проверено 8 файлов регламентов памяти, 9 агентов, возможности CLI agy и формат логов transcript.jsonl.',
      report: {
        taskName: 'Предварительный аудит архитектуры',
        status: 'SUCCESS',
        summary: 'Прямая проверка всех каталогов Antigravity и базы знаний Директора.',
        modifiedFiles: ['d:/Projects/ai-command-center/shared/types.ts'],
        executedChecks: ['agy agents', 'agy models', 'agy plugins list', 'проверка transcript.jsonl'],
        checkResults: 'Все ключевые подсистемы Antigravity проверены и доступны на локальной машине.',
        issuesAndRisks: 'Antigravity не предоставляет открытый HTTP сервер из коробки; необходим файловый наблюдатель и CLI мост.',
        pendingItems: 'Разработка пользовательского интерфейса и синхронизация по WebSocket.',
        nextSteps: 'Перейти к созданию визуальной панели AI Command Center.'
      }
    },
    {
      id: 'task-live-dashboard-ui',
      title: 'Разработка интерфейса AI Command Center (Liquid Dark Glass)',
      description: 'Создание визуальной панели с вкладками Обзор, Карта процессов, Управление агентами и Память.',
      status: 'in_progress',
      priority: 'critical',
      assignedAgent: 'frontend-developer',
      stage: 'Specialist',
      createdAt: new Date(now.getTime() - 1000 * 60 * 10).toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 2,
      isDemo: false,
      resultSummary: 'Клиентское приложение на Vite React со стилями Liquid Dark Glass.'
    },
    {
      id: 'task-demo-security-audit',
      title: 'Проверка безопасности и схем входных данных',
      description: 'Аудит API-границ, санитизация входных данных через Zod и предотвращение утечки секретов.',
      status: 'pending',
      priority: 'medium',
      assignedAgent: 'code-reviewer',
      stage: 'QualityGate_L1',
      createdAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 2,
      isDemo: true,
      resultSummary: 'Задача поставлена в очередь шлюза качества.'
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

// Ensure schema is created immediately upon module load
initDatabase();
