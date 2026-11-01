import React, { useState } from 'react';
import { 
  Sliders, 
  Flame, 
  Terminal, 
  Save, 
  Check, 
  Play, 
  FileCode,
  Copy,
  Users,
  RotateCcw,
  Globe
} from 'lucide-react';
import { useToast } from './Toast.js';
import type { ControlSettings } from '../types.js';
import { useLanguage } from '../i18n/LanguageContext.js';

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

const ALL_AGENT_ROLES = [
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

const ControlCenterInner: React.FC<ControlCenterProps> = ({
  settings,
  onUpdateSettings,
  onGenerateArgonPack,
  onRunPrompt
}) => {
  const toast = useToast();
  const { language, currentLanguageMeta, languages, setLanguage, t } = useLanguage();

  // Settings State
  const [maxAgents, setMaxAgents] = useState<number>(settings?.maxConcurrentAgents || 3);
  const [maxRetries, setMaxRetries] = useState<number>(settings?.maxRetryAttempts || 2);
  const [escalationPolicy, setEscalationPolicy] = useState<'strict' | 'relaxed'>(
    settings?.escalationPolicy || 'strict'
  );
  const [allowedAgents, setAllowedAgents] = useState<string[]>(
    settings?.allowedAgents && settings.allowedAgents.length > 0
      ? settings.allowedAgents
      : ALL_AGENT_ROLES.map(r => r.id)
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Argon Prompt Pack Generator State
  const [argonIssue, setArgonIssue] = useState('');
  const [argonHypothesis, setArgonHypothesis] = useState('');
  const [argonAttempt1, setArgonAttempt1] = useState('');
  const [argonAttempt2, setArgonAttempt2] = useState('');
  const [argonSnippet, setArgonSnippet] = useState('');
  const [argonQuestion, setArgonQuestion] = useState('');
  const [generatedPack, setGeneratedPack] = useState<string | null>(null);
  const [isGeneratingArgon, setIsGeneratingArgon] = useState(false);
  const [copiedPack, setCopiedPack] = useState(false);

  // CLI Execution State
  const [cliPrompt, setCliPrompt] = useState('');
  const [cliAgent, setCliAgent] = useState('director');
  const [cliConfirmed, setCliConfirmed] = useState(false);
  const [cliRunning, setCliRunning] = useState(false);
  const [cliOutput, setCliOutput] = useState<{ success: boolean; text: string } | null>(null);

  const handleToggleAllowedAgent = (agentId: string) => {
    setAllowedAgents(prev => {
      if (prev.includes(agentId)) {
        // Prevent disabling director
        if (agentId === 'director') return prev;
        return prev.filter(id => id !== agentId);
      }
      return [...prev, agentId];
    });
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const ok = await onUpdateSettings({
      maxConcurrentAgents: maxAgents,
      maxRetryAttempts: maxRetries,
      escalationPolicy,
      allowedAgents
    });
    setIsSavingSettings(false);
    if (ok) {
      setSettingsSaved(true);
      toast.success(t('settings.saved'), t('common.success'));
      setTimeout(() => setSettingsSaved(false), 3000);
    } else {
      toast.error('Failed to save settings', t('common.error'));
    }
  };

  const handleGenerateArgon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!argonIssue.trim() || !argonHypothesis.trim()) {
      toast.warning('Please enter the core issue and working hypothesis.', 'Fill required fields');
      return;
    }
    setIsGeneratingArgon(true);
    try {
      const res = await onGenerateArgonPack({
        issueTitle: argonIssue.trim(),
        rootCauseHypothesis: argonHypothesis.trim(),
        failedAttempt1: argonAttempt1.trim() || 'Attempt 1 failed compilation or tests.',
        failedAttempt2: argonAttempt2.trim() || 'Attempt 2 did not resolve the architectural issue.',
        isolatedContextSnippet: argonSnippet.trim() || '// Isolated context not provided',
        targetQuestion: argonQuestion.trim() || 'What minimal architectural pattern guarantees eliminating the root cause?'
      });
      setGeneratedPack(res.promptPack);
      toast.success(`Prompt pack synthesized and saved to ${res.filename}`, 'Argon Pack Ready');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating Argon pack';
      toast.error(msg, t('common.error'));
    } finally {
      setIsGeneratingArgon(false);
    }
  };

  const handleCopyPack = async () => {
    if (!generatedPack) return;
    try {
      await navigator.clipboard.writeText(generatedPack);
      setCopiedPack(true);
      toast.success(t('escalations.copied'), t('common.success'));
      setTimeout(() => setCopiedPack(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard', t('common.error'));
    }
  };

  const handleRunCli = async () => {
    if (!cliPrompt.trim() || !cliConfirmed) return;
    setCliRunning(true);
    setCliOutput(null);
    try {
      const res = await onRunPrompt(cliPrompt.trim(), cliAgent, cliConfirmed);
      setCliOutput({
        success: res.success,
        text: res.output || (res.error ? `Error: ${res.error}` : 'No output')
      });
      if (res.success) {
        toast.success(`Agent @${cliAgent} command executed`, 'CLI Success');
      } else {
        toast.error(res.error || 'CLI execution error', 'CLI Failure');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CLI Error';
      setCliOutput({
        success: false,
        text: msg
      });
      toast.error(msg, t('common.error'));
    } finally {
      setCliRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Surface */}
      <section className="bg-pure border border-hairline rounded-md p-4 sm:p-5 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-obsidian" />
              <h1 className="text-lg font-semibold text-obsidian tracking-tight">
                {t('settings.title')}
              </h1>
            </div>
            <p className="text-[13px] text-charcoal mt-1 leading-relaxed">
              {t('settings.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Language & Regional Settings Card */}
      <section className="bg-pure border border-hairline rounded-md p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-hairline gap-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-obsidian shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-obsidian tracking-tight">
                {t('settings.languageSection')}
              </h2>
              <p className="text-xs text-stone mt-0.5">
                {t('settings.languageSectionDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-subtle border border-hairline text-xs font-mono shrink-0">
            <span className="text-stone">{t('settings.currentLanguage')}:</span>
            <span className="font-semibold text-obsidian flex items-center gap-1.5">
              <span className="text-base leading-none">{currentLanguageMeta.flag}</span>
              <span>{currentLanguageMeta.nativeName}</span>
              <span className="text-[10px] uppercase text-stone font-mono">({currentLanguageMeta.code})</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {languages.map((langMeta) => {
            const isActive = langMeta.code === language;
            return (
              <button
                key={langMeta.code}
                type="button"
                onClick={() => {
                  setLanguage(langMeta.code);
                  toast.success(`${langMeta.flag} ${langMeta.nativeName} (${langMeta.englishName})`, t('common.success'));
                }}
                className={`p-3 rounded-md border text-left transition-all duration-150 flex flex-col justify-between focus-ring group ${
                  isActive
                    ? 'bg-surface-subtle border-obsidian ring-1 ring-obsidian shadow-xs'
                    : 'bg-pure border-hairline hover:border-slate hover:bg-surface-subtle/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl leading-none" role="img" aria-label={langMeta.name}>
                    {langMeta.flag}
                  </span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase transition-colors ${
                    isActive
                      ? 'bg-obsidian text-pure border-obsidian'
                      : 'bg-surface-subtle text-stone border-hairline group-hover:text-obsidian'
                  }`}>
                    {langMeta.code}
                  </span>
                </div>

                <div className="mt-3">
                  <div className={`text-xs font-semibold tracking-tight transition-colors ${
                    isActive ? 'text-obsidian font-bold' : 'text-charcoal group-hover:text-obsidian'
                  }`}>
                    {langMeta.nativeName}
                  </div>
                  <div className="text-[11px] text-stone mt-0.5 font-sans">
                    {langMeta.englishName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Global Orchestrator Settings Card */}
      <section className="bg-pure border border-hairline rounded-md p-5 shadow-subtle space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div>
            <h2 className="text-sm font-semibold text-obsidian tracking-tight">
              {t('settings.orchestratorSection')}
            </h2>
            <p className="text-xs text-stone mt-0.5">
              {t('settings.orchestratorSectionDesc')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className={`refero-btn-primary text-xs ${
              settingsSaved ? 'bg-terminal-green hover:bg-terminal-green' : ''
            }`}
          >
            {isSavingSettings ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>{t('settings.saving')}</span>
              </>
            ) : settingsSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-pure" />
                <span>{t('settings.saved')}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{t('settings.saveSettings')}</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Max Concurrent Subagents (Up to 6) */}
          <div className="space-y-1.5">
            <label className="text-obsidian font-semibold block">
              {t('settings.concurrencyLabel')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={maxAgents}
                onChange={e => setMaxAgents(Number(e.target.value))}
                className="w-full accent-obsidian"
              />
              <span className="font-mono text-sm font-bold text-obsidian bg-surface-subtle px-2.5 py-1 rounded border border-hairline min-w-[36px] text-center">
                {maxAgents}
              </span>
            </div>
            <span className="text-[11px] text-stone block leading-tight">
              {t('settings.concurrencyDesc')}
            </span>
          </div>

          {/* Max Retries (Default 2) */}
          <div className="space-y-1.5">
            <label className="text-obsidian font-semibold block">
              {t('settings.retriesLabel')}
            </label>
            <select
              value={maxRetries}
              onChange={e => setMaxRetries(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
            >
              <option value="1">{t('settings.retryOption1')}</option>
              <option value="2">{t('settings.retryOption2')}</option>
              <option value="3">{t('settings.retryOption3')}</option>
            </select>
            <span className="text-[11px] text-stone block leading-tight">
              {t('settings.retriesDesc')}
            </span>
          </div>

          {/* Escalation Policy */}
          <div className="space-y-1.5">
            <label className="text-obsidian font-semibold block">
              {t('settings.escalationPolicyLabel')}
            </label>
            <select
              value={escalationPolicy}
              onChange={e => setEscalationPolicy(e.target.value as 'strict' | 'relaxed')}
              className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
            >
              <option value="strict">{t('settings.escalationStrict')}</option>
              <option value="relaxed">{t('settings.escalationRelaxed')}</option>
            </select>
            <span className="text-[11px] text-stone block leading-tight">
              {escalationPolicy === 'strict' ? 'Strict quality control' : 'Relaxed quality control'}
            </span>
          </div>
        </div>

        {/* Allowed Agents Whitelist Grid */}
        <div className="pt-4 border-t border-hairline space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-obsidian flex items-center gap-1.5">
              <Users className="w-4 h-4 text-graphite" />
              <span>{t('settings.allowedAgentsLabel')} ({allowedAgents.length} / 17):</span>
            </label>
            <span className="text-[11px] font-mono text-stone">
              Director always active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
            {ALL_AGENT_ROLES.map(role => {
              const isChecked = allowedAgents.includes(role.id);
              const isDirector = role.id === 'director';

              return (
                <label
                  key={role.id}
                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer select-none transition-colors ${
                    isChecked
                      ? 'bg-surface-subtle border-hairline text-obsidian'
                      : 'bg-pure border-hairline text-stone opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDirector}
                    onChange={() => handleToggleAllowedAgent(role.id)}
                    className="rounded border-hairline text-obsidian accent-obsidian focus-ring"
                  />
                  <span className="truncate font-mono text-[11px]">@{role.id}</span>
                </label>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Argon L4 Prompt Pack Generator */}
      <section className="bg-pure border border-hairline rounded-md p-5 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-hairline">
          <Flame className="w-5 h-5 text-argon-text animate-pulse" />
          <div>
            <h2 className="text-sm font-semibold text-obsidian tracking-tight">
              {t('settings.argonGeneratorTitle')}
            </h2>
            <p className="text-xs text-stone mt-0.5">
              {t('settings.argonGeneratorDesc')}
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerateArgon} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-obsidian block">
                {t('settings.issueTitleLabel')}
              </label>
              <input
                type="text"
                value={argonIssue}
                onChange={e => setArgonIssue(e.target.value)}
                placeholder={t('settings.issueTitlePlaceholder')}
                className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke focus-ring"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-obsidian block">
                {t('settings.hypothesisLabel')}
              </label>
              <input
                type="text"
                value={argonHypothesis}
                onChange={e => setArgonHypothesis(e.target.value)}
                placeholder={t('settings.hypothesisPlaceholder')}
                className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke focus-ring"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-obsidian block">
                {t('settings.attempt1Label')}
              </label>
              <textarea
                value={argonAttempt1}
                onChange={e => setArgonAttempt1(e.target.value)}
                placeholder="What was attempted in the first pass and why it failed..."
                className="w-full h-16 p-2.5 bg-pure border border-hairline rounded-md font-mono text-xs text-obsidian resize-none focus-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-obsidian block">
                {t('settings.attempt2Label')}
              </label>
              <textarea
                value={argonAttempt2}
                onChange={e => setArgonAttempt2(e.target.value)}
                placeholder="Alternative second strategy and error outcome..."
                className="w-full h-16 p-2.5 bg-pure border border-hairline rounded-md font-mono text-xs text-obsidian resize-none focus-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-obsidian block">
              {t('settings.contextSnippetLabel')}
            </label>
            <textarea
              value={argonSnippet}
              onChange={e => setArgonSnippet(e.target.value)}
              placeholder="// Clean isolated code context..."
              className="w-full h-24 p-2.5 bg-pure border border-hairline rounded-md font-mono text-xs text-obsidian resize-none focus-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-obsidian block">
              {t('settings.targetQuestionLabel')}
            </label>
            <input
              type="text"
              value={argonQuestion}
              onChange={e => setArgonQuestion(e.target.value)}
              placeholder="e.g. Propose a non-blocking queue architecture with FIFO guarantees"
              className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke focus-ring"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={isGeneratingArgon}
              className="refero-btn-primary text-xs"
            >
              <Flame className="w-3.5 h-3.5 text-argon-text" />
              <span>{isGeneratingArgon ? t('settings.generating') : t('settings.generateArgonPackBtn')}</span>
            </button>
          </div>
        </form>

        {/* Display Generated Pack */}
        {generatedPack && (
          <div className="mt-4 p-4 rounded-md bg-surface-subtle border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-obsidian flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-argon-text" />
                {t('escalations.promptPack')}:
              </span>
              <button
                type="button"
                onClick={handleCopyPack}
                className="refero-btn-secondary text-xs py-1 px-2.5"
              >
                {copiedPack ? <Check className="w-3.5 h-3.5 text-terminal-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPack ? t('common.copied') : t('common.copy')}</span>
              </button>
            </div>
            <pre className="p-3 bg-pure border border-hairline rounded-md font-mono text-xs text-obsidian whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
              {generatedPack}
            </pre>
          </div>
        )}
      </section>

      {/* 5. Safe Direct CLI Supervisor Execution Console */}
      <section className="bg-pure border border-hairline rounded-md p-5 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-hairline">
          <Terminal className="w-5 h-5 text-obsidian" />
          <div>
            <h2 className="text-sm font-semibold text-obsidian tracking-tight">
              {t('settings.cliTitle')}
            </h2>
            <p className="text-xs text-stone mt-0.5">
              {t('settings.cliDesc')}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-obsidian block">
                {t('settings.cliAgentLabel')}
              </label>
              <select
                value={cliAgent}
                onChange={e => setCliAgent(e.target.value)}
                className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
              >
                {ALL_AGENT_ROLES.map(role => (
                  <option key={role.id} value={role.id}>
                    @{role.id} ({role.label})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-obsidian block">
                {t('settings.cliPromptLabel')}
              </label>
              <input
                type="text"
                value={cliPrompt}
                onChange={e => setCliPrompt(e.target.value)}
                placeholder={t('settings.cliPromptPlaceholder')}
                className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke focus-ring"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-charcoal">
              <input
                type="checkbox"
                checked={cliConfirmed}
                onChange={e => setCliConfirmed(e.target.checked)}
                className="rounded border-hairline text-obsidian accent-obsidian focus-ring"
              />
              <span>{t('settings.cliConfirmLabel')}</span>
            </label>

            <button
              type="button"
              onClick={handleRunCli}
              disabled={cliRunning || !cliPrompt.trim() || !cliConfirmed}
              className="refero-btn-primary text-xs self-start sm:self-auto"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{cliRunning ? t('settings.cliRunning') : t('settings.cliExecuteBtn')}</span>
            </button>
          </div>

          {cliOutput && (
            <div className="mt-3 p-3 rounded-md bg-surface-subtle border border-hairline space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${cliOutput.success ? 'text-terminal-green' : 'text-danger-text'}`}>
                  {cliOutput.success ? 'CLI Output:' : 'Execution Error:'}
                </span>
              </div>
              <pre className="p-2.5 rounded bg-pure border border-hairline whitespace-pre-wrap text-obsidian max-h-48 overflow-y-auto">
                {cliOutput.text}
              </pre>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export const ControlCenter: React.FC<ControlCenterProps> = (props) => {
  return <ControlCenterInner key={props.settings ? 'loaded' : 'initial'} {...props} />;
};
