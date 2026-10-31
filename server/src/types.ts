export type AgentStatus = 'idle' | 'running' | 'paused' | 'blocked' | 'escalated';

export type ModelTier = 'gemini-3.8-flash-high' | 'gemini-3.8-flash-medium' | 'gemini-3.8-flash-low' | 'pro' | 'gemini-4-argon-high' | 'inherit' | 'flash' | 'flash_lite';

export interface SubagentReport {
  taskName: string;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  summary: string;
  modifiedFiles: string[];
  executedChecks: string[];
  checkResults: string;
  issuesAndRisks: string;
  pendingItems: string;
  nextSteps: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  domain: string;
  model: ModelTier | string;
  status: AgentStatus;
  currentTask?: string;
  promptContent?: string;
  lastReport?: SubagentReport;
  successRate: number;
  runCount: number;
  enabled: boolean;
  isDirector?: boolean;
}

export type EventType =
  | 'agent.started'
  | 'agent.completed'
  | 'agent.failed'
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'task.rejected'
  | 'escalation.requested'
  | 'escalation.resolved'
  | 'quality_gate.passed'
  | 'quality_gate.failed';

export type EventSource = 'LIVE_AGY' | 'INTERNAL_BRIDGE' | 'SYSTEM' | 'DEMO';

export interface EventPayload {
  id: string;
  timestamp: string;
  project_id: string;
  task_id?: string;
  agent_id?: string;
  type: EventType;
  source: EventSource;
  data: Record<string, any>;
}

export type TaskStatus = 'pending' | 'in_progress' | 'verification' | 'completed' | 'failed' | 'escalated';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type WorkflowStage =
  | 'Director_Triage'
  | 'Solo'
  | 'Specialist'
  | 'QualityGate_L1'
  | 'Independent_L2'
  | 'Architect_L3'
  | 'Argon_L4'
  | 'Approved';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgent: string;
  stage: WorkflowStage;
  createdAt: string;
  updatedAt: string;
  report?: SubagentReport;
  retryCount: number;
  maxRetries: number;
  isDemo: boolean;
  resultSummary?: string;
  errorLog?: string;
}

export interface KnowledgeDoc {
  filename: string;
  path: string;
  title: string;
  content: string;
  lastModified: string;
  size: number;
}

export interface ModelMetrics {
  tier: string;
  displayName: string;
  runsCount: number;
  tasksCompleted: number;
  successRate: number;
  escalationCount: number;
  inputTokens: number;
  outputTokens: number;
  isEstimate: boolean;
}

export interface DirectorStatus {
  state: 'ONLINE' | 'ACTIVE' | 'ORCHESTRATING' | 'ESCALATED';
  model: string;
  activeSubagentsCount: number;
  maxSubagents: number;
  activeSessions: {
    conversationId: string;
    lastSeen: string;
    isLive: boolean;
    tokenUsage?: {
      input: number;
      output: number;
      cacheRead: number;
    };
  }[];
  agyCliAvailable: boolean;
  knowledgeBaseConnected: boolean;
  activeLocksCount: number;
  liveTranscriptsCount: number;
}

export interface ControlSettings {
  maxConcurrentAgents: number;
  maxRetryAttempts: number;
  defaultModelTier: string;
  escalationPolicy: 'strict' | 'relaxed';
  autoQualityGates: boolean;
  allowedAgents: string[];
}

export interface LogParseState {
  file_path: string;
  conversation_id: string;
  last_offset: number;
  last_line_number: number;
  file_size: number;
  file_inode: string | null;
  file_birthtime_ms: number;
  file_mtime_ms: number;
  last_parsed_at: string;
  status: 'ACTIVE' | 'ROTATED' | 'ERROR' | 'IDLE';
  error_count: number;
  last_error: string | null;
}

export interface IngestionMetrics {
  totalEnqueued: number;
  totalProcessed: number;
  totalLinesParsed: number;
  totalEventsInserted: number;
  totalBytesRead: number;
  totalErrors: number;
  busyRetries: number;
  queueLength: number;
  activeWorkers: number;
  lastProcessedAt: string | null;
}
