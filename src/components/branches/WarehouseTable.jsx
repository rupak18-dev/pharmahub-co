import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WarehouseTable = ({ warehouses = [], onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="saas-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-900/90 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-3.5 px-4">Warehouse Name</th>
              <th className="py-3.5 px-4">Warehouse Code</th>
              <th className="py-3.5 px-4 font-mono">Manager</th>
              <th className="py-3.5 px-4 font-mono text-center">Total Inventory</th>
              <th className="py-3.5 px-4 text-center">Capacity</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
            {warehouses.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="py-3.5 px-4">
                  <button
                    onClick={() => navigate(`/dashboard/warehouses/${w.id}`)}
                    className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left block text-xs"
                  >
                    {w.name}
                  </button>
                </td>
                <td className="py-3.5 px-4 font-mono">{w.code}</td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                  {w.manager}
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                  {w.currentStock.toLocaleString()} units
                </td>
                <td className="py-3.5 px-4 text-center font-mono">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    w.capacity > 80
                      ? 'bg-rose-500/10 text-rose-500'
                      : w.capacity > 60
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {w.capacity}% Used
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/dashboard/warehouses/${w.id}`)}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(w)}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                      title="Edit Warehouse"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(w)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                      title="Delete Warehouse"
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
