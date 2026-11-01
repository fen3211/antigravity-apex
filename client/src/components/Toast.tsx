import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalShowToast: ((message: string, type?: ToastType, title?: string) => void) | null = null;

export const toast = {
  show: (message: string, type: ToastType = 'info', title?: string) => {
    if (globalShowToast) globalShowToast(message, type, title);
    else console.log(`[Toast ${type}]`, title ? `${title}: ${message}` : message);
  },
  success: (message: string, title?: string) => toast.show(message, 'success', title),
  error: (message: string, title?: string) => toast.show(message, 'error', title),
  warning: (message: string, title?: string) => toast.show(message, 'warning', title),
  info: (message: string, title?: string) => toast.show(message, 'info', title)
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((
    message: string, 
    type: ToastType = 'info', 
    title?: string, 
    duration = 4500
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastMessage = { id, type, title, message, duration };

    setToasts(prev => [...prev.slice(-4), newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => showToast(message, 'success', title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast(message, 'error', title), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast(message, 'warning', title), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast(message, 'info', title), [showToast]);

  useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      <div 
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none px-4 sm:px-0"
      >
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto bg-pure border rounded-md p-3.5 shadow-modal transition-all duration-200 flex items-start gap-3 border-hairline ${
                isSuccess
                  ? 'border-l-4 border-l-terminal-green'
                  : isError
                  ? 'border-l-4 border-l-danger-text'
                  : isWarning
                  ? 'border-l-4 border-l-warning-text'
                  : 'border-l-4 border-l-info-text'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-terminal-green" />}
                {isError && <AlertCircle className="w-4 h-4 text-danger-text" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-warning-text" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-info-text" />}
              </div>

              <div className="flex-1 min-w-0">
                {t.title && (
                  <h4 className="text-xs font-semibold tracking-tight text-obsidian mb-0.5">
                    {t.title}
                  </h4>
                )}
                <p className="text-xs text-charcoal leading-relaxed break-words">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Закрыть уведомление"
                className="shrink-0 text-graphite hover:text-obsidian p-1 rounded hover:bg-surface-subtle transition-colors focus-ring"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: toast.show,
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      removeToast: () => {}
    };
  }
  return ctx;
};
