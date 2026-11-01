import React, { useState } from 'react';
import { 
  Users,
  Zap, 
  Cpu, 
  Power, 
  Eye, 
  Shield, 
  Search,
  FileText,
  LayoutGrid,
  Table as TableIcon,
  X
} from 'lucide-react';
import type { AgentInfo } from '../types.js';

interface AgentManagementProps {
  agents: AgentInfo[];
  onToggleAgent: (agentId: string, currentStatus: boolean) => void;
  onViewPrompt: (agent: AgentInfo) => void;
  onViewReport: (agent: AgentInfo) => void;
  onSyncAntigravity?: () => void;
  isSyncing?: boolean;
}

// 17 канонических ролей пула специалистов Antigravity
interface CanonicalRole {
  id: string;
  name: string;
  domain: string;
  category: 'core' | 'engineering' | 'quality' | 'platform' | 'product';
  categoryLabel: string;
  defaultModel: string;
  description: string;
  rulesOverview: string;
}

const CANONICAL_ROLES: CanonicalRole[] = [
  // 1. Оркестрация и архитектура
  {
    id: 'director',
    name: 'Director / Lead Orchestrator',
    domain: 'Центральная координация, триаж задач, контроль параллелизма до 6 субагентов',
    category: 'core',
    categoryLabel: 'Оркестрация и архитектура',
    defaultModel: 'Gemini 3.8 Flash High',
    description: 'Главный координатор системы. Автономный триаж: простые задачи решает соло (<15 строк), средние делегирует одному агенту, сложные разбивает на параллельные потоки.',
    rulesOverview: 'Единоличная ответственность за качество. Проверка 9-пунктных отчётов. Соблюдение лимитов параллелизма.'
  },
  {
    id: 'senior-architect',
    name: 'Senior Architect',
    domain: 'L3-эскалация, сложные архитектурные решения, гонки данных, масштабируемость',
    category: 'core',
    categoryLabel: 'Оркестрация и архитектура',
    defaultModel: 'Gemini Pro',
    description: 'Pro-tier специалист высшей квалификации. Привлекается при тупиках после 2 неудачных попыток и сложных системных сбоях.',
    rulesOverview: 'Глубокий диагноз первопричин, разработка скорректированной стратегии перед повторным запуском.'
  },
  {
    id: 'researcher',
    name: 'Researcher',
    domain: 'Исследование зависимостей, документации, архитектуры репозитория',
    category: 'core',
    categoryLabel: 'Оркестрация и архитектура',
    defaultModel: 'Gemini Flash',
    description: 'Только чтение и анализ внешних API, официальной документации и кодовой базы. Не пишет производственный код.',
    rulesOverview: 'Чистый анализ фактов, сверка с актуальными спецификациями, цитирование первоисточников.'
  },

  // 2. Разработка и интерфейсы
  {
    id: 'frontend-developer',
    name: 'Frontend Developer',
    domain: 'React, Next.js, TypeScript, Tailwind CSS, UI, анимации, эргономика, a11y',
    category: 'engineering',
    categoryLabel: 'Разработка и интерфейсы',
    defaultModel: 'Gemini Flash',
    description: 'Стандарты Refero Vercel Style, строгий TypeScript без any, сетка 4/8px, нулевой горизонтальный оверфлоу, тач-таргеты 44x44px.',
    rulesOverview: 'Обязательный запуск сборки и линтера перед сдачей. 9-пунктный отчёт с реальными логами.'
  },
  {
    id: 'backend-developer',
    name: 'Backend Developer',
    domain: 'Node.js, Express, Python, API, базы данных, схемы, авторизация, серверная логика',
    category: 'engineering',
    categoryLabel: 'Разработка и интерфейсы',
    defaultModel: 'Gemini Flash',
    description: 'Разработка REST/WebSocket API, строгая валидация схем через Zod, управление транзакциями SQLite/PostgreSQL.',
    rulesOverview: 'Секреты strictly в .env, обработка ошибок, отсутствие необработанных исключений.'
  },
  {
    id: 'ui-ux-designer',
    name: 'UI/UX Designer',
    domain: 'UX-исследования, сценарии взаимодействия, дизайн-системы, визуальная иерархия',
    category: 'engineering',
    categoryLabel: 'Разработка и интерфейсы',
    defaultModel: 'Gemini Flash',
    description: 'Проектирование чистых рабочих пространств без AI-шаблонов, расчет контраста WCAG AAA/AA, оптимизация сценариев.',
    rulesOverview: 'Запрет декоративных неоновых градиентов, ориентация на плотность информации и функциональный цвет.'
  },

  // 3. Качество, ревью и комплаенс
  {
    id: 'qa-engineer',
    name: 'QA Engineer',
    domain: 'Автоматизированные тесты, unit/интеграционные/E2E, проверка граничных условий',
    category: 'quality',
    categoryLabel: 'Качество, ревью и комплаенс',
    defaultModel: 'Gemini Flash',
    description: 'Независимое тестирование функциональности, валидация пограничных случаев, стресс-тесты шины WebSocket и API.',
    rulesOverview: 'Никакой код не считается готовым без проверяемых тестовых доказательств в логах.'
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    domain: 'Независимый аудит diff-ов, выявление дефектов, антипаттернов и уязвимостей',
    category: 'quality',
    categoryLabel: 'Качество, ревью и комплаенс',
    defaultModel: 'Gemini Flash',
    description: 'Проверка чистоты кода, соблюдения архитектурных инвариантов, отсутствия циклических зависимостей.',
    rulesOverview: 'Аудит независим от автора изменений. Ни один субагент не утверждает свой собственный код.'
  },
  {
    id: 'legal-compliance',
    name: 'Legal Advisor & Tech Writer',
    domain: '152-ФЗ, 243-ФЗ ИИ, GDPR, EU AI Act, 38-ФЗ, авторское право ГК РФ, техдокументация',
    category: 'quality',
    categoryLabel: 'Качество, ревью и комплаенс',
    defaultModel: 'Gemini Flash',
    description: 'Предпусковой юридический шлюз (Gate 2b). Анализ рисков персональных данных, внешних AI API, лицензий и составление runbooks.',
    rulesOverview: '11-пунктное юридическое заключение. Уровни GREEN, AMBER, RED, UNKNOWN. Неблокирующий инвариант для безопасных подзадач.'
  },

  // 4. Инфраструктура, безопасность и данные
  {
    id: 'security-engineer',
    name: 'Security Engineer',
    domain: 'OWASP Top 10, аудит секретов, предотвращение инъекций промптов, безопасность MCP',
    category: 'platform',
    categoryLabel: 'Инфраструктура, безопасность и данные',
    defaultModel: 'Gemini Flash / Pro',
    description: 'Контроль периметра безопасности, санитайзинг пользовательских вводов, аудит токенов доступа и MCP-инструментов.',
    rulesOverview: 'Нулевое доверие к внешним вводам, запрет утечек API-ключей, валидация прав доступа.'
  },
  {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    domain: 'CI/CD, GitHub Actions, Docker, мониторинг процессов, отказоустойчивость, бекапы',
    category: 'platform',
    categoryLabel: 'Инфраструктура, безопасность и данные',
    defaultModel: 'Gemini Flash / Pro',
    description: 'Управление процессами супервизора, автоматизация сборки и проверок, надежность фоновых демонов.',
    rulesOverview: 'Запрет несанкционированного деплоя, обеспечение идемпотентности скриптов.'
  },
  {
    id: 'database-specialist',
    name: 'Database Specialist',
    domain: 'Схемы SQLite/Postgres, нормализация, индексы, миграции, транзакции ACID, блокировки',
    category: 'platform',
    categoryLabel: 'Инфраструктура, безопасность и данные',
    defaultModel: 'Gemini Flash / Pro',
    description: 'Проектирование надежных схем, оптимизация индексов, контроль WAL-режима SQLite, устранение lock contention.',
    rulesOverview: 'Защита от потери данных, обязательные миграции, целостность внешних ключей.'
  },
  {
    id: 'data-engineer',
    name: 'Data Engineer',
    domain: 'ETL/ELT потоки данных, парсинг JSON/JSONL, дедупликация, качество данных',
    category: 'platform',
    categoryLabel: 'Инфраструктура, безопасность и данные',
    defaultModel: 'Gemini Flash / Pro',
    description: 'Обработка транскриптов сессий, агрегация телеметрии, нормализация потоков событий шины.',
    rulesOverview: 'Гарантия консистентности метрик, парсинг без потерь, очистка временных артефактов.'
  },

  // 5. Продукт, эвалы и доступность
  {
    id: 'product-manager',
    name: 'Product Manager',
    domain: 'Формирование требований, User Stories, Acceptance Criteria, определение MVP',
    category: 'product',
    categoryLabel: 'Продукт, аналитика и доступность',
    defaultModel: 'Gemini Flash',
    description: 'Анализ потребностей пользователей, декомпозиция крупных эпиков на тестируемые пользовательские истории.',
    rulesOverview: 'Четкие критерии приемки (DoD), приоритизация по ценности для пользователя.'
  },
  {
    id: 'ai-evaluation-engineer',
    name: 'AI Evaluation Engineer',
    domain: 'Тестирование качества ответов моделей, поиск галлюцинаций, бенчмаркинг, задержки',
    category: 'product',
    categoryLabel: 'Продукт, аналитика и доступность',
    defaultModel: 'Gemini Flash / Pro',
    description: 'Эвалы промптов субагентов, контроль точности маршрутизации, аудит токенов и латентности инференса.',
    rulesOverview: 'Регулярная калибровка системных инструкций, выявление деградации моделей.'
  },
  {
    id: 'performance-engineer',
    name: 'Performance Engineer',
    domain: 'Core Web Vitals, профилирование памяти и CPU, оптимизация размера сборок',
    category: 'product',
    categoryLabel: 'Продукт, аналитика и доступность',
    defaultModel: 'Gemini Flash / Pro',
    description: 'Диагностика узких мест UI/API, аудит утечек памяти, минимизация размера JavaScript-бандлов.',
    rulesOverview: 'LCP < 2.5s, CLS = 0, INP < 200ms, оптимизация рендеринга и дебаунс тяжелых вычислений.'
  },
  {
    id: 'accessibility-specialist',
    name: 'Accessibility Specialist',
    domain: 'Аудит доступности WCAG 2.1/2.2 AA/AAA, скринридеры, ARIA, клавиатурная навигация',
    category: 'product',
    categoryLabel: 'Продукт, аналитика и доступность',
    defaultModel: 'Gemini Flash',
    description: 'Проверка семантической верстки, фокус-рингов, доступных меток форм и поддержки prefers-reduced-motion.',
    rulesOverview: 'Клавиатурная навигация по всему интерфейсу, контраст текста не менее 4.5:1 (AAA для Obsidian).'
  }
];

