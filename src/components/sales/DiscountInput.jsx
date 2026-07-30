import React from 'react';

export const DiscountInput = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          onChange(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
        }}
        className="w-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-1.5 text-center text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
      />
      <span className="text-[11px] font-bold text-slate-400">%</span>
    </div>
  );
};
