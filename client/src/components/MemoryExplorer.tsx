import React, { useState } from 'react';
import { 
  Brain, 
  FileText, 
  Save, 
  Check, 
  RotateCw, 
  AlertTriangle,
  FileCode
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
  const [selectedFilename, setSelectedFilename] = useState<string>('');
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pendingSwitchFilename, setPendingSwitchFilename] = useState<string | null>(null);

  const activeFilename = selectedFilename || docs[0]?.filename || '';
  const currentDoc = docs.find(d => d.filename === activeFilename) || docs[0];
  const editorContent = editedContent !== null ? editedContent : (currentDoc?.content || '');
  const hasUnsavedChanges = editedContent !== null && editedContent !== (currentDoc?.content || '');

  const handleSelectDoc = (filename: string) => {
    if (hasUnsavedChanges && filename !== activeFilename) {
      setPendingSwitchFilename(filename);
      return;
    }
    setSelectedFilename(filename);
    setEditedContent(null);
    setSaveSuccess(false);
  };

  const confirmSwitch = () => {
    if (pendingSwitchFilename) {
      setSelectedFilename(pendingSwitchFilename);
      setEditedContent(null);
      setSaveSuccess(false);
      setPendingSwitchFilename(null);
    }
  };

  const cancelSwitch = () => {
    setPendingSwitchFilename(null);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!currentDoc) return;
    setIsSaving(true);
    const ok = await onSaveDoc(currentDoc.filename, editorContent);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setEditedContent(null);
      toast.success(`Документ ${currentDoc.filename} успешно сохранён и синхронизирован`, 'Память обновлена');
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      toast.error('Не удалось сохранить изменения документа', 'Ошибка сохранения');
    }
  };

  const lineCount = editorContent.split('\n').length;
  const charCount = editorContent.length;

  return (
    <div className="space-y-6">
      {/* 1. Header surface */}
      <section className="bg-pure border border-hairline rounded-md p-4 sm:p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-obsidian" />
            <h1 className="text-lg font-semibold text-obsidian tracking-tight">
              База знаний и регламенты оркестратора
            </h1>
          </div>
          <p className="text-[13px] text-charcoal mt-1 leading-relaxed">
            Постоянная память Director, системные спецификации агентов и регламенты качества Antigravity.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="refero-btn-secondary self-start md:self-auto"
        >
          <RotateCw className="w-3.5 h-3.5 text-graphite" />
          <span>Синхронизировать память</span>
        </button>
      </section>

      {/* 2. Main Two-Column Document Explorer */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Documents Browser Rail */}
        <div className="lg:col-span-4 bg-pure border border-hairline rounded-md p-4 shadow-subtle space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-hairline">
              <span className="text-xs font-mono uppercase tracking-wider text-stone font-medium">
                Документы базы знаний ({docs.length})
              </span>
              <FileCode className="w-3.5 h-3.5 text-graphite" />
            </div>

            <nav className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
              {docs.length === 0 ? (
                <div className="py-8 text-center text-slate text-xs font-mono">
                  Документы не найдены
                </div>
              ) : (
                docs.map((doc) => {
                  const isSelected = doc.filename === selectedFilename;

                  return (
                    <button
                      key={doc.filename}
                      type="button"
                      onClick={() => handleSelectDoc(doc.filename)}
                      className={`w-full text-left p-2.5 rounded-md text-xs transition-colors flex items-start gap-2.5 border focus-ring ${
                        isSelected
                          ? 'bg-surface-subtle border-obsidian font-medium text-obsidian shadow-subtle'
                          : 'bg-pure border-hairline hover:border-ash hover:bg-surface-subtle text-charcoal'
                      }`}
                    >
                      <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-obsidian' : 'text-graphite'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-medium truncate text-obsidian">
                            {doc.filename}
                          </span>
                          {isSelected && hasUnsavedChanges && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Несохранённые изменения" />
                          )}
                        </div>
                        <p className="text-[11px] text-stone truncate mt-0.5">
                          {doc.title || doc.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate">
                          <span>{(doc.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{new Date(doc.lastModified).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </nav>
          </div>

          <div className="pt-3 border-t border-hairline text-[11px] font-mono text-slate flex justify-between items-center">
            <span>Статус: Локальная синхронизация</span>
            <span>Маршрут: /knowledge</span>
          </div>
        </div>

        {/* Right Column: Code & Markdown Editor View */}
        <div className="lg:col-span-8 bg-pure border border-hairline rounded-md shadow-subtle flex flex-col justify-between overflow-hidden">
          {/* Editor Header */}
          <div className="p-4 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-paper">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileCode className="w-4 h-4 text-obsidian shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-xs text-obsidian truncate">
                    {currentDoc?.filename || 'Выберите документ'}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="badge-demo text-[10px] py-0 px-1.5 font-mono">
                      НЕСОХРАНЕНО
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate truncate block">
                  {currentDoc?.path || ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="text-[11px] font-mono text-stone hidden sm:flex items-center gap-2 pr-2 border-r border-hairline">
                <span>{lineCount} строк</span>
                <span>•</span>
                <span>{charCount} симв.</span>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className={`refero-btn-primary text-xs py-1.5 px-3 ${
                  saveSuccess ? 'bg-terminal-green hover:bg-terminal-green' : ''
                }`}
              >
                {isSaving ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Сохранение...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-pure" />
                    <span>Сохранено ✓</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Сохранить</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Editor Textarea Pane */}
          <div className="relative flex-1 min-h-[460px] p-4 bg-pure">
            <textarea
              value={editorContent}
              onChange={handleContentChange}
              placeholder="Содержимое документа..."
              aria-label="Редактор документа базы знаний"
              className="w-full h-full min-h-[440px] resize-none font-mono text-xs text-obsidian bg-transparent focus:outline-none leading-relaxed selection:bg-obsidian selection:text-pure"
              spellCheck={false}
            />
          </div>

          {/* Editor Footer Status Bar */}
          <div className="p-2.5 border-t border-hairline bg-paper flex items-center justify-between text-[11px] font-mono text-slate">
            <span>Кодировка: UTF-8</span>
            <span>Режим: Markdown / Spec Editor</span>
          </div>
        </div>
      </section>

      {/* Unsaved Changes Confirmation Modal */}
      {pendingSwitchFilename && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm dark:bg-black/70 animate-fade-in"
        >
          <div className="w-full max-w-md bg-pure border border-hairline rounded-lg shadow-modal p-5 space-y-4">
            <div className="flex items-center gap-3 text-warning-text">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold text-obsidian tracking-tight">
                Несохранённые изменения
              </h3>
            </div>
            <p className="text-xs text-charcoal leading-relaxed">
              Вы внесли изменения в документ <strong className="font-mono text-obsidian">{selectedFilename}</strong>. Если перейти к другому файлу без сохранения, правки будут потеряны.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={cancelSwitch}
                className="refero-btn-secondary text-xs"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmSwitch}
                className="refero-btn-danger text-xs"
              >
                Перейти без сохранения
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
