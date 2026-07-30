import React from 'react';

export const ThemePreview = ({ primaryColor, sidebarStyle, isDark, isCompact }) => {
  return (
    <div className={`p-4 rounded-xl border text-xs space-y-2 ${
      isDark ? 'bg-slate-950 text-white border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-200'
    } ${isCompact ? 'py-2 px-3' : 'p-4'}`}>
      <div className="flex gap-2">
        {/* Fake sidebar preview */}
        <div className={`w-8 h-12 rounded ${
          sidebarStyle === 'dark' ? 'bg-slate-900' : 'bg-white'
        } border shrink-0`} />
        {/* Fake page body preview */}
        <div className="flex-1 space-y-1">
          <div className="h-2 rounded w-12" style={{ backgroundColor: primaryColor }} />
          <div className="h-1.5 rounded w-16 bg-slate-300 dark:bg-slate-700" />
          <div className="h-1.5 rounded w-10 bg-slate-300 dark:bg-slate-700" />
        </div>
      </div>
      <p className="text-[10px] text-slate-400 text-center font-mono">Live Interface Mock Preview</p>
    </div>
  );
};
