import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Copy, 
  Check, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  ShieldAlert,
  FileText,
  MessageSquare,
  Bot
} from 'lucide-react';
import type { EscalationItem, EscalationStatus } from '../../types.js';
import { toast } from '../Toast.js';

interface EscalationDetailModalProps {
  escalation: EscalationItem;
  onClose: () => void;
  onCopyPrompt: (id: string) => Promise<void>;
  onMarkSent: (id: string) => Promise<void>;
  onSubmitResponse: (id: string, responseText: string) => Promise<void>;
  onResolve: (id: string, note?: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onRegenerate: (id: string) => Promise<void>;
}

type ModalTab = 'overview' | 'prompt' | 'response';

export const EscalationDetailModal: React.FC<EscalationDetailModalProps> = ({
  escalation,
  onClose,
  onCopyPrompt,
  onMarkSent,
  onSubmitResponse,
  onResolve,
  onReject,
  onRegenerate
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('prompt');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [responseText, setResponseText] = useState(escalation.argonResponse || '');
  const [resolutionNote, setResolutionNote] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(escalation.promptPack);
      setCopied(true);
      toast.success('18-пунктный пакет эскалации скопирован в буфер обмена');
      await onCopyPrompt(escalation.id);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Не удалось скопировать в буфер обмена');
    }
  };

