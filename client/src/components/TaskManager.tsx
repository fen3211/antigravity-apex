import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckSquare, 
  Plus, 
  RotateCcw, 
  FileText, 
  AlertTriangle, 
  Flame, 
  Search,
  Play,
  Square,
  Activity
} from 'lucide-react';
import { api, eventStream } from '../services/api.js';
import { useToast } from './Toast.js';
import { ArgonVerdictModal } from './Modals/ArgonVerdictModal.js';
import type { TaskItem, ManagedProcess, TaskStatus, TaskPriority } from '../types.js';

interface TaskManagerProps {
  tasks: TaskItem[];
  onOpenNewTask: () => void;
  onRestartTask: (taskId: string) => void;
  onViewReport: (task: TaskItem) => void;
  onSelectTask: (task: TaskItem) => void;
  onRefreshTasks?: () => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onOpenNewTask,
  onRestartTask,
  onViewReport,
  onSelectTask,
  onRefreshTasks
}) => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [processes, setProcesses] = useState<Record<string, ManagedProcess>>({});
  const [executingTaskIds, setExecutingTaskIds] = useState<Set<string>>(new Set());
  const [cancellingTaskIds, setCancellingTaskIds] = useState<Set<string>>(new Set());
  const [argonModalTask, setArgonModalTask] = useState<TaskItem | null>(null);

  // Загрузка активных процессов супервизора
  const refreshProcesses = useCallback(async () => {
    try {
      const list = await api.getAllProcesses();
      const map: Record<string, ManagedProcess> = {};
      list.forEach(p => {
        map[p.taskId] = p;
      });
      setProcesses(map);
    } catch {
      // Игнорируем сетевые сбои
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const pollProcesses = async () => {
      try {
        const list = await api.getAllProcesses();
        if (isMounted) {
          const map: Record<string, ManagedProcess> = {};
          list.forEach(p => {
            map[p.taskId] = p;
          });
          setProcesses(map);
        }
      } catch {
        // ignore
      }
    };

    pollProcesses();
    const interval = setInterval(pollProcesses, 3000);

    const unsubscribe = eventStream.subscribe((event) => {
      if (event.type.startsWith('task.') || event.type.startsWith('escalation.')) {
        pollProcesses();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Запуск задачи в CLI через супервизор
  const handleExecuteInCli = async (task: TaskItem) => {
    setExecutingTaskIds(prev => new Set(prev).add(task.id));
    try {
      const res = await api.executeTask(task.id);
      if (res.success) {
        toast.success(`Задача "${task.title}" запущена в CLI супервизоре`, 'CLI запущен');
        await refreshProcesses();
        onRefreshTasks?.();
      } else {
        toast.error('Не удалось запустить процесс в CLI супервизоре', 'Ошибка запуска');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка выполнения задачи в CLI';
      toast.error(msg, 'Сбой CLI');
    } finally {
      setExecutingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  // Отмена процесса задачи
  const handleCancelTask = async (task: TaskItem) => {
    setCancellingTaskIds(prev => new Set(prev).add(task.id));
    try {
      const res = await api.cancelTask(task.id);
      if (res.success) {
        toast.warning(`Процесс задачи "${task.title}" остановлен`, 'Отмена');
        await refreshProcesses();
        onRefreshTasks?.();
      } else {
        toast.error('Не удалось отменить процесс', 'Ошибка отмены');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка отмены процесса';
      toast.error(msg, 'Сбой');
    } finally {
      setCancellingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedAgent.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const translateStatus = (s: TaskStatus) => {
    switch (s) {
      case 'completed': return 'ЗАВЕРШЕНО';
      case 'in_progress': return 'В РАБОТЕ';
      case 'escalated': return 'ЭСКАЛИРОВАНО';
      case 'failed': return 'СБОЙ';
      case 'verification': return 'ПРОВЕРКА';
      case 'pending': return 'В ОЧЕРЕДИ';
      default: return s;
    }
  };

  const translatePriority = (p: TaskPriority) => {
    switch (p) {
      case 'critical': return 'КРИТИЧЕСКИЙ';
      case 'high': return 'ВЫСОКИЙ';
      case 'medium': return 'СРЕДНИЙ';
      case 'low': return 'НИЗКИЙ';
      default: return p;
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

  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
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

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-danger-bg text-danger-text border-danger-border font-semibold';
      case 'high':
        return 'bg-warning-bg text-warning-text border-warning-border font-medium';
      case 'medium':
        return 'bg-surface-subtle text-charcoal border-hairline';
      case 'low':
        return 'bg-surface-subtle text-stone border-hairline';
      default:
        return 'bg-surface-subtle text-charcoal border-hairline';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Action */}
      <section className="bg-pure border border-hairline rounded-md p-4 sm:p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-obsidian" />
            <h1 className="text-lg font-semibold text-obsidian tracking-tight">
              Очередь задач и TaskProcessSupervisor
            </h1>
          </div>
          <p className="text-[13px] text-charcoal mt-1 leading-relaxed">
            Мониторинг жизненного цикла задач, исполнение в CLI agy, история делегирования и замкнутый цикл эскалации к Argon.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewTask}
          className="refero-btn-primary self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Создать задачу</span>
        </button>
      </section>

      {/* 2. Filters & Search Bar */}
      <section className="bg-pure border border-hairline rounded-md p-3.5 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-graphite absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск по названию, исполнителю или ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke focus-ring"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
          >
            <option value="all">Все статусы</option>
            <option value="pending">В очереди</option>
            <option value="in_progress">В работе</option>
            <option value="verification">На проверке</option>
            <option value="completed">Завершено</option>
            <option value="escalated">Эскалировано (Argon L4)</option>
            <option value="failed">Сбой</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
          >
            <option value="all">Все приоритеты</option>
            <option value="critical">Критический</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate">
          Отображено <strong className="text-obsidian font-semibold">{filteredTasks.length}</strong> из {tasks.length} задач
        </div>
      </section>

      {/* 3. Task List Cards */}
      <section className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-pure border border-hairline rounded-md p-12 text-center text-slate space-y-2">
            <CheckSquare className="w-8 h-8 mx-auto text-ash" />
            <p className="text-[13px]">Нет задач, соответствующих выбранным критериям.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isInProgress = task.status === 'in_progress';
            const isArgonStage = task.stage === 'Argon_L4';

            const proc = processes[task.id];
            const isProcActive = proc && (proc.state === 'RUNNING' || proc.state === 'STARTING' || proc.state === 'QUEUED');
            const isExecuting = executingTaskIds.has(task.id);
            const isCancelling = cancellingTaskIds.has(task.id);

            return (
              <div
                key={task.id}
                className={`bg-pure border rounded-md p-4 sm:p-5 shadow-subtle hover:border-ash transition-all space-y-3.5 ${
                  isArgonStage ? 'border-argon-border ring-1 ring-argon-border/50' : 'border-hairline'
                }`}
              >
                {/* Task Header: Badges & Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pill */}
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium uppercase border ${getStatusBadgeClass(task.status)}`}>
                      {translateStatus(task.status)}
                    </span>

                    {/* CLI Running Indicator */}
                    {isProcActive && (
                      <span className="badge-live text-[10px] py-0.5 px-2 font-mono flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-terminal-green animate-pulse" />
                        <span>CLI RUNNING {proc?.pid ? `(PID ${proc.pid})` : ''}</span>
                      </span>
                    )}

                    {/* Priority Pill */}
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getPriorityBadgeClass(task.priority)}`}>
                      {translatePriority(task.priority)}
                    </span>

                    {/* Agent Assignment */}
                    <span className="text-xs font-mono font-medium text-obsidian">
                      Исполнитель: @{task.assignedAgent}
                    </span>

                    {/* Stage Name */}
                    <span className="text-xs font-mono text-stone hidden md:inline">
                      Стадия: {translateStage(task.stage)}
                    </span>

                    {/* Provenance */}
                    {task.isDemo ? (
                      <span className="badge-demo text-[9px] py-0 px-1.5 font-mono">DEMO</span>
                    ) : (
                      <span className="badge-live text-[9px] py-0 px-1.5 font-mono">LIVE</span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate">
                    Обновлено: {new Date(task.updatedAt).toLocaleTimeString()}
                  </div>
                </div>

                {/* Title and Description */}
                <div>
                  <h2 
                    onClick={() => onSelectTask(task)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTask(task); } }}
                    className="text-sm font-semibold text-obsidian hover:underline cursor-pointer transition-colors"
                  >
                    {task.title}
                  </h2>
                  {task.description && (
                    <p className="text-[13px] text-charcoal mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Error Log / Escalation Info (if any) */}
                {task.errorLog && (
                  <div className="p-3 rounded-md bg-danger-bg border border-danger-border text-xs text-danger-text font-mono space-y-1">
                    <span className="text-[10px] uppercase font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Причина сбоя / статус эскалации:
                    </span>
                    <p className="line-clamp-2">{task.errorLog}</p>
                  </div>
                )}

                {/* Task Footer: Retries & Action Buttons */}
                <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 font-mono text-stone text-[11px]">
                    <span>
                      Попытки: <strong className={task.retryCount >= task.maxRetries ? 'text-danger-text font-bold' : 'text-obsidian'}>
                        {task.retryCount}/{task.maxRetries}
                      </strong>
                    </span>
                    {task.retryCount >= task.maxRetries && (
                      <span className="text-danger-text font-semibold flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        Лимит попыток исчерпан (Эскалация активна)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Enter Argon Verdict (Argon_L4 Stage) */}
                    {isArgonStage && (
                      <button
                        type="button"
                        onClick={() => setArgonModalTask(task)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-argon-bg text-argon-text border border-argon-border hover:bg-argon-border/40 transition-colors focus-ring"
                      >
                        <Flame className="w-3.5 h-3.5 text-argon-text animate-pulse" />
                        <span>Ввести вердикт Аргона</span>
                      </button>
                    )}

                    {/* Stop / Cancel CLI Process */}
                    {(isProcActive || isInProgress) && (
                      <button
                        type="button"
                        onClick={() => handleCancelTask(task)}
                        disabled={isCancelling}
                        className="refero-btn-danger text-xs py-1 px-2.5"
                        title="Остановить процесс супервизора"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>{isCancelling ? 'Отмена...' : 'Остановить CLI'}</span>
                      </button>
                    )}

                    {/* Execute in CLI */}
                    {!isProcActive && !isInProgress && (
                      <button
                        type="button"
                        onClick={() => handleExecuteInCli(task)}
                        disabled={isExecuting}
                        className="refero-btn-primary text-xs py-1 px-2.5"
                        title="Запустить выполнение задачи в CLI супервизоре"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{isExecuting ? 'Запуск...' : 'Запустить в CLI'}</span>
                      </button>
                    )}

                    {/* Restart Task */}
                    <button
                      type="button"
                      onClick={() => onRestartTask(task.id)}
                      className="refero-btn-secondary text-xs py-1 px-2.5"
                      title="Перезапустить задачу"
                    >
                      <RotateCcw className="w-3 h-3 text-graphite" />
                      <span>Перезапуск</span>
                    </button>

                    {/* View 9-point report */}
                    {task.report && (
                      <button
                        type="button"
                        onClick={() => onViewReport(task)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-terminal-bg text-terminal-green border border-terminal-border hover:bg-terminal-border/40 transition-colors focus-ring"
                      >
                        <FileText className="w-3 h-3" />
                        <span>9-п. отчёт</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Argon Verdict Modal */}
      {argonModalTask && (
        <ArgonVerdictModal
          isOpen={!!argonModalTask}
          task={argonModalTask}
          onClose={() => setArgonModalTask(null)}
          onSuccess={() => {
            setArgonModalTask(null);
            onRefreshTasks?.();
          }}
        />
      )}
    </div>
  );
};
