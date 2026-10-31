import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldAlert, 
  Flame, 
  Terminal, 
  Save, 
  Check, 
  AlertTriangle, 
  Play, 
  FileCode,
  Copy
} from 'lucide-react';
import type { ControlSettings } from '../types.js';

interface ControlCenterProps {
  settings: ControlSettings | null;
  onUpdateSettings: (settings: Partial<ControlSettings>) => Promise<boolean>;
  onGenerateArgonPack: (data: {
    issueTitle: string;
    rootCauseHypothesis: string;
    failedAttempt1: string;
    failedAttempt2: string;
    isolatedContextSnippet: string;
    targetQuestion: string;
  }) => Promise<{ promptPack: string; filename: string }>;
  onRunPrompt: (prompt: string, agentName: string, confirm: boolean) => Promise<{ success: boolean; output: string; error?: string }>;
}

export const ControlCenter: React.FC<ControlCenterProps> = ({
  settings,
  onUpdateSettings,
  onGenerateArgonPack,
  onRunPrompt
}) => {
  // Settings Form state
  const [maxAgents, setMaxAgents] = useState<number>(settings?.maxConcurrentAgents || 3);
  const [maxRetries, setMaxRetries] = useState<number>(settings?.maxRetryAttempts || 2);
  const [escalationPolicy, setEscalationPolicy] = useState<'strict' | 'relaxed'>(
    settings?.escalationPolicy || 'strict'
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Argon Escalation Pack Generator state
  const [argonIssue, setArgonIssue] = useState('');
  const [argonHypothesis, setArgonHypothesis] = useState('');
  const [argonAttempt1, setArgonAttempt1] = useState('');
  const [argonAttempt2, setArgonAttempt2] = useState('');
  const [argonSnippet, setArgonSnippet] = useState('');
  const [argonQuestion, setArgonQuestion] = useState('');
  const [generatedPack, setGeneratedPack] = useState<string | null>(null);
  const [isGeneratingArgon, setIsGeneratingArgon] = useState(false);
  const [copiedPack, setCopiedPack] = useState(false);

  // Safe CLI execution state
  const [cliPrompt, setCliPrompt] = useState('');
  const [cliAgent, setCliAgent] = useState('director');
  const [cliConfirmed, setCliConfirmed] = useState(false);
  const [cliRunning, setCliRunning] = useState(false);
  const [cliOutput, setCliOutput] = useState<{ success: boolean; text: string } | null>(null);

  // Sync settings when loaded
  React.useEffect(() => {
    if (settings) {
      setMaxAgents(settings.maxConcurrentAgents);
      setMaxRetries(settings.maxRetryAttempts);
      setEscalationPolicy(settings.escalationPolicy);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const ok = await onUpdateSettings({
      maxConcurrentAgents: maxAgents,
      maxRetryAttempts: maxRetries,
      escalationPolicy
    });
    setIsSavingSettings(false);
    if (ok) {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    }
  };

  const handleGenerateArgon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!argonIssue || !argonHypothesis) {
      alert('Please fill in the issue title and root cause hypothesis.');
      return;
    }
    setIsGeneratingArgon(true);
    try {
      const res = await onGenerateArgonPack({
        issueTitle: argonIssue,
        rootCauseHypothesis: argonHypothesis,
        failedAttempt1: argonAttempt1 || 'Attempt 1 failed verification tests.',
        failedAttempt2: argonAttempt2 || 'Attempt 2 encountered architectural regression.',
        isolatedContextSnippet: argonSnippet || '// Minimal isolated code snippet',
        targetQuestion: argonQuestion || 'Provide architectural diagnosis and resolution strategy.'
      });
      setGeneratedPack(res.promptPack);
    } catch (err: any) {
      alert(err.message || 'Failed generating Argon pack');
    } finally {
      setIsGeneratingArgon(false);
    }
  };

  const handleRunCLI = async () => {
    if (!cliConfirmed) {
      alert('Explicit confirmation is required before running commands through agy CLI.');
      return;
    }
    if (!cliPrompt.trim()) {
      alert('Prompt cannot be empty.');
      return;
    }

    setCliRunning(true);
    setCliOutput(null);
    try {
      const res = await onRunPrompt(cliPrompt, cliAgent, cliConfirmed);
      setCliOutput({
        success: res.success,
        text: res.success ? res.output : (res.error || 'Execution failed')
      });
    } catch (err: any) {
      setCliOutput({
        success: false,
        text: err.message || 'CLI invocation failed'
      });
    } finally {
      setCliRunning(false);
    }
  };

  const handleCopyPack = () => {
    if (!generatedPack) return;
    navigator.clipboard.writeText(generatedPack);
    setCopiedPack(true);
    setTimeout(() => setCopiedPack(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="glass-panel p-5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-director-blue" />
          <span>Supervisory Control & Governance</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust multi-agent concurrency limits, synthesize Level 4 Argon escalation packages, and run authenticated agy tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Director Operational Limits */}
        <div className="glass-panel p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
            <Sliders className="w-4 h-4 text-director-cyan" />
            <h3 className="text-sm font-bold text-white">Director Governance Parameters</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Limit: Concurrency */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-slate-300 font-medium">
                  Max Parallel Subagents: <strong className="text-white font-mono">{maxAgents}</strong>
                </label>
                <span className="text-[11px] font-mono text-slate-500">Cap: 3 (Enforced by Director)</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                value={maxAgents}
                onChange={e => setMaxAgents(parseInt(e.target.value, 10))}
                className="w-full accent-director-blue cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Rule 5: Maximum 3 parallel subagents permitted simultaneously to preserve context & token efficiency.
              </p>
            </div>

            {/* Limit: Retries */}
            <div className="space-y-1.5 pt-3 border-t border-white/5">
              <div className="flex justify-between">
                <label className="text-slate-300 font-medium">
                  Max Retry Attempts Before Escalation: <strong className="text-white font-mono">{maxRetries}</strong>
                </label>
                <span className="text-[11px] font-mono text-slate-500">Cap: 2 attempts</span>
              </div>
              <input
                type="range"
                min="1"
                max="2"
                value={maxRetries}
                onChange={e => setMaxRetries(parseInt(e.target.value, 10))}
                className="w-full accent-director-blue cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Rule 5: Never repeat a failed approach more than 2 times. Attempt 3 automatically escalates to Senior Architect.
              </p>
            </div>

            {/* Escalation Policy */}
            <div className="space-y-1.5 pt-3 border-t border-white/5">
              <label className="text-slate-300 font-medium block">
                Escalation Rigor Policy:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="policy"
                    checked={escalationPolicy === 'strict'}
                    onChange={() => setEscalationPolicy('strict')}
                    className="accent-director-blue"
                  />
                  <span>Strict (Require 2 failed tests before L3/L4)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="policy"
                    checked={escalationPolicy === 'relaxed'}
                    onChange={() => setEscalationPolicy('relaxed')}
                    className="accent-director-blue"
                  />
                  <span>Relaxed</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
            {settingsSaved && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Settings Synced to SQLite!
              </span>
            )}
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-director-blue to-blue-600 text-white text-xs font-semibold shadow-glass-subtle hover:from-blue-500 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingSettings ? 'Saving...' : 'Apply Limits'}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Safe agy CLI Execution */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Safe Antigravity CLI Execution (`agy -p`)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 block mb-1">Target Agent:</label>
              <select
                value={cliAgent}
                onChange={e => setCliAgent(e.target.value)}
                className="glass-input w-full text-xs"
              >
                <option value="director">director (Gemini 3.8 Flash High)</option>
                <option value="researcher">researcher (Gemini Flash)</option>
                <option value="frontend-developer">frontend-developer (Gemini Flash)</option>
                <option value="backend-developer">backend-developer (Gemini Flash)</option>
                <option value="qa-engineer">qa-engineer (Gemini Flash)</option>
                <option value="senior-architect">senior-architect (Gemini Pro)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Single-Turn Prompt:</label>
              <textarea
                value={cliPrompt}
                onChange={e => setCliPrompt(e.target.value)}
                placeholder="Enter prompt to execute via agy -p..."
                className="glass-input w-full h-20 text-xs font-mono resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={cliConfirmed}
                  onChange={e => setCliConfirmed(e.target.checked)}
                  className="mt-0.5 accent-amber-500"
                />
                <span>I confirm execution of this prompt via local agy.exe CLI process.</span>
              </label>
              <p className="text-slate-400 pl-5 leading-relaxed">
                Rule 12: Arbitrary shell execution from browser is strictly blocked. Execution passes only authenticated prompt parameters to sandboxed CLI.
              </p>
            </div>

            <button
              onClick={handleRunCLI}
              disabled={cliRunning || !cliConfirmed}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-glass-subtle transition-all ${
                cliConfirmed && !cliRunning
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white'
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{cliRunning ? 'Executing via agy...' : 'Run Prompt via agy'}</span>
            </button>

            {cliOutput && (
              <div className={`p-3 rounded-xl border text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap ${
                cliOutput.success 
                  ? 'bg-black/60 border-emerald-500/30 text-emerald-300' 
                  : 'bg-black/60 border-rose-500/30 text-rose-300'
              }`}>
                {cliOutput.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Level 4 Gemini 4 Argon Escalation Generator */}
      <div className="glass-panel p-6 space-y-5 border-pink-500/20 bg-gradient-to-b from-pink-500/[0.04] to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 text-director-argon shadow-glow-argon">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Level 4 Escalation Package Generator (Gemini 4 Argon)
                <span className="badge-argon text-[10px] py-0 px-2">OFFICIAL PROTOCOL</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Prepares a minimal, isolated prompt pack when two technical approaches fail and an architectural impasse occurs.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerateArgon} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">1. Problem Statement / Issue Title:</label>
              <input
                type="text"
                value={argonIssue}
                onChange={e => setArgonIssue(e.target.value)}
                placeholder="e.g. Unresolvable Race Condition in File Lock Orchestration"
                className="glass-input w-full text-xs"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">3. Senior Architect Hypothesis:</label>
              <input
                type="text"
                value={argonHypothesis}
                onChange={e => setArgonHypothesis(e.target.value)}
                placeholder="e.g. Dual-write conflict between chokidar event debounce and SQLite WAL lock"
                className="glass-input w-full text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">2a. Failed Approach 1 (Evidence):</label>
              <input
                type="text"
                value={argonAttempt1}
                onChange={e => setArgonAttempt1(e.target.value)}
                placeholder="e.g. Introduced 150ms mutex lock; failed on high load stress test"
                className="glass-input w-full text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">2b. Failed Approach 2 (Evidence):</label>
              <input
                type="text"
                value={argonAttempt2}
                onChange={e => setArgonAttempt2(e.target.value)}
                placeholder="e.g. Implemented single-flight promise queue; caused deadlock on task restart"
                className="glass-input w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">4. Minimal Isolated Context (20-50 lines):</label>
              <textarea
                value={argonSnippet}
                onChange={e => setArgonSnippet(e.target.value)}
                placeholder="// Paste isolated reproducing snippet here..."
                className="glass-input w-full h-24 text-xs font-mono resize-none"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">5. Directive for Gemini 4 Argon:</label>
              <textarea
                value={argonQuestion}
                onChange={e => setArgonQuestion(e.target.value)}
                placeholder="e.g. Propose non-blocking concurrent event pipeline architecture with mathematical proof against race conditions."
                className="glass-input w-full h-24 text-xs font-mono resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isGeneratingArgon}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 text-white font-semibold shadow-glow-argon transition-all active:scale-[0.98]"
          >
            <Flame className="w-4 h-4" />
            <span>{isGeneratingArgon ? 'Synthesizing...' : 'Synthesize Argon Escalation Pack'}</span>
          </button>
        </form>

        {/* Generated Pack Modal/View */}
        {generatedPack && (
          <div className="mt-5 p-4 rounded-2xl bg-black/50 border border-pink-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-pink-400 flex items-center gap-1.5">
                <FileCode className="w-4 h-4" />
                Synthesized Level 4 Escalation Pack
              </span>
              <button
                onClick={handleCopyPack}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-mono transition-all"
              >
                {copiedPack ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPack ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>

            <pre className="p-3 rounded-xl bg-black/80 border border-white/5 text-[11px] font-mono text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {generatedPack}
            </pre>

            <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-300">
              <strong>Instructions for Operator:</strong> Switch the active model dropdown in Antigravity to <strong className="text-white">Gemini 4 Argon (High)</strong>, paste this package, receive the architectural solution, and switch back to <strong className="text-white">Gemini 3.8 Flash High</strong> for execution.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
