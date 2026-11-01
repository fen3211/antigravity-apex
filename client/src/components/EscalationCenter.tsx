import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Search, 
  SlidersHorizontal, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  AlertOctagon, 
  Filter,
  RefreshCw,
  Sliders
} from 'lucide-react';
import type { 
  EscalationItem, 
  EscalationStatus, 
  EscalationPriority, 
  SensitivitySetting,
  EscalationStats 
} from '../types.js';
import { EscalationDetailModal } from './Modals/EscalationDetailModal.js';
import { toast } from './Toast.js';

interface EscalationCenterProps {
  escalations: EscalationItem[];
  stats: EscalationStats | null;
  sensitivity: SensitivitySetting;
  onUpdateSensitivity: (newSensitivity: SensitivitySetting) => Promise<void>;
  onRefresh: () => Promise<void>;
  onCopyPrompt: (id: string) => Promise<void>;
  onMarkSent: (id: string) => Promise<void>;
  onSubmitResponse: (id: string, responseText: string) => Promise<void>;
  onResolve: (id: string, note?: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onRegenerate: (id: string) => Promise<void>;
  onTriggerEscalation?: (taskId: string) => Promise<void>;
}

type FilterTab = 'all' | 'awaiting' | 'review' | 'resolved' | 'rejected';

export const EscalationCenter: React.FC<EscalationCenterProps> = ({
  escalations,
  stats,
  sensitivity,
  onUpdateSensitivity,
  onRefresh,
  onCopyPrompt,
  onMarkSent,
  onSubmitResponse,
  onResolve,
  onReject,
  onRegenerate
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickCopy = async (esc: EscalationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(esc.promptPack);
      setCopiedId(esc.id);
      toast.success(`Пакет для задачи "${esc.taskTitle}" скопирован`);
      await onCopyPrompt(esc.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast.error('Не удалось скопировать в буфер обмена');
    }
  };

  const filteredEscalations = useMemo(() => {
    return escalations.filter(esc => {
      // 1. Tab filter
      if (activeFilterTab === 'awaiting') {
        if (!['DETECTED', 'PROMPT_READY', 'AWAITING_USER', 'COPIED', 'SENT_TO_ARGON'].includes(esc.status)) {
          return false;
        }
      } else if (activeFilterTab === 'review') {
        if (!['IN_REVIEW', 'RESULT_RECEIVED'].includes(esc.status)) {
          return false;
        }
      } else if (activeFilterTab === 'resolved') {
        if (esc.status !== 'COMPLETED') return false;
      } else if (activeFilterTab === 'rejected') {
        if (!['REJECTED', 'CANCELLED'].includes(esc.status)) return false;
      }

      // 2. Priority filter
      if (priorityFilter !== 'all' && esc.priority !== priorityFilter) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = esc.taskTitle.toLowerCase().includes(q);
        const matchReason = esc.reason.toLowerCase().includes(q);
        const matchId = esc.id.toLowerCase().includes(q);
        if (!matchTitle && !matchReason && !matchId) return false;
      }

      return true;
    });
  }, [escalations, activeFilterTab, priorityFilter, searchQuery]);

  const getStatusBadge = (status: EscalationStatus) => {
    switch (status) {
      case 'DETECTED':
      case 'PROMPT_READY':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">ГОТОВ К ОТПРАВКЕ</span>;
      case 'COPIED':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">СКОПИРОВАНО</span>;
      case 'SENT_TO_ARGON':
      case 'AWAITING_RESULT':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20 animate-pulse">В ARGON</span>;
      case 'RESULT_RECEIVED':
      case 'IN_REVIEW':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">ПРОВЕРКА ОТВЕТА</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-terminal-bg text-terminal-green border border-terminal-border">РАЗРЕШЕНО</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-danger-bg text-danger-text border border-danger-border">ОТКЛОНЕНО</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-surface text-charcoal border border-hairline">{status}</span>;
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-danger-bg text-danger-text border border-danger-border">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">HIGH</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-surface-subtle text-stone border border-hairline">MEDIUM</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Sensitivity Setting */}
      <div className="bg-pure border border-hairline rounded-md p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold bg-argon-bg text-argon-text border border-argon-border">
                <Flame className="w-4 h-4 text-danger animate-pulse" />
                ARGON LEVEL 4 ESCALATION CENTER
              </span>
              <span className="text-xs font-mono text-stone">
                Модель L4: Gemini 4 Argon
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-obsidian">
              Центр интеллектуальных эскалаций
            </h1>
            <p className="text-sm text-stone max-w-2xl">
              Автономное выявление архитектурных тупиков, генерация 18-пунктных структурированных пакетов и координация ручного протокола Gemini 4 Argon.
            </p>
          </div>

          {/* Sensitivity Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-surface-subtle p-3 rounded border border-hairline">
            <div className="flex items-center gap-1.5 text-xs font-mono text-charcoal">
              <Sliders className="w-3.5 h-3.5 text-graphite" />
              <span>Чувствительность:</span>
            </div>
            <div className="inline-flex rounded-md shadow-sm border border-hairline bg-pure p-0.5 text-xs font-mono">
              {(['conservative', 'balanced', 'aggressive'] as SensitivitySetting[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => onUpdateSensitivity(mode)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    sensitivity === mode
                      ? 'bg-obsidian text-pure font-semibold shadow-xs'
                      : 'text-stone hover:text-obsidian'
                  }`}
                  title={
                    mode === 'conservative'
                      ? 'Консервативный: эскалация только после 3 сбоев'
                      : mode === 'balanced'
                      ? 'Сбалансированный: предупреждение на 2 сбое, эскалация на 3 или при тупике'
                      : 'Агрессивный: ранняя эскалация на 2 сбое'
                  }
                >
                  {mode === 'conservative' ? 'Консервативная' : mode === 'balanced' ? 'Сбалансированная' : 'Агрессивная'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-surface-subtle rounded border border-hairline space-y-1">
            <div className="text-xs font-mono text-stone">Активные эскалации</div>
            <div className="text-xl font-bold font-mono text-obsidian">
              {stats?.activeCount ?? escalations.filter(e => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(e.status)).length}
            </div>
          </div>
          <div className="p-3 bg-surface-subtle rounded border border-hairline space-y-1">
            <div className="text-xs font-mono text-stone">Ожидают оператора</div>
            <div className="text-xl font-bold font-mono text-amber-500">
              {stats?.awaitingUserCount ?? escalations.filter(e => ['PROMPT_READY', 'AWAITING_USER', 'COPIED', 'SENT_TO_ARGON'].includes(e.status)).length}
            </div>
          </div>
          <div className="p-3 bg-surface-subtle rounded border border-hairline space-y-1">
            <div className="text-xs font-mono text-stone">На проверке Директора</div>
            <div className="text-xl font-bold font-mono text-cyan-500">
              {stats?.inReviewCount ?? escalations.filter(e => ['IN_REVIEW', 'RESULT_RECEIVED'].includes(e.status)).length}
            </div>
          </div>
          <div className="p-3 bg-surface-subtle rounded border border-hairline space-y-1">
            <div className="text-xs font-mono text-stone">Успешно разрешено</div>
            <div className="text-xl font-bold font-mono text-terminal-green">
              {stats?.resolvedCount ?? escalations.filter(e => e.status === 'COMPLETED').length}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
          {[
            { id: 'all', label: 'Все', count: escalations.length },
            { id: 'awaiting', label: 'Требуют действий', count: escalations.filter(e => ['PROMPT_READY', 'AWAITING_USER', 'COPIED', 'SENT_TO_ARGON'].includes(e.status)).length },
            { id: 'review', label: 'На проверке', count: escalations.filter(e => ['IN_REVIEW', 'RESULT_RECEIVED'].includes(e.status)).length },
            { id: 'resolved', label: 'Разрешено', count: escalations.filter(e => e.status === 'COMPLETED').length },
            { id: 'rejected', label: 'Отклонено', count: escalations.filter(e => ['REJECTED', 'CANCELLED'].includes(e.status)).length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterTab(tab.id as FilterTab)}
              className={`px-3 py-1.5 rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeFilterTab === tab.id
                  ? 'bg-obsidian text-pure border-obsidian font-semibold'
                  : 'bg-pure text-stone border-hairline hover:text-obsidian hover:bg-surface-subtle'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-subtle/50 text-inherit">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Priority & Search controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по задаче..."
              className="pl-8 pr-3 py-1.5 rounded-md text-xs font-mono bg-pure border border-hairline text-obsidian focus:outline-none focus:ring-1 focus:ring-obsidian w-36 sm:w-48"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md text-xs font-mono bg-pure border border-hairline text-obsidian focus:outline-none focus:ring-1 focus:ring-obsidian"
          >
            <option value="all">Все приоритеты</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-md border border-hairline bg-pure text-stone hover:text-obsidian hover:bg-surface-subtle transition-colors"
            title="Обновить список"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Escalations List */}
      <div className="space-y-3">
        {filteredEscalations.length === 0 ? (
          <div className="p-12 text-center bg-pure border border-hairline rounded-md space-y-3">
            <AlertOctagon className="w-10 h-10 text-stone mx-auto opacity-40" />
            <div className="text-sm font-medium text-obsidian">
              {escalations.length === 0
                ? 'Нет зарегистрированных эскалаций к Gemini 4 Argon'
                : 'По выбранным фильтрам эскалаций не найдено'}
            </div>
            <p className="text-xs text-stone max-w-md mx-auto">
              Когда субагенты сталкиваются с устойчивым архитектурным тупиком или превышают лимит попыток, система автоматически формирует 18-пунктный пакет запроса.
            </p>
          </div>
        ) : (
          filteredEscalations.map(esc => {
            const isCopied = copiedId === esc.id;
            return (
              <div
                key={esc.id}
                onClick={() => setSelectedEscalation(esc)}
                className="group p-4 sm:p-5 bg-pure border border-hairline hover:border-graphite/40 rounded-md shadow-xs hover:shadow-subtle transition-all cursor-pointer space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {getPriorityBadge(esc.priority)}
                    {getStatusBadge(esc.status)}
                    <span className="text-xs font-mono text-stone">ID: {esc.id}</span>
                    <span className="text-xs font-mono text-stone">Задача: {esc.taskId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-stone">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(esc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-subtle text-charcoal border border-hairline">
                      Попыток: {esc.attemptsCount}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-obsidian group-hover:text-black dark:group-hover:text-white transition-colors">
                    {esc.taskTitle}
                  </h3>
                  <p className="text-xs text-charcoal line-clamp-2">
                    {esc.reason}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-hairline/60">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone" />
                    {Array.from(new Set(esc.involvedAgents)).map((ag, idx) => (
                      <span key={`${ag}-${idx}`} className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-subtle text-charcoal border border-hairline">
                        @{ag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleQuickCopy(esc, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-surface text-charcoal border border-hairline hover:bg-surface-subtle transition-colors"
                      title="Скопировать 18-пунктный пакет в буфер"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-terminal-green" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Скопировано!' : 'Копировать пакет'}</span>
                    </button>
                    <button
                      onClick={() => setSelectedEscalation(esc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-obsidian text-pure hover:bg-graphite transition-colors"
                    >
                      <span>Открыть детали</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Detail Modal */}
      {selectedEscalation && (
        <EscalationDetailModal
          escalation={selectedEscalation}
          onClose={() => setSelectedEscalation(null)}
          onCopyPrompt={async (id) => {
            await onCopyPrompt(id);
            // Update local state
            setSelectedEscalation(prev => prev && prev.id === id ? { ...prev, status: 'COPIED', copiedAt: new Date().toISOString() } : prev);
          }}
          onMarkSent={async (id) => {
            await onMarkSent(id);
            setSelectedEscalation(prev => prev && prev.id === id ? { ...prev, status: 'SENT_TO_ARGON', sentAt: new Date().toISOString() } : prev);
          }}
          onSubmitResponse={async (id, text) => {
            await onSubmitResponse(id, text);
            await onRefresh();
            // Re-fetch selected item
            const updated = escalations.find(e => e.id === id);
            if (updated) setSelectedEscalation(updated);
          }}
          onResolve={async (id, note) => {
            await onResolve(id, note);
            setSelectedEscalation(null);
            await onRefresh();
          }}
          onReject={async (id, reason) => {
            await onReject(id, reason);
            setSelectedEscalation(null);
            await onRefresh();
          }}
          onRegenerate={async (id) => {
            await onRegenerate(id);
            await onRefresh();
            const updated = escalations.find(e => e.id === id);
            if (updated) setSelectedEscalation(updated);
          }}
        />
      )}
    </div>
  );
};
