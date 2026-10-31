import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { antigravityBridge } from '../services/antigravity-bridge.js';
import { taskManager } from '../services/task-manager.js';
import { eventBus } from '../services/event-bus.js';
import { analyticsService } from '../services/analytics.js';
import { controlService } from '../services/control.js';

export const apiRouter = Router();

// 1. Director & System Status
apiRouter.get('/status', (req: Request, res: Response) => {
  try {
    const status = antigravityBridge.getDirectorStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Agents
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

apiRouter.post('/agents/:id/status', (req: Request, res: Response) => {
  const agentId = String(req.params.id);
  const { status, currentTask } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  antigravityBridge.updateAgentStatus(agentId, status, currentTask);
  res.json({ success: true, agentId, status });
});

// 3. Tasks
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
    'Architect_L3',
    'Argon_L4',
    'Approved'
  ]).default('Director_Triage'),
  isDemo: z.boolean().default(false)
});

apiRouter.post('/tasks', (req: Request, res: Response) => {
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

apiRouter.patch('/tasks/:id', (req: Request, res: Response) => {
  const taskId = String(req.params.id);
  const updated = taskManager.updateTask(taskId, req.body);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json(updated);
});

apiRouter.post('/tasks/:id/restart', (req: Request, res: Response) => {
  const taskId = String(req.params.id);
  const result = taskManager.restartTask(taskId);
  res.json(result);
});

apiRouter.post('/tasks/:id/report', (req: Request, res: Response) => {
  const taskId = String(req.params.id);
  const { report } = req.body;
  if (!report || !report.taskName || !report.status) {
    return res.status(400).json({ error: 'Invalid 9-point report format' });
  }
  const updated = taskManager.submitSubagentReport(taskId, report);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json(updated);
});

// 4. Events
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

apiRouter.post('/events', (req: Request, res: Response) => {
  const { type, source, agent_id, task_id, data } = req.body;
  if (!type) return res.status(400).json({ error: 'Type is required' });
  const event = eventBus.publish({
    type,
    source: source || 'DEMO',
    agent_id,
    task_id,
    data
  });
  res.status(201).json(event);
});

// 5. Analytics
apiRouter.get('/analytics', (req: Request, res: Response) => {
  try {
    const analytics = analyticsService.getModelAnalytics();
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Knowledge Base
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
  const docs = antigravityBridge.getKnowledgeDocs();
  const doc = docs.find(d => d.filename.toLowerCase() === filename.toLowerCase());
  if (!doc) return res.status(404).json({ error: 'Knowledge doc not found' });
  res.json(doc);
});

apiRouter.post('/knowledge/:filename', (req: Request, res: Response) => {
  const filename = String(req.params.filename);
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

// 7. Control Center
apiRouter.get('/control/settings', (req: Request, res: Response) => {
  const settings = controlService.getSettings();
  res.json(settings);
});

apiRouter.post('/control/settings', (req: Request, res: Response) => {
  try {
    const updated = controlService.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/control/escalate-argon', (req: Request, res: Response) => {
  const {
    taskId,
    issueTitle,
    rootCauseHypothesis,
    failedAttempt1,
    failedAttempt2,
    isolatedContextSnippet,
    targetQuestion
  } = req.body;

  if (!issueTitle || !rootCauseHypothesis) {
    return res.status(400).json({ error: 'Issue title and root cause hypothesis are required' });
  }

  const result = controlService.generateArgonEscalationPack({
    taskId,
    issueTitle,
    rootCauseHypothesis,
    failedAttempt1: failedAttempt1 || 'Attempt 1 failed verification tests.',
    failedAttempt2: failedAttempt2 || 'Attempt 2 caused architectural regression.',
    isolatedContextSnippet: isolatedContextSnippet || '// Isolated reproduction code',
    targetQuestion: targetQuestion || 'Provide architectural diagnosis and resolution strategy.'
  });

  res.json(result);
});

apiRouter.post('/control/run-prompt', async (req: Request, res: Response) => {
  const { prompt, agentName, confirm } = req.body;
  if (!confirm) {
    return res.status(400).json({ error: 'Action requires explicit user confirmation' });
  }
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const result = await controlService.executeTaskPrompt(prompt, agentName || 'director');
  res.json(result);
});

// 8. Antigravity CLI live tools
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
