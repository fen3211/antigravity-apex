import fs from 'fs';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CONFIG, checkPathExists } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { antigravityBridge } from '../services/antigravity-bridge.js';
import { taskManager } from '../services/task-manager.js';
import { eventBus } from '../services/event-bus.js';
import { analyticsService } from '../services/analytics.js';
import { controlService } from '../services/control.js';
import { processSupervisor } from '../services/process-supervisor.js';
import { legalGateService, OFFICIAL_PRIMARY_SOURCES } from '../services/legal-gate.js';
import { escalationManager } from '../services/escalation-manager.js';

export const apiRouter = Router();


// Helper to determine if incoming request is from local loopback
function isLocalRequest(req: Request): boolean {
  const ip = req.ip || req.socket.remoteAddress || '';
  const localIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
  return localIps.includes(ip) || ip.endsWith('127.0.0.1');
}

// ==========================================
// 0. Auth & Token Bootstrapping
// ==========================================
apiRouter.get('/auth/token', (req: Request, res: Response) => {
  const origin = req.headers.origin || req.get('origin');
  if (origin && !CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Blocked by CORS policy: Origin not allowed' });
  }

  if (!isLocalRequest(req)) {
    return res.status(403).json({ error: 'Access denied: Token endpoint is only accessible from local loopback' });
  }

  res.json({ token: CONFIG.API_KEY });
});

