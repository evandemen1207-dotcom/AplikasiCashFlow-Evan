import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  X,
  BellRing,
} from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  badge?: string;
  duration?: number; // ms, default 5000
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const duration = toast.duration ?? 5000;
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  const getStyleTokens = () => {
    switch (toast.type) {
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          container:
            'border-amber-300/80 dark:border-amber-700/60 bg-white/95 dark:bg-slate-900/95 shadow-amber-500/10',
          title: 'text-amber-900 dark:text-amber-200',
          progressBar: 'bg-amber-500',
          badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300/60 dark:border-amber-800',
        };
      case 'error':
        return {
          icon: <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />,
          container:
            'border-rose-300/80 dark:border-rose-700/60 bg-white/95 dark:bg-slate-900/95 shadow-rose-500/10',
          title: 'text-rose-900 dark:text-rose-200',
          progressBar: 'bg-rose-500',
          badge: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300/60 dark:border-rose-800',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          container:
            'border-emerald-300/80 dark:border-emerald-700/60 bg-white/95 dark:bg-slate-900/95 shadow-emerald-500/10',
          title: 'text-emerald-900 dark:text-emerald-200',
          progressBar: 'bg-emerald-500',
          badge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-800',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
          container:
            'border-indigo-300/80 dark:border-indigo-700/60 bg-white/95 dark:bg-slate-900/95 shadow-indigo-500/10',
          title: 'text-indigo-900 dark:text-indigo-200',
          progressBar: 'bg-indigo-500',
          badge: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300/60 dark:border-indigo-800',
        };
    }
  };

  const style = getStyleTokens();

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all duration-200 animate-in slide-in-from-top-4 fade-in ${style.container}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{style.icon}</div>

        <div className="flex-1 pr-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`text-xs sm:text-sm font-black leading-tight ${style.title}`}>
              {toast.title}
            </h4>
            {toast.badge && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tabular-nums ${style.badge}`}
              >
                {toast.badge}
              </span>
            )}
          </div>

          {toast.message && (
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed font-medium">
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Tutup notifikasi"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown Progress Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full transition-all duration-75 ease-linear ${style.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
