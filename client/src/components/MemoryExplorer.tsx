import React, { useState } from 'react';
import { 
  Brain, 
  FileText, 
  Save, 
  Check, 
  Database, 
  RefreshCw
} from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState<string>(
    docs[0]?.filename || 'DIRECTOR_PROTOCOL.md'
  );
  const [editorContent, setEditorContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentDoc = docs.find(d => d.filename === selectedFile) || docs[0];

  React.useEffect(() => {
    if (currentDoc) {
      setEditorContent(currentDoc.content);
      setHasUnsavedChanges(false);
      setSaveSuccess(false);
    }
  }, [currentDoc?.filename, currentDoc?.content]);

  const handleSelectDoc = (filename: string) => {
    if (hasUnsavedChanges) {
      if (!confirm('У вас есть несохранённые изменения. Сбросить их и переключить документ?')) {
        return;
      }
    }
    setSelectedFile(filename);
  };

  const handleSave = async () => {
    if (!currentDoc) return;
    setIsSaving(true);
    const ok = await onSaveDoc(currentDoc.filename, editorContent);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
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
            Подключено к глобальному репозиторию <code className="text-director-cyan font-mono">~/.gemini/antigravity/knowledge/ai-director</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="badge-live">
            <Database className="w-3.5 h-3.5" />
            <span>{docs.length} документов памяти подключено</span>
          </span>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/10 transition-all"
            title="Обновить документы"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Сетка редактора: Список файлов слева + Текстовый редактор справа */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Список файлов */}
        <div className="glass-panel p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 block">
            Файлы памяти
          </span>

          <div className="space-y-1">
            {docs.map(doc => {
              const isSelected = doc.filename === selectedFile;
              return (
                <button
                  key={doc.filename}
                  onClick={() => handleSelectDoc(doc.filename)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-director-blue/15 text-white border border-director-cyan/30 shadow-glass-subtle'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isSelected ? 'text-director-cyan' : 'text-slate-500'
                  }`} />
                  <div className="truncate">
                    <span className="font-semibold block truncate">{doc.filename}</span>
                    <span className="text-[10px] font-mono text-slate-500 truncate block">
                      {doc.title || doc.filename}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Область редактирования документа */}
        <div className="lg:col-span-3 glass-panel p-5 space-y-4 flex flex-col">
          {currentDoc ? (
            <>
              {/* Шапка документа и сохранение */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-mono">
                      {currentDoc.filename}
                    </h3>
                    {hasUnsavedChanges && (
                      <span className="badge-demo text-[10px] py-0 px-1.5 font-mono">НЕ СОХРАНЕНО</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                    <span>Размер: {(currentDoc.size / 1024).toFixed(1)} КБ</span>
                    <span>•</span>
                    <span>Изменён: {new Date(currentDoc.lastModified).toLocaleString()}</span>
                  </div>
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
                        ? 'bg-gradient-to-r from-director-blue to-blue-600 text-white hover:from-blue-500'
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
    </div>
  );
};
