import React, { useState, useEffect } from 'react';
import { Flame, X, Check, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import type { TaskItem } from '../../types.js';

interface ArgonVerdictModalProps {
  isOpen: boolean;
  task: TaskItem | null;
  onClose: () => void;
  onSuccess?: (updatedTask: TaskItem) => void;
}

const AVAILABLE_SPECIALISTS = [
  { id: 'director', label: 'Director / Orchestrator (Flash High)', role: 'Triage, coordination & task delegation' },
  { id: 'backend-developer', label: 'Backend Developer (Flash)', role: 'Node.js, Express, SQLite, Schemas' },
  { id: 'frontend-developer', label: 'Frontend Developer (Flash)', role: 'React, Tailwind, UI, Ergonomics' },
  { id: 'qa-engineer', label: 'QA Engineer (Flash)', role: 'E2E, Integration, Automated Tests' },
  { id: 'code-reviewer', label: 'Code Reviewer (Flash)', role: 'Security & Quality Gate Audit' },
  { id: 'senior-architect', label: 'Senior Architect (Pro-tier)', role: 'Complex concurrency & core architecture' },
  { id: 'researcher', label: 'Researcher (Flash)', role: 'Knowledge base & dependency analysis' },
  { id: 'ui-ux-designer', label: 'UI/UX Designer (Flash)', role: 'UX research & design system' },
  { id: 'legal-compliance', label: 'Legal Advisor & Tech Writer (Flash)', role: '152-FZ, 243-FZ, GDPR, IP & Tech Docs' },
  { id: 'security-engineer', label: 'Security Engineer (Flash/Pro)', role: 'OWASP, secrets audit, prompt injection defenses' },
  { id: 'devops-engineer', label: 'DevOps Engineer (Flash/Pro)', role: 'GitHub Actions, Docker, SRE & resilience' },
  { id: 'product-manager', label: 'Product Manager (Flash)', role: 'User stories, acceptance criteria & MVP scoping' },
  { id: 'ai-evaluation-engineer', label: 'AI Evaluation Engineer (Flash/Pro)', role: 'Agent reliability, evals & benchmarks' },
  { id: 'performance-engineer', label: 'Performance Engineer (Flash/Pro)', role: 'Core Web Vitals, memory leaks & SQL tuning' },
  { id: 'accessibility-specialist', label: 'Accessibility Specialist (Flash)', role: 'WCAG 2.1/2.2 AA/AAA & semantic a11y' },
  { id: 'database-specialist', label: 'Database Specialist (Flash/Pro)', role: 'Schema design, migrations, ACID & lock contention' },
  { id: 'data-engineer', label: 'Data Engineer (Flash/Pro)', role: 'ETL/ELT, streaming, parsing & data quality' }
];

export const ArgonVerdictModal: React.FC<ArgonVerdictModalProps> = ({
  isOpen,
  task,
  onClose,
  onSuccess
}) => {
  const [verdict, setVerdict] = useState('');
  const [targetSpecialist, setTargetSpecialist] = useState(() => task?.assignedAgent || 'backend-developer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verdict.trim()) {
      setErrorMessage('Пожалуйста, введите вердикт или архитектурную стратегию от Gemini 4 Argon.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.submitArgonVerdict({
        taskId: task.id,
        verdict: verdict.trim(),
        targetSpecialist
      });

      if (res.success && res.task) {
        onSuccess?.(res.task);
        onClose();
      } else {
        setErrorMessage('Не удалось зафиксировать вердикт Аргона. Попробуйте снова.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка отправки вердикта в центр управления';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm dark:bg-black/70 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="argon-modal-title"
    >
      <div 
        className="w-full max-w-2xl bg-pure border border-hairline rounded-lg shadow-modal p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-hairline gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-argon-bg border border-argon-border flex items-center justify-center text-argon-text shrink-0 mt-0.5">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="argon-modal-title" className="text-base font-semibold text-obsidian tracking-tight">
                  Замкнутый цикл Gemini 4 Argon (Уровень 4)
                </h2>
                <span className="badge-argon text-[10px] py-0 px-2 font-mono">
                  L4 DE-ESCALATION
                </span>
              </div>
              <p className="text-xs text-stone mt-1 leading-relaxed">
                Фиксация архитектурного вердикта Gemini 4 Argon и возврат задачи на исполнение профильному специалисту на Flash.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md border border-hairline text-charcoal hover:text-obsidian hover:bg-surface-subtle transition-colors focus-ring"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
          {/* Task Info Context */}
          <div className="p-3 rounded-md bg-surface-subtle border border-hairline space-y-1">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-stone">Задача ID: <strong className="text-obsidian">{task.id}</strong></span>
              <span className="text-argon-text font-semibold uppercase">Стадия: Argon_L4</span>
            </div>
            <h3 className="font-semibold text-obsidian text-sm">{task.title}</h3>
            {task.description && (
              <p className="text-charcoal text-xs line-clamp-2">{task.description}</p>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-md bg-danger-bg border border-danger-border text-xs text-danger-text flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Verdict Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="argon-verdict-input" className="block text-xs font-semibold text-obsidian">
              Архитектурный диагноз и вердикт Argon <span className="text-argon-text">*</span>
            </label>
            <p className="text-[11px] text-stone">
              Вставьте стратегию решения, исправленный паттерн или рекомендации, сформированные Gemini 4 Argon:
            </p>
            <textarea
              id="argon-verdict-input"
              rows={5}
              required
              value={verdict}
              onChange={e => setVerdict(e.target.value)}
              placeholder="Пример: Первопричина дефекта заключается в гонке данных между реконнектом WebSocket и очередью событий. Решение: применить сериализованную транзакцию в SQLite и вернуть реализацию backend-developer..."
              className="w-full p-3 bg-pure border border-hairline rounded-md font-mono text-xs text-obsidian placeholder-smoke leading-relaxed resize-y focus-ring"
            />
          </div>

          {/* Specialist Selection */}
          <div className="space-y-1.5">
            <label htmlFor="argon-specialist-select" className="block text-xs font-semibold text-obsidian">
              Назначить исполнителя на Gemini Flash <span className="text-argon-text">*</span>
            </label>
            <p className="text-[11px] text-stone">
              По регламенту Antigravity Gemini 4 Argon не пишет рядовой код. Реализация поручается Flash-специалисту:
            </p>
            <select
              id="argon-specialist-select"
              value={targetSpecialist}
              onChange={e => setTargetSpecialist(e.target.value)}
              className="w-full px-3 py-2 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
            >
              {AVAILABLE_SPECIALISTS.map(spec => (
                <option key={spec.id} value={spec.id}>
                  @{spec.id} — {spec.label}
                </option>
              ))}
            </select>
          </div>

          {/* Protocol Rule Callout */}
          <div className="p-3 rounded-md bg-surface-subtle border border-hairline text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-terminal-green shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-obsidian">Правило замкнутого цикла (Closed-Loop Rule):</span>
              <p className="text-charcoal leading-relaxed text-[11px]">
                Задача будет возвращена на стадию <strong className="text-obsidian">Specialist</strong> со статусом <strong className="text-terminal-green">in_progress</strong>. В шину событий поступит <code className="font-mono text-obsidian">escalation.resolved</code> с прикрепленным вердиктом.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-hairline flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="refero-btn-secondary text-xs"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !verdict.trim()}
              className="refero-btn-primary text-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-pure border-t-transparent rounded-full animate-spin" />
                  <span>Де-эскалация...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Подтвердить и вернуть специалисту</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
