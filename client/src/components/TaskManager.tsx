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
import type { TaskItem, ManagedProcess } from '../types.js';

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
    refreshProcesses();
    const interval = setInterval(refreshProcesses, 3000);

    const unsubscribe = eventStream.subscribe((event) => {
      if (event.type.startsWith('task.') || event.type.startsWith('escalation.')) {
        refreshProcesses();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [refreshProcesses]);

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
    } catch (err: any) {
      toast.error(err.message || 'Ошибка выполнения задачи в CLI', 'Сбой CLI');
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
        toast.info(`Процесс задачи "${task.title}" отменён`, 'Процесс остановлен');
        await refreshProcesses();
        onRefreshTasks?.();
      } else {
        toast.warning('Процесс уже завершён или не найден', 'Отмена процесса');
      }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка отмены процесса', 'Сбой отмены');
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
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const translatePriority = (p: string) => {
    switch (p) {
      case 'critical': return 'КРИТИЧЕСКИЙ';
      case 'high': return 'ВЫСОКИЙ';
      case 'medium': return 'СРЕДНИЙ';
      case 'low': return 'НИЗКИЙ';
      default: return p.toUpperCase();
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
      {/* Заголовок и создание задачи */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-director-blue" />
            <span>Очередь задач и TaskProcessSupervisor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Контроль жизненного цикла задач, исполнение в CLI agy, шлюзы качества и замкнутый цикл Аргона.
          </p>
        </div>

        <button
          onClick={onOpenNewTask}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-director-blue to-blue-600 hover:from-blue-500 hover:to-director-blue text-white text-xs font-semibold shadow-glass-subtle transition-all self-start md:self-auto active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Создать задачу</span>
        </button>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-card p-3.5">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по названию или ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input pl-9 text-xs w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="glass-input text-xs"
          >
            <option value="all">Все статусы</option>
            <option value="pending">В очереди</option>
            <option value="in_progress">В работе</option>
            <option value="verification">На проверке</option>
            <option value="completed">Завершено</option>
            <option value="escalated">Эскалировано</option>
            <option value="failed">Ошибка</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Отображено <strong className="text-white">{filteredTasks.length}</strong> из {tasks.length} задач
        </div>
      </div>

      {/* Список задач */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-500 space-y-2">
            <CheckSquare className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">Нет задач, соответствующих выбранным критериям.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isCompleted = task.status === 'completed';
            const isEscalated = task.status === 'escalated';
            const isInProgress = task.status === 'in_progress';
            const isFailed = task.status === 'failed';
            const isArgonStage = task.stage === 'Argon_L4';

            const proc = processes[task.id];
            const isProcActive = proc && (proc.state === 'RUNNING' || proc.state === 'STARTING' || proc.state === 'QUEUED');
            const isExecuting = executingTaskIds.has(task.id);
            const isCancelling = cancellingTaskIds.has(task.id);

            return (
              <div
                key={task.id}
                className={`glass-card p-4 sm:p-5 space-y-3 hover:border-white/20 transition-all ${
                  isArgonStage ? 'border-pink-500/30 shadow-glow-argon' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Плашка статуса */}
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                      isCompleted 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isEscalated
                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-glow-argon'
                        : isInProgress
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : isFailed
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-white/5'
                    }`}>
                      {translateStatus(task.status)}
                    </span>

                    {/* Бейдж активного процесса CLI супервизора */}
                    {isProcActive && (
                      <span className="badge-live text-[10px] py-0.5 px-2 font-mono flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                        <span>CLI RUNNING {proc?.pid ? `(PID ${proc.pid})` : ''}</span>
                      </span>
                    )}

                    {/* Плашка приоритета */}
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      task.priority === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : task.priority === 'high'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-white/5 text-slate-400'
                    }`}>
                      {translatePriority(task.priority)}
                    </span>

                    <span className="text-xs font-mono text-director-cyan">
                      Исполнитель: @{task.assignedAgent}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      Стадия: {translateStage(task.stage)}
                    </span>

                    {task.isDemo ? (
                      <span className="badge-demo text-[9px] py-0 px-1.5 font-mono">ДЕМО</span>
                    ) : (
                      <span className="badge-live text-[9px] py-0 px-1.5 font-mono">LIVE</span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-500">
                    Обновлено: {new Date(task.updatedAt).toLocaleTimeString()}
                  </div>
                </div>

                {/* Заголовок и описание */}
                <div>
                  <h3 
                    onClick={() => onSelectTask(task)}
                    className="text-sm font-bold text-white hover:text-director-cyan cursor-pointer transition-colors"
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Лог ошибки, если есть */}
                {task.errorLog && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-mono space-y-1">
                    <span className="text-[10px] uppercase font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Причина сбоя / статус эскалации:
                    </span>
                    <p className="line-clamp-2">{task.errorLog}</p>
                  </div>
                )}

                {/* Управление задачей, CLI и Аргон */}
                <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 font-mono text-slate-400 text-[11px]">
                    <span>
                      Попытки: <strong className={task.retryCount >= task.maxRetries ? 'text-pink-400 font-bold' : 'text-slate-200'}>
                        {task.retryCount}/{task.maxRetries}
                      </strong>
                    </span>
                    {task.retryCount >= task.maxRetries && (
                      <span className="text-pink-400 font-semibold flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        Лимит попыток исчерпан (Эскалация активна)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Кнопка "Ввести вердикт Аргона" при стадии Argon_L4 */}
                    {isArgonStage && (
                      <button
                        type="button"
                        onClick={() => setArgonModalTask(task)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500/25 via-purple-500/20 to-pink-500/25 hover:from-pink-500/35 hover:to-purple-500/35 text-pink-300 font-semibold border border-pink-500/40 shadow-glow-argon transition-all active:scale-95"
                      >
                        <Flame className="w-3.5 h-3.5 text-director-argon animate-pulse" />
                        <span>Ввести вердикт Аргона</span>
                      </button>
                    )}

                    {/* Кнопка "Отменить" активный процесс CLI супервизора */}
                    {(isProcActive || isInProgress) && (
                      <button
                        type="button"
                        onClick={() => handleCancelTask(task)}
                        disabled={isCancelling}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium border border-rose-500/25 transition-all disabled:opacity-50"
                        title="Остановить процесс супервизора"
                      >
                        <Square className="w-3.5 h-3.5 text-rose-400" />
                        <span>{isCancelling ? 'Отмена...' : 'Отменить'}</span>
                      </button>
                    )}

                    {/* Кнопка "Выполнить в CLI" */}
                    {!isProcActive && !isInProgress && (
                      <button
                        type="button"
                        onClick={() => handleExecuteInCli(task)}
                        disabled={isExecuting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-director-cyan font-medium border border-director-blue/30 transition-all shadow-glass-subtle disabled:opacity-50 active:scale-95"
                        title="Запустить выполнение задачи в CLI agy через TaskProcessSupervisor"
                      >
                        {isExecuting ? (
                          <span className="w-3.5 h-3.5 border-2 border-director-cyan border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>Выполнить в CLI</span>
                      </button>
                    )}

                    {/* Просмотр отчёта 9 пунктов */}
                    {task.report && (
                      <button
                        type="button"
                        onClick={() => onViewReport(task)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/20 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>9-п. отчёт</span>
                      </button>
                    )}

                    {/* Перезапуск / повтор задачи */}
                    <button
                      type="button"
                      onClick={() => onRestartTask(task.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 font-medium border border-white/10 transition-all"
                      title={task.retryCount >= task.maxRetries ? 'Будет выполнена эскалация на следующий уровень' : 'Повторить выполнение'}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-director-cyan" />
                      <span>{task.retryCount >= task.maxRetries ? 'Эскалировать' : 'Перезапустить'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно вердикта Gemini 4 Argon */}
      <ArgonVerdictModal
        isOpen={Boolean(argonModalTask)}
        task={argonModalTask}
        onClose={() => setArgonModalTask(null)}
        onSuccess={(updatedTask) => {
          toast.success(`Задача "${updatedTask.title}" возвращена специалисту @${updatedTask.assignedAgent}`, 'Де-эскалация Аргона выполнена');
          onRefreshTasks?.();
          refreshProcesses();
        }}
      />
    </div>
  );
};
