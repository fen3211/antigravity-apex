import React, { useState } from 'react';
import { X, Sparkles, CheckSquare } from 'lucide-react';
import type { TaskItem } from '../../types.js';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Partial<TaskItem>) => Promise<void>;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('director');
  const [priority, setPriority] = useState<TaskItem['priority']>('medium');
  const [stage, setStage] = useState<TaskItem['stage']>('Director_Triage');
  const [isDemo, setIsDemo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Reset
      setTitle('');
      setDescription('');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel p-6 space-y-5 border border-white/15 shadow-glass-card">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-director-blue" />
            <h3 className="text-sm font-bold text-white">
              Create & Dispatch New Task
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Task Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Implement WebSocket Reconnect Logic"
              className="glass-input w-full"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Description & Specifications:
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide exact boundaries, files to touch, and constraints..."
              className="glass-input w-full h-24 resize-none font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Assigned Specialist:
              </label>
              <select
                value={assignedAgent}
                onChange={e => setAssignedAgent(e.target.value)}
                className="glass-input w-full"
              >
                <option value="director">director (Director Triage)</option>
                <option value="researcher">researcher (Docs & Codebase)</option>
                <option value="frontend-developer">frontend-developer (UI/React)</option>
                <option value="backend-developer">backend-developer (Node/DB/API)</option>
                <option value="ui-ux-designer">ui-ux-designer (Ergonomics)</option>
                <option value="qa-engineer">qa-engineer (Testing)</option>
                <option value="code-reviewer">code-reviewer (Audit)</option>
                <option value="senior-architect">senior-architect (Pro Tier)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Priority:
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="glass-input w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 space-y-1">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-300">
              <input
                type="checkbox"
                checked={isDemo}
                onChange={e => setIsDemo(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              <span>Mark as DEMO Task (Non-production simulation)</span>
            </label>
            <p className="text-[11px] text-slate-500 pl-5">
              Distinguishes simulation exercises from verified local Antigravity workloads.
            </p>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-director-blue to-blue-600 hover:from-blue-500 text-white font-semibold shadow-glass-subtle transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Creating...' : 'Dispatch Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
