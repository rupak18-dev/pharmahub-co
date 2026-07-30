import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BranchTable = ({ branches = [], onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="saas-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-900/90 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-3.5 px-4">Branch</th>
              <th className="py-3.5 px-4">Manager</th>
              <th className="py-3.5 px-4 font-mono">Phone</th>
              <th className="py-3.5 px-4">Address</th>
              <th className="py-3.5 px-4 font-sans text-right">Today's Sales</th>
              <th className="py-3.5 px-4 font-sans text-right">Stock Value</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
            {branches.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="py-3.5 px-4">
                  <button
                    onClick={() => navigate(`/dashboard/branches/${b.id}`)}
                    className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left block text-xs"
                  >
                    {b.name}
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{b.code}</span>
                </td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                  {b.manager}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-400">
                  {b.phone}
                </td>
                <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                  {b.address}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                  ₹{b.todaysSales.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                  ₹{b.currentStockValue.toLocaleString()}
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {b.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/dashboard/branches/${b.id}`)}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(b)}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                      title="Edit Branch"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(b)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
