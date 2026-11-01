import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Flame, 
  ArrowRight,
  Activity,
  Plus,
  Terminal,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import type { 
  EscalationItem,
  DirectorStatus, 
  AgentInfo, 
  TaskItem, 
  EventPayload, 
  ModelMetrics,
  DataProvenance
} from '../types.js';
import type { NavTab } from './Sidebar.js';
import { useLanguage } from '../i18n/LanguageContext.js';

interface OverviewProps {
  status: DirectorStatus | null;
  agents: AgentInfo[];
  tasks: TaskItem[];
  events: EventPayload[];
  analytics: {
    tiers: ModelMetrics[];
    totalTokens: { input: number; output: number; cacheRead: number; provenance?: DataProvenance };
    totalRuns: number;
    overallSuccessRate: number;
    escalationRate: number;
    verifiedRealSessionsCount: number;
    provenance?: DataProvenance;
  } | null;
  onNavigate: (tab: NavTab) => void;
  onOpenNewTask: () => void;
  onSelectTask: (task: TaskItem) => void;
  activeEscalations?: EscalationItem[];
  onOpenEscalationModal?: (esc: EscalationItem) => void;
  onCopyEscalationPrompt?: (id: string) => Promise<void>;
}

export const Overview: React.FC<OverviewProps> = ({
  status,
  agents,
  tasks,
  events,
  analytics,
  onNavigate,
  onOpenNewTask,
  onSelectTask,
  activeEscalations = [],
  onOpenEscalationModal,
  onCopyEscalationPrompt
}) => {
  const { t } = useLanguage();

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const escalatedTasks = tasks.filter(t => t.status === 'escalated');
  const activeAgents = agents.filter(a => a.status === 'running');

  const liveSession = status?.activeSessions && status.activeSessions.length > 0
    ? status.activeSessions[0]
    : null;

  const translateStatus = (s: string) => {
    switch (s) {
      case 'completed': return t('overview.status.completed');
      case 'in_progress': return t('overview.status.in_progress');
      case 'escalated': return t('overview.status.escalated');
      case 'failed': return t('overview.status.failed');
      case 'verification': return t('overview.status.verification');
      case 'pending': return t('overview.status.pending');
      default: return s.toUpperCase();
    }
  };

  const translateStage = (stage: string) => {
    switch (stage) {
      case 'Director_Triage': return t('overview.pipelineStages.triage');
      case 'Solo': return t('overview.pipelineStages.solo');
      case 'Specialist': return t('overview.pipelineStages.specialist');
      case 'QualityGate_L1': return t('overview.pipelineStages.qualityGateL1');
      case 'Independent_L2': return t('overview.pipelineStages.independentL2');
      case 'LegalGate': return t('overview.pipelineStages.legalGate');
      case 'Architect_L3': return t('overview.pipelineStages.architectL3');
      case 'Argon_L4': return t('overview.pipelineStages.argonL4');
      case 'Approved': return t('overview.pipelineStages.approved');
      default: return stage;
    }
  };

  const getStatusBadgeClass = (statusStr: string) => {
    switch (statusStr) {
      case 'completed':
        return 'bg-terminal-bg text-terminal-green border-terminal-border';
      case 'in_progress':
        return 'bg-info-bg text-info-text border-info-border';
      case 'escalated':
        return 'bg-argon-bg text-argon-text border-argon-border';
      case 'failed':
        return 'bg-danger-bg text-danger-text border-danger-border';
      case 'verification':
        return 'bg-warning-bg text-warning-text border-warning-border';
      default:
        return 'bg-surface-subtle text-charcoal border-hairline';
    }
  };

  return (
    <div className="space-y-6">
      {/* 0. Top Urgent Alert Banner: Active Argon Escalations */}
      {activeEscalations && activeEscalations.length > 0 && (
        <div className="p-4 sm:p-5 rounded-md bg-gradient-to-r from-danger/10 via-amber-500/10 to-transparent border-2 border-danger/60 shadow-subtle space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold bg-danger text-pure animate-pulse">
                <Flame className="w-4 h-4" />
                {t('overview.urgentEscalationTitle')}
              </span>
              <span className="text-xs font-mono font-semibold text-danger-text uppercase">
                {t('overview.urgentEscalationDetected')} ({activeEscalations.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('escalations')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-obsidian text-pure hover:bg-graphite transition-colors shadow-xs"
              >
                <span>{t('overview.goToEscalations')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {activeEscalations.slice(0, 2).map(esc => (
              <div
                key={esc.id}
                onClick={() => onOpenEscalationModal ? onOpenEscalationModal(esc) : onNavigate('escalations')}
                className="p-3 bg-pure/90 border border-hairline rounded flex items-start justify-between gap-3 cursor-pointer hover:border-danger/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-danger-bg text-danger-text uppercase">
                      {esc.priority}
                    </span>
                    <span className="text-xs font-bold text-obsidian line-clamp-1">
                      {esc.taskTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone line-clamp-1">
                    {esc.reason}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={async () => {
                      if (onCopyEscalationPrompt) {
                        await onCopyEscalationPrompt(esc.id);
                        await navigator.clipboard.writeText(esc.promptPack);
                      }
                    }}
                    className="p-1.5 rounded text-xs font-mono bg-surface border border-hairline hover:bg-surface-subtle"
                    title={t('escalations.copyPrompt')}
                  >
                    <Flame className="w-3.5 h-3.5 text-danger" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Header: Mission Control Telemetry Surface */}
      <section className="bg-pure border border-hairline rounded-md p-5 sm:p-6 shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-live">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
                {t('header.statusOnline')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-surface-subtle text-stone border border-hairline">
                <Cpu className="w-3 h-3 text-graphite" />
                {status?.model || 'Gemini 3.8 Flash High'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-surface-subtle text-stone border border-hairline">
                {t('nav.concurrency')}: {t('nav.concurrencySubagents')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-surface-subtle text-terminal-green border border-hairline">
                {t('nav.boundaryLocal')}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-semibold text-obsidian tracking-tight">
              Antigravity Apex • {t('nav.overview')}
            </h1>
            <p className="text-[13px] text-charcoal leading-relaxed">
              {t('overview.concurrencyLimitDesc')} • {t('overview.retryPolicyDesc')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('workflow')}
              className="refero-btn-secondary"
            >
              <Activity className="w-3.5 h-3.5 text-graphite" />
              <span>{t('nav.workflow')}</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewTask}
              className="refero-btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('tasks.newTask')}</span>
            </button>
          </div>
        </div>

        {/* Live Session Strip & Verified Tokens */}
        {liveSession && (
          <div className="mt-5 pt-4 border-t border-hairline flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 font-mono text-charcoal">
              <span className="text-slate">Session ID:</span>
              <code className="text-obsidian font-semibold bg-surface-subtle px-2 py-0.5 rounded border border-hairline text-[11px]">
                {liveSession.conversationId}
              </code>
              <span className="inline-flex items-center gap-1 text-terminal-green font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
                {t('header.active')}
              </span>
            </div>

            {liveSession.tokenUsage && (
              <div className="flex flex-wrap items-center gap-3 font-mono text-charcoal text-[11px]">
                <span className="text-slate">{t('overview.tokenUsage')}:</span>
                <span>{t('header.inTokens')}: <strong className="text-obsidian font-semibold">{liveSession.tokenUsage.input.toLocaleString()}</strong></span>
                <span className="text-hairline">•</span>
                <span>{t('header.outTokens')}: <strong className="text-obsidian font-semibold">{liveSession.tokenUsage.output.toLocaleString()}</strong></span>
                <span className="text-hairline">•</span>
                <span>{t('overview.cacheRead')}: <strong className="text-obsidian font-semibold">{liveSession.tokenUsage.cacheRead.toLocaleString()}</strong></span>
                <span className="badge-live text-[10px] py-0 px-1.5">TRANSCRIPT.JSONL</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Agents */}
        <div 
          onClick={() => onNavigate('agents')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('agents'); } }}
          className="bg-pure border border-hairline hover:border-ash rounded-md p-4 shadow-subtle cursor-pointer transition-colors group focus-ring"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone">{t('overview.activeAgentsTitle')}</span>
            <div className="w-7 h-7 rounded-md bg-surface-subtle border border-hairline flex items-center justify-center text-charcoal group-hover:text-obsidian transition-colors">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-obsidian tracking-tight">
              {activeAgents.length}
            </span>
            <span className="text-xs text-slate font-mono">
              / {agents.length}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-charcoal pt-3 border-t border-hairline">
            <span>{t('overview.activeAgentsDesc')}</span>
            <ArrowRight className="w-3.5 h-3.5 text-graphite group-hover:text-obsidian transition-colors" />
          </div>
        </div>

        {/* Card 2: Tasks Queue */}
        <div 
          onClick={() => onNavigate('tasks')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('tasks'); } }}
          className="bg-pure border border-hairline hover:border-ash rounded-md p-4 shadow-subtle cursor-pointer transition-colors group focus-ring"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone">{t('overview.pendingTasksTitle')}</span>
            <div className="w-7 h-7 rounded-md bg-surface-subtle border border-hairline flex items-center justify-center text-charcoal group-hover:text-obsidian transition-colors">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-obsidian tracking-tight">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-slate font-mono">
              / {tasks.length}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-charcoal pt-3 border-t border-hairline">
            <span>{t('overview.completedTasksTitle')}: {completedTasks.length}</span>
            <ArrowRight className="w-3.5 h-3.5 text-graphite group-hover:text-obsidian transition-colors" />
          </div>
        </div>

        {/* Card 3: Quality Gates */}
        <div 
          onClick={() => onNavigate('analytics')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('analytics'); } }}
          className="bg-pure border border-hairline hover:border-ash rounded-md p-4 shadow-subtle cursor-pointer transition-colors group focus-ring"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone">{t('overview.successRate')}</span>
            <div className="flex items-center gap-1.5">
              {analytics?.provenance === 'LIVE' || (analytics?.verifiedRealSessionsCount ?? 0) > 0 ? (
                <span className="badge-live text-[10px] py-0 px-1.5">LIVE</span>
              ) : (
                <span className="badge-demo text-[10px] py-0 px-1.5">DEMO</span>
              )}
              <div className="w-7 h-7 rounded-md bg-terminal-bg border border-terminal-border flex items-center justify-center text-terminal-green group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-terminal-green tracking-tight">
              {analytics !== null
                ? `${analytics.overallSuccessRate}%`
                : (tasks.length > 0
                    ? `${Math.round((completedTasks.length / tasks.length) * 100)}%`
                    : '100%')}
            </span>
            <span className="text-xs text-slate font-mono">
              ({analytics?.totalRuns ?? tasks.length} {t('overview.totalRuns').toLowerCase()})
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-charcoal pt-3 border-t border-hairline">
            <span className="text-terminal-green font-medium">L1 / L2 Quality Gate</span>
            <ArrowRight className="w-3.5 h-3.5 text-graphite group-hover:text-obsidian transition-colors" />
          </div>
        </div>

        {/* Card 4: Argon Escalations */}
        <div 
          onClick={() => onNavigate('control')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('control'); } }}
          className="bg-pure border border-hairline hover:border-ash rounded-md p-4 shadow-subtle cursor-pointer transition-colors group focus-ring"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone">{t('overview.escalatedTasksTitle')}</span>
            <div className="w-7 h-7 rounded-md bg-argon-bg border border-argon-border flex items-center justify-center text-argon-text group-hover:scale-105 transition-transform">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-argon-text tracking-tight">
              {escalatedTasks.length}
            </span>
            <span className="text-xs text-slate font-mono">
              {analytics?.escalationRate || 0}%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-charcoal pt-3 border-t border-hairline">
            <span>{t('nav.argonProtocol')}</span>
            <span className="badge-argon text-[10px] py-0 px-1.5">{t('nav.argonProtocolBadge')}</span>
          </div>
        </div>
      </section>

      {/* 3. Main Data Workspace: Tasks Table (2 cols) and Telemetry Feed (1 col) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Pipeline Tasks Data Table */}
        <div className="lg:col-span-2 bg-pure border border-hairline rounded-md p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-obsidian" />
                <h2 className="text-sm font-semibold text-obsidian tracking-tight">
                  {t('tasks.title')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="text-xs text-charcoal hover:text-obsidian font-medium flex items-center gap-1 transition-colors"
              >
                <span>{t('tasks.filterAll')} ({tasks.length})</span>
                <ArrowRight className="w-3 h-3 text-graphite" />
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="py-12 text-center text-slate space-y-2">
                <Clock className="w-8 h-8 mx-auto text-ash" />
                <p className="text-xs">No tasks currently queued.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTask(task); } }}
                    className="p-3 rounded-md bg-pure border border-hairline hover:border-ash hover:bg-surface-subtle transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 focus-ring"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${getStatusBadgeClass(task.status)}`}>
                          {translateStatus(task.status)}
                        </span>

                        <span className="text-xs font-mono font-medium text-obsidian">
                          @{task.assignedAgent}
                        </span>

                        {task.isDemo ? (
                          <span className="badge-demo text-[10px] py-0 px-1.5 font-mono">DEMO</span>
                        ) : (
                          <span className="badge-live text-[10px] py-0 px-1.5 font-mono">LIVE</span>
                        )}
                      </div>

                      <h3 className="text-[13px] font-medium text-obsidian truncate">
                        {task.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-xs">
                      <span className="font-mono text-slate text-[11px] hidden sm:inline">
                        {translateStage(task.stage)}
                      </span>
                      {task.report && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-terminal-bg text-terminal-green border border-terminal-border">
                          <ShieldCheck className="w-3 h-3" />
                          {t('tasks.viewReport')} ✓
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-xs text-slate">
            <span>Recent 5 tasks</span>
            <button
              type="button"
              onClick={onOpenNewTask}
              className="refero-btn-secondary text-xs py-1 px-2.5"
            >
              <Plus className="w-3 h-3" />
              <span>{t('tasks.newTask')}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Events Feed */}
        <div className="bg-pure border border-hairline rounded-md p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-terminal-green" />
                </span>
                <h2 className="text-sm font-semibold text-obsidian tracking-tight">
                  {t('overview.liveEventFeed')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('events')}
                className="text-xs text-charcoal hover:text-obsidian font-medium flex items-center gap-1 transition-colors"
              >
                <span>{t('overview.viewAllEvents')}</span>
                <ArrowRight className="w-3 h-3 text-graphite" />
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="py-12 text-center text-slate space-y-2">
                  <Terminal className="w-8 h-8 mx-auto text-ash" />
                  <p className="text-xs font-mono">Waiting for telemetry events...</p>
                </div>
              ) : (
                events.slice(0, 8).map(evt => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-md bg-surface-subtle border border-hairline text-xs space-y-1 hover:border-ash transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-obsidian truncate">
                        {evt.type}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                        evt.source === 'LIVE_AGY' 
                          ? 'bg-terminal-bg text-terminal-green border-terminal-border' 
                          : 'bg-pure text-slate border-hairline'
                      }`}>
                        {evt.source}
                      </span>
                    </div>

                    {evt.agent_id && (
                      <div className="text-[11px] text-charcoal">
                        Agent: <strong className="text-obsidian font-medium font-mono">@{evt.agent_id}</strong>
                      </div>
                    )}

                    <div className="text-[10px] font-mono text-slate flex justify-between items-center pt-0.5">
                      <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      {evt.task_id && <span className="truncate max-w-[120px] text-graphite">{evt.task_id}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-hairline text-[11px] font-mono text-slate flex justify-between items-center">
            <span>Bus: WebSocket Online</span>
            <span>{events.length} buffered</span>
          </div>
        </div>
      </section>
    </div>
  );
};
