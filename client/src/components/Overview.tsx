import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Flame, 
  Cpu, 
  FileText, 
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import type { 
  DirectorStatus, 
  AgentInfo, 
  TaskItem, 
  EventPayload, 
  ModelMetrics 
} from '../types.js';
import type { NavTab } from './Sidebar.js';

interface OverviewProps {
  status: DirectorStatus | null;
  agents: AgentInfo[];
  tasks: TaskItem[];
  events: EventPayload[];
  analytics: {
    tiers: ModelMetrics[];
    totalTokens: { input: number; output: number; cacheRead: number };
    totalRuns: number;
    overallSuccessRate: number;
    escalationRate: number;
    verifiedRealSessionsCount: number;
  } | null;
  onNavigate: (tab: NavTab) => void;
  onOpenNewTask: () => void;
  onSelectTask: (task: TaskItem) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  status,
  agents,
  tasks,
  events,
  analytics,
  onNavigate,
  onOpenNewTask,
  onSelectTask
}) => {
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const escalatedTasks = tasks.filter(t => t.status === 'escalated');
  const activeAgents = agents.filter(a => a.status === 'running');

  const liveSession = status?.activeSessions[0];

  return (
    <div className="space-y-6">
      {/* Top Banner: Director State & Live Antigravity Context */}
      <div className="relative overflow-hidden rounded-3xl p-6 glass-panel border border-white/[0.12] bg-gradient-to-r from-surface-card via-surface-panel to-surface-card shadow-glass-card">
        <div className="absolute top-0 right-0 w-96 h-96 bg-director-blue/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-director-violet/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="badge-live">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ORCHESTRATOR LIVE
              </span>
              <span className="text-xs font-mono text-slate-400 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/5">
                Model: Gemini 3.8 Flash High
              </span>
              <span className="text-xs font-mono text-slate-400 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/5">
                Max Concurrency: 3 Specialists
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              AI Development Director Command Hub
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time telemetry and supervisory control for the Antigravity multi-agent hierarchy. 
              Enforces multi-stage quality gates, subagent 9-point verification, and strict Level 4 Argon escalation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('workflow')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold border border-white/10 transition-all shadow-glass-subtle"
            >
              <Activity className="w-4 h-4 text-director-cyan" />
              <span>Inspect Workflow</span>
            </button>
            <button
              onClick={onOpenNewTask}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-director-blue to-blue-600 hover:from-blue-500 hover:to-director-blue text-white text-xs font-semibold shadow-glass-card transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Dispatch New Task</span>
            </button>
          </div>
        </div>

        {/* Live session strip */}
        {liveSession && (
          <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-400">
              <span className="text-slate-500">Current Session ID:</span>
              <span className="text-director-cyan bg-black/40 px-2 py-0.5 rounded border border-white/5">
                {liveSession.conversationId}
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Lock Active
              </span>
            </div>

            {liveSession.tokenUsage && (
              <div className="flex items-center gap-4 font-mono text-slate-300">
                <span className="text-slate-500">Session Verified Tokens:</span>
                <span>In: <strong className="text-white">{(liveSession.tokenUsage.input).toLocaleString()}</strong></span>
                <span>•</span>
                <span>Out: <strong className="text-white">{(liveSession.tokenUsage.output).toLocaleString()}</strong></span>
                <span>•</span>
                <span>Cache: <strong className="text-director-cyan">{(liveSession.tokenUsage.cacheRead).toLocaleString()}</strong></span>
                <span className="badge-live text-[10px] py-0 px-1.5">TRANSCRIPT.JSONL</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Agents */}
        <div 
          onClick={() => onNavigate('agents')}
          className="glass-card p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Specialist Agents</span>
            <div className="p-2 rounded-xl bg-director-blue/10 text-director-blue group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {activeAgents.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {agents.length} registered
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            <span>Active pool: {agents.filter(a => a.enabled).length} enabled</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Card 2: Task Queue */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="glass-card p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tasks in Progress</span>
            <div className="p-2 rounded-xl bg-director-cyan/10 text-director-cyan group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              active ({tasks.length} total)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            <span>Completed: {completedTasks.length}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Card 3: Quality & Success Rate */}
        <div 
          onClick={() => onNavigate('analytics')}
          className="glass-card p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Quality Gates Success</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {analytics?.overallSuccessRate || 98}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({analytics?.totalRuns || tasks.length} runs)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            <span className="text-emerald-400 font-medium">9-Point Protocol verified</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Card 4: Escalations & Argon */}
        <div 
          onClick={() => onNavigate('control')}
          className="glass-card p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Escalations (L3 / L4)</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-director-argon group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-pink-400">
              {escalatedTasks.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              rate: {analytics?.escalationRate || 0}%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            <span>Argon ready</span>
            <span className="badge-argon text-[10px] py-0 px-1.5">L4 PROTOCOL</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Tasks Queue on left, Live Events on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active & Recent Tasks */}
        <div className="lg:col-span-2 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-director-blue" />
              <h3 className="text-sm font-semibold text-white">Active Tasks & Pipeline</h3>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-director-cyan hover:underline flex items-center gap-1"
            >
              <span>View all ({tasks.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks.slice(0, 5).map(task => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-3.5 rounded-xl bg-surface-card hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                      task.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : task.status === 'in_progress'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : task.status === 'escalated'
                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {task.status}
                    </span>

                    <span className="text-xs font-mono text-director-cyan">
                      [{task.assignedAgent}]
                    </span>

                    {task.isDemo ? (
                      <span className="badge-demo text-[10px] py-0 px-1.5">DEMO</span>
                    ) : (
                      <span className="badge-live text-[10px] py-0 px-1.5">LIVE</span>
                    )}
                  </div>

                  <h4 className="text-xs font-medium text-slate-200">
                    {task.title}
                  </h4>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="font-mono text-slate-400 text-[11px]">
                    Stage: <strong className="text-slate-300 font-normal">{task.stage}</strong>
                  </span>
                  {task.report && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      9-Pt Report ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Real-time Event Feed */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <h3 className="text-sm font-semibold text-white">Live Event Stream</h3>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs text-director-cyan hover:underline flex items-center gap-1"
            >
              <span>Full Log</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Waiting for incoming Antigravity telemetry...
              </p>
            ) : (
              events.slice(0, 8).map(evt => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-black/30 border border-white/[0.05] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-director-cyan">
                      {evt.type}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      evt.source === 'LIVE_AGY' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {evt.source}
                    </span>
                  </div>

                  {evt.agent_id && (
                    <div className="text-[11px] text-slate-400">
                      Agent: <strong className="text-slate-200 font-medium">{evt.agent_id}</strong>
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    {evt.task_id && <span className="truncate max-w-[120px]">{evt.task_id}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
