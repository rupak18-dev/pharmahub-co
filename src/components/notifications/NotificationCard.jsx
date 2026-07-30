import React from 'react';
import { Bell, ArrowRight, CheckCircle2, ShieldAlert, Sparkles, ShoppingBag, Package } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

export const NotificationCard = ({ notification, onAction }) => {
  const isUnread = notification.status === 'Unread';

  return (
    <div
      className={`saas-card rounded-2xl p-5 space-y-3 transition-all ${
        isUnread
          ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/30'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                {notification.title}
              </h4>
              {isUnread && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {notification.description}
            </p>
          </div>
        </div>

        <PriorityBadge priority={notification.priority} />
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans font-semibold">
            {notification.category}
          </span>
          <span>•</span>
          <span>{notification.timestamp}</span>
        </div>

        {notification.actions && notification.actions.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {notification.actions.map((act, idx) => (
              <button
                key={idx}
                onClick={() => onAction && onAction(act, notification)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  idx === 0
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
