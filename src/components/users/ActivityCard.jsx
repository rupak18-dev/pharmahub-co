import React from 'react';
import { User, Activity, Clock } from 'lucide-react';

export const ActivityCard = ({ log }) => {
  return (
    <div className="saas-card rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-slate-200 dark:border-slate-800">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
            {log.action} Action by {log.user}
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>
        </div>
      </div>

      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-blue-600" />
        <span>{log.time}</span>
      </span>
    </div>
  );
};
