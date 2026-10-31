import React, { useState } from 'react';
import { 
  Brain, 
  FileText, 
  Save, 
  Check, 
  RotateCw, 
  AlertTriangle,
  X
} from 'lucide-react';
import { useToast } from './Toast.js';
import type { KnowledgeDoc } from '../types.js';

interface MemoryExplorerProps {
  docs: KnowledgeDoc[];
  onSaveDoc: (filename: string, content: string) => Promise<boolean>;
  onRefresh: () => void;
}

export const MemoryExplorer: React.FC<MemoryExplorerProps> = ({
  docs,
  onSaveDoc,
  onRefresh
}) => {
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<string>(docs[0]?.filename || '');
  const [editorContent, setEditorContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingSwitchFile, setPendingSwitchFile] = useState<string | null>(null);

  const currentDoc = docs.find(d => d.filename === selectedFile) || docs[0];

  React.useEffect(() => {
    if (currentDoc) {
      setEditorContent(currentDoc.content);
      setHasUnsavedChanges(false);
      setSaveSuccess(false);
    }
  }, [currentDoc?.filename, currentDoc?.content]);

  const handleSelectDoc = (filename: string) => {
    if (hasUnsavedChanges && filename !== selectedFile) {
      setPendingSwitchFile(filename);
      return;
    }
    setSelectedFile(filename);
  };

  const confirmSwitch = () => {
    if (pendingSwitchFile) {
      setHasUnsavedChanges(false);
      setSelectedFile(pendingSwitchFile);
      setPendingSwitchFile(null);
    }
  };

  const cancelSwitch = () => {
    setPendingSwitchFile(null);
  };

  const handleSave = async () => {
    if (!currentDoc) return;
    setIsSaving(true);
    const ok = await onSaveDoc(currentDoc.filename, editorContent);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      toast.success(`Документ ${currentDoc.filename} успешно сохранён и синхронизирован`, 'Память обновлена');
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      toast.error('Не удалось сохранить изменения документа', 'Ошибка сохранения');
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-director-blue" />
            <span>Постоянная память и регламенты Director</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Глобальная база знаний Antigravity (~/.gemini/antigravity/knowledge). Редактирование правил оркестратора и регламентов в реальном времени.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold border border-white/10 transition-all self-start md:self-auto"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Синхронизировать</span>
        </button>
      </div>

      {/* Основная рабочая область: Дерево файлов слева, Редактор справа */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Список файлов */}
        <div className="glass-panel p-4 space-y-2 lg:col-span-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 px-2 block">
            Документы базы знаний ({docs.length})
          </span>

          <div className="space-y-1">
            {docs.map(doc => {
              const isSelected = (currentDoc?.filename === doc.filename);
              return (
                <button
                  key={doc.filename}
                  onClick={() => handleSelectDoc(doc.filename)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-director-blue/20 text-director-cyan border border-director-blue/40 shadow-glass-subtle'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <div className="truncate flex-1">
                    <span className="block truncate">{doc.title || doc.filename}</span>
                    <span className="text-[10px] font-mono text-slate-500 block truncate">
                      {doc.filename}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Редактор Markdown */}
        <div className="glass-panel p-5 space-y-4 lg:col-span-3 flex flex-col">
          {currentDoc ? (
            <>
              {/* Шапка редактора */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentDoc.filename}</span>
                    {hasUnsavedChanges && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Есть несохранённые изменения" />
                    )}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Путь: {currentDoc.path}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                      <Check className="w-3.5 h-3.5" />
                      Сохранено и синхронизировано!
                    </span>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={isSaving || !hasUnsavedChanges}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-glass-subtle transition-all ${
                      hasUnsavedChanges
                        ? 'bg-gradient-to-r from-director-blue to-blue-600 text-white hover:from-blue-500 active:scale-95'
                        : 'bg-white/[0.05] text-slate-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Сохранение...' : 'Сохранить изменения'}</span>
                  </button>
                </div>
              </div>

              {/* Поле ввода редактора */}
              <div className="flex-1 min-h-[500px] flex flex-col">
                <textarea
                  value={editorContent}
                  onChange={e => {
                    setEditorContent(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-director-blue/50 focus:ring-1 focus:ring-director-blue/30 leading-relaxed resize-none selection:bg-director-blue/30"
                  spellCheck={false}
                />
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-500">
              Документы памяти не загружены.
            </div>
          )}
        </div>
      </div>

      {/* Диалоговое окно подтверждения сброса несохранённых правок */}
      {pendingSwitchFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md glass-panel p-6 space-y-4 border border-amber-500/30 shadow-glass-card animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">Несохранённые изменения</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  В текущем документе есть несохранённые правки. Вы уверены, что хотите переключиться на <code className="text-director-cyan">{pendingSwitchFile}</code> без сохранения?
                </p>
              </div>
              <button
                type="button"
                onClick={cancelSwitch}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={cancelSwitch}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition-all"
              >
                Остаться
              </button>
              <button
                type="button"
                onClick={confirmSwitch}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all"
              >
                Сбросить и переключить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
