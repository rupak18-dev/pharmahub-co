import React from 'react';
import { Activity, User } from 'lucide-react';

export const TimelineCard = ({ activity }) => {
  return (
    <div className="saas-card rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
            {activity.type}
          </span>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{activity.title}</h4>
        </div>
        <span className="text-[10px] font-mono text-slate-400">{activity.time}</span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">{activity.detail}</p>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
        <User className="w-3 h-3 text-blue-600" />
        <span>By: {activity.user}</span>
      </div>
    </div>
  );
};
