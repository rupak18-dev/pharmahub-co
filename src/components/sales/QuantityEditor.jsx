import React from 'react';
import { Plus, Minus } from 'lucide-react';

export const QuantityEditor = ({ value, onChange, min = 1, max = 999 }) => {
  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-6 h-6 flex items-center justify-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
      >
        <Minus className="w-3 h-3" />
      </button>

      <input
        type="number"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val)) {
            onChange(Math.min(max, Math.max(min, val)));
          }
        }}
        className="w-10 text-center bg-transparent border-none text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
      />

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-6 h-6 flex items-center justify-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};