// ==========================================
// 1. Director & System Status
// ==========================================
apiRouter.get('/status', (req: Request, res: Response) => {
  try {
    const status = antigravityBridge.getDirectorStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 1b. Diagnostic Doctor (/api/system/doctor)
// ==========================================
apiRouter.get('/system/doctor', async (_req: Request, res: Response) => {
  try {
    const nodeStatus = {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptimeSeconds: Math.floor(process.uptime()),
      pid: process.pid,
      memory: process.memoryUsage()
    };

    // SQLite checks
    const dbExists = fs.existsSync(CONFIG.DB_PATH);
    let sqliteStatus: any = {
      connected: false,
      dbPath: CONFIG.DB_PATH,
      exists: dbExists
    };

    try {
      const { db } = await import('../db/database.js');
      const pragmaJournal = db.pragma('journal_mode', { simple: true });
      const pragmaBusy = db.pragma('busy_timeout', { simple: true });
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
      const sizeBytes = dbExists ? fs.statSync(CONFIG.DB_PATH).size : 0;

      sqliteStatus = {
        connected: true,
        dbPath: CONFIG.DB_PATH,
        exists: true,
        sizeBytes,
        journalMode: pragmaJournal,
        busyTimeoutMs: pragmaBusy,
        tablesCount: tables.length,
        tables: tables.map(t => t.name)
      };
    } catch (dbErr: any) {
      sqliteStatus.error = dbErr.message;
    }

    // Antigravity paths check
    const antigravityPaths = {
      antigravityDir: {
        path: CONFIG.ANTIGRAVITY_DIR,
        exists: checkPathExists(CONFIG.ANTIGRAVITY_DIR)
      },
      brainDir: {
        path: CONFIG.BRAIN_DIR,
        exists: checkPathExists(CONFIG.BRAIN_DIR)
      },
      presenceDir: {
        path: CONFIG.PRESENCE_DIR,
        exists: checkPathExists(CONFIG.PRESENCE_DIR)
      },
      conversationsDir: {
        path: CONFIG.CONVERSATIONS_DIR,
        exists: checkPathExists(CONFIG.CONVERSATIONS_DIR)
      },
      aiDirectorPluginDir: {
        path: CONFIG.AI_DIRECTOR_PLUGIN_DIR,
        exists: checkPathExists(CONFIG.AI_DIRECTOR_PLUGIN_DIR)
      },
      aiDirectorAgentsDir: {
        path: CONFIG.AI_DIRECTOR_AGENTS_DIR,
        exists: checkPathExists(CONFIG.AI_DIRECTOR_AGENTS_DIR)
      }
    };

    // Knowledge base check
    const knowledgeDocs = antigravityBridge.getKnowledgeDocs();
    const knowledgeStatus = {
      dir: CONFIG.KNOWLEDGE_DIR,
      exists: checkPathExists(CONFIG.KNOWLEDGE_DIR),
      documentsCount: knowledgeDocs.length,
      documents: knowledgeDocs.map(d => ({
        filename: d.filename,
        title: d.title,
        size: d.size,
        lastModified: d.lastModified
      }))
    };

    // CLI agy check
    const agyCliAvailable = checkPathExists(CONFIG.AGY_CLI_PATH);
    let agyVersion: string | null = null;
    if (agyCliAvailable) {
      const cliRes = await antigravityBridge.runAgyCommand(['--version'], 3000);
      if (cliRes.success && cliRes.stdout) {
        agyVersion = cliRes.stdout;
      }
    }

    const agyStatus = {
      configuredPath: CONFIG.AGY_CLI_PATH,
      available: agyCliAvailable,
      version: agyVersion
    };

    // Agents check (all 17 roles)
    const knownAgents = antigravityBridge.getKnownAgents();
    const agentsStatus = {
      totalRegistered: knownAgents.length,
      allRolesCovered: knownAgents.length >= 17,
      roles: knownAgents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        model: a.model,
        status: a.status
      }))
    };

    // Supervisor check
    const supervisorStatus = {
      activeProcesses: processSupervisor.getActiveCount(),
      maxConcurrent: processSupervisor.getMaxConcurrent(),
      totalProcessesTracked: processSupervisor.getAllProcesses().length
    };

    const overallOk = sqliteStatus.connected && agentsStatus.allRolesCovered;

    res.json({
      status: overallOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      nodejs: nodeStatus,
      sqlite: sqliteStatus,
      antigravity: antigravityPaths,
      knowledgeBase: knowledgeStatus,
      agyCli: agyStatus,
      agents: agentsStatus,
      supervisor: supervisorStatus
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// ==========================================
// 2. Agents
// ==========================================
apiRouter.get('/agents', (req: Request, res: Response) => {
  try {
    const agents = antigravityBridge.getKnownAgents();
    res.json(agents);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/agents/:id', (req: Request, res: Response) => {
  const agentId = String(req.params.id);
  const agents = antigravityBridge.getKnownAgents();
  const agent = agents.find(a => a.id === agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

const updateAgentStatusSchema = z.object({
  status: z.enum(['idle', 'running', 'paused', 'blocked', 'escalated']),
  currentTask: z.string().optional()
});

apiRouter.post('/agents/:id/status', requireAuth, (req: Request, res: Response) => {
  try {
    const agentId = String(req.params.id);
    const agents = antigravityBridge.getKnownAgents();
    if (!agents.some(a => a.id === agentId)) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    const parsed = updateAgentStatusSchema.parse(req.body);
    antigravityBridge.updateAgentStatus(agentId, parsed.status, parsed.currentTask);
    res.json({ success: true, agentId, status: parsed.status });
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

// ==========================================
// 3. Tasks
// ==========================================
apiRouter.get('/tasks', (req: Request, res: Response) => {
  try {
    const { status, isDemo, agentId } = req.query;
    const tasks = taskManager.getAllTasks({
      status: status ? String(status) : undefined,
      isDemo: isDemo !== undefined ? isDemo === 'true' : undefined,
      agentId: agentId ? String(agentId) : undefined
    });
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const createTaskSchema = z.object({
  title: z.string().min(3).max(250),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignedAgent: z.string().default('director'),
  stage: z.enum([
    'Director_Triage',
    'Solo',
    'Specialist',
    'QualityGate_L1',
    'Independent_L2',
    'LegalGate',
    'Architect_L3',
    'Argon_L4',
    'Approved'
  ]).default('Director_Triage'),
  isDemo: z.boolean().default(false)
});

apiRouter.post('/tasks', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = createTaskSchema.parse(req.body);
    const task = taskManager.createTask(parsed);
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

apiRouter.get('/tasks/:id', (req: Request, res: Response) => {
  const taskId = String(req.params.id);
  const task = taskManager.getTaskById(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(250).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'verification', 'completed', 'failed', 'escalated']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedAgent: z.string().min(1).max(64).optional(),
  stage: z.enum([
    'Director_Triage',
    'Solo',
    'Specialist',
    'QualityGate_L1',
    'Independent_L2',
    'LegalGate',
    'Architect_L3',
    'Argon_L4',
    'Approved'
  ]).optional(),
  retryCount: z.number().int().min(0).optional(),
  maxRetries: z.number().int().min(0).optional(),
  resultSummary: z.string().optional(),
  errorLog: z.string().optional(),
  isDemo: z.boolean().optional()
});

apiRouter.patch('/tasks/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const taskId = String(req.params.id);
    const parsed = updateTaskSchema.parse(req.body);
    const updated = taskManager.updateTask(taskId, parsed);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

apiRouter.post('/tasks/:id/restart', requireAuth, (req: Request, res: Response) => {
  const taskId = String(req.params.id);
  const result = taskManager.restartTask(taskId);
  res.json(result);
});

const subagentReportSchema = z.object({
  taskName: z.string().min(1, 'taskName is required'),
  status: z.enum(['SUCCESS', 'FAILURE', 'BLOCKED']),
  summary: z.string().min(1, 'summary is required'),
  modifiedFiles: z.array(z.string()),
  executedChecks: z.array(z.string()),
  checkResults: z.string().min(1, 'checkResults is required'),
  issuesAndRisks: z.string().min(1, 'issuesAndRisks is required'),
  pendingItems: z.string().min(1, 'pendingItems is required'),
  nextSteps: z.string().min(1, 'nextSteps is required')
});

const postReportBodySchema = z.object({
  report: subagentReportSchema
}).or(subagentReportSchema);

apiRouter.post('/tasks/:id/report', requireAuth, (req: Request, res: Response) => {
  try {
    const taskId = String(req.params.id);
    const parsed = postReportBodySchema.parse(req.body);
    const reportData = 'report' in parsed ? parsed.report : parsed;
    const updated = taskManager.submitSubagentReport(taskId, reportData);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

const executeTaskSchema = z.object({
  prompt: z.string().optional(),
  agentName: z.string().optional(),
  timeoutMs: z.number().int().positive().optional()
});

apiRouter.post('/tasks/:id/execute', requireAuth, async (req: Request, res: Response) => {
  try {
    const taskId = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/).parse(req.params.id);
    const parsed = executeTaskSchema.parse(req.body || {});
    const task = taskManager.getTaskById(taskId);
    const prompt = parsed.prompt || task?.description || task?.title || `Execute task ${taskId}`;
    const agentName = parsed.agentName || task?.assignedAgent || 'director';
    const settings = controlService.getSettings();
    if (!settings.allowedAgents.includes(agentName) || !/^[a-zA-Z0-9_-]+$/.test(agentName)) {
      return res.status(400).json({ error: `Agent "${agentName}" is not allowed` });
    }
    const process = await processSupervisor.spawnTask(taskId, prompt, agentName, parsed.timeoutMs);
    res.json({ success: true, process });
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

apiRouter.post('/tasks/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const taskId = String(req.params.id);
    const success = await processSupervisor.cancelTask(taskId);
    res.json({ success, taskId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/tasks/:id/process-status', (req: Request, res: Response) => {
  const taskId = String(req.params.id);
  const proc = processSupervisor.getProcess(taskId);
  if (!proc) {
    return res.status(404).json({ error: 'Process not found for task' });
  }
  res.json(proc);
});

apiRouter.get('/processes', (req: Request, res: Response) => {
  try {
    const processes = processSupervisor.getAllProcesses();
    res.json(processes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 4. Events
// ==========================================
apiRouter.get('/events', (req: Request, res: Response) => {
  const { limit, type, agent_id, task_id } = req.query;
  const events = eventBus.getRecentEvents({
    limit: limit ? parseInt(String(limit), 10) : 50,
    type: type ? String(type) : undefined,
    agent_id: agent_id ? String(agent_id) : undefined,
    task_id: task_id ? String(task_id) : undefined
  });
  res.json(events);
});

const createEventSchema = z.object({
  type: z.string().min(1),
  source: z.enum(['LIVE_AGY', 'INTERNAL_BRIDGE', 'SYSTEM', 'DEMO']).optional(),
  agent_id: z.string().optional(),
  task_id: z.string().optional(),
  data: z.record(z.any()).optional()
});

apiRouter.post('/events', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = createEventSchema.parse(req.body);
    const event = eventBus.publish({
      type: parsed.type as any,
      source: parsed.source || 'DEMO',
      agent_id: parsed.agent_id,
      task_id: parsed.task_id,
      data: parsed.data || {}
    });
    res.status(201).json(event);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

// ==========================================
// 5. Analytics
// ==========================================
apiRouter.get('/analytics', (req: Request, res: Response) => {
  try {
    const analytics = analyticsService.getModelAnalytics();
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. Knowledge Base
// ==========================================
const knowledgeFilenameRegex = /^[a-zA-Z0-9_-]+\.md$/;

apiRouter.get('/knowledge', (req: Request, res: Response) => {
  try {
    const docs = antigravityBridge.getKnowledgeDocs();
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/knowledge/:filename', (req: Request, res: Response) => {
  const filename = String(req.params.filename);
  if (!knowledgeFilenameRegex.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const doc = antigravityBridge.getKnowledgeDoc(filename);
  if (!doc) return res.status(404).json({ error: 'Knowledge doc not found' });
  res.json(doc);
});

apiRouter.post('/knowledge/:filename', requireAuth, (req: Request, res: Response) => {
  const filename = String(req.params.filename);
  if (!knowledgeFilenameRegex.test(filename)) {
    return res.status(400).json({
      error: 'Invalid filename: only alphanumeric characters, dashes, underscores, and .md extension are allowed'
    });
  }
  const { content } = req.body;
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Content must be a string' });
  }
  const success = antigravityBridge.saveKnowledgeDoc(filename, content);
  if (!success) {
    return res.status(500).json({ error: 'Failed saving knowledge doc' });
  }
  res.json({ success: true, filename });
});

// ==========================================
// 7. Control Center
// ==========================================
apiRouter.get('/control/settings', requireAuth, (req: Request, res: Response) => {
  const settings = controlService.getSettings();
  res.json(settings);
});

const updateSettingsSchema = z.object({
  maxConcurrentAgents: z.number().int().min(1).max(10).optional(),
  maxRetryAttempts: z.number().int().min(1).max(10).optional(),
  defaultModelTier: z.string().min(1).optional(),
  escalationPolicy: z.enum(['strict', 'relaxed']).optional(),
  autoQualityGates: z.boolean().optional(),
  allowedAgents: z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/)).optional()
});

apiRouter.post('/control/settings', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = updateSettingsSchema.parse(req.body);
    const updated = controlService.updateSettings(parsed);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

const escalateArgonSchema = z.object({
  taskId: z.string().optional(),
  issueTitle: z.string().min(3).max(500),
  rootCauseHypothesis: z.string().min(3).max(5000),
  failedAttempt1: z.string().optional(),
  failedAttempt2: z.string().optional(),
  isolatedContextSnippet: z.string().optional(),
  targetQuestion: z.string().optional()
});

apiRouter.post('/control/escalate-argon', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = escalateArgonSchema.parse(req.body);
    const result = controlService.generateArgonEscalationPack({
      taskId: parsed.taskId,
      issueTitle: parsed.issueTitle,
      rootCauseHypothesis: parsed.rootCauseHypothesis,
      failedAttempt1: parsed.failedAttempt1 || 'Attempt 1 failed verification tests.',
      failedAttempt2: parsed.failedAttempt2 || 'Attempt 2 caused architectural regression.',
      isolatedContextSnippet: parsed.isolatedContextSnippet || '// Isolated reproduction code',
      targetQuestion: parsed.targetQuestion || 'Provide architectural diagnosis and resolution strategy.'
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

const runPromptSchema = z.object({
  prompt: z.string().min(1).max(10000),
  agentName: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/).default('director'),
  confirm: z.literal(true)
});

apiRouter.post('/control/run-prompt', requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt, agentName, confirm } = runPromptSchema.parse(req.body);
    const settings = controlService.getSettings();
    if (!settings.allowedAgents.includes(agentName)) {
      return res.status(400).json({ error: `Agent "${agentName}" is not in the allowed agents whitelist` });
    }

    const result = await controlService.executeTaskPrompt(prompt, agentName);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

const argonVerdictSchema = z.object({
  taskId: z.string().min(1, 'taskId is required'),
  verdict: z.string().min(1, 'verdict is required'),
  targetSpecialist: z.string().min(1, 'targetSpecialist is required')
});

apiRouter.post('/control/argon-verdict', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = argonVerdictSchema.parse(req.body);
    const task = controlService.resolveArgonVerdict(parsed);
    res.json({ success: true, task });
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});


// ==========================================
// 8. Antigravity CLI Live Tools
// ==========================================
apiRouter.get('/models', async (req: Request, res: Response) => {
  const cliRes = await antigravityBridge.runAgyCommand(['models']);
  if (cliRes.success && cliRes.stdout) {
    const lines = cliRes.stdout.split('\n').filter(l => l.includes('\t'));
    const models = lines.map(line => {
      const [id, name] = line.split('\t');
      return { id: id.trim(), name: (name || id).trim() };
    });
    return res.json(models);
  }

  // Fallback verified model list
  res.json([
    { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High)' },
    { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash (Medium)' },
    { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Low)' },
    { id: 'gemini-4-argon-high', name: 'Gemini 4 Argon (High)' },
    { id: 'gemini-4-argon-medium', name: 'Gemini 4 Argon (Medium)' },
    { id: 'pro', name: 'Gemini Pro (Senior Architect)' }
  ]);
});

apiRouter.get('/plugins', async (req: Request, res: Response) => {
  const cliRes = await antigravityBridge.runAgyCommand(['plugins', 'list']);
  res.json({
    raw: cliRes.stdout || cliRes.stderr,
    success: cliRes.success
  });
});

// ==========================================
// 9. Legal & Compliance Gate (Gate 2b)
// ==========================================
const legalEvaluateSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  criteria: z.object({
    entityLocation: z.string().optional(),
    founderCitizenship: z.string().optional(),
    serverDbLocation: z.string().optional(),
    targetAudience: z.string().optional(),
    paymentMethods: z.string().optional(),
    regulatoryRegistries: z.string().optional(),
    distributionChannels: z.string().optional(),
    thirdPartyServices: z.string().optional(),
    applicableLawClause: z.string().optional(),
    advertisingTerritory: z.string().optional()
  }).optional()
});

apiRouter.post('/legal/evaluate', (req: Request, res: Response) => {
  try {
    const parsed = legalEvaluateSchema.parse(req.body);
    const result = legalGateService.evaluateTrigger(parsed.title, parsed.description, parsed.criteria);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

const legalAssessSchema = z.object({
  projectAndFeature: z.string().min(1, 'projectAndFeature is required'),
  jurisdiction: z.string().optional(),
  applicableNorms: z.array(z.string()),
  identifiedRisks: z.array(z.string()),
  riskLevel: z.enum(['GREEN', 'AMBER', 'RED', 'UNKNOWN']),
  officialSources: z.array(z.object({
    name: z.string(),
    url: z.string(),
    checkedDate: z.string(),
    inForceDate: z.string()
  })).optional(),
  mechanismOfNonCompliance: z.string().optional(),
  potentialConsequences: z.string().optional(),
  recommendedRemediation: z.string().optional(),
  humanCounselRequirement: z.enum(['YES', 'NO', 'RECOMMENDED']).optional(),
  taskId: z.string().optional(),
  criteria: z.object({
    entityLocation: z.string().optional(),
    founderCitizenship: z.string().optional(),
    serverDbLocation: z.string().optional(),
    targetAudience: z.string().optional(),
    paymentMethods: z.string().optional(),
    regulatoryRegistries: z.string().optional(),
    distributionChannels: z.string().optional(),
    thirdPartyServices: z.string().optional(),
    applicableLawClause: z.string().optional(),
    advertisingTerritory: z.string().optional()
  }).optional()
});

apiRouter.post('/legal/assess', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = legalAssessSchema.parse(req.body);
    const assessment = legalGateService.createAssessment(parsed);
    res.json(assessment);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

const legalReconcileSchema = z.object({
  feature: z.string().min(1, 'feature is required'),
  description: z.string().optional()
});

apiRouter.post('/legal/reconcile', (req: Request, res: Response) => {
  try {
    const parsed = legalReconcileSchema.parse(req.body);
    const result = legalGateService.reconcileDualJurisdiction(parsed.feature, parsed.description);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

apiRouter.get('/legal/sources', (_req: Request, res: Response) => {
  res.json(OFFICIAL_PRIMARY_SOURCES);
});

// ==========================================
// 10. Intelligent Argon Escalation
// ==========================================

apiRouter.get('/escalations', (req: Request, res: Response) => {
  try {
    const status = req.query.status as any;
    const priority = req.query.priority as any;
    const search = req.query.search as string;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : undefined;

    const escalations = escalationManager.getAllEscalations({ status, priority, search, limit, offset });
    res.json(escalations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/escalations/stats', (_req: Request, res: Response) => {
  try {
    const stats = escalationManager.getEscalationStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/escalations/settings', (_req: Request, res: Response) => {
  try {
    const sensitivity = escalationManager.getSensitivity();
    res.json({ sensitivity });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const sensitivitySchema = z.object({
  sensitivity: z.enum(['conservative', 'balanced', 'aggressive'])
});

apiRouter.put('/escalations/settings', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = sensitivitySchema.parse(req.body);
    escalationManager.setSensitivity(parsed.sensitivity);
    res.json({ success: true, sensitivity: parsed.sensitivity });
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

apiRouter.get('/escalations/:id', (req: Request, res: Response) => {
  try {
    const escalation = escalationManager.getEscalationById(req.params.id);
    if (!escalation) {
      return res.status(404).json({ error: 'Escalation not found' });
    }
    res.json(escalation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const evaluateTaskSchema = z.object({
  taskId: z.string().min(1),
  errorLogs: z.array(z.string()).optional(),
  reports: z.array(z.any()).optional(),
  codeSnippet: z.string().optional()
});

apiRouter.post('/escalations/evaluate-task', (req: Request, res: Response) => {
  try {
    const parsed = evaluateTaskSchema.parse(req.body);
    const task = taskManager.getTaskById(parsed.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const evalResult = escalationManager.evaluateTaskForEscalation(task, {
      errorLogs: parsed.errorLogs,
      reports: parsed.reports,
      codeSnippet: parsed.codeSnippet
    });
    res.json(evalResult);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

const triggerEscalationSchema = z.object({
  taskId: z.string().min(1),
  reason: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium']).optional(),
  involvedAgents: z.array(z.string()).optional(),
  evidence: z.any().optional(),
  force: z.boolean().optional()
});

apiRouter.post('/escalations/trigger', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = triggerEscalationSchema.parse(req.body);
    const task = taskManager.getTaskById(parsed.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const result = escalationManager.triggerEscalation({
      task,
      reason: parsed.reason,
      priority: parsed.priority,
      involvedAgents: parsed.involvedAgents,
      evidence: parsed.evidence,
      force: parsed.force
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

apiRouter.post('/escalations/:id/copy', (req: Request, res: Response) => {
  try {
    const updated = escalationManager.markPromptCopied(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/escalations/:id/send', (req: Request, res: Response) => {
  try {
    const updated = escalationManager.markSentToArgon(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const submitResponseSchema = z.object({
  responseText: z.string().min(1, 'Response text is required')
});

apiRouter.post('/escalations/:id/response', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = submitResponseSchema.parse(req.body);
    const result = escalationManager.submitArgonResponse(req.params.id, parsed.responseText);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

const resolveEscalationSchema = z.object({
  note: z.string().optional()
});

apiRouter.post('/escalations/:id/resolve', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = resolveEscalationSchema.parse(req.body || {});
    const resolved = escalationManager.resolveEscalation(req.params.id, parsed.note);
    res.json(resolved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const rejectEscalationSchema = z.object({
  reason: z.string().optional()
});

apiRouter.post('/escalations/:id/reject', requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = rejectEscalationSchema.parse(req.body || {});
    const rejected = escalationManager.rejectEscalation(req.params.id, parsed.reason);
    res.json(rejected);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/escalations/:id/regenerate', requireAuth, (req: Request, res: Response) => {
  try {
    const regenerated = escalationManager.regeneratePromptPack(req.params.id);
    res.json(regenerated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
