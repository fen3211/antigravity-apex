import React, { useState } from 'react';
import { 
  GitBranch, 
  ShieldCheck, 
  Flame, 
  ArrowRight, 
  ArrowDown,
  Layers,
  Inbox
} from 'lucide-react';
import type { TaskItem, EventPayload } from '../types.js';

interface LiveWorkflowProps {
  tasks: TaskItem[];
  events: EventPayload[];
  onSelectTask: (task: TaskItem) => void;
}

export const LiveWorkflow: React.FC<LiveWorkflowProps> = ({ tasks, onSelectTask }) => {
  const [selectedStage, setSelectedStage] = useState<string>('Director_Triage');

  // Основные этапы оркестрации
  const stages = [
    {
      id: 'Director_Triage',
      title: 'Триаж Директора',
      tier: 'Уровень 0',
      model: 'Gemini 3.8 Flash High',
      role: 'Главный оркестратор',
      description: 'Анализ сложности: простые задачи (<15 строк, фикс, утилита) выполняет Соло; средние (1-3 файла) делегирует одному профильному специалисту; крупные разбивает на параллельные подзадачи (до 6 субагентов).',
      gateRequirement: 'Автономный анализ сложности, выбор специалистов и изоляция контекста.'
    },
    {
      id: 'Solo',
      title: 'Соло-выполнение',
      tier: 'Уровень 0 (Соло)',
      model: 'Gemini 3.8 Flash High',
      role: 'Экономия ресурсов на тривиальных правках',
      description: 'Директор решает задачу напрямую без запуска субагентов для максимальной скорости и минимального расхода токенов.',
      gateRequirement: 'Прямая проверка компиляции и сборки Директором.'
    },
    {
      id: 'Specialist',
      title: 'Параллельные субагенты',
      tier: 'Flash Специалисты',
      model: 'Gemini Flash',
      role: 'Профильные субагенты (до 6 параллельно)',
      description: 'Специалисты работают в изолированных ветках Git Worktree. Запрещено параллельно редактировать одни и те же файлы проекта.',
      gateRequirement: 'Обязательная самопроверка L1 с реальными логами сборки и тестов перед составлением отчёта.'
    },
    {
      id: 'QualityGate_L1',
      title: 'Шлюз L1: Самопроверка',
      tier: 'Шлюз уровня 1',
      model: 'Flash / Тестовый раннер',
      role: 'Исполнитель задачи',
      description: 'Исполнитель запускает linter, typecheck, build и unit-тесты. Формирует обязательный структурированный 9-пунктный отчёт.',
      gateRequirement: 'Ноль ошибок компиляции, отсутствие регрессий, проверяемые логи.'
    },
    {
      id: 'Independent_L2',
      title: 'Шлюз L2: Независимый аудит',
      tier: 'Шлюз уровня 2',
      model: 'Gemini Flash',
      role: 'QA Engineer & Code Reviewer',
      description: 'Независимая проверка для критических изменений (>50 строк, схемы БД, авторизация, API). Ни один агент не одобряет свой код сам.',
      gateRequirement: 'Прохождение тестов QA и независимое одобрение Code Reviewer.'
    },
    {
      id: 'LegalGate',
      title: 'Шлюз 2b: Юрист & комплаенс',
      tier: 'Шлюз уровня 2b',
      model: 'Gemini Flash',
      role: 'Legal Advisor & Tech Writer',
      description: 'Обязательный предпусковой аудит: 152-ФЗ, 243-ФЗ ИИ, GDPR, EU AI Act, 38-ФЗ, лицензии. Неблокирующий для безопасных задач.',
      gateRequirement: 'Отсутствие неразрешённых рисков уровня RED. Разделение согласий и локализация данных.'
    },
    {
      id: 'Approved',
      title: 'Финальное утверждение',
      tier: 'Шлюз сдачи',
      model: 'Gemini 3.8 Flash High',
      role: 'Финальный арбитр качества',
      description: 'Директор заверяет прохождение всех шлюзов качества, проверяет артефакты и передаёт готовый результат пользователю.',
      gateRequirement: 'Подпись Директора и подтверждённые доказательства проверок.'
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
      model: 'Gemini 4 Argon',
      role: 'Преодоление архитектурных тупиков высшего уровня',
      description: 'Строгий ручной протокол эскалации. Директор генерирует 10-пунктный Prompt Pack. После решения вердикт деэскалируется обратно на уровень Flash.',
      gateRequirement: 'Зафиксированный архитектурный вердикт Аргона и возвращение к исполнителю.'
    }
  ];

  const getTasksForStage = (stageId: string) => {
    return tasks.filter(t => t.stage === stageId);
  };

  const activeStageInfo = [...stages, ...escalationStages].find(s => s.id === selectedStage) || stages[0];
  const activeStageTasks = getTasksForStage(selectedStage);

  return (
    <div className="space-y-6">
      {/* 1. Header Information Panel */}
      <section className="bg-pure border border-hairline rounded-md p-4 sm:p-5 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-obsidian" />
              <h1 className="text-lg font-semibold text-obsidian tracking-tight">
                Архитектура оркестрации и шлюзы качества Antigravity
              </h1>
            </div>
            <p className="text-[13px] text-charcoal mt-1 leading-relaxed">
              Многоуровневый конвейер: Директор триажирует задачи, субагенты исполняют в параллели (до 6), 
              проходят шлюзы L1–L2, юридический шлюз 2b и при необходимости эскалируются к Argon L4.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-stone self-start md:self-auto shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-subtle border border-hairline">
              <Layers className="w-3.5 h-3.5 text-graphite" />
              <span>Макс. параллелизм: 6 subagents</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Visual Pipeline Flow Canvas */}
      <section className="bg-pure border border-hairline rounded-md p-4 sm:p-6 shadow-subtle space-y-6">
        <div className="flex items-center justify-between border-b border-hairline pb-2.5">
          <span className="text-xs font-mono uppercase tracking-wider text-stone font-medium">
            Основной поток исполнения (Primary Quality Path)
          </span>
          <span className="text-xs font-mono text-slate">
            Кликните по этапу для детального инспектирования
          </span>
        </div>

        {/* Linear Stage Nodes: Vertical on mobile, Horizontal on large viewports */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {stages.map((stage, idx) => {
            const stageTasks = getTasksForStage(stage.id);
            const isSelected = selectedStage === stage.id;
            const hasActiveTasks = stageTasks.some(t => t.status === 'in_progress');

            return (
              <React.Fragment key={stage.id}>
                {/* Stage Node Box */}
                <div
                  onClick={() => setSelectedStage(stage.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedStage(stage.id); } }}
                  className={`flex-1 p-3.5 rounded-md cursor-pointer transition-all border text-left focus-ring ${
                    isSelected
                      ? 'bg-surface-subtle border-obsidian shadow-subtle ring-1 ring-obsidian'
                      : hasActiveTasks
                      ? 'bg-pure border-terminal-border hover:border-terminal-green'
                      : 'bg-pure border-hairline hover:border-ash'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-obsidian font-semibold">{stage.tier}</span>
                    <span className="text-slate text-[10px] truncate max-w-[100px]">{stage.model}</span>
                  </div>

                  <h2 className="text-[13px] font-semibold text-obsidian flex items-center gap-1.5 truncate">
                    {stage.title}
                    {hasActiveTasks && (
                      <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse shrink-0" />
                    )}
                  </h2>

                  <p className="text-xs text-charcoal mt-1 line-clamp-2 min-h-[32px]">
                    {stage.role}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-hairline flex items-center justify-between text-[11px] font-mono">
                    <span className="text-stone">Задач:</span>
                    <span className={`px-1.5 py-0.2 rounded font-semibold ${
                      stageTasks.length > 0 ? 'bg-obsidian text-pure' : 'bg-surface-subtle text-slate border border-hairline'
                    }`}>
                      {stageTasks.length}
                    </span>
                  </div>
                </div>

                {/* Arrow Connector */}
                {idx < stages.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 text-graphite py-0.5 lg:py-0">
                    <ArrowRight className="w-4 h-4 hidden lg:block" />
                    <ArrowDown className="w-4 h-4 lg:hidden" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 3. Escalation Pathways (Senior Architect L3 & Gemini 4 Argon L4) */}
        <div className="pt-5 border-t border-hairline space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-argon-text animate-pulse" />
            <h2 className="text-xs font-semibold text-obsidian uppercase tracking-wider font-mono">
              Маршруты эскалации (Преодоление тупиков и повторяющихся сбоев)
            </h2>
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
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedStage(esc.id); } }}
                  className={`p-4 rounded-md cursor-pointer transition-all border text-left focus-ring ${
                    isSelected
                      ? isArgon
                        ? 'bg-argon-bg border-argon-text shadow-subtle ring-1 ring-argon-text'
                        : 'bg-surface-subtle border-obsidian shadow-subtle ring-1 ring-obsidian'
                      : isArgon
                      ? 'bg-pure border-argon-border hover:border-argon-text'
                      : 'bg-pure border-hairline hover:border-ash'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className={isArgon ? 'text-argon-text font-semibold' : 'text-obsidian font-semibold'}>
                      {esc.tier}
                    </span>
                    <span className="text-slate text-xs">{esc.model}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-obsidian flex items-center gap-2">
                    {esc.title}
                    {isArgon && (
                      <span className="badge-argon text-[9px] py-0 px-1.5">ПРОТОКОЛ L4</span>
                    )}
                  </h3>

                  <p className="text-[13px] text-charcoal mt-1 leading-relaxed">
                    {esc.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-hairline flex items-center justify-between text-xs font-mono">
                    <span className="text-stone">Активных задач на этапе:</span>
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      escTasks.length > 0 
                        ? (isArgon ? 'bg-argon-bg text-argon-text border border-argon-border' : 'bg-obsidian text-pure')
                        : 'bg-surface-subtle text-slate border border-hairline'
                    }`}>
                      {escTasks.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Selected Stage Detailed Inspection Panel & Tasks List */}
      <section className="bg-pure border border-hairline rounded-md p-4 sm:p-5 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-3 border-b border-hairline">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="font-semibold text-obsidian">{activeStageInfo.tier}</span>
              <span className="text-hairline">•</span>
              <span className="text-stone">{activeStageInfo.model}</span>
            </div>
            <h2 className="text-base font-semibold text-obsidian tracking-tight">
              {activeStageInfo.title}
            </h2>
            <p className="text-[13px] text-charcoal leading-relaxed max-w-2xl">
              {activeStageInfo.description}
            </p>
          </div>

          <div className="p-3 rounded-md bg-surface-subtle border border-hairline max-w-sm text-xs space-y-1 shrink-0">
            <span className="text-[10px] uppercase font-mono text-stone flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-terminal-green" />
              Критерий прохождения шлюза:
            </span>
            <p className="text-charcoal leading-relaxed">{activeStageInfo.gateRequirement}</p>
          </div>
        </div>

        {/* Tasks Assigned to the Active Stage */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-obsidian uppercase tracking-wider font-mono">
            Задачи на этапе «{activeStageInfo.title}» ({activeStageTasks.length}):
          </h3>

          {activeStageTasks.length === 0 ? (
            /* Clear & Professional Empty State */
            <div className="p-8 rounded-md bg-surface-subtle border border-hairline text-center space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-ash" />
              <p className="text-[13px] font-medium text-obsidian">
                На этапе «{activeStageInfo.title}» сейчас нет активных задач
              </p>
              <p className="text-xs text-stone max-w-md mx-auto">
                Все задачи этого этапа либо успешно завершены и прошли шлюзы качества, либо ещё не дошли до данной стадии в конвейере оркестрации.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeStageTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTask(task); } }}
                  className="p-3 rounded-md bg-pure hover:bg-surface-subtle border border-hairline hover:border-ash cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs focus-ring"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-obsidian truncate">{task.title}</span>
                      <span className="font-mono text-stone text-xs">@{task.assignedAgent}</span>
                    </div>
                    {task.description && (
                      <p className="text-charcoal text-[11px] truncate max-w-xl">{task.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] text-slate">
                      Попытки: {task.retryCount}/{task.maxRetries}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-graphite" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
