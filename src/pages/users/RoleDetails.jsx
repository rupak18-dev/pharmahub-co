import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Save } from 'lucide-react';
import { INITIAL_ROLES, MODULES_LIST, PERMISSIONS_LIST } from '../../constants/userData';
import { PermissionTable } from '../../components/users/PermissionTable';

export default function RoleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = INITIAL_ROLES.find((r) => r.id === id) || INITIAL_ROLES[0];

  // Initial Permission matrix state
  const [matrix, setMatrix] = useState(() => {
    const initial = {};
    MODULES_LIST.forEach((mod) => {
      initial[mod] = {};
      PERMISSIONS_LIST.forEach((perm) => {
        // Mock default permissions
        initial[mod][perm] = role.name === 'OWNER' ? true : perm === 'View';
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
    alert(`Successfully updated permissions matrix for security role: ${role.name}!`);
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

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="saas-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{role.name} Permissions</h1>
            <p className="text-xs text-slate-400 leading-tight mt-0.5">{role.description}</p>
          </div>
        </div>
      </div>

      <PermissionTable matrixState={matrix} onToggle={handleToggle} />
    </div>
  );
}
