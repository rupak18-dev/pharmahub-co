import React, { useState } from 'react';
import { Search, Grid, ListCollapse } from 'lucide-react';
import { MODULES_LIST, PERMISSIONS_LIST } from '../../constants/userData';
import { PermissionCheckbox } from './PermissionCheckbox';

export const PermissionTable = ({ matrixState = {}, onToggle }) => {
  const [search, setSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredModules = MODULES_LIST.filter((mod) =>
    mod.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAllRow = (mod, checked) => {
    PERMISSIONS_LIST.forEach((perm) => {
      onToggle(mod, perm, checked);
    });
  };

  return (
    <div className="space-y-4">
      {/* Top tools bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 bg-white dark:bg-slate-900 py-2 z-10 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
          >
            <ListCollapse className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Collapse Matrix' : 'Expand Matrix'}</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs"
          />
        </div>
      </div>

      {isExpanded && (
        <div className="saas-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans sticky top-0">
                <tr>
                  <th className="py-3.5 px-4">Core Module</th>
                  {PERMISSIONS_LIST.map((perm) => (
                    <th key={perm} className="py-3.5 px-4 text-center">{perm}</th>
                  ))}
                  <th className="py-3.5 px-4 text-center">Row Bulk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredModules.map((mod) => (
                  <tr key={mod} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">{mod}</td>
                    {PERMISSIONS_LIST.map((perm) => {
                      const isChecked = !!matrixState[mod]?.[perm];
                      return (
                        <td key={perm} className="py-3 px-4 text-center">
                          <PermissionCheckbox
                            checked={isChecked}
                            onChange={() => onToggle(mod, perm)}
                          />
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSelectAllRow(mod, true)}
                          className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold text-[9px]"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectAllRow(mod, false)}
                          className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold text-[9px]"
                        >
                          None
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
