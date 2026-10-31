import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  RotateCcw, 
  FileText, 
  AlertTriangle, 
  Flame, 
  Search
} from 'lucide-react';
import type { TaskItem } from '../types.js';

interface TaskManagerProps {
  tasks: TaskItem[];
  onOpenNewTask: () => void;
  onRestartTask: (taskId: string) => void;
  onViewReport: (task: TaskItem) => void;
  onSelectTask: (task: TaskItem) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onOpenNewTask,
  onRestartTask,
  onViewReport,
  onSelectTask
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
            <span>Очередь задач и пайплайн выполнения</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Контроль жизненного цикла задач, назначения субагентов, 9-пунктных отчётов качества и авто-эскалации.
          </p>
        </div>

        <button
          onClick={onOpenNewTask}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-director-blue to-blue-600 hover:from-blue-500 hover:to-director-blue text-white text-xs font-semibold shadow-glass-subtle transition-all self-start md:self-auto"
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

            return (
              <div
                key={task.id}
                className="glass-card p-5 space-y-3 hover:border-white/20 transition-all"
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

                {/* Управление и политика повторов */}
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

                  <div className="flex items-center gap-2">
                    {task.report && (
                      <button
                        onClick={() => onViewReport(task)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/20 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>9-п. отчёт</span>
                      </button>
                    )}

                    <button
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
    </div>
  );
};
