import React from 'react';

export const ToggleSwitch = ({ label, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 font-sans">
      <div>
        <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{label}</h5>
      </div>
      <button
        type="button"
        onClick={() => onChange && onChange(!checked)}
        className={`w-10 h-5 rounded-full p-0.5 transition-all ${
          checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
};
