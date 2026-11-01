import React, { useState, useEffect } from 'react';
import { X, Plus, CheckSquare } from 'lucide-react';
import { useToast } from '../Toast.js';
import type { TaskItem } from '../../types.js';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Partial<TaskItem>) => Promise<void>;
}

const AGENT_OPTIONS = [
  { id: 'director', label: 'Director (Flash High)' },
  { id: 'senior-architect', label: 'Senior Architect (Pro-tier)' },
  { id: 'researcher', label: 'Researcher (Flash)' },
  { id: 'frontend-developer', label: 'Frontend Developer (Flash)' },
  { id: 'backend-developer', label: 'Backend Developer (Flash)' },
  { id: 'ui-ux-designer', label: 'UI/UX Designer (Flash)' },
  { id: 'qa-engineer', label: 'QA Engineer (Flash)' },
  { id: 'code-reviewer', label: 'Code Reviewer (Flash)' },
  { id: 'legal-compliance', label: 'Legal Advisor & Tech Writer (Flash)' },
  { id: 'security-engineer', label: 'Security Engineer (Flash/Pro)' },
  { id: 'devops-engineer', label: 'DevOps Engineer (Flash/Pro)' },
  { id: 'database-specialist', label: 'Database Specialist (Flash/Pro)' },
  { id: 'data-engineer', label: 'Data Engineer (Flash/Pro)' },
  { id: 'product-manager', label: 'Product Manager (Flash)' },
  { id: 'ai-evaluation-engineer', label: 'AI Evaluation Engineer (Flash/Pro)' },
  { id: 'performance-engineer', label: 'Performance Engineer (Flash/Pro)' },
  { id: 'accessibility-specialist', label: 'Accessibility Specialist (Flash)' }
];

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('director');
  const [priority, setPriority] = useState<TaskItem['priority']>('medium');
  const [stage] = useState<TaskItem['stage']>('Director_Triage');
  const [isDemo, setIsDemo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        assignedAgent,
        priority,
        stage,
        isDemo
      });
      setTitle('');
      setDescription('');
      toast.success(`Задача "${title.trim()}" успешно поставлена в очередь`, 'Задача создана');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка создания задачи';
      toast.error(msg, 'Сбой создания задачи');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-task-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm dark:bg-black/70 animate-fade-in"
    >
      <div className="w-full max-w-lg bg-pure border border-hairline rounded-lg shadow-modal p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-4 h-4 text-obsidian" />
            <h2 id="new-task-modal-title" className="text-sm font-semibold text-obsidian tracking-tight">
              Создать новую задачу в пайплайн
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно создания задачи"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md border border-hairline text-charcoal hover:text-obsidian hover:bg-surface-subtle transition-colors focus-ring"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-obsidian font-semibold block">
              Заголовок задачи:
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="например: Провести предпусковой аудит Legal Gate по 152-ФЗ"
              className="w-full px-3 py-2 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke focus-ring"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-obsidian font-semibold block">
              Технические требования и критерии приёмки:
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Укажите границы задачи, модифицируемые файлы и необходимые проверки..."
              className="w-full h-24 p-3 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke font-sans resize-none focus-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-obsidian font-semibold block">
                Назначенный исполнитель:
              </label>
              <select
                value={assignedAgent}
                onChange={e => setAssignedAgent(e.target.value)}
                className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
              >
                {AGENT_OPTIONS.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    @{agent.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-obsidian font-semibold block">
                Приоритет:
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskItem['priority'])}
                className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
              >
                <option value="low">Низкий (low)</option>
                <option value="medium">Средний (medium)</option>
                <option value="high">Высокий (high)</option>
                <option value="critical">Критический (critical)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none text-charcoal">
              <input
                type="checkbox"
                checked={isDemo}
                onChange={e => setIsDemo(e.target.checked)}
                className="rounded border-hairline text-obsidian accent-obsidian focus-ring"
              />
              <span>Пометить как демонстрационную (DEMO)</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="refero-btn-secondary text-xs"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="refero-btn-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Создание...' : 'Поставить в очередь'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
