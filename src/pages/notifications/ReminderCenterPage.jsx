import React from 'react';
import { Clock, Send } from 'lucide-react';
import { REMINDERS_LIST } from '../../constants/notificationData';

export default function ReminderCenterPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-emerald-500" />
          <span>Operational Reminder Center</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Schedule and dispatch automated reminders for supplier payables, customer Rx refills, and credit dues
        </p>
      </div>

      <div className="space-y-3">
        {REMINDERS_LIST.map((rem) => (
          <div key={rem.id} className="saas-card rounded-2xl p-5 space-y-2 border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono">
                {rem.type}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Due: {rem.date}</span>
            </div>

            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{rem.title}</h4>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => alert(`Dispatched notification reminder for ${rem.title}`)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Immediate Alert</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
