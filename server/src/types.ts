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
  | 'escalation.created'
  | 'escalation.updated'
  | 'escalation.prompt_copied'
  | 'escalation.sent'
  | 'escalation.resolved'
  | 'escalation.rejected'
  | 'quality_gate.passed'
  | 'quality_gate.failed'
  | 'legal_gate.passed'
  | 'legal_gate.blocked'
  | 'legal_gate.warning';

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
  | 'LegalGate'
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

export type DataProvenance = 'LIVE' | 'ESTIMATED' | 'DEMO' | 'UNKNOWN';

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
  provenance: DataProvenance;
}

export interface SessionTokenUsage {
  conversation_id: string;
  file_path: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  model_tier: string;
  step_count: number;
  last_updated: string;
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

export type ProcessState = 'QUEUED' | 'STARTING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';

export interface ManagedProcess {
  taskId: string;
  pid: number | null;
  agentName: string;
  prompt: string;
  state: ProcessState;
  queuedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  error: string | null;
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

export type LegalRiskLevel = 'GREEN' | 'AMBER' | 'RED' | 'UNKNOWN';
export type LegalGateStatus = 'APPROVED' | 'BLOCKED_RED' | 'NEEDS_REVIEW_AMBER' | 'INSUFFICIENT_DATA_UNKNOWN';
export type JurisdictionType = 'RU' | 'EU_NL' | 'DUAL_RU_EU' | 'OTHER' | 'UNKNOWN';

export interface JurisdictionCriteria {
  entityLocation?: string;        // 1. Место регистрации компании-разработчика / оператора
  founderCitizenship?: string;    // 2. Гражданство / резидентство основателей / разработчиков
  serverDbLocation?: string;      // 3. Расположение серверов и баз данных
  targetAudience?: string;        // 4. Целевая аудитория (язык, доменные зоны)
  paymentMethods?: string;        // 5. Способы оплаты (МИР/СБП/рубли vs Stripe/iDEAL/SEPA)
  regulatoryRegistries?: string;  // 6. Регистрация в реестрах (ОРИ, реестр ПО Минцифры, KvK)
  distributionChannels?: string;  // 7. Каналы дистрибуции (RuStore, App Store, Telegram Mini Apps)
  thirdPartyServices?: string;    // 8. Сторонние сервисы (Яндекс.Метрика vs Google Analytics, Yandex GPT vs Gemini/OpenAI)
  applicableLawClause?: string;   // 9. Применимое право в ToS
  advertisingTerritory?: string;  // 10. Территория распространения рекламы
}

export interface TriggerEvaluationResult {
  triggered: boolean;
  jurisdiction: JurisdictionType;
  riskCategory?: 'PERSONAL_DATA' | 'AI_REGULATION' | 'LICENSING' | 'SCRAPING' | 'COMMERCIAL_RELEASE' | 'AUTOMATED_DECISION' | 'ECOMMERCE' | 'ADVERTISING' | 'CONTENT_PLATFORM';
  reasons: string[];
  recommendedAction: string;
  safeScopeCanProceed?: boolean;
}

export interface LegalOfficialSource {
  name: string;
  url: string;
  checkedDate: string;
  inForceDate: string;
}

export interface LegalAssessment {
  projectAndFeature: string;
  jurisdiction: string;
  applicableNorms: string[];
  identifiedRisks: string[];
  riskLevel: LegalRiskLevel;
  officialSources: LegalOfficialSource[];
  mechanismOfNonCompliance?: string;
  potentialConsequences?: string;
  recommendedRemediation?: string;
  humanCounselRequirement: 'YES' | 'NO' | 'RECOMMENDED';
  verdict: LegalGateStatus;
  safeScopeCanProceed?: boolean;
}

export type EscalationStatus =
  | 'DETECTED'
  | 'PROMPT_READY'
  | 'AWAITING_USER'
  | 'COPIED'
  | 'SENT_TO_ARGON'
  | 'AWAITING_RESULT'
  | 'RESULT_RECEIVED'
  | 'IN_REVIEW'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type EscalationPriority = 'critical' | 'high' | 'medium';
export type SensitivitySetting = 'conservative' | 'balanced' | 'aggressive';

export interface EscalationEvidence {
  errorLogs?: string[];
  failingChecks?: string[];
  conflictingReports?: SubagentReport[];
  codeSnippets?: { file: string; lineRange?: string; snippet: string }[];
  environmentInfo?: Record<string, any>;
  attemptSummaries?: { attemptNumber: number; agent: string; hypothesis: string; failureReason: string }[];
}

export interface EscalationItem {
  id: string;
  taskId: string;
  taskTitle: string;
  reason: string;
  priority: EscalationPriority;
  status: EscalationStatus;
  attemptsCount: number;
  involvedAgents: string[];
  failureSignatures: string[];
  evidence: EscalationEvidence;
  promptPack: string;
  argonResponse?: string;
  directorAnalysis?: string;
  createdAt: string;
  updatedAt: string;
  copiedAt?: string;
  sentAt?: string;
  completedAt?: string;
}

export interface EscalationStats {
  total: number;
  activeCount: number;
  awaitingUserCount: number;
  inReviewCount: number;
  resolvedCount: number;
  rejectedCount: number;
  byPriority: Record<EscalationPriority, number>;
}
