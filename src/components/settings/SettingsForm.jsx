import React from 'react';
import { Save } from 'lucide-react';

export const SettingsForm = ({ onSubmit, children }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs font-sans">
      {children}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
};
