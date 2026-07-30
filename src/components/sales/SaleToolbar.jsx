import React from 'react';
import { Keyboard } from 'lucide-react';

export const SaleToolbar = () => {
  const shortcuts = [
    { key: 'F2', label: 'Search Drug' },
    { key: 'F4', label: 'Customer' },
    { key: 'F8', label: 'Hold Bill' },
    { key: 'F9', label: 'Payment' },
    { key: 'Enter', label: 'Complete' },
    { key: 'Esc', label: 'Cancel' },
  ];

  return (
    <div className="saas-card rounded-2xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto bg-slate-50 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 shrink-0">
        <Keyboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-[10px] font-bold uppercase text-slate-400">Shortcuts:</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {shortcuts.map((sc) => (
          <div
            key={sc.key}
            className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] whitespace-nowrap"
          >
            <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1 rounded">
              {sc.key}
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">{sc.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
