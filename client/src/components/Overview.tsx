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
  DirectorStatus, 
  AgentInfo, 
  TaskItem, 
  EventPayload, 
  ModelMetrics,
  DataProvenance
} from '../types.js';
import type { NavTab } from './Sidebar.js';

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
}

export const Overview: React.FC<OverviewProps> = ({
  status,
  agents,
  tasks,
  events,
  analytics,
  onNavigate,
  onOpenNewTask,
  onSelectTask
}) => {
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const escalatedTasks = tasks.filter(t => t.status === 'escalated');
  const activeAgents = agents.filter(a => a.status === 'running');

  const liveSession = status?.activeSessions && status.activeSessions.length > 0
    ? status.activeSessions[0]
    : null;

  const translateStatus = (s: string) => {
    switch (s) {
      case 'completed': return 'ЗАВЕРШЕНО';
      case 'in_progress': return 'В РАБОТЕ';
      case 'escalated': return 'ЭСКАЛАЦИЯ L4';
      case 'failed': return 'СБОЙ';
      case 'verification': return 'ВЕРИФИКАЦИЯ';
      case 'pending': return 'В ОЧЕРЕДИ';
      default: return s.toUpperCase();
    }
  };

  const translateStage = (stage: string) => {
    switch (stage) {
      case 'Director_Triage': return 'Триаж Директора';
      case 'Solo': return 'Соло-выполнение';
      case 'Specialist': return 'Специалист';
      case 'QualityGate_L1': return 'Шлюз качества L1';
      case 'Independent_L2': return 'Независимый аудит L2';
      case 'LegalGate': return 'Шлюз 2b: Юрист & комплаенс';
      case 'Architect_L3': return 'Senior Architect (L3)';
      case 'Argon_L4': return 'Gemini 4 Argon (L4)';
      case 'Approved': return 'Утверждено';
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
      {/* 1. Header: Mission Control Telemetry Surface */}
      <section className="bg-pure border border-hairline rounded-md p-5 sm:p-6 shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-live">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
                ОРКЕСТРАТОР В СЕТИ
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-surface-subtle text-stone border border-hairline">
                <Cpu className="w-3 h-3 text-graphite" />
                Gemini 3.8 Flash High
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-surface-subtle text-stone border border-hairline">
                Макс. параллелизм: 6 subagents
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-surface-subtle text-terminal-green border border-hairline">
                Localhost Boundary
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-semibold text-obsidian tracking-tight">
              AI Command Center • Mission Control
            </h1>
            <p className="text-[13px] text-charcoal leading-relaxed">
              Оперативный контроль мультиагентной системы Antigravity. Многоступенчатые шлюзы качества (L1–L4), 
              автономный триаж Директора, предпусковой Legal Gate (Gate 2b) и протокол ручной эскалации к Gemini 4 Argon.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('workflow')}
              className="refero-btn-secondary"
            >
              <Activity className="w-3.5 h-3.5 text-graphite" />
              <span>Схема процессов</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewTask}
              className="refero-btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать задачу</span>
            </button>
          </div>
        </div>

        {/* Полоса активной сессии и подтверждённых токенов */}
        {liveSession && (
          <div className="mt-5 pt-4 border-t border-hairline flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 font-mono text-charcoal">
              <span className="text-slate">ID активной сессии:</span>
              <code className="text-obsidian font-semibold bg-surface-subtle px-2 py-0.5 rounded border border-hairline text-[11px]">
                {liveSession.conversationId}
              </code>
              <span className="inline-flex items-center gap-1 text-terminal-green font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
                Сессионный лок активен
              </span>
            </div>

            {liveSession.tokenUsage && (
              <div className="flex flex-wrap items-center gap-3 font-mono text-charcoal text-[11px]">
                <span className="text-slate">Подтверждённые токены:</span>
                <span>Вход: <strong className="text-obsidian font-semibold">{liveSession.tokenUsage.input.toLocaleString()}</strong></span>
                <span className="text-hairline">•</span>
                <span>Выход: <strong className="text-obsidian font-semibold">{liveSession.tokenUsage.output.toLocaleString()}</strong></span>
                <span className="text-hairline">•</span>
                <span>Кэш: <strong className="text-obsidian font-semibold">{liveSession.tokenUsage.cacheRead.toLocaleString()}</strong></span>
                <span className="badge-live text-[10px] py-0 px-1.5">TRANSCRIPT.JSONL</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. KPI Cards Grid: Pure White, Hairline Borders, Geist Mono Values */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Карточка 1: Активные агенты */}
        <div 
          onClick={() => onNavigate('agents')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('agents'); } }}
          className="bg-pure border border-hairline hover:border-ash rounded-md p-4 shadow-subtle cursor-pointer transition-colors group focus-ring"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone">Специалисты команды</span>
            <div className="w-7 h-7 rounded-md bg-surface-subtle border border-hairline flex items-center justify-center text-charcoal group-hover:text-obsidian transition-colors">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-obsidian tracking-tight">
              {activeAgents.length}
            </span>
            <span className="text-xs text-slate font-mono">
              / {agents.length} зарегистрировано
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-charcoal pt-3 border-t border-hairline">
            <span>В пуле: {agents.filter(a => a.enabled).length} активно</span>
            <ArrowRight className="w-3.5 h-3.5 text-graphite group-hover:text-obsidian transition-colors" />
          </div>
        </div>

        {/* Карточка 2: Задачи в работе */}
        <div 
          onClick={() => onNavigate('tasks')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('tasks'); } }}
          className="bg-pure border border-hairline hover:border-ash rounded-md p-4 shadow-subtle cursor-pointer transition-colors group focus-ring"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone">Задачи в работе</span>
            <div className="w-7 h-7 rounded-md bg-surface-subtle border border-hairline flex items-center justify-center text-charcoal group-hover:text-obsidian transition-colors">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-obsidian tracking-tight">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-slate font-mono">
              активных ({tasks.length} всего)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-charcoal pt-3 border-t border-hairline">
            <span>Завершено: {completedTasks.length}</span>
            <ArrowRight className="w-3.5 h-3.5 text-graphite group-hover:text-obsidian transition-colors" />
          </div>
        </div>

        {/* Карточка 3: Шлюзы качества */}
        <div 
          onClick={() => onNavigate('analytics')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('analytics'); } }}
          className="bg-pure border border-hairline hover:border-ash rounded-md p-4 shadow-subtle cursor-pointer transition-colors group focus-ring"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone">Шлюзы качества</span>
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
              ({analytics?.totalRuns ?? tasks.length} запусков)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-charcoal pt-3 border-t border-hairline">
            <span className="text-terminal-green font-medium">9-п. протокол верифицирован</span>
            <ArrowRight className="w-3.5 h-3.5 text-graphite group-hover:text-obsidian transition-colors" />
          </div>
        </div>

        {/* Карточка 4: Эскалации к Argon */}
        <div 
          onClick={() => onNavigate('control')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('control'); } }}
          className="bg-pure border border-hairline hover:border-ash rounded-md p-4 shadow-subtle cursor-pointer transition-colors group focus-ring"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone">Эскалации (L3 / L4)</span>
            <div className="w-7 h-7 rounded-md bg-argon-bg border border-argon-border flex items-center justify-center text-argon-text group-hover:scale-105 transition-transform">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-argon-text tracking-tight">
              {escalatedTasks.length}
            </span>
            <span className="text-xs text-slate font-mono">
              доля: {analytics?.escalationRate || 0}%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-charcoal pt-3 border-t border-hairline">
            <span>Argon L4 готов</span>
            <span className="badge-argon text-[10px] py-0 px-1.5">ПРОТОКОЛ L4</span>
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
                  Недавние задачи и пайплайн
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="text-xs text-charcoal hover:text-obsidian font-medium flex items-center gap-1 transition-colors"
              >
                <span>Все задачи ({tasks.length})</span>
                <ArrowRight className="w-3 h-3 text-graphite" />
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="py-12 text-center text-slate space-y-2">
                <Clock className="w-8 h-8 mx-auto text-ash" />
                <p className="text-xs">Очередь задач пуста. Создайте новую задачу для запуска.</p>
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
                          9-п. отчёт ✓
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-xs text-slate">
            <span>Отображаются последние 5 задач</span>
            <button
              type="button"
              onClick={onOpenNewTask}
              className="refero-btn-secondary text-xs py-1 px-2.5"
            >
              <Plus className="w-3 h-3" />
              <span>Добавить задачу</span>
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
                  Поток телеметрии
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('events')}
                className="text-xs text-charcoal hover:text-obsidian font-medium flex items-center gap-1 transition-colors"
              >
                <span>Журнал</span>
                <ArrowRight className="w-3 h-3 text-graphite" />
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="py-12 text-center text-slate space-y-2">
                  <Terminal className="w-8 h-8 mx-auto text-ash" />
                  <p className="text-xs font-mono">Ожидание входящих событий шины...</p>
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
                        Агент: <strong className="text-obsidian font-medium font-mono">@{evt.agent_id}</strong>
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
            <span>Шина: WebSocket Online</span>
            <span>{events.length} событий в буфере</span>
          </div>
        </div>
      </section>
    </div>
  );
};