  const handleSend = async () => {
    try {
      await onMarkSent(escalation.id);
      toast.success('Статус обновлён: Отправлено в Gemini 4 Argon');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка обновления статуса');
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate(escalation.id);
      toast.success('Пакет эскалации успешно перегенерирован');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка перегенерации пакета');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) {
      toast.error('Введите текст ответа Gemini 4 Argon');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitResponse(escalation.id, responseText);
      toast.success('Ответ Argon успешно принят. Директор сформировал директиву.');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка отправки ответа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    try {
      await onResolve(escalation.id, resolutionNote || undefined);
      toast.success('Эскалация успешно разрешена и закрыта');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка закрытия эскалации');
    }
  };

  const handleReject = async () => {
    try {
      await onReject(escalation.id, 'Отклонено оператором в панели управления');
      toast.info('Эскалация отклонена');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Ошибка отклонения');
    }
  };

  const getStatusBadge = (status: EscalationStatus) => {
    switch (status) {
      case 'DETECTED':
      case 'PROMPT_READY':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">ГОТОВ К ОТПРАВКЕ</span>;
      case 'COPIED':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">СКОПИРОВАНО</span>;
      case 'SENT_TO_ARGON':
      case 'AWAITING_RESULT':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20 animate-pulse">В РАБОТЕ У ARGON</span>;
      case 'RESULT_RECEIVED':
      case 'IN_REVIEW':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">ОТВЕТ НА ПРОВЕРКЕ</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-terminal-bg text-terminal-green border border-terminal-border">РАЗРЕШЕНО</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-danger-bg text-danger-text border border-danger-border">ОТКЛОНЕНО</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-surface-subtle text-charcoal border border-hairline">{status}</span>;
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-danger-bg text-danger-text border border-danger-border">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">HIGH</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-mono bg-surface-subtle text-stone border border-hairline">MEDIUM</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-pure border border-hairline rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-obsidian">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-hairline flex items-start justify-between gap-4 bg-surface-subtle/50">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-argon-bg text-argon-text border border-argon-border">
                <Flame className="w-3.5 h-3.5 text-danger animate-pulse" />
                ARGON LEVEL 4 ESCALATION
              </span>
              {getPriorityBadge(escalation.priority)}
              {getStatusBadge(escalation.status)}
              <span className="text-xs font-mono text-graphite">ID: {escalation.id}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-obsidian">
              {escalation.taskTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-stone hover:text-obsidian hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Stepper */}
        <div className="px-5 py-3 border-b border-hairline bg-surface/30 overflow-x-auto text-xs font-mono">
          <div className="flex items-center gap-2 min-w-max">
            <span className={`flex items-center gap-1 ${escalation.status !== 'DETECTED' ? 'text-terminal-green font-semibold' : 'text-stone'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> 1. Обнаружено
            </span>
            <ArrowRight className="w-3 h-3 text-hairline" />
            <span className={`flex items-center gap-1 ${['PROMPT_READY', 'COPIED', 'SENT_TO_ARGON', 'RESULT_RECEIVED', 'IN_REVIEW', 'COMPLETED'].includes(escalation.status) ? 'text-terminal-green font-semibold' : 'text-stone'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> 2. 18-п. Пакет готов
            </span>
            <ArrowRight className="w-3 h-3 text-hairline" />
            <span className={`flex items-center gap-1 ${['COPIED', 'SENT_TO_ARGON', 'RESULT_RECEIVED', 'IN_REVIEW', 'COMPLETED'].includes(escalation.status) ? 'text-terminal-green font-semibold' : 'text-stone'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> 3. Скопировано
            </span>
            <ArrowRight className="w-3 h-3 text-hairline" />
            <span className={`flex items-center gap-1 ${['SENT_TO_ARGON', 'RESULT_RECEIVED', 'IN_REVIEW', 'COMPLETED'].includes(escalation.status) ? 'text-terminal-green font-semibold' : 'text-stone'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> 4. В Gemini 4 Argon
            </span>
            <ArrowRight className="w-3 h-3 text-hairline" />
            <span className={`flex items-center gap-1 ${['RESULT_RECEIVED', 'IN_REVIEW', 'COMPLETED'].includes(escalation.status) ? 'text-terminal-green font-semibold' : 'text-stone'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> 5. Ответ получен
            </span>
            <ArrowRight className="w-3 h-3 text-hairline" />
            <span className={`flex items-center gap-1 ${escalation.status === 'COMPLETED' ? 'text-terminal-green font-semibold' : 'text-stone'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> 6. Верифицировано
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline px-5 bg-surface-subtle/30">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'prompt'
                ? 'border-obsidian text-obsidian font-semibold'
                : 'border-transparent text-stone hover:text-obsidian'
            }`}
          >
            <FileText className="w-4 h-4" />
            18-пунктный Prompt Pack
          </button>
          <button
            onClick={() => setActiveTab('response')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'response'
                ? 'border-obsidian text-obsidian font-semibold'
                : 'border-transparent text-stone hover:text-obsidian'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Ответ Argon & Анализ
            {escalation.argonResponse && (
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-obsidian text-obsidian font-semibold'
                : 'border-transparent text-stone hover:text-obsidian'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Контекст и логи
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: 18-Point Prompt Pack */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-subtle rounded border border-hairline">
                <div className="text-xs text-stone space-y-0.5">
                  <div className="font-semibold text-obsidian">Инструкция для оператора:</div>
                  <div>1. Скопируйте сформированный пакет эскалации.</div>
                  <div>2. В веб-интерфейсе или CLI переключите модель на <strong>Gemini 4 Argon (High)</strong>.</div>
                  <div>3. Отправьте запрос и скопируйте ответ во вкладку «Ответ Argon & Анализ».</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-surface text-charcoal border border-hairline hover:bg-surface-subtle transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    Обновить пакет
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono font-medium bg-obsidian text-pure hover:bg-graphite transition-colors shadow-subtle"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-terminal-green" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Скопировано!' : 'Скопировать пакет'}
                  </button>
                  {!['SENT_TO_ARGON', 'RESULT_RECEIVED', 'IN_REVIEW', 'COMPLETED'].includes(escalation.status) && (
                    <button
                      onClick={handleSend}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Отметить отправленным
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-md bg-stone-900 text-stone-100 font-mono text-xs overflow-x-auto max-h-[50vh] border border-hairline whitespace-pre-wrap leading-relaxed select-all">
                  {escalation.promptPack}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: Argon Response & Director Analysis */}
          {activeTab === 'response' && (
            <div className="space-y-5">
              {/* Submission Form */}
              <form onSubmit={handleSubmitResponse} className="space-y-3">
                <label className="block text-sm font-semibold text-obsidian">
                  Ответ модели Gemini 4 Argon:
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Вставьте архитектурный диагноз, алгоритм или готовый диф от Gemini 4 Argon..."
                  rows={8}
                  className="w-full p-3 rounded border border-hairline bg-surface text-obsidian font-mono text-xs focus:outline-none focus:ring-1 focus:ring-obsidian"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone">
                    После отправки Директор выполнит анализ решения и передаст реализацию субагентам Flash.
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting || !responseText.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-medium bg-obsidian text-pure hover:bg-graphite transition-colors disabled:opacity-50"
                  >
                    <Bot className="w-4 h-4 text-cyan-400" />
                    {isSubmitting ? 'Обработка...' : 'Принять ответ и запустить анализ'}
                  </button>
                </div>
              </form>

              {/* Director Analysis Section */}
              {escalation.directorAnalysis && (
                <div className="p-4 rounded-md bg-cyan-500/5 border border-cyan-500/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-600">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                    АНАЛИЗ И ДИРЕКТИВА AI ДИРЕКТОРА:
                  </div>
                  <pre className="text-xs font-mono text-obsidian whitespace-pre-wrap leading-relaxed bg-pure/60 p-3 rounded border border-hairline">
                    {escalation.directorAnalysis}
                  </pre>
                </div>
              )}

              {/* Resolution Actions */}
              {escalation.argonResponse && escalation.status !== 'COMPLETED' && (
                <div className="p-4 rounded-md bg-surface-subtle border border-hairline space-y-3">
                  <div className="text-xs font-semibold text-obsidian">
                    Завершение эскалации:
                  </div>
                  <input
                    type="text"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Примечание к резолюции (необязательно)..."
                    className="w-full p-2 rounded text-xs font-mono bg-pure border border-hairline text-obsidian"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleReject}
                      className="px-3 py-1.5 rounded text-xs font-mono text-danger-text hover:bg-danger-bg transition-colors"
                    >
                      Отклонить эскалацию
                    </button>
                    <button
                      type="button"
                      onClick={handleResolve}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-mono font-semibold bg-terminal-green text-pure hover:opacity-90 transition-opacity"
                    >
                      <Check className="w-4 h-4" />
                      Утвердить резолюцию и закрыть эскалацию
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Overview & Diagnostics */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-surface-subtle rounded border border-hairline space-y-1">
                  <div className="text-xs text-stone font-mono">Причина эскалации:</div>
                  <div className="text-sm font-medium text-obsidian">{escalation.reason}</div>
                </div>
                <div className="p-3 bg-surface-subtle rounded border border-hairline space-y-1">
                  <div className="text-xs text-stone font-mono">Задействованные роли:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.from(new Set(escalation.involvedAgents)).map((ag, idx) => (
                      <span key={`${ag}-${idx}`} className="px-2 py-0.5 rounded text-xs font-mono bg-surface text-charcoal border border-hairline">
                        @{ag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {escalation.evidence.errorLogs && escalation.evidence.errorLogs.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold text-obsidian flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                    Санитизированные логи ошибок:
                  </div>
                  <pre className="p-3 rounded bg-surface font-mono text-xs text-danger-text overflow-x-auto border border-hairline max-h-48 whitespace-pre-wrap">
                    {escalation.evidence.errorLogs.join('\n')}
                  </pre>
                </div>
              )}

              {escalation.failureSignatures && escalation.failureSignatures.length > 0 && (
                <div className="text-xs font-mono text-stone">
                  Сигнатура сбоя (дедупликация): <code className="text-obsidian">{escalation.failureSignatures.join(', ')}</code>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
