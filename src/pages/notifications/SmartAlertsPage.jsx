import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SMART_ALERTS } from '../../constants/notificationData';

export default function SmartAlertsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          <span>Smart System Risk & Audit Alerts</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time detection for negative stock counts, duplicate drug SKUs, price inflation, and high-value POS sales
        </p>
      </div>

      <div className="space-y-3">
        {SMART_ALERTS.map((alt) => (
          <div key={alt.id} className="saas-card rounded-2xl p-5 space-y-2 border-rose-500/30 bg-rose-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 font-mono">
                {alt.severity} Risk
              </span>
              <span className="text-[10px] font-mono text-slate-400">{alt.id}</span>
            </div>

            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{alt.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{alt.desc}</p>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                onClick={() => alert(`Resolved alert ${alt.id}`)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 shadow-md shadow-blue-600/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve Issue</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
