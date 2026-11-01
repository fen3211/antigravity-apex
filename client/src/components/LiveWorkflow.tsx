import React, { useState } from 'react';
import { 
  GitBranch, 
  ShieldCheck, 
  Flame, 
  ArrowRight, 
  ArrowDown
} from 'lucide-react';
import type { TaskItem, EventPayload } from '../types.js';

interface LiveWorkflowProps {
  tasks: TaskItem[];
  events: EventPayload[];
  onSelectTask: (task: TaskItem) => void;
}

export const LiveWorkflow: React.FC<LiveWorkflowProps> = ({ tasks, onSelectTask }) => {
  const [selectedStage, setSelectedStage] = useState<string>('Director_Triage');

  // Этапы пайплайна с задачами
  const stages = [
    {
      id: 'Director_Triage',
      title: 'Триаж Директора',
      tier: 'Уровень 0',
      model: 'Gemini 3.8 Flash High',
      role: 'Главный оркестратор',
      description: 'Оценивает сложность: простые (<15 строк) решает Соло; средние (1-3 файла) делегирует ровно 1 специалисту; крупные запускает в параллель (макс. 3).',
      gateRequirement: 'Автономное решение о триаже и изоляция контекста.'
    },
    {
      id: 'Solo',
      title: 'Соло-выполнение',
      tier: 'Уровень 0 (Автономно)',
      model: 'Gemini 3.8 Flash High',
      role: 'Быстрое решение простых задач (<15 строк, утилиты, опечатки)',
      description: 'Выполняется Директором напрямую без создания субагентов для максимальной экономии ресурсов и времени.',
      gateRequirement: 'Прямая проверка силами Директора.'
    },
    {
      id: 'Specialist',
      title: 'Выполнение субагентами',
      tier: 'Специалисты',
      model: 'Gemini Flash',
      role: 'Профильные специалисты (макс. 3 параллельно)',
      description: 'Работают в изолированных контекстах. Строго запрещено параллельно изменять общие файлы проекта.',
      gateRequirement: 'Обязательная самопроверка L1 с логами линтера и сборки перед отчётом.'
    },
    {
      id: 'QualityGate_L1',
      title: 'Шлюз L1: Самопроверка',
      tier: 'Шлюз уровня 1',
      model: 'Flash / Тестовый раннер',
      role: 'Проверка исполнителем',
      description: 'Исполнитель запускает тесты, компиляцию и сборку. Формирует структурированный отчёт из 9 пунктов.',
      gateRequirement: 'Ноль ошибок компиляции, отсутствие регрессий. Доказательства в логах.'
    },
    {
      id: 'Independent_L2',
      title: 'Шлюз L2: Независимый аудит',
      tier: 'Шлюз уровня 2',
      model: 'Gemini Flash',
      role: 'QA Engineer & Code Reviewer',
      description: 'Независимый аудит крупных изменений (>50 строк, схемы БД, авторизация, API). Никакой агент не одобряет свою работу сам.',
      gateRequirement: 'Независимое подтверждение от QA или ревьюера.'
    },
        {
      id: 'LegalGate',
      title: 'Шлюз 2b: Юрист и комплаенс',
      tier: 'Шлюз уровня 2b',
      model: 'Gemini Flash',
      role: 'Legal & Compliance (RU / EU / Dual)',
      description: 'Оценка правовых рисков: 152-ФЗ, 243-ФЗ, GDPR, EU AI Act, 38-ФЗ, 54-ФЗ, лицензии и авторские права. Не блокирует независимую разработку.',
      gateRequirement: 'Отсутствие неразрешённых рисков уровня RED. Разделение согласий и локализация.'
    },
    {
      id: 'Approved',
      title: 'Финальное утверждение',
      tier: 'Шлюз сдачи',
      model: 'Gemini 3.8 Flash High',
      role: 'Финальный арбитр качества',
      description: 'Директор заверяет прохождение всех шлюзов качества и передаёт проверенный результат пользователю.',
      gateRequirement: 'Подпись Директора и отчёт по фактам проверок.'
    }
  ];

  // Ветви эскалации
  const escalationStages = [
    {
      id: 'Architect_L3',
      title: 'Уровень 3: Senior Architect',
      tier: 'Эскалация L3',
      model: 'Gemini Pro',
      role: 'Архитектурный анализ и глубокая отладка',
      description: 'Привлекается, если один технический подход потерпел неудачу дважды. Исследует гонки данных, тонкие concurrency-баги и архитектуру.',
      gateRequirement: 'Диагноз первопричины и скорректированная стратегия.'
    },
    {
      id: 'Argon_L4',
      title: 'Уровень 4: Gemini 4 Argon',
      tier: 'Эскалация L4',
      model: 'Gemini 4 Argon High',
      role: 'Экспертный ресурс высшего уровня',
      description: 'Активируется при фундаментальном архитектурном тупике или провале двух независимых стратегий. Строгий ручной протокол.',
      gateRequirement: 'Минимальный контекст (20-50 строк). Реализация возвращается на Flash.'
    }
  ];

  const getTasksForStage = (stageId: string) => tasks.filter(t => t.stage === stageId);
  const activeStageInfo = [...stages, ...escalationStages].find(s => s.id === selectedStage) || stages[0];
  const activeStageTasks = getTasksForStage(selectedStage);

  return (
    <div className="space-y-6">
      {/* Заголовок и легенда */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-director-cyan" />
            <span>Интерактивная карта процессов Director</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Пайплайн качества: Триаж → Соло / Субагенты → Шлюз L1 (Самопроверка) → Шлюз L2 (Аудит) → Финальное утверждение
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-400" />
            <span className="text-slate-300">Основной маршрут</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500/20 border border-purple-400" />
            <span className="text-slate-300">Senior Architect (L3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-pink-500/20 border border-pink-400 shadow-glow-argon" />
            <span className="text-slate-300">Gemini 4 Argon (L4)</span>
          </div>
        </div>
      </div>

      {/* Основной холст визуализации */}
      <div className="glass-panel p-4 sm:p-6 space-y-8">
        {/* Адаптивный линейный основной поток (вертикально на мобильных, горизонтально на десктопе) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {stages.map((stage, idx) => {
            const stageTasks = getTasksForStage(stage.id);
            const isSelected = selectedStage === stage.id;
            const hasActiveTasks = stageTasks.some(t => t.status === 'in_progress');

            return (
              <React.Fragment key={stage.id}>
                {/* Блок узла */}
                <div
                  onClick={() => setSelectedStage(stage.id)}
                  className={`flex-1 p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all relative border ${
                    isSelected
                      ? 'bg-director-blue/15 border-director-cyan shadow-glass-active ring-1 ring-director-cyan/30'
                      : hasActiveTasks
                      ? 'bg-surface-card border-director-blue/40 hover:border-white/20'
                      : 'bg-surface-card border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                    <span className="text-director-cyan font-semibold">{stage.tier}</span>
                    <span className="text-slate-400 truncate max-w-[120px]">{stage.model}</span>
                  </div>

                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {stage.title}
                    {hasActiveTasks && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    )}
                  </h3>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {stage.role}
                  </p>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Задач:</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      stageTasks.length > 0 ? 'bg-white/10 text-white font-bold' : 'text-slate-600'
                    }`}>
                      {stageTasks.length}
                    </span>
                  </div>
                </div>

                {/* Стрелка-коннектор */}
                {idx < stages.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 text-slate-600 py-0.5 lg:py-0">
                    <ArrowRight className="w-4 h-4 hidden lg:block" />
                    <ArrowDown className="w-4 h-4 lg:hidden" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Ветви эскалации (Senior Architect & Gemini 4 Argon) */}
        <div className="pt-6 border-t border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-director-argon animate-pulse" />
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Маршруты эскалации (Преодоление тупиков и повторяющихся ошибок)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {escalationStages.map((esc) => {
              const escTasks = getTasksForStage(esc.id);
              const isSelected = selectedStage === esc.id;
              const isArgon = esc.id === 'Argon_L4';

              return (
                <div
                  key={esc.id}
                  onClick={() => setSelectedStage(esc.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? isArgon
                        ? 'bg-pink-500/15 border-pink-400 shadow-glow-argon ring-1 ring-pink-400/40'
                        : 'bg-purple-500/15 border-purple-400 ring-1 ring-purple-400/40'
                      : isArgon
                      ? 'bg-surface-card border-pink-500/20 hover:border-pink-500/40'
                      : 'bg-surface-card border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                    <span className={isArgon ? 'text-pink-400 font-semibold' : 'text-purple-400'}>
                      {esc.tier}
                    </span>
                    <span className="text-slate-400">{esc.model}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {esc.title}
                    {isArgon && (
                      <span className="badge-argon text-[9px] py-0 px-1.5">РУЧНОЙ ПЕРЕХОД</span>
                    )}
                  </h3>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {esc.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Активных эскалаций:</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      escTasks.length > 0 ? 'bg-pink-500/20 text-pink-300' : 'text-slate-600'
                    }`}>
                      {escTasks.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Панель деталей выбранного этапа */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-director-cyan">{activeStageInfo.tier}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">{activeStageInfo.model}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {activeStageInfo.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {activeStageInfo.description}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 max-w-sm text-xs space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Требование шлюза качества:
            </span>
            <p className="text-slate-300">{activeStageInfo.gateRequirement}</p>
          </div>
        </div>

        {/* Задачи на этом этапе */}
        <div className="pt-3 border-t border-white/[0.08]">
          <h4 className="text-xs font-semibold text-slate-400 mb-2.5">
            Задачи на данном этапе ({activeStageTasks.length}):
          </h4>

          {activeStageTasks.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 font-mono">
              В настоящее время на этапе «{activeStageInfo.title}» нет активных задач.
            </p>
          ) : (
            <div className="space-y-2">
              {activeStageTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-3 rounded-xl bg-surface-card hover:bg-white/[0.05] border border-white/5 cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{task.title}</span>
                      <span className="text-director-cyan font-mono">@{task.assignedAgent}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate max-w-xl">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-slate-500">
                      Попытки: {task.retryCount}/{task.maxRetries}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
