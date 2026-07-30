import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldPlus, Save } from 'lucide-react';
import { PermissionTable } from '../../components/users/PermissionTable';
import { MODULES_LIST, PERMISSIONS_LIST } from '../../constants/userData';

export default function CreateRole() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [matrix, setMatrix] = useState(() => {
    const initial = {};
    MODULES_LIST.forEach((mod) => {
      initial[mod] = {};
      PERMISSIONS_LIST.forEach((perm) => {
        initial[mod][perm] = false;
      });
    });
    return initial;
  });

  const handleToggle = (mod, perm, forceVal) => {
    setMatrix((prev) => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [perm]: forceVal !== undefined ? forceVal : !prev[mod][perm],
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Security role "${name}" created and permissions matrix initialized!`);
    navigate('/dashboard/roles');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/roles')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Roles Directory</span>
        </button>
      </div>

      <div className="saas-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <ShieldPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Create Custom Security Role</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block font-semibold text-slate-500 mb-1">Role Unique Key Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AUDITOR"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono uppercase"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-500 mb-1">Functional Description *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Audit transactions logs and export tax reports"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">Configure Security Permission Matrix:</label>
            <PermissionTable matrixState={matrix} onToggle={handleToggle} />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/roles')}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Create Role & Matrix</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
