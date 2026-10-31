import React, { useState } from 'react';
import { 
  Users, 
  Cpu, 
  FileText, 
  Power, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Sparkles,
  Shield,
  Layers,
  Search
} from 'lucide-react';
import type { AgentInfo } from '../types.js';

interface AgentManagementProps {
  agents: AgentInfo[];
  onToggleAgent: (agentId: string, currentStatus: boolean) => void;
  onViewPrompt: (agent: AgentInfo) => void;
  onViewReport: (agent: AgentInfo) => void;
}

export const AgentManagement: React.FC<AgentManagementProps> = ({
  agents,
  onToggleAgent,
  onViewPrompt,
  onViewReport
}) => {
  const [search, setSearch] = useState('');
  const [filterModel, setFilterModel] = useState<string>('all');

  const filteredAgents = agents.filter(a => {
    const matchesSearch = 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.domain.toLowerCase().includes(search.toLowerCase());
    
    const matchesModel = filterModel === 'all' || a.model.toLowerCase().includes(filterModel.toLowerCase());
    return matchesSearch && matchesModel;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-director-blue" />
            <span>Agent Hierarchy & Registry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Global specialist subagents configured under <code className="text-director-cyan">~/.gemini/config/plugins/ai-director</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter agents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input pl-9 text-xs w-48 sm:w-60"
            />
          </div>

          <select
            value={filterModel}
            onChange={e => setFilterModel(e.target.value)}
            className="glass-input text-xs"
          >
            <option value="all">All Models</option>
            <option value="flash-high">Flash High (Director)</option>
            <option value="flash">Flash (Specialists)</option>
            <option value="pro">Pro (Senior Architect)</option>
          </select>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAgents.map(agent => {
          const isDirector = agent.isDirector || agent.id === 'director';
          const isPro = agent.model === 'pro';

          return (
            <div
              key={agent.id}
              className={`glass-card p-5 space-y-4 relative overflow-hidden flex flex-col justify-between ${
                isDirector 
                  ? 'border-director-blue/30 shadow-glass-active bg-gradient-to-b from-director-blue/[0.05] to-transparent' 
                  : isPro 
                  ? 'border-purple-500/30 bg-gradient-to-b from-purple-500/[0.05] to-transparent' 
                  : ''
              }`}
            >
              {/* Card top */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${
                      isDirector 
                        ? 'bg-director-blue/20 text-director-cyan' 
                        : isPro 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'bg-white/[0.05] text-slate-300'
                    }`}>
                      {isDirector ? <Shield className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {agent.name}
                        {isDirector && (
                          <span className="badge-live text-[9px] py-0 px-1.5">DIRECTOR</span>
                        )}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        @{agent.id}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold border ${
                    agent.status === 'running'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-glow-emerald'
                      : agent.status === 'paused'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-white/5'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                {/* Domain & Model tags */}
                <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
                  {agent.domain}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06] text-[11px] font-mono">
                  <span className={`px-2 py-0.5 rounded border ${
                    isDirector 
                      ? 'bg-director-blue/15 text-blue-300 border-director-blue/25'
                      : isPro 
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/25'
                      : 'bg-white/[0.04] text-slate-300 border-white/10'
                  }`}>
                    Tier: {agent.model}
                  </span>

                  <span className="text-slate-500">
                    Runs: <strong className="text-slate-300 font-normal">{agent.runCount}</strong>
                  </span>

                  <span className="text-emerald-400 ml-auto">
                    {agent.successRate}% Success
                  </span>
                </div>

                {/* Current Task if any */}
                {agent.currentTask && (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Current Assignment:</span>
                    <p className="truncate text-director-cyan">{agent.currentTask}</p>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewPrompt(agent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium border border-white/5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-director-cyan" />
                  <span>Prompt Spec</span>
                </button>

                {agent.lastReport && (
                  <button
                    onClick={() => onViewReport(agent)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/20 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>9-Pt Report</span>
                  </button>
                )}

                {!isDirector && (
                  <button
                    onClick={() => onToggleAgent(agent.id, agent.enabled)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      agent.enabled 
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                    }`}
                    title={agent.enabled ? 'Enabled in dispatch pool' : 'Disabled'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
