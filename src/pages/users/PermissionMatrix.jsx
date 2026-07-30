import React, { useState } from 'react';
import { ShieldCheck, Save } from 'lucide-react';
import { PermissionTable } from '../../components/users/PermissionTable';
import { MODULES_LIST, PERMISSIONS_LIST } from '../../constants/userData';

export default function PermissionMatrix() {
  const [matrix, setMatrix] = useState(() => {
    const initial = {};
    MODULES_LIST.forEach((mod) => {
      initial[mod] = {};
      PERMISSIONS_LIST.forEach((perm) => {
        initial[mod][perm] = perm === 'View';
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

  const handleSave = () => {
    alert('Security matrix overrides saved across modules!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Master Modules & Actions Permission Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure system permissions (*View, Create, Edit, Delete, Approve, Export, Print*) across modules
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Master Settings</span>
        </button>
      </div>

      <PermissionTable matrixState={matrix} onToggle={handleToggle} />
    </div>
  );
}
