import React from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

export const NotificationCard = ({
  type = 'info',
  title,
  message,
  time,
  onDismiss,
}) => {
  const styles = {
    info: {
      border: 'border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400',
      icon: Info,
    },
    warning: {
      border: 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400',
      icon: AlertTriangle,
    },
    danger: {
      border: 'border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400',
      icon: XCircle,
    },
    success: {
      border: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2,
    },
  };

  const current = styles[type] || styles.info;
  const Icon = current.icon;

  return (
    <div className={`p-3.5 rounded-xl border ${current.border} flex items-start justify-between gap-3`}>
      <div className="flex items-start gap-2.5">
        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{title}</h4>
            {time && <span className="text-[10px] text-slate-400 font-mono">{time}</span>}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};
