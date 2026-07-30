import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserTable = ({ users = [], onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="saas-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-900/90 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 font-sans">
            <tr>
              <th className="py-3.5 px-4">Profile</th>
              <th className="py-3.5 px-4 font-mono">Employee ID</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4 font-mono">Phone</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Branch</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 font-mono">Last Login</th>
              <th className="py-3.5 px-4 text-right font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-8 h-8 rounded-lg object-cover border"
                    />
                    <button
                      onClick={() => navigate(`/dashboard/users/${u.id}`)}
                      className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left text-xs"
                    >
                      {u.name}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">{u.id}</td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{u.email}</td>
                <td className="py-3 px-4 font-mono text-slate-400">{u.phone}</td>
                <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">{u.role}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{u.branch}</td>
                <td className="py-3 px-4 text-slate-500">{u.department}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {u.status}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">{u.lastLogin}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 font-sans">
                    <button
                      onClick={() => navigate(`/dashboard/users/${u.id}`)}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all"
                      title="View Profile Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(u)}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                      title="Edit Profile"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(u)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                      title="Delete User"
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
