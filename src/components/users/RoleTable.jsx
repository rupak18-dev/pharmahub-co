import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RoleTable = ({ roles = [], onClone, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="saas-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] font-sans">
            <tr>
              <th className="py-3 px-4">Role Key / Name</th>
              <th className="py-3 px-4">Role ID</th>
              <th className="py-3 px-4 font-sans">Description Summary</th>
              <th className="py-3 px-4 text-center font-sans">Assigned Employee Count</th>
              <th className="py-3 px-4 text-right font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {roles.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">{r.name}</td>
                <td className="py-3 px-4 font-mono text-slate-400">{r.id}</td>
                <td className="py-3 px-4 font-sans text-slate-500">{r.description}</td>
                <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">{r.userCount} user(s)</td>
                <td className="py-3 px-4 text-right font-sans">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/dashboard/roles/${r.id}`)}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all"
                      title="View Role Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(r)}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                      title="Edit Permissions"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(r)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                      title="Delete Role"
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
