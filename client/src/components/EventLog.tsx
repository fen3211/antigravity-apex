import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  Copy, 
  Check, 
  Download,
  Sparkles
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

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-director-blue animate-pulse" />
            <span>Единый поток событий Antigravity</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Стриминг телеметрии в реальном времени через WebSocket. Стандартизированная 10-типовая шина событий.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Тестовые события для проверки шины */}
          <button
            onClick={() => onEmitTestEvent('quality_gate.passed')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono border border-emerald-500/20 transition-all"
          >
            <Sparkles className="w-3 h-3" />
            <span>Тест: Шлюз пройден</span>
          </button>

          <button
            onClick={() => onEmitTestEvent('escalation.requested')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 text-xs font-mono border border-pink-500/20 transition-all"
          >
            <Sparkles className="w-3 h-3" />
            <span>Тест: Эскалация L4</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono border border-white/10 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт JSON</span>
          </button>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="glass-card p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по типу события, задаче или агенту..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input pl-9 text-xs w-full font-mono"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="glass-input text-xs font-mono"
          >
            <option value="all">Все события</option>
            <option value="agent">agent.* (Запуск, Завершение, Сбой)</option>
            <option value="task">task.* (Создание, Обновление, Завершение)</option>
            <option value="escalation">escalation.* (Запрос, Разрешение)</option>
            <option value="quality_gate">quality_gate.* (Пройден, Провален)</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Отображено <strong className="text-white">{filteredEvents.length}</strong> событий
        </div>
      </div>

      {/* Список событий и инспектор */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список событий */}
        <div className="lg:col-span-2 glass-panel p-4 space-y-2 max-h-[600px] overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-xs">
              Нет событий, соответствующих выбранному фильтру.
            </p>
          ) : (
            filteredEvents.map(evt => {
              const isSelected = selectedEvent?.id === evt.id;
              const isEscalation = evt.type.startsWith('escalation');
              const isQuality = evt.type.startsWith('quality_gate');
              const isAgent = evt.type.startsWith('agent');

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1 ${
                    isSelected
                      ? 'bg-director-blue/20 border-director-cyan shadow-glass-subtle'
                      : 'bg-black/30 hover:bg-white/[0.04] border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono font-bold ${
                      isEscalation 
                        ? 'text-pink-400' 
                        : isQuality 
                        ? 'text-emerald-400' 
                        : isAgent 
                        ? 'text-director-cyan' 
                        : 'text-slate-200'
                    }`}>
                      {evt.type}
                    </span>

                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      evt.source === 'LIVE_AGY'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : evt.source === 'DEMO'
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {evt.source}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      {evt.agent_id ? `@${evt.agent_id}` : 'система'} {evt.task_id ? `• [${evt.task_id}]` : ''}
                    </span>
                    <span className="text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Инспектор структуры JSON */}
        <div className="glass-panel p-5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase">
              Инспектор структуры события
            </h3>
            {selectedEvent && (
              <button
                onClick={() => handleCopy(selectedEvent)}
                className="flex items-center gap-1 text-[11px] font-mono text-director-cyan hover:underline"
              >
                {copiedId === selectedEvent.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Копировать JSON</span>
                  </>
                )}
              </button>
            )}
          </div>

          {selectedEvent ? (
            <pre className="flex-1 p-3.5 rounded-xl bg-black/60 border border-white/5 text-[11px] font-mono text-slate-300 overflow-auto whitespace-pre-wrap leading-relaxed max-h-[500px]">
              {JSON.stringify(selectedEvent, null, 2)}
            </pre>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-slate-500 text-xs py-20 font-mono">
              Выберите любое событие из потока для детального просмотра метаданных.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
