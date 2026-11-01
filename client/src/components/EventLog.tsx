import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  Copy, 
  Check, 
  Download,
  Sparkles,
  Terminal,
  Eye,
  X,
  Code2
} from 'lucide-react';
import type { EventPayload, EventType } from '../types.js';

interface EventLogProps {
  events: EventPayload[];
  onEmitTestEvent: (type: EventType) => void;
  onClearEvents?: () => void;
}

export const EventLog: React.FC<EventLogProps> = ({
  events,
  onEmitTestEvent
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<EventPayload | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEvents = events.filter(e => {
    const matchesSearch = 
      e.type.toLowerCase().includes(search.toLowerCase()) ||
      (e.agent_id && e.agent_id.toLowerCase().includes(search.toLowerCase())) ||
      (e.task_id && e.task_id.toLowerCase().includes(search.toLowerCase())) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'all' || e.type.startsWith(typeFilter);
    return matchesSearch && matchesType;
  });

  const handleCopy = (evt: EventPayload) => {
    navigator.clipboard.writeText(JSON.stringify(evt, null, 2));
    setCopiedId(evt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(filteredEvents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antigravity-events-${Date.now()}.json`;
    a.click();
  };

  const getEventTypeColor = (type: string) => {
    if (type.startsWith('quality_gate.passed') || type.startsWith('agent.completed') || type.startsWith('task.completed')) {
      return 'text-terminal-green bg-terminal-bg border-terminal-border';
    }
    if (type.startsWith('escalation.') || type.startsWith('quality_gate.failed') || type.startsWith('legal_gate.blocked')) {
      return 'text-argon-text bg-argon-bg border-argon-border';
    }
    if (type.startsWith('agent.failed') || type.startsWith('task.failed')) {
      return 'text-danger-text bg-danger-bg border-danger-border';
    }
    if (type.startsWith('agent.started') || type.startsWith('task.created') || type.startsWith('task.updated')) {
      return 'text-info-text bg-info-bg border-info-border';
    }
    return 'text-charcoal bg-surface-subtle border-hairline';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Surface */}
      <section className="bg-pure border border-hairline rounded-md p-4 sm:p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-obsidian animate-pulse" />
            <h1 className="text-lg font-semibold text-obsidian tracking-tight">
              Единый поток событий Antigravity (Event Stream)
            </h1>
          </div>
          <p className="text-[13px] text-charcoal mt-1 leading-relaxed">
            Полнотекстовый журнал WebSocket-телеметрии. Фильтрация по типам событий, поиск по агентам и инспектирование JSON payload.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Test Event Buttons */}
          <button
            type="button"
            onClick={() => onEmitTestEvent('quality_gate.passed')}
            className="refero-btn-secondary text-xs"
            title="Опубликовать тестовое событие прохождения шлюза"
          >
            <Sparkles className="w-3.5 h-3.5 text-terminal-green" />
            <span>Тест: Шлюз L1</span>
          </button>

          <button
            type="button"
            onClick={() => onEmitTestEvent('escalation.requested')}
            className="refero-btn-secondary text-xs"
            title="Опубликовать тестовое событие эскалации"
          >
            <Sparkles className="w-3.5 h-3.5 text-argon-text" />
            <span>Тест: Эскалация L4</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="refero-btn-primary text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт JSON</span>
          </button>
        </div>
      </section>

      {/* 2. Search & Filter Bar */}
      <section className="bg-pure border border-hairline rounded-md p-3.5 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-graphite absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск по типу, агенту или ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke focus-ring"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
          >
            <option value="all">Все типы событий</option>
            <option value="task.">События задач (task.*)</option>
            <option value="agent.">События агентов (agent.*)</option>
            <option value="quality_gate.">Шлюзы качества (quality_gate.*)</option>
            <option value="legal_gate.">Юридические шлюзы (legal_gate.*)</option>
            <option value="escalation.">Эскалации (escalation.*)</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate">
          Найдено <strong className="text-obsidian font-semibold">{filteredEvents.length}</strong> из {events.length} событий
        </div>
      </section>

      {/* 3. Event List */}
      <section className="space-y-2.5">
        {filteredEvents.length === 0 ? (
          <div className="bg-pure border border-hairline rounded-md p-12 text-center text-slate space-y-2">
            <Terminal className="w-8 h-8 mx-auto text-ash" />
            <p className="text-[13px]">События не найдены.</p>
          </div>
        ) : (
          filteredEvents.map(evt => {
            const isCopied = copiedId === evt.id;

            return (
              <div
                key={evt.id}
                className="bg-pure border border-hairline rounded-md p-3.5 shadow-subtle hover:border-ash transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${getEventTypeColor(evt.type)}`}>
                      {evt.type}
                    </span>

                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      evt.source === 'LIVE_AGY' 
                        ? 'bg-terminal-bg text-terminal-green border-terminal-border' 
                        : 'bg-surface-subtle text-charcoal border-hairline'
                    }`}>
                      {evt.source}
                    </span>

                    {evt.agent_id && (
                      <span className="font-mono text-obsidian font-semibold text-xs">
                        @{evt.agent_id}
                      </span>
                    )}

                    {evt.task_id && (
                      <span className="font-mono text-stone text-[11px] truncate max-w-[140px]">
                        [{evt.task_id}]
                      </span>
                    )}
                  </div>

                  {evt.data?.summary || evt.data?.note || evt.data?.message ? (
                    <p className="text-[13px] text-charcoal truncate">
                      {evt.data.summary || evt.data.note || evt.data.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 shrink-0 text-slate font-mono text-[11px]">
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(evt)}
                      className="refero-btn-secondary text-xs py-1 px-2.5"
                      title="Инспектировать payload события"
                    >
                      <Eye className="w-3.5 h-3.5 text-graphite" />
                      <span>Payload</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(evt)}
                      className="refero-btn-secondary text-xs py-1 px-2"
                      title="Скопировать JSON события"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-terminal-green" /> : <Copy className="w-3.5 h-3.5 text-graphite" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 4. Event Payload Inspector Modal */}
      {selectedEvent && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm dark:bg-black/70 animate-fade-in"
        >
          <div className="w-full max-w-2xl bg-pure border border-hairline rounded-lg shadow-modal p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-obsidian" />
                <h3 className="text-sm font-semibold text-obsidian tracking-tight">
                  Инспектор события {selectedEvent.type}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Закрыть инспектор payload"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md border border-hairline text-charcoal hover:text-obsidian hover:bg-surface-subtle transition-colors focus-ring"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <pre className="p-4 rounded-md bg-surface-subtle border border-hairline font-mono text-xs text-obsidian leading-relaxed whitespace-pre-wrap selection:bg-obsidian selection:text-pure">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs font-mono">
              <span className="text-slate">ID: {selectedEvent.id}</span>
              <button
                type="button"
                onClick={() => handleCopy(selectedEvent)}
                className="refero-btn-secondary text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Скопировать JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
