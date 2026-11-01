import React, { useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, FileCode } from 'lucide-react';
import type { SubagentReport } from '../../types.js';

interface ReportModalProps {
  report: SubagentReport | null;
  taskTitle?: string;
  agentId?: string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  report,
  taskTitle,
  agentId,
  onClose
}) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && report) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [report, onClose]);

  if (!report) return null;

  const isSuccess = report.status === 'SUCCESS';
  const isBlocked = report.status === 'BLOCKED';

  const getStatusBadge = () => {
    if (isSuccess) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-terminal-bg text-terminal-green border border-terminal-border">
          <CheckCircle2 className="w-3.5 h-3.5" />
          SUCCESS
        </span>
      );
    }
    if (isBlocked) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-warning-bg text-warning-text border border-warning-border">
          <AlertTriangle className="w-3.5 h-3.5" />
          BLOCKED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-danger-bg text-danger-text border border-danger-border">
        <AlertCircle className="w-3.5 h-3.5" />
        FAILURE
      </span>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm dark:bg-black/70 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full max-w-2xl bg-pure border border-hairline rounded-lg shadow-modal p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-hairline gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-obsidian shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h2 id="report-modal-title" className="text-sm font-semibold text-obsidian tracking-tight">
                  9-пунктный верификационный отчёт субагента
                </h2>
                {getStatusBadge()}
              </div>
              <p className="text-[11px] font-mono text-stone mt-0.5">
                Задача: {taskTitle || report.taskName} {agentId ? `• Исполнитель: @${agentId}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно отчёта"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md border border-hairline text-charcoal hover:text-obsidian hover:bg-surface-subtle transition-colors focus-ring"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 9 Structured Protocol Items */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs">
          {/* Items 1 & 2 */}
          <div className="p-3 rounded-md bg-surface-subtle border border-hairline space-y-1">
            <span className="text-[10px] uppercase font-mono text-stone font-medium block">
              1. Название задачи и 2. Подтверждённый статус:
            </span>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-obsidian text-[13px]">{report.taskName}</span>
              <span className="font-mono font-bold">{getStatusBadge()}</span>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-3 rounded-md bg-surface-subtle border border-hairline space-y-1">
            <span className="text-[10px] uppercase font-mono text-stone font-medium block">
              3. Что сделано:
            </span>
            <p className="text-charcoal leading-relaxed text-[13px] whitespace-pre-wrap">{report.summary}</p>
          </div>

          {/* Item 4 */}
          <div className="p-3 rounded-md bg-surface-subtle border border-hairline space-y-1">
            <span className="text-[10px] uppercase font-mono text-stone font-medium block">
              4. Изменённые и созданные файлы:
            </span>
            {report.modifiedFiles && report.modifiedFiles.length > 0 ? (
              <ul className="space-y-1 font-mono text-obsidian text-xs">
                {report.modifiedFiles.map((file, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-graphite" />
                    <span>{file}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-stone italic text-xs">Файлы напрямую не модифицировались</span>
            )}
          </div>

          {/* Items 5 & 6 */}
          <div className="p-3 rounded-md bg-surface-subtle border border-hairline space-y-2">
            <span className="text-[10px] uppercase font-mono text-stone font-medium block">
              5. Выполненные проверки и 6. Результаты проверок (Логи и факты):
            </span>
            <div className="space-y-2">
              {report.executedChecks && report.executedChecks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {report.executedChecks.map((check, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-pure border border-hairline font-mono text-[10px] text-charcoal">
                      ✓ {check}
                    </span>
                  ))}
                </div>
              )}
              <pre className="p-2.5 rounded bg-pure border border-hairline font-mono text-xs text-obsidian whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {report.checkResults}
              </pre>
            </div>
          </div>

          {/* Item 7 */}
          <div className="p-3 rounded-md bg-surface-subtle border border-hairline space-y-1">
            <span className="text-[10px] uppercase font-mono text-stone font-medium block">
              7. Обнаруженные проблемы и оставшиеся риски:
            </span>
            <p className="text-charcoal leading-relaxed text-[13px]">
              {report.issuesAndRisks || 'Рисков не обнаружено.'}
            </p>
          </div>

          {/* Items 8 & 9 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-surface-subtle border border-hairline space-y-1">
              <span className="text-[10px] uppercase font-mono text-stone font-medium block">
                8. Незавершённые пункты:
              </span>
              <p className="text-charcoal text-xs">
                {report.pendingItems || 'Нет'}
              </p>
            </div>

            <div className="p-3 rounded-md bg-surface-subtle border border-hairline space-y-1">
              <span className="text-[10px] uppercase font-mono text-stone font-medium block">
                9. Рекомендованные дальнейшие шаги:
              </span>
              <p className="text-obsidian font-medium text-xs">
                {report.nextSteps || 'Финальное утверждение Директора'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs font-mono text-slate">
          <span>Стандарт верификации: Gate L1/L2</span>
          <button
            type="button"
            onClick={onClose}
            className="refero-btn-secondary text-xs"
          >
            Закрыть отчёт
          </button>
        </div>
      </div>
    </div>
  );
};
