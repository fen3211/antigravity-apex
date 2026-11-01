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
  RotateCcw
} from 'lucide-react';
import { useToast } from './Toast.js';
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
      toast.success('Настройки оркестратора успешно сохранены', 'Настройки обновлены');
      setTimeout(() => setSettingsSaved(false), 3000);
    } else {
      toast.error('Не удалось сохранить настройки', 'Ошибка сохранения');
    }
  };

  const handleGenerateArgon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!argonIssue.trim() || !argonHypothesis.trim()) {
      toast.warning('Пожалуйста, заполните суть проблемы и рабочую гипотезу.', 'Заполните поля');
      return;
    }
    setIsGeneratingArgon(true);
    try {
      const res = await onGenerateArgonPack({
        issueTitle: argonIssue.trim(),
        rootCauseHypothesis: argonHypothesis.trim(),
        failedAttempt1: argonAttempt1.trim() || 'Попытка 1 провалила проверку компиляции/тестов.',
        failedAttempt2: argonAttempt2.trim() || 'Попытка 2 не устранила архитектурный дефект.',
        isolatedContextSnippet: argonSnippet.trim() || '// Изолированный контекст не предоставлен',
        targetQuestion: argonQuestion.trim() || 'Какой минимальный архитектурный паттерн гарантирует устранение первопричины дефекта?'
      });
      setGeneratedPack(res.promptPack);
      toast.success(`Пакет эскалации сгенерирован и сохранён в файл ${res.filename}`, 'Argon Pack готов');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка генерации пакета Argon';
      toast.error(msg, 'Сбой');
    } finally {
      setIsGeneratingArgon(false);
    }
  };

  const handleCopyPack = () => {
    if (generatedPack) {
      navigator.clipboard.writeText(generatedPack);
      setCopiedPack(true);
      toast.info('Пакет эскалации скопирован в буфер обмена');
      setTimeout(() => setCopiedPack(false), 2000);
    }
  };

  const handleRunCli = async () => {
    if (!cliPrompt.trim()) return;
    if (!cliConfirmed) {
      toast.warning('Подтвердите выполнение команды в локальной рабочей среде', 'Требуется подтверждение');
      return;
    }
    setCliRunning(true);
    setCliOutput(null);
    try {
      const res = await onRunPrompt(cliPrompt.trim(), cliAgent, cliConfirmed);
      setCliOutput({
        success: res.success,
        text: res.output || res.error || 'Выполнено без консольного вывода.'
      });
      if (res.success) {
        toast.success(`Команда агента @${cliAgent} выполнена`, 'Успех CLI');
      } else {
        toast.error(res.error || 'Ошибка исполнения в CLI', 'Сбой CLI');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Сбой CLI';
      setCliOutput({
        success: false,
        text: msg
      });
      toast.error(msg, 'Сбой');
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
                Центр конфигурации и протоколы эскалации
              </h1>
            </div>
            <p className="text-[13px] text-charcoal mt-1 leading-relaxed">
              Лимиты параллелизма до 6 субагентов, политика повторных попыток, доступный пул специалистов и генератор пакетов L4 для Gemini 4 Argon.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Global Orchestrator Settings Card */}
      <section className="bg-pure border border-hairline rounded-md p-5 shadow-subtle space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div>
            <h2 className="text-sm font-semibold text-obsidian tracking-tight">
              Параметры оркестратора Antigravity
            </h2>
            <p className="text-xs text-stone mt-0.5">
              Управление параллелизмом, эскалацией и допустимым пулом специалистов.
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
                <span>Сохранение...</span>
              </>
            ) : settingsSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-pure" />
                <span>Сохранено ✓</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Сохранить настройки</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Max Concurrent Subagents (Up to 6) */}
          <div className="space-y-1.5">
            <label className="text-obsidian font-semibold block">
              Лимит параллелизма (субагентов):
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
              Макс. до 6 параллельных потоков по протоколу AI Director.
            </span>
          </div>

          {/* Max Retries (Default 2) */}
          <div className="space-y-1.5">
            <label className="text-obsidian font-semibold block">
              Лимит повторных попыток:
            </label>
            <select
              value={maxRetries}
              onChange={e => setMaxRetries(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
            >
              <option value="1">1 попытка (строгий режим)</option>
              <option value="2">2 попытки (рекомендовано)</option>
              <option value="3">3 попытки</option>
            </select>
            <span className="text-[11px] text-stone block leading-tight">
              После 2 неудач активируется эскалация к Senior Architect (L3).
            </span>
          </div>

          {/* Escalation Policy */}
          <div className="space-y-1.5">
            <label className="text-obsidian font-semibold block">
              Политика эскалации:
            </label>
            <select
              value={escalationPolicy}
              onChange={e => setEscalationPolicy(e.target.value as 'strict' | 'relaxed')}
              className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian focus-ring"
            >
              <option value="strict">Strict (Обязательное L1/L2 подтверждение)</option>
              <option value="relaxed">Relaxed (Мягкие шлюзы)</option>
            </select>
            <span className="text-[11px] text-stone block leading-tight">
              При Strict автоматическая блокировка не прошедших верификацию задач.
            </span>
          </div>
        </div>

        {/* Allowed Agents Whitelist Grid */}
        <div className="pt-4 border-t border-hairline space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-obsidian flex items-center gap-1.5">
              <Users className="w-4 h-4 text-graphite" />
              <span>Разрешённый пул специалистов ({allowedAgents.length} из 17 доступно):</span>
            </label>
            <span className="text-[11px] font-mono text-stone">
              Director включен всегда
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

      {/* 3. Argon L4 Prompt Pack Generator */}
      <section className="bg-pure border border-hairline rounded-md p-5 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-hairline">
          <Flame className="w-5 h-5 text-argon-text animate-pulse" />
          <div>
            <h2 className="text-sm font-semibold text-obsidian tracking-tight">
              Генератор пакета эскалации Gemini 4 Argon (L4 Prompt Pack)
            </h2>
            <p className="text-xs text-stone mt-0.5">
              Синтез структурированного пакета из 10 пунктов для преодоления тупиков при переключении на флагманскую модель.
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerateArgon} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-obsidian block">
                1. Суть архитектурного тупика / проблемы:
              </label>
              <input
                type="text"
                value={argonIssue}
                onChange={e => setArgonIssue(e.target.value)}
                placeholder="например: Deadlock в обработчике WebSocket при параллельных событиях"
                className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke focus-ring"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-obsidian block">
                2. Рабочая гипотеза первопричины:
              </label>
              <input
                type="text"
                value={argonHypothesis}
                onChange={e => setArgonHypothesis(e.target.value)}
                placeholder="например: Гонка данных между WAL checkpoint и чтением транскрипта"
                className="w-full px-3 py-1.5 bg-pure border border-hairline rounded-md text-[13px] text-obsidian placeholder-smoke focus-ring"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-obsidian block">
                3. Неудачная попытка №1 (описание и ошибка):
              </label>
              <textarea
                value={argonAttempt1}
                onChange={e => setArgonAttempt1(e.target.value)}
                placeholder="Что пробовали в первой попытке и почему это провалилось..."
                className="w-full h-16 p-2.5 bg-pure border border-hairline rounded-md font-mono text-xs text-obsidian resize-none focus-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-obsidian block">
                4. Неудачная попытка №2 (описание и ошибка):
              </label>
              <textarea
                value={argonAttempt2}
                onChange={e => setArgonAttempt2(e.target.value)}
                placeholder="Альтернативная стратегия второй попытки и лог ошибки..."
                className="w-full h-16 p-2.5 bg-pure border border-hairline rounded-md font-mono text-xs text-obsidian resize-none focus-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-obsidian block">
              5. Изолированный контекст (фрагмент кода / интерфейса):
            </label>
            <textarea
              value={argonSnippet}
              onChange={e => setArgonSnippet(e.target.value)}
              placeholder="Компактный код без лишнего шума..."
              className="w-full h-24 p-2.5 bg-pure border border-hairline rounded-md font-mono text-xs text-obsidian resize-none focus-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-obsidian block">
              6. Точечный вопрос к Gemini 4 Argon:
            </label>
            <input
              type="text"
              value={argonQuestion}
              onChange={e => setArgonQuestion(e.target.value)}
              placeholder="например: Предложите неблокирующую архитектуру очереди с гарантией доставки FIFO"
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
              <span>{isGeneratingArgon ? 'Синтез пакета...' : 'Сформировать 10-п. пакет Argon'}</span>
            </button>
          </div>
        </form>

        {/* Display Generated Pack */}
        {generatedPack && (
          <div className="mt-4 p-4 rounded-md bg-surface-subtle border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-obsidian flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-argon-text" />
                Готовый пакет эскалации L4:
              </span>
              <button
                type="button"
                onClick={handleCopyPack}
                className="refero-btn-secondary text-xs py-1 px-2.5"
              >
                {copiedPack ? <Check className="w-3.5 h-3.5 text-terminal-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPack ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
            <pre className="p-3 bg-pure border border-hairline rounded-md font-mono text-xs text-obsidian whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
              {generatedPack}
            </pre>
          </div>
        )}
      </section>

      {/* 4. Safe Direct CLI Supervisor Execution Console */}
      <section className="bg-pure border border-hairline rounded-md p-5 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-hairline">
          <Terminal className="w-5 h-5 text-obsidian" />
          <div>
            <h2 className="text-sm font-semibold text-obsidian tracking-tight">
              Прямой запуск команд CLI через супервизор
            </h2>
            <p className="text-xs text-stone mt-0.5">
              Исполнение инструкций агентами с обязательным подтверждением безопасности среды.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-obsidian block">
                Исполнитель:
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
                Текст команды / промпта для исполнения:
              </label>
              <input
                type="text"
                value={cliPrompt}
                onChange={e => setCliPrompt(e.target.value)}
                placeholder="например: Проверить целостность базы данных SQLite"
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
              <span>Подтверждаю безопасность выполнения команды в локальной среде (Localhost Only)</span>
            </label>

            <button
              type="button"
              onClick={handleRunCli}
              disabled={cliRunning || !cliPrompt.trim() || !cliConfirmed}
              className="refero-btn-primary text-xs self-start sm:self-auto"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{cliRunning ? 'Исполнение...' : 'Выполнить в CLI'}</span>
            </button>
          </div>

          {cliOutput && (
            <div className="mt-3 p-3 rounded-md bg-surface-subtle border border-hairline space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${cliOutput.success ? 'text-terminal-green' : 'text-danger-text'}`}>
                  {cliOutput.success ? 'Успешный вывод CLI супервизора:' : 'Ошибка выполнения:'}
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
