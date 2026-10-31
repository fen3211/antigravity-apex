import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
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
  if (!report) return null;

  const isSuccess = report.status === 'SUCCESS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl glass-panel p-6 space-y-5 max-h-[85vh] flex flex-col border border-white/15 shadow-glass-card">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Subagent 9-Point Verification Report
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  isSuccess 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {report.status}
                </span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Task: {taskTitle || report.taskName} {agentId ? `• Executor: @${agentId}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 9 Structured Points List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs">
          {/* 1 & 2 */}
          <div className="p-3 rounded-xl bg-surface-card border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              1. Task Name & 2. Verified Status:
            </span>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{report.taskName}</span>
              <span className="font-mono text-emerald-400">{report.status}</span>
            </div>
          </div>

          {/* 3. What was done */}
          <div className="p-3 rounded-xl bg-surface-card border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              3. What Was Done:
            </span>
            <p className="text-slate-200 leading-relaxed">{report.summary}</p>
          </div>

          {/* 4. Modified files */}
          <div className="p-3 rounded-xl bg-surface-card border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              4. Modified Files:
            </span>
            {report.modifiedFiles && report.modifiedFiles.length > 0 ? (
              <ul className="space-y-0.5 font-mono text-director-cyan text-[11px]">
                {report.modifiedFiles.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            ) : (
              <span className="text-slate-500 italic">No files modified directly</span>
            )}
          </div>

          {/* 5 & 6. Executed checks and results */}
          <div className="p-3 rounded-xl bg-surface-card border border-white/5 space-y-2">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              5. Executed Checks & 6. Check Results (Evidence):
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5">
                {report.executedChecks?.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-white/5 font-mono text-[10px] text-slate-300">
                    {c}
                  </span>
                ))}
              </div>
              <p className="p-2 rounded bg-black/40 border border-white/5 font-mono text-emerald-300 text-[11px] whitespace-pre-wrap">
                {report.checkResults}
              </p>
            </div>
          </div>

          {/* 7. Issues and risks */}
          <div className="p-3 rounded-xl bg-surface-card border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              7. Discovered Issues & Remaining Risks:
            </span>
            <p className="text-amber-300/90 leading-relaxed">
              {report.issuesAndRisks || 'None identified.'}
            </p>
          </div>

          {/* 8 & 9. Pending and next steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-card border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                8. Pending Items:
              </span>
              <p className="text-slate-300 text-[11px]">
                {report.pendingItems || 'None'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-card border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                9. Recommended Next Steps:
              </span>
              <p className="text-director-cyan text-[11px]">
                {report.nextSteps || 'Proceed to Director final approval'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
