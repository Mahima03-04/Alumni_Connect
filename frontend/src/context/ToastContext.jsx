import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-royal-200 bg-royal-50 text-royal-900',
};

const ICON_COLORS = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-royal-600',
};

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info', options = {}) => {
      const id = ++counter;
      const toast = { id, message, type, title: options.title };
      setToasts((current) => [...current, toast]);
      const duration = options.duration ?? 4500;
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      showToast,
      success: (message, options) => showToast(message, 'success', options),
      error: (message, options) => showToast(message, 'error', options),
      warning: (message, options) => showToast(message, 'warning', options),
      info: (message, options) => showToast(message, 'info', options),
      dismiss,
    }),
    [showToast, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type] || Info;
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5 shadow-card-hover animate-slide-in ${
                TOAST_STYLES[toast.type] || TOAST_STYLES.info
              }`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ICON_COLORS[toast.type] || ICON_COLORS.info}`} aria-hidden="true" />
              <div className="min-w-0 flex-1 text-sm">
                {toast.title ? <p className="font-semibold">{toast.title}</p> : null}
                <p className="break-words">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-1 text-navy-400 transition hover:bg-white/60 hover:text-navy-700"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export default ToastContext;
