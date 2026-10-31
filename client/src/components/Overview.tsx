import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Flame, 
  ArrowRight,
  Activity,
  Sparkles
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

  const liveSession = status?.activeSessions[0];

  const translateStatus = (s: string) => {
    switch (s) {
      case 'completed': return 'ЗАВЕРШЕНО';
      case 'in_progress': return 'В РАБОТЕ';
      case 'escalated': return 'ЭСКАЛИРОВАНО';
      case 'failed': return 'ОШИБКА';
      case 'verification': return 'ПРОВЕРКА';
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
      case 'Architect_L3': return 'Senior Architect (L3)';
      case 'Argon_L4': return 'Gemini 4 Argon (L4)';
      case 'Approved': return 'Утверждено';
      default: return stage;
    }
  };

  return (
    <div className="space-y-6">
      {/* Верхний баннер: Статус Director и контекст сессии Antigravity */}
      <div className="relative overflow-hidden rounded-3xl p-6 glass-panel border border-white/[0.12] bg-gradient-to-r from-surface-card via-surface-panel to-surface-card shadow-glass-card">
        <div className="absolute top-0 right-0 w-96 h-96 bg-director-blue/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-director-violet/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="badge-live">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ОРКЕСТРАТОР В СЕТИ
              </span>
              <span className="text-xs font-mono text-slate-400 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/5">
                Модель: Gemini 3.8 Flash High
              </span>
              <span className="text-xs font-mono text-slate-400 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/5">
                Макс. параллелизм: 3 специалиста
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              Центр управления AI Development Director
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Телеметрия в реальном времени и оперативный надзор над мультиагентной иерархией Antigravity. 
              Обеспечивает многоступенчатые шлюзы качества, 9-пунктную верификацию субагентов и строгую эскалацию к Argon 4-го уровня.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('workflow')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold border border-white/10 transition-all shadow-glass-subtle"
            >
              <Activity className="w-4 h-4 text-director-cyan" />
              <span>Схема процессов</span>
            </button>
            <button
              onClick={onOpenNewTask}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-director-blue to-blue-600 hover:from-blue-500 hover:to-director-blue text-white text-xs font-semibold shadow-glass-card transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Запустить задачу</span>
            </button>
          </div>
        </div>

        {/* Полоса активной сессии */}
        {liveSession && (
          <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-400">
              <span className="text-slate-500">ID активной сессии:</span>
              <span className="text-director-cyan bg-black/40 px-2 py-0.5 rounded border border-white/5">
                {liveSession.conversationId}
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Блокировка активна
              </span>
            </div>

            {liveSession.tokenUsage && (
              <div className="flex items-center gap-4 font-mono text-slate-300">
                <span className="text-slate-500">Подтверждённые токены:</span>
                <span>Вход: <strong className="text-white">{(liveSession.tokenUsage.input).toLocaleString()}</strong></span>
                <span>•</span>
                <span>Выход: <strong className="text-white">{(liveSession.tokenUsage.output).toLocaleString()}</strong></span>
                <span>•</span>
                <span>Кэш: <strong className="text-director-cyan">{(liveSession.tokenUsage.cacheRead).toLocaleString()}</strong></span>
                <span className="badge-live text-[10px] py-0 px-1.5">TRANSCRIPT.JSONL</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Сетка KPI карточек */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Карточка 1: Активные агенты */}
        <div 
          onClick={() => onNavigate('agents')}
          className="glass-card p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Специалисты</span>
            <div className="p-2 rounded-xl bg-director-blue/10 text-director-blue group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {activeAgents.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {agents.length} зарегистрировано
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            <span>В пуле: {agents.filter(a => a.enabled).length} активно</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Карточка 2: Задачи в работе */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="glass-card p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Задачи в работе</span>
            <div className="p-2 rounded-xl bg-director-cyan/10 text-director-cyan group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              активных ({tasks.length} всего)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            <span>Завершено: {completedTasks.length}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Карточка 3: Успешность шлюзов качества */}
        <div 
          onClick={() => onNavigate('analytics')}
          className="glass-card p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Шлюзы качества</span>
            <div className="flex items-center gap-2">
              {analytics?.provenance === 'LIVE' || (analytics?.verifiedRealSessionsCount ?? 0) > 0 ? (
                <span className="badge-live text-[10px] py-0 px-1.5 font-mono">LIVE</span>
              ) : (
                <span className="badge-demo text-[10px] py-0 px-1.5 font-mono">DEMO</span>
              )}
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {analytics !== null
                ? `${analytics.overallSuccessRate}%`
                : (tasks.length > 0
                    ? `${Math.round((completedTasks.length / tasks.length) * 100)}%`
                    : '100%')}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({analytics?.totalRuns ?? tasks.length} запусков)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            <span className="text-emerald-400 font-medium">9-п. протокол проверен</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Карточка 4: Эскалации к Argon */}
        <div 
          onClick={() => onNavigate('control')}
          className="glass-card p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Эскалации (L3 / L4)</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-director-argon group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-pink-400">
              {escalatedTasks.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              доля: {analytics?.escalationRate || 0}%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            <span>Argon готов</span>
            <span className="badge-argon text-[10px] py-0 px-1.5">ПРОТОКОЛ L4</span>
          </div>
        </div>
      </div>

      {/* Основная сетка: Задачи слева, Живой поток справа */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левые 2 колонки: Активные задачи */}
        <div className="lg:col-span-2 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-director-blue" />
              <h3 className="text-sm font-semibold text-white">Активные задачи и пайплайн</h3>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-director-cyan hover:underline flex items-center gap-1"
            >
              <span>Смотреть все ({tasks.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks.slice(0, 5).map(task => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-3.5 rounded-xl bg-surface-card hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      task.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : task.status === 'in_progress'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : task.status === 'escalated'
                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {translateStatus(task.status)}
                    </span>

                    <span className="text-xs font-mono text-director-cyan">
                      [@{task.assignedAgent}]
                    </span>

                    {task.isDemo ? (
                      <span className="badge-demo text-[10px] py-0 px-1.5">ДЕМО</span>
                    ) : (
                      <span className="badge-live text-[10px] py-0 px-1.5">LIVE</span>
                    )}
                  </div>

                  <h4 className="text-xs font-medium text-slate-200">
                    {task.title}
                  </h4>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="font-mono text-slate-400 text-[11px]">
                    Стадия: <strong className="text-slate-300 font-normal">{translateStage(task.stage)}</strong>
                  </span>
                  {task.report && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      9-п. отчёт ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Правая колонка: Живой поток событий */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <h3 className="text-sm font-semibold text-white">Живой поток событий</h3>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs text-director-cyan hover:underline flex items-center gap-1"
            >
              <span>Журнал</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Ожидание входящей телеметрии Antigravity...
              </p>
            ) : (
              events.slice(0, 8).map(evt => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-black/30 border border-white/[0.05] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-director-cyan">
                      {evt.type}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      evt.source === 'LIVE_AGY' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {evt.source}
                    </span>
                  </div>

                  {evt.agent_id && (
                    <div className="text-[11px] text-slate-400">
                      Агент: <strong className="text-slate-200 font-medium">@{evt.agent_id}</strong>
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    {evt.task_id && <span className="truncate max-w-[120px]">{evt.task_id}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
