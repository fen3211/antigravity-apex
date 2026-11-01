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
  { id: 'backend-developer', label: 'Backend Developer (Flash)', role: 'Node.js, Express, SQLite, Schemas' },
  { id: 'frontend-developer', label: 'Frontend Developer (Flash)', role: 'React, Tailwind, UI, Ergonomics' },
  { id: 'qa-engineer', label: 'QA Engineer (Flash)', role: 'E2E, Integration, Automated Tests' },
  { id: 'code-reviewer', label: 'Code Reviewer (Flash)', role: 'Security & Quality Gate Audit' },
  { id: 'senior-architect', label: 'Senior Architect (Pro-tier)', role: 'Complex concurrency & core architecture' },
  { id: 'researcher', label: 'Researcher (Flash)', role: 'Knowledge base & dependency analysis' },
  { id: 'ui-ux-designer', label: 'UI/UX Designer (Flash)', role: 'UX research & design system' },
  { id: 'legal-compliance', label: 'Legal & Compliance (Flash)', role: 'GDPR, 152-FZ, EU AI Act, 243-FZ, IP & Licensing' }
];

export const ArgonVerdictModal: React.FC<ArgonVerdictModalProps> = ({
  isOpen,
  task,
  onClose,
  onSuccess
}) => {
  const [verdict, setVerdict] = useState('');
  const [targetSpecialist, setTargetSpecialist] = useState('backend-developer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && task) {
      setVerdict('');
      // If task had an assigned specialist previously, suggest it
      const prevSpecialist = AVAILABLE_SPECIALISTS.find(s => s.id === task.assignedAgent);
      if (prevSpecialist) {
        setTargetSpecialist(prevSpecialist.id);
      } else {
        setTargetSpecialist('backend-developer');
      }
      setErrorMessage(null);
    }
  }, [isOpen, task]);

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
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка отправки вердикта в центр управления');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="argon-modal-title"
    >
      <div 
        className="relative w-full max-w-2xl bg-surface-panel/95 border border-pink-500/30 rounded-2xl shadow-glow-argon overflow-hidden backdrop-blur-deep max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Заголовок с градиентом Argon */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-transparent flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/20 text-director-argon shadow-glow-argon shrink-0 mt-0.5">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="argon-modal-title" className="text-base font-bold text-white tracking-tight">
                  Замкнутый цикл Gemini 4 Argon (Уровень 4)
                </h2>
                <span className="badge-argon text-[10px] py-0 px-2 font-mono">
                  L4 DE-ESCALATION
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Фиксация вердикта, выданного Gemini 4 Argon, и возврат задачи на исполнение профильному специалисту на Flash.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрыть окно"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Форма вердикта */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Сведения о задаче */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Задача ID: <strong className="text-white font-mono">{task.id}</strong></span>
              <span className="text-pink-400 font-semibold uppercase">Стадия: Argon_L4</span>
            </div>
            <h3 className="font-semibold text-slate-200 text-sm">{task.title}</h3>
            {task.description && (
              <p className="text-slate-400 text-xs line-clamp-2">{task.description}</p>
            )}
          </div>

          {/* Предупреждение / ошибка */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Поле вердикта */}
          <div className="space-y-1.5">
            <label htmlFor="argon-verdict-input" className="block text-xs font-semibold text-slate-200">
              Архитектурный диагноз и вердикт Argon <span className="text-pink-400">*</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Вставьте стратегию решения, дефекты или пошаговый алгоритм, сформированный Gemini 4 Argon:
            </p>
            <textarea
              id="argon-verdict-input"
              rows={6}
              required
              value={verdict}
              onChange={e => setVerdict(e.target.value)}
              placeholder="Пример: Первопричина дефекта заключается в гонке данных между WebSocket реконнектом и очередью Ingestion. Стратегия: применить мьютекс транзакции в SQLite и вернуть реализацию субагенту backend-developer..."
              className="glass-input w-full font-mono text-xs leading-relaxed resize-y focus:border-pink-500/60 focus:ring-pink-500/30"
            />
          </div>

          {/* Выбор целевого специалиста */}
          <div className="space-y-2">
            <label htmlFor="argon-specialist-select" className="block text-xs font-semibold text-slate-200">
              Назначить исполнителя на Gemini Flash <span className="text-pink-400">*</span>
            </label>
            <p className="text-[11px] text-slate-400">
              По регламенту Antigravity Gemini 4 Argon не пишет рядовой код. Реализация поручается Flash-специалисту:
            </p>
            <select
              id="argon-specialist-select"
              value={targetSpecialist}
              onChange={e => setTargetSpecialist(e.target.value)}
              className="glass-input w-full text-xs"
            >
              {AVAILABLE_SPECIALISTS.map(spec => (
                <option key={spec.id} value={spec.id} className="bg-slate-900 text-slate-100">
                  @{spec.id} — {spec.label} ({spec.role})
                </option>
              ))}
            </select>
          </div>

          {/* Информационный бейдж о де-эскалации */}
          <div className="p-3.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-pink-300">Правило замкнутого цикла (Closed-Loop Rule):</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Задача будет возвращена на стадию <strong className="text-slate-200">Specialist</strong>, а статус сменится на <strong className="text-emerald-400">in_progress</strong>. В шину событий поступит <code className="text-pink-300">escalation.resolved</code> с прикрепленным вердиктом.
              </p>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition-all disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !verdict.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-director-argon to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-semibold shadow-glow-argon transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Де-эскалация...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Подтвердить и направить специалисту</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
