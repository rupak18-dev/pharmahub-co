import React from 'react';
import { Laptop, Clock, Globe } from 'lucide-react';

export const SessionCard = ({ session }) => {
  return (
    <div className="saas-card rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-slate-200 dark:border-slate-800">
          <Laptop className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
            {session.user} on {session.device}
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{session.browser}</p>
        </div>
      </div>

      <div className="text-right space-y-1">
        <span className="text-[10px] font-mono text-slate-400 block">IP: {session.ip}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          session.current
            ? 'bg-emerald-500/10 text-emerald-500'
            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
        }`}>
          {session.logoutTime === 'Active Session' ? 'Active' : 'Logged Out'}
        </span>
      </div>
    </div>
  );
};
