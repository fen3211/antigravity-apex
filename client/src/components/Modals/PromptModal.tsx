import React from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import type { AgentInfo } from '../../types.js';

interface PromptModalProps {
  agent: AgentInfo | null;
  onClose: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({ agent, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!agent) return null;

  const handleCopy = () => {
    if (agent.promptContent) {
      navigator.clipboard.writeText(agent.promptContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl glass-panel p-6 space-y-4 max-h-[85vh] flex flex-col border border-white/15 shadow-glass-card">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-director-cyan" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {agent.name} — System Prompt Specification
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Tier: {agent.model} • Domain: {agent.domain}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-mono transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          <pre className="p-4 rounded-xl bg-black/50 border border-white/5 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
            {agent.promptContent || 'No prompt content specified.'}
          </pre>
        </div>
      </div>
    </div>
  );
};
