import React, { useEffect } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import type { AgentInfo } from '../../types.js';

interface PromptModalProps {
  agent: AgentInfo | null;
  onClose: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({ agent, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && agent) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [agent, onClose]);

  if (!agent) return null;

  const handleCopy = () => {
    if (agent.promptContent) {
      navigator.clipboard.writeText(agent.promptContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm dark:bg-black/70 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-modal-title"
    >
      <div className="w-full max-w-3xl bg-pure border border-hairline rounded-lg shadow-modal p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-hairline gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-obsidian shrink-0" />
            <div>
              <h2 id="prompt-modal-title" className="text-sm font-semibold text-obsidian tracking-tight">
                {agent.name} — Системная спецификация промпта
              </h2>
              <span className="text-[11px] font-mono text-stone">
                Уровень: {agent.model} • Специализация: {agent.domain}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="refero-btn-secondary text-xs py-1 px-2.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-terminal-green" /> : <Copy className="w-3.5 h-3.5 text-graphite" />}
              <span>{copied ? 'Скопировано' : 'Копировать'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть окно промпта"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md border border-hairline text-charcoal hover:text-obsidian hover:bg-surface-subtle transition-colors focus-ring"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prompt Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          <pre className="p-4 rounded-md bg-surface-subtle border border-hairline text-xs font-mono text-obsidian whitespace-pre-wrap leading-relaxed selection:bg-obsidian selection:text-pure">
            {agent.promptContent || 'Промпт не задан или файл пуст.'}
          </pre>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-hairline flex items-center justify-between text-xs font-mono text-slate">
          <span>Спецификация агента</span>
          <span>@{agent.id}</span>
        </div>
      </div>
    </div>
  );
};
