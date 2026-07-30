import React from 'react';

export const PriorityBadge = ({ priority }) => {
  const styles = {
    Critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    High: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Low: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
        styles[priority] || styles.Low
      }`}
    >
      {priority}
    </span>
  );
};
