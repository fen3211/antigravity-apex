import React, { useState } from 'react';
import { 
  GitBranch, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Flame, 
  RotateCcw, 
  ArrowRight, 
  ArrowDown, 
  AlertOctagon, 
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import type { TaskItem, EventPayload } from '../types.js';

interface LiveWorkflowProps {
  tasks: TaskItem[];
  events: EventPayload[];
  onSelectTask: (task: TaskItem) => void;
}

export const LiveWorkflow: React.FC<LiveWorkflowProps> = ({ tasks, events, onSelectTask }) => {
  const [selectedStage, setSelectedStage] = useState<string>('Director_Triage');

  // Stages breakdown with tasks
  const stages = [
    {
      id: 'Director_Triage',
      title: 'Director Triage',
      tier: 'Level 0',
      model: 'Gemini 3.8 Flash High',
      role: 'Master Orchestrator',
      description: 'Evaluates task complexity: <15 lines executes Solo; 1-3 files dispatches 1 Specialist; large dispatches multi-agent pipeline (max 3).',
      gateRequirement: 'Autonomous triage decision & context boundary check.'
    },
    {
      id: 'Specialist',
      title: 'Subagent Execution',
      tier: 'Specialists',
      model: 'Gemini Flash',
      role: 'Domain Specialists (Max 3 parallel)',
      description: 'Executes domain-isolated work. Strictly forbidden from modifying shared files simultaneously.',
      gateRequirement: 'Level 1 Self-Verification with compiler/test logs before handoff.'
    },
    {
      id: 'QualityGate_L1',
      title: 'Quality Gate: L1 Self-Verify',
      tier: 'Level 1 Gate',
      model: 'Flash / Test Runner',
      role: 'Executor Self-Check',
      description: 'Specialist runs builds, type-checks, and test suites. 9-point structured report generated.',
      gateRequirement: 'Zero compiler errors, zero test regressions. Evidence required.'
    },
    {
      id: 'Independent_L2',
      title: 'Quality Gate: L2 Independent Audit',
      tier: 'Level 2 Gate',
      model: 'Gemini Flash',
      role: 'QA Engineer & Code Reviewer',
      description: 'Independent audit of changes (>50 lines, schema, auth, contracts). No agent may approve their own work.',
      gateRequirement: 'Independent approval by QA or Code Reviewer.'
    },
    {
      id: 'Approved',
      title: 'Director Final Approval',
      tier: 'Delivery Gate',
      model: 'Gemini 3.8 Flash High',
      role: 'Final Quality Authority',
      description: 'Director certifies all quality gates have passed. Delivers verified code and evidence to the user.',
      gateRequirement: 'Director signoff. Final report rendered.'
    }
  ];

  // Escalation stages
  const escalationStages = [
    {
      id: 'Architect_L3',
      title: 'Level 3: Senior Architect',
      tier: 'Level 3 Escalation',
      model: 'Gemini Pro',
      role: 'Root-Cause & Concurrency Specialist',
      description: 'Triggered when an approach fails verification twice. Investigates subtle race conditions and architectural bugs.',
      gateRequirement: 'Deep diagnosis and revised strategy before retry.'
    },
    {
      id: 'Argon_L4',
      title: 'Level 4: Gemini 4 Argon',
      tier: 'Level 4 Escalation',
      model: 'Gemini 4 Argon High',
      role: 'Supreme AI Authority (Manual Switch)',
      description: 'Triggered upon fundamental architectural impasse or failure of two independent technical strategies. Uses strict Argon Escalation Protocol.',
      gateRequirement: 'Manual prompt pack dispatch. Implementation returns to Flash.'
    }
  ];

  const getTasksForStage = (stageId: string) => tasks.filter(t => t.stage === stageId);
  const activeStageInfo = [...stages, ...escalationStages].find(s => s.id === selectedStage) || stages[0];
  const activeStageTasks = getTasksForStage(selectedStage);

  return (
    <div className="space-y-6">
      {/* Title & Legend */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-director-cyan" />
            <span>Multi-Agent Live Workflow Map</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline: Director Triage → Subagents → Level 1 Verification → Independent L2 Audit → Final Approval
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-400" />
            <span className="text-slate-300">Standard Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500/20 border border-purple-400" />
            <span className="text-slate-300">Level 3 Architect</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-pink-500/20 border border-pink-400 shadow-glow-argon" />
            <span className="text-slate-300">Level 4 Argon</span>
          </div>
        </div>
      </div>

      {/* Main Workflow Visualization Canvas */}
      <div className="glass-panel p-6 space-y-8 overflow-x-auto">
        {/* Main Linear Flow */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 min-w-[800px]">
          {stages.map((stage, idx) => {
            const stageTasks = getTasksForStage(stage.id);
            const isSelected = selectedStage === stage.id;
            const hasActiveTasks = stageTasks.some(t => t.status === 'in_progress');

            return (
              <React.Fragment key={stage.id}>
                {/* Node Box */}
                <div
                  onClick={() => setSelectedStage(stage.id)}
                  className={`flex-1 p-4 rounded-2xl cursor-pointer transition-all relative border ${
                    isSelected
                      ? 'bg-director-blue/15 border-director-cyan shadow-glass-active'
                      : hasActiveTasks
                      ? 'bg-surface-card border-director-blue/40 hover:border-white/20'
                      : 'bg-surface-card border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                    <span className="text-director-cyan">{stage.tier}</span>
                    <span className="text-slate-400">{stage.model}</span>
                  </div>

                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {stage.title}
                    {hasActiveTasks && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </h3>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {stage.role}
                  </p>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Tasks:</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      stageTasks.length > 0 ? 'bg-white/10 text-white' : 'text-slate-600'
                    }`}>
                      {stageTasks.length}
                    </span>
                  </div>
                </div>

                {/* Connector Arrow */}
                {idx < stages.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 text-slate-600">
                    <ArrowRight className="w-5 h-5 hidden lg:block" />
                    <ArrowDown className="w-5 h-5 lg:hidden" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Escalation Branches (Senior Architect & Gemini 4 Argon) */}
        <div className="pt-6 border-t border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-director-argon animate-pulse" />
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Escalation Pathways (Failure & Impasse Handling)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {escalationStages.map((esc) => {
              const escTasks = getTasksForStage(esc.id);
              const isSelected = selectedStage === esc.id;
              const isArgon = esc.id === 'Argon_L4';

              return (
                <div
                  key={esc.id}
                  onClick={() => setSelectedStage(esc.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? isArgon
                        ? 'bg-pink-500/15 border-pink-400 shadow-glow-argon'
                        : 'bg-purple-500/15 border-purple-400'
                      : isArgon
                      ? 'bg-surface-card border-pink-500/20 hover:border-pink-500/40'
                      : 'bg-surface-card border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                    <span className={isArgon ? 'text-pink-400 font-semibold' : 'text-purple-400'}>
                      {esc.tier}
                    </span>
                    <span className="text-slate-400">{esc.model}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {esc.title}
                    {isArgon && (
                      <span className="badge-argon text-[9px] py-0 px-1.5">MANUAL SWITCH</span>
                    )}
                  </h3>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {esc.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Active Escalations:</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      escTasks.length > 0 ? 'bg-pink-500/20 text-pink-300' : 'text-slate-600'
                    }`}>
                      {escTasks.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-director-cyan">{activeStageInfo.tier}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">{activeStageInfo.model}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {activeStageInfo.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {activeStageInfo.description}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 max-w-sm text-xs space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Quality Gate Standard:
            </span>
            <p className="text-slate-300">{activeStageInfo.gateRequirement}</p>
          </div>
        </div>

        {/* Tasks in this Stage */}
        <div className="pt-3 border-t border-white/[0.08]">
          <h4 className="text-xs font-semibold text-slate-400 mb-2.5">
            Tasks currently in this stage ({activeStageTasks.length}):
          </h4>

          {activeStageTasks.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 font-mono">
              No tasks currently queued in {activeStageInfo.title}.
            </p>
          ) : (
            <div className="space-y-2">
              {activeStageTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-3 rounded-xl bg-surface-card hover:bg-white/[0.05] border border-white/5 cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{task.title}</span>
                      <span className="text-director-cyan font-mono">@{task.assignedAgent}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate max-w-xl">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-slate-500">
                      Retries: {task.retryCount}/{task.maxRetries}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
