import React from 'react';

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="py-10 px-4 text-center flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
      {Icon && (
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