export const AgentManagement: React.FC<AgentManagementProps> = ({
  agents,
  onToggleAgent,
  onViewPrompt,
  onViewReport,
  onSyncAntigravity,
  isSyncing = false
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<{
    canonical: CanonicalRole;
    live?: AgentInfo;
  } | null>(null);

  // Создаем объединенный список из 17 канонических ролей с актуальными данными из бекенда
  const mergedAgents = CANONICAL_ROLES.map(canonical => {
    const live = agents.find(a => a.id === canonical.id || a.role === canonical.id);
    return {
      canonical,
      live
    };
  });

  const filteredAgents = mergedAgents.filter(({ canonical, live }) => {
    const matchesSearch = 
      canonical.name.toLowerCase().includes(search.toLowerCase()) ||
      canonical.id.toLowerCase().includes(search.toLowerCase()) ||
      canonical.domain.toLowerCase().includes(search.toLowerCase()) ||
      (live && live.name.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || canonical.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-terminal-bg text-terminal-green border border-terminal-border">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
            В РАБОТЕ
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-warning-bg text-warning-text border border-warning-border">
            ПАУЗА
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-danger-bg text-danger-text border border-danger-border">
            БЛОКИРОВАН
          </span>
        );
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-argon-bg text-argon-text border border-argon-border">
            ЭСКАЛАЦИЯ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-surface-subtle text-charcoal border border-hairline">
            ГОТОВ
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Filter Bar */}
      <section className="bg-pure border border-hairline rounded-md p-4 sm:p-5 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-obsidian" />
              <h1 className="text-lg font-semibold text-obsidian tracking-tight">
                Пул специалистов AI Command Center (17 ролей)
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-subtle text-charcoal border border-hairline">
                Стандарт Antigravity
              </span>
            </div>
            <p className="text-[13px] text-charcoal mt-1">
              Глобальный состав ролей. Директор координирует параллельную работу до 6 субагентов, 
              обеспечивая изоляцию контекста и строгие шлюзы качества без вымышленных метрик.
            </p>
          </div>

          {/* 1-Click Sync Button */}
          {onSyncAntigravity && (
            <button
              type="button"
              onClick={onSyncAntigravity}
              disabled={isSyncing}
              title="1-Click Развертывание и синхронизация всех 17 агентов в Google Antigravity"
              className="refero-btn-secondary min-h-[32px] px-3 py-1 text-xs flex items-center gap-1.5 shrink-0"
            >
              <Zap className={`w-3.5 h-3.5 text-warning-text ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Синхронизация...' : '1-Click Sync Antigravity'}</span>
            </button>
          )}

          {/* View mode toggle: Grid vs Table */}
          <div className="flex items-center gap-1 p-0.5 rounded-md border border-hairline bg-surface-subtle self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Режим сетки карточек"
              className={`min-h-[32px] px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors focus-ring ${
                viewMode === 'grid'
                  ? 'bg-pure text-obsidian shadow-subtle'
                  : 'text-stone hover:text-obsidian'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Карточки</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Режим таблицы данных"
              className={`min-h-[32px] px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors focus-ring ${
                viewMode === 'table'
                  ? 'bg-pure text-obsidian shadow-subtle'
                  : 'text-stone hover:text-obsidian'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Таблица</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-hairline text-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-graphite absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск по роли, ID или домену..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke focus-ring"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
            >
              <option value="all">Все направления (17 ролей)</option>
              <option value="core">Оркестрация и архитектура</option>
              <option value="engineering">Разработка и интерфейсы</option>
              <option value="quality">Качество, ревью и комплаенс</option>
              <option value="platform">Инфраструктура, безопасность и данные</option>
              <option value="product">Продукт, аналитика и доступность</option>
            </select>
          </div>

          <div className="text-xs font-mono text-slate">
            Показано <strong className="text-obsidian font-semibold">{filteredAgents.length}</strong> из 17 ролей
          </div>
        </div>
      </section>

      {/* 2. Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAgents.map(({ canonical, live }) => {
            const isDirector = canonical.id === 'director';
            const isPro = canonical.defaultModel.toLowerCase().includes('pro');
            const isEnabled = live ? live.enabled : true;
            const currentStatus = live ? live.status : 'idle';
            const runsCount = live ? live.runCount : 0;
            const currentTask = live?.currentTask;

            return (
              <div
                key={canonical.id}
                className="bg-pure border border-hairline rounded-md p-4 shadow-subtle hover:border-ash transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Icon, Name, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-surface-subtle border border-hairline flex items-center justify-center text-obsidian shrink-0">
                        {isDirector ? (
                          <Shield className="w-4 h-4 text-obsidian" />
                        ) : (
                          <Cpu className="w-4 h-4 text-charcoal" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-sm font-semibold text-obsidian tracking-tight truncate">
                            {canonical.name}
                          </h2>
                          {isDirector && (
                            <span className="badge-live text-[9px] py-0 px-1.5">LEAD</span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-stone truncate block">
                          @{canonical.id}
                        </span>
                      </div>
                    </div>

                    {getStatusBadge(currentStatus)}
                  </div>

                  {/* Specialization Domain */}
                  <p className="text-[13px] text-charcoal leading-relaxed min-h-[40px]">
                    {canonical.domain}
                  </p>

                  {/* Technical Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-hairline text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-surface-subtle text-charcoal border border-hairline">
                      {isDirector ? 'Flash High' : isPro ? 'Pro-tier' : 'Flash'}
                    </span>
                    <span className="text-slate">
                      Запусков: <strong className="text-obsidian font-semibold">{runsCount}</strong>
                    </span>
                    <span className="text-slate ml-auto hidden sm:inline">
                      {canonical.categoryLabel}
                    </span>
                  </div>

                  {/* Active Task (if any) */}
                  {currentTask && (
                    <div className="p-2 rounded bg-surface-subtle border border-hairline text-xs font-mono space-y-0.5">
                      <span className="text-[10px] uppercase text-slate">В работе:</span>
                      <p className="text-obsidian font-medium truncate">{currentTask}</p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedAgentDetail({ canonical, live })}
                      className="refero-btn-secondary text-xs py-1 px-2.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-graphite" />
                      <span>Паспорт роли</span>
                    </button>

                    {live?.lastReport && (
                      <button
                        type="button"
                        onClick={() => onViewReport(live)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-terminal-bg text-terminal-green border border-terminal-border hover:bg-terminal-border/40 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Отчёт</span>
                      </button>
                    )}
                  </div>

                  {!isDirector && (
                    <button
                      type="button"
                      onClick={() => onToggleAgent(canonical.id, isEnabled)}
                      className={`min-h-[32px] min-w-[32px] p-1.5 rounded-md border text-xs font-medium transition-colors focus-ring flex items-center justify-center ${
                        isEnabled
                          ? 'bg-terminal-bg text-terminal-green border-terminal-border hover:bg-terminal-border/40'
                          : 'bg-surface-subtle text-slate border-hairline hover:text-obsidian'
                      }`}
                      title={isEnabled ? 'Роль включена в пул' : 'Роль временно отключена'}
                      aria-label={`${canonical.name}: ${isEnabled ? 'отключить' : 'включить'}`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Table View */}
      {viewMode === 'table' && (
        <div className="bg-pure border border-hairline rounded-md shadow-subtle overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-paper border-b border-hairline text-stone text-[11px] uppercase tracking-wider font-medium">
                <th className="py-2.5 px-4">Специалист / Роль</th>
                <th className="py-2.5 px-4">Направление</th>
                <th className="py-2.5 px-4">Модель</th>
                <th className="py-2.5 px-4">Статус</th>
                <th className="py-2.5 px-4 text-right">Запусков</th>
                <th className="py-2.5 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredAgents.map(({ canonical, live }) => {
                const isDirector = canonical.id === 'director';
                const isEnabled = live ? live.enabled : true;
                const currentStatus = live ? live.status : 'idle';
                const runsCount = live ? live.runCount : 0;

                return (
                  <tr key={canonical.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-obsidian">{canonical.name}</span>
                        <span className="font-mono text-stone text-xs">@{canonical.id}</span>
                        {isDirector && (
                          <span className="badge-live text-[9px] py-0 px-1.5">LEAD</span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal truncate max-w-md mt-0.5">
                        {canonical.domain}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-stone">
                      {canonical.categoryLabel}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-charcoal">
                      {canonical.defaultModel}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(currentStatus)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-obsidian font-semibold">
                      {runsCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedAgentDetail({ canonical, live })}
                          className="refero-btn-secondary text-xs py-1 px-2.5"
                        >
                          Детали
                        </button>
                        {!isDirector && (
                          <button
                            type="button"
                            onClick={() => onToggleAgent(canonical.id, isEnabled)}
                            className={`p-1.5 rounded-md border text-xs transition-colors ${
                              isEnabled
                                ? 'bg-terminal-bg text-terminal-green border-terminal-border'
                                : 'bg-surface-subtle text-slate border-hairline'
                            }`}
                            aria-label={`Переключить активность ${canonical.name}`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Detailed Agent Inspection Modal */}
      {selectedAgentDetail && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="agent-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm dark:bg-black/70 animate-fade-in"
        >
          <div className="w-full max-w-2xl bg-pure border border-hairline rounded-lg shadow-modal p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-hairline gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-surface-subtle border border-hairline flex items-center justify-center text-obsidian">
                  {selectedAgentDetail.canonical.id === 'director' ? (
                    <Shield className="w-5 h-5 text-obsidian" />
                  ) : (
                    <Cpu className="w-5 h-5 text-charcoal" />
                  )}
                </div>
                <div>
                  <h3 id="agent-detail-title" className="text-base font-semibold text-obsidian tracking-tight">
                    {selectedAgentDetail.canonical.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-stone">
                    <span>@{selectedAgentDetail.canonical.id}</span>
                    <span>•</span>
                    <span>{selectedAgentDetail.canonical.categoryLabel}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAgentDetail(null)}
                aria-label="Закрыть окно деталей агента"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md border border-hairline text-charcoal hover:text-obsidian hover:bg-surface-subtle transition-colors focus-ring"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-[13px]">
              <div>
                <span className="text-xs font-semibold text-obsidian block mb-1">
                  Область специализации:
                </span>
                <p className="text-charcoal bg-surface-subtle p-3 rounded-md border border-hairline leading-relaxed">
                  {selectedAgentDetail.canonical.description}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-obsidian block mb-1">
                  Архитектурные правила и протокол верификации:
                </span>
                <p className="text-charcoal bg-surface-subtle p-3 rounded-md border border-hairline leading-relaxed font-mono text-xs">
                  {selectedAgentDetail.canonical.rulesOverview}
                </p>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-md border border-hairline bg-pure">
                  <span className="text-[11px] text-stone block">Модельный уровень</span>
                  <span className="font-mono font-medium text-obsidian text-xs">
                    {selectedAgentDetail.canonical.defaultModel}
                  </span>
                </div>
                <div className="p-2.5 rounded-md border border-hairline bg-pure">
                  <span className="text-[11px] text-stone block">Подтверждённые запуски</span>
                  <span className="font-mono font-medium text-obsidian text-xs">
                    {selectedAgentDetail.live?.runCount || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-md border border-hairline bg-pure col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-stone block">Статус в пуле</span>
                  <div className="mt-0.5">
                    {getStatusBadge(selectedAgentDetail.live?.status || 'idle')}
                  </div>
                </div>
              </div>

              {/* Action: View full system prompt */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                {selectedAgentDetail.live && (
                  <button
                    type="button"
                    onClick={() => {
                      const agent = selectedAgentDetail.live!;
                      setSelectedAgentDetail(null);
                      onViewPrompt(agent);
                    }}
                    className="refero-btn-secondary text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Просмотреть полный системный промпт</span>
                  </button>
                )}

                {selectedAgentDetail.live?.lastReport && (
                  <button
                    type="button"
                    onClick={() => {
                      const agent = selectedAgentDetail.live!;
                      setSelectedAgentDetail(null);
                      onViewReport(agent);
                    }}
                    className="refero-btn-primary text-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Открыть последний 9-п. отчёт</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
